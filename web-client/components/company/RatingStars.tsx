import React from 'react';
import { Star, StarHalf } from 'lucide-react';

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
        const isFull = starValue <= Math.floor(rating);
        const isHalf = !isFull && starValue === Math.ceil(rating) && rating % 1 !== 0;

        if (isFull) {
          return (
            <Star
              key={i}
              size={size}
              className={`fill-amber-400 text-amber-400 ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
              onClick={() => interactive && onRatingChange?.(starValue)}
            />
          );
        } else if (isHalf) {
          return (
            <StarHalf
              key={i}
              size={size}
              className={`fill-amber-400 text-amber-400 ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
              onClick={() => interactive && onRatingChange?.(starValue)}
            />
          );
        } else {
          return (
            <Star
              key={i}
              size={size}
              className={`text-slate-200 fill-slate-200 ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
              onClick={() => interactive && onRatingChange?.(starValue)}
            />
          );
        }
      })}
    </div>
  );
}
