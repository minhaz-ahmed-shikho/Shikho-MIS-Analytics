const { getAllowedDomain, readSession } = require("./_auth");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed." });
  }

  const session = readSession(req);
  return res.status(200).json({
    ok: true,
    authenticated: Boolean(session),
    email: session ? session.email : null,
    allowedDomain: getAllowedDomain()
  });
};
