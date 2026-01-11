//index.js
require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

// Mantendo seus módulos originais
const checker = require("./checker");
const engine = require("./engine"); 
const actions = require("./actions");
const transcriber = require("./transcriber");
const voiceMaster = require("./voice_master"); // Adicionado para suporte ao TikTok Voice se desejar

// Seus serviços Docker preservados
const SERVICES = {
    WHISPER: process.env.WHISPER_URL || "http://whisper:9000/asr",
    OLLAMA: process.env.OLLAMA_URL || "http://host.docker.internal:11434/api/generate",
    PIPER: process.env.PIPER_URL || "http://piper:5000",
    SEARCH: process.env.SEARCH_URL || "http://searxng:8080/search"
};

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

// Validação Inicial (Mantida)
(async () => {
    console.log("⏳ Validando infraestrutura Docker...");
    await checker.verificarServidores(SERVICES);
    console.log("🚀 JARVIS OPERACIONAL | ALTO PADRÃO");
})();

// --- ENTRADA: TEXTO ---
bot.on("text", (msg) => { 
    if (!msg.text.startsWith("/")) {
        // Agora passa o SERVICES para a engine decidir se usa Ollama ou Factory
        engine.processarIA(bot, msg.text, msg.chat.id, SERVICES);
    }
});

// --- ENTRADA: VOZ (Mantida com sua lógica de Stream) ---
bot.on("voice", async (msg) => {
    const chatId = msg.chat.id;
    const pathFile = path.join(__dirname, `temp_${chatId}.ogg`);
    
    try {
        bot.sendChatAction(chatId, 'typing');
        const file = await bot.getFile(msg.voice.file_id);
        const res = await axios({ 
            url: `https://api.telegram.org/file/bot${process.env.TELEGRAM_TOKEN}/${file.file_path}`, 
            responseType: "stream" 
        });
        
        const writer = fs.createWriteStream(pathFile);
        res.data.pipe(writer);
        
        writer.on("finish", async () => {
            try {
                // Usa o seu transcrever atual
                const textoTranscritp = await transcriber.transcrever(pathFile, SERVICES.WHISPER);
                if (textoTranscritp) {
                    console.log(`🎤 Voz Transcrita: ${textoTranscritp}`);
                    engine.processarIA(bot, textoTranscritp, chatId, SERVICES);
                }
            } finally {
                if (fs.existsSync(pathFile)) fs.unlinkSync(pathFile);
            }
        });
    } catch (e) {
        console.error("Erro voz:", e);
        bot.sendMessage(chatId, "❌ Erro ao processar áudio.");
    }
});

// --- AÇÕES: BOTÕES (Corrigido para não expirar rápido) ---
bot.on("callback_query", async (q) => {
    const chatId = q.message.chat.id;
    // Busca do cache global que definimos na engine
    const textoCache = global.ultimaRespostaIA ? global.ultimaRespostaIA[chatId] : null;
    
    if (!textoCache) {
        return bot.answerCallbackQuery(q.id, { text: "Sessão expirada ou cache limpo.", show_alert: true });
    }

    if (q.data === "t") {
        await bot.sendMessage(chatId, `📝 **Texto completo:**\n\n${textoCache}`);
    } 
    
    if (q.data === "v") {
        bot.answerCallbackQuery(q.id, { text: "Preparando áudio..." });
        // Aqui você pode escolher entre usar o seu PIPER (Docker) ou o TikTok Voice
        // Vamos usar o Piper para manter sua infra:
        await actions.gerarVoz(bot, chatId, textoCache, "pt_BR-faber-medium", SERVICES.PIPER);
    }
    
    bot.answerCallbackQuery(q.id);
});