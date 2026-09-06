import { mortgageService, MortgageService } from "@/lib/mortgage/mortgage-service";

const service = new MortgageService();

beforeEach(() => {
  service.clear();
});

const mockCalculation = {
  homePrice: 450000,
  downPayment: 90000,
  loanTerm: 30,
  interestRate: 6.5,
  loanType: "conventional" as const,
  propertyTax: 5400,
  homeInsurance: 1800,
  hoa: 200,
  pmi: true,
};

describe("MortgageService", () => {
  describe("calculate", () => {
    it("should calculate mortgage payments", async () => {
      const result = await service.calculate(mockCalculation);

      expect(result).toBeDefined();
      expect(result.loanAmount).toBe(360000);
      expect(result.monthlyPayment).toBeGreaterThan(0);
      expect(result.principalAndInterest).toBeGreaterThan(0);
      expect(result.monthlyTax).toBeGreaterThan(0);
      expect(result.monthlyInsurance).toBeGreaterThan(0);
      expect(result.monthlyHOA).toBe(200);
      expect(result.monthlyPMI).toBeGreaterThan(0);
      expect(result.totalMonthly).toBeGreaterThan(result.principalAndInterest);
      expect(result.totalInterest).toBeGreaterThan(0);
      expect(result.totalCost).toBeGreaterThan(360000);
    });

    it("should generate amortization schedule", async () => {
      const result = await service.calculate(mockCalculation);

      expect(result.amortizationSchedule).toHaveLength(360);
      expect(result.amortizationSchedule[0].month).toBe(1);
      expect(result.amortizationSchedule[0].payment).toBe(result.principalAndInterest);
      expect(result.amortizationSchedule[0].balance).toBeLessThan(360000);
      expect(result.amortizationSchedule[359].balance).toBe(0);
    });

    it("should calculate affordability check", async () => {
      const result = await service.calculate(mockCalculation);

      expect(result.affordabilityCheck).toBeDefined();
      expect(result.affordabilityCheck.monthlyIncomeRequired).toBeGreaterThan(0);
      expect(result.affordabilityCheck.debtToIncomeRatio).toBeGreaterThan(0);
      expect(result.affordabilityCheck.debtToIncomeRatio).toBeLessThanOrEqual(28);
    });

    it("should handle zero interest rate", async () => {
      const result = await service.calculate({
        ...mockCalculation,
        interestRate: 0,
      });

      expect(result.monthlyPayment).toBe(10000);
      expect(result.totalInterest).toBe(0);
    });

    it("should calculate without PMI for 20% down", async () => {
      const result = await service.calculate({
        ...mockCalculation,
        downPayment: 90000,
        pmi: undefined,
      });

      expect(result.monthlyPMI).toBe(0);
    });

    it("should handle different loan terms", async () => {
      const fifteen = await service.calculate({
        ...mockCalculation,
        loanTerm: 15,
      });
      const thirty = await service.calculate({
        ...mockCalculation,
        loanTerm: 30,
      });

      expect(fifteen.monthlyPayment).toBeGreaterThan(thirty.monthlyPayment);
      expect(fifteen.totalInterest).toBeLessThan(thirty.totalInterest);
    });
  });

  describe("getPreApproval", () => {
    it("should calculate pre-approval", async () => {
      const result = await service.getPreApproval({
        annualIncome: 120000,
        monthlyDebts: 500,
        creditScore: 740,
        employmentType: "employed",
        yearsAtJob: 5,
        downPayment: 90000,
        loanTerm: 30,
        interestRate: 6.5,
        loanType: "conventional",
      });

      expect(result).toBeDefined();
      expect(result.maxLoanAmount).toBeGreaterThan(0);
      expect(result.maxHomePrice).toBeGreaterThan(0);
      expect(result.estimatedMonthlyPayment).toBeGreaterThan(0);
      expect(result.debtToIncomeRatio).toBeGreaterThan(0);
      expect(result.isApproved).toBeDefined();
      expect(["full", "conditional", "denied"]).toContain(result.approvalLevel);
      expect(result.factors).toHaveLength(4);
      expect(result.generatedAt).toBeDefined();
      expect(result.expiresAt).toBeDefined();
    });

    it("should approve strong applicants", async () => {
      const result = await service.getPreApproval({
        annualIncome: 200000,
        monthlyDebts: 200,
        creditScore: 800,
        employmentType: "employed",
        yearsAtJob: 10,
        downPayment: 100000,
        loanTerm: 30,
        interestRate: 6.5,
        loanType: "conventional",
      });

      expect(result.isApproved).toBe(true);
      expect(result.approvalLevel).toBe("full");
    });

    it("should handle self-employed applicants", async () => {
      const result = await service.getPreApproval({
        annualIncome: 100000,
        monthlyDebts: 0,
        creditScore: 720,
        employmentType: "self-employed",
        yearsAtJob: 3,
        downPayment: 50000,
        loanTerm: 30,
        interestRate: 6.5,
        loanType: "conventional",
      });

      expect(result).toBeDefined();
    });

    it("should include factor analysis", async () => {
      const result = await service.getPreApproval({
        annualIncome: 120000,
        monthlyDebts: 500,
        creditScore: 740,
        employmentType: "employed",
        yearsAtJob: 5,
        downPayment: 90000,
        loanTerm: 30,
        interestRate: 6.5,
        loanType: "conventional",
      });

      for (const factor of result.factors) {
        expect(factor.factor).toBeDefined();
        expect(["positive", "negative", "neutral"]).toContain(factor.impact);
        expect(factor.details).toBeDefined();
      }
    });
  });

  describe("calculateRefinance", () => {
    it("should calculate refinance savings", async () => {
      const result = await service.calculateRefinance({
        currentLoanBalance: 300000,
        currentInterestRate: 7.0,
        currentMonthlyPayment: 2000,
        remainingMonths: 240,
        newInterestRate: 6.0,
        newLoanTerm: 30,
        closingCosts: 6000,
      });

      expect(result).toBeDefined();
      expect(result.currentLoan).toBeDefined();
      expect(result.newLoan).toBeDefined();
      expect(result.savings).toBeDefined();
      expect(result.savings.monthlySavings).toBeDefined();
      expect(result.savings.totalSavings).toBeDefined();
      expect(result.savings.breakEvenMonths).toBeDefined();
      expect(["refinance", "keep_current", "consider"]).toContain(result.recommendation);
      expect(result.reasons).toBeDefined();
    });

    it("should recommend refinance when beneficial", async () => {
      const result = await service.calculateRefinance({
        currentLoanBalance: 300000,
        currentInterestRate: 7.0,
        currentMonthlyPayment: 2000,
        remainingMonths: 240,
        newInterestRate: 5.0,
        newLoanTerm: 30,
      });

      expect(result.recommendation).toBe("refinance");
      expect(result.savings.monthlySavings).toBeGreaterThan(0);
    });

    it("should recommend keeping current loan when rates higher", async () => {
      const result = await service.calculateRefinance({
        currentLoanBalance: 300000,
        currentInterestRate: 5.0,
        currentMonthlyPayment: 1600,
        remainingMonths: 240,
        newInterestRate: 7.0,
        newLoanTerm: 30,
        closingCosts: 6000,
      });

      expect(result.recommendation).toBe("keep_current");
    });

    it("should handle cash-out refinance", async () => {
      const result = await service.calculateRefinance({
        currentLoanBalance: 300000,
        currentInterestRate: 7.0,
        currentMonthlyPayment: 2000,
        remainingMonths: 240,
        newInterestRate: 6.0,
        newLoanTerm: 30,
        cashOut: 50000,
      });

      expect(result).toBeDefined();
    });
  });

  describe("compareLoanOptions", () => {
    it("should compare different loan options", async () => {
      const results = await service.compareLoanOptions(450000, 90000, [
        { term: 15, rate: 6.0, type: "15-year" },
        { term: 20, rate: 6.25, type: "20-year" },
        { term: 30, rate: 6.5, type: "30-year" },
      ]);

      expect(results).toHaveLength(3);
      for (const result of results) {
        expect(result.monthlyPayment).toBeGreaterThan(0);
        expect(result.totalInterest).toBeGreaterThan(0);
        expect(result.totalCost).toBeGreaterThan(0);
      }

      expect(results[0].monthlyPayment).toBeGreaterThan(results[2].monthlyPayment);
      expect(results[0].totalInterest).toBeLessThan(results[2].totalInterest);
    });

    it("should mark lowest payment and total cost", async () => {
      const results = await service.compareLoanOptions(450000, 90000, [
        { term: 15, rate: 6.0, type: "15-year" },
        { term: 30, rate: 6.5, type: "30-year" },
      ]);

      const lowestPayment = results.find((r) => r.recommendation === "lowest_monthly");
      const lowestTotal = results.find((r) => r.recommendation === "lowest_total");

      expect(lowestPayment).toBeDefined();
      expect(lowestTotal).toBeDefined();
    });
  });

  describe("getAmortizationSummary", () => {
    it("should generate amortization summary", async () => {
      const result = await service.getAmortizationSummary(360000, 6.5, 30);

      expect(result.monthlyPayment).toBeGreaterThan(0);
      expect(result.totalInterest).toBeGreaterThan(0);
      expect(result.totalCost).toBeGreaterThan(360000);
      expect(result.payoffDate).toBeDefined();
      expect(result.yearlySchedule).toHaveLength(30);
      expect(result.yearlySchedule[0].year).toBe(1);
      expect(result.yearlySchedule[0].remainingBalance).toBeGreaterThan(0);
      expect(result.yearlySchedule[29].remainingBalance).toBe(0);
    });
  });
});
