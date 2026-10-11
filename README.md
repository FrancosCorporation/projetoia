# Projeto IA

Assistente pessoal para Telegram com Ollama, transcrição de áudio, pesquisa na
web e respostas por voz. Os serviços rodam em Docker Compose; o Ollama fica no
host e é acessado pela rede local da máquina.

## O que o projeto faz

- Aceita mensagens de texto e áudio em conversas privadas com usuários
  autorizados por ID numérico.
- Transcreve áudios de até 3 minutos e 20 MB com Whisper no CPU.
- Gera respostas com o modelo configurado no Ollama (padrão: `llama3.2`).
- Consulta SearXNG e pode ler a resposta em voz alta com Piper.
- Mantém um histórico local limitado por conversa. `/forget` apaga o histórico e
  as pesquisas salvas daquele usuário.
- Inclui Open WebUI, acessível no host somente em `127.0.0.1:3000`.

## Requisitos

- Docker Engine com Docker Compose v2.
- Ollama instalado e um modelo baixado no host.
- Um bot criado pelo BotFather e o ID numérico de cada usuário autorizado.
- `openssl` para gerar os segredos do Compose.

## Configuração

1. Crie o arquivo local de ambiente:

   ```bash
   cp .env.example .env
   ```

2. Gere dois valores diferentes com `openssl rand -hex 32`. Preencha
   `SEARXNG_SECRET` e `OPEN_WEBUI_SECRET_KEY` com esses valores.

3. Preencha `TELEGRAM_TOKEN` com o token do BotFather e
   `TELEGRAM_ALLOWED_USER_IDS` com os IDs numéricos permitidos, separados por
   vírgulas. O bot ignora mensagens de grupos e de outros usuários.

4. Instale/abra o Ollama no host, baixe o modelo configurado e confira o
   endereço que os containers devem usar:

   ```bash
   ollama pull llama3.2
   ```

   O padrão é `http://host.docker.internal:11434`. Ajuste `OLLAMA_URL` no `.env`
   se o Ollama estiver em outro endereço. Em Windows, o script
   `install_amd_gpu_ollama.ps1` configura o Ollama para aceitar conexões dos
   containers. Restrinja a porta TCP 11434 pelo Firewall do Windows à rede
   Docker/WSL; não a exponha à internet.

## Iniciar

```bash
docker compose up -d --build
docker compose logs -f bot
```

Na primeira inicialização, o container baixa o modelo Whisper indicado por
`WHISPER_MODEL` (padrão `small`). O download fica no volume persistente
`whisper_models`. A inferência do Whisper nesta stack usa CPU; a configuração do
Ollama no host pode usar a GPU disponível para o modelo de linguagem.

Abra <http://127.0.0.1:3000> para usar o Open WebUI. Os outros serviços não têm
portas publicadas no host e são acessíveis apenas pela rede interna do Compose.

No Telegram, envie uma mensagem de texto ou áudio. `/help` mostra os comandos e
`/forget` apaga o histórico local da conversa. O bot limita tamanho e frequência
das solicitações e processa uma solicitação por vez.

## Dados e privacidade

- Mensagens e áudios enviados ao bot passam pelos servidores do Telegram.
- O texto da busca é enviado pelo SearXNG aos mecanismos de busca configurados.
- O conteúdo da conversa e as transcrições são processados localmente pelo
  Ollama e pelo Whisper; o histórico limitado é salvo no volume `bot_memory`.
- O Open WebUI salva seus dados no volume `open_webui_data`.
- `docker compose down` mantém os volumes. `docker compose down -v` também os
  apaga, incluindo o histórico do bot, os modelos baixados e os dados do WebUI.
- O arquivo `.env` contém credenciais e não deve ser compartilhado nem commitado.

## Arquivos úteis

- `docker-compose.yml`: serviços, portas, volumes e limites de rede.
- `.env.example`: nomes das variáveis necessárias.
- `SECURITY.md`: configuração segura, retenção de dados e reporte de falhas.
- `download_model.bat`: baixa os arquivos da voz Faber pt-BR para Piper.
- `install_amd_gpu_ollama.ps1`: instala o Ollama no Windows e baixa o modelo
  padrão.

## Licenças

O arquivo [LICENSE](LICENSE) cobre o código deste projeto. O container usa
Piper `piper-tts` 1.8.0, licenciado separadamente sob GPL-3.0-or-later ([registro
no PyPI](https://pypi.org/project/piper-tts/1.8.0/)). Os modelos de voz têm
licenças próprias; o modelo Faber pt-BR incluído está marcado como MIT em sua
[página no Hugging Face](https://huggingface.co/rhasspy/piper-voices/blob/main/pt/pt_BR/faber/medium/pt_BR-faber-medium.onnx).
