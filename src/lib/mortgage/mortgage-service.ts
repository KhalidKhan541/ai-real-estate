export interface MortgageCalculationRequest {
  homePrice: number;
  downPayment: number;
  downPaymentPercent?: number;
  loanTerm: number;
  interestRate: number;
  loanType: "conventional" | "fha" | "va" | "usda";
  propertyTax?: number;
  homeInsurance?: number;
  hoa?: number;
  pmi?: boolean;
  zipCode?: string;
}

export interface MortgageResult {
  monthlyPayment: number;
  principalAndInterest: number;
  monthlyTax: number;
  monthlyInsurance: number;
  monthlyHOA: number;
  monthlyPMI: number;
  totalMonthly: number;
  totalInterest: number;
  totalCost: number;
  loanAmount: number;
  amortizationSchedule: Array<{
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
    totalInterestPaid: number;
  }>;
  paymentBreakdown: {
    principal: number;
    interest: number;
    tax: number;
    insurance: number;
    pmi: number;
    hoa: number;
  };
  affordabilityCheck: {
    monthlyIncomeRequired: number;
    debtToIncomeRatio: number;
    isAffordable: boolean;
  };
}

export interface PreApprovalInput {
  annualIncome: number;
  monthlyDebts: number;
  creditScore: number;
  employmentType: "employed" | "self-employed" | "retired";
  yearsAtJob: number;
  downPayment: number;
  loanTerm: number;
  interestRate: number;
  loanType: MortgageCalculationRequest["loanType"];
}

export interface PreApprovalResult {
  maxLoanAmount: number;
  maxHomePrice: number;
  estimatedMonthlyPayment: number;
  debtToIncomeRatio: number;
  isApproved: boolean;
  approvalLevel: "full" | "conditional" | "denied";
  factors: Array<{
    factor: string;
    impact: "positive" | "negative" | "neutral";
    details: string;
  }>;
  generatedAt: string;
  expiresAt: string;
}

export interface RefinanceCalculationRequest {
  currentLoanBalance: number;
  currentInterestRate: number;
  currentMonthlyPayment: number;
  remainingMonths: number;
  newInterestRate: number;
  newLoanTerm: number;
  closingCosts?: number;
  cashOut?: number;
}

export interface RefinanceResult {
  currentLoan: {
    monthlyPayment: number;
    totalInterestPaid: number;
    totalRemaining: number;
  };
  newLoan: {
    monthlyPayment: number;
    totalInterest: number;
    totalCost: number;
  };
  savings: {
    monthlySavings: number;
    totalSavings: number;
    breakEvenMonths: number;
  };
  recommendation: "refinance" | "keep_current" | "consider";
  reasons: string[];
}

const preApprovals: Map<string, PreApprovalResult> = new Map();

export class MortgageService {
  async calculate(request: MortgageCalculationRequest): Promise<MortgageResult> {
    const loanAmount = request.homePrice - request.downPayment;
    const monthlyRate = request.interestRate / 100 / 12;
    const totalPayments = request.loanTerm * 12;

    const principalAndInterest =
      monthlyRate > 0
        ? loanAmount *
          (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
          (Math.pow(1 + monthlyRate, totalPayments) - 1)
        : loanAmount / totalPayments;

    const monthlyTax = (request.propertyTax || request.homePrice * 0.012) / 12;
    const monthlyInsurance = (request.homeInsurance || request.homePrice * 0.003) / 12;
    const monthlyHOA = request.hoa || 0;

    const downPaymentPercent = (request.downPayment / request.homePrice) * 100;
    const monthlyPMI =
      request.loanType === "conventional" && downPaymentPercent < 20
        ? loanAmount * 0.005 / 12
        : 0;

    const totalMonthly =
      principalAndInterest + monthlyTax + monthlyInsurance + monthlyHOA + monthlyPMI;

    let balance = loanAmount;
    let totalInterest = 0;
    const amortizationSchedule: MortgageResult["amortizationSchedule"] = [];

    for (let month = 1; month <= totalPayments; month++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = principalAndInterest - interestPayment;
      balance -= principalPayment;
      totalInterest += interestPayment;

      amortizationSchedule.push({
        month,
        payment: principalAndInterest,
        principal: Math.round(principalPayment * 100) / 100,
        interest: Math.round(interestPayment * 100) / 100,
        balance: Math.max(0, Math.round(balance * 100) / 100),
        totalInterestPaid: Math.round(totalInterest * 100) / 100,
      });
    }

    const monthlyIncomeRequired = totalMonthly / 0.28;
    const debtToIncomeRatio = (totalMonthly / (monthlyIncomeRequired || 1)) * 100;

    return {
      monthlyPayment: Math.round(principalAndInterest * 100) / 100,
      principalAndInterest: Math.round(principalAndInterest * 100) / 100,
      monthlyTax: Math.round(monthlyTax * 100) / 100,
      monthlyInsurance: Math.round(monthlyInsurance * 100) / 100,
      monthlyHOA: Math.round(monthlyHOA * 100) / 100,
      monthlyPMI: Math.round(monthlyPMI * 100) / 100,
      totalMonthly: Math.round(totalMonthly * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalCost: Math.round((loanAmount + totalInterest) * 100) / 100,
      loanAmount,
      amortizationSchedule,
      paymentBreakdown: {
        principal: Math.round(principalAndInterest * 0.6 * 100) / 100,
        interest: Math.round(principalAndInterest * 0.4 * 100) / 100,
        tax: Math.round(monthlyTax * 100) / 100,
        insurance: Math.round(monthlyInsurance * 100) / 100,
        pmi: Math.round(monthlyPMI * 100) / 100,
        hoa: Math.round(monthlyHOA * 100) / 100,
      },
      affordabilityCheck: {
        monthlyIncomeRequired: Math.round(monthlyIncomeRequired * 100) / 100,
        debtToIncomeRatio: Math.round(debtToIncomeRatio * 100) / 100,
        isAffordable: debtToIncomeRatio <= 28,
      },
    };
  }

  async getPreApproval(input: PreApprovalInput): Promise<PreApprovalResult> {
    const monthlyIncome = input.annualIncome / 12;
    const maxDTI = 0.43;
    const maxPayment = (monthlyIncome - input.monthlyDebts) * maxDTI;

    const monthlyRate = input.interestRate / 100 / 12;
    const totalPayments = input.loanTerm * 12;
    const maxLoanAmount =
      monthlyRate > 0
        ? (maxPayment * (Math.pow(1 + monthlyRate, totalPayments) - 1)) /
          (monthlyRate * Math.pow(1 + monthlyRate, totalPayments))
        : maxPayment * totalPayments;

    const maxHomePrice = maxLoanAmount + input.downPayment;
    const estimatedMonthly = this.calculateMonthlyPayment(maxLoanAmount, input.interestRate, input.loanTerm);

    const factors: PreApprovalResult["factors"] = [];

    if (input.creditScore >= 740) {
      factors.push({ factor: "Credit Score", impact: "positive", details: "Excellent credit score" });
    } else if (input.creditScore >= 670) {
      factors.push({ factor: "Credit Score", impact: "neutral", details: "Good credit score" });
    } else {
      factors.push({ factor: "Credit Score", impact: "negative", details: "Below average credit score" });
    }

    if (input.yearsAtJob >= 2) {
      factors.push({ factor: "Employment Stability", impact: "positive", details: "Stable employment history" });
    } else {
      factors.push({ factor: "Employment Stability", impact: "negative", details: "Limited employment history" });
    }

    const currentDTI = (input.monthlyDebts / monthlyIncome) * 100;
    if (currentDTI < 36) {
      factors.push({ factor: "Debt-to-Income Ratio", impact: "positive", details: "Low DTI ratio" });
    } else if (currentDTI < 43) {
      factors.push({ factor: "Debt-to-Income Ratio", impact: "neutral", details: "Moderate DTI ratio" });
    } else {
      factors.push({ factor: "Debt-to-Income Ratio", impact: "negative", details: "High DTI ratio" });
    }

    if (input.downPayment >= maxHomePrice * 0.2) {
      factors.push({ factor: "Down Payment", impact: "positive", details: "20% or more down payment" });
    } else if (input.downPayment >= maxHomePrice * 0.1) {
      factors.push({ factor: "Down Payment", impact: "neutral", details: "10-20% down payment" });
    } else {
      factors.push({ factor: "Down Payment", impact: "negative", details: "Less than 10% down payment" });
    }

    const positiveFactors = factors.filter((f) => f.impact === "positive").length;
    const negativeFactors = factors.filter((f) => f.impact === "negative").length;

    let approvalLevel: PreApprovalResult["approvalLevel"];
    if (positiveFactors >= 2 && negativeFactors === 0) {
      approvalLevel = "full";
    } else if (negativeFactors <= 1) {
      approvalLevel = "conditional";
    } else {
      approvalLevel = "denied";
    }

    const result: PreApprovalResult = {
      maxLoanAmount: Math.round(maxLoanAmount),
      maxHomePrice: Math.round(maxHomePrice),
      estimatedMonthlyPayment: Math.round(estimatedMonthly),
      debtToIncomeRatio: Math.round(currentDTI * 100) / 100,
      isApproved: approvalLevel !== "denied",
      approvalLevel,
      factors,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    };

    preApprovals.set(`pre_${Date.now()}`, result);
    return result;
  }

  async calculateRefinance(request: RefinanceCalculationRequest): Promise<RefinanceResult> {
    const currentMonthly = request.currentMonthlyPayment;
    const currentTotalRemaining = currentMonthly * request.remainingMonths;
    const currentTotalInterest = currentTotalRemaining - request.currentLoanBalance;

    const newLoanAmount = request.currentLoanBalance + (request.cashOut || 0);
    const newMonthly = this.calculateMonthlyPayment(
      newLoanAmount,
      request.newInterestRate,
      request.newLoanTerm
    );
    const newTotalInterest = newMonthly * request.newLoanTerm * 12 - newLoanAmount;
    const closingCosts = request.closingCosts || newLoanAmount * 0.02;

    const monthlySavings = currentMonthly - newMonthly;
    const totalSavings = currentTotalInterest - newTotalInterest - closingCosts;
    const breakEvenMonths = monthlySavings > 0 ? Math.ceil(closingCosts / monthlySavings) : Infinity;

    const reasons: string[] = [];
    if (monthlySavings > 0) reasons.push(`Save $${Math.round(monthlySavings).toLocaleString()}/month`);
    if (totalSavings > 0) reasons.push(`Save $${Math.round(totalSavings).toLocaleString()} total`);
    if (request.newInterestRate < request.currentInterestRate)
      reasons.push(`Lower interest rate: ${request.currentInterestRate}% → ${request.newInterestRate}%`);
    if (request.cashOut) reasons.push(`Access $${request.cashOut.toLocaleString()} in equity`);

    let recommendation: RefinanceResult["recommendation"];
    if (totalSavings > 0 && breakEvenMonths < 36) {
      recommendation = "refinance";
    } else if (totalSavings > 0) {
      recommendation = "consider";
    } else {
      recommendation = "keep_current";
    }

    return {
      currentLoan: {
        monthlyPayment: Math.round(currentMonthly),
        totalInterestPaid: Math.round(currentTotalInterest),
        totalRemaining: Math.round(currentTotalRemaining),
      },
      newLoan: {
        monthlyPayment: Math.round(newMonthly),
        totalInterest: Math.round(newTotalInterest),
        totalCost: Math.round(newLoanAmount + newTotalInterest),
      },
      savings: {
        monthlySavings: Math.round(monthlySavings),
        totalSavings: Math.round(totalSavings),
        breakEvenMonths: breakEvenMonths === Infinity ? -1 : breakEvenMonths,
      },
      recommendation,
      reasons,
    };
  }

  async compareLoanOptions(
    homePrice: number,
    downPayment: number,
    options: Array<{ term: number; rate: number; type: string }>
  ): Promise<Array<{
    type: string;
    term: number;
    monthlyPayment: number;
    totalInterest: number;
    totalCost: number;
    recommendation?: string;
  }>> {
    const results = [];
    for (const option of options) {
      const loanAmount = homePrice - downPayment;
      const monthly = this.calculateMonthlyPayment(loanAmount, option.rate, option.term);
      const totalInterest = monthly * option.term * 12 - loanAmount;

      results.push({
        type: option.type,
        term: option.term,
        monthlyPayment: Math.round(monthly),
        totalInterest: Math.round(totalInterest),
        totalCost: Math.round(loanAmount + totalInterest),
      });
    }

    const lowestPayment = Math.min(...results.map((r) => r.monthlyPayment));
    const lowestTotal = Math.min(...results.map((r) => r.totalCost));

    return results.map((r) => ({
      ...r,
      recommendation:
        r.monthlyPayment === lowestPayment
          ? "lowest_monthly"
          : r.totalCost === lowestTotal
          ? "lowest_total"
          : undefined,
    }));
  }

  private calculateMonthlyPayment(
    principal: number,
    annualRate: number,
    years: number
  ): number {
    const monthlyRate = annualRate / 100 / 12;
    const totalPayments = years * 12;
    if (monthlyRate === 0) return principal / totalPayments;
    return (
      (principal * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
      (Math.pow(1 + monthlyRate, totalPayments) - 1)
    );
  }

  async getAmortizationSummary(
    loanAmount: number,
    interestRate: number,
    termYears: number
  ): Promise<{
    monthlyPayment: number;
    totalInterest: number;
    totalCost: number;
    payoffDate: string;
    yearlySchedule: Array<{
      year: number;
      principalPaid: number;
      interestPaid: number;
      remainingBalance: number;
    }>;
  }> {
    const monthlyPayment = this.calculateMonthlyPayment(loanAmount, interestRate, termYears);
    const monthlyRate = interestRate / 100 / 12;
    let balance = loanAmount;
    let totalInterest = 0;
    const yearlySchedule = [];

    for (let year = 1; year <= termYears; year++) {
      let yearPrincipal = 0;
      let yearInterest = 0;

      for (let month = 0; month < 12; month++) {
        const interest = balance * monthlyRate;
        const principal = monthlyPayment - interest;
        balance -= principal;
        yearPrincipal += principal;
        yearInterest += interest;
        totalInterest += interest;
      }

      yearlySchedule.push({
        year,
        principalPaid: Math.round(yearPrincipal),
        interestPaid: Math.round(yearInterest),
        remainingBalance: Math.max(0, Math.round(balance)),
      });
    }

    const payoffDate = new Date();
    payoffDate.setFullYear(payoffDate.getFullYear() + termYears);

    return {
      monthlyPayment: Math.round(monthlyPayment),
      totalInterest: Math.round(totalInterest),
      totalCost: Math.round(loanAmount + totalInterest),
      payoffDate: payoffDate.toISOString().slice(0, 10),
      yearlySchedule,
    };
  }

  clear(): void {
    preApprovals.clear();
  }
}

export const mortgageService = new MortgageService();
