import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private dbConnected = false;

  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Short connection timeout so the server doesn't hang on startup
      connectionTimeoutMillis: 5000,
    });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.dbConnected = true;
      this.logger.log("✅ PostgreSQL connected via Prisma");
    } catch (err: any) {
      this.logger.warn(
        `⚠ PostgreSQL unavailable: ${err?.message ?? err}. Running without database.`
      );
      // Do NOT rethrow — let the rest of the app boot
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch {
      // ignore disconnect errors on shutdown
    }
  }

  isConnected(): boolean {
    return this.dbConnected;
  }
}
