export type OfferStatus = "pending" | "accepted" | "rejected" | "countered" | "expired" | "withdrawn";

export type OfferType = "standard" | "cash" | "financed" | "contingent";

export interface Offer {
  id: string;
  propertyId: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  sellerId: string;
  agentId: string;
  amount: number;
  type: OfferType;
  status: OfferStatus;
  earnestMoney?: number;
  downPayment?: number;
  financingType?: "conventional" | "fha" | "va" | "cash";
  contingencies: string[];
  closingDate: string;
  inspectionDate?: string;
  appraisalDate?: string;
  notes?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface OfferWithDetails extends Offer {
  property?: {
    title: string;
    address: string;
    price: number;
    images: Array<{ url: string }>;
  };
  buyer?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  agent?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

export interface CounterOffer {
  id: string;
  originalOfferId: string;
  amount: number;
  closingDate?: string;
  contingencies?: string[];
  notes?: string;
  expiresAt: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  propertyId: string;
  offerId: string;
  buyerId: string;
  sellerId: string;
  agentId: string;
  status: TransactionStatus;
  closingDate: string;
  actualClosingDate?: string;
  salePrice: number;
  downPayment: number;
  loanAmount: number;
  interestRate?: number;
  loanTerm?: number;
  monthlyPayment?: number;
  documents: TransactionDocument[];
  timeline: TransactionTimelineEvent[];
  createdAt: string;
  updatedAt: string;
}

export type TransactionStatus =
  | "pending"
  | "inspection"
  | "appraisal"
  | "financing"
  | "title"
  | "closing"
  | "completed"
  | "cancelled";

export interface TransactionDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  status: "pending" | "signed" | "approved" | "rejected";
  uploadedAt: string;
}

export interface TransactionTimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string;
  status: "completed" | "pending" | "in-progress";
}

export interface CreateOfferInput {
  propertyId: string;
  amount: number;
  type: OfferType;
  earnestMoney?: number;
  downPayment?: number;
  financingType?: "conventional" | "fha" | "va" | "cash";
  contingencies?: string[];
  closingDate: string;
  inspectionDate?: string;
  appraisalDate?: string;
  notes?: string;
  expiresAt: string;
}

export interface UpdateOfferInput {
  amount?: number;
  closingDate?: string;
  contingencies?: string[];
  notes?: string;
  expiresAt?: string;
}

export interface NegotiationMessage {
  id: string;
  offerId: string;
  senderId: string;
  senderName: string;
  message: string;
  attachments?: string[];
  createdAt: string;
}

export interface OfferComparison {
  offer: Offer;
  score: number;
  factors: {
    priceScore: number;
    termsScore: number;
    reliabilityScore: number;
    timelineScore: number;
  };
}

export default Offer;
