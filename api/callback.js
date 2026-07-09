// Vercel serverless function — completes the GitHub OAuth flow for the CMS,
// exchanging the code for a token and handing it back to the Decap CMS popup
// via postMessage (the same protocol Netlify's OAuth provider uses).
module.exports = async (req, res) => {
  const { code, state } = req.query;
  const cookies = parseCookies(req.headers.cookie || "");

  if (!state || state !== cookies.oauth_state) {
    res.status(400).send("Invalid or missing OAuth state.");
    return;
  }

  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    res.status(500).send("Missing GITHUB_OAUTH_CLIENT_ID/GITHUB_OAUTH_CLIENT_SECRET environment variables.");
    return;
  }

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });
    const data = await tokenRes.json();

    if (data.error || !data.access_token) {
      res.status(400).send("GitHub OAuth error: " + (data.error_description || data.error || "unknown"));
      return;
    }

    const message = `authorization:github:success:${JSON.stringify({
      token: data.access_token,
      provider: "github",
    })}`;

    res.setHeader("Content-Type", "text/html");
    res.status(200).send(`<!doctype html><html><body><script>
(function() {
  function receiveMessage(e) {
    window.opener.postMessage(${JSON.stringify(message)}, e.origin);
    window.removeEventListener("message", receiveMessage, false);
  }
  window.addEventListener("message", receiveMessage, false);
  window.opener.postMessage("authorizing:github", "*");
})();
</script></body></html>`);
  } catch (err) {
    res.status(500).send("OAuth callback error: " + err.message);
  }
};

function parseCookies(header) {
  var out = {};
  header.split(";").forEach(function (pair) {
    var idx = pair.indexOf("=");
    if (idx > -1) {
      out[pair.slice(0, idx).trim()] = decodeURIComponent(pair.slice(idx + 1).trim());
    }
  });
  return out;
}
