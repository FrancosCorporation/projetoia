// voice_master.js
const axios = require('axios');
const fs = require('fs');

const voiceMaster = {
    // Gera voz usando as vozes internas do TikTok (Grátis e Viral)
    gerarVozTikTok: async (texto, pathDestino) => {
        try {
            console.log("🎤 Gerando narração estilo TikTok...");
            
            // Usando um serviço de relay para a API do TikTok (exemplo de implementação)
            const response = await axios.post('https://tiktok-tts.weilnet.workers.dev/api/generation', {
                text: texto,
                voice: 'br_003' // Voz masculina padrão brasileira / br_005 para feminina
            });

            if (response.data.data) {
                const buffer = Buffer.from(response.data.data, 'base64');
                fs.writeFileSync(pathDestino, buffer);
                return pathDestino;
            }
        } catch (e) {
            console.error("❌ Falha na voz do TikTok:", e.message);
            return null;
        }
    }
};

module.exports = voiceMaster;