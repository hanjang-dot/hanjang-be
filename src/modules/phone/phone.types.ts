import { TokenPayload } from "src/modules/auth/auth.types";

export enum PhoneVerificationPurpose {
  Signup = "signup",
  Login = "login",
  PasswordReset = "password_reset",
}

export class RequestPhoneCodeInput {
  phone!: string;
  purpose!: PhoneVerificationPurpose;
}

export class RequestPhoneCodePayload {
  ok!: boolean;
}

export class VerifyPhoneCodeInput {
  phone!: string;
  code!: string;
}

export class VerifyPhoneCodePayload {
  existingUser!: boolean;
  phoneVerificationToken?: string;
  tokenPayload?: TokenPayload;
}

export class CompletePhoneSignupInput {
  phoneVerificationToken!: string;
  email!: string;
  password!: string;
}

export class ResetPasswordWithPhoneInput {
  phone!: string;
  code!: string;
  password!: string;
}

export class AttachPhoneToMeInput {
  phone!: string;
  code!: string;
}
