//engine.js
const memory = require("./memory");
const searcher = require("./searcher");
const brain = require("./brain");
const cleaner = require("./cleaner");
const factory = require("./factory");

async function processarIA(bot, texto, chatId, SERVICES) {
    // Normalização agressiva para capturar comandos de voz do Whisper
    const textoLow = texto.toLowerCase().trim();
    console.log(`\n--- 🚀 [DEBUG] ENTRADA: "${textoLow}" ---`);

    try {
        // GATILHO DE VÍDEO AMPLIADO (Adicionado "crio", "queria", "mostra")
        const keywordsVideo = ["video", "vídeo", "clipe", "filme", "filmar"];
        const keywordsComando = ["cria", "crio", "faz", "gera", "produz", "monta", "queria", "mostra"];

        const temVideo = keywordsVideo.some(k => textoLow.includes(k));
        const temComando = keywordsComando.some(k => textoLow.includes(k));

        if (temVideo && temComando) {
            console.log("📂 [LOG] Rota: Fábrica de Vídeo Ativada!");
            // Limpa o tema para a busca de imagens não bugar
            const tema = textoLow
                .replace(/jarvis|crio|cria|faz|gera|produz|me|pra|mim|um|sobre|video|vídeo|queria|mostra/gi, "")
                .trim();
            
            return await factory.gerenciarProducaoCompleta(bot, chatId, texto, tema, SERVICES);
        }

        // FILTRO DE CUMPRIMENTOS
        const saudacoes = ["oi", "olá", "bom dia", "boa tarde", "boa noite", "jarvis"];
        if (saudacoes.some(s => textoLow === s) || (saudacoes.some(s => textoLow.includes(s)) && textoLow.length < 15)) {
            return bot.sendMessage(chatId, "Em prontidão. Como posso ajudar?");
        }

        // CHAT GERAL
        bot.sendChatAction(chatId, "typing");
        const statusMsg = await bot.sendMessage(chatId, "💭 Processando análise...");

        const historico = memory.lerConversa(chatId);
        const contextoWeb = await searcher.buscar(texto, SERVICES.SEARCH);
        
        // Perfil estrategista para não gerar textos gigantes que quebram o Telegram
        const resposta = await brain.pensar(texto, contextoWeb, historico, SERVICES.OLLAMA, chatId, "estrategista");

        global.ultimaRespostaIA = global.ultimaRespostaIA || {};
        global.ultimaRespostaIA[chatId] = resposta;
        memory.salvarConversa(chatId, texto, resposta);

        await bot.deleteMessage(chatId, statusMsg.message_id);
        
        // Enviando como texto simples (sem Markdown) para evitar o erro 400 Bad Request
        await bot.sendMessage(chatId, resposta, {
            reply_markup: {
                inline_keyboard: [[
                    { text: "📝 Texto", callback_data: "t" },
                    { text: "🔊 Voz", callback_data: "v" }
                ]]
            }
        });

        setTimeout(() => cleaner.flashRAM(), 300000);

    } catch (e) {
        console.error("❌ [ERRO ENGINE]:", e);
        // Fallback simples para o usuário não ficar sem resposta
        bot.sendMessage(chatId, "⚠️ Tive um problema ao formatar a resposta, mas estou operacional.");
    }
}

module.exports = { processarIA };