// ─────────────────────────────────────────────────────────────────────────────
// Core Types - AI Real Estate Platform
// ─────────────────────────────────────────────────────────────────────────────

import type {
  UserRole,
  PropertyType,
  ListingStatus,
  OfferStatus,
  TransactionStatus,
  PropertyStatus,
  AppointmentType,
  NotificationType,
  PaymentStatus,
  InvoiceStatus,
  DocumentType,
} from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Base Types
// ─────────────────────────────────────────────────────────────────────────────

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDeletable extends BaseEntity {
  deletedAt: Date | null;
}

export interface Timestamped {
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// User Types
// ─────────────────────────────────────────────────────────────────────────────

export interface User extends BaseEntity {
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  image: string | null;
  password: string | null;
  role: UserRole;
  phone: string | null;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt: Date | null;
}

export interface UserProfile extends BaseEntity {
  userId: string;
  bio: string | null;
  avatar: string | null;
  coverImage: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  website: string | null;
  linkedin: string | null;
  twitter: string | null;
  preferredLang: string;
  currency: string;
  timezone: string;
  isPublic: boolean;
}

export interface UserWithProfile extends User {
  profile: UserProfile | null;
}

export interface UserSession {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: UserRole;
    isVerified: boolean;
    isActive: boolean;
  };
  expires: string;
}

export type PublicUser = Pick<
  User,
  "id" | "name" | "image" | "role" | "isVerified" | "createdAt"
>;

export type UserMinimal = Pick<User, "id" | "name" | "email" | "image">;

// ─────────────────────────────────────────────────────────────────────────────
// Agent Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AgentProfile extends BaseEntity {
  userId: string;
  licenseNumber: string | null;
  licenseState: string | null;
  licenseExpiry: Date | null;
  brokerageName: string | null;
  brokerageId: string | null;
  specialization: string[];
  yearsExperience: number | null;
  languagesSpoken: string[];
  serviceAreas: string[];
  commissionRate: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  isFeatured: boolean;
  isVerified: boolean;
  totalSales: number;
  totalVolume: number;
  avgDaysOnMarket: number | null;
  medianPrice: number | null;
  awards: string[];
  certifications: string[];
}

export interface AgentWithUser extends AgentProfile {
  user: UserWithProfile;
}

export interface AgentWithStats extends AgentWithUser {
  ratings: AgentRating[];
  averageRating: number;
  totalReviews: number;
  recentSales: number;
  activeListings: number;
  clientsCount: number;
}

export interface AgentRating extends BaseEntity {
  agentId: string;
  userId: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isPublic: boolean;
}

export interface AgentRatingWithUser extends AgentRating {
  user: PublicUser;
}

export interface Brokerage extends BaseEntity {
  name: string;
  licenseNumber: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo: string | null;
  description: string | null;
  isActive: boolean;
}

export interface AgentListItem {
  id: string;
  userId: string;
  name: string;
  image: string | null;
  licenseState: string | null;
  specialization: string[];
  serviceAreas: string[];
  totalSales: number;
  totalVolume: number;
  averageRating: number;
  isVerified: boolean;
  isFeatured: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Property Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Property extends SoftDeletable {
  title: string;
  slug: string;
  description: string | null;
  propertyType: PropertyType;
  status: PropertyStatus;
  price: number;
  pricePerSqFt: number | null;
  currency: string;
  yearBuilt: number | null;
  lotSize: number | null;
  lotSizeUnit: string;
  livingArea: number | null;
  livingAreaUnit: string;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  halfBathrooms: number | null;
  floors: number | null;
  parkingSpaces: number | null;
  garageType: string | null;
  heatingType: string | null;
  coolingType: string | null;
  appliances: string[];
  flooringTypes: string[];
  roofType: string | null;
  foundationType: string | null;
  poolType: string | null;
  fireplaceCount: number | null;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  mlsNumber: string | null;
  mlsSource: string | null;
  mlsUrl: string | null;
  daysOnMarket: number | null;
  views: number;
  favorites: number;
  isFeatured: boolean;
  isVirtualTour: boolean;
  is3dTour: boolean;
  videoUrl: string | null;
  virtualTourUrl: string | null;
  openHouseStart: Date | null;
  openHouseEnd: Date | null;
  availableFrom: Date | null;
  hoaFee: number | null;
  taxAmount: number | null;
  taxYear: number | null;
  lastSoldDate: Date | null;
  lastSoldPrice: number | null;
  aiInsights: Record<string, unknown> | null;
  ownerId: string;
}

export interface PropertyWithImages extends Property {
  images: PropertyImage[];
}

export interface PropertyWithDetails extends Property {
  images: PropertyImage[];
  features: PropertyFeature[];
  history: PropertyHistory[];
  owner: PublicUser;
  listings: Listing[];
}

export interface PropertyWithAgent extends PropertyWithDetails {
  agent?: AgentWithUser;
}

export interface PropertyCard extends Property {
  images: PropertyImage[];
  primaryImage: PropertyImage | null;
  agent?: {
    id: string;
    name: string;
    image: string | null;
    phone: string | null;
  };
  listing?: {
    id: string;
    status: ListingStatus;
    listedPrice: number;
    listedDate: Date;
  };
}

export interface PropertySearchResult {
  property: PropertyCard;
  score: number;
  matchReasons: string[];
}

export interface PropertyImage extends BaseEntity {
  propertyId: string;
  url: string;
  alt: string | null;
  caption: string | null;
  isPrimary: boolean;
  sortOrder: number;
  width: number | null;
  height: number | null;
  blurHash: string | null;
}

export interface PropertyFeature extends BaseEntity {
  propertyId: string;
  name: string;
  value: string | null;
  category: string | null;
  isPremium: boolean;
  sortOrder: number;
}

export interface PropertyHistory extends BaseEntity {
  propertyId: string;
  event: string;
  price: number | null;
  date: Date;
  details: Record<string, unknown> | null;
  source: string | null;
}

export interface PropertyStats {
  totalProperties: number;
  averagePrice: number;
  medianPrice: number;
  priceRange: { min: number; max: number };
  byType: Record<PropertyType, number>;
  byStatus: Record<PropertyStatus, number>;
  averageDaysOnMarket: number;
  totalViews: number;
  totalFavorites: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Listing Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Listing extends BaseEntity {
  propertyId: string;
  agentId: string | null;
  brokerageId: string | null;
  status: ListingStatus;
  listedPrice: number;
  originalPrice: number | null;
  soldPrice: number | null;
  listedDate: Date;
  expiresAt: Date | null;
  soldAt: Date | null;
  withdrawnAt: Date | null;
  withdrawnReason: string | null;
  daysOnMarket: number | null;
  openHouseDates: OpenHouseDate[] | null;
  mlsNumber: string | null;
  mlsSource: string | null;
  mlsUrl: string | null;
  description: string | null;
  specialTerms: string | null;
  isPublic: boolean;
  isExclusive: boolean;
  isPocketListing: boolean;
  commissionRate: number | null;
}

export interface ListingWithProperty extends Listing {
  property: PropertyWithImages;
}

export interface ListingWithAgent extends ListingWithProperty {
  agent: AgentWithUser | null;
}

export interface ListingDetail extends ListingWithAgent {
  offers: ListingOffer[];
  savedSearches: SavedSearch[];
}

export interface ListingCard {
  id: string;
  status: ListingStatus;
  listedPrice: number;
  originalPrice: number | null;
  daysOnMarket: number | null;
  property: {
    id: string;
    title: string;
    address: string;
    city: string;
    state: string;
    propertyType: PropertyType;
    bedrooms: number | null;
    bathrooms: number | null;
    livingArea: number | null;
    images: PropertyImage[];
  };
  agent?: {
    id: string;
    name: string;
    image: string | null;
    phone: string | null;
  };
}

export interface OpenHouseDate {
  start: Date;
  end: Date;
  isVirtual: boolean;
  meetingUrl?: string;
}

export interface ListingOffer {
  id: string;
  listingId: string;
  offerId: string;
  status: string;
  createdAt: Date;
  offer: Offer;
}

export interface ListingStats {
  totalListings: number;
  activeListings: number;
  soldListings: number;
  averagePrice: number;
  averageDaysOnMarket: number;
  totalVolume: number;
  byStatus: Record<ListingStatus, number>;
  priceHistory: PricePoint[];
}

export interface PricePoint {
  date: Date;
  price: number;
  count: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Offer Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Offer extends BaseEntity {
  propertyId: string;
  buyerId: string;
  sellerId: string | null;
  agentId: string | null;
  status: OfferStatus;
  offerPrice: number;
  earnestMoney: number | null;
  downPayment: number | null;
  loanType: string | null;
  loanAmount: number | null;
  closingDate: Date;
  inspectionContingency: boolean;
  appraisalContingency: boolean;
  financingContingency: boolean;
  saleContingency: boolean;
  inspectionDays: number;
  closingCosts: number | null;
  sellerConcessions: number | null;
  personalLetter: string | null;
  expirationDate: Date;
  terms: Record<string, unknown> | null;
  notes: string | null;
  rejectionReason: string | null;
  counterPrice: number | null;
  counterTerms: Record<string, unknown> | null;
}

export interface OfferWithProperty extends Offer {
  property: PropertyCard;
}

export interface OfferWithUsers extends OfferWithProperty {
  buyer: PublicUser;
  seller: PublicUser | null;
  agent: AgentWithUser | null;
}

export interface OfferDetail extends OfferWithUsers {
  statuses: OfferStatusHistory[];
  transactions: Transaction[];
}

export interface OfferStatusHistory extends BaseEntity {
  offerId: string;
  status: OfferStatus;
  note: string | null;
  changedBy: string | null;
}

export interface OfferSummary {
  id: string;
  offerPrice: number;
  status: OfferStatus;
  closingDate: Date;
  createdAt: Date;
  property: {
    id: string;
    title: string;
    address: string;
    city: string;
    state: string;
  };
  buyer: PublicUser;
}

export interface OfferStats {
  totalOffers: number;
  acceptedOffers: number;
  rejectedOffers: number;
  pendingOffers: number;
  averageOfferPrice: number;
  averageNegotiationMargin: number;
  acceptanceRate: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Transaction Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Transaction extends BaseEntity {
  propertyId: string;
  listingId: string | null;
  buyerId: string;
  sellerId: string | null;
  agentId: string | null;
  offerId: string | null;
  status: TransactionStatus;
  salePrice: number;
  closingDate: Date | null;
  actualClosingDate: Date | null;
  escrowNumber: string | null;
  titleCompany: string | null;
  titleInsurance: number | null;
  transferTax: number | null;
  homeWarranty: number | null;
  inspectionDate: Date | null;
  inspectionResult: Record<string, unknown> | null;
  appraisalDate: Date | null;
  appraisalValue: number | null;
  mortgageId: string | null;
  earnestMoneyDeposit: number | null;
  earnestMoneyHeld: string | null;
  closingCostsTotal: number | null;
  netToSeller: number | null;
  notes: string | null;
}

export interface TransactionWithDetails extends Transaction {
  property: PropertyCard;
  buyer: PublicUser;
  seller: PublicUser | null;
  agent: AgentWithUser | null;
  offer: Offer | null;
  documents: TransactionDocument[];
  timeline: TransactionTimeline[];
  mortgage: Mortgage | null;
}

export interface TransactionCard {
  id: string;
  status: TransactionStatus;
  salePrice: number;
  closingDate: Date | null;
  property: {
    id: string;
    title: string;
    address: string;
    city: string;
    state: string;
  };
  buyer: PublicUser;
  seller: PublicUser | null;
}

export interface TransactionDocument extends BaseEntity {
  transactionId: string;
  type: DocumentType;
  name: string;
  url: string;
  fileSize: number | null;
  mimeType: string | null;
  uploadedBy: string | null;
  isSigned: boolean;
  signedAt: Date | null;
  metadata: Record<string, unknown> | null;
}

export interface TransactionTimeline extends BaseEntity {
  transactionId: string;
  event: string;
  description: string | null;
  actorId: string | null;
  metadata: Record<string, unknown> | null;
}

export interface TransactionStats {
  totalTransactions: number;
  activeTransactions: number;
  closedTransactions: number;
  cancelledTransactions: number;
  totalVolume: number;
  averageSalePrice: number;
  averageDaysToClose: number;
  byStatus: Record<TransactionStatus, number>;
  monthlyVolume: MonthlyVolume[];
}

export interface MonthlyVolume {
  month: string;
  volume: number;
  count: number;
  averagePrice: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Client Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Client extends BaseEntity {
  agentId: string;
  name: string;
  email: string | null;
  phone: string | null;
  budget: number | null;
  minBedrooms: number | null;
  maxBedrooms: number | null;
  minBathrooms: number | null;
  propertyTypes: PropertyType[];
  preferredAreas: string[];
  mustHave: string[];
  niceToHave: string[];
  dealBreakers: string[];
  notes: string | null;
  leadScore: number | null;
  leadSource: string | null;
  status: string;
  lastContactAt: Date | null;
  nextFollowUp: Date | null;
}

export interface ClientWithPreferences extends Client {
  searchPreferences: ClientPreference[];
}

export interface ClientWithStats extends ClientWithPreferences {
  totalAppointments: number;
  totalOffers: number;
  activeListings: number;
}

export interface ClientPreference extends BaseEntity {
  clientId: string;
  key: string;
  value: string;
  weight: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Appointment Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Appointment extends BaseEntity {
  userId: string;
  clientId: string | null;
  propertyId: string | null;
  type: AppointmentType;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  location: string | null;
  isVirtual: boolean;
  meetingUrl: string | null;
  status: string;
  reminder: boolean;
  reminderAt: Date | null;
  notes: string | null;
  outcome: string | null;
}

export interface AppointmentWithDetails extends Appointment {
  property: PropertyCard | null;
  client: Client | null;
}

export interface AppointmentCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: AppointmentType;
  status: string;
  color: string;
  property?: {
    id: string;
    title: string;
    address: string;
  };
  client?: {
    id: string;
    name: string;
    email: string | null;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Neighborhood Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Neighborhood extends BaseEntity {
  name: string;
  slug: string;
  city: string;
  state: string;
  zipCode: string | null;
  latitude: number | null;
  longitude: number | null;
  radius: number | null;
  description: string | null;
  image: string | null;
  medianPrice: number | null;
  avgDaysOnMarket: number | null;
  totalListings: number;
  walkScore: number | null;
  transitScore: number | null;
  bikeScore: number | null;
  schoolRating: number | null;
  crimeRate: number | null;
  medianIncome: number | null;
  population: number | null;
  medianAge: number | null;
  ownerOccupied: number | null;
  vacancyRate: number | null;
  appreciation: number | null;
  aiSummary: string | null;
}

export interface NeighborhoodWithScores extends Neighborhood {
  scores: NeighborhoodScore[];
}

export interface NeighborhoodScore extends BaseEntity {
  neighborhoodId: string;
  category: string;
  score: number;
  rank: number | null;
  details: Record<string, unknown> | null;
  source: string | null;
}

export interface NeighborhoodComparison {
  neighborhoods: NeighborhoodWithScores[];
  metrics: string[];
  rankings: Record<string, string[]>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Virtual Tour Types
// ─────────────────────────────────────────────────────────────────────────────

export interface VirtualTour extends BaseEntity {
  propertyId: string;
  title: string;
  description: string | null;
  type: string;
  url: string | null;
  thumbnail: string | null;
  floorPlan: string | null;
  isPublished: boolean;
  viewCount: number;
  duration: number | null;
  metadata: Record<string, unknown> | null;
}

export interface VirtualTourWithStops extends VirtualTour {
  stops: VirtualTourStop[];
}

export interface VirtualTourStop {
  id: string;
  tourId: string;
  name: string;
  description: string | null;
  imageUrl: string;
  position: { x: number; y: number; z: number } | null;
  sortOrder: number;
  hotspots: Record<string, unknown>[] | null;
  audioUrl: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Search Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Search extends BaseEntity {
  userId: string | null;
  query: string;
  filters: Record<string, unknown> | null;
  resultCount: number;
  latency: number | null;
}

export interface SavedSearch extends BaseEntity {
  userId: string;
  name: string;
  description: string | null;
  filters: Record<string, unknown> | null;
  alertEnabled: boolean;
  alertFrequency: string;
  lastAlertAt: Date | null;
  resultCount: number | null;
  listingId: string | null;
  propertyId: string | null;
}

export interface SearchResult {
  properties: PropertyCard[];
  totalCount: number;
  filters: SearchFilters;
  suggestions: SearchSuggestion[];
  aiInsights: string | null;
}

export interface SearchFilters {
  propertyTypes: PropertyType[];
  priceRange: { min: number; max: number };
  bedrooms: { min: number; max: number };
  bathrooms: { min: number; max: number };
  features: string[];
  keywords: string[];
  location: string;
}

export interface SearchSuggestion {
  text: string;
  type: "location" | "feature" | "property_type" | "agent";
  count: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Notification extends BaseEntity {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: Date | null;
  actionUrl: string | null;
}

export interface NotificationPreference extends BaseEntity {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  messageAlerts: boolean;
  appointmentAlerts: boolean;
  offerAlerts: boolean;
  listingAlerts: boolean;
  priceChangeAlerts: boolean;
  documentAlerts: boolean;
  marketingEmails: boolean;
  digestFrequency: string;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
}

export interface NotificationCounts {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Payment & Invoice Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Payment extends BaseEntity {
  userId: string;
  transactionId: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: string | null;
  provider: string | null;
  providerId: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  paidAt: Date | null;
  refundedAt: Date | null;
  refundAmount: number | null;
}

export interface Invoice extends BaseEntity {
  issuerId: string;
  recipientId: string;
  invoiceNumber: string;
  amount: number;
  tax: number | null;
  total: number;
  currency: string;
  status: InvoiceStatus;
  description: string | null;
  dueDate: Date | null;
  paidAt: Date | null;
  lineItems: InvoiceLineItem[] | null;
  notes: string | null;
  pdfUrl: string | null;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate?: number;
}

export interface InvoiceWithUsers extends Invoice {
  issuer: PublicUser;
  recipient: PublicUser;
}

// ─────────────────────────────────────────────────────────────────────────────
// Review Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Review extends BaseEntity {
  authorId: string;
  targetId: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isPublic: boolean;
  isVerified: boolean;
  helpful: number;
  reportCount: number;
}

export interface ReviewWithUsers extends Review {
  author: PublicUser;
  target: PublicUser;
  response: ReviewResponse | null;
}

export interface ReviewResponse extends BaseEntity {
  reviewId: string;
  content: string;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  responseRate: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mortgage Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Mortgage extends BaseEntity {
  transactionId: string | null;
  propertyId: string | null;
  buyerId: string | null;
  lender: string | null;
  loanType: string | null;
  loanAmount: number | null;
  interestRate: number | null;
  termMonths: number | null;
  monthlyPayment: number | null;
  downPaymentPct: number | null;
  creditScore: number | null;
  preApproved: boolean;
  preApprovalAmount: number | null;
  preApprovalDate: Date | null;
  preApprovalExpiry: Date | null;
  status: string;
}

export interface MortgageCalculation {
  homePrice: number;
  downPayment: number;
  downPaymentPercent: number;
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  monthlyPrincipalAndInterest: number;
  monthlyPropertyTax: number;
  monthlyInsurance: number;
  monthlyHoa: number;
  monthlyPmi: number;
  totalMonthlyPayment: number;
  totalInterest: number;
  totalCost: number;
  amortizationSchedule: AmortizationEntry[];
}

export interface AmortizationEntry {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  totalInterest: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit Log Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AuditLog extends BaseEntity {
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CursorPaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    cursor: string | null;
    nextCursor: string | null;
    hasMore: boolean;
    limit: number;
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
  code?: string;
  details?: Record<string, unknown>;
  timestamp: string;
  requestId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Types
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  user: {
    totalProperties: number;
    activeListings: number;
    totalTransactions: number;
    totalRevenue: number;
  };
  recentActivity: ActivityItem[];
  upcomingAppointments: AppointmentCalendarEvent[];
  pendingOffers: OfferSummary[];
  notifications: Notification[];
}

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: Date;
  url?: string;
  icon?: string;
}

export interface AgentDashboard extends DashboardStats {
  agent: {
    totalClients: number;
    activeClients: number;
    totalSales: number;
    totalVolume: number;
    averageRating: number;
    totalReviews: number;
    pendingAppointments: number;
    activeTransactions: number;
  };
  clientInsights: ClientInsight[];
  performanceMetrics: PerformanceMetric[];
}

export interface ClientInsight {
  clientId: string;
  clientName: string;
  lastContact: Date | null;
  nextFollowUp: Date | null;
  leadScore: number | null;
  status: string;
  recentActivity: string;
}

export interface PerformanceMetric {
  label: string;
  value: number;
  change: number;
  trend: "up" | "down" | "stable";
  period: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AIInsights {
  propertyId: string;
  marketAnalysis: MarketAnalysis;
  priceRecommendation: PriceRecommendation;
  comparableProperties: ComparableProperty[];
  neighborhoodInsights: NeighborhoodInsights;
  investmentScore: number;
  generatedAt: Date;
}

export interface MarketAnalysis {
  averagePrice: number;
  medianPrice: number;
  pricePerSqFt: number;
  daysOnMarket: number;
  inventoryLevel: "low" | "medium" | "high";
  priceTrend: "increasing" | "decreasing" | "stable";
  competitionLevel: "low" | "medium" | "high";
  bestTimeToList: string;
}

export interface PriceRecommendation {
  suggestedPrice: number;
  confidence: number;
  range: { min: number; max: number };
  factors: string[];
}

export interface ComparableProperty {
  propertyId: string;
  title: string;
  address: string;
  price: number;
  similarity: number;
  features: string[];
}

export interface NeighborhoodInsights {
  walkability: number;
  transitScore: number;
  schoolRating: number;
  safetyScore: number;
  amenities: string[];
  upcomingDevelopments: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// State Management Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AppState {
  user: UserWithProfile | null;
  notifications: Notification[];
  unreadCount: number;
  searchHistory: Search[];
  savedSearches: SavedSearch[];
  recentProperties: PropertyCard[];
  favorites: string[];
  compareList: string[];
}

export interface PropertyState {
  properties: PropertyCard[];
  selectedProperty: PropertyWithDetails | null;
  filters: SearchFilters;
  viewMode: "grid" | "list" | "map";
  isLoading: boolean;
  error: string | null;
}

export interface UIState {
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  theme: "light" | "dark" | "system";
  modals: Record<string, boolean>;
  toasts: Toast[];
}

export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility Types
// ─────────────────────────────────────────────────────────────────────────────

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> &
    { [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>> }[Keys];

export type WithTimestamps<T> = T & {
  createdAt: Date;
  updatedAt: Date;
};

export type WithoutTimestamps<T> = Omit<T, "createdAt" | "updatedAt">;

export type StringKeys<T> = {
  [K in keyof T]: T[K] extends string ? K : never;
}[keyof T];

export type NumberKeys<T> = {
  [K in keyof T]: T[K] extends number ? K : never;
}[keyof T];

export type BooleanKeys<T> = {
  [K in keyof T]: T[K] extends boolean ? K : never;
}[keyof T];

export type DateKeys<T> = {
  [K in keyof T]: T[K] extends Date ? K : never;
}[keyof T];

export type NestedValue<T> = T extends object
  ? { [K in keyof T]: NestedValue<T[K]> }
  : T;
