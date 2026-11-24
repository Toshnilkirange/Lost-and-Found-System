import { AlertTriangle, CheckCircle2, Clock, FileCheck2, Search, ShieldCheck, XCircle } from 'lucide-react';
import type { ClaimStatus, ItemStatus } from '../types';

export function ItemStatusText({ status }: { status: ItemStatus }) {
  const config: Record<ItemStatus, { color: string; Icon: typeof Clock }> = {
    Reported: { color: 'text-slate-700', Icon: Clock },
    'Under Review': { color: 'text-amber-700', Icon: Search },
    'Potential Match': { color: 'text-blue-800', Icon: AlertTriangle },
    'Claim Requested': { color: 'text-amber-700', Icon: FileCheck2 },
    Verified: { color: 'text-emerald-700', Icon: ShieldCheck },
    Returned: { color: 'text-emerald-800', Icon: CheckCircle2 },
    Closed: { color: 'text-slate-600', Icon: CheckCircle2 },
    Rejected: { color: 'text-red-700', Icon: XCircle },
  };

  const { color, Icon } = config[status] || config.Reported;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${color}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
}

export function ClaimStatusText({ status }: { status: ClaimStatus }) {
  const config: Record<ClaimStatus, { color: string; Icon: typeof Clock }> = {
    Pending: { color: 'text-amber-700', Icon: Clock },
    Approved: { color: 'text-emerald-700', Icon: ShieldCheck },
    Rejected: { color: 'text-red-700', Icon: XCircle },
    'Handed Over': { color: 'text-emerald-800', Icon: CheckCircle2 },
  };

  const { color, Icon } = config[status] || config.Pending;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${color}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
}
