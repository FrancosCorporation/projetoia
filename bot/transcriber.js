const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function transcrever(audioPath, url) {
    try {
        const form = new FormData();
        form.append('file', fs.createReadStream(audioPath), {
            filename: 'voice.ogg',
            contentType: 'audio/ogg',
        });
        const endpoint = new URL(url);
        endpoint.searchParams.set('language', 'pt');
        const response = await axios.post(endpoint.toString(), form, {
            headers: form.getHeaders(),
            timeout: 180000,
            maxRedirects: 0,
            maxBodyLength: 20 * 1024 * 1024,
            maxContentLength: 1024 * 1024,
        });
        return typeof response.data?.text === 'string' ? response.data.text.trim().slice(0, 4000) : null;
    } catch (error) {
        console.error('Falha no serviço de transcrição:', error.code || 'WHISPER_ERROR');
        return null;
    }
}

module.exports = { transcrever };
