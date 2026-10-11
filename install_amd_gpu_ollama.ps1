# Baixar o instalador recomendado pelo tutorial da AMD
Invoke-WebRequest -Uri "https://ollama.com/download/OllamaSetup.exe" -OutFile "$env:TEMP\OllamaSetup.exe"

# Instalar o Ollama
Start-Process -FilePath "$env:TEMP\OllamaSetup.exe" -Wait

# Configurar para o Docker conseguir falar com o Windows (Bryan -> GPU)
# O Ollama precisa escutar na interface do host para o Docker alcançá-lo.
# Restrinja a porta TCP 11434 no Firewall do Windows à rede Docker/WSL.
[Environment]::SetEnvironmentVariable("OLLAMA_HOST", "0.0.0.0", "User")
$env:OLLAMA_HOST = "0.0.0.0"

# Abrir o Ollama e baixar o modelo Llama 3.2 (como no site da AMD)
Start-Process -FilePath "$env:LOCALAPPDATA\Ollama\ollama app.exe"
Start-Sleep -Seconds 5
ollama pull llama3.2
