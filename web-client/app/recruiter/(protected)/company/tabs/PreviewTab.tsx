'use client';

import { motion } from 'framer-motion';
import CompanyProfileView from '@/components/company/CompanyProfileView';

interface PreviewTabProps {
  formData: any;
}

export default function PreviewTab({ formData }: PreviewTabProps) {
  return (
    <motion.div
      key="preview"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative"
    >
      <CompanyProfileView company={formData} isPreview={true} />
    </motion.div>
  );
}
