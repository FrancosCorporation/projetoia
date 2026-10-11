const memory = require('./memory');
const searcher = require('./searcher');
const brain = require('./brain');
const cleaner = require('./cleaner');
const responses = require('./responses');

const greetings = ['oi', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'e aí', 'como está', 'como vai', 'tudo bem', 'tudo certo'];
const internalQuestions = ['o que conversamos', 'minha última pergunta', 'qual foi nosso papo'];
const compactMemoryPhrases = ['limpe seu histórico', 'esqueça o que falamos', 'resuma a conversa', 'otimizar memória'];
const MAX_REPLY_CHARS = 3800;

async function processarIA(bot, texto, chatId, services) {
  let statusMessage;
  try {
    const userText = String(texto).trim().slice(0, 4000);
    const textLow = userText.toLowerCase();

    if (greetings.some((greeting) => textLow.includes(greeting))) {
      const greetingsReply = [
        'Tudo em ordem por aqui. No que posso ajudar?',
        'Estou pronto para ajudar. O que você precisa?',
        'Sistemas operacionais. Qual é a próxima tarefa?',
      ];
      await bot.sendMessage(chatId, greetingsReply[Math.floor(Math.random() * greetingsReply.length)]);
      return;
    }

    try { await bot.sendChatAction(chatId, 'typing'); } catch {}
    statusMessage = await bot.sendMessage(chatId, '💭 Analisando sua mensagem...');

    const history = memory.lerConversa(chatId);
    if (compactMemoryPhrases.some((phrase) => textLow.includes(phrase))) {
      const summary = await brain.pensar(userText, '', history, services.OLLAMA, chatId, 'resumo');
      memory.atualizarHistorico(chatId, summary);
      if (statusMessage) await bot.deleteMessage(chatId, statusMessage.message_id).catch(() => {});
      await bot.sendMessage(chatId, '🧹 Resumi o histórico salvo desta conversa.');
      return;
    }

    let webContext = '';
    if (!internalQuestions.some((phrase) => textLow.includes(phrase))) {
      webContext = await searcher.buscar(userText, services.SEARCH);
      memory.salvarPesquisa(chatId, userText, webContext);
    }

    const answer = String(await brain.pensar(userText, webContext, history, services.OLLAMA, chatId, 'estrategista'))
      .trim().slice(0, MAX_REPLY_CHARS);
    if (!answer) throw new Error('A resposta veio vazia.');

    memory.salvarConversa(chatId, userText, answer);
    responses.set(String(chatId), answer);

    if (statusMessage) await bot.deleteMessage(chatId, statusMessage.message_id).catch(() => {});
    await bot.sendMessage(chatId, 'Pronto. Como quer receber a resposta?', {
      reply_markup: {
        inline_keyboard: [[
          { text: '📝 Texto', callback_data: 't' },
          { text: '🔊 Voz', callback_data: 'v' },
        ]],
      },
    });
    setTimeout(() => cleaner.flashRAM(), 5000).unref?.();
  } catch (error) {
    console.error('Erro ao processar mensagem:', error.code || 'ENGINE_ERROR');
    if (statusMessage) await bot.deleteMessage(chatId, statusMessage.message_id).catch(() => {});
    await bot.sendMessage(chatId, 'Não consegui processar essa mensagem agora. Tente novamente em instantes.').catch(() => {});
  }
}

module.exports = { processarIA };
