import { type INestApplication, VersioningType } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { DB_TOKEN } from "../src/database/database.module.js";
import { HealthController } from "../src/modules/health/health.controller.js";

describe("Health (e2e)", () => {
  let app: INestApplication;

  const mockDb = {
    execute: vi.fn().mockResolvedValue([{ value: 1 }]),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: DB_TOKEN, useValue: mockDb }],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    app.enableVersioning({ type: VersioningType.URI });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/v1/health → returns 200 with status up", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/health")
      .expect(200);

    expect(res.body.status).toBe("ok");
  });

  it("GET /api/v1/health/ready → returns 200 with database check", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/health/ready")
      .expect(200);

    expect(res.body.status).toBe("ok");
    expect(res.body.postgres).toBe("up");
  });
});
