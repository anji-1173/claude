@echo off
chcp 65001 > nul
cd /d "%~dp0"
title ハル（最初の準備）

if exist ".env" (
  echo.
  echo  合鍵ファイル（.env）は、すでにあります。
  echo  中身を書き直したいときは、このあと開くメモ帳で編集してください。
  echo.
) else (
  copy ".env.example" ".env" > nul
  echo.
  echo  合鍵ファイル（.env）を作りました。
  echo.
)

echo  これからメモ帳が開きます。
echo  1行目の DISCORD_BOT_TOKEN= の右側に、Discord の Bot トークンを貼り付けて、
echo  上書き保存（Ctrl+S）して、メモ帳を閉じてください。
echo.
pause

notepad ".env"

echo.
echo  保存できたら、「ハルを起動.bat」をダブルクリックしてください。
echo.
pause
