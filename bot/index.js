require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

// Fix para ambiente Docker
if (typeof File === 'undefined') { 
    global.File = class extends Blob {
        constructor(parts, filename, options = {}) {
            super(parts, options);
            this.name = filename;
            this.lastModified = Date.now();
        }
    }; 
}

// Configurações de URL
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const SERVICES = {
    WHISPER: "http://whisper:9000/transcribe",
    OLLAMA: "http://ollama:11434/api/generate",
    PIPER: "http://piper:5000/",
    SEARCH: "http://searxng:8080/search"
};

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
let configVoz = {}; 

// --- 1. FUNÇÃO DE CHECK DE SAÚDE (A NOVIDADE) ---
async function verificarServidores() {
    console.log("\n🔍 Verificando integridade dos serviços...");
    
    const checks = [
        { nome: "Whisper (Voz -> Texto)", url: "http://whisper:9000/" },
        { nome: "Ollama (Cérebro IA)", url: "http://ollama:11434/" },
        { nome: "Piper (Texto -> Voz)", url: SERVICES.PIPER },
        { nome: "SearXNG (Internet)", url: SERVICES.SEARCH }
    ];

    for (const servico of checks) {
        try {
            // O SearXNG a gente testa com uma busca vazia ou apenas o status da porta
            await axios.get(servico.url, { timeout: 5000, validateStatus: false });
            console.log(`✅ ${servico.nome}: ONLINE`);
        } catch (e) {
            console.log(`❌ ${servico.nome}: OFFLINE (Verifique o Docker)`);
        }
    }
    console.log("-------------------------------------------\n");
}

// --- 2. AGENTE DE BUSCA WEB ---
async function buscarNaWeb(termo) {
    try {
        console.log(`🌐 Pesquisando na web: ${termo}`);
        const res = await axios.get(SERVICES.SEARCH, {
            params: { q: termo, format: "json", language: "pt-BR" },
            headers: { "User-Agent": "Mozilla/5.0 Chrome/120.0.0.0" },
            timeout: 15000
        });
        
        if (res.data?.results?.length > 0) {
            return res.data.results.slice(0, 4).map(r => `Fonte: ${r.title}\n${r.content}`).join("\n\n");
        }
        return "Nenhum resultado recente na web.";
    } catch (e) {
        console.error("⚠️ Falha na busca web, seguindo apenas com IA interna.");
        return "Serviço de busca temporariamente indisponível.";
    }
}

// --- 3. PROCESSAMENTO PRINCIPAL ---
async function processarIA(textoUsuario, chatId) {
    try {
        const comandoTexto = textoUsuario.toLowerCase();

        // Comandos de voz
        if (comandoTexto.includes("trocar para jeff")) {
            configVoz[chatId] = "pt_BR-jeff-medium";
            return bot.sendMessage(chatId, "✅ Voz: Jeff");
        } 
        if (comandoTexto.includes("trocar para faber")) {
            configVoz[chatId] = "pt_BR-faber-medium";
            return bot.sendMessage(chatId, "✅ Voz: Faber");
        }

        bot.sendChatAction(chatId, "typing");
        const statusMsg = await bot.sendMessage(chatId, "🌐 Consultando a internet...");

        const contextoWeb = await buscarNaWeb(textoUsuario);
        console.log(contextoWeb);

        await bot.editMessageText("🧠 Criando estratégia baseada nos dados...", { 
            chat_id: chatId, message_id: statusMsg.message_id 
        });
        
        const promptFinal = `CONTEXTO WEB:\n${contextoWeb}\n\nPERGUNTA:\n${textoUsuario}\n\nResponda como um líder estrategista em PT-BR.`;

        const res = await axios.post(SERVICES.OLLAMA, { 
            model: "llama3", prompt: promptFinal, stream: false 
        }, { timeout: 180000 });

        const respostaIA = res.data.response;
        global.ultimaRespostaIA = global.ultimaRespostaIA || {};
        global.ultimaRespostaIA[chatId] = respostaIA;

        await bot.deleteMessage(chat_id = chatId, statusMsg.message_id);
        await bot.sendMessage(chatId, "🔥 Estratégia pronta!", {
            reply_markup: {
                inline_keyboard: [[
                    { text: "📝 Texto", callback_data: "opcao_texto" },
                    { text: "🔊 Voz", callback_data: "opcao_audio" }
                ]]
            }
        });

    } catch (err) {
        console.error("❌ Erro IA:", err.message);
        bot.sendMessage(chatId, "❌ Erro no processamento. Tente novamente.");
    }
}

// --- 4. CALLBACKS E INPUTS ---
bot.on("callback_query", async (query) => {
    const chatId = query.message.chat.id;
    const textoOriginal = global.ultimaRespostaIA?.[chatId];
    
    if (!textoOriginal) return bot.sendMessage(chatId, "⚠️ Mande uma ideia primeiro!");

    if (query.data === "opcao_texto") {
        bot.sendMessage(chatId, `📖 *Plano:*\n\n${textoOriginal}`, { parse_mode: "Markdown" });
    } else if (query.data === "opcao_audio") {
        gerarAudioPiper(chatId, textoOriginal);
    }
    bot.answerCallbackQuery(query.id);
});

async function gerarAudioPiper(chatId, texto) {
    bot.sendChatAction(chatId, "record_voice");
    const audioPath = path.join(__dirname, `vocal_${chatId}.wav`);
    try {
        const textoLimpo = texto.replace(/[*#_`]/g, '').replace(/\n/g, ' ');
        const response = await axios({
            method: 'post', url: SERVICES.PIPER,
            params: { voice: configVoz[chatId] || "pt_BR-faber-medium" },
            data: { text: textoLimpo }, responseType: 'stream'
        });
        const writer = fs.createWriteStream(audioPath);
        response.data.pipe(writer);
        await new Promise((res) => writer.on('finish', res));
        await bot.sendVoice(chatId, audioPath);
    } catch (e) { console.error("Erro Piper:", e.message); }
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
}

bot.on("text", (msg) => { if (msg.text && !msg.text.startsWith("/")) processarIA(msg.text, msg.chat.id); });

bot.on("voice", async (msg) => {
    const chatId = msg.chat.id;
    const caminhoTemp = path.join(__dirname, `temp_${Date.now()}.ogg`);
    try {
        const arquivo = await bot.getFile(msg.voice.file_id);
        const res = await axios({ url: `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${arquivo.file_path}`, responseType: "stream" });
        const writer = fs.createWriteStream(caminhoTemp);
        res.data.pipe(writer);
        writer.on("finish", async () => {
            try {
                const form = new FormData();
                form.append("file", fs.createReadStream(caminhoTemp));
                const whisperRes = await axios.post(SERVICES.WHISPER, form, { headers: form.getHeaders() });
                if (whisperRes.data?.text) await processarIA(whisperRes.data.text, chatId);
            } finally { if (fs.existsSync(caminhoTemp)) fs.unlinkSync(caminhoTemp); }
        });
    } catch (e) { console.error("Erro Voz:", e.message); }
});

// INICIALIZAÇÃO
verificarServidores();
console.log("🚀 MAESTRO ONLINE - PRONTO PARA AÇÃO");