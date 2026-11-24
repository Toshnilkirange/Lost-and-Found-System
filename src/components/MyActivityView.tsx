import { useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { api } from '../lib/api';
import type { ClaimRequest, NotificationRecord, PublicItemReport, UserProfile } from '../types';
import { ClaimStatusText, ItemStatusText } from './StatusLabel';

interface MyActivityViewProps {
  user: UserProfile | null;
  notifications: NotificationRecord[];
  onRefreshNotifications: () => void;
  onRequireAuth: () => void;
  onSelectItemById: (itemId: string) => void;
  onSelectItem: (item: PublicItemReport) => void;
}

export function MyActivityView({
  user,
  notifications,
  onRefreshNotifications,
  onRequireAuth,
  onSelectItemById,
  onSelectItem,
}: MyActivityViewProps) {
  const [myItems, setMyItems] = useState<PublicItemReport[]>([]);
  const [myClaims, setMyClaims] = useState<ClaimRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([api.getMyItems(), api.getMyClaims()])
      .then(([itemsRes, claimsRes]) => {
        setMyItems(itemsRes.items);
        setMyClaims(claimsRes.claims);
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Your Reports, Claims &amp; Notifications
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Sign in with your campus account to view your submitted lost and found reports, track claim decisions, and manage alerts.
        </p>
        <button
          type="button"
          onClick={onRequireAuth}
          className="mt-6 rounded-lg bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 cursor-pointer"
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  const handleMarkRead = async (id: string) => {
    await api.markNotificationRead(id);
    onRefreshNotifications();
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    onRefreshNotifications();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-8">
      {/* User Profile Header */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">{user.name}</h1>
          <p className="mt-1 text-xs text-slate-600">
            <span className="font-mono font-semibold text-slate-800">{user.studentId}</span>
            <span aria-hidden="true"> · </span>
            <span>{user.department}</span>
            <span aria-hidden="true"> · </span>
            <span>{user.email}</span>
          </p>
        </div>
        <div className="flex items-center gap-6 text-xs">
          <div>
            <span className="block text-slate-500">Submitted Reports</span>
            <span className="font-mono text-lg font-semibold text-slate-900 tabular-nums">{myItems.length}</span>
          </div>
          <div>
            <span className="block text-slate-500">Claim Requests</span>
            <span className="font-mono text-lg font-semibold text-slate-900 tabular-nums">{myClaims.length}</span>
          </div>
          <div>
            <span className="block text-slate-500">Unread Alerts</span>
            <span className="font-mono text-lg font-semibold text-blue-900 tabular-nums">{unreadCount}</span>
          </div>
        </div>
      </section>

      {/* Notifications Section (REQ-028 to REQ-033) */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-slate-600" />
            <h2 className="font-display text-lg font-bold text-slate-900">Notifications</h2>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => void handleMarkAllRead()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-900 hover:underline cursor-pointer"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all as read
            </button>
          )}
        </div>
        <div className="divide-y divide-slate-100">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No notifications yet.</div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 ${
                  n.read ? 'bg-white' : 'bg-blue-50/40'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <span>{n.title}</span>
                    {!n.read && <span className="text-[11px] font-semibold text-blue-900">· Unread</span>}
                  </div>
                  <p className="text-xs text-slate-600">{n.message}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                  {n.relatedItemId && (
                    <button
                      type="button"
                      onClick={() => onSelectItemById(n.relatedItemId!)}
                      className="text-xs font-semibold text-blue-900 hover:underline cursor-pointer"
                    >
                      View Item
                    </button>
                  )}
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => void handleMarkRead(n.id)}
                      className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* My Reports & My Claims */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="font-display text-lg font-bold text-slate-900">My Submitted Reports</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-6 text-sm text-slate-500">Loading your reports...</div>
            ) : myItems.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                You have not submitted any lost or found reports yet.
              </div>
            ) : (
              myItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectItem(item)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      <span className="font-mono">{item.reportCode}</span> · {item.type} · {item.location}
                    </div>
                  </div>
                  <ItemStatusText status={item.status} />
                </button>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="font-display text-lg font-bold text-slate-900">My Ownership Claims</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-6 text-sm text-slate-500">Loading your claims...</div>
            ) : myClaims.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                You have not submitted any ownership claim requests yet.
              </div>
            ) : (
              myClaims.map((claim) => (
                <div key={claim.id} className="px-6 py-4 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{claim.itemTitle}</div>
                      <div className="text-xs text-slate-500 font-mono">
                        {claim.claimCode} · Item {claim.itemReportCode}
                      </div>
                    </div>
                    <ClaimStatusText status={claim.status} />
                  </div>
                  {claim.status === 'Approved' && claim.pickupCode && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5">
                      <div className="text-xs text-emerald-950">
                        <span className="font-semibold block">Digital Handover Pickup Code</span>
                        <span className="text-emerald-800">
                          Present this code and your campus ID at the Student Services Desk.
                        </span>
                      </div>
                      <span className="font-mono text-base font-bold tracking-wider text-emerald-950 tabular-nums shrink-0">
                        {claim.pickupCode}
                      </span>
                    </div>
                  )}
                  {claim.adminRemarks && (
                    <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                      <strong>Admin Remarks:</strong> {claim.adminRemarks}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
