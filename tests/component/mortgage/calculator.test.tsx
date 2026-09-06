import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

interface CalculatorProps {
  homePrice: number;
  downPayment: number;
  interestRate: number;
  loanTerm: number;
  propertyTax?: number;
  homeInsurance?: number;
  onCalculate?: (result: CalculatorResult) => void;
}

interface CalculatorResult {
  monthlyPayment: number;
  principalAndInterest: number;
  monthlyTax: number;
  monthlyInsurance: number;
  totalMonthly: number;
  totalInterest: number;
  totalCost: number;
}

function MortgageCalculator({
  homePrice: initialPrice,
  downPayment: initialDown,
  interestRate: initialRate,
  loanTerm: initialTerm,
  propertyTax = 0,
  homeInsurance = 0,
  onCalculate,
}: CalculatorProps) {
  const [homePrice, setHomePrice] = React.useState(initialPrice);
  const [downPayment, setDownPayment] = React.useState(initialDown);
  const [interestRate, setInterestRate] = React.useState(initialRate);
  const [loanTerm, setLoanTerm] = React.useState(initialTerm);

  const calculate = (): CalculatorResult => {
    const loanAmount = homePrice - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const totalPayments = loanTerm * 12;

    const monthlyPI =
      monthlyRate > 0
        ? (loanAmount *
            monthlyRate *
            Math.pow(1 + monthlyRate, totalPayments)) /
          (Math.pow(1 + monthlyRate, totalPayments) - 1)
        : loanAmount / totalPayments;

    const monthlyTax = propertyTax / 12;
    const monthlyInsurance = homeInsurance / 12;
    const totalMonthly = monthlyPI + monthlyTax + monthlyInsurance;
    const totalInterest = monthlyPI * totalPayments - loanAmount;

    return {
      monthlyPayment: Math.round(monthlyPI * 100) / 100,
      principalAndInterest: Math.round(monthlyPI * 100) / 100,
      monthlyTax: Math.round(monthlyTax * 100) / 100,
      monthlyInsurance: Math.round(monthlyInsurance * 100) / 100,
      totalMonthly: Math.round(totalMonthly * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalCost: Math.round((loanAmount + totalInterest) * 100) / 100,
    };
  };

  const result = calculate();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);

  React.useEffect(() => {
    onCalculate?.(result);
  }, [homePrice, downPayment, interestRate, loanTerm]);

  return (
    <div data-testid="mortgage-calculator" className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900" data-testid="calculator-title">
        Mortgage Calculator
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="home-price" className="block text-sm font-medium text-gray-700">
            Home Price
          </label>
          <input
            id="home-price"
            type="number"
            value={homePrice}
            onChange={(e) => setHomePrice(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            data-testid="home-price-input"
          />
        </div>

        <div>
          <label htmlFor="down-payment" className="block text-sm font-medium text-gray-700">
            Down Payment
          </label>
          <input
            id="down-payment"
            type="number"
            value={downPayment}
            onChange={(e) => setDownPayment(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            data-testid="down-payment-input"
          />
        </div>

        <div>
          <label htmlFor="interest-rate" className="block text-sm font-medium text-gray-700">
            Interest Rate (%)
          </label>
          <input
            id="interest-rate"
            type="number"
            step="0.1"
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            data-testid="interest-rate-input"
          />
        </div>

        <div>
          <label htmlFor="loan-term" className="block text-sm font-medium text-gray-700">
            Loan Term (years)
          </label>
          <select
            id="loan-term"
            value={loanTerm}
            onChange={(e) => setLoanTerm(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            data-testid="loan-term-select"
          >
            <option value={15}>15 years</option>
            <option value={20}>20 years</option>
            <option value={30}>30 years</option>
          </select>
        </div>
      </div>

      <div className="rounded-lg bg-gray-50 p-4" data-testid="results-section">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">Monthly Payment</h3>

        <div className="mb-4 text-3xl font-bold text-emerald-600" data-testid="total-monthly">
          {formatCurrency(result.totalMonthly)}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between" data-testid="pi-payment">
            <span className="text-gray-600">Principal & Interest</span>
            <span className="font-medium">{formatCurrency(result.principalAndInterest)}</span>
          </div>
          <div className="flex justify-between" data-testid="tax-payment">
            <span className="text-gray-600">Property Tax</span>
            <span className="font-medium">{formatCurrency(result.monthlyTax)}</span>
          </div>
          <div className="flex justify-between" data-testid="insurance-payment">
            <span className="text-gray-600">Home Insurance</span>
            <span className="font-medium">{formatCurrency(result.monthlyInsurance)}</span>
          </div>
        </div>

        <div className="mt-4 border-t pt-4">
          <div className="flex justify-between" data-testid="total-interest">
            <span className="text-gray-600">Total Interest Paid</span>
            <span className="font-medium text-amber-600">
              {formatCurrency(result.totalInterest)}
            </span>
          </div>
          <div className="flex justify-between" data-testid="total-cost">
            <span className="text-gray-600">Total Cost</span>
            <span className="font-medium">{formatCurrency(result.totalCost)}</span>
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-500" data-testid="loan-summary">
        Loan Amount: {formatCurrency(homePrice - downPayment)} |{" "}
        {downPayment > 0
          ? `${Math.round((downPayment / homePrice) * 100)}% down`
          : "No down payment"}
      </div>
    </div>
  );
}

describe("MortgageCalculator", () => {
  const defaultProps = {
    homePrice: 450000,
    downPayment: 90000,
    interestRate: 6.5,
    loanTerm: 30,
    propertyTax: 5400,
    homeInsurance: 1800,
  };

  it("renders calculator with all inputs", () => {
    render(<MortgageCalculator {...defaultProps} />);

    expect(screen.getByTestId("calculator-title")).toHaveTextContent(
      "Mortgage Calculator"
    );
    expect(screen.getByTestId("home-price-input")).toHaveValue(450000);
    expect(screen.getByTestId("down-payment-input")).toHaveValue(90000);
    expect(screen.getByTestId("interest-rate-input")).toHaveValue(6.5);
    expect(screen.getByTestId("loan-term-select")).toHaveValue(30);
  });

  it("calculates correct monthly payment", () => {
    render(<MortgageCalculator {...defaultProps} />);

    const monthly = screen.getByTestId("total-monthly");
    expect(monthly.textContent).toBeDefined();
    expect(monthly.textContent).toMatch(/\$/);
  });

  it("updates calculation when inputs change", () => {
    const onCalculate = jest.fn();
    render(<MortgageCalculator {...defaultProps} onCalculate={onCalculate} />);

    fireEvent.change(screen.getByTestId("home-price-input"), {
      target: { value: "600000" },
    });

    expect(onCalculate).toHaveBeenCalled();
  });

  it("displays payment breakdown", () => {
    render(<MortgageCalculator {...defaultProps} />);

    expect(screen.getByTestId("pi-payment")).toHaveTextContent(
      "Principal & Interest"
    );
    expect(screen.getByTestId("tax-payment")).toHaveTextContent("Property Tax");
    expect(screen.getByTestId("insurance-payment")).toHaveTextContent(
      "Home Insurance"
    );
  });

  it("displays total interest and cost", () => {
    render(<MortgageCalculator {...defaultProps} />);

    expect(screen.getByTestId("total-interest")).toHaveTextContent(
      "Total Interest Paid"
    );
    expect(screen.getByTestId("total-cost")).toHaveTextContent("Total Cost");
  });

  it("shows loan summary", () => {
    render(<MortgageCalculator {...defaultProps} />);

    const summary = screen.getByTestId("loan-summary");
    expect(summary.textContent).toContain("$360,000");
    expect(summary.textContent).toContain("20% down");
  });

  it("supports different loan terms", () => {
    render(<MortgageCalculator {...defaultProps} />);

    fireEvent.change(screen.getByTestId("loan-term-select"), {
      target: { value: "15" },
    });

    expect(screen.getByTestId("loan-term-select")).toHaveValue(15);
  });

  it("handles zero down payment", () => {
    render(<MortgageCalculator {...defaultProps} downPayment={0} />);

    const summary = screen.getByTestId("loan-summary");
    expect(summary.textContent).toContain("No down payment");
  });

  it("formats currency values correctly", () => {
    render(<MortgageCalculator {...defaultProps} />);

    const monthly = screen.getByTestId("total-monthly");
    expect(monthly.textContent).toMatch(/^\$[\d,]+$/);
  });
});
