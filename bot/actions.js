const axios = require('axios');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { Transform } = require('stream');
const { pipeline } = require('stream/promises');
const MAX_AUDIO_BYTES = 12 * 1024 * 1024;

async function gerarVoz(bot, chatId, texto, voz, urlPiper) {
    const filePath = path.join(os.tmpdir(), `projetoia-voice-${crypto.randomUUID()}.wav`);
    const textoLimpo = String(texto)
        .replace(/https?:\/\/[^\s]+/g, '')
        .replace(/[#*_`]/g, '')
        .replace(/\n+/g, '. ')
        .replace(/[()]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 3000);

    if (!textoLimpo) {
        await bot.sendMessage(chatId, 'Não há texto para converter em voz.');
        return;
    }

    try {
        await bot.sendChatAction(chatId, 'record_audio').catch(() => {});
        const response = await axios.post(`${urlPiper.replace(/\/+$/, '')}/synthesize`, {
            text: textoLimpo,
            voice: voz,
        }, {
            responseType: 'stream',
            headers: { 'Content-Type': 'application/json' },
            timeout: 90000,
            maxRedirects: 0,
            maxBodyLength: 16 * 1024,
            maxContentLength: MAX_AUDIO_BYTES,
        });

        let received = 0;
        const byteLimit = new Transform({
            transform(chunk, _encoding, callback) {
                received += chunk.length;
                callback(received > MAX_AUDIO_BYTES ? new Error('Áudio acima do limite.') : null, chunk);
            },
        });
        await pipeline(response.data, byteLimit, fs.createWriteStream(filePath, { flags: 'wx', mode: 0o600 }));
        const audio = await fs.promises.stat(filePath);
        if (!audio.isFile() || audio.size === 0 || audio.size > MAX_AUDIO_BYTES) {
            throw new Error('Áudio inválido ou maior que o limite.');
        }
        await bot.sendVoice(chatId, filePath);
    } catch (error) {
        console.error('Erro ao gerar áudio:', error.code || 'PIPER_ERROR');
        await bot.sendMessage(chatId, 'Não consegui gerar o áudio agora. Tente novamente em instantes.').catch(() => {});
    } finally {
        await fs.promises.rm(filePath, { force: true }).catch(() => {});
    }
}

module.exports = { gerarVoz };
