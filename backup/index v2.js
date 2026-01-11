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

// Configurações
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const SERVICES = {
    WHISPER: "http://whisper:9000/transcribe",
    OLLAMA: "http://ollama:11434/api/generate",
    PIPER: "http://piper:5000/",
    SEARCH: "http://searxng:8080/search"
};

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// --- 🧠 MEMÓRIA DO BOT ---
// Este objeto vai guardar o que foi falado antes
let historicoConversas = {}; 
let configVoz = {}; 

async function verificarServidores() {
    console.log("\n🔍 Verificando integridade dos serviços...");
    const checks = [
        { nome: "Whisper", url: SERVICES.WHISPER.replace('/transcribe', '/') }, // Testa a raiz
        { nome: "Ollama", url: "http://ollama:11434/" },
        { nome: "Piper", url: SERVICES.PIPER },
        { nome: "SearXNG", url: SERVICES.SEARCH }
    ];

    for (const servico of checks) {
        try {
            // Adicionamos validateStatus: () => true para ele não dar erro se o status for 404 ou 405
            // Isso prova que o servidor ESTÁ LÁ e respondeu, mesmo que a rota esteja "errada" para um GET
            await axios.get(servico.url, { 
                timeout: 5000, 
                validateStatus: () => true 
            });
            console.log(`✅ ${servico.nome}: ONLINE`);
        } catch (e) {
            console.log(`❌ ${servico.nome}: OFFLINE (Erro: ${e.message})`);
        }
    }
}

async function buscarNaWeb(termo) {
    try {
        console.log(`🌐 Pesquisando na web: ${termo}`);
        const res = await axios.get(SERVICES.SEARCH, {
            params: { q: termo, format: "json", language: "pt-BR" },
            timeout: 10000
        });
        if (res.data?.results?.length > 0) {
            return res.data.results.slice(0, 3).map(r => `Fonte: ${r.title}\nConteúdo: ${r.content}`).join("\n\n");
        }
        return "Nenhuma informação extra encontrada na internet.";
    } catch (e) {
        return "Erro ao acessar a web.";
    }
}

// --- ⚡ PROCESSAMENTO COM HISTÓRICO ---
async function processarIA(textoUsuario, chatId) {
    try {
        const comandoTexto = textoUsuario.toLowerCase();

        // Configuração de Voz
        if (comandoTexto.includes("trocar para jeff")) {
            configVoz[chatId] = "pt_BR-jeff-medium";
            return bot.sendMessage(chatId, "✅ Voz alterada para: Jeff");
        } 
        if (comandoTexto.includes("trocar para faber")) {
            configVoz[chatId] = "pt_BR-faber-medium";
            return bot.sendMessage(chatId, "✅ Voz alterada para: Faber");
        }

        bot.sendChatAction(chatId, "typing");
        const statusMsg = await bot.sendMessage(chatId, "🌐 Pensando e consultando web...");

        // 1. BUSCA NA WEB
        const contextoWeb = await buscarNaWeb(textoUsuario);

        // 2. RECUPERA HISTÓRICO (Se não existir, cria vazio)
        if (!historicoConversas[chatId]) historicoConversas[chatId] = "";

        // 3. MONTA O PROMPT FINAL (Histórico + Web + Pergunta)
        const promptFinal = `
        HISTÓRICO DA CONVERSA:
        ${historicoConversas[chatId]}

        CONTEXTO ATUAL DA INTERNET:
        ${contextoWeb}

        PERGUNTA DO USUÁRIO:
        ${textoUsuario}

        INSTRUÇÃO: Resolva a necessidade principal do usuário de forma clara e direta. Evite enrolação. Dê a melhor solução prática e, se possível, alternativas. Antecipe dúvidas comuns. Priorize utilidade, ação e economia de tempo. Use contexto anterior e informações atualizadas quando necessário.
`;

        // 4. ENVIA PARA O OLLAMA (Aguardando resposta completa)
        const res = await axios.post(SERVICES.OLLAMA, { 
            model: "llama3", 
            prompt: promptFinal, 
            stream: false 
        }, { timeout: 200000 });

        const respostaIA = res.data.response;

        // 5. ATUALIZA O HISTÓRICO (Para a próxima pergunta ele lembrar desta)
        historicoConversas[chatId] += `\nUsuário: ${textoUsuario}\nMaestro: ${respostaIA}\n`;
        
        // Limita o histórico para não ficar pesado demais (últimos 3000 caracteres)
        if (historicoConversas[chatId].length > 3000) {
            historicoConversas[chatId] = historicoConversas[chatId].slice(-3000);
        }

        // Salva para os botões de opção
        global.ultimaRespostaIA = global.ultimaRespostaIA || {};
        global.ultimaRespostaIA[chatId] = respostaIA;

        await bot.deleteMessage(chatId, statusMsg.message_id);
        await bot.sendMessage(chatId, "🔥 Acho que pensei bastante", {
            reply_markup: {
                inline_keyboard: [[
                    { text: "📝 Texto", callback_data: "opcao_texto" },
                    { text: "🔊 Voz", callback_data: "opcao_audio" }
                ]]
            }
        });

    } catch (err) {
        console.error("❌ Erro IA:", err.message);
        bot.sendMessage(chatId, "❌ Ocorreu um erro estratégico. Tente novamente.");
    }
}

// --- RESTO DO CÓDIGO (BOTÕES E VOZ) ---
bot.on("callback_query", async (query) => {
    const chatId = query.message.chat.id;
    const textoOriginal = global.ultimaRespostaIA?.[chatId];
    if (!textoOriginal) return;

    if (query.data === "opcao_texto") {
        await bot.sendMessage(chatId, `📖 *Plano Maestro:*\n\n${textoOriginal}`, { parse_mode: "Markdown" });
    } else if (query.data === "opcao_audio") {
        await gerarAudioPiper(chatId, textoOriginal);
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
        await new Promise((resolve) => writer.on('finish', resolve));
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
            const form = new FormData();
            form.append("file", fs.createReadStream(caminhoTemp));
            const whisperRes = await axios.post(SERVICES.WHISPER, form, { headers: form.getHeaders() });
            if (whisperRes.data?.text) await processarIA(whisperRes.data.text, chatId);
            if (fs.existsSync(caminhoTemp)) fs.unlinkSync(caminhoTemp);
        });
    } catch (e) { console.error("Erro Voz:", e.message); }
});

verificarServidores();
console.log("🚀 MAESTRO ONLINE - COM MEMÓRIA E INTERNET");