import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { CustomUnauthorizedException } from "src/common/errors/custom-exceptions";
import { AuthErrorMessage } from "./auth.error";
import { TokenPayload } from "./auth.types";
import { authCookieOptions } from "./cookie-options";

export const setTokenCookies = (res: Response, tokenData: TokenPayload) => {
  res.setHeader("Authorization", `Bearer ${tokenData.accessToken}`);
  res.cookie("access_token", tokenData.accessToken, authCookieOptions);
  res.cookie("refresh_token", tokenData.refreshToken, authCookieOptions);
};

export const deviceIdFromRequest = (req: Request) => {
  const deviceId = deviceIdFromHeader(req);
  if (!deviceId) throw new CustomUnauthorizedException(AuthErrorMessage.AuthRequired);
  return deviceId;
};

export const deviceIdOrRandom = (req: Request) => deviceIdFromHeader(req) ?? uuidv4();

const deviceIdFromHeader = (req: Request) => {
  const value = req.headers["x-device-id"];
  return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
};
