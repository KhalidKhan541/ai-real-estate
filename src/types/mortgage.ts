export interface MortgageInput {
  homePrice: number;
  downPayment: number;
  downPaymentPercent?: number;
  loanTerm: number;
  interestRate: number;
  startDate?: string;
  propertyTax?: number;
  homeInsurance?: number;
  hoaFees?: number;
  pmi?: number;
}

export interface MortgageResult {
  monthlyPayment: number;
  principalAndInterest: number;
  monthlyPropertyTax: number;
  monthlyInsurance: number;
  monthlyHOA: number;
  monthlyPMI: number;
  totalMonthlyPayment: number;
  totalLoanAmount: number;
  totalInterest: number;
  totalCost: number;
  payoffDate: string;
}

export interface AmortizationEntry {
  month: number;
  year: number;
  payment: number;
  principal: number;
  interest: number;
  totalInterest: number;
  totalPrincipal: number;
  balance: number;
}

export interface AmortizationSchedule {
  entries: AmortizationEntry[];
  yearlySummary: YearlyAmortizationEntry[];
}

export interface YearlyAmortizationEntry {
  year: number;
  totalPayment: number;
  totalPrincipal: number;
  totalInterest: number;
  endBalance: number;
}

export interface MortgageComparison {
  scenarios: MortgageScenario[];
  recommendation: string;
}

export interface MortgageScenario {
  name: string;
  input: MortgageInput;
  result: MortgageResult;
  savings?: number;
}

export interface RefinanceAnalysis {
  currentLoan: {
    balance: number;
    rate: number;
    monthlyPayment: number;
    remainingMonths: number;
  };
  newLoan: {
    rate: number;
    term: number;
    monthlyPayment: number;
    closingCosts: number;
  };
  breakEvenMonths: number;
  totalSavings: number;
  monthlySavings: number;
  recommendation: "refinance" | "keep";
}

export interface AffordabilityResult {
  maxHomePrice: number;
  maxLoanAmount: number;
  monthlyPayment: number;
  breakdown: {
    principalAndInterest: number;
    propertyTax: number;
    insurance: number;
    total: number;
  };
}

export interface MortgageRate {
  term: number;
  rate: number;
  apr: number;
  points?: number;
}

export interface MortgageRateTrend {
  date: string;
  rate: number;
  change: number;
}

export interface ClosingCostEstimate {
  lenderFees: CostItem[];
  titleFees: CostItem[];
  governmentFees: CostItem[];
  prepaidItems: CostItem[];
  otherCosts: CostItem[];
  total: number;
}

export interface CostItem {
  name: string;
  amount: number;
  description?: string;
}

export interface MortgageDocument {
  id: string;
  type: "pre-approval" | "pre-qualification" | "commitment" | "disclosure";
  lender: string;
  amount?: number;
  rate?: number;
  expiryDate: string;
  url: string;
  createdAt: string;
}

export interface LoanApplication {
  id: string;
  userId: string;
  propertyId?: string;
  status: "draft" | "submitted" | "processing" | "approved" | "denied";
  loanType: "conventional" | "fha" | "va" | "usda" | "jumbo";
  loanAmount: number;
  downPayment: number;
  interestRate?: number;
  term: number;
  monthlyIncome: number;
  monthlyDebts: number;
  employmentType: string;
  employer: string;
  yearsEmployed: number;
  creditScore?: number;
  documents: string[];
  createdAt: string;
  updatedAt: string;
}

export default MortgageInput;
