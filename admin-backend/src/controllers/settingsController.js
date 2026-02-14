import { fetchSettings, updateSettings } from '../services/settingsService.js';
import { ok } from '../utils/http.js';

export async function getSettingsController(_req, res, next) {
  try {
    return ok(res, await fetchSettings());
  } catch (error) {
    return next(error);
  }
}

export async function patchSettingsController(req, res, next) {
  try {
    return ok(res, await updateSettings(req.body.items, req.admin.sub));
  } catch (error) {
    return next(error);
  }
}
