import { withTransaction } from '../config/db.js';
import { addAdminLog } from '../repositories/adminRepository.js';
import { getAllSettings, upsertSettings } from '../repositories/settingsRepository.js';

const settingsCache = new Map();
let cacheLoadedAt = 0;
const CACHE_TTL_MS = 30_000;

export async function fetchSettings() {
  const now = Date.now();
  if (now - cacheLoadedAt < CACHE_TTL_MS && settingsCache.size > 0) {
    return Array.from(settingsCache.values());
  }

  const settings = await getAllSettings();
  settingsCache.clear();
  settings.forEach((item) => settingsCache.set(item.key, item));
  cacheLoadedAt = now;
  return settings;
}

export async function updateSettings(entries, adminId) {
  const updated = await withTransaction(async (client) => {
    const result = await upsertSettings(entries, client);
    await addAdminLog(adminId, 'settings_patch', null, client);
    return result;
  });

  updated.forEach((item) => settingsCache.set(item.key, item));
  cacheLoadedAt = Date.now();
  return updated;
}
