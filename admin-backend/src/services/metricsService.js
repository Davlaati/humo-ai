import { listAdminLogs, listAiUsage, listSystemLogs } from '../repositories/metricsRepository.js';

export const getAiUsage = (query) => listAiUsage(query);
export const getLogs = (query) => listSystemLogs(query);
export const getAdminLogs = (query) => listAdminLogs(query);
