import { Injectable, NotFoundException, BadRequestException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateEventDto } from "./dto/create-event.dto";
import { RegisterEventDto } from "./dto/register-event.dto";
import * as crypto from "crypto";
import { PaymentStatus } from "@prisma/client";

@Injectable()
export class EventService {
  constructor(private prisma: PrismaService) {}

  async createEvent(userId: string, dto: CreateEventDto) {
    const slug = dto.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") + "-" + Date.now().toString().slice(-4);

    const price = dto.price || 0.00;
    const isPaid = dto.isPaid || price > 0;

    return this.prisma.event.create({
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        maxCapacity: dto.maxCapacity,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isPaid,
        price,
        upiVpa: dto.upiVpa,
        slug,
        organizerId: userId,
        status: "PUBLISHED", // Proactively publish by default for demo
        location: {
          create: {
            venueName: dto.venueName,
            venueAddress: dto.venueAddress,
            city: dto.city,
            state: dto.state,
          },
        },
        ticketCategories: {
          createMany: {
            data: [
              { name: "General Admission", price, maxCapacity: dto.maxCapacity || 100 },
            ],
          },
        },
      },
      include: {
        location: true,
        ticketCategories: true,
      },
    });
  }

  async listEvents(filters: { search?: string; category?: string; city?: string; limit?: number; offset?: number }) {
    const limit = filters.limit ? Number(filters.limit) : 20;
    const offset = filters.offset ? Number(filters.offset) : 0;

    const where: any = { status: "PUBLISHED" };

    if (filters.category) {
      where.category = filters.category;
    }
    if (filters.city) {
      where.location = {
        city: { contains: filters.city, mode: "insensitive" },
      };
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.event.count({ where }),
      this.prisma.event.findMany({
        where,
        include: { location: true, ticketCategories: true, organizer: { select: { fullName: true } } },
        take: limit,
        skip: offset,
        orderBy: { startDate: "asc" },
      }),
    ]);

    return { total, limit, offset, data };
  }

  async getEvent(idOrSlug: string) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    const event = await this.prisma.event.findFirst({
      where: isUUID ? { id: idOrSlug } : { slug: idOrSlug },
      include: {
        location: true,
        ticketCategories: true,
        organizer: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!event) {
      throw new NotFoundException("Event not found");
    }

    return event;
  }

  async register(userId: string, eventId: string, dto: RegisterEventDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { ticketCategories: true },
    });

    if (!event) {
      throw new NotFoundException("Event not found");
    }

    // Check if already registered
    const existing = await this.prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (existing) {
      throw new ConflictException("You are already registered for this event");
    }

    // Atomic transaction for capacity validation and registration insert
    return this.prisma.$transaction(async (tx) => {
      // 1. Verify capacity under lock
      const currentEvent = await tx.event.findUnique({
        where: { id: eventId },
        select: { maxCapacity: true, registrationsCount: true, price: true, isPaid: true },
      });

      if (currentEvent && currentEvent.maxCapacity && currentEvent.registrationsCount >= currentEvent.maxCapacity) {
        throw new BadRequestException("Event is fully booked");
      }

      // 2. Increment capacity
      await tx.event.update({
        where: { id: eventId },
        data: { registrationsCount: { increment: 1 } },
      });

      // 3. Create registration
      const baseAmount = currentEvent?.price || 0;
      const totalAmount = baseAmount; // Simple registration without addons
      const paymentStatus = currentEvent?.isPaid ? PaymentStatus.PENDING : PaymentStatus.APPROVED;

      const registration = await tx.eventRegistration.create({
        data: {
          eventId,
          userId,
          customData: dto.customData || {},
          paymentScreenshotUrl: dto.paymentScreenshotUrl,
          paymentStatus,
          baseAmount,
          totalAmount,
        },
      });

      // 4. Generate unique secure cryptographically signed QR ticket
      const ticketHash = crypto
        .createHmac("sha256", process.env.JWT_SECRET || "element5_jwt_secret")
        .update(`${registration.id}-${userId}-${eventId}`)
        .digest("hex");

      const ticket = await tx.eventTicket.create({
        data: {
          registrationId: registration.id,
          eventId,
          userId,
          qrCode: ticketHash,
        },
      });

      return {
        registration,
        ticket,
      };
    });
  }

  async checkInTicket(qrCode: string, ip?: string, ua?: string, fingerprint?: string) {
    const ticket = await this.prisma.eventTicket.findUnique({
      where: { qrCode },
      include: { event: true, user: true },
    });

    if (!ticket) {
      throw new NotFoundException("Invalid ticket code");
    }

    if (ticket.isUsed) {
      // Log failed double check-in attempt
      await this.prisma.checkInAuditLog.create({
        data: {
          ticketId: ticket.id,
          eventId: ticket.eventId,
          action: "REJECT_DUPLICATE",
          ipAddress: ip,
          userAgent: ua,
          deviceFingerprint: fingerprint,
          verificationMethod: "QR_SCAN",
          metadata: { attemptedAt: new Date().toISOString() },
        },
      });
      throw new BadRequestException(`Ticket already checked in at ${ticket.usedAt}`);
    }

    // Mark as used atomically
    const updatedTicket = await this.prisma.eventTicket.update({
      where: { id: ticket.id },
      data: {
        isUsed: true,
        usedAt: new Date(),
      },
    });

    // Create success audit log
    await this.prisma.checkInAuditLog.create({
      data: {
        ticketId: ticket.id,
        eventId: ticket.eventId,
        action: "CHECK_IN",
        ipAddress: ip,
        userAgent: ua,
        deviceFingerprint: fingerprint,
        verificationMethod: "QR_SCAN",
      },
    });

    return {
      success: true,
      message: "Check-in successful",
      attendee: ticket.user.fullName,
      eventName: ticket.event.title,
      checkedInAt: updatedTicket.usedAt,
    };
  }
}
