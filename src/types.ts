export interface Debt {
  id: string;
  name: string;
  balance: number;
  apr: number;
  minPayment: number; // Fixed monthly payment: a loan's payment, or a card repaid as a fixed amount
  repayMode: 'pct' | 'fixed'; // Cards only
  repayPct: number; // Cards only: % of the current balance paid each month
  repayFloor: number; // Cards only: lowest monthly payment in percentage mode
  term: number; // Loans only: months remaining, used to work out an unknown APR
  monthlyInterestRate: number;
  paidOff: boolean;
  interestThisMonth?: number;
}

export interface LumpSum {
  id: string;
  amount: number;
  month: number;
  year: number;
}

export interface PaymentScheduleEntry {
  month: number;
  year: number;
  debtName: string;
  payment: number;
  interestPaid: number;
  principalPaid: number;
  remainingBalance: number;
  totalDebtRemaining?: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
    fill: boolean;
  }[];
}