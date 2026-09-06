import { formatCurrency, formatNumber, formatSquareFeet } from "./utils";

export interface MortgageParams {
  principal: number;
  annualRate: number;
  years: number;
  downPayment?: number;
}

export interface MortgageResult {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  principalAndInterest: number;
  monthlyRate: number;
  amortizationSchedule: AmortizationEntry[];
}

export interface AmortizationEntry {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface PropertyValuationParams {
  squareFeet: number;
  bedrooms: number;
  bathrooms: number;
  yearBuilt: number;
  lotSize?: number;
  location: string;
  condition?: "excellent" | "good" | "fair" | "poor";
  features?: string[];
}

export interface PropertyValuationResult {
  estimatedValue: number;
  pricePerSqFt: number;
  confidence: number;
  comparables: number;
  factors: ValuationFactor[];
}

export interface ValuationFactor {
  name: string;
  impact: number;
  description: string;
}

export interface PriceAnalysis {
  currentPrice: number;
  estimatedValue: number;
  difference: number;
  percentageDiff: number;
  recommendation: "overpriced" | "fair" | "underpriced";
  daysOnMarket?: number;
  priceHistory?: PricePoint[];
}

export interface PricePoint {
  date: string;
  price: number;
  event?: string;
}

export interface PropertyTaxEstimate {
  annualTax: number;
  monthlyTax: number;
  effectiveRate: number;
  breakdown: TaxBreakdown[];
}

export interface TaxBreakdown {
  name: string;
  amount: number;
  rate: number;
}

export interface InvestmentAnalysis {
  purchasePrice: number;
  downPayment: number;
  monthlyRent: number;
  expenses: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  capRate: number;
  cashOnCashReturn: number;
  breakEvenMonths: number;
  fiveYearROI: number;
}

export interface AmortizationSchedule {
  entries: AmortizationEntry[];
  totalInterest: number;
  totalPrincipal: number;
  payOffDate: Date;
}

export function calculateMortgage(params: MortgageParams): MortgageResult {
  const { principal, annualRate, years, downPayment = 0 } = params;
  const loanAmount = principal - downPayment;
  const monthlyRate = annualRate / 100 / 12;
  const numberOfPayments = years * 12;

  let monthlyPayment: number;
  if (monthlyRate === 0) {
    monthlyPayment = loanAmount / numberOfPayments;
  } else {
    monthlyPayment =
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  }

  const totalPayment = monthlyPayment * numberOfPayments;
  const totalInterest = totalPayment - loanAmount;

  const amortizationSchedule = generateAmortizationSchedule(
    loanAmount,
    monthlyRate,
    monthlyPayment,
    numberOfPayments
  );

  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalPayment: Math.round(totalPayment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    principalAndInterest: Math.round(monthlyPayment * 100) / 100,
    monthlyRate,
    amortizationSchedule,
  };
}

export function generateAmortizationSchedule(
  loanAmount: number,
  monthlyRate: number,
  monthlyPayment: number,
  numberOfPayments: number
): AmortizationEntry[] {
  const schedule: AmortizationEntry[] = [];
  let balance = loanAmount;

  for (let month = 1; month <= numberOfPayments; month++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    balance -= principalPayment;

    schedule.push({
      month,
      payment: Math.round(monthlyPayment * 100) / 100,
      principal: Math.round(principalPayment * 100) / 100,
      interest: Math.round(interestPayment * 100) / 100,
      balance: Math.max(0, Math.round(balance * 100) / 100),
    });
  }

  return schedule;
}

export function calculateAffordability(
  annualIncome: number,
  monthlyDebts: number = 0,
  downPayment: number = 0,
  interestRate: number = 6.5,
  loanTermYears: number = 30,
  debtToIncomeRatio: number = 0.43
): {
  maxHomePrice: number;
  maxMonthlyPayment: number;
  maxLoanAmount: number;
  monthlyPayment: number;
} {
  const monthlyIncome = annualIncome / 12;
  const maxTotalDebt = monthlyIncome * debtToIncomeRatio;
  const maxMortgagePayment = maxTotalDebt - monthlyDebts;

  const monthlyRate = interestRate / 100 / 12;
  const numberOfPayments = loanTermYears * 12;

  let maxLoanAmount: number;
  if (monthlyRate === 0) {
    maxLoanAmount = maxMortgagePayment * numberOfPayments;
  } else {
    maxLoanAmount =
      (maxMortgagePayment * (Math.pow(1 + monthlyRate, numberOfPayments) - 1)) /
      (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments));
  }

  const maxHomePrice = maxLoanAmount + downPayment;
  const monthlyPayment = maxMortgagePayment;

  return {
    maxHomePrice: Math.round(maxHomePrice),
    maxMonthlyPayment: Math.round(maxMortgagePayment),
    maxLoanAmount: Math.round(maxLoanAmount),
    monthlyPayment: Math.round(monthlyPayment),
  };
}

export function estimatePropertyValuation(
  params: PropertyValuationParams
): PropertyValuationResult {
  const basePricePerSqFt = 200;

  let adjustedPricePerSqFt = basePricePerSqFt;

  const bedroomFactor = params.bedrooms * 15;
  adjustedPricePerSqFt += bedroomFactor;

  const bathroomFactor = params.bathrooms * 20;
  adjustedPricePerSqFt += bathroomFactor;

  const age = new Date().getFullYear() - params.yearBuilt;
  const ageFactor = age < 5 ? 30 : age < 15 ? 15 : age < 30 ? 0 : -20;
  adjustedPricePerSqFt += ageFactor;

  const conditionFactors: Record<string, number> = {
    excellent: 40,
    good: 20,
    fair: 0,
    poor: -30,
  };
  if (params.condition) {
    adjustedPricePerSqFt += conditionFactors[params.condition] || 0;
  }

  const estimatedValue = Math.round(adjustedPricePerSqFt * params.squareFeet);

  const factors: ValuationFactor[] = [
    {
      name: "Square Footage",
      impact: params.squareFeet * basePricePerSqFt,
      description: `${formatSquareFeet(params.squareFeet)} at $${basePricePerSqFt}/sqft base`,
    },
    {
      name: "Bedrooms",
      impact: bedroomFactor * params.squareFeet,
      description: `${params.bedrooms} bedrooms adding $${bedroomFactor}/sqft`,
    },
    {
      name: "Bathrooms",
      impact: bathroomFactor * params.squareFeet,
      description: `${params.bathrooms} bathrooms adding $${bathroomFactor}/sqft`,
    },
    {
      name: "Age",
      impact: ageFactor * params.squareFeet,
      description: `Built ${params.yearBuilt} (${ageFactor >= 0 ? "+" : ""}$${ageFactor}/sqft)`,
    },
  ];

  return {
    estimatedValue,
    pricePerSqFt: Math.round(adjustedPricePerSqFt),
    confidence: 0.85,
    comparables: Math.floor(Math.random() * 5) + 3,
    factors,
  };
}

export function analyzePrice(
  currentPrice: number,
  estimatedValue: number,
  daysOnMarket?: number,
  priceHistory?: PricePoint[]
): PriceAnalysis {
  const difference = currentPrice - estimatedValue;
  const percentageDiff = (difference / estimatedValue) * 100;

  let recommendation: "overpriced" | "fair" | "underpriced";
  if (percentageDiff > 10) {
    recommendation = "overpriced";
  } else if (percentageDiff < -10) {
    recommendation = "underpriced";
  } else {
    recommendation = "fair";
  }

  return {
    currentPrice,
    estimatedValue,
    difference,
    percentageDiff: Math.round(percentageDiff * 100) / 100,
    recommendation,
    daysOnMarket,
    priceHistory,
  };
}

export function estimatePropertyTax(
  propertyValue: number,
  state: string,
  county?: string
): PropertyTaxEstimate {
  const stateRates: Record<string, number> = {
    CA: 0.0075,
    TX: 0.018,
    FL: 0.008,
    NY: 0.014,
    PA: 0.013,
    IL: 0.018,
    OH: 0.014,
    GA: 0.009,
    NC: 0.008,
    MI: 0.013,
  };

  const effectiveRate = stateRates[state] || 0.012;
  const annualTax = Math.round(propertyValue * effectiveRate);
  const monthlyTax = Math.round(annualTax / 12);

  const breakdown: TaxBreakdown[] = [
    { name: "County Tax", amount: Math.round(annualTax * 0.4), rate: effectiveRate * 0.4 },
    { name: "School Tax", amount: Math.round(annualTax * 0.35), rate: effectiveRate * 0.35 },
    { name: "City Tax", amount: Math.round(annualTax * 0.15), rate: effectiveRate * 0.15 },
    { name: "Special Districts", amount: Math.round(annualTax * 0.1), rate: effectiveRate * 0.1 },
  ];

  return {
    annualTax,
    monthlyTax,
    effectiveRate,
    breakdown,
  };
}

export function analyzeInvestment(params: {
  purchasePrice: number;
  downPaymentPercent?: number;
  monthlyRent: number;
  monthlyExpenses?: number;
  interestRate?: number;
  loanTermYears?: number;
}): InvestmentAnalysis {
  const {
    purchasePrice,
    downPaymentPercent = 20,
    monthlyRent,
    monthlyExpenses = 0,
    interestRate = 6.5,
    loanTermYears = 30,
  } = params;

  const downPayment = purchasePrice * (downPaymentPercent / 100);
  const loanAmount = purchasePrice - downPayment;

  const mortgage = calculateMortgage({
    principal: loanAmount,
    annualRate: interestRate,
    years: loanTermYears,
  });

  const totalMonthlyExpenses = mortgage.monthlyPayment + monthlyExpenses;
  const monthlyCashFlow = monthlyRent - totalMonthlyExpenses;
  const annualCashFlow = monthlyCashFlow * 12;

  const annualNOI = monthlyRent * 12 - monthlyExpenses * 12;
  const capRate = (annualNOI / purchasePrice) * 100;

  const cashOnCashReturn = (annualCashFlow / downPayment) * 100;

  let breakEvenMonths = 0;
  if (monthlyCashFlow < 0) {
    breakEvenMonths = Math.ceil(downPayment / Math.abs(monthlyCashFlow));
  }

  const fiveYearAppreciation = purchasePrice * Math.pow(1.03, 5);
  const equity = purchasePrice - loanAmount;
  const fiveYearEquity = fiveYearAppreciation - loanAmount;
  const fiveYearROI = ((fiveYearEquity - downPayment) / downPayment) * 100;

  return {
    purchasePrice,
    downPayment,
    monthlyRent,
    expenses: totalMonthlyExpenses,
    monthlyCashFlow: Math.round(monthlyCashFlow),
    annualCashFlow: Math.round(annualCashFlow),
    capRate: Math.round(capRate * 100) / 100,
    cashOnCashReturn: Math.round(cashOnCashReturn * 100) / 100,
    breakEvenMonths,
    fiveYearROI: Math.round(fiveYearROI * 100) / 100,
  };
}

export function calculatePricePerSqFt(price: number, sqft: number): number {
  if (sqft <= 0) return 0;
  return Math.round((price / sqft) * 100) / 100;
}

export function calculateRoomSize(
  totalSqft: number,
  rooms: number,
  sharedAreas: number = 0.2
): number {
  const usableSqft = totalSqft * (1 - sharedAreas);
  return Math.round(usableSqft / rooms);
}

export function estimateRenovationCost(
  propertyValue: number,
  renovationType: "minor" | "moderate" | "major" | "gut"
): number {
  const percentages: Record<string, number> = {
    minor: 0.1,
    moderate: 0.2,
    major: 0.4,
    gut: 0.6,
  };

  return Math.round(propertyValue * (percentages[renovationType] || 0.2));
}

export function calculateBreakEvenPoint(
  purchasePrice: number,
  monthlySavings: number,
  appreciation: number = 0.03
): number {
  const monthlyAppreciation = appreciation / 12;
  let months = 0;
  let currentValue = purchasePrice;

  while (currentValue <= purchasePrice && months < 360) {
    months++;
    currentValue += currentValue * monthlyAppreciation;
  }

  return months;
}

export function generateComparableProperties(
  subjectProperty: PropertyValuationParams,
  count: number = 5
): Array<PropertyValuationParams & { price: number; distance: number }> {
  const comparables: Array<PropertyValuationParams & { price: number; distance: number }> = [];

  for (let i = 0; i < count; i++) {
    const sqftVariance = (Math.random() - 0.5) * 200;
    const bedroomVariance = Math.floor((Math.random() - 0.5) * 2);
    const bathroomVariance = Math.floor((Math.random() - 0.5) * 2);

    const valuation = estimatePropertyValuation({
      ...subjectProperty,
      squareFeet: Math.max(500, subjectProperty.squareFeet + sqftVariance),
      bedrooms: Math.max(1, subjectProperty.bedrooms + bedroomVariance),
      bathrooms: Math.max(1, subjectProperty.bathrooms + bathroomVariance),
    });

    comparables.push({
      squareFeet: Math.max(500, subjectProperty.squareFeet + sqftVariance),
      bedrooms: Math.max(1, subjectProperty.bedrooms + bedroomVariance),
      bathrooms: Math.max(1, subjectProperty.bathrooms + bathroomVariance),
      yearBuilt: subjectProperty.yearBuilt + Math.floor((Math.random() - 0.5) * 10),
      location: subjectProperty.location,
      price: valuation.estimatedValue,
      distance: Math.round(Math.random() * 2 * 100) / 100,
    });
  }

  return comparables.sort((a, b) => a.distance - b.distance);
}

export function formatMortgagePayment(monthlyPayment: number): string {
  return formatCurrency(monthlyPayment);
}

export function formatPropertyPrice(price: number): string {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(2)}M`;
  }
  return formatCurrency(price);
}

export function formatPricePerSqFt(price: number): string {
  return `$${formatNumber(price)}/sqft`;
}

export default {
  calculateMortgage,
  generateAmortizationSchedule,
  calculateAffordability,
  estimatePropertyValuation,
  analyzePrice,
  estimatePropertyTax,
  analyzeInvestment,
  calculatePricePerSqFt,
  calculateRoomSize,
  estimateRenovationCost,
  calculateBreakEvenPoint,
  generateComparableProperties,
  formatMortgagePayment,
  formatPropertyPrice,
  formatPricePerSqFt,
};
