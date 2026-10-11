const axios = require('axios');

const checks = [
  { name: 'Whisper', key: 'WHISPER_HEALTH' },
  { name: 'Ollama', key: 'OLLAMA_HEALTH' },
  { name: 'Piper', key: 'PIPER_HEALTH' },
  { name: 'SearXNG', key: 'SEARCH' },
];

async function verificarServidores(services) {
  const results = await Promise.all(checks.map(async ({ name, key }) => {
    const url = services[key];
    if (!url) return { name, online: false };
    try {
      const response = await axios.get(url, {
        timeout: 3000,
        maxRedirects: 0,
        maxContentLength: 256 * 1024,
        validateStatus: (status) => status >= 200 && status < 400,
        ...(name === 'SearXNG' ? { params: { q: 'health', format: 'json' } } : {}),
      });
      if (name === 'SearXNG' && !Array.isArray(response.data?.results)) {
        return { name, online: false };
      }
      return { name, online: true };
    } catch {
      return { name, online: false };
    }
  }));

  console.log('\n🔍 Estado dos serviços');
  for (const result of results) {
    console.log(`${result.online ? '✅' : '⚠️'} ${result.name}: ${result.online ? 'disponível' : 'indisponível'}`);
  }
  return Object.fromEntries(results.map(({ name, online }) => [name, online]));
}

module.exports = { verificarServidores };
