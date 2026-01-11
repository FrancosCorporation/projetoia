//memory.js
const fs = require('fs');
const path = require('path');

// No Docker, forçamos o caminho que mapeamos no volume do docker-compose
const MEMORY_DIR = '/app/memorias'; 

if (!fs.existsSync(MEMORY_DIR)) {
    fs.mkdirSync(MEMORY_DIR, { recursive: true });
}

const memory = {
    salvarConversa: (chatId, textoUsuario, respostaIA) => {
        const filePath = path.join(MEMORY_DIR, `conversa_${chatId}.txt`);
        const dataHora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        const log = `\n[${dataHora}]\nUSUÁRIO: ${textoUsuario}\nJARVIS: ${respostaIA}\n${'-'.repeat(20)}`;
        fs.appendFileSync(filePath, log, 'utf8');
    },
    salvarPesquisa: (chatId, termoBusca, resultadosWeb) => {
        const filePath = path.join(MEMORY_DIR, `pesquisas_${chatId}.txt`);
        const dataHora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        const log = `\n[${dataHora}]\nBUSCA: ${termoBusca}\nRESULTADOS:\n${resultadosWeb}\n${'='.repeat(30)}`;
        fs.appendFileSync(filePath, log, 'utf8');
    },
    lerConversa: (chatId) => {
        const filePath = path.join(MEMORY_DIR, `conversa_${chatId}.txt`);
        if (!fs.existsSync(filePath)) return "Nenhum histórico anterior.";
        return fs.readFileSync(filePath, 'utf8').slice(-3000);
    },
    atualizarHistorico: (chatId, resumoOtimizado) => {
        const filePath = path.join(MEMORY_DIR, `conversa_${chatId}.txt`);
        const dataHora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        const log = `\n[${dataHora}] - HISTÓRICO OTIMIZADO PELO JARVIS:\n${resumoOtimizado}\n${'-'.repeat(20)}`;
        fs.writeFileSync(filePath, log, 'utf8');
    }
};

module.exports = memory;