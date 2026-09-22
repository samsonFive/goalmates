# GoalMates — Windows / GitHub Setup

## 1. Create the working directory
In PowerShell, choose your normal development parent directory:

```powershell
cd C:\Users\<YOU>\source\repos
mkdir goalmates
cd goalmates
```

Extract the contents of the GoalMates starter package **into this directory**. `AGENTS.md` should end up at the repo root, not inside a second nested `goalmates-starter` folder.

## 2. Add the licensed local references
Extract/copy the TaskPilot source under:

```text
reference-assets/taskpilot/
```

and Dason under:

```text
reference-assets/dason/
```

These folders are gitignored except for `.gitkeep` placeholders.

## 3. Initialize Git
```powershell
git init
git branch -M main
git status --ignored
```

Verify the licensed TaskPilot/Dason files appear as **ignored**, not staged/untracked source to commit.

## 4. First local commit
```powershell
git add .
git status
git commit -m "docs: establish GoalMates product mission"
```

Before committing, make sure `git status` does not show licensed kit contents or secrets.

## 5. Create private GitHub repository
If GitHub CLI is installed:

```powershell
gh auth status
gh repo create goalmates --private --source=. --remote=origin
git push -u origin main
```

If the repo already exists on GitHub, add its remote instead:

```powershell
git remote add origin <YOUR-GITHUB-REPO-URL>
git push -u origin main
```

## 6. Application runtime
This machine needed a user-space Node 22 zip when `winget` could not elevate. If `node` is not on PATH:

```powershell
$env:PATH = "$env:LOCALAPPDATA\goalmates-tools\node;$env:PATH"
```

Then `npm install`, `npx prisma migrate dev`, `npm run db:seed`, and `npm run dev`.

## 7. Open in Cursor
```powershell
cursor .
```

Start a new agent session and paste the contents/instruction from `KICKOFF-PROMPT.md`, or simply instruct the agent:

> Read `AGENTS.md` first, then execute `KICKOFF-PROMPT.md`. Read all repository specs before mutation and continue through implementation rather than stopping after planning.

## 8. Grok / second-agent use
Give the second agent the same repository and require it to read `AGENTS.md`. Prefer assigning it a clearly bounded complementary role (architecture review, test/QA adversary, capture pipeline review, or design-system implementation) rather than having two agents mutate the same files simultaneously without coordination.
