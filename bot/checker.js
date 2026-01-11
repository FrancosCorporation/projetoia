const axios = require("axios");

async function verificarServidores(services) {
    console.log("\n" + "=".repeat(40));
    console.log("🔍 MONITOR DE INTEGRIDADE DO MAESTRO");
    console.log("=".repeat(40));

    const checks = [
    { nome: "Whisper (Transcrição)", url: "http://whisper:9000/openapi.json" },
    { nome: "Ollama (Windows)", url: "http://host.docker.internal:11434/api/tags" },
    { nome: "Piper (Voz)", url: "http://piper:5000", dica: "Verifique o container 'piper'." }, // <--- Porta 5000
    { nome: "SearXNG (Busca)", url: "http://searxng:8080/search?q=teste" }
];

    let todosOnline = true;

    for (const servico of checks) {
        try {
            const inicio = Date.now();
            await axios.get(servico.url, { timeout: 5000, validateStatus: () => true });
            console.log(`✅ ${servico.nome.padEnd(25)} | ONLINE (${Date.now() - inicio}ms)`);
        } catch (e) {
            console.log(`❌ ${servico.nome.padEnd(25)} | OFFLINE`);
            todosOnline = false;
        }
    }

    console.log("=".repeat(40));
    if (!todosOnline) console.log("⚠️ ATENÇÃO: ALGUNS SERVIÇOS ESTÃO FORA!");
    console.log("=".repeat(40) + "\n");
}

module.exports = { verificarServidores };