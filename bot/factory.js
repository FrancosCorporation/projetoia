// factory.js
const path = require("path");
const fs = require("fs");
const brain = require("./brain");
const voiceMaster = require("./voice_master");
const maker = require("./maker");
const downloader = require("./downloader");
const searcher = require("./searcher");
const memory = require("./memory");

const factory = {
    gerenciarProducaoCompleta: async (bot, chatId, pedidoOriginal, tema, SERVICES) => {
        const audioPath = path.join(__dirname, `temp_audio_${Date.now()}.mp3`);
        let videoBaixadoPath = null;
        let statusMsg;

        try {
            // 1. INÍCIO
            statusMsg = await bot.sendMessage(chatId, "🏗️ Iniciando protocolos de criação...");
            await bot.sendChatAction(chatId, 'typing');

            // 2. COLETA E MEMÓRIA
            const historicoCompleto = memory.lerConversa(chatId);
            const contextoWeb = await searcher.buscar(tema, SERVICES.SEARCH);
            
            await bot.editMessageText("🧠 Processando ideias e referências...", { 
                chat_id: chatId, message_id: statusMsg.message_id 
            });

            // 3. ROTEIRO (O texto que será a legenda e a voz)
            const roteiroFinal = await brain.pensar(pedidoOriginal, contextoWeb, historicoCompleto, SERVICES.OLLAMA, chatId, "video_director");

            // 4. MÍDIA E VOZ
            await bot.editMessageText("🎤 Minerando mídia e sintetizando voz...", { 
                chat_id: chatId, message_id: statusMsg.message_id 
            });
            
            videoBaixadoPath = await downloader.buscarVideoFundo(tema);
            await voiceMaster.gerarVozTikTok(roteiroFinal, audioPath);

            // 5. RENDERIZAÇÃO (Aqui passamos o roteiroFinal para virar legenda interna)
            await bot.editMessageText("🎬 Renderizando vídeo com legendas...\n[░░░░░░░░░░] 0%", { 
                chat_id: chatId, message_id: statusMsg.message_id 
            });

            // IMPORTANTE: Passamos o 'roteiroFinal' como o parâmetro de legenda
            const videoFinalPath = await maker.construirVideo(audioPath, tema, videoBaixadoPath, roteiroFinal, async (percent) => {
                if (percent % 20 === 0) {
                    const preenchido = Math.floor(percent / 10);
                    const barra = "█".repeat(preenchido) + "░".repeat(10 - preenchido);
                    await bot.editMessageText(`🎬 Finalizando renderização...\n[${barra}] ${percent}%`, {
                        chat_id: chatId, message_id: statusMsg.message_id
                    }).catch(() => {});
                }
            });

            // 6. ENTREGA FINAL
            await bot.editMessageText("🚀 Produção finalizada!", { 
                chat_id: chatId, message_id: statusMsg.message_id 
            });

            // Caption do Telegram vazia ou curta, pois a legenda já está NO VÍDEO
            await bot.sendVideo(chatId, videoFinalPath);

            // 7. LIMPEZA
            if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
            if (videoBaixadoPath && fs.existsSync(videoBaixadoPath)) fs.unlinkSync(videoBaixadoPath);

        } catch (error) {
            console.error("❌ ERRO FACTORY:", error);
            bot.sendMessage(chatId, "⚠️ Erro na produção: " + error.message);
        }
    }
};

module.exports = factory;