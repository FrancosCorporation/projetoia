// actions.js
const axios = require("axios");
const fs = require("fs");
const path = require("path");

async function gerarVoz(bot, chatId, texto, voz, urlPiper) {
    const filePath = path.join(__dirname, `voice_${chatId}_${Date.now()}.wav`);

    try {
        console.log(`[PIPER] Iniciando limpeza e geração para o chat ${chatId}...`);
        await bot.sendChatAction(chatId, "record_audio");

        // --- AQUI ENTRA A LIMPEZA PESADA ---
        const textoLimpo = texto
            .replace(/(https?:\/\/[^\s]+)/g, '') // Remove links (isso mata o áudio do Piper)
            .replace(/[#*_\-]/g, '')             // Remove formatação Markdown
            .replace(/\n+/g, '. ')                // Troca quebras de linha por pontos (melhora a dicção)
            .replace(/[()]/g, '')                 // Remove parênteses
            .replace(/\s+/g, ' ')                 // Remove espaços duplos
            .trim();

        const response = await axios({
            method: "post",
            url: urlPiper,
            data: { text: textoLimpo }, 
            responseType: "stream",
            headers: { 'Content-Type': 'application/json' }, 
            timeout: 60000
        });

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });

        if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
            await bot.sendVoice(chatId, filePath);
            console.log(`✅ Áudio enviado com sucesso.`);
        } else {
            throw new Error("Arquivo de áudio gerado está vazio.");
        }

    } catch (e) {
        console.error("❌ Erro no Piper:", e.response?.data || e.message);
        bot.sendMessage(chatId, "❌ Erro ao converter para voz. Verifique se o texto não é longo demais.");
    } finally {
        if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (err) { }
        }
    }
}

module.exports = { gerarVoz };