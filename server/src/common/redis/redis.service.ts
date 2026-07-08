import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null;
  private connected = false;
  private readonly logger = new Logger(RedisService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>("REDIS_HOST") || "localhost";
    const port = this.configService.get<number>("REDIS_PORT") || 6379;
    const password = this.configService.get<string>("REDIS_PASSWORD") || undefined;

    this.client = new Redis({
      host,
      port,
      password,
      maxRetriesPerRequest: null,
      // Don't retry forever — give up quickly in dev when Redis isn't running
      retryStrategy: (times) => {
        if (times >= 3) {
          this.logger.warn(
            `Redis unavailable after ${times} retries. Running without cache.`
          );
          return null; // stop retrying
        }
        return Math.min(times * 200, 1000);
      },
      enableOfflineQueue: false,
      lazyConnect: true,
    });

    this.client.on("connect", () => {
      this.connected = true;
      this.logger.log(`✅ Redis connected to ${host}:${port}`);
    });

    this.client.on("error", (err: Error) => {
      if (this.connected) {
        this.logger.warn(`Redis error: ${err.message}`);
      }
      this.connected = false;
    });

    // Attempt connection but don't throw if it fails
    this.client.connect().catch(() => {
      this.logger.warn("Redis not available — caching disabled. Start Redis to enable.");
    });
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  getClient(): Redis | null {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    if (!this.connected || !this.client) return null;
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<string> {
    if (!this.connected || !this.client) return "OK";
    try {
      if (ttlSeconds) {
        return await this.client.set(key, value, "EX", ttlSeconds);
      }
      return await this.client.set(key, value);
    } catch {
      return "OK";
    }
  }

  async del(key: string): Promise<number> {
    if (!this.connected || !this.client) return 0;
    try {
      return await this.client.del(key);
    } catch {
      return 0;
    }
  }
}
