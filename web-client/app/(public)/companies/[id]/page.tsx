'use client';

import { useState, useEffect, use } from "react";
import { Loader2, Building2 } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import CompanyProfileView from "@/components/company/CompanyProfileView";

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/companies/${id}`);
        setCompany(response.data);
      } catch (err: any) {
        console.error("Failed to fetch company:", err);
        setError(err.response?.data?.message || "Không thể tải thông tin công ty");
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-mariner animate-spin" />
          <p className="text-slate-500 font-medium">Đang tải thông tin doanh nghiệp...</p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md border border-slate-100">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Oops!</h1>
          <p className="text-slate-500 font-medium mb-8">{error || "Công ty không tồn tại"}</p>
          <Link
            href="/companies"
            className="inline-block bg-mariner text-white font-bold px-8 py-3 rounded-full hover:shadow-lg transition-all active:scale-95"
          >
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      <CompanyProfileView company={company} />
    </main>
  );
}
