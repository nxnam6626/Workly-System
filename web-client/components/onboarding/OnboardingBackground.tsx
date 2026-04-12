'use client';

import React from 'react';

export function OnboardingBackground() {
  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
      <div className="absolute -top-[10%] -left-[10%] w-96 h-96 bg-sky-300/30 rounded-full blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
      <div className="absolute top-[20%] right-[5%] w-72 h-72 bg-fuchsia-300/20 rounded-full blur-3xl animate-[pulse_10s_ease-in-out_infinite] delay-1000" />
      <div className="absolute -bottom-[10%] left-[20%] w-[30rem] h-[30rem] bg-indigo-300/20 rounded-full blur-3xl animate-[pulse_12s_ease-in-out_infinite] delay-2000" />
    </div>
  );
}
