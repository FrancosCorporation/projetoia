//maker.js
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const maker = {
    construirVideo: async (audioPath, tema, fundoPathFornecido = null, legenda = "", onProgress) => {
        return new Promise((resolve, reject) => {
            const outputFolder = path.join(__dirname, 'output');
            if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder);
            const outputPath = path.join(outputFolder, `final_${Date.now()}.mp4`);

            let fundoPath = fundoPathFornecido || path.join(__dirname, 'assets_video', 'padrao.mp4');
            
            // 1. Limpeza rigorosa para o FFmpeg não dar erro com caracteres especiais
            const legendaLimpa = legenda
                .replace(/["']/g, "")
                .replace(/:/g, "-")
                .replace(/\n/g, " ")
                .trim();

            try {
                // 2. SINCRONIA REAL: O código pergunta ao sistema qual a duração exata do áudio
                const duracaoAudio = parseFloat(execSync(
                    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`
                ).toString());

                console.log(`🎬 [LOG] Duração do áudio detectada: ${duracaoAudio}s`);

                const comando = ffmpeg()
                    .input(fundoPath)
                    .inputOptions(['-stream_loop -1']) 
                    .input(audioPath)
                    .outputOptions([
                        '-c:v libx264', 
                        '-preset ultrafast', 
                        '-crf 23', 
                        '-c:a aac',
                        '-map 0:v:0', 
                        '-map 1:a:0', 
                        '-shortest' // Garante que o vídeo pare quando o áudio acabar
                    ]);

                if (legendaLimpa) {
                    const palavras = legendaLimpa.split(' ');
                    const blocos = [];
                    const palavrasPorVez = 3; 

                    for (let i = 0; i < palavras.length; i += palavrasPorVez) {
                        blocos.push(palavras.slice(i, i + palavrasPorVez).join(' '));
                    }

                    // 3. O PULO DO GATO: Divide a duração real pelo número de blocos de legenda
                    const duracaoCadaBloco = duracaoAudio / blocos.length;

                    const filtrosLegenda = blocos.map((texto, index) => {
                        const inicio = index * duracaoCadaBloco;
                        const fim = (index + 1) * duracaoCadaBloco;

                        return {
                            filter: 'drawtext',
                            options: {
                                text: texto.toUpperCase(),
                                fontcolor: 'white',
                                fontsize: 42, // Aumentado para melhor leitura
                                x: '(w-text_w)/2',
                                y: 'h-text_h-120', // SEMPRE no pé do vídeo
                                box: 1,
                                boxcolor: 'black@0.7',
                                boxborderw: 15,
                                enable: `between(t,${inicio.toFixed(2)},${fim.toFixed(2)})`,
                                fix_bounds: true
                            }
                        };
                    });

                    comando.videoFilters(filtrosLegenda);
                }

                comando
                    .on('progress', (p) => onProgress && onProgress(Math.round(p.percent)))
                    .on('error', (err) => {
                        console.error("❌ Erro FFmpeg:", err);
                        reject(err);
                    })
                    .on('end', () => {
                        console.log("✅ Vídeo produzido com sucesso!");
                        resolve(outputPath);
                    })
                    .save(outputPath);

            } catch (err) {
                console.error("❌ Erro ao obter duração do áudio ou processar vídeo:", err);
                reject(err);
            }
        });
    }
};

module.exports = maker;