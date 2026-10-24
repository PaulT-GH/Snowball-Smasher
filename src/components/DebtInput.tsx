import React from 'react';

interface DebtInputProps {
  id: string;
  name: string;
  balance: number;
  apr: number;
  minPayment: number;
  repayMode: 'pct' | 'fixed';
  repayPct: number;
  repayFloor: number;
  term: number;
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
  repayMode,
  repayPct,
  repayFloor,
  term,
  currency,
  onUpdate,
  onRemove,
  isRemovable = false
}) => {
  const isCard = id.startsWith('card-');
  const inputClass = 'w-full p-2 border border-[#ced4da] rounded';
  const labelClass = 'block font-semibold text-[#34495e] mb-2';

  return (
    <div className="border border-dashed border-[#bdc3c7] p-4 mb-4 bg-white rounded">
      <h3 className="text-lg font-semibold text-[#2980b9] mt-0 mb-3">{name}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => onUpdate(id, 'name', e.target.value)}
            className={inputClass}
            required
          />
        </div>
        
        <div>
          <label className={labelClass}>
            Balance ({currency}):
          </label>
          <input
            type="number"
            value={balance}
            onChange={(e) => onUpdate(id, 'balance', parseFloat(e.target.value) || 0)}
            step="0.01"
            min="0"
            className={inputClass}
            required
          />
        </div>
        
        <div>
          <label className={labelClass}>APR (%){isCard ? ':' : ' (optional):'}</label>
          <input
            type="number"
            value={apr}
            onChange={(e) => onUpdate(id, 'apr', parseFloat(e.target.value) || 0)}
            step="0.01"
            min="0"
            className={inputClass}
            required={isCard}
          />
          {!isCard && (
            <p className="text-sm text-[#7f8c8d] mt-1">Leave at 0 if unknown: it's worked out from the balance, payment and term.</p>
          )}
        </div>

        {!isCard && (
          <>
            <div>
              <label className={labelClass}>
                Monthly Payment ({currency}):
              </label>
              <input
                type="number"
                value={minPayment}
                onChange={(e) => onUpdate(id, 'minPayment', parseFloat(e.target.value) || 0)}
                step="0.01"
                min="0"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Term Remaining (months):</label>
              <input
                type="number"
                value={term}
                onChange={(e) => onUpdate(id, 'term', parseInt(e.target.value) || 0)}
                step="1"
                min="0"
                className={inputClass}
              />
            </div>
          </>
        )}
      </div>

      {isCard && (
        <div className="mt-4">
          <div className="flex flex-wrap gap-6 mb-3">
            <label className="font-semibold text-[#34495e]">
              <input
                type="radio"
                name={`${id}-repayMode`}
                checked={repayMode === 'pct'}
                onChange={() => onUpdate(id, 'repayMode', 'pct')}
                className="mr-2"
              />
              Repay as percentage
            </label>
            <label className="font-semibold text-[#34495e]">
              <input
                type="radio"
                name={`${id}-repayMode`}
                checked={repayMode === 'fixed'}
                onChange={() => onUpdate(id, 'repayMode', 'fixed')}
                className="mr-2"
              />
              Repay as fixed amount
            </label>
          </div>

          {repayMode === 'pct' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>% of balance each month:</label>
                <input
                  type="number"
                  value={repayPct}
                  onChange={(e) => onUpdate(id, 'repayPct', parseFloat(e.target.value) || 0)}
                  step="0.01"
                  min="0"
                  max="100"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Minimum floor ({currency}):</label>
                <input
                  type="number"
                  value={repayFloor}
                  onChange={(e) => onUpdate(id, 'repayFloor', parseFloat(e.target.value) || 0)}
                  step="0.01"
                  min="0"
                  className={inputClass}
                />
              </div>
            </div>
          ) : (
            <div>
              <label className={labelClass}>
                Monthly Payment ({currency}):
              </label>
              <input
                type="number"
                value={minPayment}
                onChange={(e) => onUpdate(id, 'minPayment', parseFloat(e.target.value) || 0)}
                step="0.01"
                min="0"
                className="w-full md:w-1/2 p-2 border border-[#ced4da] rounded"
              />
            </div>
          )}
        </div>
      )}
      
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
