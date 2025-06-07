import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import DebtInput from './components/DebtInput';
import LumpSumInput from './components/LumpSumInput';
import PaymentScheduleTable from './components/PaymentScheduleTable';
import { calculatePayoffSchedule } from './utils/calculations';
import { saveToLocalStorage, loadFromLocalStorage, clearLocalStorage } from './utils/storage';
import { exportToPDF, exportToCSV } from './utils/export';
import { Debt, LumpSum, PaymentScheduleEntry, ChartData } from './types';

function App() {
  // State variables
  const [selectedCurrency, setSelectedCurrency] = useState('$');
  const [payoffStrategy, setPayoffStrategy] = useState('snowball');
  const [numCreditCards, setNumCreditCards] = useState(1);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [lumpSums, setLumpSums] = useState<LumpSum[]>([]);
  const [extraMonthlyPayment, setExtraMonthlyPayment] = useState(0);
  const [annualBonusAmount, setAnnualBonusAmount] = useState(0);
  const [annualBonusMonth, setAnnualBonusMonth] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleEntry[]>([]);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

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

  // Initialize credit card debts when number changes
  useEffect(() => {
    const newDebts: Debt[] = [];
    for (let i = 1; i <= numCreditCards; i++) {
      const existingDebt = debts.find(d => d.id === `card-${i}`);
      if (existingDebt) {
        newDebts.push(existingDebt);
      } else {
        newDebts.push({
          id: `card-${i}`,
          name: `Credit Card ${i}`,
          balance: 0,
          apr: 0,
          minPayment: 0,
          monthlyInterestRate: 0,
          paidOff: false
        });
      }
    }
    
    // Keep unsecured debts
    const unsecuredDebts = debts.filter(d => d.id.startsWith('unsecured-'));
    setDebts([...newDebts, ...unsecuredDebts]);
  }, [numCreditCards]);

  // Update chart when data changes
  useEffect(() => {
    if (chartData && chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const updatedChartData = {
        ...chartData,
        datasets: [{
          ...chartData.datasets[0],
          label: `Total Debt (${selectedCurrency})`
        }]
      };

      chartInstance.current = new Chart(chartRef.current, {
        type: 'line',
        data: updatedChartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: `Total Debt (${selectedCurrency})` },
              ticks: { 
                callback: (value) => selectedCurrency + (value as number).toFixed(0) 
              }
            },
            x: { title: { display: true, text: 'Month' } }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) => `${context.dataset.label || ''}: ${selectedCurrency}${context.parsed.y.toFixed(2)}`
              }
            }
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [chartData, selectedCurrency]);

  const updateDebt = (id: string, field: string, value: string | number) => {
    setDebts(prev => prev.map(debt => {
      if (debt.id === id) {
        const updated = { ...debt, [field]: value };
        if (field === 'apr') {
          updated.monthlyInterestRate = (value as number) / 12 / 100;
        }
        return updated;
      }
      return debt;
    }));
  };

  const removeDebt = (id: string) => {
    setDebts(prev => prev.filter(debt => debt.id !== id));
  };

  const addUnsecuredDebt = () => {
    const nextId = Math.max(0, ...debts
      .filter(d => d.id.startsWith('unsecured-'))
      .map(d => parseInt(d.id.split('-')[1]) || 0)) + 1;
    
    const newDebt: Debt = {
      id: `unsecured-${nextId}`,
      name: `Unsecured Debt ${nextId}`,
      balance: 0,
      apr: 0,
      minPayment: 0,
      monthlyInterestRate: 0,
      paidOff: false
    };
    
    setDebts(prev => [...prev, newDebt]);
  };

  const updateLumpSum = (id: string, field: string, value: number) => {
    setLumpSums(prev => prev.map(lump => 
      lump.id === id ? { ...lump, [field]: value } : lump
    ));
  };

  const removeLumpSum = (id: string) => {
    setLumpSums(prev => prev.filter(lump => lump.id !== id));
  };

  const addLumpSum = () => {
    const nextId = Math.max(0, ...lumpSums.map(l => parseInt(l.id.split('-')[1]) || 0)) + 1;
    const newLumpSum: LumpSum = {
      id: `lump-${nextId}`,
      amount: 0,
      month: 1
    };
    setLumpSums(prev => [...prev, newLumpSum]);
  };

  const calculatePayoff = () => {
    const validDebts = debts.filter(debt => 
      debt.name.trim() && debt.balance > 0 && debt.apr >= 0 && debt.minPayment >= 0
    ).map(debt => ({
      ...debt,
      monthlyInterestRate: debt.apr / 12 / 100
    }));

    if (validDebts.length === 0) {
      alert('Please add at least one debt with a positive balance.');
      setShowResults(false);
      return;
    }

    const validLumpSums = lumpSums.filter(lump => lump.amount > 0 && lump.month >= 1 && lump.month <= 12);

    const result = calculatePayoffSchedule(
      validDebts,
      payoffStrategy,
      extraMonthlyPayment,
      annualBonusAmount,
      annualBonusMonth,
      validLumpSums
    );

    const years = Math.floor(result.totalMonths / 12);
    const months = result.totalMonths % 12;
    setSummaryText(
      `Debt-free in ${years} years, ${months} months. Total interest paid: ${selectedCurrency}${result.totalInterest.toFixed(2)}.`
    );

    setPaymentSchedule(result.schedule);
    setChartData(result.chartData);
    setShowResults(true);
  };

  const saveData = () => {
    try {
      const dataToSave = {
        selectedCurrency,
        payoffStrategy,
        numCreditCards,
        debts,
        lumpSums,
        extraMonthlyPayment,
        annualBonusAmount,
        annualBonusMonth
      };
      saveToLocalStorage(dataToSave);
      alert('Inputs saved successfully!');
    } catch (error) {
      alert('Failed to save data. Please try again.');
    }
  };

  const loadData = () => {
    try {
      const savedData = loadFromLocalStorage();
      if (!savedData) {
        alert('No saved data found.');
        return;
      }

      setSelectedCurrency(savedData.selectedCurrency || '$');
      setPayoffStrategy(savedData.payoffStrategy || 'snowball');
      setNumCreditCards(savedData.numCreditCards || 1);
      setDebts(savedData.debts || []);
      setLumpSums(savedData.lumpSums || []);
      setExtraMonthlyPayment(savedData.extraMonthlyPayment || 0);
      setAnnualBonusAmount(savedData.annualBonusAmount || 0);
      setAnnualBonusMonth(savedData.annualBonusMonth || 0);
      setShowResults(false);
      
      alert('Data loaded successfully!');
    } catch (error) {
      alert('Failed to load data. Please try again.');
    }
  };

  const resetAll = () => {
    if (!confirm('Are you sure you want to reset all inputs and clear results?')) return;
    
    setSelectedCurrency('$');
    setPayoffStrategy('snowball');
    setNumCreditCards(1);
    setDebts([]);
    setLumpSums([]);
    setExtraMonthlyPayment(0);
    setAnnualBonusAmount(0);
    setAnnualBonusMonth(0);
    setShowResults(false);
    setPaymentSchedule([]);
    setChartData(null);
    setSummaryText('');
    
    clearLocalStorage();
    alert('All inputs and results have been reset.');
  };

  const handleExportPDF = () => {
    if (paymentSchedule.length === 0) {
      alert('No data to export. Please calculate first.');
      return;
    }
    
    const strategyText = payoffStrategy === 'snowball' ? 'Lowest Balance First (Debt Snowball)' : 'Highest APR First (Debt Avalanche)';
    exportToPDF(paymentSchedule, summaryText, strategyText, selectedCurrency, chartRef.current || undefined);
  };

  const handleExportCSV = () => {
    if (paymentSchedule.length === 0) {
      alert('No data to export. Please calculate first.');
      return;
    }
    exportToCSV(paymentSchedule, selectedCurrency);
  };

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

        {/* Credit Card Debts */}
        {debts.filter(d => d.id.startsWith('card-')).length > 0 && (
          <div className="mb-6 p-5 border border-[#b0bec5] rounded-lg bg-[#f8f9fa]">
            <h2 className="text-xl font-semibold text-[#2c3e50] mb-4">Credit Card Debts</h2>
            {debts.filter(d => d.id.startsWith('card-')).map(debt => (
              <DebtInput
                key={debt.id}
                id={debt.id}
                name={debt.name}
                balance={debt.balance}
                apr={debt.apr}
                minPayment={debt.minPayment}
                currency={selectedCurrency}
                onUpdate={updateDebt}
                isRemovable={false}
              />
            ))}
          </div>
        )}

        {/* Unsecured Debts */}
        <div className="mb-6 p-5 border border-[#b0bec5] rounded-lg bg-[#f8f9fa]">
          <h2 className="text-xl font-semibold text-[#2c3e50] mb-4">Other Unsecured Debts</h2>
          {debts.filter(d => d.id.startsWith('unsecured-')).map(debt => (
            <DebtInput
              key={debt.id}
              id={debt.id}
              name={debt.name}
              balance={debt.balance}
              apr={debt.apr}
              minPayment={debt.minPayment}
              currency={selectedCurrency}
              onUpdate={updateDebt}
              onRemove={removeDebt}
              isRemovable={true}
            />
          ))}
          <button
            onClick={addUnsecuredDebt}
            className="px-4 py-2 bg-[#3498db] hover:bg-[#2980b9] text-white rounded transition-colors"
          >
            Add Unsecured Debt
          </button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
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
                className="w-full p-2 border border-[#ced4da] rounded"
              />
            </div>

            <div>
              <label htmlFor="annualBonusMonth" className="block font-semibold text-[#34495e] mb-2">
                Bonus Month:
              </label>
              <select
                id="annualBonusMonth"
                value={annualBonusMonth}
                onChange={(e) => setAnnualBonusMonth(parseInt(e.target.value))}
                className="w-full p-2 border border-[#ced4da] rounded"
              >
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-[#2c3e50] mb-3">One-Time Lump Sum Payments</h3>
          {lumpSums.map(lump => (
            <LumpSumInput
              key={lump.id}
              id={lump.id}
              amount={lump.amount}
              month={lump.month}
              currency={selectedCurrency}
              onUpdate={updateLumpSum}
              onRemove={removeLumpSum}
            />
          ))}
          <button
            onClick={addLumpSum}
            className="px-4 py-2 bg-[#3498db] hover:bg-[#2980b9] text-white rounded transition-colors"
          >
            Add Lump Sum Payment
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          <button
            onClick={calculatePayoff}
            className="px-6 py-2 bg-[#27ae60] hover:bg-[#229954] text-white rounded transition-colors"
          >
            Calculate Payoff
          </button>
          <button
            onClick={saveData}
            className="px-6 py-2 bg-[#f39c12] hover:bg-[#e67e22] text-white rounded transition-colors"
          >
            Save Inputs
          </button>
          <button
            onClick={loadData}
            className="px-6 py-2 bg-[#8e44ad] hover:bg-[#7d3c98] text-white rounded transition-colors"
          >
            Load Inputs
          </button>
          <button
            onClick={resetAll}
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

            <PaymentScheduleTable schedule={paymentSchedule} currency={selectedCurrency} />
            
            <div className="flex justify-center gap-2 mt-5">
              <button
                onClick={handleExportPDF}
                className="px-6 py-2 bg-[#3498db] hover:bg-[#2980b9] text-white rounded transition-colors"
              >
                Export Results as PDF
              </button>
              <button
                onClick={handleExportCSV}
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