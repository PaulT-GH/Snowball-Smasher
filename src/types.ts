export interface Debt {
  id: string;
  name: string;
  balance: number;
  apr: number;
  minPayment: number;
  monthlyInterestRate: number;
  paidOff: boolean;
}

export interface LumpSum {
  id: string;
  amount: number;
  month: number;
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