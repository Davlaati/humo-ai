import { getSingleUser, getUsers, setUserBan, updateUser } from '../services/userService.js';
import { ok } from '../utils/http.js';

export async function listUsersController(req, res, next) {
  try {
    return ok(res, await getUsers(req.query));
  } catch (error) {
    return next(error);
  }
}

export async function getUserController(req, res, next) {
  try {
    return ok(res, await getSingleUser(req.params.id));
  } catch (error) {
    return next(error);
  }
}

export async function patchUserController(req, res, next) {
  try {
    return ok(res, await updateUser(req.params.id, req.body, req.admin.sub));
  } catch (error) {
    return next(error);
  }
}

export async function banUserController(req, res, next) {
  try {
    return ok(res, await setUserBan(req.params.id, 'blocked', req.admin.sub));
  } catch (error) {
    return next(error);
  }
}

export async function unbanUserController(req, res, next) {
  try {
    return ok(res, await setUserBan(req.params.id, 'active', req.admin.sub));
  } catch (error) {
    return next(error);
  }
}
