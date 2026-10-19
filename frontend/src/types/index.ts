// API Response Envelope
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: String;
  data: T;
  errors?: any;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber?: number;
  page?: number;
  pageSize?: number;
  size?: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}

// User Enums
export type UserRole =
  | 'ADMIN'
  | 'SECURITY_OFFICER'
  | 'SECURITY_GUARD'
  | 'HOSTEL_WARDEN'
  | 'CANTEEN_MANAGER'
  | 'VISITOR'
  | 'STUDENT'
  | 'STAFF'
  | 'GUARD';

export type HostType =
  | 'FACULTY'
  | 'HOD'
  | 'ADMIN_STAFF'
  | 'STUDENT'
  | 'ALUMNI'
  | 'VENDOR'
  | 'OTHER';

export type HostDepartment =
  | 'IT'
  | 'CE'
  | 'ENTC'
  | 'ECE'
  | 'AIDS'
  | 'ADMIN';

export type VehicleCategory = 'STUDENT' | 'STAFF' | 'VISITOR' | 'CONTRACTOR' | 'VIP';
export type PassStatus = 'PENDING' | 'APPROVED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'REJECTED' | 'EXPIRED';
export type OutpassStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXITED' | 'RETURNED' | 'EXPIRED' | 'COMPLETED';
export type ShiftStatus = 'ONGOING' | 'COMPLETED' | 'ABORTED';
export type LogType = 'GENERAL' | 'INCIDENT' | 'CHECK_ROUNDS' | 'HANDOVER' | 'MAINTENANCE';
export type NotificationEventType =
  | 'VISITOR_CHECK_IN'
  | 'GATE_PASS_APPROVED'
  | 'GATE_PASS_REJECTED'
  | 'OUTPASS_APPROVED'
  | 'OUTPASS_REJECTED'
  | 'OUTPASS_LATE_ALERT'
  | 'VEHICLE_BLACKLISTED'
  | 'VENDOR_BLACKLISTED'
  | 'SHIFT_STARTED'
  | 'SHIFT_ENDED';

export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';

// Data Interfaces
export interface User {
  id: number;
  username: string;
  role: UserRole;
  fullName: string;
  phone?: string;
  email?: string;
  active: boolean;
  isLateComerPermitted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: User;
}

export interface Visitor {
  id: number;
  name: string;
  mobile: string;
  purpose: string;
  hostName: string;
  hostType: HostType;
  hostDepartment: HostDepartment;
  studentPrn?: string;
  gateId: number;
  gateName?: string;
  vehicleNumber?: string;
  timeIn: string;
  timeOut?: string;
  idProofType: string;
  idProofNumber: string;
  photoUrl?: string;
  photoPath?: string;
  faceId?: string;
  isBlacklistedMatch: boolean;
  notes?: string;
  createdAt: string;
  createdByUsername?: string;
  passNumber?: string;
  qrCodeDataUrl?: string;
  faceEnrolled?: boolean;
  status?: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'REJECTED' | 'EXPIRED' | 'AUTO_CLOSED_EOD';
  closedAt?: string;
  closureReason?: string;
  closedBy?: string;
}

export interface VisitorRecognitionResponse {
  matched: boolean;
  visitorId?: number;
  visitorName?: string;
  mobileNumber?: string;
  hostPersonOrDepartment?: string;
  purpose?: string;
  photoPath?: string;
  hostName?: string;
  hostType?: HostType;
  hostDepartment?: HostDepartment;
  studentPrn?: string;
  idProofType?: string;
  idProofNumber?: string;
  vehicleNumber?: string;
  confidenceDistance?: number;
  similarity?: number;
  matchType?: 'exact' | 'appearance_shift';
  numFaces?: number;
  isAmbiguous?: boolean;
  message?: string;
  quality?: {
    suitable?: boolean;
    blur_score?: number;
    brightness?: number;
    issues?: string[];
  };
}

export interface Gate {
  id: number;
  name: string;
  location?: string;
  active: boolean;
  createdAt: string;
}

export interface Guard {
  id: number;
  userId: number;
  username: string;
  fullName: string;
  phone?: string;
  employeeCode?: string;
  badgeNumber?: string;
  assignedGateId?: number;
  assignedGateName?: string;
  active: boolean;
  createdAt: string;
}

export interface Shift {
  id: number;
  guardId: number;
  guardName?: string;
  gateId: number;
  gateName?: string;
  startTime: string;
  endTime?: string;
  date: string;
  status: ShiftStatus;
}

export interface ShiftLog {
  id: number;
  shiftId: number;
  timestamp: string;
  description: string;
  logType: LogType;
}

export interface GuardDashboard {
  activeShiftsCount: number;
  activeGuardCount: number;
  activeVisitorsInsideCount: number;
  totalVisitorsCheckedInTodayCount: number;
  recentLogs: ShiftLog[];
}

export interface Vehicle {
  id: number;
  registrationNumber: string;
  vehicleType?: string;
  category: VehicleCategory;
  ownerName?: string;
  ownerContact?: string;
  ownerUserId?: number;
  color?: string;
  isBlacklisted: boolean;
  blacklistReason?: string;
  createdAt: string;
  createdByUsername?: string;
}

export interface VehicleLog {
  id: number;
  vehicleId: number;
  registrationNumber: string;
  category: VehicleCategory;
  gateId: number;
  gateName: string;
  entryTime: string;
  exitTime?: string;
  actionTime?: string;
  processedByGuardId?: number;
  processedByGuardName?: string;
  driverName?: string;
  driverContact?: string;
  purpose?: string;
  entryNote?: string;
  exitNote?: string;
  recordedByUsername: string;
}

export interface Vendor {
  id: number;
  companyName: string;
  contactPerson: string;
  contactPhone?: string;
  phone?: string;
  contactEmail?: string;
  email?: string;
  serviceType?: string;
  assignedDepartment?: string;
  workDescription?: string;
  isBlacklisted: boolean;
  blacklistReason?: string;
  createdAt: string;
  createdByUsername?: string;
}

export interface VendorVisit {
  id: number;
  vendorId: number;
  companyName: string;
  contactPerson: string;
  gateId: number;
  gateName: string;
  entryTime: string;
  exitTime?: string;
  vehicleNumber?: string;
  workerCount: number;
  purpose: string;
  entryNote?: string;
  exitNote?: string;
  recordedByUsername: string;
}

export interface StudentGatePass {
  id: number;
  passNumber?: string;
  studentUserId?: number;
  studentUsername?: string;
  studentName: string;
  studentPrn: string;
  studentDepartment: string;
  studentClass?: string;
  studentDivision?: string;
  studentMobile: string;
  purpose: string;
  destination: string;
  departureTime: string;
  expectedReturnTime: string;
  actualReturnTime?: string;
  status: PassStatus;
  approvedById?: number;
  approvedByName?: string;
  approvedByUsername?: string;
  approvalNotes?: string;
  rejectionReason?: string;
  wardenApprovedAt?: string;
  gateId?: number;
  gateName?: string;
  gateExitAt?: string;
  gateEntryAt?: string;
  createdAt: string;
  createdByUsername?: string;
}

export interface HostelOutpass {
  id: number;
  outpassNumber?: string;
  studentUserId?: number;
  studentUsername?: string;
  studentName: string;
  studentPrn: string;
  studentRoom?: string;
  roomNumber?: string;
  studentHostel?: string;
  hostelBlock?: string;
  studentClass?: string;
  studentDivision?: string;
  studentMobile: string;
  parentContact?: string;
  parentMobile?: string;
  emergencyContact?: string;
  reason: string;
  studentNote?: string;
  destination?: string;
  destinationAddress?: string;
  departureTime?: string;
  departureDate?: string;
  expectedReturnTime?: string;
  expectedReturnDate?: string;
  actualReturnTime?: string;
  status: OutpassStatus;
  wardenId?: number;
  wardenUsername?: string;
  approvedByUsername?: string;
  wardenRemarks?: string;
  rejectionReason?: string;
  wardenActedAt?: string;
  gateExitAt?: string;
  gateEntryAt?: string;
  gateId?: number;
  gateName?: string;
  isLateReturn: boolean;
  createdAt: string;
  createdByUsername?: string;
}

export interface NotificationItem {
  id: number;
  recipient: string;
  type: 'EMAIL' | 'SMS' | 'IN_APP';
  eventType: NotificationEventType;
  subject?: string;
  message: string;
  status: NotificationStatus;
  errorMessage?: string;
  createdAt: string;
  sentAt?: string;
}

export interface GuardSelfDashboardResponse {
  guardName: string;
  guardId: string;
  shiftId?: number;
  gateName: string;
  gateId?: number;
  shiftName: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
  dutyStatus: string;
  visitorsEnteredToday: number;
  visitorsExitedToday: number;
  vehiclesEnteredToday: number;
  vehiclesExitedToday: number;
  materialsProcessedToday: number;
  studentPassesProcessedToday?: number;
  hostelVerifications?: number;
  activeVisitorsInsideCampus: number;
  todayTotalVisitors?: number;
  todayApprovedVisitors?: number;
  todayRejectedVisitors?: number;
  todayCurrentlyInside?: number;
  todayCheckedOutVisitors?: number;
  recentLogs: ShiftLog[];
}

export interface SystemStatisticsResponse {
  filterType: 'LIFETIME' | 'TODAY' | 'YESTERDAY' | 'THIS_MONTH' | 'MONTH' | 'CUSTOM';
  fromDate?: string;
  toDate?: string;
  label: string;
  totalVisitors: number;
  approvedVisitors: number;
  rejectedVisitors: number;
  completedVisits: number;
  currentlyInside: number;
  totalVehicles: number;
  totalStudentPasses: number;
  totalHostelOutpasses: number;
  totalVendorVisits: number;
  pendingTokens: number;
  generatedAt: string;
  generatedBy: string;
  gateName?: string;
}

export interface StudentAuthDto {
  prn: string;
  studentName: string;
  branchYear: string;
  hostelRoom: string;
  mobileNumber: string;
  active: boolean;
  accessToken: string;
  refreshToken: string;
}

export interface StaffBreak {
  id: number;
  userId: number;
  username: string;
  fullName: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  status: 'ONGOING' | 'COMPLETED';
  note?: string;
  createdAt: string;
}

