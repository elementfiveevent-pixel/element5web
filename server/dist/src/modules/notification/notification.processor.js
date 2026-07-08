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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationProcessor = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("bullmq");
const redis_service_1 = require("../../common/redis/redis.service");
const prisma_service_1 = require("../../prisma/prisma.service");
let NotificationProcessor = class NotificationProcessor {
    redisService;
    prisma;
    worker;
    constructor(redisService, prisma) {
        this.redisService = redisService;
        this.prisma = prisma;
    }
    onModuleInit() {
        this.worker = new bullmq_1.Worker("notifications", async (job) => {
            if (job.name === "email") {
                await this.processEmail(job.data);
            }
            else if (job.name === "push") {
                await this.processPush(job.data);
            }
        }, { connection: this.redisService.getClient() });
        this.worker.on("completed", (job) => {
            console.log(`✅ Notification job ${job.id} completed`);
        });
        this.worker.on("failed", (job, err) => {
            console.error(`❌ Notification job ${job?.id} failed:`, err);
        });
    }
    onModuleDestroy() {
        this.worker.close();
    }
    async processEmail(data) {
        console.log(`📧 [Worker] Sending email to ${data.to}: ${data.subject}`);
    }
    async processPush(data) {
        console.log(`📱 [Worker] Sending push to user ${data.userId}: ${data.title}`);
        await this.prisma.notification.create({
            data: {
                userId: data.userId,
                title: data.title,
                body: data.body,
                type: "SYSTEM",
            },
        });
    }
};
exports.NotificationProcessor = NotificationProcessor;
exports.NotificationProcessor = NotificationProcessor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        prisma_service_1.PrismaService])
], NotificationProcessor);
//# sourceMappingURL=notification.processor.js.map