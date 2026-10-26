import { Debt, LumpSum, PaymentScheduleEntry, ChartData } from '../types';

export const isLoan = (debt: Debt) => debt.id.startsWith('unsecured-');

// Monthly rate that makes `payment` clear `balance` in exactly `term` payments (bisection).
function impliedMonthlyRate(balance: number, payment: number, term: number): number {
  if (payment * term <= balance) return 0;
  let low = 0;
  let high = 1;
  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    const presentValue = payment * (1 - Math.pow(1 + mid, -term)) / mid;
    if (presentValue > balance) low = mid; else high = mid;
  }
  return (low + high) / 2;
}

// What a debt is due to pay this month, before any extra payments are added on top.
function scheduledPayment(debt: Debt): number {
  if (!isLoan(debt) && debt.repayMode === 'pct') {
    return Math.max(debt.repayFloor, debt.balance * debt.repayPct / 100);
  }
  return debt.minPayment;
}

export function calculatePayoffSchedule(
  debts: Debt[],
  strategy: string,
  extraMonthlyPayment: number,
  bonusAmount: number,
  bonusMonth: number,
  lumpSums: LumpSum[],
  startMonth: number,
  startYear: number
): {
  schedule: PaymentScheduleEntry[];
  totalInterest: number;
  totalMonths: number;
  chartData: ChartData;
} {
  // Create deep copy of debts to avoid mutating original
  const allDebts = debts.map(debt => {
    const copy = { ...debt };
    if (isLoan(copy) && copy.apr <= 0 && copy.term > 0) {
      // APR not known: work it out from the balance, payment and term
      const rate = impliedMonthlyRate(copy.balance, copy.minPayment, copy.term);
      copy.apr = rate * 12 * 100;
      copy.monthlyInterestRate = rate;
    } else {
      copy.monthlyInterestRate = copy.apr / 12 / 100;
    }
    return copy;
  });

  // Cards are ordered by the selected strategy
  const cards = allDebts.filter(d => !isLoan(d));
  const loans = allDebts.filter(d => isLoan(d));
  if (strategy === 'snowball') {
    cards.sort((a, b) => a.balance - b.balance);
  } else if (strategy === 'avalanche') {
    cards.sort((a, b) => {
      if (b.apr === a.apr) {
        return a.balance - b.balance;
      }
      return b.apr - a.apr;
    });
  }
  // Each loan goes ahead of any card with a lower APR, and behind cards with an equal or higher APR
  loans.sort((a, b) => b.apr - a.apr).forEach(loan => {
    const idx = cards.findIndex(c => c.apr < loan.apr);
    if (idx === -1) cards.push(loan); else cards.splice(idx, 0, loan);
  });
  const workingDebts = cards;

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

  let currentMonthCount = 0;
  let totalInterestPaidGlobal = 0;
  // The first month's combined payments (plus any extra monthly payment) are the monthly budget.
  // It stays the same every month, so money freed as balances fall or debts clear rolls onto the target debt.
  let monthlyBudget = 0;

  while (workingDebts.some(debt => !debt.paidOff)) {
    currentMonthCount++;
    
    // Calculate the actual calendar month and year
    const monthsFromStart = currentMonthCount - 1;
    const monthForCalendar = ((startMonth - 1 + monthsFromStart) % 12) + 1;
    const yearForCalendar = startYear + Math.floor((startMonth - 1 + monthsFromStart) / 12);

    chartData.labels.push(
      `${new Date(0, monthForCalendar - 1).toLocaleString('default', { month: 'short' })} ${yearForCalendar}`
    );

    // Accrue interest
    workingDebts.forEach(debt => {
      if (!debt.paidOff) {
        debt.interestThisMonth = debt.balance * debt.monthlyInterestRate;
        debt.balance += debt.interestThisMonth;
        totalInterestPaidGlobal += debt.interestThisMonth;
      }
    });

    const activeDebts = workingDebts.filter(d => !d.paidOff);

    if (currentMonthCount === 1) {
      monthlyBudget = activeDebts.reduce((sum, d) => sum + scheduledPayment(d), 0) + extraMonthlyPayment;
    }

    let available = monthlyBudget;
    if (bonusAmount > 0 && bonusMonth === monthForCalendar) {
      available += bonusAmount;
    }
    lumpSums.forEach(ls => {
      if (ls.month === monthForCalendar && ls.year === yearForCalendar) {
        available += ls.amount;
      }
    });

    // Every debt gets its scheduled payment first (never more than it owes)
    const payments = new Map<Debt, number>();
    activeDebts.forEach(debt => {
      const payment = Math.min(debt.balance, scheduledPayment(debt));
      payments.set(debt, payment);
      available -= payment;
    });

    // Everything left goes to the first debt in priority order, then the next once it is cleared
    for (const debt of activeDebts) {
      if (available <= 0) break;
      const extra = Math.min(available, debt.balance - (payments.get(debt) ?? 0));
      payments.set(debt, (payments.get(debt) ?? 0) + extra);
      available -= extra;
    }

    for (const debt of activeDebts) {
      const paymentAmount = payments.get(debt) ?? 0;

      // Interest is cleared first, the rest of the payment reduces principal
      const interestPaidThisPayment = Math.min(paymentAmount, debt.interestThisMonth ?? 0);
      const principalPaidThisPayment = paymentAmount - interestPaidThisPayment;
      debt.balance -= paymentAmount;

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
        debt.paidOff = true;
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
