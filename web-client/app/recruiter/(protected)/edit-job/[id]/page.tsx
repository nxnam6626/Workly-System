'use client';

import { Suspense, use } from 'react';
import { Loader2 } from 'lucide-react';
import { PostJobForm } from '@/app/recruiter/(protected)/post-job/page';

interface EditJobPageProps {
  params: Promise<{ id: string }>;
}

export default function EditJobPage({ params }: EditJobPageProps) {
  const { id } = use(params);

  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    }>
      <PostJobForm jobId={id} isDirectEdit={true} />
    </Suspense>
  );
}
