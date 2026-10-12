# Registro de melhorias

## Implementado nesta revisão

- [x] Exigir token do Telegram e allowlist de IDs; aceitar somente conversas
  privadas autorizadas.
- [x] Limitar tamanho e frequência de mensagens e áudios, e impedir trabalhos
  simultâneos no bot.
- [x] Corrigir as integrações Whisper (`/transcribe`, campo `file`) e Piper
  (`/synthesize`) para corresponder às APIs dos serviços.
- [x] Limitar memória, arquivos temporários e respostas; adicionar `/forget` e
  expiração dos botões de resposta.
- [x] Executar serviços sem portas públicas desnecessárias, com segredos
  obrigatórios, volumes persistentes e containers sem privilégios adicionais.
- [x] Corrigir a URL do Ollama no Open WebUI e documentar o acesso por loopback.
- [x] Alinhar dependências, lockfile, imagens dos containers e modelos de voz.
- [x] Corrigir instruções de instalação, esclarecer o uso de CPU pelo Whisper e
  documentar privacidade e licenças.
- [x] Adicionar verificações estáticas automatizadas para JavaScript, Python,
  dependências e configuração do Compose.
- [x] Fixar o runner Ubuntu e validar a CI em Node 22 e 24 com Actions atuais.

## Verificação pendente

- [ ] Fazer uma inicialização manual em uma máquina configurada com Docker,
  Ollama e token autorizado do Telegram; validar texto, áudio, `/forget` e voz.
- [ ] Confirmar regras do Firewall do Windows se o script de instalação do
  Ollama for usado com Docker/WSL.
- [ ] Fazer rotação de tokens ou segredos caso algum valor real tenha sido
  publicado antes desta revisão.

Os checks estáticos e a revisão do diff são registrados no histórico desta
execução. Testes e chamadas aos serviços externos não foram executados.

## DEVOPS-02 — CI previsível

O workflow agora usa `ubuntu-24.04`, `actions/checkout@v7`,
`actions/setup-node@v7` e `actions/setup-python@v7`. A checagem Node cobre 22 e
24, alinhados ao mínimo `>=22` do pacote. Commit `4163a45` foi validado pela CI
`38195552819`, que passou nos dois jobs. Checks locais (`npm run check`, audit 0,
AST Python, parse YAML, Compose config com env descartável e diff check)
passaram. Nenhum teste, container, Ollama, Whisper ou API do Telegram foi
iniciado.
