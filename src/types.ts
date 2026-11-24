export type UserRole = 'student' | 'admin';

export type ReportType = 'Lost' | 'Found';

export type ItemStatus =
  | 'Reported'
  | 'Under Review'
  | 'Potential Match'
  | 'Claim Requested'
  | 'Verified'
  | 'Returned'
  | 'Closed'
  | 'Rejected';

export type ClaimStatus = 'Pending' | 'Approved' | 'Rejected' | 'Handed Over';

export interface UserProfile {
  id: string;
  studentId: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

export interface StatusHistoryEntry {
  status: ItemStatus;
  timestamp: string;
  note: string;
  actorRole: 'system' | 'student' | 'admin';
}

export interface PublicItemReport {
  id: string;
  reportCode: string;
  type: ReportType;
  title: string;
  category: string;
  location: string;
  date: string;
  description: string;
  imageUrl?: string;
  status: ItemStatus;
  reporterId: string;
  reporterName: string;
  suspectedDuplicate: boolean;
  matchedItemIds: string[];
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface ClaimRequest {
  id: string;
  claimCode: string;
  itemId: string;
  itemTitle: string;
  itemReportCode: string;
  claimantId: string;
  claimantName: string;
  claimantEmail: string;
  claimantStudentId: string;
  claimantPhone: string;
  identifyingDetails: string;
  proofReference: string;
  pickupCode?: string;
  status: ClaimStatus;
  adminRemarks: string;
  createdAt: string;
  updatedAt: string;
}

export interface ItemInquiry {
  id: string;
  itemId: string;
  senderId: string;
  senderLabel: string;
  senderRole: UserRole;
  message: string;
  createdAt: string;
}

export interface CampusAnalytics {
  totalReports: number;
  lostCount: number;
  foundCount: number;
  recoveredCount: number;
  recoveryRatePercent: number;
  byLocation: { name: string; count: number }[];
  byCategory: { name: string; count: number }[];
}

export interface CategoryItem {
  id: string;
  name: string;
  active: boolean;
}

export interface CampusLocationItem {
  id: string;
  name: string;
  zone: string;
  active: boolean;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  title: string;
  message: string;
  relatedItemId?: string;
  relatedClaimId?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  targetType: 'item' | 'claim' | 'user' | 'category' | 'location' | 'system';
  targetId: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
  details: string;
  timestamp: string;
}

export interface AdminStats {
  totalLost: number;
  totalFound: number;
  underReview: number;
  potentialMatches: number;
  pendingClaims: number;
  returnedItems: number;
  closedCases: number;
  suspectedDuplicates: number;
}
