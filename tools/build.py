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
     "summary": "What AI is, the parts of AI, training, neural networks, chat AI, limits and risks."},
    {"href": "machine-learning.html", "title": "Machine learning",
     "summary": "The ML workflow, data, the three types of learning, gradient descent, overfitting, evaluation, and common algorithms."},
    {"href": "deep-learning.html", "title": "Deep learning",
     "summary": "Neurons and activation, backpropagation, network types, CNNs, embeddings, transformers and attention, and training in practice."},
    {"href": "generative-ai.html", "title": "Generative AI",
     "summary": "How generative models are made, temperature and context, image generators, prompts, RAG and agents, and risks."},
]
HOME, GLOSSARY = "index.html", "glossary.html"
SITE_NAME = "AI learning manual"
HOME_DESCRIPTION = ("Learn artificial intelligence in four short modules: AI, machine learning, deep learning, and generative AI. "
                    "Each module has diagrams, videos, and a knowledge check.")
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
        m["sections"].append({"id": sid, "num": num, "title": h2, "text": plain(content)})
    words = 0
    for tag in ("p", "li", "td", "th", "dt", "dd", "h2", "h3", "figcaption"):
        for inner in re.findall(rf"<{tag}\b[^>]*>(.*?)</{tag}>", main, flags=re.S):
            words += len(plain(inner).split())
    m["read"] = max(1, round(words / 170))
    m["video"] = round(sum(int(s) for s in re.findall(r'data-seconds="(\d+)"', src)) / 60)
    m["terms"] = [(plain(dt), plain(dd)) for dt, dd in
                  re.findall(r"<dt>(.*?)</dt><dd>(.*?)</dd>", re.search(r'<dl class="glossary">(.*?)</dl>', src, flags=re.S).group(1), flags=re.S)]

PAGES = [HOME] + [m["href"] for m in MODULES] + [GLOSSARY]


# ---------------------------------------------------------------- shared parts
def nav_html(current):
    items = [(HOME, "Home")] + [(m["href"], f'{m["num"]}. {m["title"]}') for m in MODULES] + [(GLOSSARY, "Glossary")]
    links = "\n".join(f'    <a href="{h}"{" aria-current=\"page\"" if h == current else ""}>{t}</a>' for h, t in items)
    return f'<nav aria-label="Modules">\n{links}\n  </nav>'


def pager_html(current):
    def link(href, small, label, cls=""):
        c = f' class="{cls}"' if cls else ""
        return f'    <a{c} href="{href}"><small>{small}</small><b>{label}</b></a>'
    hrefs = [m["href"] for m in MODULES]
    parts = []
    if current == HOME:
        parts.append(link(MODULES[0]["href"], "Start here", f'1. {MODULES[0]["title"]}', "next"))
    elif current == GLOSSARY:
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
            parts.append(link(HOME, "Back to", "Home", "next"))
    return '<nav class="pager" aria-label="Previous and next module">\n' + "\n".join(parts) + "\n  </nav>"


def head_html(name, title):
    if name == HOME:
        desc = HOME_DESCRIPTION
    elif name == GLOSSARY:
        desc = GLOSSARY_DESCRIPTION
    else:
        m = next(x for x in MODULES if x["href"] == name)
        desc = f'Module {m["num"]}, {m["title"]}: {m["summary"]}'
    e = lambda t: html.escape(t, quote=True)
    return f"""<!-- head:start (made by tools/build.py) -->
<meta name="description" content="{e(desc)}">
<meta name="theme-color" content="#EEF2F7" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0A111A" media="(prefers-color-scheme: dark)">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
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
    for m in MODULES:
        for term, definition in m["terms"]:
            key = term.lower()
            entry = merged.setdefault(key, {"term": term, "def": definition, "mods": []})
            if m["num"] not in [x["num"] for x in entry["mods"]]:
                entry["mods"].append(m)
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
            mods = "".join(f'<a href="{x["href"]}#technical-names">Module {x["num"]}</a>' for x in e["mods"])
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
    <p>This list contains all the technical names in the manual. Each name has a short definition and a link to the modules that use it.</p>
  </div>

  <section id="all-technical-names">
    <div class="num">1</div>
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
    src = replace_one(src, r'<nav aria-label="Modules">.*?</nav>', nav_html(name), name)
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
                                       "read": m["read"], "video": m["video"]}, separators=(",", ":")) for m in MODULES)
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
for e in glossary_entries:
    index.append({"p": GLOSSARY, "id": "term-" + slug(e["term"]), "t": e["term"], "x": e["def"], "g": 1})
write("assets/search-index.js", "/* Made by tools/build.py. Do not edit. */\nwindow.SEARCH_INDEX=" + json.dumps(index, ensure_ascii=False, separators=(",", ":")) + ";\n")

for m in MODULES:
    print(f'Module {m["num"]}: {m["title"]:24} {len(m["sections"]):2} sections, {m["read"]:2} min read, {m["video"]:3} min video, {len(m["terms"])} terms')
print(f"Glossary: {len(glossary_entries)} names. Search index: {len(index)} entries, {len(json.dumps(index))//1024} KB.")
