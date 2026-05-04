const { getAllowedDomain, setSessionCookie, validateLogin } = require("./_auth");

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed." });
  }

  try {
    const body = await readJson(req);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const result = validateLogin(email, password);

    if (!result.ok) {
      return res.status(result.status).json({
        ok: false,
        error: result.error,
        allowedDomain: getAllowedDomain()
      });
    }

    setSessionCookie(res, email);
    return res.status(200).json({ ok: true, email, allowedDomain: getAllowedDomain() });
  } catch {
    return res.status(400).json({ ok: false, error: "Invalid login request." });
  }
};
