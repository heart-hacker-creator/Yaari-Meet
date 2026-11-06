// Stores the private push-notification key (from .vapid.json) as a Cloudflare secret
// without printing it. Run once: node scripts/set-push-secret.mjs
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const { private: key } = JSON.parse(readFileSync(new URL("../.vapid.json", import.meta.url), "utf8"));
const res = spawnSync("npx", ["wrangler", "secret", "put", "VAPID_PRIVATE_JWK"], {
  input: key,
  stdio: ["pipe", "inherit", "inherit"],
  shell: true,
});
process.exit(res.status ?? 1);
