//checker.js
const axios = require("axios");
const fs = require("fs");
const path = require("path");

async function verificarServidores(services) {
    console.log("\n" + "=".repeat(40));
    console.log("🔍 MONITOR DE INTEGRIDADE DO MAESTRO");
    console.log("=".repeat(40));

    const checks = [
        { nome: "Whisper (Transcrição)", url: "http://whisper:9000/openapi.json" },
        { nome: "Ollama (Windows)", url: "http://host.docker.internal:11434/api/tags" },
        { nome: "SearXNG (Busca)", url: "http://searxng:8080/search?q=teste" }
    ];

    let todosOnline = true;

    // 1. Serviços de Rede
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

    // 2. Piper (Voz Local) - Verificação Robusta
    // Testamos o caminho absoluto e o relativo ao processo
    const possiveisCaminhosExe = [
        "/app/piper/piper",
        path.join(__dirname, "../piper/piper"),
        "./piper/piper"
    ];
    
    const possiveisModelos = [
        "/app/piper/pt_BR-jeff-medium.onnx",
        path.join(__dirname, "../piper/pt_BR-jeff-medium.onnx"),
        "./piper/pt_BR-jeff-medium.onnx"
    ];

    const piperExeExiste = possiveisCaminhosExe.some(p => fs.existsSync(p));
    const modeloExiste = possiveisModelos.some(p => fs.existsSync(p));
    
    if (piperExeExiste && modeloExiste) {
        console.log(`✅ ${"Piper (Voz Local)".padEnd(25)} | ONLINE (Arquivo detectado)`);
    } else {
        console.log(`❌ ${"Piper (Voz Local)".padEnd(25)} | OFFLINE (Não encontrado no container)`);
        todosOnline = false;
        // Debug para você ver onde o bot está procurando
        // console.log("Procurado em:", possiveisCaminhosExe[0]); 
    }

    console.log("=".repeat(40));
    if (!todosOnline) console.log("⚠️ ATENÇÃO: ALGUNS SERVIÇOS ESTÃO FORA!");
    console.log("=".repeat(40) + "\n");
}

module.exports = { verificarServidores };