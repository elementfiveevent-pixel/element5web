import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, Ip, Headers } from "@nestjs/common";
import { EventService } from "./event.service";
import { CreateEventDto } from "./dto/create-event.dto";
import { RegisterEventDto } from "./dto/register-event.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole } from "@prisma/client";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { Request } from "express";

@ApiTags("Events Platform")
@Controller("events")
export class EventController {
  constructor(private eventService: EventService) {}

  @Get()
  @ApiOperation({ summary: "List and filter upcoming published events" })
  async list(
    @Query("search") search?: string,
    @Query("category") category?: string,
    @Query("city") city?: string,
    @Query("limit") limit?: number,
    @Query("offset") offset?: number,
  ) {
    return this.eventService.listEvents({ search, category, city, limit, offset });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.EVENT_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new event" })
  async create(@CurrentUser() user: any, @Body() dto: CreateEventDto) {
    return this.eventService.createEvent(user.id, dto);
  }

  @Get(":idOrSlug")
  @ApiOperation({ summary: "Get event metadata by ID or Slug" })
  async get(@Param("idOrSlug") idOrSlug: string) {
    return this.eventService.getEvent(idOrSlug);
  }

  @Post(":eventId/register")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Register for tickets atomically" })
  async register(
    @CurrentUser() user: any,
    @Param("eventId") eventId: string,
    @Body() dto: RegisterEventDto,
  ) {
    return this.eventService.register(user.id, eventId, dto);
  }

  @Post("tickets/checkin")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.EVENT_MANAGER, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Scan and check-in ticket QR codes at venues" })
  async checkIn(
    @Body("qrCode") qrCode: string,
    @Body("deviceFingerprint") fingerprint: string,
    @Ip() ip: string,
    @Headers("user-agent") ua?: string,
  ) {
    return this.eventService.checkInTicket(qrCode, ip, ua, fingerprint);
  }
}
