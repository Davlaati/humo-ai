import { withTransaction } from '../config/db.js';
import { addAdminLog } from '../repositories/adminRepository.js';
import { addSystemLog } from '../repositories/metricsRepository.js';
import { getUserById, listUsers, patchUser, updateUserStatus } from '../repositories/userRepository.js';
import { AppError } from '../utils/http.js';

export async function getUsers(query) {
  return listUsers(query);
}

export async function getSingleUser(userId) {
  const user = await getUserById(userId);
  if (!user) throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
  return user;
}

export async function updateUser(userId, payload, adminId) {
  const user = await patchUser(userId, payload);
  if (!user) throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
  await addAdminLog(adminId, 'user_patch', userId);
  return user;
}

export async function setUserBan(userId, status, adminId) {
  return withTransaction(async (client) => {
    const user = await updateUserStatus(userId, status, client);
    if (!user) throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    await addSystemLog('user_status_change', `User ${userId} status changed to ${status}`, { userId, status }, client);
    await addAdminLog(adminId, status === 'blocked' ? 'user_ban' : 'user_unban', userId, client);
    return user;
  });
}
