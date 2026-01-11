require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

// Fix para compatibilidade com Node 18+ em ambiente Docker
if (typeof File === 'undefined') { 
    global.File = class extends Blob {
        constructor(parts, filename, options = {}) {
            super(parts, options);
            this.name = filename;
            this.lastModified = Date.now();
        }
    }; 
}

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const WHISPER_URL = "http://whisper:9000/transcribe"; 
const OLLAMA_URL = "http://ollama:11434/api/generate";
const PIPER_URL = "http://piper:5000/"; 

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
let cacheRespostas = {};

// --- PROCESSAMENTO OLLAMA ---
async function processarIA(textoUsuario, chatId) {
  try {
    bot.sendChatAction(chatId, "typing");
    console.log(`🤖 Chamando Ollama para: ${textoUsuario}`);
    
    const res = await axios.post(OLLAMA_URL, { 
      model: "llama3", 
      prompt: `Você é um estrategista de conteúdo intenso e prático. Responda em Português do Brasil de forma direta e curta (máximo 300 caracteres). Ideia: ${textoUsuario}`, 
      stream: false 
    }, { timeout: 150000 });

    const respostaIA = res.data.response;
    cacheRespostas[chatId] = respostaIA;

    const botoes = {
      reply_markup: {
        inline_keyboard: [[
          { text: "📝 Ler Texto", callback_data: "opcao_texto" },
          { text: "🔊 Ouvir Voz", callback_data: "opcao_audio" }
        ]]
      }
    };
    await bot.sendMessage(chatId, "🔥 Estratégia gerada!", botoes);
  } catch (err) {
    console.error("❌ Erro Ollama:", err.message);
    bot.sendMessage(chatId, "❌ O Ollama falhou. Tente novamente.");
  }
}

// --- BOTÕES E VOZ (PIPER) ---
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const textoOriginal = cacheRespostas[chatId];
  
  if (!textoOriginal) {
    return bot.sendMessage(chatId, "⚠️ Não encontrei o texto no cache. Mande a ideia de novo!");
  }

  if (query.data === "opcao_texto") {
    await bot.sendMessage(chatId, `📖 *Estratégia:*\n\n${textoOriginal}`, { parse_mode: "Markdown" });
  } 
  else if (query.data === "opcao_audio") {
    bot.sendChatAction(chatId, "record_voice");
    const audioPath = path.join(__dirname, `vocal_${chatId}.wav`);
    
    try {
      // Limpeza de caracteres que o Piper (Python) costuma engasgar
      const textoLimpo = textoOriginal
        .replace(/[*#_`]/g, '') 
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      console.log(`🎙️ Enviando para Piper: ${textoLimpo.substring(0, 50)}...`);

      const response = await axios({
        method: 'post',
        url: PIPER_URL,
        data: { text: textoLimpo },
        headers: { 'Content-Type': 'application/json' },
        responseType: 'stream',
        timeout: 45000 
      });

      const writer = fs.createWriteStream(audioPath);
      response.data.pipe(writer);

      // AGUARDA O ARQUIVO SER TOTALMENTE ESCRITO
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      console.log("💾 Arquivo WAV pronto. Enviando ao Telegram...");

      await bot.sendVoice(chatId, audioPath);
      console.log("✅ Áudio enviado com sucesso!");

      // Deleta o arquivo após o envio
      if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);

    } catch (e) {
      console.error("❌ Erro no Piper:", e.response ? `Status ${e.response.status}` : e.message);
      bot.sendMessage(chatId, "❌ Erro ao gerar áudio. Verifique se o container Piper está com o modelo carregado.");
      if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
    }
  }
  bot.answerCallbackQuery(query.id);
});

// --- ENTRADA DE TEXTO ---
bot.on("text", (msg) => { 
  if (msg.text && !msg.text.startsWith("/")) {
      processarIA(msg.text, msg.chat.id); 
  }
});

// --- ENTRADA DE VOZ (WHISPER) ---
bot.on("voice", async (msg) => {
  const chatId = msg.chat.id;
  const caminhoTemp = path.join(__dirname, `temp_${Date.now()}.ogg`);
  
  try {
     bot.sendChatAction(chatId, "typing");
    bot.sendMessage(chatId, "🎤 Ouvindo seu áudio...");
    bot.sendMessage(chatId, "🎤 Ouvindo seu áudio...");
    const arquivo = await bot.getFile(msg.voice.file_id);
    const linkTelegram = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${arquivo.file_path}`;
    
    const res = await axios({ url: linkTelegram, responseType: "stream" });
    const writer = fs.createWriteStream(caminhoTemp);
    res.data.pipe(writer);

    writer.on("finish", async () => {
      try {
        const form = new FormData();
        form.append("file", fs.createReadStream(caminhoTemp));
        
        console.log("📡 Enviando para Whisper...");
        const whisperRes = await axios.post(WHISPER_URL, form, { 
          headers: form.getHeaders(), 
          timeout: 60000 
        });

        if (whisperRes.data && whisperRes.data.text) {
          const transcricao = whisperRes.data.text;
          bot.sendMessage(chatId, `📝 Você disse: "${transcricao}"`);
          await processarIA(transcricao, chatId);
        }
      } catch (err) {
        console.error("❌ Erro Whisper:", err.message);
        bot.sendMessage(chatId, "⚠️ Falha ao transcrever áudio.");
      } finally {
        if (fs.existsSync(caminhoTemp)) fs.unlinkSync(caminhoTemp);
      }
    });
  } catch (e) {
    console.error("❌ Erro download voz:", e.message);
  }
});

console.log("🚀 MAESTRO IA ONLINE - AGUARDANDO COMANDOS");