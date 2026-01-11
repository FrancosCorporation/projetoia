const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(__dirname, 'memorias');
if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR);

const memory = {
    // 1. Grava apenas o diálogo (O que a IA vai ler no futuro)
    salvarConversa: (chatId, textoUsuario, respostaIA) => {
        const filePath = path.join(MEMORY_DIR, `conversa_${chatId}.txt`);
        const dataHora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        
        const log = `\n[${dataHora}]\nUSUÁRIO: ${textoUsuario}\nJARVIS: ${respostaIA}\n${'-'.repeat(20)}`;
        fs.appendFileSync(filePath, log, 'utf8');
    },

    // 2. Grava o rastro da Web (Para sua auditoria, a IA não lê isso)
    salvarPesquisa: (chatId, termoBusca, resultadosWeb) => {
        const filePath = path.join(MEMORY_DIR, `pesquisas_${chatId}.txt`);
        const dataHora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        
        const log = `\n[${dataHora}]\nBUSCA: ${termoBusca}\nRESULTADOS:\n${resultadosWeb}\n${'='.repeat(30)}`;
        fs.appendFileSync(filePath, log, 'utf8');
    },

    // 3. Lê apenas o diálogo para o Jarvis (Mantém o cérebro dele limpo)
    lerConversa: (chatId) => {
        const filePath = path.join(MEMORY_DIR, `conversa_${chatId}.txt`);
        if (!fs.existsSync(filePath)) return "Nenhum histórico anterior.";
        
        const conteudo = fs.readFileSync(filePath, 'utf8');
        return conteudo.slice(-3000); // Pega o final do papo
    },

    // Nova função para a IA substituir o arquivo por um resumo
    atualizarHistorico: (chatId, resumoOtimizado) => {
        const filePath = path.join(MEMORY_DIR, `conversa_${chatId}.txt`);
        const dataHora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        const log = `\n[${dataHora}] - HISTÓRICO OTIMIZADO PELO JARVIS:\n${resumoOtimizado}\n${'-'.repeat(20)}`;
        fs.writeFileSync(filePath, log, 'utf8'); // writeFileSync substitui todo o arquivo
    }
};

module.exports = memory;