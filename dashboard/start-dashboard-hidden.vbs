' Runs start-dashboard.bat without a console window. Used for "launch on Windows startup".
Set sh = CreateObject("WScript.Shell")
dir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
sh.Run """" & dir & "\start-dashboard.bat""", 0, False
