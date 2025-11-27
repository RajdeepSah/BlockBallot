"use client";

import { useRouter, useParams } from 'next/navigation';
import { ResultsView } from '@/components/ResultsView';

/**
 * Results page component for viewing election results.
 * Extracts electionId from URL params and renders ResultsView.
 * 
 * @returns ResultsView component with page-level navigation
 */
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

