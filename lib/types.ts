export type UserRole = 'user' | 'support' | 'admin';
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TicketUrgency = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TicketStatus =
  | 'New'
  | 'In Progress'
  | 'Waiting on User'
  | 'Resolved - Awaiting Confirmation'
  | 'Closed'
  | 'Overdue';

export type TicketRow = {
  id: string;
  title: string;
  issue_description: string;
  other_issue_text: string | null;
  priority: TicketPriority;
  urgency: TicketUrgency;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  requester_name: string;
  requester_email: string;
  department_name: string;
  category_name: string;
  is_overdue: boolean;
};
