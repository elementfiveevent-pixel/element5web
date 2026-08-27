import { Controller, Get, Post, Delete, Param, Body, UseGuards } from "@nestjs/common";
import { HighlightService } from "./highlight.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags("Cultural Highlights Feed")
@Controller("highlights")
export class HighlightController {
  constructor(private highlightService: HighlightService) {}

  @Get()
  @ApiOperation({ summary: "Get all cultural highlights" })
  async getHighlights() {
    return this.highlightService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new highlight (Admins/Organizers only)" })
  async createHighlight(
    @Body("imageUrl") imageUrl: string,
    @Body("description") description: string,
  ) {
    return this.highlightService.create(imageUrl, description);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a highlight (Admins/Organizers only)" })
  async deleteHighlight(@Param("id") id: string) {
    return this.highlightService.delete(id);
  }
}
