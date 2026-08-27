import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import * as QRCode from "qrcode";

type ApprovedTicketEmail = {
  recipientEmail: string;
  recipientName: string;
  ticketId: string;
  qrCode: string;
  amount: string | number;
  ticketType?: string;
  event: {
    id: string;
    slug?: string;
    title: string;
    startDate: string | Date;
    flyerUrl?: string | null;
    termsConditions?: string | null;
    location?: { venueName?: string; venueAddress?: string; city?: string; state?: string } | null;
  };
};

const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>'\"]/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;",
})[character] || character);

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter?: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {}

  isConfigured() {
    return Boolean(
      this.config.get<string>("BREVO_SMTP_HOST") &&
      this.config.get<string>("BREVO_SMTP_USER") &&
      this.config.get<string>("BREVO_SMTP_PASSWORD"),
    );
  }

  async verifyConnection() {
    if (!this.isConfigured()) return { configured: false, verified: false };
    await this.getTransporter().verify();
    return { configured: true, verified: true };
  }

  async sendApprovedTicket(input: ApprovedTicketEmail) {
    if (!this.isConfigured()) {
      this.logger.warn(`Ticket ${input.ticketId} is approved, but Brevo SMTP is not configured.`);
      return { sent: false, skipped: true };
    }

    const eventDate = new Date(input.event.startDate).toLocaleString("en-IN", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    });
    const location = input.event.location;
    const venue = [location?.venueName, location?.venueAddress, location?.city, location?.state]
      .filter(Boolean)
      .join(", ");
    const frontendUrl = this.config.get<string>("FRONTEND_URL") || "http://localhost:3000";
    const eventUrl = `${frontendUrl.replace(/\/$/, "")}/events/${encodeURIComponent(input.event.slug || input.event.id)}`;
    const ticketsUrl = `${frontendUrl.replace(/\/$/, "")}/events/my-tickets`;
    const qrImage = await QRCode.toBuffer(input.qrCode, { width: 320, margin: 2, errorCorrectionLevel: "H" });
    const amount = Number(input.amount) > 0 ? `Rs. ${input.amount}` : "Free";
    const terms = input.event.termsConditions ? escapeHtml(input.event.termsConditions) : "Bring this ticket to the venue. Each QR ticket can be checked in once.";
    const flyer = input.event.flyerUrl ? `<img src="${escapeHtml(input.event.flyerUrl)}" alt="${escapeHtml(input.event.title)}" style="display:block;max-width:100%;height:auto;border:0" />` : "";

    const html = `<!doctype html><html><body style="margin:0;background:#fff5e4;color:#121212;font-family:Arial,sans-serif">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 12px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#faf8f5;border:3px solid #121212">
        <tr><td style="background:#121212;color:#ffde4d;padding:18px 22px;font-weight:800;letter-spacing:1px">ELEMENT 5 | CONFIRMED TICKET</td></tr>
        ${flyer ? `<tr><td>${flyer}</td></tr>` : ""}
        <tr><td style="padding:24px"><h1 style="margin:0 0 12px;font-size:25px">You are confirmed, ${escapeHtml(input.recipientName)}.</h1>
        <p style="line-height:1.55">Your registration for <strong>${escapeHtml(input.event.title)}</strong> has been approved. Your ticket QR is ready.</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="8" style="border:2px solid #121212;margin:18px 0"><tr><td><strong>Ticket ID</strong></td><td>${escapeHtml(input.ticketId)}</td></tr><tr><td><strong>Date & time</strong></td><td>${escapeHtml(eventDate)}</td></tr><tr><td><strong>Venue</strong></td><td>${escapeHtml(venue || "Venue details coming soon")}</td></tr><tr><td><strong>Ticket type</strong></td><td>${escapeHtml(input.ticketType || "General admission")}</td></tr><tr><td><strong>Amount paid</strong></td><td>${escapeHtml(amount)}</td></tr><tr><td><strong>Status</strong></td><td>Confirmed</td></tr></table>
        <div style="text-align:center;padding:8px 0 18px"><img src="cid:e5-ticket-qr" width="220" height="220" alt="Ticket QR code" style="border:3px solid #121212;background:#fff" /><p style="font-size:12px;line-height:1.5">Show this QR code at check-in. Do not share it publicly; it can be used once.</p></div>
        <p style="font-size:13px;line-height:1.5"><strong>Important:</strong> ${terms}</p>
        <p style="margin:24px 0 0"><a href="${eventUrl}" style="display:inline-block;background:#d80032;border:2px solid #121212;color:#fff;padding:12px 16px;text-decoration:none;font-weight:700">EVENT DETAILS</a> <a href="${ticketsUrl}" style="display:inline-block;background:#ffde4d;border:2px solid #121212;color:#121212;padding:12px 16px;text-decoration:none;font-weight:700">VIEW TICKET</a></p>
        </td></tr>
      </table></td></tr></table></body></html>`;

    await this.sendWithRetry({
      to: input.recipientEmail,
      subject: `Confirmed: ${input.event.title} | Element 5`,
      text: `Your registration is confirmed for ${input.event.title}. Ticket ID: ${input.ticketId}. View your ticket: ${ticketsUrl}`,
      html,
      attachments: [{ filename: `element5-ticket-${input.ticketId.slice(0, 8)}.png`, content: qrImage, cid: "e5-ticket-qr" }],
    });
    return { sent: true };
  }

  private getTransporter() {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: this.config.get<string>("BREVO_SMTP_HOST"),
        port: Number(this.config.get<string>("BREVO_SMTP_PORT") || 587),
        secure: false,
        requireTLS: true,
        auth: {
          user: this.config.get<string>("BREVO_SMTP_USER"),
          pass: this.config.get<string>("BREVO_SMTP_PASSWORD"),
        },
      });
    }
    return this.transporter;
  }

  private async sendWithRetry(options: nodemailer.SendMailOptions) {
    let lastError: unknown;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const info = await this.getTransporter().sendMail({
          ...options,
          from: `Element 5 <${this.config.get<string>("EMAIL_FROM") || "elementfive.event@gmail.com"}>`,
        });
        this.logger.log(`Email accepted by Brevo for ${options.to}; message ${info.messageId}`);
        return info;
      } catch (error) {
        lastError = error;
        this.logger.warn(`Email attempt ${attempt} failed for ${options.to}: ${(error as Error).message}`);
        if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }
    }
    throw lastError;
  }
}
