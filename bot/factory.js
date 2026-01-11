// factory.js
const brain = require("./brain");
const downloader = require("./downloader"); 
const voiceMaster = require("./voice_master");
const maker = require("./maker");
const path = require("path");
const fs = require("fs");

async function gerenciarProducaoCompleta(bot, chatId, textoOriginal, temaSuja, SERVICES) {
    const statusMsg = await bot.sendMessage(chatId, "🏭 **Jarvis:** Iniciando produção...");
    
    try {
        // 1. LIMPEZA DE TEMA
        const temaLimpo = temaSuja
            .replace(/crio|um|vídeo|para|mim|mostra|gera|faz|queria/gi, "")
            .trim() || "luxury lifestyle success";

        // 2. ROTEIRO (brain.js) - CORREÇÃO DA URL AQUI
        await bot.editMessageText("📝 Escrevendo roteiro ...", { chat_id: chatId, message_id: statusMsg.message_id });
        
        // Tentamos pegar a URL de qualquer um dos campos possíveis para não dar 'Invalid URL'
        const urlFinal = SERVICES.OLLAMA_URL || SERVICES.OLLAMA || "http://localhost:11434/api/generate";
        
        const roteiro = await brain.pensar(textoOriginal, "", "", urlFinal, chatId, "video_director");

        // 3. BUSCA DE VÍDEO (downloader.js)
        await bot.editMessageText("🔍 Gerando Imagens ... ", { chat_id: chatId, message_id: statusMsg.message_id });
        const visualPath = await downloader.buscarVideoFundo(temaLimpo);

        // 4. ÁUDIO (voice_master.js) - USANDO CAMINHO ABSOLUTO PARA O PIPER NÃO FALHAR
        await bot.editMessageText("🎙️ Gerando voz ... ", { chat_id: chatId, message_id: statusMsg.message_id });
        const audioPath = path.join(__dirname, `audio_${chatId}.wav`); 
        const vozGerada = await voiceMaster.gerarVozTikTok(roteiro, audioPath);
        
        if (!vozGerada) throw new Error("Falha no TTS");

        // 5. MONTAGEM (maker.js)
        await bot.editMessageText("🎬 Renderizando ...", { chat_id: chatId, message_id: statusMsg.message_id });
        const videoFinalPath = await maker.construirVideo(audioPath, temaLimpo, visualPath, roteiro, (percent) => {
            let p = Math.max(0, Math.min(10, Math.floor(percent / 10)));
            if (isNaN(p)) p = 0;
            const barra = "█".repeat(p) + "░".repeat(10 - p);
            console.log(`🎬 [${barra}] ${percent}%`);
        });

        // 6. ENVIO
        await bot.editMessageText("🚀 Enviando vídeo ...", { chat_id: chatId, message_id: statusMsg.message_id });
        await bot.sendVideo(chatId, videoFinalPath, {
            caption: `✅ Vídeo pronto!\n🎯 **Tema:** ${temaLimpo}`,
            parse_mode: "Markdown"
        });

        if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);

    } catch (error) {
        console.error("❌ ERRO FACTORY:", error);
        bot.sendMessage(chatId, "⚠️ Falha na produção do vídeo.");
    }
}

module.exports = { gerenciarProducaoCompleta };