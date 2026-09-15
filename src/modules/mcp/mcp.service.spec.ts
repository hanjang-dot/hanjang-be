import { describe, expect, it } from "@jest/globals";
import { verifyAdminAuthorization } from "./mcp.service";

describe("verifyAdminAuthorization", () => {
  const adminVerify = async () => ({ adminId: "a-1", role: "admin" });

  it("토큰이 없으면 401이다", async () => {
    await expect(verifyAdminAuthorization(adminVerify, undefined)).rejects.toMatchObject({ status: 401 });
    await expect(verifyAdminAuthorization(adminVerify, "Basic abc")).rejects.toMatchObject({ status: 401 });
  });

  it("검증 실패 토큰은 401이다", async () => {
    const badVerify = async () => {
      throw new Error("invalid");
    };
    await expect(verifyAdminAuthorization(badVerify, "Bearer x")).rejects.toMatchObject({ status: 401 });
  });

  it("admin이 아닌 클레임은 403이다", async () => {
    const studentVerify = async () => ({ role: undefined as string | undefined, adminId: undefined });
    await expect(verifyAdminAuthorization(studentVerify, "Bearer x")).rejects.toMatchObject({ status: 403 });
  });

  it("admin JWT는 payload를 반환한다", async () => {
    await expect(verifyAdminAuthorization(adminVerify, "Bearer good")).resolves.toEqual({
      adminId: "a-1",
      role: "admin",
    });
  });
});
