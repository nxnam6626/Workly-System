import { create } from 'zustand';
import api from '@/lib/api';

interface Wallet {
  walletId: string;
  recruiterId: string;
  balance: number;
  cvUnlockQuota: number;
  cvUnlockQuotaMax: number;
}

interface WalletState {
  wallet: Wallet | null;
  isLoadingWallet: boolean;
  fetchWallet: () => Promise<void>;
  updateBalance: (newBalance: number) => void;
  deductBalance: (amount: number) => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  wallet: null,
  isLoadingWallet: false,

  fetchWallet: async () => {
    set({ isLoadingWallet: true });
    try {
      const response = await api.get('/recruiters/wallet');
      set({ wallet: response.data, isLoadingWallet: false });
    } catch (error) {
      console.error('Lỗi khi tải ví nội bộ:', error);
      set({ wallet: null, isLoadingWallet: false });
    }
  },

  updateBalance: (newBalance: number) => {
    const currentWallet = get().wallet;
    if (currentWallet) {
      set({ wallet: { ...currentWallet, balance: newBalance } });
    }
  },

  deductBalance: (amount: number) => {
    const currentWallet = get().wallet;
    if (currentWallet) {
      set({ wallet: { ...currentWallet, balance: currentWallet.balance - amount } });
    }
  }
}));
