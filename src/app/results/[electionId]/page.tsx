"use client";

import { useRouter, useParams } from 'next/navigation';
import { ResultsView } from '@/components/ResultsView';

export default function ResultsPage() {
  const router = useRouter();
  const params = useParams();
  const electionId = params.electionId as string;

  return (
    <ResultsView
      electionId={electionId}
      onBack={() => router.push('/')}
      onManage={(electionId) => router.push(`/admin/${electionId}`)}
    />
  );
}

