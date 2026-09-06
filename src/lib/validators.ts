import { z } from "zod";

export const propertySchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  price: z.number().positive().max(100000000),
  address: z.object({
    street: z.string().min(1).max(200),
    city: z.string().min(1).max(100),
    state: z.string().min(2).max(50),
    zip: z.string().regex(/^\d{5}(-\d{4})?$/),
    country: z.string().min(2).max(100),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
  }),
  type: z.enum(["house", "condo", "apartment", "townhouse", "land", "commercial"]),
  bedrooms: z.number().int().min(0).max(50),
  bathrooms: z.number().min(0).max(50),
  squareFeet: z.number().positive().max(100000),
  lotSize: z.number().positive().optional(),
  yearBuilt: z.number().int().min(1800).max(new Date().getFullYear() + 5),
  images: z.array(z.string().url()).max(100).optional(),
  features: z.array(z.string()).max(50).optional(),
  agentId: z.string().min(1),
  ownerId: z.string().min(1),
});

export const listingSchema = z.object({
  propertyId: z.string().min(1),
  agentId: z.string().min(1),
  type: z.enum(["sale", "rent", "lease"]),
  price: z.number().positive(),
  originalPrice: z.number().positive().optional(),
  currency: z.string().length(3).default("USD"),
  openHouseDate: z.string().datetime().optional(),
  virtualTourUrl: z.string().url().optional(),
  description: z.string().min(20).max(5000),
  highlights: z.array(z.string()).max(20).optional(),
  showingInstructions: z.string().max(2000).optional(),
  scheduledStartDate: z.string().datetime(),
  scheduledEndDate: z.string().datetime().optional(),
});

export const offerSchema = z.object({
  propertyId: z.string().min(1),
  listingId: z.string().min(1),
  buyerId: z.string().min(1),
  buyerAgentId: z.string().min(1),
  sellerAgentId: z.string().min(1),
  amount: z.number().positive().max(100000000),
  earnestMoney: z.number().positive(),
  downPayment: z.number().positive(),
  financingType: z.enum(["cash", "conventional", "fha", "va", "usda"]),
  contingencies: z.array(z.string()).max(10).optional(),
  closingDate: z.string().datetime(),
  inspectionDate: z.string().datetime().optional(),
  appraisalDate: z.string().datetime().optional(),
  expiresAt: z.string().datetime(),
  notes: z.string().max(2000).optional(),
});

export const agentSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  licenseNumber: z.string().min(3).max(50),
  licenseState: z.string().min(2).max(50),
  licenseExpiry: z.string().datetime(),
  brokerage: z.string().min(1).max(200),
  specializations: z.array(z.string()).max(10).optional(),
  serviceAreas: z.array(z.string()).max(20).optional(),
  experience: z.number().int().min(0).max(50).optional(),
  bio: z.string().min(50).max(2000),
  avatar: z.string().url().optional(),
  languages: z.array(z.string()).max(10).optional(),
  certifications: z.array(z.string()).max(20).optional(),
});

export const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(2).max(100),
  phone: z.string().min(10).max(20).optional(),
  role: z.enum(["buyer", "seller", "agent", "admin"]).default("buyer"),
});

export const searchSchema = z.object({
  query: z.string().min(1).max(500),
  filters: z
    .object({
      minPrice: z.number().positive().optional(),
      maxPrice: z.number().positive().optional(),
      type: z.array(z.enum(["house", "condo", "apartment", "townhouse", "land", "commercial"])).optional(),
      minBedrooms: z.number().int().min(0).optional(),
      maxBedrooms: z.number().int().max(50).optional(),
      minBathrooms: z.number().min(0).optional(),
      maxBathrooms: z.number().max(50).optional(),
      minSquareFeet: z.number().positive().optional(),
      maxSquareFeet: z.number().positive().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
    })
    .optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

export const mortgageSchema = z.object({
  homePrice: z.number().positive().max(100000000),
  downPayment: z.number().min(0),
  loanTerm: z.number().int().refine((val) => [10, 15, 20, 25, 30].includes(val)),
  interestRate: z.number().min(0).max(30),
  loanType: z.enum(["conventional", "fha", "va", "usda"]),
  propertyTax: z.number().positive().optional(),
  homeInsurance: z.number().positive().optional(),
  hoa: z.number().min(0).optional(),
  pmi: z.boolean().optional(),
});

export const transactionSchema = z.object({
  propertyId: z.string().min(1),
  listingId: z.string().min(1),
  offerId: z.string().min(1),
  buyerId: z.string().min(1),
  sellerId: z.string().min(1),
  buyerAgentId: z.string().min(1),
  sellerAgentId: z.string().min(1),
  lenderId: z.string().optional(),
  titleCompanyId: z.string().optional(),
  purchasePrice: z.number().positive(),
  earnestMoney: z.number().positive(),
  downPayment: z.number().min(0),
  loanAmount: z.number().min(0),
  closingCosts: z.number().min(0),
  agentCommission: z.number().min(0),
  closingDate: z.string().datetime(),
});

export function validateEmail(email: string): boolean {
  return z.string().email().safeParse(email).success;
}

export function validatePhone(phone: string): boolean {
  return z.string().min(10).max(20).safeParse(phone).success;
}

export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (password.length < 8) errors.push("Password must be at least 8 characters");
  if (password.length > 128) errors.push("Password must be at most 128 characters");
  if (!/[A-Z]/.test(password)) errors.push("Password must contain at least one uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("Password must contain at least one lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("Password must contain at least one number");
  if (!/[!@#$%^&*]/.test(password)) errors.push("Password must contain at least one special character");
  return { valid: errors.length === 0, errors };
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, "")
    .trim();
}

export function validateDateRange(start: string, end: string): boolean {
  return new Date(start) < new Date(end);
}

export function validatePriceRange(min: number, max: number): boolean {
  return min >= 0 && max > min;
}
