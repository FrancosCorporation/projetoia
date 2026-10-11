// searcher.js
const axios = require("axios");

async function buscar(termo, searchUrl) {
    try {
        const res = await axios.get(searchUrl, {
            params: { q: String(termo).slice(0, 500), format: 'json', language: 'pt-BR' },
            timeout: 12000,
            maxRedirects: 0,
            maxContentLength: 512 * 1024,
        });

        if (res.data?.results?.length > 0) {
            return res.data.results.slice(0, 3).map((result) => {
                const title = String(result.title || 'Fonte').slice(0, 250);
                const snippet = String(result.content || result.snippet || '').slice(0, 900);
                return `Fonte: ${title} | Resumo: ${snippet}`;
            }).join('\n').slice(0, 3500);
        }
        return "Nenhum resultado relevante encontrado.";
    } catch (e) {
        return "Erro na busca web.";
    }
}

module.exports = { buscar };
