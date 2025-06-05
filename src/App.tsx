import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

function App() {
  // State variables
  const [selectedCurrency, setSelectedCurrency] = useState('$');
  const [payoffStrategy, setPayoffStrategy] = useState('snowball');
  const [numCreditCards, setNumCreditCards] = useState(1);
  const [extraMonthlyPayment, setExtraMonthlyPayment] = useState(0);
  const [annualBonusAmount, setAnnualBonusAmount] = useState(0);
  const [annualBonusMonth, setAnnualBonusMonth] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [paymentSchedule, setPaymentSchedule] = useState([]);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Currency options
  const currencies = [
    { symbol: '$', name: 'USD ($)' },
    { symbol: '€', name: 'EUR (€)' },
    { symbol: '£', name: 'GBP (£)' },
    { symbol: '¥', name: 'JPY (¥)' },
    { symbol: 'C$', name: 'CAD (C$)' },
    { symbol: 'A$', name: 'AUD (A$)' },
    { symbol: '₹', name: 'INR (₹)' },
  ];

  // Month options for bonus
  const months = [
    { value: 0, name: 'None' },
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' },
  ];

  return (
    <div className="min-h-screen bg-[#e3f2fd] p-5">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center text-[#2c3e50] mb-8">Debt Payoff Calculator</h1>

        {/* Settings Section */}
        <div className="mb-6 p-5 border border-[#b0bec5] rounded-lg bg-[#f8f9fa]">
          <h2 className="text-xl font-semibold text-[#2c3e50] mb-4">Settings</h2>
          <div className="mb-4">
            <label htmlFor="currencySelector" className="block font-semibold text-[#34495e] mb-2">
              Select Currency:
            </label>
            <select
              id="currencySelector"
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="min-w-[220px] p-2 border border-[#ced4da] rounded"
            >
              {currencies.map((currency) => (
                <option key={currency.symbol} value={currency.symbol}>
                  {currency.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Payoff Strategy Section */}
        <div className="mb-6 p-5 border border-[#b0bec5] rounded-lg bg-[#f8f9fa]">
          <h2 className="text-xl font-semibold text-[#2c3e50] mb-4">Payoff Strategy</h2>
          <div className="mb-4">
            <label htmlFor="payoffStrategy" className="block font-semibold text-[#34495e] mb-2">
              Choose your debt payoff strategy:
            </label>
            <select
              id="payoffStrategy"
              value={payoffStrategy}
              onChange={(e) => setPayoffStrategy(e.target.value)}
              className="min-w-[220px] p-2 border border-[#ced4da] rounded"
            >
              <option value="snowball">Lowest Balance First (Debt Snowball)</option>
              <option value="avalanche">Highest APR First (Debt Avalanche)</option>
            </select>
          </div>
        </div>

        {/* Initial Setup Section */}
        <div className="mb-6 p-5 border border-[#b0bec5] rounded-lg bg-[#f8f9fa]">
          <h2 className="text-xl font-semibold text-[#2c3e50] mb-4">Initial Setup</h2>
          <div className="mb-4">
            <label htmlFor="numCreditCards" className="block font-semibold text-[#34495e] mb-2">
              Number of Credit Cards:
            </label>
            <input
              type="number"
              id="numCreditCards"
              value={numCreditCards}
              onChange={(e) => setNumCreditCards(parseInt(e.target.value) || 0)}
              min="0"
              className="w-[180px] p-2 border border-[#ced4da] rounded"
            />
          </div>
        </div>

        {/* Extra Payments & Bonuses Section */}
        <div className="mb-6 p-5 border border-[#b0bec5] rounded-lg bg-[#f8f9fa]">
          <h2 className="text-xl font-semibold text-[#2c3e50] mb-4">Extra Payments & Bonuses</h2>
          
          <div className="mb-4">
            <label htmlFor="extraMonthlyPayment" className="block font-semibold text-[#34495e] mb-2">
              Extra Monthly Payment ({selectedCurrency}):
            </label>
            <input
              type="number"
              id="extraMonthlyPayment"
              value={extraMonthlyPayment}
              onChange={(e) => setExtraMonthlyPayment(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              className="w-[180px] p-2 border border-[#ced4da] rounded"
            />
          </div>

          <h3 className="text-lg font-semibold text-[#2c3e50] mb-3">Annual Bonus</h3>
          <div className="mb-4">
            <label htmlFor="annualBonusAmount" className="block font-semibold text-[#34495e] mb-2">
              Bonus Amount ({selectedCurrency}):
            </label>
            <input
              type="number"
              id="annualBonusAmount"
              value={annualBonusAmount}
              onChange={(e) => setAnnualBonusAmount(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              className="w-[180px] p-2 border border-[#ced4da] rounded"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="annualBonusMonth" className="block font-semibold text-[#34495e] mb-2">
              Bonus Month (1-12):
            </label>
            <select
              id="annualBonusMonth"
              value={annualBonusMonth}
              onChange={(e) => setAnnualBonusMonth(parseInt(e.target.value))}
              className="min-w-[220px] p-2 border border-[#ced4da] rounded"
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          <button
            onClick={() => {/* TODO: Implement calculate */}}
            className="px-6 py-2 bg-[#27ae60] hover:bg-[#229954] text-white rounded transition-colors"
          >
            Calculate Payoff
          </button>
          <button
            onClick={() => {/* TODO: Implement save */}}
            className="px-6 py-2 bg-[#f39c12] hover:bg-[#e67e22] text-white rounded transition-colors"
          >
            Save Inputs
          </button>
          <button
            onClick={() => {/* TODO: Implement load */}}
            className="px-6 py-2 bg-[#8e44ad] hover:bg-[#7d3c98] text-white rounded transition-colors"
          >
            Load Inputs
          </button>
          <button
            onClick={() => {/* TODO: Implement reset */}}
            className="px-6 py-2 bg-[#e74c3c] hover:bg-[#c0392b] text-white rounded transition-colors"
          >
            Reset All
          </button>
        </div>

        {/* Results Section */}
        {showResults && (
          <div className="p-5 border border-[#b0bec5] rounded-lg bg-[#f8f9fa]">
            <h2 className="text-xl font-semibold text-[#2c3e50] mb-4">Results</h2>
            <p className="text-[#34495e] mb-4">{summaryText}</p>
            
            <div className="relative h-[45vh] max-w-[800px] mx-auto my-6 p-2 border border-[#ddd] rounded">
              <canvas ref={chartRef}></canvas>
            </div>

            {/* TODO: Add payment schedule table */}
            
            <div className="flex justify-center gap-2 mt-5">
              <button
                onClick={() => {/* TODO: Implement PDF export */}}
                className="px-6 py-2 bg-[#3498db] hover:bg-[#2980b9] text-white rounded transition-colors"
              >
                Export Results as PDF
              </button>
              <button
                onClick={() => {/* TODO: Implement CSV export */}}
                className="px-6 py-2 bg-[#3498db] hover:bg-[#2980b9] text-white rounded transition-colors"
              >
                Export Results as CSV
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;