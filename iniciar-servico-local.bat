@echo off
title Daemon LLM Local - Bolos da Palloma
cd /d "%~dp0"

echo.
echo =======================================================
echo   Daemon IA Local - Bolos da Palloma
echo =======================================================
echo.

:: Aguarda 20 segundos para o Ollama terminar de subir ao iniciar com o Windows
echo [1/3] Aguardando o Ollama inicializar (20 segundos)...
timeout /t 20 /nobreak > nul

:: Verifica se o Ollama esta respondendo antes de continuar
echo [2/3] Verificando se o Ollama esta ativo...
:WAIT_OLLAMA
curl -s http://localhost:11434/api/tags > nul 2>&1
if %errorlevel% neq 0 (
    echo     Ollama ainda nao esta pronto. Aguardando mais 5 segundos...
    timeout /t 5 /nobreak > nul
    goto WAIT_OLLAMA
)
echo     Ollama detectado e pronto!

:: Inicia o daemon
echo [3/3] Iniciando o Daemon de IA...
echo.
echo =======================================================
echo   Servico iniciado! Minimize esta janela.
echo   NAO FECHE este terminal enquanto usar o audio.
echo =======================================================
echo.
node scripts/local-llm-daemon.js

echo.
echo =======================================================
echo   O servico foi encerrado ou falhou ao iniciar.
echo   Verifique se o Ollama esta aberto e tente novamente.
echo =======================================================
pause
