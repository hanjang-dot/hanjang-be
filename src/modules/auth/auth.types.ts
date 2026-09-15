import { Request } from "express";

export type JwtPayload = {
  userId: string;
  deviceId?: string;
};

export type AuthRequest = Request & {
  user: JwtPayload;
  cookies: {
    access_token?: string;
    refresh_token?: string;
  };
};

export type RefreshAuthRequest = Request & {
  user: JwtPayload & { deviceId: string };
  cookies: {
    refresh_token: string;
  };
};

export type KakaoRequest = Request & {
  user: KakaoProfile;
};

export type KakaoRawProfile = {
  id: string;
  _json?: {
    kakao_account?: {
      email?: string;
    };
  };
};

export class SignupAuthInput {
  email!: string;
  password!: string;
  userName!: string;
  phoneVerificationToken!: string;
}

export type SignupAuthRepositoryInput = SignupAuthInput & {
  userId: string;
  phone: string;
};

export type KakaoProfile = {
  providerUserId: string;
  email?: string;
};

export type KakaoLoginResult = {
  kakaoPhoneVerificationToken: string;
};

export class SigninAuthInput {
  email!: string;
  password!: string;
  phoneVerificationToken!: string;
}

export class TokenPayload {
  accessToken!: string;
  refreshToken!: string;
}

export class SignedPayload {
  isSigned!: boolean;
}
