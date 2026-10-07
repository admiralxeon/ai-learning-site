/* Made by tools/build.py. Do not edit. It keeps a copy of the site so that it works offline. */
const VERSION = "375e79b7e24a";
const FILES = ["./", "index.html", "course.html", "python-for-ai.html", "ai.html", "mathematics.html", "machine-learning.html", "deep-learning.html", "generative-ai.html", "responsible-ai.html", "ai-in-practice.html", "devops.html", "llm-engineering.html", "system-design.html", "topic-computer-vision.html", "topic-language-tasks.html", "topic-recommendation-systems.html", "topic-forecasting.html", "projects.html", "capstone.html", "review.html", "cheat-sheets.html", "careers.html", "glossary.html", "certificate.html", "verify.html", "notes.html", "assets/exercises.js?v=1ec772a22e", "assets/favicon.svg", "assets/flashcards.js?v=1ce0d28421", "assets/icon-192.png", "assets/icon-512.png", "assets/issuer-key.js?v=5bfa04f9e5", "assets/playgrounds.js?v=083c6723e3", "assets/py-runner.js?v=b0c94173c4", "assets/review-pool.js?v=a2a83ac71a", "assets/search-index.js?v=0104509bf5", "assets/site.css?v=d9ae1eaec9", "assets/site.js?v=f73fbbeaa9", "manifest.webmanifest"];
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
