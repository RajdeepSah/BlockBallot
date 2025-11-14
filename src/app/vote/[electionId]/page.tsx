"use client";

import { useRouter, useParams } from 'next/navigation';
import { ElectionView } from '@/components/ElectionView';

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

