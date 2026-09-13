@echo off
echo Starting MongoDB Windows Service with Administrator Privileges...
powershell -Command "Start-Process cmd -ArgumentList '/c net start MongoDB' -Verb RunAs"
echo If you saw a UAC popup, please click 'Yes'.
pause
