require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { Transform } = require('stream');
const { pipeline } = require('stream/promises');

const checker = require('./checker');
const engine = require('./engine');
const actions = require('./actions');
const transcriber = require('./transcriber');
const memory = require('./memory');
const responses = require('./responses');

const TELEGRAM_TOKEN = (process.env.TELEGRAM_TOKEN || '').trim();
const allowedUserIds = new Set((process.env.TELEGRAM_ALLOWED_USER_IDS || '')
    .split(',').map((value) => value.trim()).filter(Boolean));
const MAX_VOICE_BYTES = 20 * 1024 * 1024;
const MAX_VOICE_SECONDS = 180;
const MAX_REQUESTS_PER_MINUTE = 10;
const requestWindows = new Map();
const activeUsers = new Set();
let activeJobs = 0;

if (TELEGRAM_TOKEN.length < 30) throw new Error('Configure um TELEGRAM_TOKEN válido no ambiente.');
if (allowedUserIds.size === 0 || [...allowedUserIds].some((id) => !/^\d{1,20}$/.test(id))) {
    throw new Error('Configure TELEGRAM_ALLOWED_USER_IDS com pelo menos um ID numérico permitido.');
}

function serviceBase(value, fallback, name) {
    const url = new URL(value || fallback);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
        throw new Error(`${name} deve ser uma URL HTTP(S) sem credenciais, query ou fragmento.`);
    }
    return url.toString().replace(/\/$/, '');
}

const ollamaBase = serviceBase(process.env.OLLAMA_URL, 'http://host.docker.internal:11434', 'OLLAMA_URL');
const piperBase = serviceBase(process.env.PIPER_URL, 'http://piper:5000', 'PIPER_URL');
const searchBase = serviceBase(process.env.SEARCH_URL, 'http://searxng:8080', 'SEARCH_URL');
const whisperBase = serviceBase(process.env.WHISPER_URL, 'http://whisper:9000', 'WHISPER_URL');
const SERVICES = {
    WHISPER: `${whisperBase}/transcribe`,
    WHISPER_HEALTH: `${whisperBase}/health`,
    OLLAMA: `${ollamaBase}/api/generate`,
    OLLAMA_HEALTH: `${ollamaBase}/api/tags`,
    PIPER: piperBase,
    PIPER_HEALTH: `${piperBase}/info`,
    SEARCH: `${searchBase}/search`,
};

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

function authorizedUser(from) {
    return from?.id !== undefined && allowedUserIds.has(String(from.id));
}

function isPrivateMessage(message) {
    return message?.chat?.type === 'private' && authorizedUser(message.from);
}

async function sendMessage(chatId, text, options) {
    try { return await bot.sendMessage(chatId, text, options); } catch { return null; }
}

async function runGuarded(message, work) {
    if (!isPrivateMessage(message)) return;
    const userId = String(message.from.id);
    const chatId = message.chat.id;
    if (activeJobs >= 1 || activeUsers.has(userId)) {
        await sendMessage(chatId, 'Já estou processando outra solicitação. Aguarde a resposta atual.');
        return;
    }

    const now = Date.now();
    const window = requestWindows.get(userId) || { startedAt: now, count: 0 };
    if (now - window.startedAt >= 60_000) {
        window.startedAt = now;
        window.count = 0;
    }
    if (window.count >= MAX_REQUESTS_PER_MINUTE) {
        await sendMessage(chatId, 'Você atingiu o limite de solicitações. Aguarde um minuto.');
        return;
    }
    window.count++;
    requestWindows.set(userId, window);
    activeUsers.add(userId);
    activeJobs++;
    try {
        await work(chatId);
    } finally {
        activeUsers.delete(userId);
        activeJobs--;
    }
}

async function handleText(message) {
    if (!isPrivateMessage(message) || typeof message.text !== 'string') return;
    const text = message.text.trim();
    const command = /^\/(start|help|forget)(?:@[A-Za-z0-9_]+)?(?:\s|$)/i.exec(text);
    if (command) {
        if (command[1].toLowerCase() === 'forget') {
            await runGuarded(message, async (chatId) => {
                try {
                    memory.apagarConversa(chatId);
                    responses.clear(String(chatId));
                    await sendMessage(chatId, 'Histórico e pesquisas salvos desta conversa foram apagados.');
                } catch {
                    await sendMessage(chatId, 'Não consegui apagar o histórico salvo.');
                }
            });
        } else {
            await sendMessage(message.chat.id, 'Envie uma mensagem de texto ou áudio. Use /forget para apagar o histórico salvo.');
        }
        return;
    }
    if (text.startsWith('/')) return;
    if (!text) return;
    if (text.length > 4000) {
        await sendMessage(message.chat.id, 'A mensagem é longa demais. Envie até 4.000 caracteres.');
        return;
    }
    await runGuarded(message, (chatId) => engine.processarIA(bot, text, chatId, SERVICES));
}

async function handleVoice(message) {
    if (!isPrivateMessage(message)) return;
    const voice = message.voice;
    if (!voice || (Number(voice.duration) || 0) > MAX_VOICE_SECONDS || (Number(voice.file_size) || 0) > MAX_VOICE_BYTES) {
        await sendMessage(message.chat.id, 'Envie um áudio de voz com até 3 minutos e 20 MB.');
        return;
    }

    await runGuarded(message, async (chatId) => {
        let tempPath;
        try {
            const file = await bot.getFile(voice.file_id);
            const fileSize = Number(file.file_size || voice.file_size || 0);
            const filePath = String(file.file_path || '');
            if (fileSize > MAX_VOICE_BYTES || !/^[A-Za-z0-9_./-]+$/.test(filePath) || filePath.split('/').includes('..')) {
                throw new Error('Arquivo de voz inválido ou acima do limite.');
            }

            tempPath = path.join(os.tmpdir(), `projetoia-voice-${crypto.randomUUID()}.ogg`);
            const encodedPath = filePath.split('/').map(encodeURIComponent).join('/');
            const response = await axios.get(`https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${encodedPath}`, {
                responseType: 'stream',
                timeout: 30_000,
                maxRedirects: 0,
                maxContentLength: MAX_VOICE_BYTES,
            });

            let received = 0;
            const byteLimit = new Transform({
                transform(chunk, _encoding, callback) {
                    received += chunk.length;
                    callback(received > MAX_VOICE_BYTES ? new Error('Áudio acima do limite.') : null, chunk);
                },
            });
            const output = fs.createWriteStream(tempPath, { flags: 'wx', mode: 0o600 });
            await pipeline(response.data, byteLimit, output);

            const transcript = await transcriber.transcrever(tempPath, SERVICES.WHISPER);
            if (!transcript) {
                await sendMessage(chatId, 'Não consegui transcrever esse áudio. Tente novamente com uma gravação mais nítida.');
                return;
            }
            await engine.processarIA(bot, transcript, chatId, SERVICES);
        } catch (error) {
            console.error('Erro ao processar áudio:', error.code || 'VOICE_ERROR');
            await sendMessage(chatId, 'Não consegui processar esse áudio agora. Tente novamente em instantes.');
        } finally {
            if (tempPath) await fs.promises.rm(tempPath, { force: true }).catch(() => {});
        }
    });
}

bot.on('text', (message) => { void handleText(message).catch(() => {}); });
bot.on('voice', (message) => { void handleVoice(message).catch(() => {}); });
bot.on('callback_query', async (query) => {
    const message = query.message;
    const callbackMessage = message ? { ...message, from: query.from } : null;
    if (!isPrivateMessage(callbackMessage) || !['t', 'v'].includes(query.data)) {
        await bot.answerCallbackQuery(query.id, { text: 'Ação indisponível.' }).catch(() => {});
        return;
    }

    const response = responses.get(String(message.chat.id));
    if (!response) {
        await bot.answerCallbackQuery(query.id, { text: 'A resposta expirou. Faça uma nova pergunta.' }).catch(() => {});
        return;
    }
    await bot.answerCallbackQuery(query.id).catch(() => {});
    if (query.data === 't') {
        await sendMessage(message.chat.id, response);
        return;
    }

    await runGuarded(callbackMessage, (chatId) => actions.gerarVoz(bot, chatId, response, 'pt_BR-faber-medium', SERVICES.PIPER));
});

bot.on('polling_error', (error) => {
    console.error('Erro na conexão do Telegram:', error.code || 'POLLING_ERROR');
});

(async () => {
    console.log('⏳ Verificando serviços locais...');
    await checker.verificarServidores(SERVICES);
    await bot.startPolling();
    console.log('🤖 Assistente pronto para os usuários autorizados.');
})().catch((error) => {
    console.error('Falha ao iniciar o bot:', error.code || 'STARTUP_ERROR');
    process.exitCode = 1;
});
