import { supabase, VAPID_PUBLIC_KEY } from "/config.js";

const $ = (id) => document.getElementById(id);
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const when = (t) => new Date(t).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
const who = (p) => `<b>${esc(p?.name || "—")}</b> <span class="small muted">${esc(p?.email)}</span>`;
const GENDER = { female: "👧 Girl", male: "👦 Boy" };

let toastTimer;
function toast(text) {
  $("toast").textContent = text;
  $("toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("toast").hidden = true), 4000);
}

async function rpc(name, args) {
  const { data, error } = await supabase.rpc(name, args);
  if (error) {
    toast(error.message);
    throw error;
  }
  return data;
}

function badge(id, n) {
  $(id).hidden = !n;
  $(id).textContent = n;
}

// ---------- Dashboard ----------

async function loadStats() {
  const { data: auth } = await supabase.auth.getSession();
  const [stats, users, approved, visits] = await Promise.all([
    fetch("/api/stats", { headers: { Authorization: `Bearer ${auth.session?.access_token}` } })
      .then((r) => r.json())
      .catch(() => null),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    // ponytail: sums in the browser; move to a SQL view once there are many thousands of payments.
    supabase.from("payment_requests").select("amount,reviewed_at").eq("status", "approved"),
    supabase.from("visits").select("id", { count: "exact", head: true }).gte("created_at", startOfToday()),
  ]);
  $("sVisits").textContent = visits.count ?? "–";
  const today = new Date().toDateString();
  const rows = approved.data ?? [];
  $("sOnline").textContent = stats?.online ?? "–";
  $("sUsers").textContent = users.count ?? "–";
  $("sToday").textContent = `₹${rows.filter((p) => new Date(p.reviewed_at).toDateString() === today).reduce((s, p) => s + p.amount, 0)}`;
  $("sAll").textContent = `₹${rows.reduce((s, p) => s + p.amount, 0)}`;
}

// ---------- Payments ----------

async function loadPayments() {
  let query = supabase
    .from("payment_requests")
    .select("*, profiles(name,email,credits)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (!$("showHistory").checked) query = query.eq("status", "pending");
  const { data = [] } = await query;
  const pending = data.filter((p) => p.status === "pending");
  badge("nPayments", $("showHistory").checked ? pending.length : data.length);

  $("payments").innerHTML =
    data
      .map(
        (p) => `<div class="item">
        <div class="row"><span class="grow">${who(p.profiles)}</span><b style="font-size:1.3rem">₹${p.amount}</b></div>
        <p class="small" style="margin:6px 0">UTR: <b style="user-select:all">${esc(p.utr)}</b> · ${when(p.created_at)} · current balance ${p.profiles?.credits ?? "?"}</p>
        ${
          p.status === "pending"
            ? `<div class="row">
                <label class="small muted">Credits to add</label>
                <input type="number" min="0" value="${p.amount * 4}" data-credits="${p.id}">
                <span class="grow"></span>
                <button class="danger" data-reject="${p.id}">Reject</button>
                <button class="ok" data-approve="${p.id}">Approve</button>
              </div>`
            : `<p class="small ${p.status === "approved" ? "badge" : "danger"}" style="margin:0">${p.status}${p.credits != null ? ` · ${p.credits} credits` : ""}</p>`
        }
      </div>`,
      )
      .join("") || '<p class="muted center">No pending payments 🎉</p>';
}

// ---------- Verifications ----------

async function loadVerifications() {
  const { data = [] } = await supabase
    .from("verifications")
    .select("*, profiles(name,email,gender)")
    .eq("status", "pending")
    .order("created_at");
  badge("nVerifications", data.length);
  const urls = await Promise.all(
    data.map((v) => supabase.storage.from("verifications").createSignedUrl(v.video_path, 3600).then((r) => r.data?.signedUrl)),
  );
  $("verifications").innerHTML =
    data
      .map(
        (v, i) => `<div class="item">
        <div>${who(v.profiles)} · says <b>${GENDER[v.profiles?.gender] ?? "?"}</b></div>
        <p class="small muted" style="margin:4px 0">Asked to: <b>${esc(v.gesture)}</b> · ${when(v.created_at)}</p>
        <video src="${esc(urls[i])}" controls playsinline loop></video>
        <p class="small muted" style="margin:0 0 8px">If the gender is wrong, reject it, then fix the gender in Users.</p>
        <div class="row"><span class="grow"></span>
          <button class="danger" data-vreject="${v.id}">Reject</button>
          <button class="ok" data-vapprove="${v.id}">Approve ✔</button>
        </div>
      </div>`,
      )
      .join("") || '<p class="muted center">No videos waiting.</p>';
}

async function reviewVerification(id, approve) {
  const path = await rpc("admin_review_verification", { p_id: id, p_approve: approve });
  if (path) await supabase.storage.from("verifications").remove([path]);
  toast(approve ? "Verified ✔" : "Rejected");
  loadVerifications();
}

// ---------- Reports ----------

async function loadReports() {
  const { data = [] } = await supabase
    .from("reports")
    .select(
      "*, reporter_p:profiles!reports_reporter_fkey(name,email), reported_p:profiles!reports_reported_fkey(id,name,email,gender,banned)",
    )
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(100);
  badge("nReports", data.length);
  $("reports").innerHTML =
    data
      .map(
        (r) => `<div class="item">
        <p style="margin:0 0 4px"><b class="danger">${r.reason === "wrong_gender" ? "⚠️ Wrong gender" : "🚫 Abuse"}</b> · <span class="small muted">${when(r.created_at)}</span></p>
        <div>Reported: ${who(r.reported_p)} · ${GENDER[r.reported_p?.gender] ?? ""} ${r.reported_p?.banned ? '<span class="danger">(banned)</span>' : ""}</div>
        <div class="small muted">By: ${esc(r.reporter_p?.name)} ${esc(r.reporter_p?.email)}</div>
        <div class="row" style="margin-top:8px"><span class="grow"></span>
          <button data-open-user="${esc(r.reported_p?.email)}">Open user</button>
          <button data-close-report="${r.id}">Dismiss</button>
        </div>
      </div>`,
      )
      .join("") || '<p class="muted center">No open reports.</p>';
}

// ---------- Users ----------

async function loadUsers() {
  const q = $("search").value.trim().replace(/[%,()]/g, "");
  let query = supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(50);
  if (q) query = query.or(`email.ilike.%${q}%,name.ilike.%${q}%`);
  const { data = [] } = await query;
  $("users").innerHTML =
    data
      .map(
        (u) => `<div class="item" data-user="${u.id}">
        <div class="row">
          <span class="grow">${who(u)} ${u.verified ? '<span class="badge">✔</span>' : ""} ${u.banned ? '<span class="danger">banned</span>' : ""}</span>
          <span class="pill">💎 ${u.credits}</span>
        </div>
        <div class="row" style="margin-top:10px">
          <label class="small muted">Credits</label>
          <input type="number" min="0" value="${u.credits}" data-field="credits">
          <button data-set-credits>Set</button>
          <button data-add="100">+100</button>
          <button data-add="-100">−100</button>
        </div>
        <div class="row" style="margin-top:10px">
          <select data-field="gender">
            <option value="">Gender not set</option>
            <option value="male" ${u.gender === "male" ? "selected" : ""}>👦 Boy</option>
            <option value="female" ${u.gender === "female" ? "selected" : ""}>👧 Girl</option>
          </select>
          <select data-field="forced">
            <option value="">Can choose any filter</option>
            <option value="female" ${u.forced_filter === "female" ? "selected" : ""}>Always Only girls</option>
            <option value="male" ${u.forced_filter === "male" ? "selected" : ""}>Always Only boys</option>
          </select>
          <label class="row small"><input type="checkbox" data-field="verified" ${u.verified ? "checked" : ""}> Verified</label>
          <label class="row small"><input type="checkbox" data-field="banned" ${u.banned ? "checked" : ""}> Banned</label>
          <span class="grow"></span>
          <button class="primary" data-save-user>Save</button>
        </div>
        <p class="small muted" style="margin:6px 0 0">Joined ${when(u.created_at)}</p>
      </div>`,
      )
      .join("") || '<p class="muted center">No users found.</p>';
}

async function userAction(btn) {
  const item = btn.closest("[data-user]");
  const id = item.dataset.user;
  const field = (name) => item.querySelector(`[data-field=${name}]`);
  if (btn.dataset.add) {
    await rpc("admin_add_credits", { p_user: id, p_delta: Number(btn.dataset.add) });
  } else if (btn.hasAttribute("data-set-credits")) {
    await rpc("admin_set_credits", { p_user: id, p_credits: Number(field("credits").value) });
  } else {
    await rpc("admin_set_user", {
      p_user: id,
      p_gender: field("gender").value || null,
      p_forced_filter: field("forced").value || null,
      p_verified: field("verified").checked,
      p_banned: field("banned").checked,
    });
  }
  toast("Saved");
  loadUsers();
}

// ---------- Visitors ----------

const startOfToday = () => new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

async function loadVisitors() {
  const { data = [] } = await supabase
    .from("visits")
    .select("*, profiles(name,gender)")
    .order("created_at", { ascending: false })
    .limit(100);
  $("visitors").innerHTML =
    data
      .map(
        (v) => `<div class="item small">
        <b>${v.profiles ? `${esc(v.profiles.name)} · ${GENDER[v.profiles.gender] ?? ""}` : "Visitor"}</b>
        · ${esc([v.city, v.region, v.country].filter(Boolean).join(", ") || "Unknown place")} · ${esc(v.device)}
        <div class="muted">${esc(v.path)}${v.referrer ? ` · from ${esc(v.referrer)}` : ""} · ${when(v.created_at)}</div>
      </div>`,
      )
      .join("") || '<p class="muted center">No visits yet.</p>';
}

// ---------- Banner & alert settings ----------

async function loadSettings() {
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).single();
  if (!data) return;
  $("bannerText").value = data.banner_text;
  $("bannerOn").checked = data.banner_on;
  $("alertSignups").checked = data.alert_signups;
  $("alertVisits").checked = data.alert_visits;
}

async function saveSettings() {
  const { error } = await supabase
    .from("site_settings")
    .update({
      banner_text: $("bannerText").value.trim(),
      banner_on: $("bannerOn").checked,
      alert_signups: $("alertSignups").checked,
      alert_visits: $("alertVisits").checked,
    })
    .eq("id", 1);
  toast(error ? error.message : "Saved. Visitors see the new banner on their next visit.");
}

// ---------- Push alerts ----------

async function enableAlerts() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return toast("This browser can't do notifications. On iPhone, add this page to the Home Screen first.");
  }
  if ((await Notification.requestPermission()) !== "granted") return toast("Notifications are blocked.");
  const reg = await navigator.serviceWorker.register("/admin/sw.js", { scope: "/admin/" });
  await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY });
  const { keys } = sub.toJSON();
  const { error } = await supabase
    .from("admin_push_subscriptions")
    .upsert({ endpoint: sub.endpoint, p256dh: keys.p256dh, auth: keys.auth });
  if (error) return toast(error.message);
  $("notify").textContent = "🔔 Alerts on";
  toast("Alerts enabled on this device.");
}

// ---------- Wiring ----------

function openTab(name) {
  document.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
  document.querySelectorAll("[data-panel]").forEach((p) => (p.hidden = p.dataset.panel !== name));
  ({ payments: loadPayments, verifications: loadVerifications, reports: loadReports, users: loadUsers, visitors: loadVisitors, settings: loadSettings })[name]();
}

document.addEventListener("click", async (e) => {
  const t = e.target.closest("button");
  if (!t) return;
  const d = t.dataset;
  if (d.tab) return openTab(d.tab);
  t.disabled = true;
  try {
    if (d.approve) {
      const credits = Number(document.querySelector(`[data-credits="${d.approve}"]`).value);
      await rpc("admin_approve_payment", { p_id: Number(d.approve), p_credits: credits });
      toast(`Approved · ${credits} credits added`);
      loadPayments();
      loadStats();
    } else if (d.reject) {
      if (!confirm("Reject this payment?")) return;
      await rpc("admin_reject_payment", { p_id: Number(d.reject) });
      loadPayments();
    } else if (d.vapprove) await reviewVerification(Number(d.vapprove), true);
    else if (d.vreject) await reviewVerification(Number(d.vreject), false);
    else if (d.closeReport) {
      await rpc("admin_close_report", { p_id: Number(d.closeReport) });
      loadReports();
    } else if (d.openUser !== undefined) {
      $("search").value = d.openUser;
      openTab("users");
    } else if (t.closest("[data-user]")) await userAction(t);
  } catch (err) {
    console.error(err);
  } finally {
    t.disabled = false;
  }
});

let searchTimer;
$("search").oninput = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadUsers, 300);
};
$("showHistory").onchange = loadPayments;
$("notify").onclick = enableAlerts;
$("saveSettings").onclick = saveSettings;
$("google").onclick = () =>
  supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/admin/` } });
$("signout").onclick = async () => {
  await supabase.auth.signOut();
  location.reload();
};

function refreshAll() {
  if (document.hidden) return;
  loadStats();
  // Don't redraw the lists while the admin is typing a credit amount.
  if (document.activeElement?.matches("input, select")) return;
  loadPayments();
  loadVerifications();
  loadReports();
}

async function boot() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return ($("signin").hidden = false);
  const { data: me } = await supabase.from("profiles").select("is_admin").eq("id", data.session.user.id).single();
  if (!me?.is_admin) {
    $("signin").hidden = false;
    $("denied").hidden = false;
    return;
  }
  $("app").hidden = false;
  if (window.Notification?.permission === "granted") $("notify").textContent = "🔔 Alerts on";
  refreshAll();
  // Alerts open the matching tab, e.g. /admin/#payments
  if (location.hash) openTab(location.hash.slice(1));
  setInterval(refreshAll, 20000);
  document.addEventListener("visibilitychange", refreshAll);
}

boot();
