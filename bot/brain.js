//brain.js
const axios = require("axios");

async function pensar(texto, contextoWeb, historico, url, chatId, perfil = "estrategista") {
    const perfis = {
        estrategista: {
            temp: 0.5,
            prompt: `Você é uma inteligência avançada. Responda de forma direta e inteligente. Sem formalidades.`
        },
        video_director: {
            temp: 0.85, 
            prompt: `Você é um narrador humano e visceral de vídeos virais.
            MISSÃO: Escreva um monólogo impactante.
            REGRAS CRÍTICAS:
            1. NÃO use "Olá", "Roteiro", "Cena", "Narrador" ou colchetes.
            2. Use frases curtas para causar impacto e facilitar a legenda.
            3. ESCREVA APENAS O TEXTO QUE SERÁ FALADO.
            4. O texto deve ter entre 40 a 60 segundos de leitura.`
        }
    };

    const config = perfis[perfil] || perfis.estrategista;
    
    // O segredo está aqui: No perfil de vídeo, terminamos o prompt com uma aspa aberta
    // Isso obriga a IA a começar a falar o texto IMEDIATAMENTE.
    const instrucaoFinal = perfil === "video_director" ? "NARRADOR: \"" : "RESPOSTA:";

    try {
        const res = await axios.post(url, {
            model: "gemma3:12b",
            prompt: `${config.prompt}\n[HISTÓRICO]: ${historico}\n[WEB]: ${contextoWeb}\n[PEDIDO]: "${texto}"\n${instrucaoFinal}`,
            stream: false,
            options: {
                temperature: config.temp,
                num_predict: 1200,
                num_ctx: 16384,
                stop: ["\""] // Para de gerar assim que fechar as aspas
            }
        }, { timeout: 150000 });

        let resposta = res.data.response.trim();

        if (perfil === "video_director") {
            // Limpeza de segurança caso a IA ignore o STOP
            resposta = resposta
                .replace(/^(Certamente|Aqui está|Narrador|Narração|Texto).*[:!]/gi, "")
                .replace(/\[.*?\]|\(.*?\)/g, "") // Remove (Cenas) ou [Instruções]
                .trim();

            // Sua verificação de segurança original
            if (resposta.includes("Canva") || resposta.includes("InVideo") || resposta.length < 10) {
                return "O sucesso é construído com persistência. Cada degrau subido é uma vitória contra o destino que tentaram te impor.";
            }
        }
        
        return resposta;
    } catch (e) {
        console.error("Erro no Brain:", e.message);
        return "A persistência supera o talento. Continue avançando.";
    }
}

module.exports = { pensar };