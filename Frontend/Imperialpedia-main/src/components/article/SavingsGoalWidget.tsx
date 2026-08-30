"use client";

import React, { useState } from "react";
import { Calculator, ArrowRight, PiggyBank, Sparkles } from "lucide-react";
import Link from "next/link";

interface SavingsGoalWidgetProps {
  defaultGoal?: number;
  defaultMonths?: number;
  className?: string;
}

export function SavingsGoalWidget({
  defaultGoal = 5000,
  defaultMonths = 12,
  className = "",
}: SavingsGoalWidgetProps) {
  const [goalAmount, setGoalAmount] = useState<number>(defaultGoal);
  const [timeframeMonths, setTimeframeMonths] = useState<number>(defaultMonths);
  const [apy, setApy] = useState<number>(4.5); // Average High-Yield Savings Rate

  // Calculations
  const months = Math.max(1, timeframeMonths);
  const monthlyRate = apy / 100 / 12;
  
  // Future value of a series formula for monthly contribution:
  // PMT = FV * (r / ((1 + r)^n - 1))
  let monthlyNeeded = goalAmount / months;
  let totalInterest = 0;

  if (monthlyRate > 0) {
    const factor = Math.pow(1 + monthlyRate, months) - 1;
    if (factor > 0) {
      monthlyNeeded = (goalAmount * monthlyRate) / factor;
      totalInterest = Math.max(0, goalAmount - monthlyNeeded * months);
    }
  }

  return (
    <div
      className={`my-10 rounded-2xl border-2 border-[#1d4fc4]/20 bg-gradient-to-br from-blue-50/50 via-white to-slate-50 p-6 sm:p-8 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1d4fc4] text-white">
            <PiggyBank className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 leading-tight">
              Interactive Savings Goal Calculator
            </h3>
            <p className="text-xs text-gray-500">
              Calculate your required monthly contribution at current high-yield rates
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-blue-100/80 px-2.5 py-1 text-[11px] font-bold text-[#1d4fc4]">
          <Sparkles className="h-3 w-3" /> Live Planner
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 my-6">
        {/* Goal Amount Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-gray-700">
            <span>Target Goal</span>
            <span className="font-bold text-[#1d4fc4]">${goalAmount.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min={500}
            max={50000}
            step={250}
            value={goalAmount}
            onChange={(e) => setGoalAmount(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1d4fc4]"
          />
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>$500</span>
            <span>$25,000</span>
            <span>$50,000+</span>
          </div>
        </div>

        {/* Timeframe Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-gray-700">
            <span>Timeframe</span>
            <span className="font-bold text-[#1d4fc4]">{timeframeMonths} Months ({Math.round(timeframeMonths/12 * 10)/10} yrs)</span>
          </div>
          <input
            type="range"
            min={3}
            max={60}
            step={1}
            value={timeframeMonths}
            onChange={(e) => setTimeframeMonths(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1d4fc4]"
          />
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>3 mo</span>
            <span>24 mo</span>
            <span>5 years</span>
          </div>
        </div>

        {/* APY Option */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-gray-700">
            <span>Account APY</span>
            <span className="font-bold text-emerald-600">{apy}% APY</span>
          </div>
          <select
            value={apy}
            onChange={(e) => setApy(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-200 bg-white py-1.5 px-2.5 text-xs font-medium text-gray-700 shadow-sm focus:border-[#1d4fc4] focus:outline-none"
          >
            <option value={4.5}>High-Yield Savings (4.50% APY)</option>
            <option value={5.0}>1-Year CD (5.00% APY)</option>
            <option value={0.5}>Traditional Bank (0.50% APY)</option>
            <option value={7.0}>Conservative Index (7.00% Return)</option>
          </select>
        </div>
      </div>

      {/* Results Callout Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-white p-4 sm:p-5 border border-gray-100 shadow-sm">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Monthly Savings Needed
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#1d4fc4]">
            ${Math.ceil(monthlyNeeded).toLocaleString()}
            <span className="text-xs font-normal text-gray-500 ml-1">/ month</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Total principal deposited: ${(Math.ceil(monthlyNeeded) * months).toLocaleString()}
          </p>
        </div>

        <div className="sm:border-l sm:border-gray-100 sm:pl-5 flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Interest Earned Towards Goal
            </p>
            <p className="text-lg font-bold text-emerald-600">
              +${Math.round(totalInterest).toLocaleString()}
            </p>
            <p className="text-[11px] text-gray-400">
              Free money earned from compound interest
            </p>
          </div>
          <Link
            href="/financial-tools/compound-interest"
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#1d4fc4] hover:underline"
          >
            Open Full Compound Interest Calculator
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
