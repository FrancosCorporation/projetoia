//brain.js
const axios = require("axios");

async function pensar(texto, contextoWeb, historico, url, chatId, perfil = "estrategista") {
    const perfis = {
        estrategista: {
            temp: 0.5, 
            prompt: `Você é uma inteligência avançada e direta. 
            Responda de forma curta, inteligente e sem formalidades como "Senhor".
            Se o usuário pedir um vídeo, apenas confirme a execução.`
        },
        video_director: {
            temp: 0.1, // Temperatura mínima para evitar que ele invente conversas
            prompt: `VOCÊ É UM GERADOR DE ROTEIROS CINEMATOGRÁFICOS.
            MISSÃO: Escrever APENAS o texto da narração para o vídeo.
            REGRAS ABSOLUTAS:
            1. NÃO dê sugestões de ferramentas (Canva, InVideo, etc).
            2. NÃO converse com o usuário.
            3. NÃO use introduções como "Aqui está".
            4. FOQUE no tema: Padrão de vida, superação e sucesso.`
        }
    };

    const config = perfis[perfil] || perfis.estrategista;

    // A instrução final agora é um comando imperativo para o modelo
    const instrucaoFinal = perfil === "video_director"
        ? "ESCREVA DIRETAMENTE O TEXTO PARA SER NARRADO NO VÍDEO:"
        : "RESPOSTA:";

    const prompt = `
    ${config.prompt}
    [HISTÓRICO]: ${historico}
    [WEB]: ${contextoWeb}
    [PEDIDO ATUAL]: "${texto}"
    
    ${instrucaoFinal}`;

    try {
        const res = await axios.post(url, {
            model: "gemma3:12b",
            prompt,
            stream: false,
            options: {
                temperature: config.temp,
                num_predict: 800, // Reduzido para ser mais rápido e direto
                num_ctx: 16384
            }
        }, { timeout: 150000 });

        let resposta = res.data.response.trim();

        // Limpeza agressiva para garantir que NADA além do roteiro passe
        if (perfil === "video_director") {
            // Remove frases de "ajuda" que o modelo costuma colocar
            resposta = resposta.replace(/^(Certamente|Aqui está|Com certeza|Com base|Senhor|Entendido|Claro).*[:!]/gi, "").trim();
            
            // Se ele começar a listar ferramentas, nós cortamos
            if (resposta.includes("Canva") || resposta.includes("InVideo")) {
                return "A jornada do zero ao milhão não é sobre ferramentas, é sobre visão. Da garagem ao topo, o sucesso é construído com cada decisão.";
            }
        }

        return resposta;
    } catch (e) {
        console.error("Erro no Brain:", e);
        return "⚠️ Erro no processamento dos núcleos.";
    }
}

module.exports = { pensar };