// downloader.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const downloader = {
    /**
     * Refina o tema para o Pexels. 
     * Converte temas comuns para inglês e adiciona descritores de qualidade.
     */
    refinarBusca: (tema) => {
        const dicionarioTraduçao = {
            'infantil': 'kids children playing cute toys',
            'tecnologia': 'future technology cyber',
            'dinheiro': 'money luxury wealth',
            'natureza': 'nature landscape cinematic',
            'saude': 'healthy lifestyle fitness',
            'comida': 'delicious food cooking',
            'viagem': 'travel destination cinematic',
            'futebol': 'soccer football stadium player' // Adicionei futebol pela sua última busca
        };

        let buscaRefinada = tema.toLowerCase();
        
        for (const [pt, en] of Object.entries(dicionarioTraduçao)) {
            if (buscaRefinada.includes(pt)) {
                buscaRefinada = en;
                break;
            }
        }

        // Se não caiu no dicionário, apenas limpamos e adicionamos estética
        if (buscaRefinada === tema.toLowerCase()) {
            // Pega as primeiras 3 palavras para não confundir a API
            buscaRefinada = buscaRefinada.split(' ').slice(0, 3).join(' ');
        }

        return `${buscaRefinada} cinematic portrait professional`.trim();
    },

    buscarVideoFundo: async (tema) => {
        try {
            const apiKey = process.env.PEXELS_IA_KEY;
            const queryOtimizada = downloader.refinarBusca(tema);
            const queryEncoded = encodeURIComponent(queryOtimizada);
            
            console.log(`🔍 [PEXELS] Buscando visual estratégico para: "${queryOtimizada}"`);
            
            // Aumentamos para 20 resultados para ter uma margem melhor de sorteio
            const url = `https://api.pexels.com/videos/search?query=${queryEncoded}&per_page=20&orientation=portrait&size=medium`;
            
            const res = await axios.get(url, { headers: { Authorization: apiKey } });
            
            if (!res.data.videos || res.data.videos.length === 0) {
                console.log("⚠️ Sem resultados específicos. Usando backup de alta estética.");
                // Backup recursivo com tema neutro de alta qualidade
                return await downloader.buscarVideoFundo("dark abstract cinematic");
            }

            // SORTEIO INTELIGENTE: Pega entre o 2º e o 12º vídeo para variar o estilo
            const pool = res.data.videos.length > 5 ? res.data.videos.slice(1, 12) : res.data.videos;
            const videoData = pool[Math.floor(Math.random() * pool.length)];

            // FILTRO DE RESOLUÇÃO: Busca o link que seja HD (720p ou 1080p) para não ser pesado nem ruim
            const videoUrl = videoData.video_files.find(f => f.width >= 720 && f.width <= 1080)?.link 
                             || videoData.video_files[0].link;

            const assetsPath = path.join(__dirname, 'assets_video');
            if (!fs.existsSync(assetsPath)) fs.mkdirSync(assetsPath);

            const videoPath = path.join(assetsPath, `fundo_temp_${Date.now()}.mp4`);
            const writer = fs.createWriteStream(videoPath);
            
            const response = await axios({ url: videoUrl, method: 'GET', responseType: 'stream' });
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', () => {
                    console.log(`✅ [PEXELS] Visual selecionado e baixado.`);
                    resolve(videoPath);
                });
                writer.on('error', (err) => {
                    console.error("❌ Erro na escrita do arquivo:", err);
                    reject(err);
                });
            });
        } catch (error) {
            console.error("❌ Erro no Downloader:", error.message);
            throw error;
        }
    }
};

module.exports = downloader;