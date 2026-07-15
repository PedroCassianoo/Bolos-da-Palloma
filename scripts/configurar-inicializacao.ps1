# ==========================================================================
# CONFIGURAR-INICIALIZACAO.PS1 — Configura Autostart no Windows
# ==========================================================================

$WshShell = New-Object -ComObject WScript.Shell
$StartupFolder = [System.IO.Path]::Combine($env:APPDATA, "Microsoft\Windows\Start Menu\Programs\Startup")
$ShortcutPath = Join-Path $StartupFolder "Daemon-LLM-Local.lnk"

# Localiza o arquivo .bat no diretório raiz
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$TargetBat = Resolve-Path (Join-Path $ScriptDir "../iniciar-servico-local.bat")

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   Configurando Inicializacao Automatica do Daemon LLM" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Criando atalho na pasta de Inicializacao..."
Write-Host "-> Atalho: $ShortcutPath"
Write-Host "-> Alvo: $TargetBat"

try {
    $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
    $Shortcut.TargetPath = $TargetBat.Path
    $Shortcut.WorkingDirectory = (Split-Path -Parent $TargetBat.Path)
    $Shortcut.Description = "Inicia o Daemon de conexao da LLM Local para o Bolos da Palloma"
    $Shortcut.WindowStyle = 7 # Abre MINIMIZADO para nao perturbar o usuario na inicializacao
    $Shortcut.Save()

    Write-Host ""
    Write-Host "✅ SUCESSO: O atalho foi criado com sucesso!" -ForegroundColor Green
    Write-Host "O servico agora sera iniciado de forma silenciosa (minimizado)" -ForegroundColor Green
    Write-Host "sempre que voce ligar o computador e fizer login no Windows." -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "❌ ERRO: Nao foi possivel criar o atalho de inicializacao." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
Write-Host "==========================================================" -ForegroundColor Cyan
