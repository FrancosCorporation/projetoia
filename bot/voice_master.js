// voice_master.js
const { exec } = require('child_process');

const voiceMaster = {
    gerarVozTikTok: async (texto, pathDestino) => {
        return new Promise((resolve, reject) => {
            const modelPath = "/app/piper/pt_BR-jeff-medium.onnx"; 
            const textoLimpo = texto.replace(/"/g, '').replace(/'/g, '').replace(/\n/g, ' ');

            // Chamamos 'piper' diretamente como comando de sistema
            const comando = `printf "${textoLimpo}" | piper --model /app/piper/pt_BR-jeff-medium.onnx --output_file ${pathDestino} --length_scale 1.05 --sentence_silence 0.4`;

            exec(comando, (error) => {
                if (error) {
                    console.error("❌ Erro no Piper:", error);
                    return reject(error);
                }
                resolve(pathDestino);
            });
        });
    }
};

module.exports = voiceMaster;