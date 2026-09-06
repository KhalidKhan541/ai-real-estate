import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cache } from "@/lib/cache";

const mortgageSchema = z.object({
  homePrice: z.number().positive(),
  downPayment: z.number().min(0).optional(),
  downPaymentPercent: z.number().min(0).max(100).optional(),
  loanTerm: z.number().min(1).max(20).default(30),
  interestRate: z.number().min(0).max(30),
  propertyTax: z.number().min(0).optional(),
  propertyTaxPercent: z.number().min(0).max(5).optional(),
  homeInsurance: z.number().min(0).optional(),
  monthlyInsurance: z.number().min(0).optional(),
  pmi: z.number().min(0).optional(),
  hoa: z.number().min(0).optional(),
  zipCode: z.string().optional(),
});

function calculateAmortizationSchedule(
  principal: number,
  monthlyRate: number,
  totalPayments: number
): {
  monthlyPayment: number;
  totalPaid: number;
  totalInterest: number;
  schedule: Array<{
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
  }>;
} {
  const monthlyPayment =
    monthlyRate === 0
      ? principal / totalPayments
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
        (Math.pow(1 + monthlyRate, totalPayments) - 1);

  const schedule: Array<{
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
  }> = [];

  let balance = principal;
  let totalPaid = 0;
  let totalInterest = 0;

  for (let month = 1; month <= Math.min(totalPayments, 360); month++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    balance = Math.max(0, balance - principalPayment);
    totalPaid += monthlyPayment;
    totalInterest += interestPayment;

    schedule.push({
      month,
      payment: Math.round(monthlyPayment * 100) / 100,
      principal: Math.round(principalPayment * 100) / 100,
      interest: Math.round(interestPayment * 100) / 100,
      balance: Math.round(balance * 100) / 100,
    });
  }

  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    schedule,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = mortgageSchema.parse(body);

    const downPayment =
      validatedData.downPayment ||
      (validatedData.downPaymentPercent
        ? validatedData.homePrice * (validatedData.downPaymentPercent / 100)
        : validatedData.homePrice * 0.2);

    const loanAmount = validatedData.homePrice - downPayment;

    if (loanAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Down payment exceeds or equals home price" },
        { status: 400 }
      );
    }

    const monthlyRate = validatedData.interestRate / 100 / 12;
    const totalPayments = validatedData.loanTerm * 12;

    const amortization = calculateAmortizationSchedule(loanAmount, monthlyRate, totalPayments);

    let monthlyTax = validatedData.propertyTax || 0;
    if (validatedData.propertyTaxPercent && !validatedData.propertyTax) {
      monthlyTax = (validatedData.homePrice * (validatedData.propertyTaxPercent / 100)) / 12;
    } else if (!validatedData.propertyTax && validatedData.zipCode) {
      monthlyTax = (validatedData.homePrice * 0.011) / 12;
    }

    let monthlyInsurance = validatedData.monthlyInsurance || 0;
    if (validatedData.homeInsurance && !validatedData.monthlyInsurance) {
      monthlyInsurance = validatedData.homeInsurance / 12;
    } else if (!validatedData.monthlyInsurance && !validatedData.homeInsurance) {
      monthlyInsurance = validatedData.homePrice * 0.003 / 12;
    }

    const monthlyPMI = downPayment < validatedData.homePrice * 0.2
      ? validatedData.pmi || loanAmount * 0.005 / 12
      : 0;

    const monthlyHOA = validatedData.hoa || 0;

    const totalMonthlyPayment =
      amortization.monthlyPayment + monthlyTax + monthlyInsurance + monthlyPMI + monthlyHOA;

    const closingCosts = validatedData.homePrice * 0.03;
    const cashNeeded = downPayment + closingCosts;

    const affordabilityThresholds = {
      conservative: totalMonthlyPayment * 1.2,
      moderate: totalMonthlyPayment * 1.35,
      aggressive: totalMonthlyPayment * 1.5,
    };

    const incomeNeeded = {
      conservative: totalMonthlyPayment * 12 / 0.28,
      moderate: totalMonthlyPayment * 12 / 0.36,
      aggressive: totalMonthlyPayment * 12 / 0.43,
    };

    const comparisonScenarios = [15, 20, 25, 30]
      .filter((term) => term !== validatedData.loanTerm)
      .map((term) => {
        const termRate = monthlyRate;
        const termPayments = term * 12;
        const termAmortization = calculateAmortizationSchedule(loanAmount, termRate, termPayments);

        return {
          term,
          monthlyPayment: termAmortization.monthlyPayment + monthlyTax + monthlyInsurance + monthlyPMI + monthlyHOA,
          totalPaid: termAmortization.totalPaid,
          totalInterest: termAmortization.totalInterest,
          savingsVsCurrent: amortization.totalInterest - termAmortization.totalInterest,
        };
      });

    return NextResponse.json({
      success: true,
      data: {
        input: {
          homePrice: validatedData.homePrice,
          downPayment,
          downPaymentPercent: (downPayment / validatedData.homePrice) * 100,
          loanAmount,
          interestRate: validatedData.interestRate,
          loanTerm: validatedData.loanTerm,
        },
        monthlyBreakdown: {
          principalAndInterest: amortization.monthlyPayment,
          propertyTax: Math.round(monthlyTax * 100) / 100,
          insurance: Math.round(monthlyInsurance * 100) / 100,
          pmi: Math.round(monthlyPMI * 100) / 100,
          hoa: monthlyHOA,
          total: Math.round(totalMonthlyPayment * 100) / 100,
        },
        totals: {
          totalPaid: amortization.totalPaid + (monthlyTax + monthlyInsurance + monthlyPMI + monthlyHOA) * totalPayments,
          totalInterest: amortization.totalInterest,
          totalPrincipal: loanAmount,
          closingCosts: Math.round(closingCosts),
          cashNeeded: Math.round(cashNeeded),
        },
        affordability: {
          monthlyThresholds: affordabilityThresholds,
          annualIncomeNeeded: incomeNeeded,
        },
        comparisonScenarios,
        amortizationSchedule: amortization.schedule,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", message: error.errors.map((e) => e.message).join(", ") },
        { status: 400 }
      );
    }
    console.error("Mortgage calculation error:", error);
    return NextResponse.json(
      { success: false, error: "Calculation failed" },
      { status: 500 }
    );
  }
}
