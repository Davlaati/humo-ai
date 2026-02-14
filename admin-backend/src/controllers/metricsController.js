import { getAdminLogs, getAiUsage, getLogs } from '../services/metricsService.js';
import { ok } from '../utils/http.js';

export async function aiUsageController(req, res, next) {
  try {
    return ok(res, await getAiUsage(req.query));
  } catch (error) {
    return next(error);
  }
}

export async function aiUsageByUserController(req, res, next) {
  try {
    return ok(res, await getAiUsage({ ...req.query, userId: req.params.userId }));
  } catch (error) {
    return next(error);
  }
}

export async function logsController(req, res, next) {
  try {
    return ok(res, await getLogs(req.query));
  } catch (error) {
    return next(error);
  }
}

export async function adminLogsController(req, res, next) {
  try {
    return ok(res, await getAdminLogs(req.query));
  } catch (error) {
    return next(error);
  }
}
