import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ReportStatus } from "@prisma/client";

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [totalUsers, totalArtists, totalEvents, totalVotes, totalOrganizers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.artistProfile.count(),
      this.prisma.event.count(),
      this.prisma.vote.count(),
      this.prisma.roleAssignment.count({ where: { role: "ORG_ADMIN" } }),
    ]);

    // Simple event attendance and ticket reconciliations
    const ticketsCheckedIn = await this.prisma.eventTicket.count({
      where: { isUsed: true },
    });

    return {
      users: totalUsers,
      creators: totalArtists,
      organizers: totalOrganizers,
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

  async listPendingUsers() {
    return this.prisma.user.findMany({
      where: { status: "PENDING_VERIFICATION" },
      include: { roles: true },
    });
  }

  async verifyUser(userId: string, action: "APPROVE" | "REJECT") {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const newStatus = action === "APPROVE" ? "ACTIVE" : "SUSPENDED";

    return this.prisma.user.update({
      where: { id: userId },
      data: { status: newStatus },
    });
  }

  async verifyArtist(artistId: string, isVerified: boolean) {
    const artist = await this.prisma.artistProfile.findUnique({
      where: { id: artistId },
    });

    if (!artist) {
      throw new NotFoundException("Artist profile not found");
    }

    return this.prisma.artistProfile.update({
      where: { id: artistId },
      data: { isVerified },
    });
  }

  async listAllOrganizers() {
    return this.prisma.$queryRaw`
      SELECT u.id, u.email, u."fullName", u."mobileNumber", u."profilePhotoUrl", u.status, u."createdAt"
      FROM "User" u
      WHERE EXISTS (
        SELECT 1 FROM "RoleAssignment" ra 
        WHERE ra."userId" = u.id AND ra.role = 'ORG_ADMIN'
      )
      ORDER BY u."createdAt" DESC
    `;
  }
}
