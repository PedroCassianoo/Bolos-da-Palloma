---
name: deploy-sync
description: Verifies changes in the Back-Office Panel (Dashboard, Inventory, Recipes, Orders, VUI), Customer Digital Menu, and API, generates patch notes, commits, and pushes to trigger Vercel deployment.
---

# SaaS Automated Commit, Deploy & Docs Sync Skill

This skill automates the change-verification, documentation-generation, and deploy-triggering workflow for the **Bolos da Palloma** SaaS project. It detects modifications in key system modules and runs the appropriate deploy pipeline.

## System Scopes & Paths

- **Back-Office Panel (Dashboard):** Includes files related to management, stock control, recipe calculations, and VUI.
  - Matches: `painel.html`, `painel.js`, `painel.css`, `estoque.html`, `receitas.html`, `pedidos.html`, and resources under `assets/`.
- **Customer Digital Menu (Cardápio):** The main transactional front of the shop.
  - Matches: `index.html`, `app.js`, `style.css`.
- **Backend / API:** Serverless functions hosted on Vercel.
  - Matches: `api/` directory (e.g., `api/register-sale.js`).
- **System Documentation:** Centralized in the `docs/` directory.
  - Output: `docs/latest_patch_notes.txt` (auto-generated Git diff notes).

## Automated Scripts

The skill provides two platform-specific automation scripts under the `scripts/` folder:
- [deploy-sync.sh](file:///c:/Users/Usuário/Desktop/Bolos%20da%20Palloma/.agents/skills/deploy-sync/scripts/deploy-sync.sh) (for Bash environments like Git Bash, Linux, or Vercel CI/CD hooks).
- [deploy-sync.ps1](file:///c:/Users/Usuário/Desktop/Bolos%20da%20Palloma/.agents/skills/deploy-sync/scripts/deploy-sync.ps1) (for Windows PowerShell terminals).

## Execution Guidelines for the Agent

When requested to deploy, commit, or sync changes, follow these steps:

1. **Verify Local Workspace Status:**
   Run `git status --porcelain` to check if there are unstaged or staged changes.

2. **Categorize Changes:**
   - If changes are detected in dashboard-related files, append `[Dashboard]` to the commit message prefix.
   - If changes are detected in menu-related files, append `[Menu]` to the commit message prefix.
   - If changes are detected in API serverless functions, append `[API]` to the commit message prefix.
   - If no changes are detected, halt the deployment process to avoid wasting CI/CD resources.

3. **Generate Patch Notes:**
   - Run `git diff` and write the output into `docs/latest_patch_notes.txt` to capture the exact code changes made in this cycle.
   - Ensure the `docs/` directory is created if it does not exist.

4. **Stage and Commit:**
   - Stage all files using `git add .`.
   - Formulate the commit message: `feat: system update - [Scopes Affected] <Custom Description>`.
   - Prompt the user to provide a brief description of the fix/feature for the changelog, or auto-generate one if the user asks you to write it.
   - Commit changes: `git commit -m "<Full Message>"`.

5. **Deploy:**
   - Push the committed code to the main remote branch: `git push origin main`.
   - Verify that Vercel triggers the build (as configured in the project settings).

## How to Trigger the Automation Scripts

### Windows (PowerShell)
```powershell
& "c:/Users/Usuário/Desktop/Bolos da Palloma/.agents/skills/deploy-sync/scripts/deploy-sync.ps1"
```

### Git Bash or Linux
```bash
bash "c:/Users/Usuário/Desktop/Bolos da Palloma/.agents/skills/deploy-sync/scripts/deploy-sync.sh"
```
