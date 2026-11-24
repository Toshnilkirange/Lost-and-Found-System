import { useState } from 'react';
import { BarChart3, MapPin, PackageSearch, RotateCcw, Search } from 'lucide-react';
import type { CampusAnalytics, CampusLocationItem, CategoryItem, ItemStatus, PublicItemReport } from '../types';
import { ItemStatusText } from './StatusLabel';

interface BrowseViewProps {
  items: PublicItemReport[];
  summary: {
    totalActive: number;
    potentialMatches: number;
    claimsInReview: number;
    returnedCount: number;
  };
  analytics: CampusAnalytics | null;
  categories: CategoryItem[];
  locations: CampusLocationItem[];
  loading: boolean;
  filters: {
    q: string;
    type: string;
    category: string;
    location: string;
    status: string;
    sort: string;
  };
  onFiltersChange: (next: BrowseViewProps['filters']) => void;
  onSelectItem: (item: PublicItemReport) => void;
  onNavigateReport: () => void;
}

const HERO_IMAGE = '/src/assets/images/campus_hero_desk_1795541082482.jpg';

const STATUS_OPTIONS: Array<'All' | ItemStatus> = [
  'All',
  'Reported',
  'Under Review',
  'Potential Match',
  'Claim Requested',
  'Verified',
  'Returned',
  'Closed',
];

function ItemCardImage({ src, alt, type }: { src?: string; alt: string; type: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-slate-100 text-slate-400 p-4">
        <PackageSearch className="h-8 w-8 mb-2 stroke-[1.5]" aria-hidden="true" />
        <span className="text-xs font-medium text-slate-500">{type} Item Record</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
    />
  );
}

export function BrowseView({
  items,
  summary,
  analytics,
  categories,
  locations,
  loading,
  filters,
  onFiltersChange,
  onSelectItem,
  onNavigateReport,
}: BrowseViewProps) {
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const hasActiveFilters =
    filters.q !== '' ||
    filters.type !== 'All' ||
    filters.category !== 'All' ||
    filters.location !== 'All' ||
    filters.status !== 'All' ||
    filters.sort !== 'newest';

  const handleResetFilters = () => {
    onFiltersChange({
      q: '',
      type: 'All',
      category: 'All',
      location: 'All',
      status: 'All',
      sort: 'newest',
    });
  };

  return (
    <div className="space-y-10">
      {/* Hero Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="lg:col-span-6 flex flex-col justify-center p-8 lg:p-12">
          <p className="text-xs font-medium text-slate-500 mb-3">
            Campus Student Services · Centralized Recovery Desk
          </p>
          <h1
            className="font-display text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-slate-900 leading-[1.12]"
            style={{ textWrap: 'balance' }}
          >
            Centralized Recovery for Campus Belongings
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">
            Report lost or found items across academic blocks, labs, library halls, and residential zones. Track status transitions, match descriptions, and verify ownership claims through one structured portal.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onNavigateReport}
              className="rounded-lg bg-blue-900 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Report Lost or Found Item
            </button>
            <a
              href="#catalog-directory"
              className="text-sm font-semibold text-slate-700 hover:text-blue-900 underline-offset-4 hover:underline whitespace-nowrap shrink-0"
            >
              Search Active Directory
            </a>
          </div>
        </div>

        <div className="lg:col-span-6 relative min-h-[260px] lg:min-h-[380px] bg-slate-100">
          {heroImgFailed ? (
            <div className="flex h-full w-full items-center justify-center bg-slate-100 p-8 text-slate-500 text-sm">
              Campus Student Services Lost and Found Desk
            </div>
          ) : (
            <img
              src={HERO_IMAGE}
              alt="University student services atrium and campus lost and found desk"
              referrerPolicy="no-referrer"
              onError={() => setHeroImgFailed(true)}
              className="h-full w-full lg:h-full object-cover"
            />
          )}
        </div>
      </section>

      {/* Full-width 4-column metric strip */}
      <section aria-label="System recovery metrics" className="grid grid-cols-2 lg:grid-cols-4 border border-slate-200 rounded-xl bg-white divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        <div className="p-5">
          <div className="text-xs font-medium text-slate-500">Active Reports</div>
          <div className="mt-1.5 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
            {summary.totalActive}
          </div>
        </div>
        <div className="p-5">
          <div className="text-xs font-medium text-slate-500">Potential Matches</div>
          <div className="mt-1.5 font-mono text-2xl font-semibold text-blue-900 tabular-nums">
            {summary.potentialMatches}
          </div>
        </div>
        <div className="p-5">
          <div className="text-xs font-medium text-slate-500">Claims in Review</div>
          <div className="mt-1.5 font-mono text-2xl font-semibold text-amber-700 tabular-nums">
            {summary.claimsInReview}
          </div>
        </div>
        <div className="p-5">
          <div className="text-xs font-medium text-slate-500">Items Returned</div>
          <div className="mt-1.5 font-mono text-2xl font-semibold text-emerald-700 tabular-nums">
            {summary.returnedCount}
          </div>
        </div>
      </section>

      {/* Search & Filter Directory */}
      <section id="catalog-directory" className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              Reported Items Directory
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Public listings omit reporter contact details until ownership is verified by campus staff.
            </p>
          </div>

          {/* Segmented Type Filter */}
          <div className="inline-flex items-center gap-1 rounded-lg bg-slate-200/70 p-1 self-start">
            {['All', 'Found', 'Lost'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onFiltersChange({ ...filters, type: t })}
                className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  filters.type === t
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t === 'All' ? 'All Reports' : `${t} Items`}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="space-y-2.5 rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-4 relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={filters.q}
                onChange={(e) => onFiltersChange({ ...filters, q: e.target.value })}
                placeholder="Search keywords, report ID, or location..."
                aria-label="Search reported items"
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-900 focus:border-blue-900 focus:outline-none"
              />
            </div>

            <div className="lg:col-span-2">
              <select
                value={filters.category}
                onChange={(e) => onFiltersChange({ ...filters, category: e.target.value })}
                aria-label="Filter by category"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-900 focus:outline-none"
              >
                <option value="All">All Categories</option>
                {categories.filter((c) => c.active).map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <select
                value={filters.location}
                onChange={(e) => onFiltersChange({ ...filters, location: e.target.value })}
                aria-label="Filter by campus location"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-900 focus:outline-none"
              >
                <option value="All">All Locations</option>
                {locations.filter((l) => l.active).map((l) => (
                  <option key={l.id} value={l.name}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <select
                value={filters.status}
                onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
                aria-label="Filter by status"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-900 focus:outline-none"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st === 'All' ? 'All Statuses' : st}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <select
                value={filters.sort}
                onChange={(e) => onFiltersChange({ ...filters, sort: e.target.value })}
                aria-label="Sort reported items"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-900 focus:outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="matches">Potential Matches First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span className="font-mono tabular-nums">
              Showing {items.length} {items.length === 1 ? 'report' : 'reports'}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 font-semibold text-blue-900 hover:underline cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-xl border border-slate-200 bg-white overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-slate-100" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-2/3 bg-slate-100 rounded" />
                  <div className="h-5 w-4/5 bg-slate-200 rounded" />
                  <div className="h-3 w-full bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <p className="font-display text-lg font-semibold text-slate-900">
              No matching lost or found reports found
            </p>
            <p className="mt-1.5 text-sm text-slate-600">
              Adjust your search terms or filters, or submit a new report so campus staff can monitor for matches.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Reset Filters
              </button>
              <button
                type="button"
                onClick={onNavigateReport}
                className="rounded-lg bg-blue-900 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 cursor-pointer"
              >
                Submit New Report
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <article
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="group cursor-pointer rounded-xl border border-slate-200 bg-white overflow-hidden transition-colors hover:border-slate-300 flex flex-col"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 border-b border-slate-100">
                  <ItemCardImage src={item.imageUrl} alt={item.title} type={item.type} />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span className="font-mono tabular-nums">{item.reportCode}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-slate-700">{item.type}</span>
                    <span className="ml-auto">
                      <ItemStatusText status={item.status} />
                    </span>
                  </div>

                  <h3 className="mt-2.5 font-display text-lg font-bold text-slate-900 group-hover:text-blue-900 transition-colors line-clamp-1">
                    {item.title}
                  </h3>

                  <p className="mt-1.5 text-sm text-slate-600 line-clamp-2 flex-1">
                    {item.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span className="truncate">{item.location}</span>
                    <span aria-hidden="true" className="shrink-0">·</span>
                    <span className="font-mono tabular-nums shrink-0">{item.date}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Campus Hotspots & Recovery Analytics */}
      {analytics && (
        <section aria-label="Campus recovery analytics" className="space-y-5 border-t border-slate-200 pt-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                Campus Hotspots &amp; Recovery Analytics
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Click any location or category below to filter the active directory above.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
              <span>
                Recovery Rate:{' '}
                <strong className="font-mono text-sm font-bold text-emerald-700 tabular-nums">
                  {analytics.recoveryRatePercent}%
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {analytics.lostCount} Lost · {analytics.foundCount} Found · {analytics.recoveredCount} Recovered
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Campus Hotspots */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-900" />
                  <h3 className="font-display text-base font-bold text-slate-900">
                    Top Campus Locations
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-500 tabular-nums">
                  {analytics.totalReports} Total Reports
                </span>
              </div>

              <div className="space-y-3">
                {analytics.byLocation.slice(0, 6).map((loc) => {
                  const maxLoc = analytics.byLocation[0]?.count || 1;
                  const pct = Math.max(8, Math.round((loc.count / maxLoc) * 100));
                  const isActive = filters.location === loc.name;
                  return (
                    <button
                      key={loc.name}
                      type="button"
                      onClick={() => {
                        onFiltersChange({
                          ...filters,
                          location: isActive ? 'All' : loc.name,
                        });
                        document.getElementById('catalog-directory')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full text-left group cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span
                          className={`font-medium transition-colors ${
                            isActive ? 'text-blue-900 font-semibold' : 'text-slate-700 group-hover:text-blue-900'
                          }`}
                        >
                          {loc.name}
                        </span>
                        <span className="font-mono font-semibold text-slate-900 tabular-nums">
                          {loc.count}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-sm bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            isActive ? 'bg-blue-900' : 'bg-slate-400 group-hover:bg-blue-900'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-900" />
                  <h3 className="font-display text-base font-bold text-slate-900">
                    Category Distribution
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-500 tabular-nums">
                  {analytics.byCategory.length} Categories
                </span>
              </div>

              <div className="space-y-3">
                {analytics.byCategory.slice(0, 6).map((cat) => {
                  const maxCat = analytics.byCategory[0]?.count || 1;
                  const pct = Math.max(8, Math.round((cat.count / maxCat) * 100));
                  const isActive = filters.category === cat.name;
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => {
                        onFiltersChange({
                          ...filters,
                          category: isActive ? 'All' : cat.name,
                        });
                        document.getElementById('catalog-directory')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full text-left group cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span
                          className={`font-medium transition-colors ${
                            isActive ? 'text-blue-900 font-semibold' : 'text-slate-700 group-hover:text-blue-900'
                          }`}
                        >
                          {cat.name}
                        </span>
                        <span className="font-mono font-semibold text-slate-900 tabular-nums">
                          {cat.count}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-sm bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            isActive ? 'bg-blue-900' : 'bg-emerald-600/80 group-hover:bg-blue-900'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
