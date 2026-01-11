//index.js
require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

// Módulos de Infra e Ação
const checker = require("./checker");
const engine = require("./engine"); // O novo motor que criamos acima
const actions = require("./actions");
const transcriber = require("./transcriber");

const SERVICES = {
    WHISPER: "http://whisper:9000/asr",
    OLLAMA: "http://host.docker.internal:11434/api/generate",
    PIPER: "http://piper:5000",
    SEARCH: "http://searxng:8080/search"
};

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

// Validação Inicial
(async () => {
    console.log("⏳ Validando infraestrutura...");
    await checker.verificarServidores(SERVICES);
    console.log("🚀 JARVIS OPERACIONAL | ALTO PADRÃO");
})();

// --- ENTRADA: TEXTO ---
bot.on("text", (msg) => { 
    if (!msg.text.startsWith("/")) {
        engine.processarIA(bot, msg.text, msg.chat.id, SERVICES);
    }
});

// --- ENTRADA: VOZ ---
bot.on("voice", async (msg) => {
    const chatId = msg.chat.id;
    const pathFile = path.join(__dirname, `temp_${chatId}.ogg`);
    
    try {
        const file = await bot.getFile(msg.voice.file_id);
        const res = await axios({ 
            url: `https://api.telegram.org/file/bot${process.env.TELEGRAM_TOKEN}/${file.file_path}`, 
            responseType: "stream" 
        });
        
        const writer = fs.createWriteStream(pathFile);
        res.data.pipe(writer);
        
        writer.on("finish", async () => {
            try {
                const textoTranscritp = await transcriber.transcrever(pathFile, SERVICES.WHISPER);
                if (textoTranscritp) engine.processarIA(bot, textoTranscritp, chatId, SERVICES);
            } finally {
                if (fs.existsSync(pathFile)) fs.unlinkSync(pathFile);
            }
        });
    } catch (e) {
        bot.sendMessage(chatId, "❌ Erro ao processar áudio.");
    }
});

// --- AÇÕES: BOTÕES ---
bot.on("callback_query", async (q) => {
    const chatId = q.message.chat.id;
    const textoCache = global.ultimaRespostaIA ? global.ultimaRespostaIA[chatId] : null;
    
    if (!textoCache) return bot.answerCallbackQuery(q.id, { text: "Expirado." });

    if (q.data === "t") await bot.sendMessage(chatId, textoCache);
    if (q.data === "v") await actions.gerarVoz(bot, chatId, textoCache, "pt_BR-faber-medium", SERVICES.PIPER);
    
    bot.answerCallbackQuery(q.id);
});