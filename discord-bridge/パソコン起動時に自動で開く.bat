@echo off
chcp 65001 > nul
cd /d "%~dp0"
title ハル（自動起動の登録）

set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "LINK=%STARTUP%\ハルの受付.lnk"

if exist "%LINK%" (
  echo.
  echo  すでに登録されています。解除しますか？
  echo  解除する場合は Y、そのままにする場合は N を押してください。
  choice /c YN /n
  if errorlevel 2 goto end
  del "%LINK%"
  echo.
  echo  自動起動の登録を解除しました。
  goto end
)

powershell -NoProfile -Command ^
  "$s=(New-Object -ComObject WScript.Shell).CreateShortcut('%LINK%');" ^
  "$s.TargetPath='%~dp0ハルを起動.bat';" ^
  "$s.WorkingDirectory='%~dp0';" ^
  "$s.Description='ハルのDiscord受付';" ^
  "$s.Save()"

echo.
echo  登録しました。次にパソコンを起動したときから、ハルの受付が自動で開きます。
echo  （パソコンを消している間は動きません）

:end
echo.
pause
