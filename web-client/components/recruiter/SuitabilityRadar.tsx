'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, CircleDollarSign, Hash, Briefcase, Timer,
  Focus, GraduationCap, Zap, Languages,
  CheckCircle2, XCircle, X
} from 'lucide-react';

interface SuitabilityRadarProps {
  score: number;
  data: Record<string, number>;
  onSelectCriterion: (key: string) => void;
  activeCriterion: string | null;
  size?: number;
}

const CRITERIA = [
  { key: 'location',    label: 'Địa điểm làm việc', icon: MapPin },
  { key: 'salary',      label: 'Mức lương',          icon: CircleDollarSign },
  { key: 'industry',    label: 'Ngành nghề',          icon: Hash },
  { key: 'title',       label: 'Tiêu đề công việc',  icon: Briefcase },
  { key: 'yearsExp',    label: 'Số năm kinh nghiệm', icon: Timer },
  { key: 'relevantExp', label: 'Kinh nghiệm liên quan', icon: Focus },
  { key: 'education',   label: 'Học vấn',             icon: GraduationCap },
  { key: 'skills',      label: 'Kỹ năng',             icon: Zap },
  { key: 'language',    label: 'Ngoại ngữ',           icon: Languages },
];

export const SuitabilityRadar: React.FC<SuitabilityRadarProps> = ({
  score, data, onSelectCriterion, activeCriterion, size = 440
}) => {
  const center = size / 2;
  const radius = (size / 2) * 0.62;
  const n = CRITERIA.length;

  const pts = useMemo(() => CRITERIA.map((c, i) => {
    const angle = (i * 2 * Math.PI / n) - Math.PI / 2;
    const val = Math.max((data[c.key] || 0) / 100, 0.08);
    return {
      x: center + Math.cos(angle) * radius * val,
      y: center + Math.sin(angle) * radius * val,
      lx: center + Math.cos(angle) * (radius + 58),
      ly: center + Math.sin(angle) * (radius + 58),
      ax: center + Math.cos(angle) * radius,
      ay: center + Math.sin(angle) * radius,
      angle,
    };
  }), [data, center, radius, n]);

  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <div className="relative select-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="overflow-visible">
        <defs>
          <radialGradient id="rg" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#06b6d4" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.08" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="b"/>
            <feComposite in="SourceGraphic" in2="b" operator="over"/>
          </filter>
        </defs>

        {/* Grid circles */}
        {[0.25, 0.5, 0.75, 1].map((r, i) => (
          <circle key={i} cx={center} cy={center} r={radius * r}
            fill="none" stroke="#e2e8f0" strokeWidth="0.75"
            strokeDasharray={i < 3 ? '3 4' : undefined} />
        ))}

        {/* Spokes */}
        {pts.map((p, i) => (
          <line key={i} x1={center} y1={center} x2={p.ax} y2={p.ay}
            stroke="#e2e8f0" strokeWidth="0.75" />
        ))}

        {/* Area fill */}
        <motion.path
          initial={{ d: `M ${center} ${center} `.repeat(n) + 'Z', opacity: 0 }}
          animate={{ d: path, opacity: 1 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          fill="url(#rg)" stroke="#38bdf8" strokeWidth="2"
          filter="url(#glow)"
        />

        {/* Nodes */}
        {pts.map((p, i) => {
          const isActive = activeCriterion === CRITERIA[i].key;
          return (
            <motion.circle key={i}
              cx={p.x} cy={p.y} r={isActive ? 7 : 5}
              fill={isActive ? '#0ea5e9' : 'white'}
              stroke={isActive ? '#0284c7' : '#a78bfa'}
              strokeWidth="2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6 + i * 0.05 }}
              style={{ cursor: 'pointer', filter: isActive ? 'drop-shadow(0 0 6px #38bdf8)' : undefined }}
            />
          );
        })}
      </svg>

      {/* Center score */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white/95 backdrop-blur-lg rounded-full flex flex-col items-center justify-center shadow-xl border border-slate-100"
          style={{ width: 100, height: 100 }}
        >
          <span className="text-[2rem] font-black text-slate-900 leading-none">{score}%</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Phù hợp</span>
        </motion.div>
      </div>

      {/* Labels */}
      {pts.map((p, i) => {
        const c = CRITERIA[i];
        const Icon = c.icon;
        const isActive = activeCriterion === c.key;
        const val = data[c.key] || 0;
        const color = val >= 70 ? '#10b981' : val >= 40 ? '#f59e0b' : '#f43f5e';

        return (
          <motion.button
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 + i * 0.06 }}
            onClick={() => onSelectCriterion(c.key)}
            className="absolute flex flex-col items-center gap-1 w-24 group"
            style={{ left: p.lx, top: p.ly, transform: 'translate(-50%, -50%)' }}
          >
            <div className={`p-2 rounded-xl border transition-all duration-200 shadow-sm
              ${isActive
                ? 'bg-sky-500 border-sky-400 shadow-sky-200 scale-110'
                : 'bg-white border-slate-200 group-hover:border-sky-200 group-hover:shadow-sky-100'}`}>
              <Icon size={13} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-sky-500'} />
            </div>
            <span className={`text-[9.5px] font-black text-center leading-tight transition-colors
              ${isActive ? 'text-sky-600' : 'text-slate-600 group-hover:text-sky-500'}`}>
              {c.label}
            </span>
            <span className="text-[9px] font-bold" style={{ color }}>
              {Math.round(val)}%
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};
