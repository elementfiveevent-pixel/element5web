import { Controller, Get, Put, Param, Body, UseGuards } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole } from "@prisma/client";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags("Administrative Operations & Moderation")
@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get("stats")
  @ApiOperation({ summary: "Get system performance and ecosystem metrics" })
  async getStats() {
    return this.adminService.getDashboardStats();
  }

  @Get("reports")
  @ApiOperation({ summary: "List filed moderation content reports" })
  async getReports() {
    return this.adminService.listReports();
  }

  @Put("reports/:reportId/resolve")
  @ApiOperation({ summary: "Moderate content and mark report as resolved" })
  async resolveReport(
    @CurrentUser() user: any,
    @Param("reportId") reportId: string,
    @Body("action") action: string,
  ) {
    return this.adminService.resolveReport(reportId, user.id, action);
  }

  @Get("audits")
  @ApiOperation({ summary: "Get system auditing logs" })
  async getAudits() {
    return this.adminService.listAuditLogs();
  }

  @Get("users/pending")
  @ApiOperation({ summary: "List users pending admin verification" })
  async getPendingUsers() {
    return this.adminService.listPendingUsers();
  }

  @Put("users/:userId/verify")
  @ApiOperation({ summary: "Approve or reject a pending organizer account" })
  async verifyUser(
    @Param("userId") userId: string,
    @Body("action") action: "APPROVE" | "REJECT",
  ) {
    return this.adminService.verifyUser(userId, action);
  }

  @Get("users/organizers")
  @ApiOperation({ summary: "List all organizer accounts" })
  async getAllOrganizers() {
    return this.adminService.listAllOrganizers();
  }

  @Put("artists/:artistId/verify")
  @ApiOperation({ summary: "Verify or unverify a creator/artist profile" })
  async verifyArtist(
    @Param("artistId") artistId: string,
    @Body("isVerified") isVerified: boolean,
  ) {
    return this.adminService.verifyArtist(artistId, isVerified);
  }
}
