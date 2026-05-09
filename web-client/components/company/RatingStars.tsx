import React from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  onRatingChange?: (rating: number) => void;
  size?: number;
  interactive?: boolean;
}

export default function RatingStars({ 
  rating, 
  maxRating = 5, 
  onRatingChange, 
  size = 20,
  interactive = false 
}: RatingStarsProps) {
  return (
    <div className="flex gap-1">
      {[...Array(maxRating)].map((_, i) => {
        const starValue = i + 1;
        return (
          <Star
            key={i}
            size={size}
            className={`${
              starValue <= rating 
                ? 'fill-amber-400 text-amber-400' 
                : 'text-slate-200 fill-slate-200'
            } ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onClick={() => interactive && onRatingChange?.(starValue)}
          />
        );
      })}
    </div>
  );
}
