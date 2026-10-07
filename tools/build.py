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
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SITE / "tools"))
from exercises import EXERCISES  # noqa: E402  (code exercises for the modules)
from check_exercises import RUNNER  # noqa: E402

# The course, in order. To add a module: write its page, add one line here, and run this script.
MODULES = [
    {"href": "python-for-ai.html", "title": "Python and data tools",
     "summary": "Python basics, NumPy arrays, pandas tables, SQL, error messages, the terminal, and Git: the tools of an AI engineer.",
     "quick": ["set-up-your-tools", "python-basics", "pandas-work-with-tables", "summary", "knowledge-check"]},
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
    {"href": "devops.html", "title": "DevOps for AI",
     "summary": "Build, ship, and run an AI product: Git, model APIs, containers, CI/CD pipelines, the cloud, observability, and secrets.",
     "quick": ["what-devops-is", "serve-the-model-as-an-api", "test-and-release-automatically", "observe-the-system-in-production", "summary", "knowledge-check"]},
    {"href": "llm-engineering.html", "title": "LLM engineering",
     "summary": "Build LLM applications: API calls, structured output, RAG with sources, tools, evaluation with a judge, cost and caching, and fine-tuning choices.",
     "quick": ["the-parts-of-an-llm-application", "call-a-model-through-an-api", "answer-from-your-documents-with-rag", "evaluate-the-application", "summary", "knowledge-check"]},
    {"href": "system-design.html", "title": "ML system design",
     "summary": "Design a full ML system in seven steps, estimate load and cost, select thresholds from costs, three case studies, real failures, and design interviews.",
     "quick": ["a-method-in-seven-steps", "estimate-load-latency-and-cost", "case-study-fraud-detection", "lessons-from-real-failures", "summary", "knowledge-check"]},
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
# What a learner can do after each module, and which modules to finish first (by module number).
OUTCOMES = {
    0: (["Run Python in Google Colab and on your own computer.",
         "Write code with lists, dictionaries, loops, conditions, and functions.",
         "Load, clean, filter, and summarize a table of data with pandas.",
         "Get data from a database with SQL.",
         "Use the terminal, a virtual environment, and Git."], []),
    1: (["Explain what AI is, and the difference between AI, ML, deep learning, and generative AI.",
         "Describe how a system learns from examples.",
         "Explain how a chat AI makes text, one token at a time.",
         "Name the main limits and risks of AI."], []),
    2: (["Describe data with the mean, the median, and the standard deviation.",
         "Use probability and Bayes' rule, and explain softmax.",
         "Calculate with vectors and matrices.",
         "Explain derivatives, gradients, and gradient descent."], [1]),
    3: (["Describe the steps of the machine learning workflow.",
         "Prepare data and divide it into training, validation, and test sets.",
         "Select supervised, unsupervised, or reinforcement learning for a problem.",
         "Measure a model with accuracy, precision, and recall, and find overfitting."], [1, 2]),
    4: (["Explain how a neuron, backpropagation, and gradient descent work together.",
         "Select a type of neural network for a type of data.",
         "Explain embeddings and attention.",
         "Use transfer learning when you have little data."], [3]),
    5: (["Explain how a large language model is made.",
         "Control the output with temperature and the context window.",
         "Write clear prompts with a task, context, format, and examples.",
         "Explain RAG and agents, and the risks of generative AI."], [4]),
    6: (["Find and measure bias in a model.",
         "Apply the basic rules of privacy and AI law.",
         "Plan explanations and human oversight.",
         "Evaluate an AI tool, and decide when not to use AI."], [5]),
    7: (["Prepare data without data leakage, and compare models with a baseline.",
         "Test models fairly with cross-validation.",
         "Release a model safely and monitor it for drift.",
         "Test LLM applications with an evaluation set, and use agents safely."], [3, 5]),
    8: (["Keep versions of code, data, models, and prompts.",
         "Serve a model as an API and package it in a container.",
         "Build a CI/CD pipeline with quality gates.",
         "Observe a service in production and protect its secrets."], [0, 7]),
    9: (["Call an LLM API from code, and handle refusals and errors.",
         "Get structured output that a program can use.",
         "Build a RAG pipeline that answers with sources.",
         "Give a model tools, build an agent with guardrails, and evaluate an application with a retrieval test and a judge.",
         "Decrease cost with caching, and select between a prompt, RAG, and fine-tuning."], [0, 5, 7]),
    10: (["Design an ML system in seven steps, from requirements to risks.",
          "Estimate the load, the latency budget, the storage, and the cost of a design.",
          "Select a decision threshold from the costs of the two types of error.",
          "Explain the lessons of real failures, and answer a design interview question."], [3, 7, 8, 9]),
}

# The two tracks. "plan" has one line for each week: (what to study, what to do).
# Use module numbers (int), project ids ("p3"), topic file names, or text.
TRACKS = [
    {"id": "foundations", "name": "AI Foundations", "weeks": 6, "hours": "3 to 4 hours each week",
     "who": "For anyone who wants to understand AI and use it well at work or in studies. No programming.",
     "modules": [1, 2, 3, 4, 5, 6], "projects": [],
     "plan": [([1], ["p1"]), ([2], ["The playgrounds of Module 2"]), ([3], ["p2"]),
              ([4], ["Glossary flashcards for Modules 1 to 4"]), ([5], ["p6"]),
              ([6], ["The capstone plan in Module 6", "The final review"])]},
    {"id": "engineer", "name": "AI Engineer", "weeks": 12, "hours": "6 to 8 hours each week",
     "who": "For people who want to build AI products: developers, data analysts, and students of engineering.",
     "modules": "all", "projects": ["p3", "p5", "p8", "p9"], "capstone": True,
     "plan": [([0], ["Run all the examples of Module 0", "p2"]), ([1, 2], ["p1"]), ([3], ["p3", "p4"]),
              ([4], ["p5"]), ([5], ["p6"]), ([6], ["p7"]),
              ([7], ["p8"]), ([8], ["p9"]),
              ([9], ["Run rag.py and eval_retrieval.py of Module 9 (no API key necessary)", "cap1"]),
              (["topic-computer-vision.html", "topic-language-tasks.html", "topic-recommendation-systems.html", "topic-forecasting.html"], ["With an API key: build the RAG answer, the judge, and the tool example of Module 9", "cap2"]),
              ([10, "cheat-sheets.html"], ["The final review", "cap3"]),
              (["careers.html"], ["Put your projects on GitHub with a README", "cap4"])]},
]
PROJECT_IDS = {"p1": "project-1-teach-a-computer-to-see", "p2": "project-2-predict-flat-prices-with-a-line",
               "p3": "project-3-build-a-spam-filter", "p4": "project-4-find-groups-of-customers",
               "p5": "project-5-a-neural-network-that-reads-digits", "p6": "project-6-a-prompt-lab",
               "p7": "project-7-audit-a-model-for-bias", "p8": "project-8-find-drift-and-train-again",
               "p9": "project-9-ship-a-model-with-ci-cd"}
HOME, GLOSSARY, CERTIFICATE, PROJECTS = "index.html", "glossary.html", "certificate.html", "projects.html"
REVIEW, CHEATS, CAREERS, COURSE, CAPSTONE, VERIFY, NOTES = "review.html", "cheat-sheets.html", "careers.html", "course.html", "capstone.html", "verify.html", "notes.html"
SITE_NAME = "AI learning manual"
HOME_DESCRIPTION = ("A full AI course in eleven modules and two tracks, AI Foundations and AI Engineer: from Python, AI, mathematics, machine learning, and deep learning to generative AI, responsible AI, MLOps, LLM engineering, and ML system design. "
                    "Each module has diagrams, videos, and a knowledge check.")
PROJECTS_DESCRIPTION = "Nine hands-on AI projects from beginner to advanced: an image classifier, a spam filter, customer groups, a digit reader, a prompt lab, a bias audit, drift monitoring, and a CI/CD pipeline."
CERTIFICATE_DESCRIPTION = "Get a certificate when you pass the knowledge check of each module and the final review of the AI learning manual."
REVIEW_DESCRIPTION = "The final review: 20 questions from the modules of your track, in a new mix each time. Pass it to get your certificate."
CHEATS_DESCRIPTION = "One-page summary sheets for each module of the AI learning manual, and a formula sheet for the mathematics. Print one or all."
CAPSTONE_DESCRIPTION = "The capstone of the AI Engineer track: build and ship an ML service or a RAG application, with a submission checklist, a seven-part rubric, and a self-assessment score."
NOTES_DESCRIPTION = "Your notes and bookmarks from the sections of the AI learning manual, kept in this browser."
VERIFY_DESCRIPTION = "Check a certificate of the AI learning manual: its data, its ID, and the digital signature of the course issuer."
COURSE_DESCRIPTION = "The course plan: two tracks, AI Foundations (6 weeks) and AI Engineer (12 weeks), with a weekly plan, the learning outcomes of each module, and the certificate rules."
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
    m["num"] = i  # Module 0 is the programming module
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

EXTRA = {COURSE: ("Course plan", COURSE_DESCRIPTION), CAPSTONE: ("Capstone", CAPSTONE_DESCRIPTION), VERIFY: ("Verify a certificate", VERIFY_DESCRIPTION), NOTES: ("My notes", NOTES_DESCRIPTION), PROJECTS: ("Projects", PROJECTS_DESCRIPTION), REVIEW: ("Final review", REVIEW_DESCRIPTION),
         CHEATS: ("Cheat sheets", CHEATS_DESCRIPTION), CAREERS: ("Careers", CAREERS_DESCRIPTION)}
for m in MODULES:
    if m["num"] not in OUTCOMES:
        raise SystemExit(f'{m["href"]}: add its learning outcomes to OUTCOMES')
    m["outcomes"], m["needs"] = OUTCOMES[m["num"]]
BY_NUM = {m["num"]: m for m in MODULES}
BY_HREF = {m["href"]: m for m in MODULES}
for t in TRACKS:
    if t["modules"] == "all":
        t["modules"] = [m["num"] for m in MODULES]
for m in MODULES:
    m["tracks"] = [t["id"] for t in TRACKS if m["num"] in t["modules"]]
PAGES = [HOME, COURSE] + [m["href"] for m in MODULES] + [t["href"] for t in TOPICS] + [PROJECTS, CAPSTONE, REVIEW, CHEATS, CAREERS, GLOSSARY, CERTIFICATE, VERIFY, NOTES]


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
        <div class="mods-foot">{top(HOME, "Home", " mods-home")}{top(COURSE, "Course plan")}{top(PROJECTS, "Projects")}{top(CAPSTONE, "Capstone")}{top(REVIEW, "Final review")}{top(CHEATS, "Cheat sheets")}{top(CAREERS, "Careers")}{top(GLOSSARY, "Glossary and flashcards")}{top(NOTES, "My notes")}{top(CERTIFICATE, "Certificate")}</div>
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
        parts.append(link(COURSE, "Start here", "Choose your track", "next"))
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


# ---------------------------------------------------------------- outcomes box and course page
TRACK_NAMES = {t["id"]: t["name"] for t in TRACKS}


def mod_link(n):
    m = BY_NUM[n]
    return f'<a href="{m["href"]}">Module {n}, {html.escape(m["title"])}</a>'


def outcomes_html(m):
    items = "".join(f"<li>{html.escape(o)}</li>" for o in m["outcomes"])
    needs = ", ".join(mod_link(n) for n in m["needs"]) if m["needs"] else "Nothing. You can start here."
    tracks = " &middot; ".join(f'<a href="course.html#track-{t}">{TRACK_NAMES[t]}</a>' for t in m["tracks"])
    return ("<!-- outcomes:start (made by tools/build.py) -->\n"
            '  <div class="outcomes" role="group" aria-label="About this module">\n'
            f'    <div class="oc-main"><b>After this module, you can:</b><ul>{items}</ul></div>\n'
            f'    <div class="oc-side"><b>Before you start</b><p>{needs}</p><b>Part of</b><p>{tracks}</p></div>\n'
            "  </div>\n"
            "  <!-- outcomes:end -->")


def exercises_html(m):
    n = len(EXERCISES.get(m["href"], []))
    return ("<!-- exercises:start (made by tools/build.py) -->\n"
            '      <h3 id="practice-in-code">Practice in code</h3>\n'
            f'      <p>Write Python in your browser. Python loads from the internet when you select <b>Run tests</b> the first time. This takes 10 to 30 seconds. These {n} exercises are not part of the knowledge check.</p>\n'
            f'      <div class="ex-set" data-module="{m["href"]}"><noscript><p>The code exercises need JavaScript.</p></noscript></div>\n'
            "      <!-- exercises:end -->")


def set_exercises(src, m):
    if m["href"] not in EXERCISES:
        return src
    block = exercises_html(m)
    if "<!-- exercises:start" in src:
        return re.sub(r"<!-- exercises:start.*?<!-- exercises:end -->", lambda mo: block, src, count=1, flags=re.S)
    new, n = re.subn(r'(<section id="knowledge-check">.*?)(\n    </div>\n  </section>)',
                     lambda mo: mo.group(1) + "\n      " + block + mo.group(2), src, count=1, flags=re.S)
    if n != 1:
        raise SystemExit(f'{m["href"]}: knowledge check section not found')
    return new


def set_outcomes(src, m):
    block = outcomes_html(m)
    if "<!-- outcomes:start" in src:
        return re.sub(r"<!-- outcomes:start.*?<!-- outcomes:end -->", lambda mo: block, src, count=1, flags=re.S)
    new, n = re.subn(r'(<div class="title">.*?</div>\n)', lambda mo: mo.group(1) + "\n  " + block + "\n", src, count=1, flags=re.S)
    if n != 1:
        raise SystemExit(f'{m["href"]}: title block not found')
    return new


def item_html(x):
    e = lambda t: html.escape(t, quote=False)
    if isinstance(x, int):
        m = BY_NUM[x]
        return f'<a href="{m["href"]}">Module {x}: {e(m["title"])}</a> <small>({m["read"]} min read)</small>'
    if x in PROJECT_IDS:
        return f'<a href="projects.html#{PROJECT_IDS[x]}">Project {x[1:]}</a>'
    if x == "The final review":
        return '<a href="review.html">The final review</a>'
    if x.startswith("cap") and x[3:].isdigit():
        names = {"1": "plan and data", "2": "baseline and first version", "3": "tests, evaluation, and pipeline", "4": "model card, demo, and submission"}
        return f'<a href="capstone.html#milestones">Capstone, week {x[3:]}: {names[x[3:]]}</a>'
    if x.endswith(".html"):
        names = {CHEATS: "Cheat sheets", CAREERS: "Careers and next steps", REVIEW: "The final review"}
        names.update({t["href"]: t["title"] for t in TOPICS})
        return f'<a href="{x}">{e(names[x])}</a>'
    return e(x)


def plan_table(t):
    rows = []
    for week, (study, do) in enumerate(t["plan"], 1):
        if study == "rest":
            rows.append(f"            <tr><td>{week}</td><td>Catch up: finish the projects and the knowledge checks that are not done.</td><td>Repeat the difficult flashcards.</td></tr>")
            continue
        s1 = "".join(f'<span class="pi">{item_html(x)}</span>' for x in study)
        d1 = "".join(f'<span class="pi">{item_html(x)}</span>' for x in do) if do else "&ndash;"
        rows.append(f"            <tr><td>{week}</td><td>{s1}</td><td>{d1}</td></tr>")
    return "\n".join(rows)


def cert_rules(t):
    mods = ", ".join(str(n) for n in t["modules"])
    rules = [f"Pass the knowledge check of Modules {mods}.", "Pass the final review (75% or more)."]
    if t.get("capstone"):
        rules.append('Pass the <a href="capstone.html">capstone</a>: 70% or more in the rubric, no criterion at level 1, and a complete checklist.')
    if t["projects"]:
        rules.append("Mark these projects as done: " + ", ".join(f'<a href="projects.html#{PROJECT_IDS[p]}">Project {p[1:]}</a>' for p in t["projects"]) + ".")
    return "".join(f"<li>{r}</li>" for r in rules)


def course_page():
    e = lambda x: html.escape(x, quote=False)
    cards = []
    for t in TRACKS:
        proj = ("Projects " + ", ".join(p[1:] for p in t["projects"]) + " are required") if t["projects"] else "Projects are optional"
        cards.append(f"""        <div class="track-card" id="track-{t["id"]}">
          <p class="track-k">{t["weeks"]} weeks &middot; {t["hours"]}</p>
          <h3>{t["name"]}</h3>
          <p>{e(t["who"])}</p>
          <ul>
            <li>{len(t["modules"])} modules: {", ".join(str(x) for x in t["modules"])}</li>
            <li>{proj}</li>
            {"<li>A graded capstone project</li>" if t.get("capstone") else ""}
            <li>The final review and the {t["name"]} certificate</li>
          </ul>
          <button type="button" class="pg-btn pg-btn-primary track-pick" data-track="{t["id"]}">Follow this track</button>
        </div>""")
    plans = []
    num = 3
    for t in TRACKS:
        plans.append(f"""  <section id="{t["id"]}-weekly-plan">
    <div class="num">{num}</div>
    <div>
      <h2>{t["name"]}: weekly plan</h2>
      <p>{t["weeks"]} weeks, {t["hours"]}. Do the knowledge check at the end of each module before you start the next week.</p>
      <div class="tablewrap">
        <table class="plan">
          <thead><tr><th>Week</th><th>Study</th><th>Do</th></tr></thead>
          <tbody>
{plan_table(t)}
          </tbody>
        </table>
      </div>
    </div>
  </section>""")
        num += 1
    outs = []
    for m in MODULES:
        lis = "".join(f"<li>{e(o)}</li>" for o in m["outcomes"])
        outs.append(f'        <div class="oc-mod"><h3><a href="{m["href"]}">Module {m["num"]}: {e(m["title"])}</a></h3><ul>{lis}</ul></div>')
    rules = "".join(f'<div class="cs-box"><h3>{t["name"]}</h3><ul>{cert_rules(t)}</ul></div>' for t in TRACKS)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Course plan | AI learning manual</title>
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
  {nav_html(COURSE)}
</div></header>

<div class="sheet">
<main id="main" data-reference>
  <div class="dmhead" role="group" aria-label="Document identification">
    <div>Data module<b>AI-00-00-00-001A</b></div>
    <div>Subject<b>Course plan</b></div>
    <div>Info type<b>Syllabus</b></div>
    <div>Issue<b>001, Oct 2026</b></div>
  </div>

  <div class="title">
    <h1>Course plan</h1>
    <p>This manual is a full course with two tracks. Select the track that agrees with your goal. Each track has a weekly plan, required work, and its own certificate. You can change your track at any time. Your progress stays.</p>
  </div>

  <section id="choose-your-track">
    <div class="num">1</div>
    <div>
      <h2>Choose your track</h2>
      <div class="track-grid">
{chr(10).join(cards)}
      </div>
      <p class="track-status" aria-live="polite"></p>
    </div>
  </section>

  <section id="how-to-study">
    <div class="num">2</div>
    <div>
      <h2>How to study</h2>
      <ul>
        <li><b>Set fixed times.</b> For example, one hour on three evenings each week. A regular plan is better than one long day.</li>
        <li><b>Use the quick path when you have less time.</b> Select it on the home page. It opens the most important sections only.</li>
        <li><b>Test yourself.</b> Answer the "Think" questions and the knowledge checks before you look at the answers. To remember is a stronger way to learn than to read again.</li>
        <li><b>Repeat with the flashcards.</b> Ten minutes each day with the <a href="glossary.html#flashcards">flashcards</a> keeps the technical names in your memory.</li>
        <li><b>Build things.</b> Do the projects of your track. Change them, and break them, to see what occurs.</li>
        <li><b>Revise with the <a href="cheat-sheets.html">cheat sheets</a></b> before the final review.</li>
      </ul>
    </div>
  </section>

{chr(10).join(plans)}

  <section id="learning-outcomes">
    <div class="num">{num}</div>
    <div>
      <h2>Learning outcomes</h2>
      <p>After each module, you can do these things. The same list is at the start of each module.</p>
      <div class="oc-grid">
{chr(10).join(outs)}
      </div>
    </div>
  </section>

  <section id="certificates">
    <div class="num">{num + 1}</div>
    <div>
      <h2>Certificates</h2>
      <p>Each track has its own certificate. Your progress is kept in this browser. To move it to a different device, use <b>Export progress</b> on the home page.</p>
      <div class="cs-grid">{rules}</div>
      <p><a href="certificate.html">Open your certificate page</a></p>
    </div>
  </section>
</main>

  {pager_html(COURSE)}

  <footer>
    <span>Written to ASD-STE100 (approx. 80% compliance). Made from the course data in tools/build.py.</span>
  </footer>
</div>
</body>
</html>
"""


# ---------------------------------------------------------------- write everything
glossary_html, glossary_entries = glossary_page()
write(GLOSSARY, glossary_html)
write(COURSE, course_page())

for name in PAGES:
    src = read(name)
    src = set_head(src, name)
    if name in BY_HREF:
        src = set_outcomes(src, BY_HREF[name])
        src = set_exercises(src, BY_HREF[name])
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
                                       "read": m["read"], "video": m["video"], "quick": m.get("quick", []), "quickRead": m["quickRead"], "tracks": m["tracks"], "ex": len(EXERCISES.get(m["href"], []))},
                                      separators=(",", ":")) for m in MODULES)
js, n = re.subn(r"var MODULES=\[.*?\n  \];", lambda mo: "var MODULES=[\n" + data + "\n  ];", js, count=1, flags=re.S)
if n != 1:
    raise SystemExit("assets/site.js: MODULES list not found")
tracks_js = json.dumps([{"id": t["id"], "name": t["name"], "weeks": t["weeks"], "modules": [BY_NUM[n]["href"] for n in t["modules"]],
                         "projects": [PROJECT_IDS[p] for p in t["projects"]], "capstone": bool(t.get("capstone"))} for t in TRACKS], separators=(",", ":"))
js, n = re.subn(r"var TRACKS=\[.*?\];", lambda mo: "var TRACKS=" + tracks_js + ";", js, count=1, flags=re.S)
if n != 1:
    raise SystemExit("assets/site.js: TRACKS list not found")
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
unknown = [p for p in EXERCISES if p not in BY_HREF]
if unknown:
    raise SystemExit(f"tools/exercises.py: unknown pages {unknown}")
write("assets/exercises.js", "/* Made by tools/build.py from tools/exercises.py. Do not edit. */\nwindow.EXERCISES=" + json.dumps(EXERCISES, ensure_ascii=False, separators=(",", ":"))
      + ";\nwindow.PY_RUNNER=" + json.dumps(RUNNER) + ";\n")
write("assets/review-pool.js", "/* Made by tools/build.py. Do not edit. The questions of the final review. */\nwindow.REVIEW_POOL=" + json.dumps(review_pool, ensure_ascii=False, separators=(",", ":")) + ";\n")
write("assets/search-index.js", "/* Made by tools/build.py. Do not edit. */\nwindow.SEARCH_INDEX=" + json.dumps(index, ensure_ascii=False, separators=(",", ":")) + ";\n")

import hashlib


def fhash(name):
    return hashlib.sha256((SITE / name).read_bytes()).hexdigest()[:10]


# Add a version to each CSS and JavaScript address. A new version gets a new address, so a browser
# or the offline copy can never show new pages with old styles or old scripts.
js = read("assets/site.js")
later = {n: fhash("assets/" + n) for n in ("flashcards.js", "playgrounds.js", "search-index.js", "exercises.js", "py-runner.js")}
js, n = re.subn(r"var ASSET_V=\{.*?\};", lambda mo: "var ASSET_V=" + json.dumps(later, separators=(",", ":")) + ";", js, count=1)
if n != 1:
    raise SystemExit("assets/site.js: ASSET_V not found")
write("assets/site.js", js)
versions = {n: fhash("assets/" + n) for n in ("site.css", "site.js", "review-pool.js", "issuer-key.js")}
for name in PAGES:
    src = read(name)
    new = re.sub(r'assets/(site\.css|site\.js|review-pool\.js|issuer-key\.js)(\?v=[0-9a-f]+)?"', lambda mo: f'assets/{mo.group(1)}?v={versions[mo.group(1)]}"', src)
    if new != src:
        write(name, new)
versioned = {**versions, **later}
assets = []
for f in sorted((SITE / "assets").iterdir()):
    if f.is_file():
        assets.append(f"assets/{f.name}?v={versioned[f.name]}" if f.name in versioned else f"assets/{f.name}")
OFFLINE = PAGES + assets + ["manifest.webmanifest"]
digest = hashlib.sha256()
for f in OFFLINE:
    digest.update(f.encode()); digest.update((SITE / f.split("?")[0]).read_bytes())
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
    // CSS and JavaScript addresses contain their version, so an exact match is always the correct file.
    if (req.mode === "navigate") {{
      e.respondWith(fetch(req).then(r => {{ const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return r; }})
        .catch(() => caches.match(req, {{ignoreSearch: true}}).then(r => r || caches.match("index.html"))));
    }} else {{
      e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {{
        if (res.ok) {{ const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }}
        return res;
      }})));
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
