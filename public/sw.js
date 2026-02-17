self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  console.log("WarmEdge service worker active");
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
