"use client";

import { useState } from "react";
import { Calculator as CalcIcon, DollarSign, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Calculator() {
  const [homePrice, setHomePrice] = useState(500000);
  const [downPayment, setDownPayment] = useState(100000);
  const [interestRate, setInterestRate] = useState(6.5);
  const [loanTerm, setLoanTerm] = useState(30);
  const [propertyTax, setPropertyTax] = useState(1200);
  const [insurance, setInsurance] = useState(200);
  const [hoa, setHoa] = useState(0);

  const principal = homePrice - downPayment;
  const monthlyRate = interestRate / 100 / 12;
  const numPayments = loanTerm * 12;

  const monthlyMortgage =
    principal > 0 && monthlyRate > 0
      ? (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
        (Math.pow(1 + monthlyRate, numPayments) - 1)
      : principal / numPayments || 0;

  const totalMonthly = monthlyMortgage + propertyTax + insurance + hoa;
  const totalCost = totalMonthly * numPayments + downPayment;
  const totalInterest = totalMonthly * numPayments - principal;

  const downPaymentPercent = ((downPayment / homePrice) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalcIcon className="h-5 w-5 text-blue-600" />
            Mortgage Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Home Price */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Home Price</Label>
              <span className="text-lg font-bold text-blue-600">
                ${homePrice.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min={50000}
              max={5000000}
              step={10000}
              value={homePrice}
              onChange={(e) => setHomePrice(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>$50K</span>
              <span>$5M</span>
            </div>
          </div>

          {/* Down Payment */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Down Payment</Label>
              <span className="text-sm text-gray-600">
                ${downPayment.toLocaleString()} ({downPaymentPercent}%)
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={homePrice}
              step={5000}
              value={downPayment}
              onChange={(e) => setDownPayment(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex gap-2">
              {[10, 15, 20].map((percent) => (
                <button
                  key={percent}
                  onClick={() => setDownPayment((homePrice * percent) / 100)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    Number(downPaymentPercent) === percent
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {percent}%
                </button>
              ))}
            </div>
          </div>

          {/* Interest Rate & Term */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Interest Rate (%)</Label>
              <Input
                type="number"
                step={0.1}
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Loan Term</Label>
              <div className="flex gap-2 mt-2">
                {[15, 20, 30].map((term) => (
                  <button
                    key={term}
                    onClick={() => setLoanTerm(term)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      loanTerm === term
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {term}yr
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Additional Costs */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Property Tax ($/mo)</Label>
              <Input
                type="number"
                value={propertyTax}
                onChange={(e) => setPropertyTax(Number(e.target.value))}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Insurance ($/mo)</Label>
              <Input
                type="number"
                value={insurance}
                onChange={(e) => setInsurance(Number(e.target.value))}
                className="mt-2"
              />
            </div>
            <div>
              <Label>HOA ($/mo)</Label>
              <Input
                type="number"
                value={hoa}
                onChange={(e) => setHoa(Number(e.target.value))}
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <p className="text-blue-100 mb-1">Estimated Monthly Payment</p>
            <p className="text-4xl font-bold">${totalMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            <p className="text-sm text-blue-200 mt-1">per month</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-blue-200 text-sm">Principal & Interest</p>
              <p className="text-xl font-semibold">
                ${monthlyMortgage.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-blue-200 text-sm">Property Tax</p>
              <p className="text-xl font-semibold">${propertyTax.toLocaleString()}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-blue-200 text-sm">Insurance</p>
              <p className="text-xl font-semibold">${insurance.toLocaleString()}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-blue-200 text-sm">HOA</p>
              <p className="text-xl font-semibold">${hoa.toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/20">
            <div className="flex justify-between text-sm">
              <span className="text-blue-200">Total Interest Paid</span>
              <span className="font-semibold">
                ${totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-blue-200">Total Cost of Loan</span>
              <span className="font-semibold">
                ${totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
