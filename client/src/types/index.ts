export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  description: string;
  user: User;
}

export interface Ticket {
  id: string;
  ticketId: string;
  title: string;
  description: string;
  category: string;
  status: 'open' | 'pending' | 'escalated' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee: User;
  createdAt: string;
  updatedAt: string;
  confidenceScore?: number;
  aiSummary?: string;
  resolutionSteps?: string[];
  knowledgeBaseRefs?: string[];
  activityLogs: ActivityLog[];
}

export interface View {
  id: string;
  name: string;
  count: number;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  type: 'human' | 'ai';
  role: string;
  status: 'online' | 'busy' | 'offline' | 'auto';
  workload: number; // Percentage
  channels: ('chat' | 'call' | 'email')[];
  aiCapabilities: string[];
  availability?: {
    monday: { start: string; end: string };
    tuesday: { start: string; end: string };
    wednesday: { start: string; end: string };
    thursday: { start: string; end: string };
    friday: { start: string; end: string };
    saturday: { start: string; end: string };
    sunday: { start: string; end: string };
  };
  aiSettings?: {
    capabilities: {
      automateRouting: boolean;
      sentimentAnalysis: boolean;
      smartResponses: boolean;
      escalationRules: boolean;
    };
    communicationStyle: 'professional' | 'friendly' | 'direct' | 'empathetic';
    escalationConditions: {
      customerFrustration: boolean;
      complexIssue: boolean;
      predefinedTime: boolean;
    };
  };
  skills?: string[];
  joinDate?: string;
  lastActive?: string;
}