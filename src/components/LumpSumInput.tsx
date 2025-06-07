import React from 'react';

interface LumpSumInputProps {
  id: string;
  amount: number;
  month: number;
  currency: string;
  onUpdate: (id: string, field: string, value: number) => void;
  onRemove: (id: string) => void;
}

const LumpSumInput: React.FC<LumpSumInputProps> = ({
  id,
  amount,
  month,
  currency,
  onUpdate,
  onRemove
}) => {
  const months = [
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
    <div className="border border-dashed border-[#bdc3c7] p-4 mb-4 bg-white rounded">
      <h3 className="text-lg font-semibold text-[#2980b9] mt-0 mb-3">
        Lump Sum {id.replace('lump-', '')}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold text-[#34495e] mb-2">
            Amount ({currency}):
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => onUpdate(id, 'amount', parseFloat(e.target.value) || 0)}
            step="0.01"
            min="0"
            className="w-full p-2 border border-[#ced4da] rounded"
          />
        </div>
        
        <div>
          <label className="block font-semibold text-[#34495e] mb-2">Month:</label>
          <select
            value={month}
            onChange={(e) => onUpdate(id, 'month', parseInt(e.target.value))}
            className="w-full p-2 border border-[#ced4da] rounded"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <button
        onClick={() => onRemove(id)}
        className="mt-3 px-4 py-2 bg-[#e74c3c] hover:bg-[#c0392b] text-white rounded transition-colors"
      >
        Remove
      </button>
    </div>
  );
};

export default LumpSumInput;