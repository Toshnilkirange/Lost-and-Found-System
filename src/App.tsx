import { useCallback, useEffect, useState } from 'react';
import { AdminDeskView } from './components/AdminDeskView';
import { AuthModal } from './components/AuthModal';
import { BlueprintView } from './components/BlueprintView';
import { BrowseView } from './components/BrowseView';
import { ItemDetailModal } from './components/ItemDetailModal';
import { MyActivityView } from './components/MyActivityView';
import { Navbar, type ActiveTab } from './components/Navbar';
import { ReportItemView } from './components/ReportItemView';
import { api, setAuthToken } from './lib/api';
import type {
  CampusAnalytics,
  CampusLocationItem,
  CategoryItem,
  NotificationRecord,
  PublicItemReport,
  UserProfile,
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('browse');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [locations, setLocations] = useState<CampusLocationItem[]>([]);
  const [items, setItems] = useState<PublicItemReport[]>([]);
  const [summary, setSummary] = useState({
    totalActive: 0,
    potentialMatches: 0,
    claimsInReview: 0,
    returnedCount: 0,
  });
  const [analytics, setAnalytics] = useState<CampusAnalytics | null>(null);
  const [loadingItems, setLoadingItems] = useState(true);
  const [filters, setFilters] = useState({
    q: '',
    type: 'All',
    category: 'All',
    location: 'All',
    status: 'All',
    sort: 'newest',
  });

  const [selectedItem, setSelectedItem] = useState<PublicItemReport | null>(null);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);

  const loadMetadata = useCallback(async () => {
    try {
      const res = await api.getMetadata();
      setCategories(res.categories);
      setLocations(res.locations);
    } catch {
      // Metadata retry handled on next navigation
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      const res = await api.getAnalytics();
      setAnalytics(res);
    } catch {
      // Non-blocking analytics refresh
    }
  }, []);

  const loadItems = useCallback(async () => {
    setLoadingItems(true);
    try {
      const res = await api.getItems(filters);
      setItems(res.items);
      setSummary(res.summary);
    } finally {
      setLoadingItems(false);
    }
  }, [filters]);

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications);
    } catch {
      setNotifications([]);
    }
  }, [user]);

  useEffect(() => {
    void loadMetadata();
    void loadAnalytics();
  }, [loadMetadata, loadAnalytics]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const handleAuthenticated = (token: string, authenticatedUser: UserProfile) => {
    setAuthToken(token);
    setUser(authenticatedUser);
  };

  const handleSignOut = () => {
    setAuthToken(null);
    setUser(null);
    setNotifications([]);
  };

  const handleSelectItemById = async (itemId: string) => {
    try {
      const res = await api.getItemDetail(itemId);
      setSelectedItem(res.item);
    } catch {
      // Ignore if deactivated
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        user={user}
        unreadCount={unreadCount}
        onOpenAuth={() => setAuthModalOpen(true)}
        onSignOut={handleSignOut}
      />

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 py-8 sm:py-10">
        {activeTab === 'browse' && (
          <BrowseView
            items={items}
            summary={summary}
            analytics={analytics}
            categories={categories}
            locations={locations}
            loading={loadingItems}
            filters={filters}
            onFiltersChange={setFilters}
            onSelectItem={setSelectedItem}
            onNavigateReport={() => setActiveTab('report')}
          />
        )}

        {activeTab === 'report' && (
          <ReportItemView
            user={user}
            categories={categories}
            locations={locations}
            onRequireAuth={() => setAuthModalOpen(true)}
            onReportCreated={() => {
              void loadItems();
              void loadAnalytics();
              void loadNotifications();
            }}
            onInspectItem={setSelectedItem}
          />
        )}

        {activeTab === 'activity' && (
          <MyActivityView
            user={user}
            notifications={notifications}
            onRefreshNotifications={() => void loadNotifications()}
            onRequireAuth={() => setAuthModalOpen(true)}
            onSelectItemById={(id) => void handleSelectItemById(id)}
            onSelectItem={setSelectedItem}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDeskView
            user={user}
            onAdminAuthenticated={handleAuthenticated}
            onDataChanged={() => {
              void loadItems();
              void loadAnalytics();
              void loadMetadata();
              void loadNotifications();
            }}
          />
        )}

        {activeTab === 'blueprint' && <BlueprintView />}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1280px] flex-col sm:flex-row items-center justify-between gap-4 px-6 py-6 text-xs text-slate-500">
          <div>
            Campus Lost and Found System · Software Engineering (CS3CO40) Project
          </div>
          <div>
            Prepared by Toshnil Kirange, Toshika Malviya &amp; Tulaj Tripathi
          </div>
        </div>
      </footer>

      <ItemDetailModal
        item={selectedItem}
        user={user}
        onClose={() => setSelectedItem(null)}
        onRequireAuth={() => {
          setSelectedItem(null);
          setAuthModalOpen(true);
        }}
        onClaimSubmitted={() => {
          void loadItems();
          void loadAnalytics();
          void loadNotifications();
        }}
        onSelectItem={setSelectedItem}
      />

      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthenticated={handleAuthenticated}
      />
    </div>
  );
}
