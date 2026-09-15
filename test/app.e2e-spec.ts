import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";
import { AppModule } from "src/modules/app.module";

describe("App (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    process.env.KAKAO_CLIENT_ID = "test";
    process.env.KAKAO_CALLBACK_URL = "http://localhost/api/auth/kakao/callback";
    process.env.JWT_ACCESS_TOKEN_SECRET = "test";
    process.env.JWT_REFRESH_TOKEN_SECRET = "test";

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("/auth/kakao (GET) redirects to kakao oauth", async () => {
    const response = await request(app.getHttpServer()).get("/auth/kakao").expect(302);
    expect(response.headers.location).toContain("kauth.kakao.com");
  });

  it("/mcp (POST) without token is 401", async () => {
    await request(app.getHttpServer()).post("/mcp").send({}).expect(401);
  });
});
