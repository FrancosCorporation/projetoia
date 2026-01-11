//engine.js
const memory = require("./memory");
const searcher = require("./searcher");
const brain = require("./brain");
const cleaner = require("./cleaner");
const factory = require("./factory");

async function processarIA(bot, texto, chatId, SERVICES) {
    const textoLow = texto.toLowerCase().trim();
    console.log(`\n--- 🚀 [DEBUG] ENTRADA: "${textoLow}" ---`);

    try {
        // 1. GATILHO DE VÍDEO (PRIORIDADE TOTAL)
        const regexVideo = /(video|vídeo)/i;
        const regexComando = /(cria|faz|gerar|produzir|monta)/i;

        if (regexVideo.test(textoLow) && regexComando.test(textoLow)) {
            console.log("📂 [LOG] Rota: Fábrica de Vídeo Detectada!");

            // Limpeza do tema (Mantendo palavras descritivas como 'infantil' ou 'viral')
            const tema = textoLow
                .replace(/jarvis|cria|me|pra|mim|um|sobre|gerar|faz|fazer|produzir|video|vídeo/gi, "")
                .trim();

            // Delega TUDO para a Factory (Pesquisa, Memória e Produção)
            return factory.gerenciarProducaoCompleta(bot, chatId, texto, tema, SERVICES);
        }

        // 2. FILTRO DE CUMPRIMENTOS
        const saudacoes = ["oi", "olá", "bom dia", "boa tarde", "boa noite", "jarvis"];
        if (saudacoes.some(s => textoLow === s) || (saudacoes.some(s => textoLow.includes(s)) && textoLow.length < 15)) {
            const frases = ["Sistemas operacionais, senhor.", "Pronto para as ordens.", "Em prontidão."];
            return bot.sendMessage(chatId, frases[Math.floor(Math.random() * frases.length)]);
        }

        // 3. CHAT GERAL / BUSCA WEB (Caso não seja pedido de vídeo)
        bot.sendChatAction(chatId, "typing");
        const statusMsg = await bot.sendMessage(chatId, "💭 Jarvis analisando...");

        const historico = memory.lerConversa(chatId);
        const contextoWeb = await searcher.buscar(texto, SERVICES.SEARCH);
        const resposta = await brain.pensar(texto, contextoWeb, historico, SERVICES.OLLAMA, chatId, "estrategista");

        // Cache para o botão de voz
        global.ultimaRespostaIA = global.ultimaRespostaIA || {};
        global.ultimaRespostaIA[chatId] = resposta;

        memory.salvarConversa(chatId, texto, resposta);

        await bot.deleteMessage(chatId, statusMsg.message_id);
        await bot.sendMessage(chatId, "😎 **ANÁLISE CONCLUÍDA**:", {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [[
                    { text: "📝 Texto", callback_data: "t" },
                    { text: "🔊 Voz", callback_data: "v" }
                ]]
            }
        });

        // Limpeza agendada (5 minutos)
        setTimeout(() => cleaner.flashRAM(), 300000);

    } catch (e) {
        console.error("❌ [ERRO ENGINE]:", e);
        bot.sendMessage(chatId, "⚠️ Instabilidade no núcleo de processamento.");
    }
}

module.exports = { processarIA };