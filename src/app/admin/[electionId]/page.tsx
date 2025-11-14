"use client";

import { useRouter, useParams } from 'next/navigation';
import { AdminPanel } from '@/components/AdminPanel';

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

