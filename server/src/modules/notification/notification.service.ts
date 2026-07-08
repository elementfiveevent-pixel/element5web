import { Injectable, OnModuleInit } from "@nestjs/common";
import { Queue } from "bullmq";
import { RedisService } from "../../common/redis/redis.service";

@Injectable()
export class NotificationService implements OnModuleInit {
  private queue!: Queue;

  constructor(private redisService: RedisService) {}

  onModuleInit() {
    this.queue = new Queue("notifications", {
      connection: this.redisService.getClient() as any,
    });
  }

  async sendEmail(to: string, subject: string, text: string) {
    await this.queue.add("email", { to, subject, text });
  }

  async sendPush(userId: string, title: string, body: string) {
    await this.queue.add("push", { userId, title, body });
  }
}
