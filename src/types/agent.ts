export type AgentRole = "agent" | "broker" | "team-lead" | "admin";

export type AgentStatus = "active" | "inactive" | "suspended" | "pending";

export interface AgentProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseState: string;
  licenseExpiry: string;
  role: AgentRole;
  status: AgentStatus;
  bio?: string;
  avatar?: string;
  coverPhoto?: string;
  brokerage?: string;
  brokerageLogo?: string;
  specializations: string[];
  languages: string[];
  yearsExperience: number;
  serviceAreas: string[];
  address?: {
    street?: string;
    city: string;
    state: string;
    zip: string;
  };
  socialLinks?: {
    website?: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  verified: boolean;
  rating?: number;
  reviewCount: number;
  totalSales: number;
  totalVolume: number;
  averagePrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface AgentStats {
  totalListings: number;
  activeListings: number;
  soldProperties: number;
  totalRevenue: number;
  averageDaysOnMarket: number;
  clientSatisfaction: number;
  responseTime: number;
  viewsThisMonth: number;
  inquiriesThisMonth: number;
  appointmentsThisMonth: number;
}

export interface AgentReview {
  id: string;
  agentId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  comment: string;
  propertyId?: string;
  createdAt: string;
}

export interface AgentAvailability {
  id: string;
  agentId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface AgentTeam {
  id: string;
  name: string;
  leadId: string;
  members: AgentProfile[];
  createdAt: string;
}

export interface AgentPerformance {
  period: string;
  listings: number;
  sales: number;
  revenue: number;
  views: number;
  inquiries: number;
}

export interface CreateAgentInput {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseState: string;
  licenseExpiry: string;
  role?: AgentRole;
  bio?: string;
  brokerage?: string;
  specializations?: string[];
  languages?: string[];
  yearsExperience?: number;
  serviceAreas?: string[];
}

export interface UpdateAgentInput extends Partial<CreateAgentInput> {
  status?: AgentStatus;
}

export default AgentProfile;
