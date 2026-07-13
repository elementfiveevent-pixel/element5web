import { PrismaService } from "../../prisma/prisma.service";
export declare class AdminService {
    private prisma;
    constructor(prisma: PrismaService);
    getDashboardStats(): Promise<{
        users: any;
        creators: any;
        events: any;
        votesCast: any;
        ticketsCheckedIn: any;
        timestamp: string;
    }>;
    listReports(): Promise<any>;
    resolveReport(reportId: string, moderatorId: string, actionTaken: string): Promise<any>;
    listAuditLogs(): Promise<any>;
}
