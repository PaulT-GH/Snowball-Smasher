import { Debt, LumpSum, PaymentScheduleEntry, ChartData } from '../types';

export function calculatePayoffSchedule(
  debts: Debt[],
  strategy: string,
  extraMonthlyPayment: number,
  bonusAmount: number,
  bonusMonth: number,
  lumpSums: LumpSum[]
): {
  schedule: PaymentScheduleEntry[];
  totalInterest: number;
  totalMonths: number;
  chartData: ChartData;
} {
  // Create deep copy of debts to avoid mutating original
  const workingDebts = debts.map(debt => ({ ...debt }));
  
  // Sort debts based on strategy
  if (strategy === 'snowball') {
    workingDebts.sort((a, b) => a.balance - b.balance);
  } else if (strategy === 'avalanche') {
    workingDebts.sort((a, b) => {
      if (b.apr === a.apr) {
        return a.balance - b.balance;
      }
      return b.apr - a.apr;
    });
  }

  const schedule: PaymentScheduleEntry[] = [];
  const chartData: ChartData = {
    labels: [],
    datasets: [{
      label: 'Total Debt',
      data: [],
      borderColor: 'rgb(54, 162, 235)',
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
      tension: 0.1,
      fill: false
    }]
  };

  // Calculate starting month and year (next full month after current)
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
  const currentYear = now.getFullYear();
  
  let startingMonth = currentMonth + 1;
  let startingYear = currentYear;
  
  // Handle year rollover
  if (startingMonth > 12) {
    startingMonth = 1;
    startingYear = currentYear + 1;
  }

  let currentMonthCount = 0;
  let totalInterestPaidGlobal = 0;
  let paymentPool = extraMonthlyPayment;

  while (workingDebts.some(debt => !debt.paidOff)) {
    currentMonthCount++;
    
    // Calculate the actual calendar month and year
    const monthsFromStart = currentMonthCount - 1;
    const monthForCalendar = ((startingMonth - 1 + monthsFromStart) % 12) + 1;
    const yearForCalendar = startingYear + Math.floor((startingMonth - 1 + monthsFromStart) / 12);

    chartData.labels.push(
      `${new Date(0, monthForCalendar - 1).toLocaleString('default', { month: 'short' })} ${yearForCalendar}`
    );

    let monthSpecificExtraPayment = paymentPool;
    if (bonusAmount > 0 && bonusMonth === monthForCalendar) {
      monthSpecificExtraPayment += bonusAmount;
    }
    
    lumpSums.forEach(ls => {
      if (ls.month === monthForCalendar) {
        monthSpecificExtraPayment += ls.amount;
      }
    });

    // Accrue interest
    workingDebts.forEach(debt => {
      if (!debt.paidOff) {
        const interestThisMonth = debt.balance * debt.monthlyInterestRate;
        debt.balance += interestThisMonth;
        totalInterestPaidGlobal += interestThisMonth;
      }
    });

    // Make payments
    let availableForTargetDebt = monthSpecificExtraPayment;
    let targetDebtIndex = workingDebts.findIndex(d => !d.paidOff);

    for (let i = 0; i < workingDebts.length; i++) {
      const debt = workingDebts[i];
      if (debt.paidOff) continue;

      let paymentAmount = 0;
      
      if (i === targetDebtIndex) {
        paymentAmount = Math.min(debt.balance, debt.minPayment + availableForTargetDebt);
      } else {
        paymentAmount = Math.min(debt.balance, debt.minPayment);
      }

      let interestPaidThisPayment: number;
      let principalPaidThisPayment: number;

      const balanceBeforePayment = debt.balance;
      debt.balance -= paymentAmount;

      if (debt.balance <= 0.005) {
        debt.balance = 0;
        interestPaidThisPayment = balanceBeforePayment * debt.monthlyInterestRate;
        if (paymentAmount < interestPaidThisPayment) {
          interestPaidThisPayment = paymentAmount;
        }
        principalPaidThisPayment = paymentAmount - interestPaidThisPayment;
      } else {
        interestPaidThisPayment = balanceBeforePayment * debt.monthlyInterestRate;
        if (paymentAmount < interestPaidThisPayment) {
          interestPaidThisPayment = paymentAmount;
          principalPaidThisPayment = 0;
        } else {
          principalPaidThisPayment = paymentAmount - interestPaidThisPayment;
        }
      }

      principalPaidThisPayment = Math.max(0, principalPaidThisPayment);
      interestPaidThisPayment = Math.max(0, interestPaidThisPayment);

      schedule.push({
        month: monthForCalendar,
        year: yearForCalendar,
        debtName: debt.name,
        payment: paymentAmount,
        interestPaid: interestPaidThisPayment,
        principalPaid: principalPaidThisPayment,
        remainingBalance: debt.balance > 0 ? debt.balance : 0,
        totalDebtRemaining: 0
      });

      if (debt.balance <= 0.005) {
        debt.balance = 0;
        if (!debt.paidOff) {
          paymentPool += debt.minPayment;
          debt.paidOff = true;
          targetDebtIndex = workingDebts.findIndex(d => !d.paidOff);
        }
      }
    }

    const totalDebtRemainingEndOfMonth = workingDebts.reduce((sum, d) => sum + d.balance, 0);
    
    // Update total debt remaining for this month's entries
    for (let j = schedule.length - 1; j >= 0; j--) {
      if (schedule[j].month === monthForCalendar && schedule[j].year === yearForCalendar) {
        schedule[j].totalDebtRemaining = totalDebtRemainingEndOfMonth;
      } else {
        break;
      }
    }

    chartData.datasets[0].data.push(totalDebtRemainingEndOfMonth);

    if (totalDebtRemainingEndOfMonth <= 0.005 || currentMonthCount > 12 * 70) {
      if (totalDebtRemainingEndOfMonth <= 0.005) {
        chartData.datasets[0].data[chartData.datasets[0].data.length - 1] = 0;
      }
      break;
    }
  }

  return {
    schedule,
    totalInterest: totalInterestPaidGlobal,
    totalMonths: currentMonthCount,
    chartData
  };
}