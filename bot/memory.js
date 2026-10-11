const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MEMORY_DIR = path.resolve(process.env.MEMORY_DIR || path.join(__dirname, 'memorias'));
const MAX_CONVERSATION_CHARS = 64 * 1024;
const MAX_SEARCH_CHARS = 32 * 1024;

fs.mkdirSync(MEMORY_DIR, { recursive: true, mode: 0o700 });
try { fs.chmodSync(MEMORY_DIR, 0o700); } catch {}

function safeChatId(chatId) {
  const value = String(chatId);
  if (!/^\d{1,20}$/.test(value)) throw new Error('Identificador de conversa inválido.');
  return value;
}

function fileFor(kind, chatId) {
  return path.join(MEMORY_DIR, `${kind}_${safeChatId(chatId)}.txt`);
}

function readBounded(filePath, maxChars) {
  if (!fs.existsSync(filePath)) return '';
  const fd = fs.openSync(filePath, 'r');
  try {
    const size = fs.fstatSync(fd).size;
    const bytesToRead = Math.min(size, maxChars * 4);
    const buffer = Buffer.alloc(bytesToRead);
    fs.readSync(fd, buffer, 0, bytesToRead, Math.max(0, size - bytesToRead));
    return buffer.toString('utf8').slice(-maxChars);
  } finally {
    fs.closeSync(fd);
  }
}

function writePrivate(filePath, content) {
  const tempPath = `${filePath}.${process.pid}.${crypto.randomBytes(6).toString('hex')}.tmp`;
  try {
    fs.writeFileSync(tempPath, content, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    fs.renameSync(tempPath, filePath);
    fs.chmodSync(filePath, 0o600);
  } catch (error) {
    try { fs.unlinkSync(tempPath); } catch {}
    throw error;
  }
}

function timestamp() {
  return new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

const memory = {
  salvarConversa(chatId, textoUsuario, respostaIA) {
    const filePath = fileFor('conversa', chatId);
    const current = readBounded(filePath, MAX_CONVERSATION_CHARS);
    const log = `\n[${timestamp()}]\nUSUÁRIO: ${textoUsuario}\nJARVIS: ${respostaIA}\n${'-'.repeat(20)}`;
    writePrivate(filePath, (current + log).slice(-MAX_CONVERSATION_CHARS));
  },

  salvarPesquisa(chatId, termoBusca, resultadosWeb) {
    const filePath = fileFor('pesquisas', chatId);
    const current = readBounded(filePath, MAX_SEARCH_CHARS);
    const log = `\n[${timestamp()}]\nBUSCA: ${termoBusca}\nRESULTADOS:\n${resultadosWeb}\n${'='.repeat(30)}`;
    writePrivate(filePath, (current + log).slice(-MAX_SEARCH_CHARS));
  },

  lerConversa(chatId) {
    const content = readBounded(fileFor('conversa', chatId), 3000);
    return content || 'Nenhum histórico anterior.';
  },

  atualizarHistorico(chatId, resumoOtimizado) {
    const log = `\n[${timestamp()}] - HISTÓRICO OTIMIZADO PELO JARVIS:\n${String(resumoOtimizado).slice(-MAX_CONVERSATION_CHARS)}\n${'-'.repeat(20)}`;
    writePrivate(fileFor('conversa', chatId), log.slice(-MAX_CONVERSATION_CHARS));
  },

  apagarConversa(chatId) {
    for (const kind of ['conversa', 'pesquisas']) {
      try { fs.unlinkSync(fileFor(kind, chatId)); } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
  },
};

module.exports = memory;
