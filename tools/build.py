"""Build step for the AI learning manual.

Run from the site folder:  python tools/build.py

The list MODULES below is the one place that defines the course. The script:
  1. Writes the module menu, the previous/next links, and the home module list on every page.
  2. Writes the module data that assets/site.js uses (sections, reading time, video time).
  3. Makes glossary.html from the "Technical names" list in each module.
  4. Makes assets/search-index.js for the site search.
  5. Changes YouTube iframes into light video players (a thumbnail that loads the player on click).

The script is safe to run again. Run it each time you add, remove, or change a module.
"""
import html
import json
import re
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent

# The course, in order. To add a module: write its page, add one line here, and run this script.
MODULES = [
    {"href": "ai.html", "title": "Artificial intelligence",
     "summary": "What AI is, the parts of AI, training, neural networks, chat AI, limits and risks.",
     "quick": ["what-ai-is", "the-parts-of-ai", "how-a-chat-ai-makes-text", "limits-and-risks", "summary", "knowledge-check"]},
    {"href": "mathematics.html", "title": "Mathematics for machine learning",
     "summary": "Statistics, distributions and correlation, probability and Bayes' rule, softmax, vectors and matrices, and derivatives and gradients.",
     "quick": ["why-ai-needs-mathematics", "statistics-describe-data", "probability", "vectors", "calculus-rates-of-change", "summary", "knowledge-check"]},
    {"href": "machine-learning.html", "title": "Machine learning",
     "summary": "The ML workflow, data, the three types of learning, gradient descent, overfitting, evaluation, and common algorithms.",
     "quick": ["what-machine-learning-is", "the-machine-learning-workflow", "how-a-model-makes-its-errors-smaller", "overfitting-and-underfitting", "summary", "knowledge-check"]},
    {"href": "deep-learning.html", "title": "Deep learning",
     "summary": "Neurons and activation, backpropagation, network types, CNNs, embeddings, transformers and attention, and training in practice.",
     "quick": ["what-deep-learning-is", "inside-a-neuron", "how-a-transformer-uses-attention", "summary", "knowledge-check"]},
    {"href": "generative-ai.html", "title": "Generative AI",
     "summary": "How generative models are made, temperature and context, image generators, prompts, RAG and agents, and risks.",
     "quick": ["what-generative-ai-is", "how-a-large-language-model-is-made", "how-to-write-a-good-prompt", "risks-of-generative-ai", "summary", "knowledge-check"]},
    {"href": "responsible-ai.html", "title": "Responsible AI",
     "summary": "Fairness and bias, privacy and AI laws, explanations and human oversight, how to evaluate an AI tool, and a capstone project.",
     "quick": ["what-responsible-ai-is", "bias-and-fairness", "when-not-to-use-ai", "summary", "knowledge-check"]},
    {"href": "ai-in-practice.html", "title": "AI in practice",
     "summary": "From a model to a product: data preparation and leakage, baselines, cross-validation, deployment, monitoring for drift, LLM applications, and agents.",
     "quick": ["from-a-model-to-a-product", "prepare-the-data", "start-with-a-baseline", "monitor-the-model", "summary", "knowledge-check"]},
]
# Short topics: single pages that are not part of the certificate. In this order, with previous and next links.
TOPICS = [
    {"href": "topic-computer-vision.html", "title": "Computer vision",
     "summary": "Detection, segmentation, key points, and text in images: how they work and where people use them."},
    {"href": "topic-language-tasks.html", "title": "Language tasks",
     "summary": "Classification, names in text, translation, summaries, questions and answers, and search by meaning."},
    {"href": "topic-recommendation-systems.html", "title": "Recommendation systems",
     "summary": "How shops, video apps, and music apps select what to show you, and the risks of feedback loops."},
    {"href": "topic-forecasting.html", "title": "Forecasting",
     "summary": "Trend, season, and noise in time series, baselines, how to test a forecast, and ranges of uncertainty."},
]
HOME, GLOSSARY, CERTIFICATE, PROJECTS = "index.html", "glossary.html", "certificate.html", "projects.html"
REVIEW, CHEATS, CAREERS = "review.html", "cheat-sheets.html", "careers.html"
SITE_NAME = "AI learning manual"
HOME_DESCRIPTION = ("Learn artificial intelligence in seven short modules: AI, the mathematics for ML, machine learning, deep learning, generative AI, responsible AI, and AI in practice. "
                    "Each module has diagrams, videos, and a knowledge check.")
PROJECTS_DESCRIPTION = "Seven hands-on AI projects from beginner to advanced: an image classifier, a spam filter, customer groups, a digit reader, a prompt lab, and a bias audit."
CERTIFICATE_DESCRIPTION = "Get a certificate when you pass the knowledge check of each module and the final review of the AI learning manual."
REVIEW_DESCRIPTION = "The final review: 20 questions from all seven modules, in a new mix each time. Pass it to get your certificate."
CHEATS_DESCRIPTION = "One-page summary sheets for each module of the AI learning manual, and a formula sheet for the mathematics. Print one or all."
CAREERS_DESCRIPTION = "Jobs in AI, the skills that each job needs, what to learn after this course, and how to show your projects in a portfolio."
GLOSSARY_DESCRIPTION = "All the technical names in the AI learning manual, with short definitions and links to the modules that use them."


def read(name):
    return (SITE / name).read_text(encoding="utf-8")


def write(name, text):
    (SITE / name).write_text(text, encoding="utf-8", newline="\n")


def slug(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def plain(fragment):
    fragment = re.sub(r"<(script|svg|style)\b.*?</\1>", " ", fragment, flags=re.S)
    fragment = re.sub(r"<[^>]+>", " ", fragment)
    return re.sub(r"\s+", " ", html.unescape(fragment)).strip()


def replace_one(text, pattern, new, name, flags=re.S):
    out, n = re.subn(pattern, lambda m: new, text, count=1, flags=flags)
    if n != 1:
        raise SystemExit(f"{name}: could not find {pattern!r}")
    return out


# ---------------------------------------------------------------- read the modules
for i, m in enumerate(MODULES):
    m["num"] = i + 1
    src = read(m["href"])
    main = re.search(r"<main\b.*?</main>", src, flags=re.S).group(0)
    m["sections"] = []
    for sid, body in re.findall(r'<section id="([^"]+)">(.*?)</section>', main, flags=re.S):
        num = re.search(r'<div class="num">(\d+)</div>', body).group(1)
        h2 = plain(re.search(r"<h2>(.*?)</h2>", body, flags=re.S).group(1))
        content = re.sub(r'<div class="num">\d+</div>|<h2>.*?</h2>', " ", body, count=2, flags=re.S)
        sw = sum(len(plain(inner).split()) for tag in ("p", "li", "td", "th", "dt", "dd", "h2", "h3", "figcaption")
                 for inner in re.findall(rf"<{tag}\b[^>]*>(.*?)</{tag}>", body, flags=re.S))
        m["sections"].append({"id": sid, "num": num, "title": h2, "text": plain(content), "words": sw})
    ids = [x["id"] for x in m["sections"]]
    missing = [q for q in m.get("quick", []) if q not in ids]
    if missing:
        raise SystemExit(f'{m["href"]}: quick path sections not found: {missing}')
    m["quickRead"] = max(1, round(sum(x["words"] for x in m["sections"] if x["id"] in m.get("quick", [])) / 170))
    words = 0
    for tag in ("p", "li", "td", "th", "dt", "dd", "h2", "h3", "figcaption"):
        for inner in re.findall(rf"<{tag}\b[^>]*>(.*?)</{tag}>", main, flags=re.S):
            words += len(plain(inner).split())
    m["read"] = max(1, round(words / 170))
    m["video"] = round(sum(int(s) for s in re.findall(r'data-seconds="(\d+)"', src)) / 60)
    m["terms"] = [(plain(dt), plain(dd)) for dt, dd in
                  re.findall(r"<dt>(.*?)</dt><dd>(.*?)</dd>", re.search(r'<dl class="glossary">(.*?)</dl>', src, flags=re.S).group(1), flags=re.S)]

def page_sections(name):
    main = re.search(r"<main\b.*?</main>", read(name), flags=re.S).group(0)
    out = []
    for sid, body in re.findall(r'<section id="([^"]+)">(.*?)</section>', main, flags=re.S):
        num = re.search(r'<div class="num">(\d+)</div>', body).group(1)
        h2 = plain(re.search(r"<h2>(.*?)</h2>", body, flags=re.S).group(1))
        content = re.sub(r'<div class="num">\d+</div>|<h2>.*?</h2>', " ", body, count=2, flags=re.S)
        out.append({"id": sid, "num": num, "title": h2, "text": plain(content)})
    return out


for t in TOPICS:
    src = read(t["href"])
    t["sections"] = page_sections(t["href"])
    t["terms"] = [(plain(dt), plain(dd)) for dt, dd in
                  re.findall(r"<dt>(.*?)</dt><dd>(.*?)</dd>", re.search(r'<dl class="glossary">(.*?)</dl>', src, flags=re.S).group(1), flags=re.S)]

# The final review: all module questions, with the module and the section that each question refers to.
review_pool = []
for m in MODULES:
    qjson = re.search(r'<div class="quiz"[^>]*>\s*<script type="application/json">(.*?)</script>', read(m["href"]), flags=re.S).group(1)
    titles = {x["id"]: (x["num"], x["title"]) for x in m["sections"]}
    for q in json.loads(qjson)["questions"]:
        q = dict(q, page=m["href"], m=m["num"], mt=m["title"])
        if q.get("ref") in titles:
            q["rn"], q["rt"] = titles[q["ref"]]
        review_pool.append(q)

EXTRA = {PROJECTS: ("Projects", PROJECTS_DESCRIPTION), REVIEW: ("Final review", REVIEW_DESCRIPTION),
         CHEATS: ("Cheat sheets", CHEATS_DESCRIPTION), CAREERS: ("Careers", CAREERS_DESCRIPTION)}
PAGES = [HOME] + [m["href"] for m in MODULES] + [t["href"] for t in TOPICS] + [PROJECTS, REVIEW, CHEATS, CAREERS, GLOSSARY, CERTIFICATE]


# ---------------------------------------------------------------- shared parts
def nav_html(current):
    # Top bar: Home, a "Modules" menu with all modules, and Glossary.
    # The menu is a <details> element, so it opens and closes also without JavaScript.
    cur_mod = next((m for m in MODULES if m["href"] == current), None)
    e = lambda t: html.escape(t, quote=False)
    if cur_mod:
        label = f'<span class="mods-k">Module {cur_mod["num"]}</span><span class="mods-t">{e(cur_mod["title"])}</span>'
    else:
        label = '<span class="mods-t">Modules</span>'
    items = []
    for m in MODULES:
        cur = ' aria-current="page"' if m["href"] == current else ""
        items.append(f'''        <li><a href="{m["href"]}"{cur} data-mod="{m["href"]}"><span class="mods-n">{m["num"]}</span><span class="mods-i"><b>{e(m["title"])}</b><small>{e(m["summary"])}</small><span class="mods-meta">About {m["read"]} min read</span></span></a></li>''')
    def top(href, text, cls=""):
        cur = ' aria-current="page"' if href == current else ""
        return f'<a class="topnav-a{cls}" href="{href}"{cur}>{text}</a>'
    tops = "".join(f'<li><a href="{t["href"]}"' + (' aria-current="page"' if t["href"] == current else "") + f'>{e(t["title"])}</a></li>' for t in TOPICS)
    return f'''<nav class="topnav" aria-label="Main">
    {top(HOME, "Home", " topnav-home")}
    <details class="mods">
      <summary class="mods-btn{' is-current' if cur_mod else ''}">{label}<svg class="mods-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary>
      <div class="mods-panel">
        <p class="mods-h">All modules</p>
        <ol class="mods-list">
{chr(10).join(items)}
        </ol>
        <p class="mods-h">Short topics</p>
        <ul class="mods-topics">{tops}</ul>
        <div class="mods-foot">{top(HOME, "Home", " mods-home")}{top(PROJECTS, "Projects")}{top(REVIEW, "Final review")}{top(CHEATS, "Cheat sheets")}{top(CAREERS, "Careers")}{top(GLOSSARY, "Glossary and flashcards")}{top(CERTIFICATE, "Certificate")}</div>
      </div>
    </details>
    {top(PROJECTS, "Projects", " topnav-proj")}
    {top(GLOSSARY, "Glossary", " topnav-gloss")}
  </nav>'''


def pager_html(current):
    def link(href, small, label, cls=""):
        c = f' class="{cls}"' if cls else ""
        return f'    <a{c} href="{href}"><small>{small}</small><b>{label}</b></a>'
    hrefs = [m["href"] for m in MODULES]
    parts = []
    if current == HOME:
        parts.append(link(MODULES[0]["href"], "Start here", f'1. {MODULES[0]["title"]}', "next"))
    elif current == REVIEW:
        parts.append(link(MODULES[-1]["href"], "Previous module", f'{MODULES[-1]["num"]}. {MODULES[-1]["title"]}'))
        parts.append(link(CERTIFICATE, "Next", "Your certificate", "next"))
    elif current in [t["href"] for t in TOPICS]:
        th = [t["href"] for t in TOPICS]
        i = th.index(current)
        parts.append(link(TOPICS[i - 1]["href"], "Previous topic", TOPICS[i - 1]["title"]) if i else link(HOME, "Back to", "Home"))
        parts.append(link(TOPICS[i + 1]["href"], "Next topic", TOPICS[i + 1]["title"], "next") if i + 1 < len(TOPICS) else link(HOME, "Back to", "Home", "next"))
    elif current in (GLOSSARY, CERTIFICATE) or current in EXTRA:
        parts.append(link(HOME, "Back to", "Home"))
    else:
        i = hrefs.index(current)
        if i == 0:
            parts.append(link(HOME, "Previous", "Home"))
        else:
            p = MODULES[i - 1]
            parts.append(link(p["href"], "Previous module", f'{p["num"]}. {p["title"]}'))
        if i + 1 < len(MODULES):
            n = MODULES[i + 1]
            parts.append(link(n["href"], "Next module", f'{n["num"]}. {n["title"]}', "next"))
        else:
            parts.append(link(REVIEW, "Last step", "Final review", "next"))
    return '<nav class="pager" aria-label="Previous and next module">\n' + "\n".join(parts) + "\n  </nav>"


def head_html(name, title):
    if name == HOME:
        desc = HOME_DESCRIPTION
    elif name == GLOSSARY:
        desc = GLOSSARY_DESCRIPTION
    elif name == CERTIFICATE:
        desc = CERTIFICATE_DESCRIPTION
    elif name in EXTRA:
        desc = EXTRA[name][1]
    elif name in [t["href"] for t in TOPICS]:
        t = next(x for x in TOPICS if x["href"] == name)
        desc = f'Short topic, {t["title"]}: {t["summary"]}'
    else:
        m = next(x for x in MODULES if x["href"] == name)
        desc = f'Module {m["num"]}, {m["title"]}: {m["summary"]}'
    e = lambda t: html.escape(t, quote=True)
    return f"""<!-- head:start (made by tools/build.py) -->
<meta name="description" content="{e(desc)}">
<meta name="theme-color" content="#EEF2F7" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0A111A" media="(prefers-color-scheme: dark)">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="assets/icon-192.png">
<link rel="manifest" href="manifest.webmanifest">
<meta property="og:type" content="website">
<meta property="og:site_name" content="{SITE_NAME}">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<!-- head:end -->"""


def set_head(src, name):
    title = html.unescape(re.search(r"<title>(.*?)</title>", src).group(1))
    block = head_html(name, title)
    if "<!-- head:start" in src:
        return re.sub(r"<!-- head:start.*?<!-- head:end -->", lambda mo: block, src, count=1, flags=re.S)
    return src.replace("</title>\n", "</title>\n" + block + "\n", 1)


def facade(m):
    vid, title = m.group(1), m.group(2)
    return (f'<div class="frame"><a class="yt" href="https://www.youtube.com/watch?v={vid}" data-yt="{vid}" data-title="{title}">'
            f'<img src="https://i.ytimg.com/vi/{vid}/hqdefault.jpg" alt="" loading="lazy" width="480" height="360">'
            f'<span class="yt-play" aria-hidden="true"></span><span class="sr-only">Play video: {title}</span></a></div>')


# ---------------------------------------------------------------- glossary page
def glossary_page():
    merged = {}
    sources = [(m["href"], f'Module {m["num"]}', m["terms"]) for m in MODULES] + [(t["href"], t["title"], t["terms"]) for t in TOPICS]
    for href, label, terms in sources:
        for term, definition in terms:
            key = term.lower()
            entry = merged.setdefault(key, {"term": term, "def": definition, "mods": []})
            if href not in [x[0] for x in entry["mods"]]:
                entry["mods"].append((href, label))
    entries = sorted(merged.values(), key=lambda e: e["term"].lower())
    groups = {}
    for e in entries:
        letter = e["term"][0].upper()
        groups.setdefault(letter if letter.isalpha() else "#", []).append(e)
    az = "".join(f'<a href="#letter-{l.lower()}">{l}</a>' for l in groups)
    body = []
    for letter, items in groups.items():
        body.append(f'      <h3 id="letter-{letter.lower()}" class="gl-letter">{letter}</h3>\n      <dl class="gl-list">')
        for e in items:
            mods = "".join(f'<a href="{x[0]}#technical-names">{html.escape(x[1])}</a>' for x in e["mods"])
            body.append(f'        <div class="gl-item"><dt id="term-{slug(e["term"])}">{html.escape(e["term"])}</dt>'
                        f'<dd><span class="gl-def">{html.escape(e["def"])}</span><span class="gl-mods">{mods}</span></dd></div>')
        body.append("      </dl>")
    total = len(entries)
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Glossary | AI learning manual</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,400;0,500;0,600;1,400&family=Barlow+Condensed:wght@500;600;700&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/site.css">
<script src="assets/site.js"></script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="sitebar"><div class="in">
  <a class="brand" href="index.html">AI learning manual</a>
  {nav_html(GLOSSARY)}
</div></header>

<div class="sheet">
<main id="main">
  <div class="dmhead" role="group" aria-label="Document identification">
    <div>Data module<b>AI-00-00-00-002A</b></div>
    <div>Subject<b>Glossary</b></div>
    <div>Info type<b>Technical names</b></div>
    <div>Issue<b>001, Oct 2026</b></div>
  </div>

  <div class="title">
    <h1>Glossary</h1>
    <p>This list contains all the technical names in the manual. Each name has a short definition and a link to the modules and topics that use it. Use the flashcards to practice the names.</p>
  </div>

  <section id="flashcards">
    <div class="num">1</div>
    <div>
      <h2>Practice with flashcards</h2>
      <p>Look at the name. Say the definition to yourself. Then show the definition and tell the cards if you knew it. Cards that you do not know come back soon. In your next session, the difficult cards come first.</p>
      <div class="fc-body"><noscript><p>The flashcards need JavaScript. Turn on JavaScript in your browser to use them.</p></noscript></div>
    </div>
  </section>

  <section id="all-technical-names">
    <div class="num">2</div>
    <div>
      <h2>All technical names</h2>
      <div class="gl-filter">
        <label for="gl-q">Find a name</label>
        <input id="gl-q" type="search" placeholder="For example: token" autocomplete="off">
        <p class="gl-count" aria-live="polite">{total} technical names</p>
      </div>
      <nav class="gl-az" aria-label="Letters">{az}</nav>
{chr(10).join(body)}
      <p class="gl-empty" hidden>No technical names match your search.</p>
    </div>
  </section>
</main>

  {pager_html(GLOSSARY)}

  <footer>
    <span>Made from the "Technical names" list in each module.</span>
  </footer>
</div>
</body>
</html>
''', entries


# ---------------------------------------------------------------- write everything
glossary_html, glossary_entries = glossary_page()
write(GLOSSARY, glossary_html)

for name in PAGES:
    src = read(name)
    src = set_head(src, name)
    src = replace_one(src, r'<nav (?:class="topnav" )?aria-label="(?:Modules|Main)">.*?</nav>', nav_html(name), name)
    src = replace_one(src, r'<nav class="pager".*?</nav>', pager_html(name), name)
    src = re.sub(r'<div class="frame"><iframe src="https://www\.youtube-nocookie\.com/embed/([A-Za-z0-9_-]+)" title="([^"]*)"[^>]*></iframe></div>', facade, src)
    if name == HOME:
        rows = "\n".join(f'''            <tr>
              <td>{m["num"]}</td>
              <td><a href="{m["href"]}">{m["title"]}</a><br>{m["summary"]}</td>
            </tr>''' for m in MODULES)
        src, n = re.subn(r'(<table class="modlist">.*?<tbody>\n).*?(\n\s*</tbody>)', lambda mo: mo.group(1) + rows + mo.group(2), src, count=1, flags=re.S)
        if n != 1:
            raise SystemExit(f"{name}: module list table not found")
    write(name, src)

js = read("assets/site.js")
data = ",\n".join("    " + json.dumps({"href": m["href"], "num": m["num"], "title": m["title"], "sections": len(m["sections"]),
                                       "read": m["read"], "video": m["video"], "quick": m.get("quick", []), "quickRead": m["quickRead"]},
                                      separators=(",", ":")) for m in MODULES)
js, n = re.subn(r"var MODULES=\[.*?\n  \];", lambda mo: "var MODULES=[\n" + data + "\n  ];", js, count=1, flags=re.S)
if n != 1:
    raise SystemExit("assets/site.js: MODULES list not found")
write("assets/site.js", js)

index = []
for m in MODULES:
    for s in m["sections"]:
        if s["id"] in ("technical-names", "knowledge-check"):
            continue
        index.append({"p": m["href"], "m": m["num"], "mt": m["title"], "id": s["id"], "n": s["num"], "t": s["title"], "x": s["text"]})
for name, where in [(t["href"], "Topic: " + t["title"]) for t in TOPICS] + [(k, v[0]) for k, v in EXTRA.items()]:
    for s in page_sections(name):
        if s["id"] in ("technical-names", "knowledge-check", "final-review"):
            continue
        index.append({"p": name, "w": where, "id": s["id"], "n": s["num"], "t": s["title"], "x": s["text"]})
for e in glossary_entries:
    index.append({"p": GLOSSARY, "id": "term-" + slug(e["term"]), "t": e["term"], "x": e["def"], "g": 1})
write("assets/review-pool.js", "/* Made by tools/build.py. Do not edit. The questions of the final review. */\nwindow.REVIEW_POOL=" + json.dumps(review_pool, ensure_ascii=False, separators=(",", ":")) + ";\n")
write("assets/search-index.js", "/* Made by tools/build.py. Do not edit. */\nwindow.SEARCH_INDEX=" + json.dumps(index, ensure_ascii=False, separators=(",", ":")) + ";\n")

import hashlib
OFFLINE = PAGES + sorted(str(f.relative_to(SITE)).replace("\\", "/") for f in (SITE / "assets").iterdir() if f.is_file()) + ["manifest.webmanifest"]
digest = hashlib.sha256()
for f in OFFLINE:
    digest.update(f.encode()); digest.update((SITE / f).read_bytes())
version = digest.hexdigest()[:12]
write("sw.js", f"""/* Made by tools/build.py. Do not edit. It keeps a copy of the site so that it works offline. */
const VERSION = "{version}";
const FILES = {json.dumps(["./"] + OFFLINE)};
self.addEventListener("install", e => {{
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
}});
self.addEventListener("activate", e => {{
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
}});
self.addEventListener("fetch", e => {{
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {{
    // Pages: try the network first, so that updates appear. Other files: use the copy first.
    if (req.mode === "navigate") {{
      e.respondWith(fetch(req).then(r => {{ const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return r; }})
        .catch(() => caches.match(req, {{ignoreSearch: true}}).then(r => r || caches.match("index.html"))));
    }} else {{
      e.respondWith(caches.match(req, {{ignoreSearch: true}}).then(r => r || fetch(req)));
    }}
  }} else if (url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com")) {{
    e.respondWith(caches.open("fonts").then(c => c.match(req).then(r => r || fetch(req).then(res => {{ c.put(req, res.clone()); return res; }}))));
  }}
}});
""")

for m in MODULES:
    print(f'Module {m["num"]}: {m["title"]:24} {len(m["sections"]):2} sections, {m["read"]:2} min read, {m["video"]:3} min video, {len(m["terms"])} terms')
print(f"Topics: {len(TOPICS)}. Final review pool: {len(review_pool)} questions.")
print(f"Offline: {len(OFFLINE)} files, version {version}.")
print(f"Glossary: {len(glossary_entries)} names. Search index: {len(index)} entries, {len(json.dumps(index))//1024} KB.")
