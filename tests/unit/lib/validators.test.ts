import {
  propertySchema,
  listingSchema,
  offerSchema,
  agentSchema,
  userSchema,
  searchSchema,
  mortgageSchema,
  transactionSchema,
  validateEmail,
  validatePhone,
  validatePassword,
  sanitizeInput,
  validateDateRange,
  validatePriceRange,
} from "@/lib/validators";

describe("Validators", () => {
  describe("propertySchema", () => {
    it("should validate correct property data", () => {
      const result = propertySchema.safeParse({
        title: "Beautiful Family Home in Austin",
        description: "A stunning 4-bedroom family home in the heart of Austin with modern amenities.",
        price: 450000,
        address: {
          street: "123 Main St",
          city: "Austin",
          state: "TX",
          zip: "78701",
          country: "USA",
        },
        type: "house",
        bedrooms: 4,
        bathrooms: 3,
        squareFeet: 2500,
        yearBuilt: 2015,
        agentId: "agt_123",
        ownerId: "user_456",
      });

      expect(result.success).toBe(true);
    });

    it("should reject invalid property data", () => {
      const result = propertySchema.safeParse({
        title: "Hi",
        description: "Short",
        price: -100,
        address: {
          street: "",
          city: "",
          state: "",
          zip: "invalid",
          country: "",
        },
        type: "invalid",
        bedrooms: -1,
        bathrooms: -1,
        squareFeet: -100,
        yearBuilt: 1000,
        agentId: "",
        ownerId: "",
      });

      expect(result.success).toBe(false);
    });

    it("should reject price over 100M", () => {
      const result = propertySchema.safeParse({
        title: "Valid Title Here",
        description: "This is a valid description with enough characters.",
        price: 100000001,
        address: {
          street: "123 Main St",
          city: "Austin",
          state: "TX",
          zip: "78701",
          country: "USA",
        },
        type: "house",
        bedrooms: 4,
        bathrooms: 3,
        squareFeet: 2500,
        yearBuilt: 2015,
        agentId: "agt_123",
        ownerId: "user_456",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("listingSchema", () => {
    it("should validate correct listing data", () => {
      const result = listingSchema.safeParse({
        propertyId: "prop_123",
        agentId: "agt_456",
        type: "sale",
        price: 450000,
        description: "Beautiful home with modern amenities and great location for families.",
        scheduledStartDate: new Date().toISOString(),
      });

      expect(result.success).toBe(true);
    });

    it("should validate listing with optional fields", () => {
      const result = listingSchema.safeParse({
        propertyId: "prop_123",
        agentId: "agt_456",
        type: "rent",
        price: 2500,
        originalPrice: 3000,
        currency: "EUR",
        description: "Luxury apartment for rent in downtown with amazing views.",
        openHouseDate: new Date().toISOString(),
        virtualTourUrl: "https://example.com/tour",
        highlights: ["Pool", "Gym"],
        scheduledStartDate: new Date().toISOString(),
      });

      expect(result.success).toBe(true);
    });

    it("should reject invalid listing type", () => {
      const result = listingSchema.safeParse({
        propertyId: "prop_123",
        agentId: "agt_456",
        type: "invalid",
        price: 450000,
        description: "Valid description with enough characters to pass validation.",
        scheduledStartDate: new Date().toISOString(),
      });

      expect(result.success).toBe(false);
    });
  });

  describe("offerSchema", () => {
    it("should validate correct offer data", () => {
      const result = offerSchema.safeParse({
        propertyId: "prop_123",
        listingId: "lst_456",
        buyerId: "user_buyer",
        buyerAgentId: "agt_buyer",
        sellerAgentId: "agt_seller",
        amount: 425000,
        earnestMoney: 10000,
        downPayment: 85000,
        financingType: "conventional",
        closingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      });

      expect(result.success).toBe(true);
    });

    it("should validate cash offer", () => {
      const result = offerSchema.safeParse({
        propertyId: "prop_123",
        listingId: "lst_456",
        buyerId: "user_buyer",
        buyerAgentId: "agt_buyer",
        sellerAgentId: "agt_seller",
        amount: 500000,
        earnestMoney: 25000,
        downPayment: 500000,
        financingType: "cash",
        contingencies: [],
        closingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      });

      expect(result.success).toBe(true);
    });

    it("should reject invalid financing type", () => {
      const result = offerSchema.safeParse({
        propertyId: "prop_123",
        listingId: "lst_456",
        buyerId: "user_buyer",
        buyerAgentId: "agt_buyer",
        sellerAgentId: "agt_seller",
        amount: 425000,
        earnestMoney: 10000,
        downPayment: 85000,
        financingType: "invalid",
        closingDate: new Date().toISOString(),
        expiresAt: new Date().toISOString(),
      });

      expect(result.success).toBe(false);
    });
  });

  describe("agentSchema", () => {
    it("should validate correct agent data", () => {
      const result = agentSchema.safeParse({
        userId: "user_123",
        name: "John Smith",
        email: "john@realty.com",
        phone: "(512) 555-1234",
        licenseNumber: "TX-123456",
        licenseState: "TX",
        licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        brokerage: "Austin Realty Group",
        bio: "John Smith is an experienced real estate agent with over 5 years of expertise in the Austin market.",
      });

      expect(result.success).toBe(true);
    });

    it("should reject short bio", () => {
      const result = agentSchema.safeParse({
        userId: "user_123",
        name: "John Smith",
        email: "john@realty.com",
        phone: "(512) 555-1234",
        licenseNumber: "TX-123456",
        licenseState: "TX",
        licenseExpiry: new Date().toISOString(),
        brokerage: "Austin Realty Group",
        bio: "Short bio",
      });

      expect(result.success).toBe(false);
    });

    it("should reject invalid email", () => {
      const result = agentSchema.safeParse({
        userId: "user_123",
        name: "John Smith",
        email: "not-an-email",
        phone: "(512) 555-1234",
        licenseNumber: "TX-123456",
        licenseState: "TX",
        licenseExpiry: new Date().toISOString(),
        brokerage: "Austin Realty Group",
        bio: "This is a valid bio that is long enough to pass validation checks.",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("userSchema", () => {
    it("should validate correct user data", () => {
      const result = userSchema.safeParse({
        email: "user@example.com",
        password: "SecurePass123!",
        name: "John Doe",
      });

      expect(result.success).toBe(true);
    });

    it("should reject weak password", () => {
      const result = userSchema.safeParse({
        email: "user@example.com",
        password: "weak",
        name: "John Doe",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("searchSchema", () => {
    it("should validate correct search data", () => {
      const result = searchSchema.safeParse({
        query: "house in Austin",
        filters: {
          minPrice: 300000,
          maxPrice: 500000,
          type: ["house"],
          minBedrooms: 3,
        },
        page: 1,
        limit: 10,
      });

      expect(result.success).toBe(true);
    });

    it("should use default values", () => {
      const result = searchSchema.safeParse({
        query: "apartment",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);
      }
    });
  });

  describe("mortgageSchema", () => {
    it("should validate correct mortgage data", () => {
      const result = mortgageSchema.safeParse({
        homePrice: 450000,
        downPayment: 90000,
        loanTerm: 30,
        interestRate: 6.5,
        loanType: "conventional",
      });

      expect(result.success).toBe(true);
    });

    it("should reject invalid loan term", () => {
      const result = mortgageSchema.safeParse({
        homePrice: 450000,
        downPayment: 90000,
        loanTerm: 25,
        interestRate: 6.5,
        loanType: "conventional",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("transactionSchema", () => {
    it("should validate correct transaction data", () => {
      const result = transactionSchema.safeParse({
        propertyId: "prop_123",
        listingId: "lst_456",
        offerId: "ofr_789",
        buyerId: "user_buyer",
        sellerId: "user_seller",
        buyerAgentId: "agt_buyer",
        sellerAgentId: "agt_seller",
        purchasePrice: 450000,
        earnestMoney: 10000,
        downPayment: 90000,
        loanAmount: 360000,
        closingCosts: 9000,
        agentCommission: 27000,
        closingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      expect(result.success).toBe(true);
    });
  });

  describe("validateEmail", () => {
    it("should validate correct email", () => {
      expect(validateEmail("user@example.com")).toBe(true);
      expect(validateEmail("test@test.co")).toBe(true);
      expect(validateEmail("name.surname@domain.org")).toBe(true);
    });

    it("should reject invalid email", () => {
      expect(validateEmail("")).toBe(false);
      expect(validateEmail("not-an-email")).toBe(false);
      expect(validateEmail("@domain.com")).toBe(false);
      expect(validateEmail("user@")).toBe(false);
    });
  });

  describe("validatePhone", () => {
    it("should validate correct phone numbers", () => {
      expect(validatePhone("(512) 555-1234")).toBe(true);
      expect(validatePhone("+15125551234")).toBe(true);
      expect(validatePhone("512-555-1234")).toBe(true);
    });

    it("should reject invalid phone numbers", () => {
      expect(validatePhone("123")).toBe(false);
      expect(validatePhone("abc")).toBe(false);
    });
  });

  describe("validatePassword", () => {
    it("should validate strong password", () => {
      const result = validatePassword("SecurePass123!");

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject weak passwords", () => {
      expect(validatePassword("short").valid).toBe(false);
      expect(validatePassword("nouppercase123!").valid).toBe(false);
      expect(validatePassword("NOLOWERCASE123!").valid).toBe(false);
      expect(validatePassword("NoNumbers!").valid).toBe(false);
      expect(validatePassword("NoSpecial123").valid).toBe(false);
    });

    it("should collect all errors", () => {
      const result = validatePassword("weak");

      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("sanitizeInput", () => {
    it("should remove HTML tags", () => {
      expect(sanitizeInput("<script>alert('xss')</script>")).toBe("alert('xss')");
      expect(sanitizeInput("<b>bold</b>")).toBe("bold");
      expect(sanitizeInput('<img src="x" onerror="alert(1)">')).toBe("");
    });

    it("should trim whitespace", () => {
      expect(sanitizeInput("  hello  ")).toBe("hello");
    });

    it("should handle empty input", () => {
      expect(sanitizeInput("")).toBe("");
    });
  });

  describe("validateDateRange", () => {
    it("should validate correct date range", () => {
      expect(validateDateRange("2024-01-01", "2024-12-31")).toBe(true);
    });

    it("should reject invalid date range", () => {
      expect(validateDateRange("2024-12-31", "2024-01-01")).toBe(false);
    });
  });

  describe("validatePriceRange", () => {
    it("should validate correct price range", () => {
      expect(validatePriceRange(100, 500)).toBe(true);
      expect(validatePriceRange(0, 1000)).toBe(true);
    });

    it("should reject invalid price range", () => {
      expect(validatePriceRange(500, 100)).toBe(false);
      expect(validatePriceRange(-100, 500)).toBe(false);
    });
  });
});
