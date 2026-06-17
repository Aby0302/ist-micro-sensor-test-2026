# Agent Operating Rules

Language:
- Speak Turkish to the user.

Core rule:
- Do not stop just because one step is finished.
- Continue until every item in TODO.md is marked [x].
- Before every action, read TODO.md.
- After every action, update TODO.md.
- If a command fails, do not stop. Diagnose the error, write the next fix step into TODO.md, and continue.
- Only stop when all tasks in TODO.md are complete.
- When all tasks are complete, write exactly:
  ALL_TASKS_COMPLETE

Safety:
- Do not delete user files.
- Do not overwrite important files without backup.
- Before large changes, explain the plan briefly.
- Prefer small safe changes.
- Use git status and git diff after edits.

Local-only:
- Work only with local files.
- Do not use web search unless the user explicitly asks.

Useful commands:
- pwd
- ls -lah
- find . -maxdepth 5 -type f
- unzip -l file.zip
- unzip -oq file.zip -d extracted/folder
- python scripts for CSV/XLSX inspection
- git status
- git diff
