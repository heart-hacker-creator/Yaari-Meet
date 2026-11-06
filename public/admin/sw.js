// Admin push notifications. Pushes carry no data, so the text is fixed.
self.addEventListener("push", (event) => {
  event.waitUntil(
    self.registration.showNotification("YaariMeet", {
      body: "New payment or verification waiting for you.",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "admin-request",
      renotify: true,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((windows) => {
      const open = windows.find((w) => w.url.includes("/admin/"));
      return open ? open.focus() : self.clients.openWindow("/admin/");
    }),
  );
});
