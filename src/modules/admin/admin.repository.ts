import { Inject, Injectable } from "@nestjs/common";
import { and, eq, gt, isNull } from "drizzle-orm";
import { hashToken } from "src/common/security/token-hash";
import { Database, DRIZZLE } from "src/modules/database/database.module";
import { adminInvites, admins, type Admin, type AdminInvite } from "src/modules/database/schema";

@Injectable()
export class AdminRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  findAdminByLoginId(loginId: string): Promise<Admin | undefined> {
    return this.db.query.admins.findFirst({ where: eq(admins.loginId, loginId) });
  }

  async createInvite(input: { token: string; createdByAdminId: string; expiresAt: Date }): Promise<AdminInvite> {
    const { token, ...values } = input;
    const [invite] = await this.db
      .insert(adminInvites)
      .values({ ...values, tokenHash: hashToken(token) })
      .returning();
    return invite;
  }

  async acceptInvite(input: {
    token: string;
    adminId: string;
    loginId: string;
    passwordHash: string;
  }): Promise<Admin | undefined> {
    return this.db.transaction(async (tx) => {
      const [invite] = await tx
        .update(adminInvites)
        .set({ usedAt: new Date() })
        .where(
          and(
            eq(adminInvites.tokenHash, hashToken(input.token)),
            isNull(adminInvites.usedAt),
            gt(adminInvites.expiresAt, new Date()),
          ),
        )
        .returning();
      if (!invite) return undefined;

      const [admin] = await tx
        .insert(admins)
        .values({
          adminId: input.adminId,
          loginId: input.loginId,
          passwordHash: input.passwordHash,
        })
        .returning();

      return admin;
    });
  }
}
