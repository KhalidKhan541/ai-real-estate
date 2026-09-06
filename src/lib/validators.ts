import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Common Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const emailSchema = z
  .string()
  .email("Invalid email address")
  .toLowerCase()
  .trim();

export const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number")
  .optional()
  .or(z.literal(""));

export const urlSchema = z.string().url("Invalid URL").optional().or(z.literal(""));

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
  orderBy: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const idSchema = z.string().cuid("Invalid ID format");

export const slugSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format");

// ─────────────────────────────────────────────────────────────────────────────
// Auth Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be at most 100 characters"),
    email: emailSchema,
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string(),
    role: z.enum(["BUYER", "SELLER", "AGENT"]).default("BUYER"),
    phone: phoneSchema,
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms and conditions" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

export const newPasswordSchema = z
  .object({
    token: z.string(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// ─────────────────────────────────────────────────────────────────────────────
// User Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .optional(),
  phone: phoneSchema,
  bio: z.string().max(1000, "Bio must be at most 1000 characters").optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zipCode: z.string().max(20).optional(),
  country: z.string().max(50).optional(),
  website: urlSchema,
  linkedin: urlSchema,
  twitter: urlSchema,
  preferredLang: z.string().max(10).optional(),
  currency: z.string().max(3).optional(),
  timezone: z.string().max(50).optional(),
  isPublic: z.boolean().optional(),
});

export const updateAvatarSchema = z.object({
  image: z.string().url("Invalid image URL"),
});

// ─────────────────────────────────────────────────────────────────────────────
// Property Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const propertyTypeEnum = z.enum([
  "HOUSE",
  "CONDO",
  "TOWNHOUSE",
  "APARTMENT",
  "LAND",
  "COMMERCIAL",
  "MULTI_FAMILY",
  "FARM",
  "OTHER",
]);

export const createPropertySchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be at most 200 characters"),
  description: z.string().max(5000, "Description too long").optional(),
  propertyType: propertyTypeEnum,
  price: z.number().positive("Price must be positive").max(100000000),
  yearBuilt: z
    .number()
    .int()
    .min(1800)
    .max(new Date().getFullYear() + 5)
    .optional(),
  lotSize: z.number().positive().optional(),
  livingArea: z.number().positive().optional(),
  bedrooms: z.number().int().min(0).max(100).optional(),
  bathrooms: z.number().min(0).max(100).optional(),
  halfBathrooms: z.number().int().min(0).max(50).optional(),
  floors: z.number().int().min(1).max(200).optional(),
  parkingSpaces: z.number().int().min(0).max(1000).optional(),
  garageType: z.string().max(50).optional(),
  heatingType: z.string().max(50).optional(),
  coolingType: z.string().max(50).optional(),
  appliances: z.array(z.string()).optional(),
  flooringTypes: z.array(z.string()).optional(),
  roofType: z.string().max(50).optional(),
  foundationType: z.string().max(50).optional(),
  poolType: z.string().max(50).optional(),
  fireplaceCount: z.number().int().min(0).max(50).optional(),
  address: z.string().min(1, "Address is required").max(300),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(50),
  zipCode: z.string().min(1, "Zip code is required").max(20),
  country: z.string().max(50).default("US"),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  mlsNumber: z.string().max(50).optional(),
  mlsSource: z.string().max(100).optional(),
  mlsUrl: urlSchema,
  videoUrl: urlSchema,
  virtualTourUrl: urlSchema,
  openHouseStart: z.coerce.date().optional(),
  openHouseEnd: z.coerce.date().optional(),
  availableFrom: z.coerce.date().optional(),
  hoaFee: z.number().min(0).optional(),
  taxAmount: z.number().min(0).optional(),
  taxYear: z.number().int().min(2000).max(2100).optional(),
});

export const updatePropertySchema = createPropertySchema.partial();

export const propertyFilterSchema = z.object({
  propertyType: z.array(propertyTypeEnum).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minBedrooms: z.coerce.number().int().min(0).optional(),
  maxBedrooms: z.coerce.number().int().min(100).optional(),
  minBathrooms: z.coerce.number().min(0).optional(),
  maxBathrooms: z.coerce.number().max(100).optional(),
  minLivingArea: z.coerce.number().min(0).optional(),
  maxLivingArea: z.coerce.number().min(0).optional(),
  minLotSize: z.coerce.number().min(0).optional(),
  maxLotSize: z.coerce.number().min(0).optional(),
  yearBuiltMin: z.coerce.number().int().optional(),
  yearBuiltMax: z.coerce.number().int().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  radius: z.coerce.number().min(0).max(100).optional(),
  features: z.array(z.string()).optional(),
  keywords: z.string().optional(),
  ...paginationSchema.shape,
});

// ─────────────────────────────────────────────────────────────────────────────
// Listing Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const listingStatusEnum = z.enum([
  "DRAFT",
  "ACTIVE",
  "PENDING",
  "UNDER_CONTRACT",
  "SOLD",
  "EXPIRED",
  "WITHDRAWN",
  "OFF_MARKET",
]);

export const createListingSchema = z.object({
  propertyId: idSchema,
  agentId: idSchema.optional(),
  listedPrice: z.number().positive("Price must be positive"),
  description: z.string().max(5000).optional(),
  specialTerms: z.string().max(2000).optional(),
  isPublic: z.boolean().default(true),
  isExclusive: z.boolean().default(false),
  isPocketListing: z.boolean().default(false),
  commissionRate: z.number().min(0).max(10).optional(),
  expiresAt: z.coerce.date().optional(),
  openHouseDates: z.array(
    z.object({
      start: z.coerce.date(),
      end: z.coerce.date(),
    })
  ).optional(),
});

export const updateListingSchema = z.object({
  status: listingStatusEnum.optional(),
  listedPrice: z.number().positive().optional(),
  description: z.string().max(5000).optional(),
  specialTerms: z.string().max(2000).optional(),
  isPublic: z.boolean().optional(),
  commissionRate: z.number().min(0).max(10).optional(),
  expiresAt: z.coerce.date().optional(),
  openHouseDates: z.array(
    z.object({
      start: z.coerce.date(),
      end: z.coerce.date(),
    })
  ).optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Offer Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const offerStatusEnum = z.enum([
  "DRAFT",
  "SUBMITTED",
  "COUNTERED",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "WITHDRAWN",
  "FALLBACK",
]);

export const createOfferSchema = z.object({
  propertyId: idSchema,
  offerPrice: z.number().positive("Offer price must be positive"),
  earnestMoney: z.number().min(0).optional(),
  downPayment: z.number().min(0).optional(),
  loanType: z.string().max(50).optional(),
  loanAmount: z.number().min(0).optional(),
  closingDate: z.coerce.date(),
  inspectionContingency: z.boolean().default(true),
  appraisalContingency: z.boolean().default(true),
  financingContingency: z.boolean().default(true),
  saleContingency: z.boolean().default(false),
  inspectionDays: z.number().int().min(1).max(90).default(10),
  closingCosts: z.number().min(0).optional(),
  sellerConcessions: z.number().min(0).optional(),
  personalLetter: z.string().max(2000).optional(),
  expirationDate: z.coerce.date(),
  notes: z.string().max(2000).optional(),
});

export const counterOfferSchema = z.object({
  counterPrice: z.number().positive("Counter price must be positive"),
  counterTerms: z.record(z.unknown()).optional(),
  notes: z.string().max(2000).optional(),
});

export const offerFilterSchema = z.object({
  propertyId: idSchema.optional(),
  buyerId: idSchema.optional(),
  status: z.array(offerStatusEnum).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  createdAfter: z.coerce.date().optional(),
  createdBefore: z.coerce.date().optional(),
  ...paginationSchema.shape,
});

// ─────────────────────────────────────────────────────────────────────────────
// Agent Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const createAgentProfileSchema = z.object({
  licenseNumber: z.string().min(1).max(50),
  licenseState: z.string().min(1).max(50),
  licenseExpiry: z.coerce.date(),
  brokerageName: z.string().max(200).optional(),
  specialization: z.array(z.string()).min(1, "At least one specialization required"),
  yearsExperience: z.number().int().min(0).max(100).optional(),
  languagesSpoken: z.array(z.string()).default(["en"]),
  serviceAreas: z.array(z.string()).min(1, "At least one service area required"),
  commissionRate: z.number().min(0).max(10).optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  awards: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
});

export const updateAgentProfileSchema = createAgentProfileSchema.partial();

export const agentFilterSchema = z.object({
  specialization: z.array(z.string()).optional(),
  languagesSpoken: z.array(z.string()).optional(),
  serviceAreas: z.array(z.string()).optional(),
  minExperience: z.coerce.number().int().min(0).optional(),
  maxExperience: z.coerce.number().int().max(100).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  isVerified: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  ...paginationSchema.shape,
});

// ─────────────────────────────────────────────────────────────────────────────
// Client Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const createClientSchema = z.object({
  name: z.string().min(1).max(200),
  email: emailSchema.optional().or(z.literal("")),
  phone: phoneSchema,
  budget: z.number().min(0).optional(),
  minBedrooms: z.number().int().min(0).optional(),
  maxBedrooms: z.number().int().min(0).optional(),
  minBathrooms: z.number().min(0).optional(),
  propertyTypes: z.array(propertyTypeEnum).optional(),
  preferredAreas: z.array(z.string()).optional(),
  mustHave: z.array(z.string()).optional(),
  niceToHave: z.array(z.string()).optional(),
  dealBreakers: z.array(z.string()).optional(),
  notes: z.string().max(2000).optional(),
  leadScore: z.number().int().min(0).max(100).optional(),
  leadSource: z.string().max(100).optional(),
});

export const updateClientSchema = createClientSchema.partial();

// ─────────────────────────────────────────────────────────────────────────────
// Appointment Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const appointmentTypeEnum = z.enum([
  "SHOWING",
  "OPEN_HOUSE",
  "HOME_INSPECTION",
  "APPRAISAL",
  "CLOSING",
  "CONSULTATION",
  "VIDEO_TOUR",
]);

export const createAppointmentSchema = z.object({
  clientId: idSchema.optional(),
  propertyId: idSchema.optional(),
  type: appointmentTypeEnum,
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  location: z.string().max(300).optional(),
  isVirtual: z.boolean().default(false),
  meetingUrl: urlSchema,
  reminder: z.boolean().default(true),
  notes: z.string().max(1000).optional(),
}).refine((data) => data.endTime > data.startTime, {
  message: "End time must be after start time",
  path: ["endTime"],
});

export const updateAppointmentSchema = z.object({
  type: appointmentTypeEnum.optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
  location: z.string().max(300).optional(),
  isVirtual: z.boolean().optional(),
  meetingUrl: urlSchema,
  status: z.enum(["scheduled", "confirmed", "cancelled", "completed", "no_show"]).optional(),
  reminder: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
  outcome: z.string().max(500).optional(),
});

export const appointmentFilterSchema = z.object({
  type: z.array(appointmentTypeEnum).optional(),
  status: z.array(z.string()).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  propertyId: idSchema.optional(),
  clientId: idSchema.optional(),
  ...paginationSchema.shape,
});

// ─────────────────────────────────────────────────────────────────────────────
// Transaction Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const transactionStatusEnum = z.enum([
  "INITIATED",
  "INSPECTION_PENDING",
  "INSPECTION_COMPLETE",
  "APPRAISAL_PENDING",
  "APPRAISAL_COMPLETE",
  "MORTGAGE_PENDING",
  "MORTGAGE_APPROVED",
  "UNDER_CONTRACT",
  "CLOSING_PENDING",
  "CLOSED",
  "CANCELLED",
  "DISPUTED",
]);

export const createTransactionSchema = z.object({
  propertyId: idSchema,
  listingId: idSchema.optional(),
  buyerId: idSchema,
  sellerId: idSchema.optional(),
  agentId: idSchema.optional(),
  offerId: idSchema.optional(),
  salePrice: z.number().positive("Sale price must be positive"),
  closingDate: z.coerce.date().optional(),
  escrowNumber: z.string().max(50).optional(),
  titleCompany: z.string().max(200).optional(),
  titleInsurance: z.number().min(0).optional(),
  transferTax: z.number().min(0).optional(),
  homeWarranty: z.number().min(0).optional(),
  earnestMoneyDeposit: z.number().min(0).optional(),
  earnestMoneyHeld: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateTransactionSchema = z.object({
  status: transactionStatusEnum.optional(),
  salePrice: z.number().positive().optional(),
  closingDate: z.coerce.date().optional(),
  actualClosingDate: z.coerce.date().optional(),
  escrowNumber: z.string().max(50).optional(),
  titleCompany: z.string().max(200).optional(),
  titleInsurance: z.number().min(0).optional(),
  transferTax: z.number().min(0).optional(),
  homeWarranty: z.number().min(0).optional(),
  inspectionDate: z.coerce.date().optional(),
  inspectionResult: z.record(z.unknown()).optional(),
  appraisalDate: z.coerce.date().optional(),
  appraisalValue: z.number().min(0).optional(),
  closingCostsTotal: z.number().min(0).optional(),
  netToSeller: z.number().min(0).optional(),
  notes: z.string().max(2000).optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Neighborhood Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const neighborhoodFilterSchema = z.object({
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  minMedianPrice: z.coerce.number().min(0).optional(),
  maxMedianPrice: z.coerce.number().min(0).optional(),
  minWalkScore: z.coerce.number().int().min(0).max(100).optional(),
  minSchoolRating: z.coerce.number().min(0).max(10).optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  radius: z.coerce.number().min(0).max(100).optional(),
  ...paginationSchema.shape,
});

// ─────────────────────────────────────────────────────────────────────────────
// Search Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const searchSchema = z.object({
  query: z.string().min(1).max(500),
  filters: propertyFilterSchema.optional(),
});

export const savedSearchSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  filters: propertyFilterSchema,
  alertEnabled: z.boolean().default(true),
  alertFrequency: z.enum(["instant", "daily", "weekly"]).default("daily"),
});

// ─────────────────────────────────────────────────────────────────────────────
// Notification Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const updateNotificationPrefsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  messageAlerts: z.boolean().optional(),
  appointmentAlerts: z.boolean().optional(),
  offerAlerts: z.boolean().optional(),
  listingAlerts: z.boolean().optional(),
  priceChangeAlerts: z.boolean().optional(),
  documentAlerts: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  digestFrequency: z.enum(["instant", "daily", "weekly"]).optional(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Payment Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const createPaymentSchema = z.object({
  transactionId: idSchema.optional(),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().max(3).default("USD"),
  method: z.string().max(50).optional(),
  description: z.string().max(500).optional(),
});

export const invoiceFilterSchema = z.object({
  status: z.array(z.enum(["DRAFT", "SENT", "VIEWED", "PAID", "OVERDUE", "CANCELLED"])).optional(),
  minAmount: z.coerce.number().min(0).optional(),
  maxAmount: z.coerce.number().min(0).optional(),
  dueBefore: z.coerce.date().optional(),
  dueAfter: z.coerce.date().optional(),
  ...paginationSchema.shape,
});

// ─────────────────────────────────────────────────────────────────────────────
// Review Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const createReviewSchema = z.object({
  targetId: idSchema,
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  comment: z.string().max(2000).optional(),
  isPublic: z.boolean().default(true),
});

export const reviewFilterSchema = z.object({
  targetId: idSchema.optional(),
  authorId: idSchema.optional(),
  minRating: z.coerce.number().int().min(1).max(5).optional(),
  maxRating: z.coerce.number().int().min(1).max(5).optional(),
  isVerified: z.coerce.boolean().optional(),
  ...paginationSchema.shape,
});

// ─────────────────────────────────────────────────────────────────────────────
// Virtual Tour Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const createVirtualTourSchema = z.object({
  propertyId: idSchema,
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  type: z.enum(["360", "video", "3d_model"]).default("360"),
  url: urlSchema,
  thumbnail: urlSchema,
  floorPlan: urlSchema,
  isPublished: z.boolean().default(false),
  stops: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        imageUrl: z.string().url(),
        position: z
          .object({
            x: z.number(),
            y: z.number(),
            z: z.number(),
          })
          .optional(),
        sortOrder: z.number().int().min(0).default(0),
        hotspots: z.array(z.record(z.unknown())).optional(),
        audioUrl: urlSchema,
      })
    )
    .optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Mortgage Calculator Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const mortgageCalculatorSchema = z.object({
  homePrice: z.number().positive("Home price must be positive"),
  downPayment: z.number().min(0),
  downPaymentType: z.enum(["percent", "amount"]).default("percent"),
  loanTerm: z.number().int().min(1).max(50).default(30),
  interestRate: z.number().min(0).max(30),
  propertyTax: z.number().min(0).optional(),
  insurance: z.number().min(0).optional(),
  hoaFees: z.number().min(0).optional(),
  pmi: z.number().min(0).optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Admin Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const adminUpdateUserSchema = z.object({
  role: z.enum(["BUYER", "SELLER", "AGENT", "BROKER", "ADMIN", "SUPER_ADMIN"]).optional(),
  isActive: z.boolean().optional(),
  isVerified: z.boolean().optional(),
});

export const auditLogFilterSchema = z.object({
  userId: idSchema.optional(),
  action: z.string().optional(),
  entity: z.string().optional(),
  entityId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  ...paginationSchema.shape,
});

// ─────────────────────────────────────────────────────────────────────────────
// Export Types
// ─────────────────────────────────────────────────────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type PropertyFilterInput = z.infer<typeof propertyFilterSchema>;
export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type CreateOfferInput = z.infer<typeof createOfferSchema>;
export type CounterOfferInput = z.infer<typeof counterOfferSchema>;
export type CreateAgentProfileInput = z.infer<typeof createAgentProfileSchema>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type CreateVirtualTourInput = z.infer<typeof createVirtualTourSchema>;
export type MortgageCalculatorInput = z.infer<typeof mortgageCalculatorSchema>;
export type SavedSearchInput = z.infer<typeof savedSearchSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
