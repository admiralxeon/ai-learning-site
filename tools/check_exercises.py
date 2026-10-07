"""Check the code exercises with real Python, the same way the browser runs them.

    python tools/check_exercises.py

Each solution must pass all its tests. Each starter must fail at least one test.
The browser uses the same RUNNER code (the build copies it into assets/exercises.js).
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from exercises import EXERCISES  # noqa: E402

# Runs the learner's code, then each test expression in the same namespace.
# Input: the globals __user_code and __tests (JSON). Output: a JSON text.
RUNNER = r'''
import json, io, contextlib, traceback
_ns = {"__name__": "__main__"}
_buf = io.StringIO()
_res = {"stdout": "", "error": None, "tests": []}
try:
    with contextlib.redirect_stdout(_buf):
        exec(__user_code, _ns)
except BaseException as e:
    _res["error"] = traceback.format_exception_only(type(e), e)[-1].strip()
if _res["error"] is None:
    for _desc, _expr in json.loads(__tests):
        try:
            with contextlib.redirect_stdout(_buf):
                _ok = bool(eval(_expr, _ns))
            _res["tests"].append([_desc, _ok, None])
        except BaseException as e:
            _res["tests"].append([_desc, False, traceback.format_exception_only(type(e), e)[-1].strip()])
_res["stdout"] = _buf.getvalue()[-3000:]
json.dumps(_res)
'''


def run(code, tests):
    """Run RUNNER like Pyodide's runPython: the value of the last expression is the result."""
    g = {"__user_code": code, "__tests": json.dumps(tests)}
    body, last = RUNNER.strip().rsplit("\n", 1)
    exec(body, g)
    return json.loads(eval(last, g))


def main():
    problems, count = [], 0
    for page, items in EXERCISES.items():
        ids = set()
        for ex in items:
            count += 1
            for key in ("id", "title", "task", "starter", "solution", "tests"):
                if key not in ex:
                    problems.append(f"{page}: an exercise has no {key}")
            if ex["id"] in ids:
                problems.append(f"{page}: duplicate id {ex['id']}")
            ids.add(ex["id"])
            sol = run(ex["solution"], ex["tests"])
            if sol["error"] or not all(t[1] for t in sol["tests"]):
                problems.append(f"{ex['id']}: the solution does not pass: {sol['error'] or [t for t in sol['tests'] if not t[1]]}")
            st = run(ex["starter"], ex["tests"])
            if not st["error"] and all(t[1] for t in st["tests"]):
                problems.append(f"{ex['id']}: the starter already passes all tests")
    for p in problems:
        print("PROBLEM:", p)
    print(f"{count} exercises checked, {len(problems)} problems.")
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
