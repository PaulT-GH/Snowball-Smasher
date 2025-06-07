import React from 'react';

interface DebtInputProps {
  id: string;
  name: string;
  balance: number;
  apr: number;
  minPayment: number;
  currency: string;
  onUpdate: (id: string, field: string, value: string | number) => void;
  onRemove?: (id: string) => void;
  isRemovable?: boolean;
}

const DebtInput: React.FC<DebtInputProps> = ({
  id,
  name,
  balance,
  apr,
  minPayment,
  currency,
  onUpdate,
  onRemove,
  isRemovable = false
}) => {
  return (
    <div className="border border-dashed border-[#bdc3c7] p-4 mb-4 bg-white rounded">
      <h3 className="text-lg font-semibold text-[#2980b9] mt-0 mb-3">{name}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold text-[#34495e] mb-2">Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => onUpdate(id, 'name', e.target.value)}
            className="w-full p-2 border border-[#ced4da] rounded"
            required
          />
        </div>
        
        <div>
          <label className="block font-semibold text-[#34495e] mb-2">
            Balance ({currency}):
          </label>
          <input
            type="number"
            value={balance}
            onChange={(e) => onUpdate(id, 'balance', parseFloat(e.target.value) || 0)}
            step="0.01"
            min="0"
            className="w-full p-2 border border-[#ced4da] rounded"
            required
          />
        </div>
        
        <div>
          <label className="block font-semibold text-[#34495e] mb-2">APR (%):</label>
          <input
            type="number"
            value={apr}
            onChange={(e) => onUpdate(id, 'apr', parseFloat(e.target.value) || 0)}
            step="0.01"
            min="0"
            className="w-full p-2 border border-[#ced4da] rounded"
            required
          />
        </div>
        
        <div>
          <label className="block font-semibold text-[#34495e] mb-2">
            Min. Payment ({currency}):
          </label>
          <input
            type="number"
            value={minPayment}
            onChange={(e) => onUpdate(id, 'minPayment', parseFloat(e.target.value) || 0)}
            step="0.01"
            min="0"
            className="w-full p-2 border border-[#ced4da] rounded"
            required
          />
        </div>
      </div>
      
      {isRemovable && onRemove && (
        <button
          onClick={() => onRemove(id)}
          className="mt-3 px-4 py-2 bg-[#e74c3c] hover:bg-[#c0392b] text-white rounded transition-colors"
        >
          Remove
        </button>
      )}
    </div>
  );
};

export default DebtInput;