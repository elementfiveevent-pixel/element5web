import { OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
export declare class RedisService implements OnModuleInit, OnModuleDestroy {
    private configService;
    private client;
    private connected;
    private readonly logger;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    isConnected(): boolean;
    getClient(): Redis | null;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttlSeconds?: number): Promise<string>;
    del(key: string): Promise<number>;
}
