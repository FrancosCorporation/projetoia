const cache = new Map();
const TTL_MS = 15 * 60 * 1000;
const MAX_ENTRIES = 1000;

function purgeExpired() {
  const now = Date.now();
  for (const [chatId, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(chatId);
  }
}

function set(chatId, text) {
  purgeExpired();
  if (!cache.has(chatId) && cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(chatId, { text, expiresAt: Date.now() + TTL_MS });
}

function get(chatId) {
  const entry = cache.get(chatId);
  if (!entry || entry.expiresAt <= Date.now()) {
    cache.delete(chatId);
    return null;
  }
  return entry.text;
}

function clear(chatId) {
  cache.delete(chatId);
}

module.exports = { clear, get, set };
