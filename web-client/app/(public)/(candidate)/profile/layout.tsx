"use client";

import React from "react";
import { ProfileSidebar } from "@/components/candidates/ProfileSidebar";

const INTER_FONT = "'Inter', sans-serif";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4" style={{ fontFamily: INTER_FONT }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');`}</style>
      <div className="max-w-[1300px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ── LEFT SIDEBAR (3/12) ── */}
        <div className="lg:col-span-3">
          <div className="sticky top-24">
            <ProfileSidebar />
          </div>
        </div>

        {/* ── MAIN CONTENT (9/12) ── */}
        <div className="lg:col-span-9">
          {children}
        </div>
      </div>
    </div>
  );
}
