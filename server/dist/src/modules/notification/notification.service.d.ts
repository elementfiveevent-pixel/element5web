import { OnModuleInit } from "@nestjs/common";
import { RedisService } from "../../common/redis/redis.service";
export declare class NotificationService implements OnModuleInit {
    private redisService;
    private queue;
    constructor(redisService: RedisService);
    onModuleInit(): void;
    sendEmail(to: string, subject: string, text: string): Promise<void>;
    sendPush(userId: string, title: string, body: string): Promise<void>;
}
