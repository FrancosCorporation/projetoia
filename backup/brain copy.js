//brain.js
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const OLLAMA_URL = "http://host.docker.internal:11434/api/generate";
const LOG_FILE = path.join(__dirname, "historico_estrategias.txt");

async function pensar(textoUsuario) {
  try {
    const inicio = Date.now();

    // 1ª Chamada: Gerar Estratégia
    const res = await axios.post(OLLAMA_URL, {
      model: "llama3:latest", 
      prompt: `Você é um estrategista intenso. Responda curto e direto (máximo 300 caracteres). Ideia: ${textoUsuario}`,
      stream: false
    });
    
    const respostaIA = res.data.response;
    const tempoGasto = (Date.now() - inicio) / 1000;

    // 2ª Chamada: Resumo para Log
    const resLog = await axios.post(OLLAMA_URL, {
      model: "llama3:latest",
      prompt: `Resuma o que foi feito: Usuário pediu sobre "${textoUsuario}" e eu respondi "${respostaIA}"`,
      stream: false
    });

    const resumo = resLog.data.response;

    const entradaLog = `[${new Date().toLocaleString()}]
PEDIDO: ${textoUsuario}
RESUMO: ${resumo}
RESPOSTA: ${respostaIA}
TEMPO: ${tempoGasto}s
--------------------------------------------------\n`;

    fs.appendFileSync(LOG_FILE, entradaLog);
    return respostaIA;
  } catch (err) {
    console.error("Erro no Bryan (Ollama):", err.message);
    throw err;
  }
}

function limparHistorico() {
  if (fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, "");
    return true;
  }
  return false;
}

module.exports = { pensar, limparHistorico };