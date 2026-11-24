import { useEffect, useState, type FormEvent } from 'react';
import { Check, MessageSquare, PackageSearch, Printer, QrCode, X } from 'lucide-react';
import { api } from '../lib/api';
import type { ItemInquiry, ItemStatus, PublicItemReport, UserProfile } from '../types';
import { ItemStatusText } from './StatusLabel';

interface ItemDetailModalProps {
  item: PublicItemReport | null;
  user: UserProfile | null;
  onClose: () => void;
  onRequireAuth: () => void;
  onClaimSubmitted: () => void;
  onSelectItem: (item: PublicItemReport) => void;
}

const LIFECYCLE_STAGES: ItemStatus[] = [
  'Reported',
  'Under Review',
  'Potential Match',
  'Claim Requested',
  'Verified',
  'Returned',
  'Closed',
];

function DeskQrMatrix({ code }: { code: string }) {
  const size = 9;
  const isFinder = (r: number, c: number) =>
    (r < 3 && c < 3) || (r < 3 && c >= size - 3) || (r >= size - 3 && c < 3);

  const cells: Array<{ r: number; c: number; filled: boolean }> = [];
  let seed = 0;
  for (let i = 0; i < code.length; i++) {
    seed = (seed * 31 + code.charCodeAt(i)) % 997;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      let filled = false;
      if (isFinder(r, c)) {
        const localR = r < 3 ? r : r - (size - 3);
        const localC = c < 3 ? c : c - (size - 3);
        filled = localR === 0 || localR === 2 || localC === 0 || localC === 2 || (localR === 1 && localC === 1);
      } else {
        const hash = (seed + r * 17 + c * 29 + r * c * 7) % 11;
        filled = hash < 6;
      }
      cells.push({ r, c, filled });
    }
  }

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="h-20 w-20 shrink-0 rounded-md border border-slate-200 bg-white p-1.5"
      role="img"
      aria-label={`Desk tag matrix for ${code}`}
    >
      {cells
        .filter((cell) => cell.filled)
        .map((cell) => (
          <rect key={`${cell.r}-${cell.c}`} x={cell.c} y={cell.r} width={0.92} height={0.92} fill="#0F172A" />
        ))}
    </svg>
  );
}

export function ItemDetailModal({
  item,
  user,
  onClose,
  onRequireAuth,
  onClaimSubmitted,
  onSelectItem,
}: ItemDetailModalProps) {
  const [detail, setDetail] = useState<PublicItemReport | null>(item);
  const [matches, setMatches] = useState<PublicItemReport[]>([]);
  const [inquiries, setInquiries] = useState<ItemInquiry[]>([]);
  const [identifyingDetails, setIdentifyingDetails] = useState('');
  const [proofReference, setProofReference] = useState('');
  const [claimantPhone, setClaimantPhone] = useState(user?.phone || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [showQrTag, setShowQrTag] = useState(false);
  const [inquiryText, setInquiryText] = useState('');
  const [postingInquiry, setPostingInquiry] = useState(false);
  const [inquiryError, setInquiryError] = useState('');

  useEffect(() => {
    setDetail(item);
    setMatches([]);
    setInquiries([]);
    setError('');
    setSuccessMsg('');
    setIdentifyingDetails('');
    setProofReference('');
    setClaimantPhone(user?.phone || '');
    setShowQrTag(false);
    setInquiryText('');
    setInquiryError('');

    if (!item) return;
    api
      .getItemDetail(item.id)
      .then((res) => {
        setDetail(res.item);
        setMatches(res.suggestedMatches);
        setInquiries(res.inquiries || []);
      })
      .catch(() => {
        // Keep passed item if refresh fails
      });
  }, [item, user?.phone]);

  if (!detail) return null;

  const currentStageIdx = LIFECYCLE_STAGES.indexOf(detail.status);
  const canClaim =
    detail.type === 'Found' &&
    detail.status !== 'Returned' &&
    detail.status !== 'Closed' &&
    detail.status !== 'Rejected';

  const handleSubmitClaim = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      onRequireAuth();
      return;
    }
    setError('');
    setSuccessMsg('');
    setSubmitting(true);
    try {
      const res = await api.submitClaim({
        itemId: detail.id,
        identifyingDetails,
        proofReference,
        claimantPhone,
      });
      setSuccessMsg(
        `Claim ${res.claim.claimCode} submitted for administrator verification. You will be notified once reviewed.`
      );
      setIdentifyingDetails('');
      setProofReference('');
      const updated = await api.getItemDetail(detail.id);
      setDetail(updated.item);
      setInquiries(updated.inquiries || []);
      onClaimSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit claim request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostInquiry = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      onRequireAuth();
      return;
    }
    if (!inquiryText.trim()) return;
    setInquiryError('');
    setPostingInquiry(true);
    try {
      const res = await api.postInquiry(detail.id, inquiryText.trim());
      setInquiries((prev) => [...prev, res.inquiry]);
      setInquiryText('');
    } catch (err) {
      setInquiryError(err instanceof Error ? err.message : 'Unable to post desk inquiry.');
    } finally {
      setPostingInquiry(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="item-detail-title"
    >
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span className="font-mono font-semibold text-slate-900">{detail.reportCode}</span>
            <span aria-hidden="true">·</span>
            <span>{detail.type} Report</span>
            <span aria-hidden="true">·</span>
            <ItemStatusText status={detail.status} />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowQrTag((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <QrCode className="h-3.5 w-3.5 text-blue-900" />
              {showQrTag ? 'Hide Desk Tag' : 'Desk QR Tag'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
              aria-label="Close item details"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Top Overview */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-5 aspect-[4/3] rounded-xl border border-slate-200 bg-slate-100 overflow-hidden">
              {detail.imageUrl ? (
                <img
                  src={detail.imageUrl}
                  alt={detail.title}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center text-slate-400 p-4">
                  <PackageSearch className="h-10 w-10 mb-2 stroke-[1.5]" />
                  <span className="text-xs text-slate-500">No photograph attached</span>
                </div>
              )}
            </div>

            <div className="md:col-span-7 space-y-4">
              <div>
                <h2 id="item-detail-title" className="font-display text-2xl font-bold text-slate-900">
                  {detail.title}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {detail.category} · {detail.location} ·{' '}
                  <span className="font-mono tabular-nums">{detail.date}</span>
                </p>
              </div>

              <p className="text-sm leading-relaxed text-slate-700">{detail.description}</p>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Reported By</span>
                  <span className="font-semibold text-slate-800">{detail.reporterName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Privacy Policy</span>
                  <span className="text-slate-700">Contact details protected until verification</span>
                </div>
              </div>
            </div>
          </div>

          {/* Expandable Campus Desk QR / Printable Tag */}
          {showQrTag && (
            <div className="rounded-xl border border-slate-300 bg-slate-50 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <DeskQrMatrix code={detail.reportCode} />
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Campus Student Services · Desk Property Tag
                  </div>
                  <div className="font-mono text-base font-bold text-slate-900 tabular-nums">
                    {detail.reportCode} · {detail.type.toUpperCase()}
                  </div>
                  <div className="text-xs font-semibold text-slate-800">{detail.title}</div>
                  <div className="text-xs text-slate-600">
                    {detail.category} · {detail.location} · <span className="font-mono">{detail.date}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 shrink-0 cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Tag
              </button>
            </div>
          )}

          {/* Item Status Lifecycle (SRS §4.8) */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Status Lifecycle</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {LIFECYCLE_STAGES.map((stage, idx) => {
                const reached = currentStageIdx >= idx;
                const isCurrent = detail.status === stage;
                return (
                  <div
                    key={stage}
                    className={`rounded-lg border px-2.5 py-2 text-xs ${
                      isCurrent
                        ? 'border-blue-900 bg-blue-50/70 text-blue-950 font-semibold'
                        : reached
                          ? 'border-emerald-200 bg-emerald-50/50 text-emerald-900'
                          : 'border-slate-200 bg-slate-50 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {reached && <Check className="h-3 w-3 shrink-0" />}
                      <span className="truncate">{stage}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Audit/Status History */}
            <div className="mt-4 space-y-2">
              {detail.statusHistory.map((entry, i) => (
                <div key={i} className="flex items-baseline justify-between gap-4 text-xs text-slate-600">
                  <span>
                    <strong className="text-slate-800">{entry.status}</strong> — {entry.note}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400 whitespace-nowrap tabular-nums">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Potential Matches (SRS §4.9) */}
          {matches.length > 0 && (
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-sm font-bold text-slate-900 mb-3">
                Potential Matching {detail.type === 'Lost' ? 'Found' : 'Lost'} Reports
              </h3>
              <div className="space-y-2">
                {matches.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onSelectItem(m)}
                    className="w-full flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left hover:border-blue-900 transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{m.title}</div>
                      <div className="text-xs text-slate-500">
                        <span className="font-mono">{m.reportCode}</span> · {m.location} ·{' '}
                        <span className="font-mono">{m.date}</span>
                      </div>
                    </div>
                    <ItemStatusText status={m.status} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Controlled Desk Inquiries (REQ-064 Privacy-Safe Q&A) */}
          <div className="border-t border-slate-200 pt-6 space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-900" />
                <h3 className="text-sm font-bold text-slate-900">Controlled Desk Inquiries</h3>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Ask clarifying questions without exposing personal email or phone numbers (REQ-064).
              </p>
            </div>

            {inquiries.length > 0 ? (
              <div className="space-y-2.5">
                {inquiries.map((inq) => (
                  <div key={inq.id} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-800">
                        {inq.senderLabel}
                        {inq.senderRole === 'admin' && (
                          <span className="ml-1.5 text-blue-900 font-semibold">· Desk Staff</span>
                        )}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                        {new Date(inq.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{inq.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No desk inquiries logged on this record yet.</p>
            )}

            {user ? (
              <form onSubmit={handlePostInquiry} className="space-y-2">
                {inquiryError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                    {inquiryError}
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    required
                    minLength={4}
                    maxLength={400}
                    value={inquiryText}
                    onChange={(e) => setInquiryText(e.target.value)}
                    placeholder="Ask a clarifying question (e.g. sticker color, desk shelf location)..."
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-900 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={postingInquiry || inquiryText.trim().length < 4}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap cursor-pointer"
                  >
                    {postingInquiry ? 'Sending...' : 'Post Inquiry'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-600">
                <span>Sign in with your campus account to post a clarifying inquiry.</span>
                <button
                  type="button"
                  onClick={onRequireAuth}
                  className="font-semibold text-blue-900 hover:underline whitespace-nowrap cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>

          {/* Claim Request Form (SRS §4.4 & §4.10) */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-sm font-bold text-slate-900">Ownership Claim Verification</h3>
            {detail.type === 'Lost' ? (
              <p className="mt-1.5 text-sm text-slate-600">
                This is a Lost Item report. If you found this item, use <strong>Report Item</strong> to submit a Found Item listing so the system can link and notify the owner.
              </p>
            ) : !canClaim ? (
              <p className="mt-1.5 text-sm text-slate-600">
                This item is currently marked <strong>{detail.status}</strong> and is closed for new claim submissions.
              </p>
            ) : !user ? (
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-700">
                  Sign in with your campus account to submit private ownership proof for this found item.
                </p>
                <button
                  type="button"
                  onClick={onRequireAuth}
                  className="rounded-lg bg-blue-900 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Sign In to Claim
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitClaim} className="mt-4 space-y-4">
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-800">
                    {error}
                  </div>
                )}
                {successMsg && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800">
                    {successMsg}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Identifying Details (Kept Private for Admin Verification)
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={identifyingDetails}
                    onChange={(e) => setIdentifyingDetails(e.target.value)}
                    placeholder="Describe unique marks, contents, lock screen, initials, or serial number..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-900 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Proof / Receipt Reference (Optional)
                    </label>
                    <input
                      type="text"
                      value={proofReference}
                      onChange={(e) => setProofReference(e.target.value)}
                      placeholder="e.g. Serial # / Invoice / Student ID card"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Contact Phone for Handover
                    </label>
                    <input
                      type="tel"
                      value={claimantPhone}
                      onChange={(e) => setClaimantPhone(e.target.value)}
                      placeholder="Mobile number for campus desk"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-900 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {submitting ? 'Submitting Claim...' : 'Submit Ownership Claim'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
