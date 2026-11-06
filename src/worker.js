import { DurableObject } from "cloudflare:workers";

const MINUTE_COST = 20;
const MODES = new Set(["video", "text"]);
const FILTERS = new Set(["any", "male", "female"]);
const REASONS = new Set(["abuse", "wrong_gender"]);

// ---------- Database access ----------

function supabase(env) {
  const key = env.SUPABASE_SECRET_KEY;
  const auth = { apikey: key };
  // New "sb_secret_" keys go in apikey only; legacy service_role JWTs also as Bearer.
  if (!key.startsWith("sb_")) auth.Authorization = `Bearer ${key}`;

  const rest = async (path, init = {}) => {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
      ...init,
      headers: { ...auth, "Content-Type": "application/json", ...init.headers },
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`${res.status} ${text}`);
    return text ? JSON.parse(text) : null;
  };

  return {
    async user(token) {
      if (!token) return null;
      const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
        headers: { apikey: key, Authorization: `Bearer ${token}` },
      });
      return res.ok ? (await res.json()).id : null;
    },
    async profile(id) {
      const rows = await rest(`profiles?id=eq.${id}&select=name,gender,credits,forced_filter,verified,banned,is_admin`);
      return rows[0] ?? null;
    },
    spend: (id, amount) =>
      rest("rpc/spend_credits", { method: "POST", body: JSON.stringify({ p_user: id, p_amount: amount }) }),
    insert: (table, row) =>
      rest(table, { method: "POST", body: JSON.stringify(row), headers: { Prefer: "return=minimal" } }),
    pendingPayments: async (id) =>
      (await rest(`payment_requests?user_id=eq.${id}&status=eq.pending&select=id`)).length,
    adminEndpoints: async () =>
      (await rest("admin_push_subscriptions?select=endpoint")).map((r) => r.endpoint),
    deleteEndpoint: (endpoint) =>
      rest(`admin_push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`, { method: "DELETE" }),
  };
}

// Local development only (DEV_AUTH=1 in .dev.vars): tokens look like
// "dev:<id>:<gender>:<credits>[:<forced filter>]" and nothing is stored.
function fakeDb() {
  const profiles = new Map();
  return {
    async user(token) {
      const [prefix, id, gender, credits, forced] = String(token).split(":");
      if (prefix !== "dev") return null;
      if (!profiles.has(id)) {
        profiles.set(id, { name: id, gender, credits: Number(credits), forced_filter: forced || null, verified: false, banned: false });
      }
      return id;
    },
    async profile(id) {
      return { ...profiles.get(id) };
    },
    async spend(id, amount) {
      const p = profiles.get(id);
      if (p.credits < amount) return null;
      return (p.credits -= amount);
    },
    async insert() {},
    async pendingPayments() {
      return 0;
    },
    async adminEndpoints() {
      return [];
    },
    async deleteEndpoint() {},
  };
}

const makeDb = (env) => (env.DEV_AUTH === "1" ? fakeDb() : supabase(env));

// ---------- Matchmaking + billing ----------

// One Durable Object holds every visitor's WebSocket, pairs strangers by gender
// filter, relays chat + WebRTC signaling, and charges paid filters per minute.
// All per-socket state lives in the socket attachment so the object can hibernate.
// ponytail: one lobby scans all sockets per "find"; shard it past a few thousand concurrent users.
export class Lobby extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.db = makeDb(env);
  }

  async fetch(request) {
    if (new URL(request.url).pathname === "/stats") {
      return Response.json({ online: this.ctx.getWebSockets().length });
    }
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }
    const [client, server] = Object.values(new WebSocketPair());
    const sid = crypto.randomUUID();
    this.ctx.acceptWebSocket(server, [sid]);
    server.serializeAttachment({ sid, uid: null });
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, raw) {
    if (typeof raw !== "string" || raw.length > 65536) return;
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    const me = ws.deserializeAttachment();

    if (!me.uid) {
      if (msg.type === "auth") await this.auth(ws, msg.token);
      return;
    }
    switch (msg.type) {
      case "find":
        if (MODES.has(msg.mode) && FILTERS.has(msg.filter)) await this.find(ws, msg.mode, msg.filter);
        break;
      case "leave":
        this.unpair(ws);
        break;
      case "signal":
        this.toPeer(me, { type: "signal", data: msg.data });
        break;
      case "chat":
        if (typeof msg.text === "string" && msg.text.trim()) {
          this.toPeer(me, { type: "chat", text: msg.text.slice(0, 2000) });
        }
        break;
      case "report":
        if (REASONS.has(msg.reason) && me.peerUid) {
          await this.db
            .insert("reports", { reporter: me.uid, reported: me.peerUid, reason: msg.reason })
            .catch(console.error);
        }
        break;
    }
  }

  webSocketClose(ws) {
    this.unpair(ws);
  }

  webSocketError(ws) {
    this.unpair(ws);
  }

  async auth(ws, token) {
    const uid = await this.db.user(typeof token === "string" ? token : "").catch(() => null);
    if (!uid) return kick(ws, "auth-failed");
    ws.serializeAttachment({ ...ws.deserializeAttachment(), uid });
    send(ws, { type: "ready" });
  }

  async find(ws, mode, requested) {
    this.unpair(ws);
    const profile = await this.db.profile(ws.deserializeAttachment().uid).catch(() => null);
    if (!profile) return send(ws, { type: "error", text: "Could not load your profile. Please try again." });
    if (profile.banned) return kick(ws, "banned");
    if (!profile.gender) return send(ws, { type: "error", text: "Please finish your profile first." });

    let filter = profile.forced_filter ?? requested;
    if (filter !== "any" && profile.credits < MINUTE_COST) {
      send(ws, { type: "out-of-credits", credits: profile.credits });
      filter = "any";
    }

    // From here on everything is synchronous, so two people can't grab the same stranger.
    this.unpair(ws);
    const me = {
      ...ws.deserializeAttachment(),
      mode,
      filter,
      name: profile.name,
      gender: profile.gender,
      verified: profile.verified,
    };
    // Best candidate: people paying for a filter go first (they're waiting for
    // scarce matches), and paid filters get verified people before unverified ones.
    let match = null;
    let best = -1;
    for (const other of this.ctx.getWebSockets()) {
      if (other === ws || other.readyState !== WebSocket.OPEN) continue;
      const them = other.deserializeAttachment();
      if (!them.waiting || them.uid === me.uid || them.mode !== mode) continue;
      if (!fits(me, them) || !fits(them, me)) continue;
      const score = (them.filter !== "any" ? 2 : 0) + (me.filter !== "any" && them.verified ? 1 : 0);
      if (score > best) {
        match = other;
        best = score;
      }
    }

    if (!match) {
      ws.serializeAttachment({ ...me, waiting: true });
      return send(ws, { type: "waiting", filter });
    }

    const them = match.deserializeAttachment();
    ws.serializeAttachment({ ...me, peer: them.sid, peerUid: them.uid });
    match.serializeAttachment({ ...them, waiting: false, peer: me.sid, peerUid: me.uid });
    send(match, { type: "matched", initiator: false, filter: them.filter, stranger: card(me) });
    send(ws, { type: "matched", initiator: true, filter, stranger: card(them) });
    await Promise.all([ws, match].filter((s) => s.deserializeAttachment().filter !== "any").map((s) => this.charge(s)));
  }

  // Charges one minute. Out of credits ends the chat and queues the user on Random.
  async charge(ws) {
    const { uid, peer } = ws.deserializeAttachment();
    const credits = await this.db.spend(uid, MINUTE_COST).catch((e) => (console.error(e), undefined));
    const now = ws.deserializeAttachment();
    if (now.peer !== peer || ws.readyState !== WebSocket.OPEN) return;

    if (credits === undefined) {
      // Database hiccup: don't punish the user, try again shortly.
      ws.serializeAttachment({ ...now, nextCharge: Date.now() + 15000 });
    } else if (credits === null) {
      return this.find(ws, now.mode, now.filter);
    } else {
      ws.serializeAttachment({ ...now, nextCharge: Date.now() + 60000 });
      send(ws, { type: "credits", credits });
    }
    await this.scheduleAlarm();
  }

  async alarm() {
    const now = Date.now();
    const due = this.ctx.getWebSockets().filter((s) => {
      const a = s.deserializeAttachment();
      return a.peer && a.nextCharge && a.nextCharge <= now;
    });
    await Promise.all(due.map((s) => this.charge(s)));
    await this.scheduleAlarm();
  }

  async scheduleAlarm() {
    const times = this.ctx
      .getWebSockets()
      .map((s) => s.deserializeAttachment())
      .filter((a) => a.peer && a.nextCharge)
      .map((a) => a.nextCharge);
    if (times.length) await this.ctx.storage.setAlarm(Math.min(...times));
  }

  unpair(ws) {
    const me = ws.deserializeAttachment();
    const peer = this.socket(me.peer);
    if (peer) {
      peer.serializeAttachment({ ...peer.deserializeAttachment(), peer: null, nextCharge: null });
      send(peer, { type: "peer-left" });
    }
    try {
      ws.serializeAttachment({ ...me, peer: null, waiting: false, nextCharge: null });
    } catch {}
  }

  socket(sid) {
    return sid ? this.ctx.getWebSockets(sid)[0] : undefined;
  }

  toPeer(me, msg) {
    const peer = this.socket(me.peer);
    if (peer) send(peer, msg);
  }
}

const fits = (a, b) => a.filter === "any" || a.filter === b.gender;
const card = (a) => ({ name: a.name, gender: a.gender, verified: a.verified });

function send(ws, msg) {
  try {
    ws.send(JSON.stringify(msg));
  } catch {}
}

function kick(ws, reason) {
  send(ws, { type: reason });
  try {
    ws.close(4000, reason);
  } catch {}
}

// ---------- HTTP API ----------

const json = (body, status = 200) => Response.json(body, { status });

async function submit(request, env, ctx, kind) {
  const db = makeDb(env);
  const token = (request.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
  const uid = await db.user(token).catch(() => null);
  if (!uid) return json({ error: "Please sign in again." }, 401);
  const body = await request.json().catch(() => ({}));

  try {
    if (kind === "payment") {
      const amount = Number(body.amount);
      const utr = String(body.utr ?? "").trim();
      if (!Number.isInteger(amount) || amount < 1 || amount > 100000) return json({ error: "Invalid amount." }, 400);
      if (!/^[0-9A-Za-z]{6,30}$/.test(utr)) return json({ error: "Enter the UPI transaction ID (UTR) from your payment app." }, 400);
      if ((await db.pendingPayments(uid)) >= 3) return json({ error: "You already have 3 payments waiting. Please wait for them to be confirmed." }, 429);
      await db.insert("payment_requests", { user_id: uid, amount, utr });
    } else {
      const path = String(body.path ?? "");
      if (!path.startsWith(`${uid}/`)) return json({ error: "Invalid upload." }, 400);
      await db.insert("verifications", { user_id: uid, video_path: path, gesture: String(body.gesture ?? "").slice(0, 80) });
    }
  } catch (e) {
    if (String(e).includes("23505")) return json({ error: "This transaction ID was already submitted." }, 409);
    console.error(e);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }

  ctx.waitUntil(notifyAdmins(env, db).catch(console.error));
  return json({ ok: true });
}

// Live user count, for the admin panel only.
async function stats(request, env, lobby) {
  const db = makeDb(env);
  const token = (request.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
  const uid = await db.user(token).catch(() => null);
  const profile = uid && (await db.profile(uid).catch(() => null));
  if (!profile?.is_admin) return json({ error: "Not allowed" }, 403);
  return lobby.fetch(new Request("https://lobby/stats"));
}

// Web Push without a payload: only a VAPID signature, no encryption needed.
// The admin app's service worker shows a fixed "new request" notification.
async function notifyAdmins(env, db) {
  if (!env.VAPID_PRIVATE_JWK) return;
  for (const endpoint of await db.adminEndpoints()) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { TTL: "86400", Urgency: "high", Authorization: await vapid(env, endpoint) },
    });
    if (res.status === 404 || res.status === 410) await db.deleteEndpoint(endpoint);
  }
}

async function vapid(env, endpoint) {
  const key = await crypto.subtle.importKey(
    "jwk",
    JSON.parse(env.VAPID_PRIVATE_JWK),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const b64 = (bytes) =>
    btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const part = (obj) => b64(new TextEncoder().encode(JSON.stringify(obj)));
  const unsigned = `${part({ typ: "JWT", alg: "ES256" })}.${part({
    aud: new URL(endpoint).origin,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: "mailto:admin@yaarimeet.com",
  })}`;
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(unsigned));
  return `vapid t=${unsigned}.${b64(sig)}, k=${env.VAPID_PUBLIC_KEY}`;
}

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    const lobby = env.LOBBY.get(env.LOBBY.idFromName("lobby"));
    if (pathname === "/ws") return lobby.fetch(request);
    if (pathname === "/api/stats") return stats(request, env, lobby);
    if (request.method === "POST" && pathname === "/api/payment") return submit(request, env, ctx, "payment");
    if (request.method === "POST" && pathname === "/api/verification") return submit(request, env, ctx, "verification");
    return env.ASSETS.fetch(request);
  },
};
