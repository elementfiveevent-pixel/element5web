import { PrismaService } from "../../prisma/prisma.service";
export declare class NotificationController {
    private prisma;
    constructor(prisma: PrismaService);
    getNotifications(user: any): Promise<any>;
    markAsRead(user: any, id: string): Promise<any>;
}
