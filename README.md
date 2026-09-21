# Projeto IA

Assistente pessoal para **Telegram** com IA local: transcrição de áudio,
respostas geradas por LLM, busca na web e resposta por voz — tudo orquestrado
com **Docker Compose**.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-local%20LLM-black?style=flat-square)
![Whisper](https://img.shields.io/badge/Whisper-ASR-412991?style=flat-square)
![Piper](https://img.shields.io/badge/Piper-TTS-blue?style=flat-square)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![Status](https://img.shields.io/badge/status-projeto%20pessoal-blue?style=flat-square)

## Sobre

Bot de Telegram que funciona como assistente de IA rodando 100% na máquina do
usuário: recebe mensagens de texto ou áudio, transcreve com Whisper, consulta
um LLM servido pelo Ollama, opcionalmente pesquisa na web via SearXNG e pode
responder com áudio gerado pelo Piper (vozes pt-BR).

O projeto foi montado para rodar em **WSL2 com GPU AMD** (usa DirectML via
`/dev/dxg`), com scripts `.bat` para baixar modelos e instalar o Ollama com
aceleração AMD.

## Funcionalidades

Comprovadas pelo código:

- **Bot Telegram** (`bot/index.js`) com validação de infraestrutura na
  inicialização.
- **Transcrição de áudio** (`bot/transcriber.js`) via serviço Whisper
  (`whisper:9000/asr`, tarefa `transcribe`, idioma `pt`).
- **Motor de conversa** (`bot/engine.js`, `bot/brain.js`) com memória
  (`bot/memory.js`) e ações (`bot/actions.js`).
- **Busca na web** (`bot/searcher.js`) via SearXNG.
- **Voz de resposta** (`bot/actions.js` + `piper/`): geração de WAV com
  limpeza de markdown/links antes da síntese; vozes pt-BR `faber` e `jeff`
  (modelos ONNX incluídos).
- **Infra como código**: `docker-compose.yml` sobe Whisper, Piper, SearXNG,
  Open WebUI e integra o Ollama do host; Dockerfiles próprios em `bot/`,
  `piper/` e `whisper/`.
- **Arquivos de apoio**: `download_model.bat` e `insall_amd_gpu_ollama.bat`
  (Windows/WSL2 + GPU AMD), `requirements.txt`.

## Stack

- **Node.js** (bot Telegram: `node-telegram-bot-api`, axios, dotenv)
- **Python** (serviços Piper/Whisper)
- **Ollama** (LLM local), **OpenAI Whisper** (ASR), **Piper** (TTS),
  **SearXNG** (busca), **Open WebUI** (interface)
- **Docker Compose** (orquestração)

## Como rodar

1. Copie `.env.example` (ou crie `bot/.env`) com:

```bash
TELEGRAM_TOKEN=seu_token_do_botfather
OLLAMA_URL=http://host.docker.internal:11434
```

2. Suba a stack:

```bash
docker compose up -d --build
```

3. Baixe os modelos do Ollama no host (ex.: `ollama pull qwen3.5:0.8b`) —
   ou use `download_model.bat` no Windows.

> Ajuste `SERVICES` em `bot/index.js` se os containers tiverem outros nomes/
> portas. Os modelos `.onnx` do Piper são grandes e ficam versionados aqui
> para facilitar o deploy.

## Estrutura do projeto

```
bot/            # código do bot Telegram (Dockerfile + módulos)
piper/          # serviço de TTS + vozes pt-BR (ONNX)
whisper/        # serviço de transcrição
searxng/        # configuração do buscador
docker-compose.yml
```

## Licença

MIT — veja [LICENSE](LICENSE).
