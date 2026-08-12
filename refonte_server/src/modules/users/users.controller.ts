import type { Request, Response } from 'express';
import * as usersService from './users.service';
import type { GrantBookInput, ListUsersQuery } from './users.schema';

export async function listUsersHandler(req: Request, res: Response) {
  const result = await usersService.listUsers(req.query as unknown as ListUsersQuery);
  res.json({ success: true, data: result });
}

export async function getUserHandler(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  const user = await usersService.getUserById(id);
  res.json({ success: true, data: user });
}

export async function listBookGrantsHandler(req: Request, res: Response) {
  const result = await usersService.listBookGrants(req.query as unknown as ListUsersQuery);
  res.json({ success: true, data: result });
}

export async function revokeBookGrantHandler(req: Request, res: Response) {
  const { grantId } = req.params as unknown as { grantId: number };
  await usersService.revokeBookGrant(grantId);
  res.status(204).send();
}

export async function deleteUserHandler(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  await usersService.softDeleteUser(id);
  res.status(204).send();
}

export async function grantBookHandler(req: Request, res: Response) {
  const { id } = req.params as unknown as { id: number };
  const grant = await usersService.grantBookToUser(id, req.body as GrantBookInput, req.user!.id);
  res.status(201).json({ success: true, data: grant });
}

export async function getMyDashboardHandler(req: Request, res: Response) {
  const dashboard = await usersService.getUserDashboard(req.user!.id);
  res.json({ success: true, data: dashboard });
}

export async function getAdminDashboardHandler(_req: Request, res: Response) {
  const dashboard = await usersService.getAdminDashboard();
  res.json({ success: true, data: dashboard });
}
