@echo off
setlocal enabledelayedexpansion

rem Loop user IDs from 0 to 4
for /L %%i in (0,1,4) DO (
    echo ================================
    echo Launching user %%i in new window
    echo ================================

    rem Replace user.js with export default %%i
    echo export default %%i; > user.js

    rem Launch Node in a new window
    start "User %%i" cmd /k "node ."
)

endlocal
