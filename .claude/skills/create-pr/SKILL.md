---
name: create-pr
description: Creates a GitHub pull request from the current changes. Commits uncommitted work, creates a descriptively named branch when on main (or reuses the current feature branch), pushes, and opens a PR with purpose, changes, and verification steps. Use when the user asks to open, create, or make a PR / pull request.
argument-hint: "[optional notes: title hint, branch name, 'draft', issue number]"
allowed-tools: Bash(git status *) Bash(git diff *) Bash(git log *) Bash(git branch *) Bash(git switch *) Bash(git add *) Bash(git commit *) Bash(git push *) Bash(git rev-parse *) Bash(git fetch *) Bash(gh pr *) Bash(npm run *)
---

## Current state

Branch: !`git branch --show-current`

Status:
!`git status --short`

Commits not on origin/main:
!`git log origin/main..HEAD --oneline`

Diff stat against origin/main (committed + uncommitted):
!`git diff origin/main --stat`

User notes: $ARGUMENTS

## Instructions

Open a pull request against `main` for the work above. Follow these steps in order and stop to report if any step fails.

### 1. Understand the change

- Read the full diff (`git diff origin/main`, plus any untracked files from the status) before writing anything. The stat above is only an index.
- If there are no uncommitted changes and no commits ahead of `origin/main`, stop and tell the user there is nothing to open a PR for.
- Identify the single purpose of the change. If the diff clearly mixes unrelated work, tell the user and ask whether to proceed with everything or split it, before creating a branch.

### 2. Pick the branch

- **On a branch other than `main`**: use it as-is.
- **On `main`**: create a new branch with `git switch -c <name>`. Uncommitted changes carry over automatically.
  - Name format: `<type>/<short-kebab-description>`, e.g. `feat/app-settings-estimation`, `fix/sync-retry-timeout`, `refactor/games-repository`, `chore/release-workflow`.
  - Types: `feat`, `fix`, `refactor`, `perf`, `chore`, `docs`, `ci`.
  - Keep the description to 2–5 words drawn from what the diff actually does. Use a branch name from the user notes if one was given.
  - If `main` had local commits not on `origin/main`, they are now on the new branch too. Mention this to the user in the final report; do not reset `main`.

### 3. Commit uncommitted work

- Stage files by name, not `git add -A`. Never stage secrets (`.env`, credentials, keys) or build output; if one shows up in the status, leave it out and mention it.
- Match the repo's commit style: a short, lowercase summary of what was done (e.g. `added customizable server API url`). One commit is fine unless the changes are clearly separable.
- Follow any commit attribution instructions currently in effect.

### 4. Verify

Run the checks that apply to the changed areas and record the results for the PR body:

- `server/` changed: `npm run build --prefix server` (type-checks with `tsc --noEmit`).
- `client/` changed: `npm run lint --prefix client` and `npm run build --prefix client`.
- `server/src/sql/` changed: note that the schema changed and whether existing databases need a migration.

If a check fails, stop and show the user the output. Do not open the PR unless they say to proceed anyway, and if they do, list the failure in the PR body.

### 5. Push

`git push -u origin <branch>`.

### 6. Create the PR

- Check for an existing PR first with `gh pr view --json url,state`. If an open one exists for this branch, show its link and ask whether to update its body instead of creating a new one.
- Title: short and imperative, under 70 characters, e.g. `Add release-date estimation to app settings`.
- Write the body to a temporary file in the scratchpad directory and pass it with `--body-file` to avoid shell quoting problems:

  `gh pr create --base main --head <branch> --title "<title>" --body-file <file>`

  Add `--draft` if the user notes ask for a draft.

Use this body structure. Be specific: name the modules, functions, tables, and endpoints that changed, and explain *why* rather than restating the diff line by line.

```markdown
## Purpose

<2–4 sentences: the problem or need, and how this change addresses it. Reference an issue (`Closes #N`) if the user notes give one.>

## Changes

<Grouped by area (e.g. **Server – appSettings**, **Server – sync**, **Database**, **Client**). One bullet per meaningful change, each saying what changed and why.>

## Verification

<Checks run in step 4 and their results, as a checklist:>
- [x] `npm run build --prefix server` passes

<Then numbered manual steps a reviewer can follow to see the change working: what to run, what endpoint or page to hit, what input to use, and what result to expect.>

## Notes

<Optional: schema/migration requirements, new env vars, breaking API changes, follow-ups, known limitations. Omit the section if there is nothing to say.>
```

End the body with any PR attribution line currently in effect.

### 7. Report

Give the user the PR URL, the branch name, and anything they should know (skipped files, failing checks, commits moved off `main`).
