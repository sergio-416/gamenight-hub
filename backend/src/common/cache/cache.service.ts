import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";
// biome-ignore lint/style/useImportType: DI token needed at runtime
import { ConfigService } from "@nestjs/config";
import type { Redis as RedisClient } from "ioredis";
import Redis from "ioredis";

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  readonly #logger = new Logger(CacheService.name);
  #redis: RedisClient | null = null;

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {}

  onModuleInit() {
    const redisUrl = this.configService.get<string>("REDIS_URL");
    if (!redisUrl) return;

    this.#redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.#redis.on("error", () => {
      this.#logger.warn("Redis connection failed — falling back to no-cache");
      this.#redis?.disconnect();
      this.#redis = null;
    });

    this.#redis.connect().catch(() => {});
  }

  onModuleDestroy() {
    this.#redis?.disconnect();
  }

  get isConnected(): boolean {
    return this.#redis?.status === "ready";
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.#redis) return null;
    const data = await this.#redis.get(key);
    return data ? (JSON.parse(data) as T) : null;
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!this.#redis) return;
    await this.#redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  }

  async del(key: string): Promise<void> {
    if (!this.#redis) return;
    await this.#redis.del(key);
  }
}
