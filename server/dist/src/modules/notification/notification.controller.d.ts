import { PrismaService } from "../../prisma/prisma.service";
export declare class NotificationController {
    private prisma;
    constructor(prisma: PrismaService);
    getNotifications(user: any): Promise<{
        id: string;
        title: string;
        createdAt: Date;
        userId: string;
        type: string;
        isRead: boolean;
        body: string;
    }[]>;
    markAsRead(user: any, id: string): Promise<{
        id: string;
        title: string;
        createdAt: Date;
        userId: string;
        type: string;
        isRead: boolean;
        body: string;
    }>;
}
