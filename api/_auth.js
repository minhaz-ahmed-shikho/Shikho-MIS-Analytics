const crypto = require("crypto");

const COOKIE_NAME = "shikho_fin_gov_session";
const SESSION_DAYS = 7;

function getAllowedDomain() {
  return (process.env.DASHBOARD_ALLOWED_DOMAIN || "shikho.com").toLowerCase();
}

function getPassword() {
  return process.env.DASHBOARD_PASSWORD || "FinGovDashboard2026";
}

function getSecret() {
  return process.env.DASHBOARD_AUTH_SECRET || "local-development-secret-change-in-vercel";
}

function base64Url(input) {
  return Buffer.from(input).toString("base64url");
}

function sign(payload) {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function parseCookies(req) {
  const raw = req.headers.cookie || "";
  return Object.fromEntries(raw.split(";").map(part => {
    const index = part.indexOf("=");
    if (index < 0) return null;
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
  }).filter(Boolean));
}

function validEmail(email) {
  const value = String(email || "").trim().toLowerCase();
  const domain = getAllowedDomain();
  return value.endsWith(`@${domain}`) && value.length > domain.length + 1;
}

function constantEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function createSession(email) {
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = base64Url(JSON.stringify({
    email: String(email || "").trim().toLowerCase(),
    exp: expiresAt
  }));
  return `${payload}.${sign(payload)}`;
}

function readSession(req) {
  const token = parseCookies(req)[COOKIE_NAME];
  if (!token || !token.includes(".")) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature || !constantEqual(signature, sign(payload))) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data.email || !data.exp || Date.now() > data.exp) return null;
    if (!validEmail(data.email)) return null;
    return data;
  } catch {
    return null;
  }
}

function cookieParts(value, maxAge) {
  const secure = process.env.VERCEL ? "; Secure" : "";
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function setSessionCookie(res, email) {
  res.setHeader("Set-Cookie", cookieParts(createSession(email), SESSION_DAYS * 24 * 60 * 60));
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", cookieParts("", 0));
}

function requireSession(req, res) {
  const session = readSession(req);
  if (session) return session;
  res.status(401).json({ ok: false, error: "Authentication required." });
  return null;
}

function validateLogin(email, password) {
  if (!validEmail(email)) {
    return { ok: false, status: 400, error: `Use a valid @${getAllowedDomain()} email address.` };
  }
  if (!constantEqual(password, getPassword())) {
    return { ok: false, status: 401, error: "Incorrect password." };
  }
  return { ok: true };
}

module.exports = {
  clearSessionCookie,
  getAllowedDomain,
  readSession,
  requireSession,
  setSessionCookie,
  validateLogin
};
