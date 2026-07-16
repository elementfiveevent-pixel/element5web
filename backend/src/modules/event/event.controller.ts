import {
  Controller, Get, Post, Put, Patch, Body, Param, Query,
  UseGuards, Ip, Headers
} from "@nestjs/common";
import { EventService } from "./event.service";
import { CreateEventDto } from "./dto/create-event.dto";
import { RegisterEventDto } from "./dto/register-event.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole } from "@prisma/client";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags("Events Platform")
@Controller("events")
export class EventController {
  constructor(private eventService: EventService) {}

  // ─── Public: list + detail ───────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: "List and filter upcoming published events" })
  async list(
    @Query("search") search?: string,
    @Query("category") category?: string,
    @Query("city") city?: string,
    @Query("period") period?: "upcoming" | "past",
    @Query("limit") limit?: number,
    @Query("offset") offset?: number,
  ) {
    return this.eventService.listEvents({ search, category, city, period, limit, offset });
  }

  @Get(":idOrSlug")
  @ApiOperation({ summary: "Get event metadata by ID or Slug" })
  async get(@Param("idOrSlug") idOrSlug: string) {
    return this.eventService.getEvent(idOrSlug);
  }

  // ─── Auth required ───────────────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new event" })
  async create(@CurrentUser() user: any, @Body() dto: CreateEventDto) {
    return this.eventService.createEvent(user.id, dto);
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
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
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

  @Post("tickets/checkout")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Scan and check-out ticket QR codes at venues" })
  async checkOut(
    @Body("qrCode") qrCode: string,
    @Body("deviceFingerprint") fingerprint: string,
    @Ip() ip: string,
    @Headers("user-agent") ua?: string,
  ) {
    return this.eventService.checkOutTicket(qrCode, ip, ua, fingerprint);
  }

  // ─── Attendee: my tickets ────────────────────────────────────────────────────

  @Get("attendee/my-tickets")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all tickets for the authenticated user" })
  async myTickets(@CurrentUser() user: any) {
    return this.eventService.getMyTickets(user.id);
  }

  // ─── Organizer scope ─────────────────────────────────────────────────────────

  @Get("organizer/my-events")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get organizer's own events" })
  async myEvents(@CurrentUser() user: any) {
    return this.eventService.getOrganizerEvents(user.id, user.roles ?? []);
  }

  @Get(":eventId/registrations")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all registrations for an event (organizer only)" })
  async registrations(
    @CurrentUser() user: any,
    @Param("eventId") eventId: string,
  ) {
    return this.eventService.getEventRegistrations(eventId, user.id, user.roles ?? []);
  }

  @Get(":eventId/analytics")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get event analytics for organizer" })
  async analytics(
    @CurrentUser() user: any,
    @Param("eventId") eventId: string,
  ) {
    return this.eventService.getEventAnalytics(eventId, user.id, user.roles ?? []);
  }

  @Patch(":eventId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update an existing event (PATCH)" })
  async updatePatch(
    @CurrentUser() user: any,
    @Param("eventId") eventId: string,
    @Body() dto: Partial<CreateEventDto>,
  ) {
    return this.eventService.updateEvent(eventId, user.id, dto, user.roles ?? []);
  }

  @Put(":eventId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update an existing event (PUT)" })
  async updatePut(
    @CurrentUser() user: any,
    @Param("eventId") eventId: string,
    @Body() dto: Partial<CreateEventDto>,
  ) {
    return this.eventService.updateEvent(eventId, user.id, dto, user.roles ?? []);
  }

  @Patch("registrations/:registrationId/review")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Approve or reject a registration (payment review)" })
  async reviewRegistration(
    @CurrentUser() user: any,
    @Param("registrationId") registrationId: string,
    @Body("action") action: "APPROVED" | "REJECTED",
  ) {
    return this.eventService.reviewRegistration(registrationId, user.id, action, user.roles ?? []);
  }
}
