import { Debt, LumpSum } from '../types';

export interface SavedData {
  selectedCurrency: string;
  payoffStrategy: string;
  numCreditCards: number;
  debts: Debt[];
  lumpSums: LumpSum[];
  extraMonthlyPayment: number;
  annualBonusAmount: number;
  annualBonusMonth: number;
}

export function saveToLocalStorage(data: SavedData): void {
  try {
    localStorage.setItem('debtPayoffData', JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save data:', error);
    throw new Error('Failed to save data to local storage');
  }
}

export function loadFromLocalStorage(): SavedData | null {
  try {
    const savedData = localStorage.getItem('debtPayoffData');
    if (!savedData) return null;
    return JSON.parse(savedData);
  } catch (error) {
    console.error('Failed to load data:', error);
    return null;
  }
}

export function clearLocalStorage(): void {
  try {
    localStorage.removeItem('debtPayoffData');
  } catch (error) {
    console.error('Failed to clear data:', error);
  }
}