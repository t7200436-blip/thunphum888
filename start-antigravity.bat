@echo off
    echo Starting Antigravity in VS Code...
    start "" code .
    timeout /t 2 >nul
    code --command "workbench.action.terminal.new"
    echo Type 'agy' in the terminal to chat with me!
    pause