const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

async function transcrever(audioPath, url) {
    try {
        const form = new FormData();
        form.append("audio_file", fs.createReadStream(audioPath), { filename: 'audio.ogg' });
        const res = await axios.post(`${url}?task=transcribe&language=pt&output=json`, form, {
            headers: form.getHeaders(),
            timeout: 30000 // Reduzi para 30s para não travar o bot
        });
        return res.data?.text;
    } catch (e) {
        console.error("⚠️ Whisper Offline ou erro na transcrição");
        return null; // Retorna null em vez de estourar um erro
    }
}
module.exports = { transcrever };