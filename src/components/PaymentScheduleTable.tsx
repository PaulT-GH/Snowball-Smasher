import React from 'react';
import { PaymentScheduleEntry } from '../types';

interface PaymentScheduleTableProps {
  schedule: PaymentScheduleEntry[];
  currency: string;
}

const PaymentScheduleTable: React.FC<PaymentScheduleTableProps> = ({ schedule, currency }) => {
  let lastDisplayedTotalDebt: number | null = null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse mt-5 text-sm">
        <thead>
          <tr>
            <th className="border border-[#dee2e6] p-3 bg-[#e9ecef] font-semibold text-[#495057] text-left">
              Month
            </th>
            <th className="border border-[#dee2e6] p-3 bg-[#e9ecef] font-semibold text-[#495057] text-left">
              Year
            </th>
            <th className="border border-[#dee2e6] p-3 bg-[#e9ecef] font-semibold text-[#495057] text-left">
              Debt Name
            </th>
            <th className="border border-[#dee2e6] p-3 bg-[#e9ecef] font-semibold text-[#495057] text-right">
              Payment
            </th>
            <th className="border border-[#dee2e6] p-3 bg-[#e9ecef] font-semibold text-[#495057] text-right">
              Interest
            </th>
            <th className="border border-[#dee2e6] p-3 bg-[#e9ecef] font-semibold text-[#495057] text-right">
              Principal
            </th>
            <th className="border border-[#dee2e6] p-3 bg-[#e9ecef] font-semibold text-[#495057] text-right">
              Remaining Balance
            </th>
            <th className="border border-[#dee2e6] p-3 bg-[#e9ecef] font-semibold text-[#495057] text-right">
              Total Debt Remaining
            </th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((entry, index) => {
            const monthName = new Date(0, entry.month - 1).toLocaleString('default', { month: 'long' });
            
            // Determine if we should show total debt
            const isLastEntryForMonthYear = !schedule.some((nextEntry, nextIndex) => 
              nextEntry.month === entry.month && 
              nextEntry.year === entry.year && 
              nextIndex > index
            );

            let totalDebtText = '-';
            if (entry.totalDebtRemaining !== undefined) {
              if (entry.totalDebtRemaining !== lastDisplayedTotalDebt || isLastEntryForMonthYear) {
                totalDebtText = `${currency}${entry.totalDebtRemaining.toFixed(2)}`;
                if (isLastEntryForMonthYear) {
                  lastDisplayedTotalDebt = entry.totalDebtRemaining;
                }
              } else if (lastDisplayedTotalDebt === null) {
                totalDebtText = `${currency}${entry.totalDebtRemaining.toFixed(2)}`;
                lastDisplayedTotalDebt = entry.totalDebtRemaining;
              }
            }

            return (
              <tr key={index}>
                <td className="border border-[#dee2e6] p-3">{monthName}</td>
                <td className="border border-[#dee2e6] p-3">{entry.year}</td>
                <td className="border border-[#dee2e6] p-3">{entry.debtName}</td>
                <td className="border border-[#dee2e6] p-3 text-right">
                  {currency}{entry.payment.toFixed(2)}
                </td>
                <td className="border border-[#dee2e6] p-3 text-right">
                  {currency}{entry.interestPaid.toFixed(2)}
                </td>
                <td className="border border-[#dee2e6] p-3 text-right">
                  {currency}{entry.principalPaid.toFixed(2)}
                </td>
                <td className="border border-[#dee2e6] p-3 text-right">
                  {currency}{entry.remainingBalance.toFixed(2)}
                </td>
                <td className="border border-[#dee2e6] p-3 text-right">{totalDebtText}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentScheduleTable;