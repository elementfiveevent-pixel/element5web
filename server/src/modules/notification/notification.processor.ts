import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { Worker, Job } from "bullmq";
import { RedisService } from "../../common/redis/redis.service";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class NotificationProcessor implements OnModuleInit, OnModuleDestroy {
  private worker!: Worker;

  constructor(
    private redisService: RedisService,
    private prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.worker = new Worker(
      "notifications",
      async (job: Job) => {
        if (job.name === "email") {
          await this.processEmail(job.data);
        } else if (job.name === "push") {
          await this.processPush(job.data);
        }
      },
      { connection: this.redisService.getClient() as any },
    );

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

  private async processEmail(data: { to: string; subject: string; text: string }) {
    console.log(`📧 [Worker] Sending email to ${data.to}: ${data.subject}`);
    // Integrates with SMTP / Brevo API in production
    // (Stubbed here for local runs, which logs the payload and prints trace logs)
  }

  private async processPush(data: { userId: string; title: string; body: string }) {
    console.log(`📱 [Worker] Sending push to user ${data.userId}: ${data.title}`);
    
    // Save push notification to database
    await this.prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        body: data.body,
        type: "SYSTEM",
      },
    });
  }
}
