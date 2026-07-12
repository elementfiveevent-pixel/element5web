import { AdminService } from "./admin.service";
export declare class AdminController {
    private adminService;
    constructor(adminService: AdminService);
    getStats(): Promise<{
        users: any;
        creators: any;
        events: any;
        votesCast: any;
        ticketsCheckedIn: any;
        timestamp: string;
    }>;
    getReports(): Promise<any[]>;
    resolveReport(user: any, reportId: string, action: string): Promise<any>;
    getAudits(): Promise<any[]>;
}
