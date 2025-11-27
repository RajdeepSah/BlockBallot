"use client";

import { useRouter, useParams } from 'next/navigation';
import { AdminPanel } from '@/components/AdminPanel';

/**
 * Admin page component for managing an election.
 * Extracts electionId from URL params and renders AdminPanel.
 * 
 * @returns AdminPanel component with page-level navigation
 */
export default function AdminPage() {
  const router = useRouter();
  const params = useParams();
  const electionId = params.electionId as string;

  return (
    <AdminPanel
      electionId={electionId}
      onBack={() => router.push('/')}
      onViewResults={(electionId) => router.push(`/results/${electionId}`)}
    />
  );
}

