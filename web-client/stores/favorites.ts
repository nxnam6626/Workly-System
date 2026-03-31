import { create } from 'zustand';
import api from '@/lib/api';

export interface FavoriteJob {
  jobPostingId: string;
  title: string;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  locationCity: string | null;
  company: {
    companyName: string;
    logo: string | null;
  };
}

interface FavoriteState {
  favorites: FavoriteJob[];
  favoriteIds: Set<string>;
  isLoading: boolean;
  isInitialized: boolean;
  fetchFavorites: () => Promise<void>;
  toggleFavorite: (job: any) => Promise<void>;
  clearFavorites: () => void;
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  favorites: [],
  favoriteIds: new Set(),
  isLoading: false,
  isInitialized: false,

  fetchFavorites: async () => {
    // Prevent multiple fetches if already initialized
    if (get().isInitialized && get().favorites.length > 0) return;
    
    set({ isLoading: true });
    try {
      const { data } = await api.get('/favorites/me');
      const favorites = data as FavoriteJob[];
      set({ 
        favorites, 
        favoriteIds: new Set(favorites.map(f => f.jobPostingId)),
        isInitialized: true 
      });
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  toggleFavorite: async (job) => {
    const { favoriteIds, favorites } = get();
    const jobId = job.jobPostingId;
    const isSaved = favoriteIds.has(jobId);

    // Optimistic Update
    const newIds = new Set(favoriteIds);
    let newFavorites = [...favorites];

    if (isSaved) {
      newIds.delete(jobId);
      newFavorites = newFavorites.filter(f => f.jobPostingId !== jobId);
    } else {
      newIds.add(jobId);
      // Construct a FavoriteJob object from the passed job data
      const newFav: FavoriteJob = {
        jobPostingId: jobId,
        title: job.title,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        currency: job.currency,
        locationCity: job.locationCity,
        company: {
          companyName: job.company?.companyName || 'Công ty',
          logo: job.company?.logo || null,
        }
      };
      newFavorites = [newFav, ...newFavorites];
    }

    set({ favoriteIds: newIds, favorites: newFavorites });

    try {
      await api.post(`/favorites/toggle/${jobId}`);
      // Success - state already updated optimistically
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      // Revert on error
      set({ favoriteIds, favorites });
    }
  },

  clearFavorites: () => {
    set({ favorites: [], favoriteIds: new Set(), isInitialized: false });
  }
}));
