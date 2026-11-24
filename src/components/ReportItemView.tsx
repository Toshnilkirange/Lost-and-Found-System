import { useState, type ChangeEvent, type FormEvent } from 'react';
import { AlertTriangle, CheckCircle2, ImagePlus, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import type { CampusLocationItem, CategoryItem, PublicItemReport, ReportType, UserProfile } from '../types';

interface ReportItemViewProps {
  user: UserProfile | null;
  categories: CategoryItem[];
  locations: CampusLocationItem[];
  onRequireAuth: () => void;
  onReportCreated: (item: PublicItemReport) => void;
  onInspectItem: (item: PublicItemReport) => void;
}

export function ReportItemView({
  user,
  categories,
  locations,
  onRequireAuth,
  onReportCreated,
  onInspectItem,
}: ReportItemViewProps) {
  const activeCategories = categories.filter((c) => c.active);
  const activeLocations = locations.filter((l) => l.active);

  const [type, setType] = useState<ReportType>('Lost');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(activeCategories[0]?.name || 'Electronics');
  const [location, setLocation] = useState(activeLocations[0]?.name || 'Central Library (Reading Hall)');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [duplicateItems, setDuplicateItems] = useState<PublicItemReport[]>([]);
  const [submittedResult, setSubmittedResult] = useState<{
    item: PublicItemReport;
    potentialMatches: PublicItemReport[];
  } | null>(null);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('Please upload a PNG, JPEG, or WebP photograph.');
      return;
    }
    if (file.size > 1_800_000) {
      setError('Image size must be under 1.8 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const submitReport = async (confirmDuplicate: boolean) => {
    if (!user) {
      onRequireAuth();
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await api.createItem({
        type,
        title,
        category,
        location,
        date,
        description,
        imageUrl: imageUrl || undefined,
        confirmDuplicate,
      });
      setDuplicateItems([]);
      setSubmittedResult(res);
      setTitle('');
      setDescription('');
      setImageUrl('');
      onReportCreated(res.item);
    } catch (err) {
      const apiErr = err as Error & {
        status?: number;
        payload?: { duplicateWarning?: boolean; similarItems?: PublicItemReport[] };
      };
      if (apiErr.status === 409 && apiErr.payload?.duplicateWarning) {
        setDuplicateItems(apiErr.payload.similarItems || []);
      } else {
        setError(apiErr.message || 'Unable to submit report.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submitReport(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">
          Report a Lost or Found Item
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Submitted reports receive a unique tracking code and are automatically compared against active campus records for potential matches.
        </p>
      </div>

      {!user && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5">
          <div>
            <p className="text-sm font-semibold text-slate-900">Campus Sign-In Required</p>
            <p className="mt-0.5 text-xs text-slate-600">
              Sign in or register with your campus email to submit and track lost or found reports.
            </p>
          </div>
          <button
            type="button"
            onClick={onRequireAuth}
            className="rounded-lg bg-blue-900 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Sign In / Register
          </button>
        </div>
      )}

      {submittedResult && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-emerald-950">
                Report Submitted · <span className="font-mono">{submittedResult.item.reportCode}</span>
              </h2>
              <p className="mt-1 text-xs text-emerald-900">
                "{submittedResult.item.title}" is now recorded with status{' '}
                <strong>{submittedResult.item.status}</strong>.
              </p>
            </div>
          </div>

          {submittedResult.potentialMatches.length > 0 && (
            <div className="border-t border-emerald-200 pt-3 space-y-2">
              <p className="text-xs font-semibold text-emerald-950">
                Potential Matches Found ({submittedResult.potentialMatches.length})
              </p>
              {submittedResult.potentialMatches.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onInspectItem(m)}
                  className="w-full flex items-center justify-between rounded-lg border border-emerald-300 bg-white px-3.5 py-2.5 text-left text-xs hover:border-blue-900 cursor-pointer"
                >
                  <span>
                    <strong className="text-slate-900">{m.title}</strong>{' '}
                    <span className="text-slate-500 font-mono">({m.reportCode})</span>
                  </span>
                  <span className="font-semibold text-blue-900">View Match</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {duplicateItems.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-5 space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-amber-950">Similar Report Already Exists</h2>
              <p className="mt-1 text-xs text-amber-900">
                Review these existing listings before creating a duplicate record, or confirm to submit anyway.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {duplicateItems.map((dup) => (
              <button
                key={dup.id}
                type="button"
                onClick={() => onInspectItem(dup)}
                className="w-full flex items-center justify-between rounded-lg border border-amber-200 bg-white px-3.5 py-2 text-left text-xs hover:border-blue-900 cursor-pointer"
              >
                <span>
                  <strong className="text-slate-900">{dup.title}</strong> · {dup.location}
                </span>
                <span className="font-mono text-slate-600">{dup.reportCode}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              disabled={submitting}
              onClick={() => void submitReport(true)}
              className="rounded-lg bg-amber-800 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-900 cursor-pointer"
            >
              Submit Anyway as Separate Report
            </button>
            <button
              type="button"
              onClick={() => setDuplicateItems([])}
              className="rounded-lg border border-amber-300 bg-white px-4 py-2 text-xs font-semibold text-amber-950 hover:bg-amber-100 cursor-pointer"
            >
              Cancel &amp; Edit
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
            {error}
          </div>
        )}

        <div>
          <span className="block text-xs font-semibold text-slate-700 mb-2">Report Type</span>
          <div className="inline-flex rounded-lg bg-slate-100 p-1">
            {(['Lost', 'Found'] as ReportType[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setType(option)}
                className={`rounded-md px-5 py-2 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  type === option ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Report {option} Item
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Item Name / Title</label>
            <input
              type="text"
              required
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'Lost' ? 'e.g. Black Dell Laptop Charger' : 'e.g. Silver Casio Watch'}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-900 focus:outline-none"
            >
              {activeCategories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Campus Location</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-900 focus:outline-none"
            >
              {activeLocations.map((l) => (
                <option key={l.id} value={l.name}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Date {type === 'Lost' ? 'Lost' : 'Found'}
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:border-blue-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Item Photograph (Optional)</label>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer">
                <ImagePlus className="h-4 w-4" />
                <span>{imageUrl ? 'Replace Photo' : 'Upload Image'}</span>
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageUpload} className="hidden" />
              </label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:underline cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {imageUrl && (
          <div className="w-48 aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            <img src={imageUrl} alt="Item preview" className="h-full w-full object-cover" />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Description &amp; Identifying Notes
          </label>
          <textarea
            required
            rows={4}
            maxLength={1000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe color, brand, size, exact spot where it was lost/found, and non-sensitive clues for matching..."
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-900 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-4 border-t border-slate-100 pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-blue-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60 transition-colors cursor-pointer"
          >
            {submitting ? 'Submitting Report...' : `Submit ${type} Report`}
          </button>
        </div>
      </form>
    </div>
  );
}
