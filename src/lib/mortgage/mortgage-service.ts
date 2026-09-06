// ─── Types & Enums ───────────────────────────────────────────────────────────

export enum MortgageType {
  CONVENTIONAL = 'CONVENTIONAL',
  FHA = 'FHA',
  VA = 'VA',
  USDA = 'USDA',
  JUMBO = 'JUMBO',
  ARM = 'ARM',
  INTEREST_ONLY = 'INTEREST_ONLY',
  BALLOON = 'BALLOON',
  FIXED_15 = 'FIXED_15',
  FIXED_30 = 'FIXED_30',
}

export enum LoanTerm {
  TEN_YEARS = 10,
  FIFTEEN_YEARS = 15,
  TWENTY_YEARS = 20,
  TWENTY_FIVE_YEARS = 25,
  THIRTY_YEARS = 30,
}

export enum InterestType {
  FIXED = 'FIXED',
  VARIABLE = 'VARIABLE',
  HYBRID = 'HYBRID',
}

export enum PreQualificationStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  CONDITIONALLY_APPROVED = 'CONDITIONALLY_APPROVED',
  PRE_APPROVED = 'PRE_APPROVED',
  DENIED = 'DENIED',
  EXPIRED = 'EXPIRED',
}

export interface MortgageInput {
  homePrice: number;
  downPayment: number;
  downPaymentPercent: number;
  loanAmount: number;
  interestRate: number;
  loanTerm: LoanTerm;
  mortgageType: MortgageType;
  propertyTaxRate?: number;
  homeInsuranceAnnual?: number;
  pmiRate?: number;
  hoaFees?: number;
  closingCosts?: number;
}

export interface MonthlyPaymentBreakdown {
  principalAndInterest: number;
  propertyTax: number;
  homeInsurance: number;
  pmi: number;
  hoaFees: number;
  totalMonthlyPayment: number;
}

export interface AmortizationEntry {
  month: number;
  year: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  totalInterest: number;
  totalPrincipal: number;
  effectiveRate: number;
}

export interface AmortizationSchedule {
  entries: AmortizationEntry[];
  totalPayments: number;
  totalInterest: number;
  totalPrincipal: number;
  payoffDate: Date;
  monthlyPayment: number;
}

export interface AffordabilityInput {
  annualIncome: number;
  monthlyDebts: number;
  downPayment: number;
  interestRate: number;
  loanTerm: LoanTerm;
  mortgageType: MortgageType;
  monthlyExpenses?: number;
  creditScore?: number;
  employmentType?: 'W2' | 'SELF_EMPLOYED' | 'RETIRED' | 'OTHER';
  hasCoBorrower?: boolean;
  coBorrowerIncome?: number;
  debtsToIncomeRatio?: number;
}

export interface AffordabilityResult {
  maxHomePrice: number;
  maxLoanAmount: number;
  maxMonthlyPayment: number;
  recommendedHomePrice: number;
  recommendedLoanAmount: number;
  recommendedMonthlyPayment: number;
  debtToIncomeRatio: number;
  frontEndRatio: number;
  backEndRatio: number;
  qualificationFactors: QualificationFactor[];
  warnings: string[];
}

export interface QualificationFactor {
  factor: string;
  status: 'STRONG' | 'MODERATE' | 'WEAK' | 'FAILING';
  impact: number;
  description: string;
}

export interface RateComparisonInput {
  loanAmount: number;
  loanTerm: LoanTerm;
  creditScore?: number;
  downPaymentPercent?: number;
  propertyType?: 'SINGLE_FAMILY' | 'CONDO' | 'MULTI_FAMILY' | 'TOWNHOUSE';
  isInvestmentProperty?: boolean;
  isPrimaryResidence?: boolean;
}

export interface MortgageRate {
  lender: string;
  lenderLogo?: string;
  rate: number;
  apr: number;
  mortgageType: MortgageType;
  loanTerm: LoanTerm;
  points: number;
  monthlyPayment: number;
  totalCost: number;
  closingCosts: number;
  isEstimate: boolean;
  lastUpdated: Date;
  url?: string;
  features: string[];
}

export interface PreQualificationInput {
  annualIncome: number;
  monthlyDebts: number;
  employmentType: 'W2' | 'SELF_EMPLOYED' | 'RETIRED' | 'OTHER';
  employmentYears: number;
  creditScoreRange: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  bankruptcyHistory: boolean;
  bankruptcyDischargeDate?: Date;
  downPaymentAmount: number;
  desiredLoanAmount: number;
  propertyState: string;
  firstTimeHomeBuyer: boolean;
  isVeteran: boolean;
  hasCoborrower: boolean;
  coborrowerIncome?: number;
  additionalAssets?: number;
}

export interface PreQualificationResult {
  id: string;
  status: PreQualificationStatus;
  maxLoanAmount: number;
  estimatedRate: number;
  estimatedMonthlyPayment: number;
  estimatedDTI: number;
  qualificationScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  validUntil: Date;
  createdAt: Date;
}

export interface MortgageComparison {
  mortgageType: MortgageType;
  loanTerm: LoanTerm;
  interestRate: number;
  apr: number;
  monthlyPayment: number;
  totalInterest: number;
  totalCost: number;
  pros: string[];
  cons: string[];
  bestFor: string;
}

// ─── Service Implementation ──────────────────────────────────────────────────

export class MortgageService {
  // ── Mortgage Calculator ──────────────────────────────────────────────

  calculateMonthlyPayment(
    loanAmount: number,
    annualInterestRate: number,
    loanTermYears: number
  ): number {
    if (loanAmount <= 0) throw new Error('Loan amount must be positive');
    if (annualInterestRate < 0) throw new Error('Interest rate cannot be negative');
    if (loanTermYears <= 0) throw new Error('Loan term must be positive');

    if (annualInterestRate === 0) {
      return loanAmount / (loanTermYears * 12);
    }

    const monthlyRate = annualInterestRate / 100 / 12;
    const numPayments = loanTermYears * 12;

    const payment =
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
      (Math.pow(1 + monthlyRate, numPayments) - 1);

    return Math.round(payment * 100) / 100;
  }

  calculateMonthlyPaymentBreakdown(input: MortgageInput): MonthlyPaymentBreakdown {
    const principalAndInterest = this.calculateMonthlyPayment(
      input.loanAmount,
      input.interestRate,
      input.loanTerm
    );

    const propertyTaxRate = input.propertyTaxRate || 1.2;
    const homeInsuranceAnnual = input.homeInsuranceAnnual || input.homePrice * 0.0035;
    const pmiRate = input.pmiRate || 0.5;
    const hoaFees = input.hoaFees || 0;

    const homePrice = input.homePrice;
    const downPaymentPercent = (input.downPayment / homePrice) * 100;

    const monthlyPropertyTax = (homePrice * (propertyTaxRate / 100)) / 12;
    const monthlyHomeInsurance = homeInsuranceAnnual / 12;
    const monthlyPMI =
      downPaymentPercent < 20
        ? (input.loanAmount * (pmiRate / 100)) / 12
        : 0;

    const totalMonthlyPayment =
      principalAndInterest +
      monthlyPropertyTax +
      monthlyHomeInsurance +
      monthlyPMI +
      hoaFees;

    return {
      principalAndInterest: Math.round(principalAndInterest * 100) / 100,
      propertyTax: Math.round(monthlyPropertyTax * 100) / 100,
      homeInsurance: Math.round(monthlyHomeInsurance * 100) / 100,
      pmi: Math.round(monthlyPMI * 100) / 100,
      hoaFees,
      totalMonthlyPayment: Math.round(totalMonthlyPayment * 100) / 100,
    };
  }

  // ── Amortization Schedule ────────────────────────────────────────────

  generateAmortizationSchedule(
    loanAmount: number,
    annualInterestRate: number,
    loanTermYears: number,
    startDate: Date = new Date()
  ): AmortizationSchedule {
    if (loanAmount <= 0) throw new Error('Loan amount must be positive');
    if (loanTermYears <= 0) throw new Error('Loan term must be positive');

    const monthlyRate = annualInterestRate / 100 / 12;
    const totalPayments = loanTermYears * 12;
    const monthlyPayment = this.calculateMonthlyPayment(
      loanAmount,
      annualInterestRate,
      loanTermYears
    );

    const entries: AmortizationEntry[] = [];
    let remainingBalance = loanAmount;
    let totalInterest = 0;
    let totalPrincipal = 0;

    for (let month = 1; month <= totalPayments; month++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      remainingBalance = Math.max(0, remainingBalance - principalPayment);

      totalInterest += interestPayment;
      totalPrincipal += principalPayment;

      const currentDate = new Date(startDate);
      currentDate.setMonth(currentDate.getMonth() + month);

      entries.push({
        month,
        year: currentDate.getFullYear(),
        payment: Math.round(monthlyPayment * 100) / 100,
        principal: Math.round(principalPayment * 100) / 100,
        interest: Math.round(interestPayment * 100) / 100,
        balance: Math.round(remainingBalance * 100) / 100,
        totalInterest: Math.round(totalInterest * 100) / 100,
        totalPrincipal: Math.round(totalPrincipal * 100) / 100,
        effectiveRate: annualInterestRate,
      });
    }

    const payoffDate = new Date(startDate);
    payoffDate.setMonth(payoffDate.getMonth() + totalPayments);

    return {
      entries,
      totalPayments,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalPrincipal: Math.round(totalPrincipal * 100) / 100,
      payoffDate,
      monthlyPayment,
    };
  }

  generateYearlyAmortization(
    loanAmount: number,
    annualInterestRate: number,
    loanTermYears: number,
    startDate: Date = new Date()
  ): Array<{
    year: number;
    totalPayment: number;
    totalPrincipal: number;
    totalInterest: number;
    endBalance: number;
  }> {
    const schedule = this.generateAmortizationSchedule(
      loanAmount,
      annualInterestRate,
      loanTermYears,
      startDate
    );

    const yearlyData: Map<number, { totalPayment: number; totalPrincipal: number; totalInterest: number; endBalance: number }> = new Map();

    for (const entry of schedule.entries) {
      const existing = yearlyData.get(entry.year) || {
        totalPayment: 0,
        totalPrincipal: 0,
        totalInterest: 0,
        endBalance: entry.balance,
      };

      existing.totalPayment += entry.payment;
      existing.totalPrincipal += entry.principal;
      existing.totalInterest += entry.interest;
      existing.endBalance = entry.balance;

      yearlyData.set(entry.year, existing);
    }

    return Array.from(yearlyData.entries()).map(([year, data]) => ({
      year,
      ...data,
    }));
  }

  calculateExtraPaymentImpact(
    loanAmount: number,
    annualInterestRate: number,
    loanTermYears: number,
    extraMonthlyPayment: number,
    startDate: Date = new Date()
  ): {
    originalSchedule: AmortizationSchedule;
    acceleratedSchedule: AmortizationSchedule;
    monthsSaved: number;
    interestSaved: number;
    newPayoffDate: Date;
  } {
    const originalSchedule = this.generateAmortizationSchedule(
      loanAmount,
      annualInterestRate,
      loanTermYears,
      startDate
    );

    const monthlyRate = annualInterestRate / 100 / 12;
    const originalMonthly = this.calculateMonthlyPayment(
      loanAmount,
      annualInterestRate,
      loanTermYears
    );
    const newMonthlyPayment = originalMonthly + extraMonthlyPayment;

    const entries: AmortizationEntry[] = [];
    let remainingBalance = loanAmount;
    let totalInterest = 0;
    let totalPrincipal = 0;
    let month = 0;

    while (remainingBalance > 0 && month < loanTermYears * 12 + 60) {
      month++;
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = Math.min(
        newMonthlyPayment - interestPayment,
        remainingBalance
      );
      remainingBalance = Math.max(0, remainingBalance - principalPayment);

      totalInterest += interestPayment;
      totalPrincipal += principalPayment;

      const currentDate = new Date(startDate);
      currentDate.setMonth(currentDate.getMonth() + month);

      entries.push({
        month,
        year: currentDate.getFullYear(),
        payment: Math.round((principalPayment + interestPayment) * 100) / 100,
        principal: Math.round(principalPayment * 100) / 100,
        interest: Math.round(interestPayment * 100) / 100,
        balance: Math.round(remainingBalance * 100) / 100,
        totalInterest: Math.round(totalInterest * 100) / 100,
        totalPrincipal: Math.round(totalPrincipal * 100) / 100,
        effectiveRate: annualInterestRate,
      });
    }

    const payoffDate = new Date(startDate);
    payoffDate.setMonth(payoffDate.getMonth() + month);

    const acceleratedSchedule: AmortizationSchedule = {
      entries,
      totalPayments: month,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalPrincipal: Math.round(totalPrincipal * 100) / 100,
      payoffDate,
      monthlyPayment: newMonthlyPayment,
    };

    const monthsSaved = originalSchedule.totalPayments - month;
    const interestSaved = originalSchedule.totalInterest - totalInterest;

    return {
      originalSchedule,
      acceleratedSchedule,
      monthsSaved: Math.max(0, monthsSaved),
      interestSaved: Math.max(0, Math.round(interestSaved * 100) / 100),
      newPayoffDate: payoffDate,
    };
  }

  // ── Affordability Calculator ─────────────────────────────────────────

  calculateAffordability(input: AffordabilityInput): AffordabilityResult {
    const monthlyIncome =
      (input.annualIncome + (input.coBorrowerIncome || 0)) / 12;
    const totalMonthlyDebts = input.monthlyDebts + (input.monthlyExpenses || 0);

    const maxDTI = this.getMaxDTI(input.creditScore);
    const maxHousingPayment = monthlyIncome * (maxDTI / 100);
    const maxTotalPayment = monthlyIncome * (maxDTI / 100);
    const availableForHousing = maxTotalPayment - totalMonthlyDebts;

    const monthlyRate = input.interestRate / 100 / 12;
    const numPayments = input.loanTerm * 12;

    const maxLoanAmount =
      monthlyRate > 0
        ? (availableForHousing * (Math.pow(1 + monthlyRate, numPayments) - 1)) /
          (monthlyRate * Math.pow(1 + monthlyRate, numPayments))
        : availableForHousing * numPayments;

    const downPaymentMultiplier = 1 / (1 - input.downPayment / 100);
    const maxHomePrice = maxLoanAmount * downPaymentMultiplier;

    const recommendedMultiplier = 0.85;
    const recommendedHomePrice = maxHomePrice * recommendedMultiplier;
    const recommendedLoanAmount = recommendedHomePrice * (1 - input.downPayment / 100);

    const frontEndRatio = (availableForHousing / monthlyIncome) * 100;
    const backEndRatio =
      ((availableForHousing + totalMonthlyDebts) / monthlyIncome) * 100;

    const qualificationFactors = this.assessQualificationFactors(input, {
      maxDTI,
      frontEndRatio,
      backEndRatio,
      recommendedHomePrice,
    });

    const warnings = this.generateWarnings(input, {
      frontEndRatio,
      backEndRatio,
      maxDTI,
    });

    return {
      maxHomePrice: Math.round(maxHomePrice),
      maxLoanAmount: Math.round(maxLoanAmount),
      maxMonthlyPayment: Math.round(availableForHousing),
      recommendedHomePrice: Math.round(recommendedHomePrice),
      recommendedLoanAmount: Math.round(recommendedLoanAmount),
      recommendedMonthlyPayment: Math.round(
        this.calculateMonthlyPayment(recommendedLoanAmount, input.interestRate, input.loanTerm)
      ),
      debtToIncomeRatio: backEndRatio,
      frontEndRatio,
      backEndRatio,
      qualificationFactors,
      warnings,
    };
  }

  private getMaxDTI(creditScore?: number): number {
    if (!creditScore) return 43;
    if (creditScore >= 760) return 50;
    if (creditScore >= 700) return 45;
    if (creditScore >= 660) return 43;
    if (creditScore >= 620) return 41;
    return 36;
  }

  private assessQualificationFactors(
    input: AffordabilityInput,
    metrics: { maxDTI: number; frontEndRatio: number; backEndRatio: number; recommendedHomePrice: number }
  ): QualificationFactor[] {
    const factors: QualificationFactor[] = [];

    if (input.creditScore) {
      let status: QualificationFactor['status'];
      if (input.creditScore >= 760) status = 'STRONG';
      else if (input.creditScore >= 700) status = 'MODERATE';
      else if (input.creditScore >= 660) status = 'WEAK';
      else status = 'FAILING';

      factors.push({
        factor: 'Credit Score',
        status,
        impact: input.creditScore >= 700 ? 15 : input.creditScore >= 660 ? 10 : 5,
        description: `Credit score of ${input.creditScore} is ${status.toLowerCase()}`,
      });
    }

    const dtiStatus =
      metrics.backEndRatio <= 36
        ? 'STRONG'
        : metrics.backEndRatio <= 43
        ? 'MODERATE'
        : metrics.backEndRatio <= 50
        ? 'WEAK'
        : 'FAILING';

    factors.push({
      factor: 'Debt-to-Income Ratio',
      status: dtiStatus,
      impact: metrics.backEndRatio <= 36 ? 20 : metrics.backEndRatio <= 43 ? 15 : 10,
      description: `DTI ratio of ${metrics.backEndRatio.toFixed(1)}% is ${dtiStatus.toLowerCase()}`,
    });

    const downPaymentPercent = input.downPayment;
    const dpStatus =
      downPaymentPercent >= 20
        ? 'STRONG'
        : downPaymentPercent >= 10
        ? 'MODERATE'
        : downPaymentPercent >= 5
        ? 'WEAK'
        : 'FAILING';

    factors.push({
      factor: 'Down Payment',
      status: dpStatus,
      impact: downPaymentPercent >= 20 ? 15 : downPaymentPercent >= 10 ? 10 : 5,
      description: `${downPaymentPercent}% down payment is ${dpStatus.toLowerCase()}`,
    });

    if (input.employmentType) {
      const empStatus =
        input.employmentType === 'W2'
          ? 'STRONG'
          : input.employmentType === 'SELF_EMPLOYED'
          ? 'MODERATE'
          : 'WEAK';

      factors.push({
        factor: 'Employment Type',
        status: empStatus,
        impact: input.employmentType === 'W2' ? 15 : 10,
        description: `${input.employmentType} employment is considered ${empStatus.toLowerCase()}`,
      });
    }

    return factors;
  }

  private generateWarnings(
    input: AffordabilityInput,
    metrics: { frontEndRatio: number; backEndRatio: number; maxDTI: number }
  ): string[] {
    const warnings: string[] = [];

    if (metrics.backEndRatio > metrics.maxDTI) {
      warnings.push(
        `Debt-to-income ratio of ${metrics.backEndRatio.toFixed(1)}% exceeds maximum of ${metrics.maxDTI}%`
      );
    }

    if (input.creditScore && input.creditScore < 620) {
      warnings.push('Credit score below 620 may result in significantly higher interest rates');
    }

    if (input.downPayment < 5) {
      warnings.push('Less than 5% down payment may require PMI and higher interest rates');
    }

    if (input.monthlyDebts > (input.annualIncome / 12) * 0.3) {
      warnings.push('Existing debt payments are consuming more than 30% of gross monthly income');
    }

    if (input.employmentType === 'SELF_EMPLOYED' && input.employmentYears < 2) {
      warnings.push('Self-employment for less than 2 years may complicate qualification');
    }

    if (input.bankruptcyHistory) {
      const dischargeDate = input.bankruptcyDischargeDate;
      if (dischargeDate) {
        const yearsSinceDischarge =
          (Date.now() - dischargeDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        if (yearsSinceDischarge < 4) {
          warnings.push(
            `Bankruptcy discharged ${yearsSinceDischarge.toFixed(1)} years ago. Most lenders require 4+ years`
          );
        }
      }
    }

    return warnings;
  }

  // ── Rate Comparison ──────────────────────────────────────────────────

  compareMortgageRates(input: RateComparisonInput): MortgageComparison[] {
    const baseRate = 6.5;
    const comparisons: MortgageComparison[] = [];

    // Conventional Fixed 30
    const conv30Rate = baseRate + (input.creditScore && input.creditScore < 700 ? 0.5 : 0);
    const conv30Payment = this.calculateMonthlyPayment(
      input.loanAmount,
      conv30Rate,
      30
    );
    comparisons.push({
      mortgageType: MortgageType.CONVENTIONAL,
      loanTerm: LoanTerm.THIRTY_YEARS,
      interestRate: conv30Rate,
      apr: conv30Rate + 0.1,
      monthlyPayment: conv30Payment,
      totalInterest: conv30Payment * 360 - input.loanAmount,
      totalCost: conv30Payment * 360,
      pros: [
        'Lower monthly payments',
        'More affordable short-term',
        'Widely available',
      ],
      cons: [
        'Higher total interest over life of loan',
        'Takes longer to build equity',
      ],
      bestFor: 'Buyers who want lower monthly payments',
    });

    // Conventional Fixed 15
    const conv15Rate = baseRate - 0.5;
    const conv15Payment = this.calculateMonthlyPayment(
      input.loanAmount,
      conv15Rate,
      15
    );
    comparisons.push({
      mortgageType: MortgageType.CONVENTIONAL,
      loanTerm: LoanTerm.FIFTEEN_YEARS,
      interestRate: conv15Rate,
      apr: conv15Rate + 0.1,
      monthlyPayment: conv15Payment,
      totalInterest: conv15Payment * 180 - input.loanAmount,
      totalCost: conv15Payment * 180,
      pros: [
        'Lower interest rate',
        'Build equity faster',
        'Significantly less total interest',
      ],
      cons: [
        'Higher monthly payments',
        'Less monthly cash flow',
      ],
      bestFor: 'Buyers who can afford higher payments and want to save on interest',
    });

    // FHA
    const fhaRate = baseRate - 0.125;
    const fhaPayment = this.calculateMonthlyPayment(input.loanAmount, fhaRate, 30);
    comparisons.push({
      mortgageType: MortgageType.FHA,
      loanTerm: LoanTerm.THIRTY_YEARS,
      interestRate: fhaRate,
      apr: fhaRate + 0.8,
      monthlyPayment: fhaPayment,
      totalInterest: fhaPayment * 360 - input.loanAmount,
      totalCost: fhaPayment * 360,
      pros: [
        'Lower down payment (3.5%)',
        'More lenient credit requirements',
        'Assumable loan',
      ],
      cons: [
        'Mortgage insurance required for life of loan',
        'Higher APR due to MIP',
        'Loan limits apply',
      ],
      bestFor: 'First-time buyers or those with lower credit scores',
    });

    // ARM 5/1
    const armRate = baseRate - 0.75;
    const armPayment = this.calculateMonthlyPayment(input.loanAmount, armRate, 30);
    comparisons.push({
      mortgageType: MortgageType.ARM,
      loanTerm: LoanTerm.THIRTY_YEARS,
      interestRate: armRate,
      apr: armRate + 0.3,
      monthlyPayment: armPayment,
      totalInterest: armPayment * 60 - input.loanAmount + armPayment * 300 * 1.25,
      totalCost: armPayment * 60 + armPayment * 300 * 1.25,
      pros: [
        'Lower initial interest rate',
        'Lower initial monthly payment',
        'Good if you plan to sell or refinance within 5 years',
      ],
      cons: [
        'Rate can increase after introductory period',
        'Payment uncertainty',
        'Risk of payment shock',
      ],
      bestFor: 'Buyers who plan to move or refinance within 5 years',
    });

    // VA
    if (input.isPrimaryResidence) {
      const vaRate = baseRate - 0.5;
      const vaPayment = this.calculateMonthlyPayment(input.loanAmount, vaRate, 30);
      comparisons.push({
        mortgageType: MortgageType.VA,
        loanTerm: LoanTerm.THIRTY_YEARS,
        interestRate: vaRate,
        apr: vaRate + 0.15,
        monthlyPayment: vaPayment,
        totalInterest: vaPayment * 360 - input.loanAmount,
        totalCost: vaPayment * 360,
        pros: [
          'No down payment required',
          'No PMI',
          'Competitive interest rates',
          'Limited closing costs',
        ],
        cons: [
          'VA funding fee required',
          'Only for eligible veterans',
          'Primary residence only',
        ],
        bestFor: 'Eligible veterans and active-duty military',
      });
    }

    // Jumbo
    if (input.loanAmount > 726200) {
      const jumboRate = baseRate + 0.25;
      const jumboPayment = this.calculateMonthlyPayment(
        input.loanAmount,
        jumboRate,
        30
      );
      comparisons.push({
        mortgageType: MortgageType.JUMBO,
        loanTerm: LoanTerm.THIRTY_YEARS,
        interestRate: jumboRate,
        apr: jumboRate + 0.15,
        monthlyPayment: jumboPayment,
        totalInterest: jumboPayment * 360 - input.loanAmount,
        totalCost: jumboPayment * 360,
        pros: [
          'Finance high-value properties',
          'Competitive rates for qualified borrowers',
        ],
        cons: [
          'Stricter qualification requirements',
          'Higher down payment often required',
          'Higher credit score needed',
        ],
        bestFor: 'Buyers purchasing high-value properties',
      });
    }

    return comparisons.sort((a, b) => a.monthlyPayment - b.monthlyPayment);
  }

  // ── Pre-Qualification ────────────────────────────────────────────────

  preQualify(input: PreQualificationInput): PreQualificationResult {
    const id = `pq_${Date.now()}`;
    const now = new Date();
    const validUntil = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const estimatedRate = this.estimateRate(input);
    const estimatedMonthlyPayment = this.calculateMonthlyPayment(
      input.desiredLoanAmount,
      estimatedRate,
      30
    );

    const monthlyIncome =
      (input.annualIncome + (input.coborrowerIncome || 0)) / 12;
    const estimatedDTI =
      ((input.monthlyDebts + estimatedMonthlyPayment) / monthlyIncome) * 100;

    const qualificationScore = this.calculateQualificationScore(input, estimatedDTI);

    const maxLoanAmount = this.calculateMaxLoanAmount(input, monthlyIncome);

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    if (input.creditScoreRange === 'EXCELLENT') {
      strengths.push('Excellent credit score qualifies for best rates');
    } else if (input.creditScoreRange === 'GOOD') {
      strengths.push('Good credit score qualifies for competitive rates');
    } else if (input.creditScoreRange === 'FAIR') {
      weaknesses.push('Fair credit may result in higher interest rates');
      recommendations.push('Consider improving credit score before applying');
    } else {
      weaknesses.push('Poor credit significantly limits loan options');
      recommendations.push('Focus on improving credit score before home shopping');
    }

    if (input.firstTimeHomeBuyer) {
      strengths.push('First-time home buyer programs may be available');
    }

    if (input.employmentYears >= 2) {
      strengths.push('Stable employment history');
    } else {
      weaknesses.push('Limited employment history may affect qualification');
    }

    if (estimatedDTI > 43) {
      weaknesses.push(`DTI ratio of ${estimatedDTI.toFixed(1)}% is above recommended 43%`);
      recommendations.push('Pay down existing debts to improve DTI ratio');
    }

    if (input.downPaymentAmount >= input.desiredLoanAmount * 0.2) {
      strengths.push('20%+ down payment eliminates PMI requirement');
    } else if (input.downPaymentAmount >= input.desiredLoanAmount * 0.1) {
      strengths.push('10%+ down payment provides good equity position');
    } else {
      weaknesses.push('Less than 10% down payment may require PMI');
      recommendations.push('Consider saving for a larger down payment');
    }

    let status: PreQualificationStatus;
    if (qualificationScore >= 80) {
      status = PreQualificationStatus.PRE_APPROVED;
    } else if (qualificationScore >= 60) {
      status = PreQualificationStatus.CONDITIONALLY_APPROVED;
    } else if (qualificationScore >= 40) {
      status = PreQualificationStatus.IN_PROGRESS;
    } else {
      status = PreQualificationStatus.DENIED;
    }

    return {
      id,
      status,
      maxLoanAmount: Math.round(maxLoanAmount),
      estimatedRate,
      estimatedMonthlyPayment: Math.round(estimatedMonthlyPayment),
      estimatedDTI: Math.round(estimatedDTI * 10) / 10,
      qualificationScore,
      strengths,
      weaknesses,
      recommendations,
      validUntil,
      createdAt: now,
    };
  }

  private estimateRate(input: PreQualificationInput): number {
    let baseRate = 6.5;

    switch (input.creditScoreRange) {
      case 'EXCELLENT': baseRate -= 0.5; break;
      case 'GOOD': baseRate -= 0.25; break;
      case 'FAIR': baseRate += 0.25; break;
      case 'POOR': baseRate += 1.0; break;
    }

    if (input.isVeteran) baseRate -= 0.5;
    if (input.firstTimeHomeBuyer) baseRate -= 0.125;

    const downPaymentPercent = (input.downPaymentAmount / input.desiredLoanAmount) * 100;
    if (downPaymentPercent >= 20) baseRate -= 0.125;
    else if (downPaymentPercent < 5) baseRate += 0.25;

    return Math.round(baseRate * 1000) / 1000;
  }

  private calculateQualificationScore(
    input: PreQualificationInput,
    estimatedDTI: number
  ): number {
    let score = 0;

    switch (input.creditScoreRange) {
      case 'EXCELLENT': score += 30; break;
      case 'GOOD': score += 25; break;
      case 'FAIR': score += 15; break;
      case 'POOR': score += 5; break;
    }

    if (estimatedDTI <= 36) score += 25;
    else if (estimatedDTI <= 43) score += 20;
    else if (estimatedDTI <= 50) score += 10;
    else score += 0;

    if (input.employmentYears >= 5) score += 20;
    else if (input.employmentYears >= 2) score += 15;
    else if (input.employmentYears >= 1) score += 10;
    else score += 5;

    const downPaymentPercent = (input.downPaymentAmount / input.desiredLoanAmount) * 100;
    if (downPaymentPercent >= 20) score += 15;
    else if (downPaymentPercent >= 10) score += 10;
    else if (downPaymentPercent >= 5) score += 5;

    if (input.hasCoborrower) score += 5;

    if (input.bankruptcyHistory) {
      if (input.bankruptcyDischargeDate) {
        const yearsSince =
          (Date.now() - input.bankruptcyDischargeDate.getTime()) /
          (365.25 * 24 * 60 * 60 * 1000);
        if (yearsSince >= 4) score += 0;
        else if (yearsSince >= 2) score -= 10;
        else score -= 20;
      } else {
        score -= 15;
      }
    }

    return Math.min(100, Math.max(0, score));
  }

  private calculateMaxLoanAmount(
    input: PreQualificationInput,
    monthlyIncome: number
  ): number {
    const maxDTI = 43;
    const availableForHousing = monthlyIncome * (maxDTI / 100) - input.monthlyDebts;

    const estimatedRate = this.estimateRate(input);
    const monthlyRate = estimatedRate / 100 / 12;
    const numPayments = 30 * 12;

    if (monthlyRate > 0) {
      return (
        (availableForHousing * (Math.pow(1 + monthlyRate, numPayments) - 1)) /
        (monthlyRate * Math.pow(1 + monthlyRate, numPayments))
      );
    }

    return availableForHousing * numPayments;
  }

  // ── Utility Methods ──────────────────────────────────────────────────

  calculatePMI(
    loanAmount: number,
    homePrice: number,
    pmiRate: number = 0.5
  ): number {
    const ltv = (loanAmount / homePrice) * 100;
    if (ltv <= 80) return 0;

    const adjustedRate = pmiRate + (ltv - 80) * 0.01;
    return (loanAmount * (adjustedRate / 100)) / 12;
  }

  calculateClosingCostEstimate(loanAmount: number, homePrice: number): {
    lenderFees: number;
    titleInsurance: number;
    escrowFees: number;
    transferTaxes: number;
    recordingFees: number;
    otherCosts: number;
    total: number;
    asPercent: number;
  } {
    const lenderFees = loanAmount * 0.01;
    const titleInsurance = homePrice * 0.005;
    const escrowFees = homePrice * 0.01;
    const transferTaxes = homePrice * 0.01;
    const recordingFees = 150;
    const otherCosts = homePrice * 0.005;
    const total = lenderFees + titleInsurance + escrowFees + transferTaxes + recordingFees + otherCosts;

    return {
      lenderFees: Math.round(lenderFees),
      titleInsurance: Math.round(titleInsurance),
      escrowFees: Math.round(escrowFees),
      transferTaxes: Math.round(transferTaxes),
      recordingFees,
      otherCosts: Math.round(otherCosts),
      total: Math.round(total),
      asPercent: Math.round((total / homePrice) * 10000) / 100,
    };
  }

  calculateRefinanceSavings(
    currentLoanBalance: number,
    currentRate: number,
    currentMonthlyPayment: number,
    newRate: number,
    newTermYears: number,
    closingCosts: number
  ): {
    newMonthlyPayment: number;
    monthlySavings: number;
    breakEvenMonths: number;
    totalSavings: number;
    isWorthIt: boolean;
  } {
    const newPayment = this.calculateMonthlyPayment(
      currentLoanBalance,
      newRate,
      newTermYears
    );

    const monthlySavings = currentMonthlyPayment - newPayment;
    const breakEvenMonths =
      monthlySavings > 0 ? Math.ceil(closingCosts / monthlySavings) : Infinity;

    const totalSavings =
      monthlySavings * newTermYears * 12 - closingCosts;

    return {
      newMonthlyPayment: Math.round(newPayment * 100) / 100,
      monthlySavings: Math.round(monthlySavings * 100) / 100,
      breakEvenMonths,
      totalSavings: Math.round(totalSavings * 100) / 100,
      isWorthIt: totalSavings > 0 && breakEvenMonths < newTermYears * 12 * 0.5,
    };
  }
}

// ── Export singleton ──────────────────────────────────────────────────────

export const mortgageService = new MortgageService();
