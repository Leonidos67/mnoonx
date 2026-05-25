export type SupportTicketCategory = 'bug' | 'authentication' | 'other';
export type SupportTicketStatus = 'open' | 'closed';
export type SupportTicketTab = 'open' | 'closed' | 'all';

export interface SupportAppOption {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  editedAt: string;
}

export interface SupportTicket {
  id: string;
  shortId: string;
  status: SupportTicketStatus;
  category: SupportTicketCategory;
  categoryLabel: string;
  title: string;
  description: string;
  communityId: string | null;
  communityHandle: string;
  communityName: string;
  appLink: string;
  appLabel: string;
  attachmentNames: string[];
  plan: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

export interface SupportTicketMessage {
  id: string;
  sender: 'user' | 'assistant' | 'support';
  text: string;
  timestamp: string;
}

export interface CreateSupportTicketPayload {
  category: SupportTicketCategory;
  description: string;
  communityId?: string;
  communityHandle?: string;
  communityName?: string;
  appLink?: string;
  attachmentNames?: string[];
}
