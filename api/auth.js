// Vercel serverless function — starts the GitHub OAuth flow for the CMS at /admin.
// Requires env vars GITHUB_OAUTH_CLIENT_ID / GITHUB_OAUTH_CLIENT_SECRET
// (Vercel dashboard → Project → Settings → Environment Variables).
const crypto = require("crypto");

module.exports = (req, res) => {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  if (!clientId) {
    res.status(500).send("Missing GITHUB_OAUTH_CLIENT_ID environment variable.");
    return;
  }

  const protocol = req.headers["x-forwarded-proto"] || "https";
  const redirectUri = `${protocol}://${req.headers.host}/api/callback`;
  const state = crypto.randomBytes(16).toString("hex");

  res.setHeader(
    "Set-Cookie",
    `oauth_state=${state}; HttpOnly; Secure; Path=/; Max-Age=600; SameSite=Lax`
  );

  const url =
    "https://github.com/login/oauth/authorize" +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent("repo,user")}` +
    `&state=${state}`;

  res.writeHead(302, { Location: url });
  res.end();
};
