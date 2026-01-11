// searcher.js
const axios = require("axios");

async function buscar(termo, searchUrl) {
    try {
        console.log(`🌐 [SEARCH] Pesquisando: "${termo}"`);
        const res = await axios.get(searchUrl, {
            params: { q: termo, format: "json", language: "pt-BR" },
            timeout: 15000
        });

        if (res.data?.results?.length > 0) {
            return res.data.results.slice(0, 3).map(r => {
                return `Fonte: ${r.title} | Resumo: ${r.content || r.snippet}`;
            }).join("\n");
        }
        return "Nenhum resultado relevante encontrado.";
    } catch (e) {
        return "Erro na busca web.";
    }
}

module.exports = { buscar };