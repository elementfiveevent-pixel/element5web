import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ReportStatus } from "@prisma/client";

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [totalUsers, totalArtists, totalEvents, totalVotes] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.artistProfile.count(),
      this.prisma.event.count(),
      this.prisma.vote.count(),
    ]);

    // Simple event attendance and ticket reconciliations
    const ticketsCheckedIn = await this.prisma.eventTicket.count({
      where: { isUsed: true },
    });

    return {
      users: totalUsers,
      creators: totalArtists,
      events: totalEvents,
      votesCast: totalVotes,
      ticketsCheckedIn,
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

  async resolveReport(reportId: string, moderatorId: string, actionTaken: string) {
    const report = await this.prisma.moderationReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException("Moderation report not found");
    }

    return this.prisma.moderationReport.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.RESOLVED,
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
}
