@echo off
setlocal

set "FOLDER=piper"
set "MODEL_NAME=pt_BR-faber-medium"
set "MODEL_TMP=%FOLDER%\%MODEL_NAME%.onnx.part"
set "CONFIG_TMP=%FOLDER%\%MODEL_NAME%.onnx.json.part"

if not exist "%FOLDER%" mkdir "%FOLDER%"

echo Baixando a voz pt-BR Faber medium para o serviço Piper...
curl.exe --fail --location --retry 3 --output "%MODEL_TMP%" "https://huggingface.co/rhasspy/piper-voices/resolve/main/pt/pt_BR/faber/medium/pt_BR-faber-medium.onnx"
if errorlevel 1 goto :failed

curl.exe --fail --location --retry 3 --output "%CONFIG_TMP%" "https://huggingface.co/rhasspy/piper-voices/resolve/main/pt/pt_BR/faber/medium/pt_BR-faber-medium.onnx.json"
if errorlevel 1 goto :failed

move /Y "%MODEL_TMP%" "%FOLDER%\%MODEL_NAME%.onnx" >nul
move /Y "%CONFIG_TMP%" "%FOLDER%\%MODEL_NAME%.onnx.json" >nul
echo Voz instalada em %FOLDER%.
exit /b 0

:failed
del /Q "%MODEL_TMP%" "%CONFIG_TMP%" 2>nul
echo Falha ao baixar a voz. Os arquivos incompletos foram removidos.
exit /b 1
