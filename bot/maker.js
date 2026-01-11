//maker.js
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const maker = {
    // Agora aceita 'legenda' como o quarto parâmetro
    construirVideo: async (audioPath, tema, fundoPathFornecido = null, legenda = "", onProgress) => {
        return new Promise((resolve, reject) => {
            const outputFolder = path.join(__dirname, 'output');
            if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder);

            const outputPath = path.join(outputFolder, `video_final_${Date.now()}.mp4`);

            let fundoPath = fundoPathFornecido;
            if (!fundoPath) {
                const assetsPath = path.join(__dirname, 'assets_video');
                const arquivos = fs.readdirSync(assetsPath).filter(f => f.endsWith('.mp4'));
                if (arquivos.length === 0) return reject(new Error("Pasta assets vazia."));
                fundoPath = path.join(assetsPath, arquivos[Math.floor(Math.random() * arquivos.length)]);
            }

            // Tratamento da legenda para evitar erros no FFmpeg (remover aspas e caracteres especiais)
            const legendaLimpa = legenda.replace(/["']/g, "").replace(/:/g, "-");

            const comando = ffmpeg()
                .input(fundoPath)
                .input(audioPath)
                .outputOptions([
                    '-c:v libx264',
                    '-preset ultrafast',
                    '-crf 23',
                    '-c:a aac',
                    '-shortest'
                ]);

            // Aplica o filtro de legenda se houver texto
            if (legendaLimpa) {
                comando.videoFilters([
                    {
                        filter: 'drawtext',
                        options: {
                            text: legendaLimpa,
                            fontcolor: 'white',
                            fontsize: 32,
                            x: '(w-text_w)/2',      // Centraliza horizontalmente
                            y: '(h-text_h)/2',      // Centraliza verticalmente
                            box: 1,                 // Adiciona um fundo para leitura
                            boxcolor: 'black@0.5',  // Fundo preto com 50% de transparência
                            boxborderw: 10,
                            line_spacing: 10,
                            // Quebra de linha automática (aproximadamente a cada 30 caracteres)
                            fix_bounds: true,
                            text_shaping: 1
                        }
                    }
                ]);
            }

            comando
                .on('start', (cmd) => console.log('🎬 Renderização iniciada com legendas internas'))
                .on('progress', (progress) => {
                    if (onProgress && progress.percent) {
                        onProgress(Math.round(progress.percent));
                    }
                })
                .on('error', (err) => {
                    console.error("❌ Erro FFmpeg:", err.message);
                    reject(err);
                })
                .on('end', () => resolve(outputPath))
                .save(outputPath);
        });
    }
};

module.exports = maker;