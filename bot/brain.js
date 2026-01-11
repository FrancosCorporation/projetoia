//brain.js
const axios = require("axios");

async function pensar(texto, contextoWeb, historico, url, chatId, perfil = "estrategista") {
    const dataHoraBrasilia = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    // Definição de Perfis de Pensamento
    const perfis = {
        estrategista: {
            temp: 0.3,
            prompt: `VOCÊ É O JARVIS.
    [REGRAS DE CONDUTA]
    - PROIBIDO dar lições de gramática ou corrigir a escrita do usuário.
    - Se o usuário fizer uma pergunta pessoal ou de cortesia que passou pelo filtro, responda de forma breve e mude para o modo operacional.
    - Se não houver dados técnicos no contexto, não invente explicações linguísticas.
    - somente se solicitado.`
        },
        resumo: {
            temp: 0.1, // Quase zero de criatividade, foco total em fatos
            predict: 600, // Mais espaço para não cortar dados vitais
            penalty: 0.2, // Pode repetir termos técnicos se necessário para precisão
            prompt: `VOCÊ É O NÚCLEO DE MEMÓRIA DO JARVIS. COMPRIMA O HISTÓRICO MANTENDO APENAS DADOS NUCLEARES.`
        },
        criativo: {
            temp: 0.7,
            predict: 800,
            penalty: 1.1,
            prompt: `VOCÊ É O MODO BRAINSTORM DO JARVIS. EXPLORE POSSIBILIDADES FORA DA CAIXA.`
        }, content_creator: {
            temp: 0.7, // Mais criativo para roteiros
            predict: 800, // Respostas mais longas para roteiros completos
            penalty: 1.1,
            prompt: `VOCÊ É O DIRETOR DE CONTEÚDO DO JARVIS. 
    Seu objetivo é criar roteiros virais para TikTok (máximo 60 segundos).
    
    ESTRUTURA DO ROTEIRO:
    1. GANCHO (0-3s): Algo que impeça o scroll.
    2. CORPO: Informação rápida e visual.
    3. CTA (Call to Action): Comando para seguir ou comentar.
    
    Sempre forneça o ROTEIRO e o PROMPT que o usuário deve colar na IA de vídeo.`
        }
    };

    const config = perfis[perfil] || perfis.estrategista;

    const prompt = `
    ${config.prompt}
    HORA ATUAL: ${dataHoraBrasilia}
    HISTÓRICO: ${historico}
    CONTEXTO WEB: ${contextoWeb}
    PERGUNTA: ${texto}

    RESPOSTA JARVIS:`;

    try {
        const res = await axios.post(url, {
            model: "llama3:8b-instruct-q8_0",
            prompt,
            stream: false,
            options: {
                temperature: config.temp,
                num_predict: config.predict,
                presence_penalty: config.penalty,
                num_ctx: 8192 // Janela de contexto expandida para o Q8
            }
        }, { timeout: 120000 });

        return res.data.response.trim();
    } catch (e) {
        return "⚠️ Erro no processamento estratégico.";
    }
}

module.exports = { pensar };