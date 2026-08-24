@echo off
chcp 65001 > nul
cd /d "%~dp0"
title ハル（Discord受付）

if not exist ".env" (
  echo.
  echo  合鍵ファイル（.env）がまだありません。
  echo  「最初の準備.bat」をダブルクリックしてください。
  echo.
  pause
  exit /b 1
)

where node > nul 2>&1
if errorlevel 1 (
  echo.
  echo  Node.js が見つかりませんでした。
  echo  ハルに「橋を動かすのに Node が要る」と伝えてください。
  echo.
  pause
  exit /b 1
)

echo.
echo  ハルの受付を開きます。この画面は閉じないでください。
echo  やめるときは、この画面で Ctrl+C を押すか、画面を閉じてください。
echo.

node bridge.mjs
echo.
echo  受付を終了しました。
pause
