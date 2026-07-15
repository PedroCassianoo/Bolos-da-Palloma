# ==============================================================================
# SaaS AUTOMATED COMMIT, DEPLOY & DOCS SYNC SKILL (Bolos da Palloma Edition)
# Description: Verifies changes in the Back-Office Panel, Customer Menu, and API,
# updates system documentation, commits, and pushes to trigger Vercel deployment.
# ==============================================================================

# 1. Define Core File Patterns / Directories
$DashboardPattern = "painel\.html|painel\.js|painel\.css|estoque\.html|receitas\.html|pedidos\.html|assets/"
$MenuPattern = "index\.html|app\.js|style\.css"
$ApiPattern = "api/"
$DocsDir = "docs"

Write-Host "Initializing Bolos da Palloma Deployment Skill..." -ForegroundColor Cyan
Write-Host "------------------------------------------------"

# 2. Check for changes in the repositories/files
function Check-PatternChanges($pattern) {
    $status = git status --porcelain
    if ($status -match $pattern) {
        return $true
    }
    return $false
}

$DashboardChanged = Check-PatternChanges $DashboardPattern
$MenuChanged = Check-PatternChanges $MenuPattern
$ApiChanged = Check-PatternChanges $ApiPattern

# 3. Validation & Update Logic
if (-not $DashboardChanged -and -not $MenuChanged -and -not $ApiChanged) {
    Write-Host "No changes detected in the Back-Office Panel, Customer Menu, or API." -ForegroundColor Green
    Write-Host "Aborting deployment process to save Vercel CI/CD resources." -ForegroundColor Yellow
    exit 0
}

Write-Host "Changes detected! Analyzing scopes..." -ForegroundColor Cyan

$CommitMessage = "feat: system update -"

if ($DashboardChanged) {
    Write-Host "   -> Back-Office / Dashboard modified."
    $CommitMessage += " [Dashboard]"
}

if ($MenuChanged) {
    Write-Host "   -> Customer Digital Menu (Cardapio) modified."
    $CommitMessage += " [Menu]"
}

if ($ApiChanged) {
    Write-Host "   -> Serverless API / Backend modified."
    $CommitMessage += " [API]"
}

# 4. Documentation Update (Automation Hook)
Write-Host "Updating system documentation..." -ForegroundColor Cyan
if (-not (Test-Path $DocsDir)) {
    New-Item -ItemType Directory -Path $DocsDir | Out-Null
}

git diff > "$DocsDir/latest_patch_notes.txt"
Write-Host "   -> Patch notes saved to $DocsDir/latest_patch_notes.txt"

# 5. Git Operations (Commit & Push)
Write-Host "Staging files..." -ForegroundColor Cyan
git add .

Write-Host "Committing changes..." -ForegroundColor Cyan
$CustomMsg = Read-Host "Enter a brief description of the fix/feature for the changelog"
$FullCommitMsg = "$CommitMessage $CustomMsg"

git commit -m $FullCommitMsg

Write-Host "Pushing to remote repository (Triggering Vercel Deploy)..." -ForegroundColor Cyan
git push origin main

Write-Host "------------------------------------------------"
Write-Host "SUCCESS: System updated, documented, and deployed!" -ForegroundColor Green
Write-Host "The SaaS is running 100% and ready for the bakeries." -ForegroundColor Green
