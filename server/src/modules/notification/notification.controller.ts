import { Controller, Get, Put, Param, UseGuards } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags("User Alerts & Notifications")
@Controller("notifications")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "Get in-app notifications for authenticated user" })
  async getNotifications(@CurrentUser() user: any) {
    return this.prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
  }

  @Put(":id/read")
  @ApiOperation({ summary: "Mark a specific notification as read" })
  async markAsRead(@CurrentUser() user: any, @Param("id") id: string) {
    return this.prisma.notification.update({
      where: { id, userId: user.id },
      data: { isRead: true },
    });
  }
}
