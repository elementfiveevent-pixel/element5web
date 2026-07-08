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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let AdminService = class AdminService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardStats() {
        const [totalUsers, totalArtists, totalEvents, totalVotes] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.artistProfile.count(),
            this.prisma.event.count(),
            this.prisma.vote.count(),
        ]);
        const ticketStats = await this.prisma.eventTicket.aggregate({
            _count: { id: true },
            where: { isUsed: true },
        });
        return {
            users: totalUsers,
            creators: totalArtists,
            events: totalEvents,
            votesCast: totalVotes,
            ticketsCheckedIn: ticketStats._count.id,
            timestamp: new Date().toISOString(),
        };
    }
    async listReports() {
        return this.prisma.moderationReport.findMany({
            include: {
                reporter: { select: { fullName: true, email: true } },
                moderator: { select: { fullName: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    }
    async resolveReport(reportId, moderatorId, actionTaken) {
        const report = await this.prisma.moderationReport.findUnique({
            where: { id: reportId },
        });
        if (!report) {
            throw new common_1.NotFoundException("Moderation report not found");
        }
        return this.prisma.moderationReport.update({
            where: { id: reportId },
            data: {
                status: client_1.ReportStatus.RESOLVED,
                moderatorId,
                actionTaken,
            },
        });
    }
    async listAuditLogs() {
        return this.prisma.auditLog.findMany({
            include: {
                user: { select: { fullName: true, email: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 100,
        });
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map