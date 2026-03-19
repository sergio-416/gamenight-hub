import { ConfigService } from "@nestjs/config";
import { Test, type TestingModule } from "@nestjs/testing";
import { CacheService } from "./cache.service.js";

describe("CacheService", () => {
  let service: CacheService;

  const mockConfigService = {
    get: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockConfigService.get.mockReturnValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  describe("graceful degradation", () => {
    it("should not be connected when REDIS_URL is not configured", () => {
      service.onModuleInit();

      expect(service.isConnected).toBe(false);
    });

    it("should return null from get() when Redis is not connected", async () => {
      service.onModuleInit();

      const result = await service.get("any-key");

      expect(result).toBeNull();
    });

    it("should silently no-op on set() when Redis is not connected", async () => {
      service.onModuleInit();

      await expect(
        service.set("key", { data: true }, 3600)
      ).resolves.toBeUndefined();
    });

    it("should silently no-op on del() when Redis is not connected", async () => {
      service.onModuleInit();

      await expect(service.del("key")).resolves.toBeUndefined();
    });
  });
});