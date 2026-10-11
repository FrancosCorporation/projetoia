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

## Verificação pendente

- [ ] Fazer uma inicialização manual em uma máquina configurada com Docker,
  Ollama e token autorizado do Telegram; validar texto, áudio, `/forget` e voz.
- [ ] Confirmar regras do Firewall do Windows se o script de instalação do
  Ollama for usado com Docker/WSL.
- [ ] Fazer rotação de tokens ou segredos caso algum valor real tenha sido
  publicado antes desta revisão.

Os checks estáticos e a revisão do diff são registrados no histórico desta
execução. Testes e chamadas aos serviços externos não foram executados.
