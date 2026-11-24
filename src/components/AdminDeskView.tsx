import { useEffect, useState, type FormEvent } from 'react';
import { AlertTriangle, Download, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import type {
  AdminStats,
  AuditLogEntry,
  CampusLocationItem,
  CategoryItem,
  ClaimRequest,
  ItemStatus,
  PublicItemReport,
  UserProfile,
} from '../types';
import { ClaimStatusText, ItemStatusText } from './StatusLabel';

interface AdminDeskViewProps {
  user: UserProfile | null;
  onAdminAuthenticated: (token: string, user: UserProfile) => void;
  onDataChanged: () => void;
}

type AdminSection = 'overview' | 'claims' | 'items' | 'taxonomy' | 'users';

const ALL_STATUSES: ItemStatus[] = [
  'Reported',
  'Under Review',
  'Potential Match',
  'Claim Requested',
  'Verified',
  'Returned',
  'Closed',
  'Rejected',
];

export function AdminDeskView({ user, onAdminAuthenticated, onDataChanged }: AdminDeskViewProps) {
  const [adminStatus, setAdminStatus] = useState<{ adminConfigured: boolean; envConfigured: boolean } | null>(null);
  const [authName, setAuthName] = useState('Campus Administrator');
  const [authEmail, setAuthEmail] = useState('admin@campus.edu');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [section, setSection] = useState<AdminSection>('overview');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [items, setItems] = useState<PublicItemReport[]>([]);
  const [claims, setClaims] = useState<ClaimRequest[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [locations, setLocations] = useState<CampusLocationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Handover confirmation modal state (REQ-055)
  const [handoverTarget, setHandoverTarget] = useState<ClaimRequest | null>(null);
  const [handoverChecked, setHandoverChecked] = useState(false);
  const [handoverRemarks, setHandoverRemarks] = useState('');
  const [handoverPickupCode, setHandoverPickupCode] = useState('');
  const [handoverError, setHandoverError] = useState('');

  // Deactivate item confirmation state (Safety §5.2)
  const [deleteTarget, setDeleteTarget] = useState<PublicItemReport | null>(null);

  // Taxonomy form state
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationZone, setNewLocationZone] = useState('Academic blocks and classrooms');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      api
        .getAdminStatus()
        .then(setAdminStatus)
        .catch(() => setAdminStatus({ adminConfigured: true, envConfigured: false }));
    }
  }, [isAdmin]);

  const loadOverview = async () => {
    if (!isAdmin) return;
    setLoading(true);
    setActionError('');
    try {
      const data = await api.getAdminOverview({
        from: fromDate || undefined,
        to: toDate || undefined,
        status: statusFilter,
      });
      setStats(data.stats);
      setItems(data.items);
      setClaims(data.claims);
      setUsers(data.users);
      setAuditLogs(data.auditLogs);
      setCategories(data.categories);
      setLocations(data.locations);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to load admin overview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, fromDate, toDate, statusFilter]);

  const handleAdminClaim = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await api.claimAdmin({ name: authName, email: authEmail, password: authPassword });
      onAdminAuthenticated(res.token, res.user);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Failed to initialize admin credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdminLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await api.loginAdmin({ email: authEmail, password: authPassword });
      onAdminAuthenticated(res.token, res.user);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Invalid administrator credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  if (!isAdmin) {
    const needsFirstRunClaim = adminStatus && !adminStatus.adminConfigured;

    return (
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8">
        <div className="flex items-center gap-2.5 text-blue-900 mb-3">
          <ShieldCheck className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">Administrator Portal</span>
        </div>

        <h1 className="font-display text-2xl font-bold text-slate-900">
          {needsFirstRunClaim ? 'First-Run Admin Setup' : 'Administrator Sign In'}
        </h1>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
          {needsFirstRunClaim
            ? 'No administrator password has been claimed yet. Set your initial admin password to unlock claim verification, item management, and audit logs.'
            : 'Sign in with administrator credentials to review claims, inspect duplicates, and manage campus metadata.'}
        </p>

        {authError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-800">
            {authError}
          </div>
        )}

        <form onSubmit={needsFirstRunClaim ? handleAdminClaim : handleAdminLogin} className="mt-5 space-y-4">
          {needsFirstRunClaim && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Administrator Name</label>
              <input
                type="text"
                required
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-900 focus:outline-none"
              />
            </div>
          )}

          {(!adminStatus?.envConfigured || needsFirstRunClaim) && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Administrator Email</label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-900 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {needsFirstRunClaim
                ? 'Choose Admin Password (min. 8 characters)'
                : adminStatus?.envConfigured
                  ? 'Admin Passcode'
                  : 'Admin Password'}
            </label>
            <input
              type="password"
              required
              minLength={needsFirstRunClaim ? 8 : 1}
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder={needsFirstRunClaim ? 'At least 8 characters' : 'Enter admin password'}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-900 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={authLoading}
            className="w-full rounded-lg bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60 transition-colors cursor-pointer"
          >
            {authLoading
              ? 'Verifying...'
              : needsFirstRunClaim
                ? 'Claim Administrator Access'
                : 'Sign In to Admin Desk'}
          </button>
        </form>
      </div>
    );
  }

  const handleClaimDecision = async (claimId: string, decision: 'approve' | 'reject', remarks?: string) => {
    setActionError('');
    try {
      await api.decideClaim(claimId, { decision, remarks });
      await loadOverview();
      onDataChanged();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to update claim.');
    }
  };

  const handleConfirmHandover = async (e: FormEvent) => {
    e.preventDefault();
    if (!handoverTarget || !handoverChecked) return;
    setActionError('');
    setHandoverError('');
    try {
      await api.decideClaim(handoverTarget.id, {
        decision: 'handover',
        remarks: handoverRemarks,
        confirmHandover: true,
        pickupCode: handoverPickupCode.trim() || undefined,
      });
      setHandoverTarget(null);
      setHandoverChecked(false);
      setHandoverRemarks('');
      setHandoverPickupCode('');
      await loadOverview();
      onDataChanged();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to record handover.';
      setHandoverError(msg);
      setActionError(msg);
    }
  };

  const escapeCsvCell = (value: string | boolean) => {
    const str = String(value ?? '');
    const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
    return `"${safe.replace(/"/g, '""')}"`;
  };

  const handleExportCsv = () => {
    const headers = [
      'Report ID',
      'Type',
      'Title',
      'Category',
      'Location',
      'Date',
      'Status',
      'Suspected Duplicate',
      'Reported By',
    ];
    const rows = items.map((item) =>
      [
        item.reportCode,
        item.type,
        item.title,
        item.category,
        item.location,
        item.date,
        item.status,
        item.suspectedDuplicate ? 'Yes' : 'No',
        item.reporterName,
      ]
        .map(escapeCsvCell)
        .join(',')
    );
    const csvContent = [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `campus-lost-found-reports-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUpdateItemStatus = async (itemId: string, status: ItemStatus) => {
    setActionError('');
    try {
      await api.updateAdminItem(itemId, {
        status,
        confirmReturned: status === 'Returned',
      });
      await loadOverview();
      onDataChanged();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to update item status.');
    }
  };

  const handleClearDuplicate = async (itemId: string) => {
    await api.updateAdminItem(itemId, { clearDuplicate: true });
    await loadOverview();
    onDataChanged();
  };

  const handleConfirmDeactivate = async () => {
    if (!deleteTarget) return;
    await api.deactivateAdminItem(deleteTarget.id);
    setDeleteTarget(null);
    await loadOverview();
    onDataChanged();
  };

  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await api.addCategory(newCategoryName.trim());
      setNewCategoryName('');
      await loadOverview();
      onDataChanged();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to add category.');
    }
  };

  const handleAddLocation = async (e: FormEvent) => {
    e.preventDefault();
    if (!newLocationName.trim()) return;
    try {
      await api.addLocation(newLocationName.trim(), newLocationZone);
      setNewLocationName('');
      await loadOverview();
      onDataChanged();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to add location.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Administrator Operations Desk</h1>
          <p className="mt-1 text-xs text-slate-600">
            Verify ownership claims, resolve suspected duplicates, manage campus categories &amp; locations, and audit actions.
          </p>
        </div>

        <div className="inline-flex flex-wrap gap-1 rounded-lg bg-slate-200/70 p-1">
          {(
            [
              { id: 'overview', label: 'Overview' },
              { id: 'claims', label: `Claims (${claims.filter((c) => c.status === 'Pending').length})` },
              { id: 'items', label: 'Items & Duplicates' },
              { id: 'taxonomy', label: 'Categories & Locations' },
              { id: 'users', label: 'Users & Audit Log' },
            ] as { id: AdminSection; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSection(tab.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                section === tab.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
          {actionError}
        </div>
      )}

      {section === 'overview' && (
        <div className="space-y-6">
          {/* Date & Status Filter Bar (REQ-069) */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end rounded-xl border border-slate-200 bg-white p-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-mono text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-mono text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
              >
                <option value="All">All Statuses</option>
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex sm:justify-end">
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={items.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-blue-900" />
                Export CSV
              </button>
            </div>
          </div>

          {/* 8-metric Dashboard Grid (REQ-068) */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 border border-slate-200 rounded-xl bg-white divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
              <div className="p-5">
                <div className="text-xs text-slate-500">Total Lost Reports</div>
                <div className="mt-1 font-mono text-2xl font-semibold text-slate-900 tabular-nums">{stats.totalLost}</div>
              </div>
              <div className="p-5">
                <div className="text-xs text-slate-500">Total Found Reports</div>
                <div className="mt-1 font-mono text-2xl font-semibold text-slate-900 tabular-nums">{stats.totalFound}</div>
              </div>
              <div className="p-5">
                <div className="text-xs text-slate-500">Under Review</div>
                <div className="mt-1 font-mono text-2xl font-semibold text-amber-700 tabular-nums">{stats.underReview}</div>
              </div>
              <div className="p-5">
                <div className="text-xs text-slate-500">Potential Matches</div>
                <div className="mt-1 font-mono text-2xl font-semibold text-blue-900 tabular-nums">{stats.potentialMatches}</div>
              </div>
              <div className="p-5 border-t border-slate-200">
                <div className="text-xs text-slate-500">Pending Claims</div>
                <div className="mt-1 font-mono text-2xl font-semibold text-amber-700 tabular-nums">{stats.pendingClaims}</div>
              </div>
              <div className="p-5 border-t border-slate-200">
                <div className="text-xs text-slate-500">Returned Items</div>
                <div className="mt-1 font-mono text-2xl font-semibold text-emerald-700 tabular-nums">{stats.returnedItems}</div>
              </div>
              <div className="p-5 border-t border-slate-200">
                <div className="text-xs text-slate-500">Closed Cases</div>
                <div className="mt-1 font-mono text-2xl font-semibold text-slate-700 tabular-nums">{stats.closedCases}</div>
              </div>
              <div className="p-5 border-t border-slate-200">
                <div className="text-xs text-slate-500">Suspected Duplicates</div>
                <div className="mt-1 font-mono text-2xl font-semibold text-red-700 tabular-nums">{stats.suspectedDuplicates}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {section === 'claims' && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="font-display text-lg font-bold text-slate-900">Ownership Claim Verification Queue</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-6 text-sm text-slate-500">Loading claims...</div>
            ) : claims.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No claim requests recorded.</div>
            ) : (
              claims.map((claim) => (
                <div key={claim.id} className="p-6 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                        <span className="font-mono text-blue-900">{claim.claimCode}</span>
                        <span>—</span>
                        <span>{claim.itemTitle}</span>
                        <span className="font-mono text-xs font-normal text-slate-500">({claim.itemReportCode})</span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-600">
                        Claimant: <strong>{claim.claimantName}</strong> ({claim.claimantStudentId}) · {claim.claimantEmail} · Phone: {claim.claimantPhone}
                      </p>
                    </div>
                    <ClaimStatusText status={claim.status} />
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700 space-y-1">
                    <div>
                      <strong>Identifying Details:</strong> {claim.identifyingDetails}
                    </div>
                    <div>
                      <strong>Proof Reference:</strong> {claim.proofReference}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    {claim.status === 'Pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => void handleClaimDecision(claim.id, 'approve')}
                          className="rounded-lg bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 cursor-pointer"
                        >
                          Verify &amp; Approve Claim
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleClaimDecision(claim.id, 'reject')}
                          className="rounded-lg border border-red-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 cursor-pointer"
                        >
                          Reject Claim
                        </button>
                      </>
                    )}
                    {claim.status === 'Approved' && (
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setHandoverTarget(claim);
                            setHandoverChecked(false);
                            setHandoverRemarks('');
                            setHandoverPickupCode('');
                            setHandoverError('');
                          }}
                          className="rounded-lg bg-blue-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 cursor-pointer"
                        >
                          Confirm Physical Handover (Mark Returned)
                        </button>
                        {claim.pickupCode && (
                          <span className="font-mono text-xs text-slate-600">
                            Expected Pickup Code: <strong className="text-slate-900">{claim.pickupCode}</strong>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {section === 'items' && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="font-display text-lg font-bold text-slate-900">
              All Reports &amp; Duplicate Flags ({items.length})
            </h2>
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={items.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-blue-900" />
              Export CSV
            </button>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Report ID</th>
                <th className="px-4 py-3 font-semibold">Item &amp; Location</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Duplicate Flag</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-mono font-semibold text-slate-900 whitespace-nowrap tabular-nums">
                    {item.reportCode}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{item.title}</div>
                    <div className="text-slate-500">
                      {item.category} · {item.location}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">{item.type}</td>
                  <td className="px-4 py-3">
                    <select
                      value={item.status}
                      onChange={(e) => void handleUpdateItemStatus(item.id, e.target.value as ItemStatus)}
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800"
                    >
                      {ALL_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                    <div className="mt-1">
                      <ItemStatusText status={item.status} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {item.suspectedDuplicate ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                          <AlertTriangle className="h-3.5 w-3.5" /> Suspected
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleClearDuplicate(item.id)}
                          className="text-blue-900 hover:underline font-semibold cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400">Clear</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Deactivate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {section === 'taxonomy' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
            <h2 className="font-display text-lg font-bold text-slate-900">Item Categories (REQ-060)</h2>
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                type="text"
                required
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="New category name"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-lg bg-blue-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-800 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </form>
            <div className="divide-y divide-slate-100">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between py-2.5 text-xs">
                  <span className={cat.active ? 'font-semibold text-slate-900' : 'text-slate-400 line-through'}>
                    {cat.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => void api.toggleCategory(cat.id, !cat.active).then(() => { void loadOverview(); onDataChanged(); })}
                    className="rounded-md border border-slate-200 px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    {cat.active ? 'Disable' : 'Enable'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
            <h2 className="font-display text-lg font-bold text-slate-900">Campus Locations (REQ-059)</h2>
            <form onSubmit={handleAddLocation} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  placeholder="Location name (e.g. Auditorium Foyer)"
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-800 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </button>
              </div>
              <select
                value={newLocationZone}
                onChange={(e) => setNewLocationZone(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800"
              >
                <option>Academic blocks and classrooms</option>
                <option>Computer and science laboratories</option>
                <option>Library</option>
                <option>Canteen and common areas</option>
                <option>Parking areas</option>
                <option>Sports ground and activity areas</option>
                <option>Hostel/common residential areas</option>
              </select>
            </form>
            <div className="divide-y divide-slate-100">
              {locations.map((loc) => (
                <div key={loc.id} className="flex items-center justify-between py-2.5 text-xs">
                  <div>
                    <div className={loc.active ? 'font-semibold text-slate-900' : 'text-slate-400 line-through'}>
                      {loc.name}
                    </div>
                    <div className="text-[11px] text-slate-500">{loc.zone}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void api.toggleLocation(loc.id, !loc.active).then(() => { void loadOverview(); onDataChanged(); })}
                    className="rounded-md border border-slate-200 px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    {loc.active ? 'Disable' : 'Enable'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {section === 'users' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="font-display text-lg font-bold text-slate-900">Registered Campus Users (REQ-041 / REQ-042)</h2>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Student / Staff ID</th>
                  <th className="px-4 py-3 font-semibold">Name &amp; Department</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Account State</th>
                  <th className="px-4 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">{u.studentId}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{u.name}</div>
                      <div className="text-slate-500">{u.department}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3 font-semibold">
                      <span className={u.active ? 'text-emerald-700' : 'text-red-700'}>
                        {u.active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => void api.toggleUserActive(u.id, !u.active).then(() => void loadOverview())}
                        className="rounded-md border border-slate-300 px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        {u.active ? 'Suspend' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Audit Trail (REQ-065 to REQ-067) */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="font-display text-lg font-bold text-slate-900">Administrator Audit Trail (REQ-065)</h2>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Timestamp</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Administrator</th>
                  <th className="px-4 py-3 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap tabular-nums">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-800">{log.action}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {log.adminName} ({log.adminEmail})
                    </td>
                    <td className="px-4 py-3 text-slate-600">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Handover Confirmation Modal (REQ-055) */}
      {handoverTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form
            onSubmit={handleConfirmHandover}
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-xl"
          >
            <h3 className="font-display text-lg font-bold text-slate-900">
              Confirm Item Handover · {handoverTarget.itemReportCode}
            </h3>
            <p className="text-xs text-slate-600">
              Confirming handover marks <strong>{handoverTarget.itemTitle}</strong> as{' '}
              <strong>Returned</strong> to claimant <strong>{handoverTarget.claimantName}</strong>.
            </p>
            {handoverError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                {handoverError}
              </div>
            )}
            {handoverTarget.pickupCode && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pickup Verification Code
                </label>
                <input
                  type="text"
                  required
                  value={handoverPickupCode}
                  onChange={(e) => setHandoverPickupCode(e.target.value.toUpperCase())}
                  placeholder="Enter code shown to student (e.g. PU-7429)"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono uppercase tracking-wider text-slate-900 focus:border-blue-900 focus:outline-none"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Handover Notes</label>
              <input
                type="text"
                value={handoverRemarks}
                onChange={(e) => setHandoverRemarks(e.target.value)}
                placeholder="e.g. Verified Campus ID at Student Services Desk"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
              />
            </div>
            <label className="flex items-start gap-2.5 text-xs text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={handoverChecked}
                onChange={(e) => setHandoverChecked(e.target.checked)}
                className="mt-0.5"
              />
              <span>I verify that the claimant presented valid campus identification and received the physical item.</span>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setHandoverTarget(null)}
                className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!handoverChecked}
                className="rounded-lg bg-blue-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 cursor-pointer"
              >
                Mark as Returned
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Deactivate Confirmation Modal (Safety §5.2) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-xl">
            <h3 className="font-display text-lg font-bold text-slate-900">
              Deactivate Report {deleteTarget.reportCode}?
            </h3>
            <p className="text-xs text-slate-600">
              This will remove <strong>{deleteTarget.title}</strong> from public listings and log the administrative action in the audit trail.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDeactivate()}
                className="rounded-lg bg-red-700 px-4 py-2 text-xs font-semibold text-white hover:bg-red-800 cursor-pointer"
              >
                Confirm Deactivation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
