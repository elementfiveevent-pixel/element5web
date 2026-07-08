/**
 * Single Source of Truth for Ticket/Payment Status
 * These values MUST match the PostgreSQL ENUM `ticket_status`
 * Valid values: 'pending' | 'approved' | 'rejected' | 'used'
 */
export const TICKET_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  USED: 'used',
} as const;

export type TicketStatus = typeof TICKET_STATUS[keyof typeof TICKET_STATUS];

/**
 * Get the appropriate payment status for event type
 * FREE events are auto-approved, PAID events start as pending
 */
export function getInitialPaymentStatus(isPaidEvent: boolean): TicketStatus {
  return isPaidEvent ? TICKET_STATUS.PENDING : TICKET_STATUS.APPROVED;
}

/**
 * Check if a registration is confirmed (can access ticket)
 */
export function isRegistrationConfirmed(paymentStatus: string | null | undefined): boolean {
  return paymentStatus === TICKET_STATUS.APPROVED || paymentStatus === TICKET_STATUS.USED;
}

/**
 * Human-readable status labels
 */
export const STATUS_LABELS: Record<TicketStatus, string> = {
  [TICKET_STATUS.PENDING]: 'Pending Approval',
  [TICKET_STATUS.APPROVED]: 'Confirmed',
  [TICKET_STATUS.REJECTED]: 'Rejected',
  [TICKET_STATUS.USED]: 'Used',
};
