"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
let RedisService = RedisService_1 = class RedisService {
    configService;
    client = null;
    connected = false;
    logger = new common_1.Logger(RedisService_1.name);
    constructor(configService) {
        this.configService = configService;
    }
    onModuleInit() {
        const host = this.configService.get("REDIS_HOST") || "localhost";
        const port = this.configService.get("REDIS_PORT") || 6379;
        const password = this.configService.get("REDIS_PASSWORD") || undefined;
        this.client = new ioredis_1.default({
            host,
            port,
            password,
            maxRetriesPerRequest: null,
            retryStrategy: (times) => {
                if (times >= 3) {
                    this.logger.warn(`Redis unavailable after ${times} retries. Running without cache.`);
                    return null;
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
        this.client.on("error", (err) => {
            if (this.connected) {
                this.logger.warn(`Redis error: ${err.message}`);
            }
            this.connected = false;
        });
        this.client.connect().catch(() => {
            this.logger.warn("Redis not available — caching disabled. Start Redis to enable.");
        });
    }
    onModuleDestroy() {
        if (this.client) {
            this.client.disconnect();
        }
    }
    isConnected() {
        return this.connected;
    }
    getClient() {
        return this.client;
    }
    async get(key) {
        if (!this.connected || !this.client)
            return null;
        try {
            return await this.client.get(key);
        }
        catch {
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        if (!this.connected || !this.client)
            return "OK";
        try {
            if (ttlSeconds) {
                return await this.client.set(key, value, "EX", ttlSeconds);
            }
            return await this.client.set(key, value);
        }
        catch {
            return "OK";
        }
    }
    async del(key) {
        if (!this.connected || !this.client)
            return 0;
        try {
            return await this.client.del(key);
        }
        catch {
            return 0;
        }
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map