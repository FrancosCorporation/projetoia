# Segurança

## Configuração segura

- Use uma cópia local de `.env.example`; nunca coloque tokens ou segredos reais
  no Git. Gere `SEARXNG_SECRET` e `OPEN_WEBUI_SECRET_KEY` com valores aleatórios
  independentes.
- Preencha `TELEGRAM_ALLOWED_USER_IDS` somente com os IDs numéricos confiáveis.
  O bot aceita apenas conversas privadas desses usuários.
- O Compose publica somente o Open WebUI, em `127.0.0.1:3000`. Whisper, Piper,
  SearXNG e Valkey não publicam portas no host.
- O exemplo aponta para `host.docker.internal:11434`. Se o Ollama precisar
  escutar em `0.0.0.0` para aceitar conexões do Docker/WSL, restrinja TCP 11434
  no firewall do host à rede local de containers. Não crie encaminhamento de
  porta do roteador para essa porta.
- Para acesso remoto ao Open WebUI, use uma VPN ou um proxy com TLS e
  autenticação forte. Não remova o bind de loopback sem configurar essas
  proteções.

## Dados processados

- Telegram recebe as mensagens e os áudios enviados ao bot.
- O texto das pesquisas é encaminhado pelo SearXNG aos mecanismos habilitados.
- O Ollama, o Whisper e o Piper recebem dados pela rede Docker local. O bot
  também salva um histórico limitado e pesquisas em arquivos com permissões
  restritas no volume `bot_memory`.
- Use `/forget` para apagar o histórico e as pesquisas de uma conversa. Para
  apagar todos os dados e modelos persistidos, pare a stack com
  `docker compose down -v`; isso também remove os dados do Open WebUI.
- Backups dos volumes contêm dados de conversa. Proteja-os como dados pessoais.

## Limites e resposta a incidentes

O bot limita cada áudio a 20 MB e 3 minutos, limita texto, restringe a frequência
de solicitações e processa uma solicitação por vez. Esses controles reduzem
abuso acidental, mas não substituem firewall, atualização das imagens e proteção
das credenciais do host.

Se um token ou segredo for exposto, revogue ou gere outro no serviço de origem,
atualize `.env` e reinicie os containers. Para relatar uma falha, abra primeiro
um contato privado com o mantenedor do repositório e evite publicar credenciais,
áudios ou detalhes que permitam explorar a falha.

## Dependências e licenças

As imagens Docker e os modelos são fornecidos por projetos externos e têm ciclos
de atualização próprios. Revise suas versões e licenças antes de publicar a
stack ou redistribuir os artefatos. A licença MIT deste repositório não altera
os termos de dependências ou modelos incluídos.
