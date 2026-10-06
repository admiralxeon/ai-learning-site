/* Made by tools/build.py. Do not edit. It keeps a copy of the site so that it works offline. */
const VERSION = "9d57b71ec2d3";
const FILES = ["./", "index.html", "ai.html", "mathematics.html", "machine-learning.html", "deep-learning.html", "generative-ai.html", "responsible-ai.html", "ai-in-practice.html", "topic-computer-vision.html", "topic-language-tasks.html", "topic-recommendation-systems.html", "topic-forecasting.html", "projects.html", "review.html", "cheat-sheets.html", "careers.html", "glossary.html", "certificate.html", "assets/favicon.svg", "assets/flashcards.js?v=f3d6700cfe", "assets/icon-192.png", "assets/icon-512.png", "assets/playgrounds.js?v=b710db72c0", "assets/review-pool.js?v=3f9bdeb3bd", "assets/search-index.js?v=aa0168fb1b", "assets/site.css?v=96f39d8353", "assets/site.js?v=d4bd5b33fe", "manifest.webmanifest"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // Pages: try the network first, so that updates appear. Other files: use the copy first.
    // CSS and JavaScript addresses contain their version, so an exact match is always the correct file.
    if (req.mode === "navigate") {
      e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return r; })
        .catch(() => caches.match(req, {ignoreSearch: true}).then(r => r || caches.match("index.html"))));
    } else {
      e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
        return res;
      })));
    }
  } else if (url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com")) {
    e.respondWith(caches.open("fonts").then(c => c.match(req).then(r => r || fetch(req).then(res => { c.put(req, res.clone()); return res; }))));
  }
});
