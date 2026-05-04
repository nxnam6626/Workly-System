import React from 'react';
import { TabType } from '@/types/job';

interface JobsTabsProps {
  tabs: { id: TabType; label: string; icon: any; count: number }[];
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  setCurrentPage: (page: number) => void;
}

export const JobsTabs = ({ tabs, activeTab, setActiveTab, setCurrentPage }: JobsTabsProps) => {
  return (
    <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-100 rounded-2xl w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => {
            setActiveTab(tab.id);
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl font-black text-xs transition-all ${
            activeTab === tab.id
              ? 'bg-white text-indigo-600 shadow-md scale-[1.02]'
              : 'text-slate-500 hover:bg-white/50'
          }`}
        >
          <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'}`} />
          <span className="uppercase tracking-wider">{tab.label}</span>
          <span className={`px-2 py-0.5 rounded-md text-[10px] ${
            activeTab === tab.id ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-500'
          }`}>
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
};
