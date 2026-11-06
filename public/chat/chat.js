import { supabase, PACKS, MINUTE_COST } from "/config.js";

const $ = (id) => document.getElementById(id);
const radio = (name) => document.querySelector(`input[name=${name}]:checked`).value;

// STUN only: works for most networks. Strict NATs (some mobile carriers) need a
// TURN relay — add one here as { urls, username, credential }.
const RTC_CONFIG = {
  iceServers: [{ urls: ["stun:stun.cloudflare.com:3478", "stun:stun.l.google.com:19302"] }],
};
const GESTURES = ["Show 2 fingers ✌️", "Give a thumbs up 👍", "Wave your hand 👋", "Touch your nose", "Show 3 fingers"];
const LABEL = { any: "a random stranger", female: "a girl", male: "a boy" };

let session = null;
let profile = null;
let ws = null;
let pc = null;
let stream = null;
let mode = "video";
let filter = "any";
let paired = false;
let queue = Promise.resolve(); // signaling messages are handled one at a time
let waitingUtr = null;

// ---------- Helpers ----------

function show(id) {
  for (const s of ["signin", "onboard", "lobby", "room"]) $(s).hidden = s !== id;
}

let toastTimer;
function toast(text) {
  $("toast").textContent = text;
  $("toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("toast").hidden = true), 6000);
}

async function api(path, body) {
  const { data } = await supabase.auth.getSession();
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token}` },
    body: JSON.stringify(body),
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(out.error ?? "Something went wrong. Please try again.");
  return out;
}

// ---------- Profile + lobby ----------

async function loadProfile() {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
  if (error) throw error;
  profile = data;
}

function setCredits(n) {
  profile.credits = n;
  document.querySelectorAll(".credits").forEach((el) => (el.textContent = n));
}

async function renderLobby() {
  setCredits(profile.credits);
  $("meName").textContent = profile.name;
  $("meInitial").textContent = (profile.name.trim()[0] ?? "?").toUpperCase();
  $("meBadge").hidden = !profile.verified;

  const [{ data: payments }, { data: checks }] = await Promise.all([
    supabase.from("payment_requests").select("amount,utr,status").eq("status", "pending"),
    supabase.from("verifications").select("id").eq("status", "pending").limit(1),
  ]);
  const total = (payments ?? []).reduce((sum, p) => sum + p.amount, 0);
  $("paymentNote").hidden = !total;
  $("paymentNote").textContent = `⏳ Payment of ₹${total} is being confirmed. Credits will appear in a few minutes.`;

  $("verifyBtn").hidden = profile.verified;
  $("verifyBtn").disabled = !!checks?.length;
  $("verifyBtn").textContent = checks?.length ? "Verification in review" : "Get verified";

  const forced = profile.forced_filter;
  $("forcedNote").hidden = !forced;
  $("forcedNote").textContent = forced
    ? `Your account is set to ${forced === "female" ? "Only girls" : "Only boys"} (20 credits per minute). With no credits you'll be matched on Random.`
    : "";
}

// Poll while the page is open: picks up admin-approved credits, verification and filter changes.
async function poll() {
  if (document.hidden || !profile?.gender) return;
  const before = profile.credits;
  await loadProfile();
  if ($("lobby").hidden) setCredits(profile.credits);
  else await renderLobby();
  if (waitingUtr) {
    const { data } = await supabase.from("payment_requests").select("status").eq("utr", waitingUtr).single();
    if (data?.status === "approved" || profile.credits > before) {
      waitingUtr = null;
      showBuyView("buyDone");
      if (!$("buy").open) $("buy").showModal();
    } else if (data?.status === "rejected") {
      waitingUtr = null;
      toast("Your payment could not be confirmed. Contact us if you were charged.");
    }
  }
}

// Once per browser session: logs the visit (with who is signed in) and fetches the banner.
async function pingVisit() {
  let first = true;
  try {
    first = !sessionStorage.ymVisit;
    sessionStorage.ymVisit = 1;
  } catch {}
  const { banner } = await api("/api/visit", { first, path: location.pathname, referrer: document.referrer }).catch(() => ({}));
  $("banner").textContent = banner ?? "";
  $("banner").hidden = !banner;
}

async function boot() {
  ({ data: { session } } = await supabase.auth.getSession());
  if (!session) return show("signin");
  await loadProfile();
  if (profile.banned) {
    document.body.innerHTML = '<p class="screen center">Your account has been banned for breaking the rules.</p>';
    return;
  }
  if (!profile.gender) {
    $("name").value = profile.name;
    return show("onboard");
  }
  await renderLobby();
  show("lobby");
  pingVisit();
  setInterval(poll, 15000);
}

// ---------- Chat ----------

function log(text, who = "sys") {
  const p = document.createElement("p");
  p.className = who;
  if (who !== "sys") {
    const b = document.createElement("b");
    b.textContent = who === "you" ? "You: " : `${$("strangerTag").dataset.name || "Stranger"}: `;
    p.append(b);
  }
  p.append(text);
  $("log").append(p);
  $("log").scrollTop = $("log").scrollHeight;
}

function send(msg) {
  if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

function setStranger(s) {
  const text = s ? `${s.name} · ${s.gender === "female" ? "Girl" : "Boy"}${s.verified ? " ✓" : ""}` : "";
  $("strangerTag").hidden = !s;
  $("searching").hidden = !!s;
  $("strangerTag").textContent = text;
  $("strangerTag").dataset.name = s?.name ?? "";
  $("strangerText").textContent = text;
}

function closePeer() {
  pc?.close();
  pc = null;
  $("remote").srcObject = null;
  setStranger(null);
}

async function openPeer(initiator) {
  pc = new RTCPeerConnection(RTC_CONFIG);
  stream.getTracks().forEach((track) => pc.addTrack(track, stream));
  pc.ontrack = (e) => ($("remote").srcObject = e.streams[0]);
  pc.onicecandidate = (e) => e.candidate && send({ type: "signal", data: { candidate: e.candidate } });
  if (initiator) {
    await pc.setLocalDescription(await pc.createOffer());
    send({ type: "signal", data: { sdp: pc.localDescription } });
  }
}

async function onSignal(data) {
  if (!pc || !data) return;
  if (data.sdp) {
    await pc.setRemoteDescription(data.sdp);
    if (data.sdp.type === "offer") {
      await pc.setLocalDescription(await pc.createAnswer());
      send({ type: "signal", data: { sdp: pc.localDescription } });
    }
  } else if (data.candidate) {
    await pc.addIceCandidate(data.candidate);
  }
}

async function handle(msg) {
  switch (msg.type) {
    case "ready":
      next();
      break;
    case "waiting":
      log(`Looking for ${LABEL[msg.filter]}…`);
      $("searchText").textContent = `Finding ${LABEL[msg.filter]}…`;
      break;
    case "matched":
      paired = true;
      $("log").textContent = "";
      setStranger(msg.stranger);
      log(`You're now chatting with ${msg.stranger.name}. Say hi! 👋`);
      if (msg.filter !== "any") log(`${MINUTE_COST} credits per minute.`);
      if (mode === "video") await openPeer(msg.initiator);
      break;
    case "signal":
      await onSignal(msg.data);
      break;
    case "chat":
      log(msg.text, "stranger");
      break;
    case "credits":
      setCredits(msg.credits);
      break;
    case "out-of-credits":
      filter = "any";
      toast("Out of credits — switched to Random. Add credits to use Only girls / Only boys.");
      break;
    case "peer-left":
      paired = false;
      closePeer();
      log("Stranger has disconnected. Press Next to meet someone new.");
      break;
    case "error":
      log(msg.text);
      break;
    case "banned":
      document.body.innerHTML = '<p class="screen center">Your account has been banned for breaking the rules.</p>';
      break;
    case "auth-failed":
      toast("Your session expired. Please sign in again.");
      setTimeout(() => location.reload(), 2000);
      break;
  }
}

function next() {
  paired = false;
  closePeer();
  $("log").textContent = "";
  send({ type: "find", mode, filter });
}

async function start(m, f) {
  mode = m;
  filter = f;
  if (mode === "video") {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch {
      toast("Video chat needs your camera and microphone. Allow access, or choose Text chat.");
      return;
    }
    $("local").srcObject = stream;
  }
  $("room").classList.toggle("text-only", mode === "text");
  show("room");
  $("log").textContent = "";
  log("Connecting…");

  const { data } = await supabase.auth.getSession();
  const socket = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`);
  ws = socket;
  socket.onopen = () => socket.send(JSON.stringify({ type: "auth", token: data.session?.access_token }));
  socket.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    queue = queue.then(() => handle(msg)).catch(console.error);
  };
  socket.onclose = () => {
    if (ws !== socket) return;
    paired = false;
    closePeer();
    log("Connection lost. Press Stop and start again.");
  };
}

function stop() {
  const socket = ws;
  ws = null;
  socket?.close();
  paired = false;
  closePeer();
  stream?.getTracks().forEach((track) => track.stop());
  stream = null;
  $("local").srcObject = null;
  renderLobby();
  show("lobby");
}

// ---------- Add credits ----------

function showBuyView(id) {
  for (const v of ["buyForm", "buyWait", "buyDone"]) $(v).hidden = v !== id;
}

function openBuy() {
  showBuyView(waitingUtr ? "buyWait" : "buyForm");
  $("packs").innerHTML = PACKS.map(
    (p, i) =>
      `<label class="choice"><input type="radio" name="pack" value="${p.rupees}" ${i === 0 ? "checked" : ""}>
        <b>₹${p.rupees}</b><span class="small muted">${p.credits} credits</span></label>`,
  ).join("");
  $("payAmount").textContent = "₹25";
  $("utr").value = "";
  $("buyError").hidden = true;
  $("buy").showModal();
}

$("packs").onchange = () => ($("payAmount").textContent = `₹${radio("pack")}`);

$("paid").onclick = async () => {
  const amount = Number(radio("pack"));
  const utr = $("utr").value.trim();
  $("paid").disabled = true;
  try {
    await api("/api/payment", { amount, utr });
    waitingUtr = utr;
    $("waitAmount").textContent = `₹${amount}`;
    showBuyView("buyWait");
    renderLobby();
  } catch (e) {
    $("buyError").textContent = e.message;
    $("buyError").hidden = false;
  } finally {
    $("paid").disabled = false;
  }
};

// ---------- Selfie verification ----------

let verifyStream = null;

async function openVerify() {
  $("verifyStart").hidden = false;
  $("verifyDone").hidden = true;
  $("verifyError").hidden = true;
  $("record").disabled = false;
  $("gesture").textContent = GESTURES[Math.floor(Math.random() * GESTURES.length)];
  $("verify").showModal();
  try {
    verifyStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    $("verifyVideo").srcObject = verifyStream;
  } catch {
    $("verifyError").textContent = "Please allow camera access to record your selfie video.";
    $("verifyError").hidden = false;
    $("record").disabled = true;
  }
}

$("verify").onclose = () => {
  verifyStream?.getTracks().forEach((t) => t.stop());
  verifyStream = null;
};

$("record").onclick = async () => {
  $("record").disabled = true;
  try {
    const recorder = new MediaRecorder(verifyStream);
    const chunks = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    const done = new Promise((resolve) => (recorder.onstop = resolve));
    recorder.start();
    for (let s = 3; s > 0; s--) {
      $("record").textContent = `Recording… ${s}`;
      await new Promise((r) => setTimeout(r, 1000));
    }
    recorder.stop();
    await done;
    $("record").textContent = "Uploading…";

    const type = (recorder.mimeType || "video/webm").split(";")[0];
    const path = `${profile.id}/${Date.now()}.${type === "video/mp4" ? "mp4" : "webm"}`;
    const { error } = await supabase.storage
      .from("verifications")
      .upload(path, new Blob(chunks, { type }), { contentType: type });
    if (error) throw error;
    await api("/api/verification", { path, gesture: $("gesture").textContent });
    $("verifyStart").hidden = true;
    $("verifyDone").hidden = false;
    renderLobby();
  } catch (e) {
    $("verifyError").textContent = e.message || "Upload failed. Please try again.";
    $("verifyError").hidden = false;
    $("record").disabled = false;
  } finally {
    $("record").textContent = "Record 3 seconds";
  }
};

// ---------- Wiring ----------

document.addEventListener("click", (e) => {
  const open = e.target.closest("[data-open]");
  if (open) (open.dataset.open === "buy" ? openBuy : openVerify)();
  const close = e.target.closest("[data-close]");
  if (close) close.closest("dialog").close();
});

$("google").onclick = () =>
  supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/chat/` } });

$("signout").onclick = async () => {
  await supabase.auth.signOut();
  location.href = "/";
};

$("onboardForm").onsubmit = async (e) => {
  e.preventDefault();
  const { error } = await supabase.rpc("set_profile", { p_name: $("name").value, p_gender: radio("gender") });
  if (error) return toast(error.message);
  api("/api/signup", {}).catch(() => {});
  boot();
};

// Dashboard: free tiles start right away; premium tiles open the pop-up first.
document.querySelectorAll("[data-start]").forEach((btn) => {
  btn.onclick = () => start(btn.dataset.start, btn.dataset.filter);
});

let premiumFilter = "female";
document.querySelectorAll("[data-premium]").forEach((btn) => {
  btn.onclick = () => {
    premiumFilter = btn.dataset.premium;
    const girls = premiumFilter === "female";
    const enough = profile.credits >= MINUTE_COST;
    $("premIcon").textContent = girls ? "👧" : "👦";
    $("premTitle").textContent = girls ? "Girls only" : "Boys only";
    $("premWho").textContent = girls ? "girls" : "boys";
    $("premBalance").textContent = enough
      ? `You have ${profile.credits} credits — about ${Math.floor(profile.credits / MINUTE_COST)} minutes.`
      : `You have ${profile.credits} credits. Add credits to start (₹25 = 100 credits = 5 minutes).`;
    $("premStart").hidden = !enough;
    $("premBuy").textContent = enough ? "Add more credits" : "Get credits";
    $("premBuy").className = enough ? "ghost big" : "primary big";
    $("premium").showModal();
  };
});
$("premBuy").onclick = () => {
  $("premium").close();
  openBuy();
};
document.querySelectorAll("[data-go]").forEach((btn) => {
  btn.onclick = () => {
    $("premium").close();
    start(btn.dataset.go, premiumFilter);
  };
});
$("next").onclick = next;
$("stop").onclick = stop;
$("reportBtn").onclick = () => paired && $("report").showModal();
document.querySelectorAll("[data-reason]").forEach((btn) => {
  btn.onclick = () => {
    send({ type: "report", reason: btn.dataset.reason });
    $("report").close();
    next();
    toast("Thanks — your report was sent to our team.");
  };
});

$("form").onsubmit = (e) => {
  e.preventDefault();
  const text = $("input").value.trim();
  if (!text || !paired) return;
  send({ type: "chat", text });
  log(text, "you");
  $("input").value = "";
};

addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !$("room").hidden && !document.querySelector("dialog[open]")) next();
});

boot().catch((e) => {
  console.error(e);
  toast("Could not load. Please refresh the page.");
});
