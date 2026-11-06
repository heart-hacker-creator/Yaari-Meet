// Generates the key pair for admin push notifications.
// Prints the public key (goes in wrangler.jsonc + public/config.js)
// and the private JWK (goes in the VAPID_PRIVATE_JWK secret).
const { publicKey, privateKey } = await crypto.subtle.generateKey(
  { name: "ECDSA", namedCurve: "P-256" },
  true,
  ["sign", "verify"],
);
const raw = Buffer.from(await crypto.subtle.exportKey("raw", publicKey)).toString("base64url");
const { kty, crv, x, y, d } = await crypto.subtle.exportKey("jwk", privateKey);
console.log(JSON.stringify({ public: raw, private: JSON.stringify({ kty, crv, x, y, d }) }));
