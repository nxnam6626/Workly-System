"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="w-10 h-10 flex items-center justify-center rounded-full border border-blue-500 text-blue-600 disabled:opacity-40 disabled:border-gray-300 disabled:text-gray-400 hover:bg-blue-50 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <span className="text-gray-700 font-medium">
        <span className="text-blue-600 font-bold">{currentPage}</span> / {totalPages} trang
      </span>
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="w-10 h-10 flex items-center justify-center rounded-full border border-blue-500 text-blue-600 disabled:opacity-40 disabled:border-gray-300 disabled:text-gray-400 hover:bg-blue-50 transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
