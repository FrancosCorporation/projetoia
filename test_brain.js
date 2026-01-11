const axios = require("axios");

const MODELOS = [
    "gemma2:27b",
    "gemma3:12b",
    "gemma2:9b",
    "qwen2.5:14b",
    "deepseek-r1:14b",
    "mistral-nemo:latest",
    "aya:8b",
    "dolphin-llama3:8b",
    "llama3:8b-instruct-q8_0",
    "llama3:latest",
    "phi:latest"
];

const URL_OLLAMA = "http://localhost:11434/api/generate";

const PROMPT_TESTE = `
VOCÊ É O JARVIS. Responda como um parceiro de ideias humano, consciente e visionário.
HISTÓRICO: Conversamos antes sobre carros esportivos, a sensação de liberdade e como sair de baixo para conquistar o topo.
PEDIDO DO USUÁRIO: "Brou, cansei de ser coadjuvante. Quero que a gente comece a planejar algo grande. O que você acha de quem desistiu no caminho e como a gente deve se portar agora que o jogo ficou sério?"

RESPONDA COM NATURALIDADE (SEM TÓPICOS, SEM LISTAS, TEXTO FLUIDO):`;

async function testarModelos() {
    console.log("🚀 Iniciando Grande Torneio de IAs - Jarvis Brain Edition\n");

    for (const modelo of MODELOS) {
        const start = Date.now();
        console.log(`\n⏳ Testando agora: [${modelo.toUpperCase()}]`);

        try {
            const res = await axios.post(URL_OLLAMA, {
                model: modelo,
                prompt: PROMPT_TESTE,
                stream: false,
                options: { 
                    temperature: 0.8, // Um pouco mais alto para testar a "alma"
                    num_predict: 300 
                }
            }, { timeout: 200000 });

            const end = Date.now();
            const tempoDecorrido = ((end - start) / 1000).toFixed(2);
            
            console.log(`⏱️ Tempo de Resposta: ${tempoDecorrido}s`);
            console.log(`💬 Resposta:`);
            console.log(`"${res.data.response.trim()}"`);
            console.log("\n" + "-".repeat(60));

        } catch (error) {
            console.log(`❌ Erro no modelo ${modelo}: Pode não estar baixado ou falta VRAM.`);
        }
    }
}

testarModelos();