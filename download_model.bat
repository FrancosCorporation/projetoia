@echo off
set "FOLDER=piper"

if not exist "%FOLDER%" (
    echo Criando pasta %FOLDER%...
    mkdir "%FOLDER%"
)

echo.
echo === Baixando modelos do Piper para dentro de /%FOLDER% ===
echo.

curl -L --user-agent "Mozilla/5.0" -o "%FOLDER%/voz.onnx" "https://huggingface.co/rhasspy/piper-voices/resolve/main/pt/pt_BR/felipe/low/pt_BR-felipe-low.onnx"
curl -L --user-agent "Mozilla/5.0" -o "%FOLDER%/voz.onnx.json" "https://huggingface.co/rhasspy/piper-voices/resolve/main/pt/pt_BR/felipe/low/pt_BR-felipe-low.onnx.json"

echo.
echo === Download concluido! ===
echo Verifique os arquivos em: %cd%/%FOLDER%
pause