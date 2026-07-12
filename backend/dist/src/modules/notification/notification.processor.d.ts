import { OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { RedisService } from "../../common/redis/redis.service";
import { PrismaService } from "../../prisma/prisma.service";
export declare class NotificationProcessor implements OnModuleInit, OnModuleDestroy {
    private redisService;
    private prisma;
    private worker;
    constructor(redisService: RedisService, prisma: PrismaService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private processEmail;
    private processPush;
}
