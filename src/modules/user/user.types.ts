export class UpdateEmailInput {
  email!: string;
  phoneVerificationToken!: string;
}

export type UpdateEmailRepositoryInput = UpdateEmailInput & {
  userId: string;
};

export class UpdatePasswordInput {
  password!: string;
  phoneVerificationToken!: string;
}

export type UpdatePasswordRepositoryInput = UpdatePasswordInput & {
  userId: string;
};

export class UserPayload {
  email!: string;
}
