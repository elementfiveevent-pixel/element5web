import { AdminService } from "./admin.service";
export declare class AdminController {
    private adminService;
    constructor(adminService: AdminService);
    getStats(): Promise<{
        users: number;
        creators: number;
        events: number;
        votesCast: number;
        ticketsCheckedIn: number;
        timestamp: string;
    }>;
    getReports(): Promise<({
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
    resolveReport(user: any, reportId: string, action: string): Promise<{
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
    getAudits(): Promise<({
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
