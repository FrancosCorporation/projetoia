// cleaner.js
const axios = require("axios");

const cleaner = {
    // 1. Flush de Memória RAM da Aplicação
    flashRAM: () => {
        console.log("🧼 [CLEANER] Iniciando dissipação de cache RAM...");
        
        // Limpa o cache global de respostas (referências pesadas de strings)
        if (global.ultimaRespostaIA) {
            global.ultimaRespostaIA = {};
        }

        // Força o Garbage Collector do Node.js (exige --expose-gc)
        if (global.gc) {
            global.gc();
            console.log("✅ [CLEANER] Garbage Collection executado com sucesso.");
        } else {
            console.log("⚠️ [CLEANER] GC não exposto. Inicie com node --expose-gc index.js");
        }
    },

    // 2. Flush de VRAM do Ollama (Descarrega o modelo da placa de vídeo)
    unloadModel: async (urlOllama, modelName) => {
        try {
            console.log(`🔌 [CLEANER] Descarregando modelo ${modelName} da GPU...`);
            await axios.post(urlOllama, {
                model: modelName,
                keep_alive: 0 // Força o desligamento imediato do modelo na memória
            });
            console.log("✅ [CLEANER] VRAM liberada.");
        } catch (e) {
            console.error("❌ [CLEANER] Erro ao descarregar modelo:", e.message);
        }
    }
};

module.exports = cleaner;