import { Request } from "express";

export class AdminSigninInput {
  loginId!: string;
  password!: string;
}

export class AdminTokenPayload {
  accessToken!: string;
}

export class AdminInviteTokenPayload {
  token!: string;
  inviteUrl!: string;
  expiresAt!: Date;
}

export class AcceptAdminInviteInput {
  token!: string;
  loginId!: string;
  password!: string;
}

export type AdminJwtPayload = {
  adminId: string;
  role?: string;
};

export type AdminRequest = Request & {
  user: AdminJwtPayload;
};
