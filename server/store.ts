import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type {
  AuditLogEntry,
  CampusLocationItem,
  CategoryItem,
  ClaimRequest,
  ItemInquiry,
  ItemStatus,
  NotificationRecord,
  PublicItemReport,
  ReportType,
  UserProfile,
} from '../src/types';

export interface StoredUser extends UserProfile {
  passwordHash: string;
  passwordSalt: string;
}

export interface StoredItem extends PublicItemReport {
  active: boolean;
}

export interface AdminCredential {
  email: string;
  name: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
}

export interface DatabaseState {
  users: StoredUser[];
  items: StoredItem[];
  claims: ClaimRequest[];
  inquiries: ItemInquiry[];
  categories: CategoryItem[];
  locations: CampusLocationItem[];
  notifications: NotificationRecord[];
  auditLogs: AuditLogEntry[];
  adminCredential: AdminCredential | null;
  reportCounter: number;
  claimCounter: number;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'campus_lost_found.json');

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, actualSalt, 64).toString('hex');
  return { hash: derived, salt: actualSalt };
}

export function verifyPassword(password: string, storedHash: string, storedSalt: string): boolean {
  const { hash } = hashPassword(password, storedSalt);
  const hashBuf = Buffer.from(hash, 'hex');
  const storedBuf = Buffer.from(storedHash, 'hex');
  if (hashBuf.length !== storedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(hashBuf, storedBuf);
}

function createInitialState(): DatabaseState {
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

  const sampleStudentSalt = crypto.randomBytes(16).toString('hex');
  const sampleStudentHash = crypto.scryptSync('CampusDemo2026!', sampleStudentSalt, 64).toString('hex');

  const categories: CategoryItem[] = [
    { id: 'cat-1', name: 'Electronics', active: true },
    { id: 'cat-2', name: 'Wallets & IDs', active: true },
    { id: 'cat-3', name: 'Keys & Access Cards', active: true },
    { id: 'cat-4', name: 'Books & Notes', active: true },
    { id: 'cat-5', name: 'Bottles & Gear', active: true },
    { id: 'cat-6', name: 'Lab Equipment', active: true },
    { id: 'cat-7', name: 'Accessories', active: true },
  ];

  const locations: CampusLocationItem[] = [
    { id: 'loc-1', name: 'Central Library (Reading Hall)', zone: 'Library', active: true },
    { id: 'loc-2', name: 'CS & IT Academic Block - Room 302', zone: 'Academic blocks and classrooms', active: true },
    { id: 'loc-3', name: 'Software Engineering Lab 2', zone: 'Computer and science laboratories', active: true },
    { id: 'loc-4', name: 'Student Canteen & Atrium', zone: 'Canteen and common areas', active: true },
    { id: 'loc-5', name: 'North Gate Two-Wheeler Parking', zone: 'Parking areas', active: true },
    { id: 'loc-6', name: 'Main Sports Ground Pavilion', zone: 'Sports ground and activity areas', active: true },
    { id: 'loc-7', name: 'Hostel Block B Common Lounge', zone: 'Hostel/common residential areas', active: true },
  ];

  const users: StoredUser[] = [
    {
      id: 'usr-student-1',
      studentId: 'EN24CS3011085',
      name: 'Toshnil Kirange',
      email: 'toshnil.k@campus.edu',
      phone: '9820001085',
      department: 'Computer Science & Engineering',
      role: 'student',
      active: true,
      createdAt: daysAgo(12),
      passwordHash: sampleStudentHash,
      passwordSalt: sampleStudentSalt,
    },
    {
      id: 'usr-student-2',
      studentId: 'EN24CS3011086',
      name: 'Tulaj Tripathi',
      email: 'tulaj.t@campus.edu',
      phone: '9820001086',
      department: 'Computer Science & Engineering',
      role: 'student',
      active: true,
      createdAt: daysAgo(11),
      passwordHash: sampleStudentHash,
      passwordSalt: sampleStudentSalt,
    },
  ];

  const items: StoredItem[] = [
    {
      id: 'itm-101',
      reportCode: 'CLF-2026-0101',
      type: 'Found',
      title: 'Dark Brown Leather Bifold Wallet',
      category: 'Wallets & IDs',
      location: 'Central Library (Reading Hall)',
      date: daysAgo(2).slice(0, 10),
      description: 'Found near desk row 4 on the second floor of Central Library. Contains transit card and folded library receipt; owner must verify inner card initials.',
      imageUrl: '/src/assets/images/item_leather_wallet_1795541081823.jpg',
      status: 'Potential Match',
      reporterId: 'usr-student-2',
      reporterName: 'Tulaj Tripathi',
      suspectedDuplicate: false,
      matchedItemIds: ['itm-105'],
      active: true,
      statusHistory: [
        { status: 'Reported', timestamp: daysAgo(2), note: 'Found report submitted by campus student.', actorRole: 'student' },
        { status: 'Under Review', timestamp: daysAgo(2), note: 'Verified by lost-and-found desk.', actorRole: 'admin' },
        { status: 'Potential Match', timestamp: daysAgo(1), note: 'Matched with lost wallet report CLF-2026-0105.', actorRole: 'system' },
      ],
      createdAt: daysAgo(2),
      updatedAt: daysAgo(1),
    },
    {
      id: 'itm-102',
      reportCode: 'CLF-2026-0102',
      type: 'Found',
      title: 'Matte White Wireless Earbuds Case',
      category: 'Electronics',
      location: 'Software Engineering Lab 2',
      date: daysAgo(3).slice(0, 10),
      description: 'Left beside terminal #14 after the afternoon CS3CO40 lab session. White charging case with minor scuff near the hinge.',
      imageUrl: '/src/assets/images/item_wireless_earbuds_1795541082090.jpg',
      status: 'Claim Requested',
      reporterId: 'usr-student-1',
      reporterName: 'Toshnil Kirange',
      suspectedDuplicate: false,
      matchedItemIds: [],
      active: true,
      statusHistory: [
        { status: 'Reported', timestamp: daysAgo(3), note: 'Found item logged at lab terminal.', actorRole: 'student' },
        { status: 'Under Review', timestamp: daysAgo(3), note: 'Approved for public catalog listing.', actorRole: 'admin' },
        { status: 'Claim Requested', timestamp: daysAgo(1), note: 'Claim submitted by student for verification.', actorRole: 'student' },
      ],
      createdAt: daysAgo(3),
      updatedAt: daysAgo(1),
    },
    {
      id: 'itm-103',
      reportCode: 'CLF-2026-0103',
      type: 'Found',
      title: 'Casio fx-991EX Scientific Calculator',
      category: 'Lab Equipment',
      location: 'CS & IT Academic Block - Room 302',
      date: daysAgo(4).slice(0, 10),
      description: 'Black engineering scientific calculator found on the front podium desk after morning lecture. Protective slide cover has faint initials scratched inside.',
      imageUrl: '/src/assets/images/item_scientific_calc_1795541083838.jpg',
      status: 'Under Review',
      reporterId: 'usr-student-2',
      reporterName: 'Tulaj Tripathi',
      suspectedDuplicate: false,
      matchedItemIds: [],
      active: true,
      statusHistory: [
        { status: 'Reported', timestamp: daysAgo(4), note: 'Submitted after lecture.', actorRole: 'student' },
        { status: 'Under Review', timestamp: daysAgo(3), note: 'Stored securely at Student Services Desk.', actorRole: 'admin' },
      ],
      createdAt: daysAgo(4),
      updatedAt: daysAgo(3),
    },
    {
      id: 'itm-104',
      reportCode: 'CLF-2026-0104',
      type: 'Found',
      title: 'Navy Insulated Stainless Water Flask',
      category: 'Bottles & Gear',
      location: 'Main Sports Ground Pavilion',
      date: daysAgo(6).slice(0, 10),
      description: '650ml matte navy insulated steel bottle with brushed steel cap found near the west bleachers.',
      imageUrl: '/src/assets/images/item_stainless_flask_1795541082250.jpg',
      status: 'Returned',
      reporterId: 'usr-student-1',
      reporterName: 'Toshnil Kirange',
      suspectedDuplicate: false,
      matchedItemIds: [],
      active: true,
      statusHistory: [
        { status: 'Reported', timestamp: daysAgo(6), note: 'Found near sports bleachers.', actorRole: 'student' },
        { status: 'Claim Requested', timestamp: daysAgo(5), note: 'Owner submitted identifying sticker detail.', actorRole: 'student' },
        { status: 'Verified', timestamp: daysAgo(5), note: 'Ownership verified against campus ID.', actorRole: 'admin' },
        { status: 'Returned', timestamp: daysAgo(4), note: 'Item handed over at Student Services.', actorRole: 'admin' },
      ],
      createdAt: daysAgo(6),
      updatedAt: daysAgo(4),
    },
    {
      id: 'itm-105',
      reportCode: 'CLF-2026-0105',
      type: 'Lost',
      title: 'Brown Leather Wallet (Lost Near Library)',
      category: 'Wallets & IDs',
      location: 'Central Library (Reading Hall)',
      date: daysAgo(2).slice(0, 10),
      description: 'Misplaced dark brown bifold leather wallet while checking out Software Engineering reference books.',
      imageUrl: '/src/assets/images/item_leather_wallet_1795541081823.jpg',
      status: 'Potential Match',
      reporterId: 'usr-student-1',
      reporterName: 'Toshnil Kirange',
      suspectedDuplicate: false,
      matchedItemIds: ['itm-101'],
      active: true,
      statusHistory: [
        { status: 'Reported', timestamp: daysAgo(2), note: 'Lost report submitted.', actorRole: 'student' },
        { status: 'Potential Match', timestamp: daysAgo(1), note: 'Matched with found wallet CLF-2026-0101.', actorRole: 'system' },
      ],
      createdAt: daysAgo(2),
      updatedAt: daysAgo(1),
    },
    {
      id: 'itm-106',
      reportCode: 'CLF-2026-0106',
      type: 'Lost',
      title: 'Two-Wheeler Keyring with Brass Tag',
      category: 'Keys & Access Cards',
      location: 'North Gate Two-Wheeler Parking',
      date: daysAgo(1).slice(0, 10),
      description: 'Silver key with a small blue lanyard and stamped brass locker tag dropped near bay C.',
      status: 'Reported',
      reporterId: 'usr-student-2',
      reporterName: 'Tulaj Tripathi',
      suspectedDuplicate: false,
      matchedItemIds: [],
      active: true,
      statusHistory: [
        { status: 'Reported', timestamp: daysAgo(1), note: 'Lost key report created.', actorRole: 'student' },
      ],
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
  ];

  const claims: ClaimRequest[] = [
    {
      id: 'clm-201',
      claimCode: 'CLM-2026-0201',
      itemId: 'itm-102',
      itemTitle: 'Matte White Wireless Earbuds Case',
      itemReportCode: 'CLF-2026-0102',
      claimantId: 'usr-student-2',
      claimantName: 'Tulaj Tripathi',
      claimantEmail: 'tulaj.t@campus.edu',
      claimantStudentId: 'EN24CS3011086',
      claimantPhone: '9820001086',
      identifyingDetails: 'Bluetooth device pairing name is "Tulaj-Pods" and inside lid has a tiny ink dot near the serial.',
      proofReference: 'Purchase invoice #INV-88412',
      status: 'Pending',
      adminRemarks: '',
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
  ];

  const notifications: NotificationRecord[] = [
    {
      id: 'ntf-1',
      userId: 'usr-student-1',
      title: 'Potential Match Detected',
      message: 'Your lost report "Brown Leather Wallet" matches found item CLF-2026-0101 at Central Library.',
      relatedItemId: 'itm-101',
      read: false,
      createdAt: daysAgo(1),
    },
    {
      id: 'ntf-2',
      userId: 'usr-student-2',
      title: 'Claim Request Recorded',
      message: 'Your claim CLM-2026-0201 for "Matte White Wireless Earbuds Case" is awaiting administrator verification.',
      relatedItemId: 'itm-102',
      relatedClaimId: 'clm-201',
      read: false,
      createdAt: daysAgo(1),
    },
  ];

  const auditLogs: AuditLogEntry[] = [
    {
      id: 'aud-1',
      action: 'ITEM_VERIFIED_AND_HANDED_OVER',
      targetType: 'item',
      targetId: 'itm-104',
      adminId: 'system-seed',
      adminName: 'Campus Services Desk',
      adminEmail: 'desk@campus.edu',
      details: 'Verified ownership ID and marked CLF-2026-0104 (Navy Insulated Stainless Water Flask) as Returned.',
      timestamp: daysAgo(4),
    },
  ];

  return {
    users,
    items,
    claims,
    inquiries: [],
    categories,
    locations,
    notifications,
    auditLogs,
    adminCredential: null,
    reportCounter: 106,
    claimCounter: 201,
  };
}

export class RepositoryStore {
  private state: DatabaseState;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      try {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        this.state = JSON.parse(raw) as DatabaseState;
      } catch {
        this.state = createInitialState();
        this.persist();
      }
    } else {
      this.state = createInitialState();
      this.persist();
    }
    this.seedCatalogAdditions();
  }

  private seedCatalogAdditions(): void {
    const now = new Date();
    const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();
    let changed = false;

    if (!Array.isArray(this.state.inquiries)) {
      this.state.inquiries = [];
      changed = true;
    }

    const extraLocations: CampusLocationItem[] = [
      { id: 'loc-8', name: 'Main Auditorium Foyer', zone: 'Canteen and common areas', active: true },
      { id: 'loc-9', name: 'Electronics & Physics Lab 1', zone: 'Computer and science laboratories', active: true },
    ];
    for (const loc of extraLocations) {
      if (!this.state.locations.some((l) => l.name === loc.name)) {
        this.state.locations.push(loc);
        changed = true;
      }
    }

    const additionalItems: StoredItem[] = [
      {
        id: 'itm-107',
        reportCode: 'CLF-2026-0107',
        type: 'Found',
        title: 'TechVolt 65W USB-C Laptop Power Adapter',
        category: 'Electronics',
        location: 'Student Canteen & Atrium',
        date: daysAgo(1).slice(0, 10),
        description: 'Black 65W PD USB-C laptop charger with braided cable neatly wrapped in a Velcro strap, left plugged near the east window booths.',
        imageUrl: '/src/assets/images/item_laptop_charger_1795541925193.jpg',
        status: 'Potential Match',
        reporterId: 'usr-student-2',
        reporterName: 'Tulaj Tripathi',
        suspectedDuplicate: false,
        matchedItemIds: ['itm-108'],
        active: true,
        statusHistory: [
          { status: 'Reported', timestamp: daysAgo(1), note: 'Found at Student Canteen power outlet.', actorRole: 'student' },
          { status: 'Potential Match', timestamp: daysAgo(1), note: 'Matched with lost USB-C laptop charger report CLF-2026-0108.', actorRole: 'system' },
        ],
        createdAt: daysAgo(1),
        updatedAt: daysAgo(1),
      },
      {
        id: 'itm-108',
        reportCode: 'CLF-2026-0108',
        type: 'Lost',
        title: '65W USB-C Laptop Charger (Braided Cable)',
        category: 'Electronics',
        location: 'Student Canteen & Atrium',
        date: daysAgo(1).slice(0, 10),
        description: 'Lost my black 65W USB-C laptop power brick after lunch study session in the atrium.',
        imageUrl: '/src/assets/images/item_laptop_charger_1795541925193.jpg',
        status: 'Potential Match',
        reporterId: 'usr-student-1',
        reporterName: 'Toshnil Kirange',
        suspectedDuplicate: false,
        matchedItemIds: ['itm-107'],
        active: true,
        statusHistory: [
          { status: 'Reported', timestamp: daysAgo(1), note: 'Lost charger report logged.', actorRole: 'student' },
          { status: 'Potential Match', timestamp: daysAgo(1), note: 'Matched with found adapter CLF-2026-0107.', actorRole: 'system' },
        ],
        createdAt: daysAgo(1),
        updatedAt: daysAgo(1),
      },
      {
        id: 'itm-109',
        reportCode: 'CLF-2026-0109',
        type: 'Found',
        title: 'Navy Woven Campus Lanyard & Smart Card Holder',
        category: 'Keys & Access Cards',
        location: 'CS & IT Academic Block - Room 302',
        date: daysAgo(2).slice(0, 10),
        description: 'Navy blue campus lanyard with clear vertical badge sleeve and RFID access card inside. Personal details masked for privacy.',
        imageUrl: '/src/assets/images/item_campus_id_lanyard_1795541925454.jpg',
        status: 'Verified',
        reporterId: 'usr-student-1',
        reporterName: 'Toshnil Kirange',
        suspectedDuplicate: false,
        matchedItemIds: [],
        active: true,
        statusHistory: [
          { status: 'Reported', timestamp: daysAgo(2), note: 'Turned in from Room 302 podium.', actorRole: 'student' },
          { status: 'Claim Requested', timestamp: daysAgo(1), note: 'Owner submitted student enrollment verification.', actorRole: 'student' },
          { status: 'Verified', timestamp: daysAgo(1), note: 'Claim verified. Pickup code issued for Student Services Desk.', actorRole: 'admin' },
        ],
        createdAt: daysAgo(2),
        updatedAt: daysAgo(1),
      },
      {
        id: 'itm-110',
        reportCode: 'CLF-2026-0110',
        type: 'Found',
        title: 'Compact 65% Wireless Mechanical Keyboard',
        category: 'Electronics',
        location: 'Software Engineering Lab 2',
        date: daysAgo(2).slice(0, 10),
        description: 'Matte charcoal 65% Bluetooth mechanical keyboard with slate keycaps left on workstation bench 6.',
        imageUrl: '/src/assets/images/item_mechanical_keyboard_1795541927679.jpg',
        status: 'Under Review',
        reporterId: 'usr-student-2',
        reporterName: 'Tulaj Tripathi',
        suspectedDuplicate: false,
        matchedItemIds: [],
        active: true,
        statusHistory: [
          { status: 'Reported', timestamp: daysAgo(2), note: 'Found after evening lab hours.', actorRole: 'student' },
          { status: 'Under Review', timestamp: daysAgo(2), note: 'Held at CS department office.', actorRole: 'admin' },
        ],
        createdAt: daysAgo(2),
        updatedAt: daysAgo(2),
      },
      {
        id: 'itm-111',
        reportCode: 'CLF-2026-0111',
        type: 'Found',
        title: 'Tortoiseshell Eyeglasses & Charcoal Hard Case',
        category: 'Accessories',
        location: 'Main Auditorium Foyer',
        date: daysAgo(3).slice(0, 10),
        description: 'Round metal-bridge tortoiseshell prescription frames inside an open charcoal fabric hard case left on foyer seating.',
        imageUrl: '/src/assets/images/item_wireframe_glasses_1795541925618.jpg',
        status: 'Reported',
        reporterId: 'usr-student-1',
        reporterName: 'Toshnil Kirange',
        suspectedDuplicate: false,
        matchedItemIds: [],
        active: true,
        statusHistory: [
          { status: 'Reported', timestamp: daysAgo(3), note: 'Found after morning seminar.', actorRole: 'student' },
        ],
        createdAt: daysAgo(3),
        updatedAt: daysAgo(3),
      },
      {
        id: 'itm-112',
        reportCode: 'CLF-2026-0112',
        type: 'Found',
        title: 'Dark Green Spiral Engineering Notebook & Silver Pen',
        category: 'Books & Notes',
        location: 'Central Library (Reading Hall)',
        date: daysAgo(2).slice(0, 10),
        description: 'Hardcover dark green spiral engineering notebook containing UML and DFD sketches with a knurled silver ballpoint pen.',
        imageUrl: '/src/assets/images/item_engineering_notebook_1795541926640.jpg',
        status: 'Under Review',
        reporterId: 'usr-student-2',
        reporterName: 'Tulaj Tripathi',
        suspectedDuplicate: false,
        matchedItemIds: [],
        active: true,
        statusHistory: [
          { status: 'Reported', timestamp: daysAgo(2), note: 'Left at silent reading carrel 18.', actorRole: 'student' },
          { status: 'Under Review', timestamp: daysAgo(1), note: 'Logged at Central Library circulation desk.', actorRole: 'admin' },
        ],
        createdAt: daysAgo(2),
        updatedAt: daysAgo(1),
      },
      {
        id: 'itm-113',
        reportCode: 'CLF-2026-0113',
        type: 'Found',
        title: 'Brushed Steel Wristwatch with Navy Dial',
        category: 'Accessories',
        location: 'Main Sports Ground Pavilion',
        date: daysAgo(5).slice(0, 10),
        description: 'Stainless steel bracelet wristwatch with dark navy numeric dial and orange second hand tip, found near locker bench.',
        imageUrl: '/src/assets/images/item_silver_watch_1795541927549.jpg',
        status: 'Under Review',
        reporterId: 'usr-student-1',
        reporterName: 'Toshnil Kirange',
        suspectedDuplicate: false,
        matchedItemIds: [],
        active: true,
        statusHistory: [
          { status: 'Reported', timestamp: daysAgo(5), note: 'Turned in by athletics volunteer.', actorRole: 'student' },
          { status: 'Under Review', timestamp: daysAgo(4), note: 'Secured in campus desk safe; requires serial/engraving proof.', actorRole: 'admin' },
        ],
        createdAt: daysAgo(5),
        updatedAt: daysAgo(4),
      },
      {
        id: 'itm-114',
        reportCode: 'CLF-2026-0114',
        type: 'Lost',
        title: 'Tortoiseshell Reading Glasses in Charcoal Case',
        category: 'Accessories',
        location: 'Main Auditorium Foyer',
        date: daysAgo(3).slice(0, 10),
        description: 'Lost my prescription round tortoiseshell glasses inside a charcoal hard case after guest lecture.',
        status: 'Reported',
        reporterId: 'usr-student-2',
        reporterName: 'Tulaj Tripathi',
        suspectedDuplicate: false,
        matchedItemIds: ['itm-111'],
        active: true,
        statusHistory: [
          { status: 'Reported', timestamp: daysAgo(3), note: 'Lost report submitted.', actorRole: 'student' },
        ],
        createdAt: daysAgo(3),
        updatedAt: daysAgo(3),
      },
    ];

    for (const item of additionalItems) {
      if (!this.state.items.some((existing) => existing.reportCode === item.reportCode)) {
        this.state.items.push(item);
        changed = true;
      }
    }

    if (this.state.reportCounter < 114) {
      this.state.reportCounter = 114;
      changed = true;
    }

    if (!this.state.claims.some((c) => c.claimCode === 'CLM-2026-0202')) {
      this.state.claims.push({
        id: 'clm-202',
        claimCode: 'CLM-2026-0202',
        itemId: 'itm-109',
        itemTitle: 'Navy Woven Campus Lanyard & Smart Card Holder',
        itemReportCode: 'CLF-2026-0109',
        claimantId: 'usr-student-2',
        claimantName: 'Tulaj Tripathi',
        claimantEmail: 'tulaj.t@campus.edu',
        claimantStudentId: 'EN24CS3011086',
        claimantPhone: '9820001086',
        identifyingDetails: 'Enrollment card inside sleeve ends with 1086 and has a small silver clasp scratch.',
        proofReference: 'Student Portal Digital ID',
        pickupCode: 'PU-7429',
        status: 'Approved',
        adminRemarks: 'Identity verified. Present pickup code PU-7429 at Student Services Desk.',
        createdAt: daysAgo(1),
        updatedAt: daysAgo(1),
      });
      if (this.state.claimCounter < 202) {
        this.state.claimCounter = 202;
      }
      changed = true;
    }

    if (this.state.inquiries.length === 0) {
      this.state.inquiries.push({
        id: 'inq-1',
        itemId: 'itm-110',
        senderId: 'usr-student-1',
        senderLabel: 'Student · EN24CS3011085',
        senderRole: 'student',
        message: 'Does this keyboard have linear red switches and a USB dongle tucked inside the bottom slot?',
        createdAt: daysAgo(1),
      });
      changed = true;
    }

    if (changed) {
      this.persist();
    }
  }

  private persist(): void {
    fs.writeFileSync(DATA_FILE, JSON.stringify(this.state, null, 2), 'utf8');
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public save(): void {
    this.persist();
  }

  public toPublicItem(item: StoredItem): PublicItemReport {
    return {
      id: item.id,
      reportCode: item.reportCode,
      type: item.type,
      title: item.title,
      category: item.category,
      location: item.location,
      date: item.date,
      description: item.description,
      imageUrl: item.imageUrl,
      status: item.status,
      reporterId: item.reporterId,
      reporterName: item.reporterName,
      suspectedDuplicate: item.suspectedDuplicate,
      matchedItemIds: item.matchedItemIds,
      statusHistory: item.statusHistory,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  public sanitizeUser(user: StoredUser): UserProfile {
    return {
      id: user.id,
      studentId: user.studentId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      department: user.department,
      role: user.role,
      active: user.active,
      createdAt: user.createdAt,
    };
  }

  private tokenize(text: string): Set<string> {
    const stopwords = new Set(['the', 'and', 'for', 'near', 'with', 'from', 'that', 'this', 'found', 'lost', 'item']);
    return new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2 && !stopwords.has(w))
    );
  }

  public computeSimilarity(
    a: { title: string; description: string; category: string; location: string; date: string },
    b: { title: string; description: string; category: string; location: string; date: string }
  ): number {
    let score = 0;
    if (a.category === b.category) score += 0.35;
    if (a.location === b.location) score += 0.2;

    const tokensA = this.tokenize(`${a.title} ${a.description}`);
    const tokensB = this.tokenize(`${b.title} ${b.description}`);
    if (tokensA.size > 0 && tokensB.size > 0) {
      let overlap = 0;
      for (const t of tokensA) {
        if (tokensB.has(t)) overlap++;
      }
      const jaccard = overlap / Math.max(tokensA.size, tokensB.size);
      score += jaccard * 0.45;
    }

    const diffDays = Math.abs(new Date(a.date).getTime() - new Date(b.date).getTime()) / 86400000;
    if (!Number.isNaN(diffDays) && diffDays <= 3) {
      score += 0.1;
    }

    return Math.min(1, score);
  }

  public findSimilarSameType(
    type: ReportType,
    candidate: { title: string; description: string; category: string; location: string; date: string }
  ): PublicItemReport[] {
    return this.state.items
      .filter((item) => item.active && item.type === type && item.status !== 'Closed' && item.status !== 'Rejected')
      .filter((item) => this.computeSimilarity(item, candidate) >= 0.58)
      .map((item) => this.toPublicItem(item));
  }

  public findPotentialOppositeMatches(target: StoredItem): StoredItem[] {
    const oppositeType: ReportType = target.type === 'Lost' ? 'Found' : 'Lost';
    return this.state.items.filter(
      (item) =>
        item.active &&
        item.id !== target.id &&
        item.type === oppositeType &&
        item.status !== 'Returned' &&
        item.status !== 'Closed' &&
        item.status !== 'Rejected' &&
        this.computeSimilarity(item, target) >= 0.52
    );
  }

  public addNotification(params: {
    userId: string;
    title: string;
    message: string;
    relatedItemId?: string;
    relatedClaimId?: string;
  }): NotificationRecord {
    const record: NotificationRecord = {
      id: `ntf-${crypto.randomUUID().slice(0, 8)}`,
      userId: params.userId,
      title: params.title,
      message: params.message,
      relatedItemId: params.relatedItemId,
      relatedClaimId: params.relatedClaimId,
      read: false,
      createdAt: new Date().toISOString(),
    };
    this.state.notifications.unshift(record);
    return record;
  }

  public addAuditLog(params: {
    action: string;
    targetType: AuditLogEntry['targetType'];
    targetId: string;
    adminId: string;
    adminName: string;
    adminEmail: string;
    details: string;
  }): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: `aud-${crypto.randomUUID().slice(0, 8)}`,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      adminId: params.adminId,
      adminName: params.adminName,
      adminEmail: params.adminEmail,
      details: params.details,
      timestamp: new Date().toISOString(),
    };
    this.state.auditLogs.unshift(entry);
    return entry;
  }

  public updateItemStatus(item: StoredItem, status: ItemStatus, note: string, actorRole: 'system' | 'student' | 'admin'): void {
    item.status = status;
    item.updatedAt = new Date().toISOString();
    item.statusHistory.push({
      status,
      timestamp: item.updatedAt,
      note,
      actorRole,
    });
  }
}
