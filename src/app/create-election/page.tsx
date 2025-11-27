"use client";

import { useRouter } from 'next/navigation';
import { CreateElection } from '@/components/CreateElection';

/**
 * Create election page component.
 * Wraps CreateElection component with navigation callbacks.
 * 
 * @returns CreateElection component with page-level navigation
 */
export default function CreateElectionPage() {
  const router = useRouter();

  return (
    <CreateElection
      onBack={() => router.push('/')}
      onSuccess={(electionId) => router.push(`/admin/${electionId}`)}
    />
  );
}

