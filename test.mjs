// Smoke test for matching + billing. Run `npm run dev`, then `npm test`.
// Uses the fake "dev:<id>:<gender>:<credits>[:<forced>]" logins from .dev.vars.
import assert from "node:assert/strict";

const URL = process.argv[2] ?? "ws://localhost:8787/ws";
const run = Date.now(); // unique ids per run (dev profiles live in memory)

async function client(token) {
  const ws = new WebSocket(URL);
  const inbox = [];
  const waiters = [];
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (process.env.DEBUG) console.log(token?.split(":")[1], JSON.stringify(msg));
    const w = waiters.shift();
    w ? w(msg) : inbox.push(msg);
  };
  await new Promise((res, rej) => ((ws.onopen = res), (ws.onerror = rej)));
  const c = {
    send: (msg) => ws.send(JSON.stringify(msg)),
    recv: () =>
      inbox.length
        ? Promise.resolve(inbox.shift())
        : new Promise((res, rej) => {
            waiters.push(res);
            setTimeout(() => rej(new Error("timed out waiting for a message")), 3000);
          }),
    close: () => ws.close(),
  };
  if (token) {
    c.send({ type: "auth", token });
    assert.equal((await c.recv()).type, "ready");
  }
  return c;
}
const id = (name) => `${name}${run}`;

// A paying boy looking for girls waits.
const a = await client(`dev:${id("a")}:male:30`);
a.send({ type: "find", mode: "video", filter: "female" });
assert.deepEqual((await a.recv()).filter, "female");

// A random boy must not be matched with him.
const b = await client(`dev:${id("b")}:male:0`);
b.send({ type: "find", mode: "video", filter: "any" });
assert.equal((await b.recv()).type, "waiting");

// A girl on Random gets matched with the paying boy, who is charged 20 credits.
const c = await client(`dev:${id("c")}:female:0`);
c.send({ type: "find", mode: "video", filter: "any" });
const cm = await c.recv();
assert.equal(cm.type, "matched");
assert.equal(cm.stranger.gender, "male");
const am = await a.recv();
assert.equal(am.type, "matched");
assert.equal(am.stranger.gender, "female");
assert.deepEqual(await a.recv(), { type: "credits", credits: 10 });

// Messages and signaling are relayed.
a.send({ type: "chat", text: "hello" });
assert.deepEqual(await c.recv(), { type: "chat", text: "hello" });
c.send({ type: "signal", data: { sdp: { type: "offer", sdp: "x" } } });
assert.deepEqual((await a.recv()).data, { sdp: { type: "offer", sdp: "x" } });

// Too few credits for a filter: told so, and switched to Random (matches b).
const d = await client(`dev:${id("d")}:male:10`);
d.send({ type: "find", mode: "video", filter: "female" });
assert.equal((await d.recv()).type, "out-of-credits");
assert.equal((await d.recv()).type, "matched");
assert.equal((await b.recv()).type, "matched");

// Next: partner is told, and a (now 10 credits) falls back to Random.
a.send({ type: "find", mode: "video", filter: "female" });
assert.equal((await c.recv()).type, "peer-left");
assert.equal((await a.recv()).type, "out-of-credits");
assert.equal((await a.recv()).filter, "any");

// Admin-forced filter overrides the user's choice.
const f = await client(`dev:${id("f")}:male:100:female`);
f.send({ type: "find", mode: "text", filter: "any" });
assert.equal((await f.recv()).filter, "female");

// Text and video users are never mixed.
const g = await client(`dev:${id("g")}:female:0`);
g.send({ type: "find", mode: "text", filter: "any" });
assert.equal((await g.recv()).type, "matched");
assert.equal((await f.recv()).type, "matched");

// Bad login is rejected; unauthenticated messages are ignored.
const x = await client();
x.send({ type: "find", mode: "video", filter: "any" });
x.send({ type: "auth", token: "nope" });
assert.equal((await x.recv()).type, "auth-failed");

for (const s of [a, b, c, d, f, g]) s.close();
console.log("ok");

