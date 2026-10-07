# AI learning manual

A static learning site with ten modules (0 to 9) and two tracks, written in ASD-STE100 Simplified Technical English. There is no server and no framework: open `index.html` in a browser, or put the folder on any static host.

## Files

| File | Contents |
| --- | --- |
| `index.html` | Home page and module list |
| `ai.html`, `mathematics.html`, `machine-learning.html`, `deep-learning.html`, `generative-ai.html`, `responsible-ai.html`, `ai-in-practice.html`, `devops.html`, `llm-engineering.html` | Modules 1 to 9. Module 0 is `python-for-ai.html` |
| `course.html` | The course plan: tracks, weekly plans, outcomes, certificate rules. **Generated** from `TRACKS` and `OUTCOMES` in `tools/build.py` |
| `topic-*.html` | Short topics: computer vision, language tasks, recommendation systems, forecasting. Listed in `TOPICS` in `tools/build.py` |
| `capstone.html` | The graded capstone of the AI Engineer track: two options, milestones, a submission checklist, and a seven-part rubric with a self-assessment score |
| `review.html` | The final review: 20 questions drawn from all module knowledge checks. Passing it is the last step to the certificate |
| `cheat-sheets.html` | One printable summary sheet for each module, and a formula sheet |
| `careers.html` | Jobs in AI, skills, what to learn next, and how to build a portfolio |
| `glossary.html` | All technical names and the flashcards. **Generated**: do not edit by hand |
| `projects.html` | Nine hands-on projects, including two MLOps projects. The code in it is tested with scikit-learn 1.9 and SciPy 1.18 |
| `certificate.html` | The completion certificate |
| `assets/playgrounds.js` | The interactive activities and the capstone worksheet |
| `assets/flashcards.js` | The glossary flashcards |
| `manifest.webmanifest`, `assets/icon-*.png` | Lets people install the site as an app |
| `sw.js` | Keeps a copy of the site for offline use. **Generated**: do not edit by hand |
| `assets/site.css` | All styles, light and dark theme |
| `assets/site.js` | Navigation, progress, quizzes, search, display settings |
| `assets/search-index.js` | Search data. **Generated**: do not edit by hand |
| `assets/review-pool.js` | The questions of the final review, taken from each module. **Generated**: do not edit by hand |
| `tools/build.py` | Build step (see below) |

## After you change content, run the build

```
python tools/build.py
```

The build writes the module menu, the previous/next links, the home module list, and the page description and link-preview tags (between `<!-- head:start -->` and `<!-- head:end -->`) on every page. It also makes the glossary page and the search index, updates the module data in `assets/site.js`, and turns YouTube iframes into light video players. It is safe to run again and again.

## Add a module

1. Copy a module page, for example `deep-learning.html`, and write the new content.
2. Give each `<section>` an `id`. Use the heading in lower case with hyphens, for example `id="how-a-model-learns"`. Saved progress uses these ids, so do not change them after the module is published.
3. End the module with the sections `Summary`, `Knowledge check` (questions as JSON in the `<script type="application/json">` block) and `Technical names` (a `<dl class="glossary">`).
4. For each video, use `<div class="video" data-seconds="…">` with the length of the video in seconds.
5. Add one line to the `MODULES` list at the top of `tools/build.py`.
6. Run `python tools/build.py`.

## Add a short topic

Write the page like a module (sections, a knowledge check, and `Technical names`), add one line to `TOPICS` in `tools/build.py`, and run the build. Topics are not part of the certificate.

## Learner progress

Progress, quiz scores and display settings are kept in the learner's browser (`localStorage`). Learners can export, import or reset their progress on the home page.

## Videos

YouTube does not play embedded videos on pages opened from `file://`. Use a web server to test them, for example `python -m http.server`, then open `http://localhost:8000`.
