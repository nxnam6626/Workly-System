"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle } from "lucide-react";

interface PasswordRequirementsProps {
  password: string;
  visible: boolean;
}

export function PasswordRequirements({ password, visible }: PasswordRequirementsProps) {
  const requirements = [
    { id: "length", label: "Tối thiểu 8 ký tự", met: password.length >= 8 },
    { id: "uppercase", label: "Có ít nhất 1 chữ hoa", met: /[A-Z]/.test(password) },
    { id: "lowercase", label: "Có ít nhất 1 chữ thường", met: /[a-z]/.test(password) },
    { id: "number", label: "Có ít nhất 1 chữ số", met: /[0-9]/.test(password) },
    { id: "special", label: "Có ít nhất 1 ký tự đặc biệt (@$!%*?&)", met: /[@$!%*?&]/.test(password) },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          className="overflow-hidden"
        >
          <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <p className="text-xs font-semibold text-slate-700 mb-2">Mật khẩu của bạn phải có:</p>
            {requirements.map((req) => (
              <div key={req.id} className={`flex items-center gap-2 text-xs transition-colors duration-200 ${req.met ? "text-emerald-600 font-medium" : "text-slate-500"}`}>
                {req.met ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                ) : (
                  <Circle className="w-4 h-4 shrink-0 opacity-50" />
                )}
                <span>{req.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
