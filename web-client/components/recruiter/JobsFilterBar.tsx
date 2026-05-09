import React from 'react';
import { Search, Calendar } from 'lucide-react';

interface JobsFilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  dateFrom: string;
  setDateFrom: (date: string) => void;
  dateTo: string;
  setDateTo: (date: string) => void;
  itemsPerPage: number;
  setItemsPerPage: (count: number) => void;
  setCurrentPage: (page: number) => void;
  fetchJobs: () => void;
  startItem: number;
  endItem: number;
  totalItems: number;
}

export const JobsFilterBar = ({
  searchQuery,
  setSearchQuery,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  itemsPerPage,
  setItemsPerPage,
  setCurrentPage,
  fetchJobs,
  startItem,
  endItem,
  totalItems
}: JobsFilterBarProps) => {
  return (
    <div className="space-y-6">
      {/* Search & Date Filter */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-4 shadow-2xl shadow-slate-200/50 border border-white/50">
        <div className="flex flex-col lg:flex-row items-center gap-4">
          <div className="flex-1 w-full relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm kiếm theo chức danh hoặc từ khóa..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-bold text-sm text-slate-800 placeholder:text-slate-400 placeholder:font-medium shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border-2 border-transparent focus-within:border-indigo-500/10 focus-within:bg-white transition-all shrink-0">
            <div className="flex items-center gap-2 px-3 border-r border-slate-200">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-[10px] font-black uppercase text-slate-500 whitespace-nowrap">Từ</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-xs text-slate-800 w-32 focus:ring-0"
              />
            </div>
            <div className="flex items-center gap-2 px-3">
              <span className="text-[10px] font-black uppercase text-slate-500 whitespace-nowrap">Đến</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-xs text-slate-800 w-32 focus:ring-0"
              />
            </div>
          </div>

          <button
            onClick={() => fetchJobs()}
            className="w-full lg:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl font-black text-sm transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-2 uppercase tracking-wider whitespace-nowrap active:scale-95 shrink-0"
          >
            <Search className="w-4 h-4" /> TÌM KIẾM
          </button>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-end items-center gap-6 px-2">
        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-black uppercase tracking-wider">
          Hiển thị
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-slate-50 border-2 border-slate-100 rounded-lg focus:ring-0 font-black text-slate-800 p-1 text-[11px] outline-none"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
        <div className="text-[11px] text-slate-500 font-black uppercase tracking-wider">
          Hiển thị <span className="text-indigo-600">{startItem} - {endItem}</span> của <span className="text-slate-900">{totalItems}</span> việc làm
        </div>
      </div>
    </div>
  );
};
