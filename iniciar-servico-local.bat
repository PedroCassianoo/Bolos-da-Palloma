@echo off
title Daemon LLM Local - Bolos da Palloma
cd /d "%~dp0"
echo.
echo =======================================================
echo   Iniciando Daemon de Conexao da LLM Local...
echo =======================================================
echo.
node scripts/local-llm-daemon.js
echo.
echo =======================================================
echo   O servico foi encerrado ou falhou ao iniciar.
echo =======================================================
pause
