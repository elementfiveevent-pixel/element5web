import { PrismaService } from "../../prisma/prisma.service";
export declare class AdminService {
    private prisma;
    constructor(prisma: PrismaService);
    getDashboardStats(): Promise<{
        users: number;
        creators: number;
        events: number;
        votesCast: number;
        ticketsCheckedIn: number;
        timestamp: string;
    }>;
    listReports(): Promise<({
        reporter: {
            email: string;
            fullName: string;
        };
        moderator: {
            fullName: string;
        } | null;
    } & {
        id: string;
        status: import("@prisma/client").$Enums.ReportStatus;
        createdAt: Date;
        updatedAt: Date;
        reporterId: string;
        targetType: string;
        targetId: string;
        reason: string;
        moderatorId: string | null;
        actionTaken: string | null;
    })[]>;
    resolveReport(reportId: string, moderatorId: string, actionTaken: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.ReportStatus;
        createdAt: Date;
        updatedAt: Date;
        reporterId: string;
        targetType: string;
        targetId: string;
        reason: string;
        moderatorId: string | null;
        actionTaken: string | null;
    }>;
    listAuditLogs(): Promise<({
        user: {
            email: string;
            fullName: string;
        };
    } & {
        id: string;
        action: string;
        createdAt: Date;
        userId: string;
        ipAddress: string | null;
        userAgent: string | null;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
    })[]>;
}
