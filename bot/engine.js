// engine.js
const memory = require("./memory");
const searcher = require("./searcher");
const brain = require("./brain");
const cleaner = require("./cleaner");

async function processarIA(bot, texto, chatId, SERVICES) {
    try {
        const textoLow = texto.toLowerCase().trim();

        // 1. FILTRO DE CUMPRIMENTOS (Gera resposta rápida via IA com a hora atual)
        const saudacoes = [
            "oi", "olá", "bom dia", "boa tarde", "boa noite", "e aí", "jarvis",
            "como esta", "como vai", "como você está", "tudo bem", "tudo certo"
        ];

        if (saudacoes.some(s => textoLow.includes(s))) {
            const frases = [
                "Sistemas operacionais, senhor. Núcleo de processamento em 100% de estabilidade.",
                "Tudo em ordem por aqui. Aguardando suas próximas diretrizes estratégicas.",
                "Boa tarde. Meus sistemas estão prontos para a ação. No que focamos agora?",
                "Em pleno funcionamento. Como posso ser útil na estratégia de hoje?"
            ];
            const aleatoria = frases[Math.floor(Math.random() * frases.length)];
            return bot.sendMessage(chatId, aleatoria);
        }

        // 2. FEEDBACK VISUAL
        bot.sendChatAction(chatId, "typing");
        const statusMsg = await bot.sendMessage(chatId, "💭 Jarvis analisando...");

        // 3. GATILHO DE LIMPEZA / RESUMO
        const termosLimpeza = ["limpe seu histórico", "esqueça o que falamos", "resuma a conversa", "otimizar memória"];
        if (termosLimpeza.some(termo => textoLow.includes(termo))) {
            const hist = memory.lerConversa(chatId);
            // Perfil "resumo" para consolidar dados vitais
            const resumo = await brain.pensar(texto, "", hist, SERVICES.OLLAMA, chatId, "resumo");

            memory.atualizarHistorico(chatId, resumo);
            await bot.deleteMessage(chatId, statusMsg.message_id);
            return bot.sendMessage(chatId, "🧹 **MEMÓRIA OTIMIZADA**: O histórico redundante foi condensado em diretrizes essenciais.");
        }

        // 4. RECUPERAÇÃO DE HISTÓRICO ANTERIOR
        const historico = memory.lerConversa(chatId);

        // 5. INTELIGÊNCIA DE BUSCA (REATIVADA PARA CASOS COMO "FERRARI 458")
        let contextoWeb = "";
        const perguntasApenasInternas = ["o que conversamos", "minha última pergunta", "qual foi nosso papo"];

        // Se NÃO for uma pergunta de auditoria de histórico, BUSCA na Web obrigatoriamente
        if (!perguntasApenasInternas.some(p => textoLow.includes(p))) {
            console.log(`🔍 [WEB] Buscando dados externos para: ${texto}`);
            contextoWeb = await searcher.buscar(texto, SERVICES.SEARCH);
            memory.salvarPesquisa(chatId, texto, contextoWeb);
        }

        // 6. PROCESSAMENTO NO CÉREBRO (Onde a Ferrari será processada)
        const resposta = await brain.pensar(texto, contextoWeb, historico, SERVICES.OLLAMA, chatId, "estrategista");

        // 7. PERSISTÊNCIA E CACHE
        memory.salvarConversa(chatId, texto, resposta);

        global.ultimaRespostaIA = global.ultimaRespostaIA || {};
        global.ultimaRespostaIA[chatId] = resposta;

        // 8. ENTREGA DOS RESULTADOS
        await bot.deleteMessage(chatId, statusMsg.message_id);
        await bot.sendMessage(chatId, "😎 Consegui pensar em algo:", {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [[
                    { text: "📝 Texto", callback_data: "t" },
                    { text: "🔊 Voz", callback_data: "v" }
                ]]
            }
        });

        // 9. DISSIPAÇÃO DE MEMÓRIA (O "Flash" para manter o sistema leve)
        setTimeout(() => cleaner.flashRAM(), 5000);

    } catch (e) {
        console.error("❌ Erro Engine:", e.message);
        bot.sendMessage(chatId, "⚠️ **ERRO DE NÚCLEO**: Ocorreu uma instabilidade no processamento estratégico.");
    }
}

module.exports = { processarIA };