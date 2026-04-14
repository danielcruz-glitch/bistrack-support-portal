export const TICKET_CATEGORIES = [
  "login",
  "printing",
  "email",
  "network",
  "bistrack-erp",
  "bistrack-report",
  "credit-card",
  "hardware",
  "software",
  "other",
] as const;

export type TicketCategory = (typeof TICKET_CATEGORIES)[number];