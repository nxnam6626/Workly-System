import api from './api';

export interface CandidateWallet {
  walletId: string;
  candidateId: string;
  balance: number;
  updatedAt: string;
  jobSearchExpiresAt: string | null;
}

export const getWalletBalance = async (): Promise<CandidateWallet> => {
  const { data } = await api.get('/candidate-wallets/balance');
  return data;
};

export const topUpWallet = async (amount: number): Promise<{ checkoutUrl: string }> => {
  const { data } = await api.post('/candidate-wallets/top-up', { amount });
  return data;
};

export const activateJobSearch = async (): Promise<{ 
  message: string; 
  newExpiry: string; 
  newBalance: number 
}> => {
  const { data } = await api.post('/candidate-wallets/activate-job-search');
  return data;
};

export const getTransactions = async (skip = 0, take = 10) => {
  const { data } = await api.get(`/candidate-wallets/transactions?skip=${skip}&take=${take}`);
  return data;
};
