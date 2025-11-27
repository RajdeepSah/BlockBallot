"use client";

import { useRouter, useParams } from 'next/navigation';
import { ElectionView } from '@/components/ElectionView';

/**
 * Vote page component for casting votes in an election.
 * Extracts electionId from URL params and renders ElectionView.
 * 
 * @returns ElectionView component with page-level navigation
 */
export default function VotePage() {
  const router = useRouter();
  const params = useParams();
  const electionId = params.electionId as string;

  return (
    <ElectionView
      electionId={electionId}
      onBack={() => router.push('/')}
      onViewResults={(electionId) => router.push(`/results/${electionId}`)}
    />
  );
}

