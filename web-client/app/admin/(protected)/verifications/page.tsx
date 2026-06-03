import { redirect } from 'next/navigation';

export default function VerificationsPage() {
  redirect('/admin/candidates?filter=pending_verifications');
}
