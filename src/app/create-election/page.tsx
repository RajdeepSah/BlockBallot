"use client";

import { useRouter } from 'next/navigation';
import { CreateElection } from '@/components/CreateElection';

export default function CreateElectionPage() {
  const router = useRouter();

  return (
    <CreateElection
      onBack={() => router.push('/')}
      onSuccess={(electionId) => router.push(`/admin/${electionId}`)}
    />
  );
}

