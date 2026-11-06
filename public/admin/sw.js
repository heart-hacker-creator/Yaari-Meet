// Admin push notifications: { title, body, tag } sent (encrypted) by the chat server.
self.addEventListener("push", (event) => {
  let msg = {};
  try {
    msg = event.data?.json() ?? {};
  } catch {}
  event.waitUntil(
    self.registration.showNotification(msg.title || "YaariMeet", {
      body: msg.body || "Something new is waiting for you.",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      // Visits use one shared tag so a busy day doesn't stack hundreds of alerts.
      tag: msg.tag === "visit" ? "visit" : `${msg.tag || "admin"}-${Date.now()}`,
      renotify: true,
      data: { tab: msg.tag },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const tab = { payment: "payments", verification: "verifications", visit: "visitors", signup: "users" }[
    event.notification.data?.tab
  ];
  const url = `/admin/${tab ? `#${tab}` : ""}`;
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((windows) => {
      const open = windows.find((w) => w.url.includes("/admin/"));
      return open ? open.focus().then((w) => w.navigate(url)) : self.clients.openWindow(url);
    }),
  );
});
