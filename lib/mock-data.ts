// Types
export type UserRole = "admin" | "telecaller" | "spoc"

export type ProspectStatus =
  | "New"                      // 1. Not yet contacted
  | "Contacted"                // 2. Awaiting response
  | "Warm"                     // 5. Interested, needs follow-up
  | "Hot"                      // 6. Strong interest, ready for next step
  | "VisitScheduled"           // 7. Visit planned
  | "VisitDone"                // 8. Visited but not confirmed
  | "AdmissionDone"            // 9. Successfully admitted
  | "Cold-NoResponse"          // 3. Multiple attempts, no answer
  | "Cold-NotInterested"       // 4. Clearly said not interested
  | "Lost"                     // 10. Went to a competitor
  | "Callback Scheduled"
  | "Called"

export type CallOutcome =
  | "NotAnswered"
  | "Busy"
  | "WrongNumber"
  | "CallBack"
  | "NotInterested"
  | "DNC"
  | "LanguageBarrier"
  | "Interested"
  | "Qualified"
  | "VisitScheduled"
  | "VisitDone"
  | "AdmissionDone"
  | "ReEngage"
  | "EnrolledElsewhere"

export type CourseInterest = "CourseA" | "CourseB" | "CourseC" | "Unknown"

export type FollowUpStatus = "Pending" | "Completed" | "Overdue"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  mobile: string
  phone: string
  status: "Active" | "Inactive"
  isActive: boolean
  hubId?: string
  createdAt: string
  lastLoginAt?: Date
}

export interface Prospect {
  id: string
  name: string
  mobile: string
  email?: string
  location: string
  schoolLastAttended: string
  courseInterest: CourseInterest
  status: ProspectStatus
  assignedTo?: string
  assignedDate?: string
  source: string
  createdAt: string
  age?: number
  lastCallAt?: string
  callbackDateTime?: string
  nextCallDate?: string | null
  nextCallTime?: string | null
  followupStatus?: string | null
  remarks?: string | null
  purposeOfCall?: string | null
  hubId?: string
}

export interface CallAttempt {
  id: string
  prospectId: string
  telecallerId: string
  outcome: CallOutcome
  callbackDatetime?: string
  courseConfirmed?: CourseInterest
  notes?: string
  calledAt: string
}

export interface FieldReport {
  id: string
  spocId: string
  spocName: string
  reportDate: string
  areaLocation: string
  schoolsVisited: number
  coachingCentresVisited: number
  admissionCentresVisited: number
  brandingDone: boolean
  alumniOutreach: boolean
  corporateOutreach: boolean
  referralNetwork: boolean
  submittedAt?: string
  isDraft: boolean
}

export interface FollowUpTask {
  id: string
  sourceReportId: string
  assignedToRole: "Telecaller" | "SPOC"
  assignedToUser?: string
  institutionName: string
  actionDescription: string
  followUpDate: string
  status: FollowUpStatus
  resolutionNote?: string
  createdAt: string
}

export interface Hub {
  id: string
  name: string
  city: string
  state: string
  address?: string
  isActive: boolean
}

export interface Course {
  id: string
  name: string
  code: string
  duration: string
  mode: "Online" | "Offline" | "Hybrid"
  fee: number
  status: "Active" | "Inactive"
}

export interface Notification {
  id: string
  type: "callback" | "assignment" | "followup" | "report" | "escalation" | "unreachable"
  message: string
  createdAt: string
  read: boolean
}

// EMPTY MOCK DATA (Ready for production/live database)
export const mockHubs: Hub[] = []
export const mockUsers: User[] = []
export const mockCourses: Course[] = []
export const mockProspects: Prospect[] = []
export const mockCallAttempts: CallAttempt[] = []
export const mockFieldReports: FieldReport[] = [
  {
    id: "report-1",
    spocId: "spoc-1",
    spocName: "Vikram Singh",
    reportDate: "2026-05-01",
    areaLocation: "Poonamallee",
    schoolsVisited: 3,
    coachingCentresVisited: 2,
    admissionCentresVisited: 1,
    brandingDone: true,
    alumniOutreach: true,
    corporateOutreach: false,
    referralNetwork: true,
    submittedAt: "2026-05-01T17:00:00Z",
    isDraft: false,
  },
  {
    id: "report-2",
    spocId: "spoc-1",
    spocName: "Vikram Singh",
    reportDate: "2026-04-30",
    areaLocation: "Tambaram",
    schoolsVisited: 5,
    coachingCentresVisited: 1,
    admissionCentresVisited: 2,
    brandingDone: true,
    alumniOutreach: false,
    corporateOutreach: true,
    referralNetwork: false,
    submittedAt: "2026-04-30T18:30:00Z",
    isDraft: false,
  }
]
export const mockFollowUps: FollowUpTask[] = [
  {
    id: "task-1",
    sourceReportId: "report-1",
    assignedToRole: "Telecaller",
    institutionName: "Brilliant Coaching Centre",
    actionDescription: "Follow up with the center manager regarding student interest list.",
    followUpDate: new Date().toISOString(),
    status: "Pending",
    createdAt: new Date().toISOString(),
  },
  {
    id: "task-2",
    sourceReportId: "report-2",
    assignedToRole: "Telecaller",
    institutionName: "St. Mary's School",
    actionDescription: "Call the principal to confirm seminar date for Class 12 students.",
    followUpDate: new Date().toISOString(),
    status: "Pending",
    createdAt: new Date().toISOString(),
  }
]
export const mockNotifications: Notification[] = [
  { id: "1", type: "followup", message: "New task: Follow up with Brilliant Coaching Centre", createdAt: new Date().toISOString(), read: false },
  { id: "2", type: "followup", message: "New task: Call the principal of St. Mary's School", createdAt: new Date().toISOString(), read: false },
  { id: "3", type: "report", message: "Your yesterday's report was reviewed", createdAt: new Date().toISOString(), read: false },
  { id: "4", type: "assignment", message: "5 new leads assigned to your hub", createdAt: new Date().toISOString(), read: false },
]

export const telecallerStats = {
  todaysProspects: 0,
  called: 0,
  pending: 0,
  callbacksDue: 0,
  qualified: 0,
}

export const spocStats = {
  todayDate: new Date().toISOString().split('T')[0],
  reportsSubmitted: 0,
  pendingFollowups: 0,
  telecallerFollowupsRaised: 0,
}

export const adminStats = {
  totalProspects: 0,
  assignedToday: 0,
  callsMadeToday: 0,
  qualifiedToday: 0,
  fieldReportsToday: 0,
  followupsPending: 0,
}

// Helper to get current user (for auth simulation)
export function getCurrentUser(role: UserRole): User | undefined {
  return mockUsers.find((u) => u.role === role)
}

// Helper to get prospects for a telecaller
export function getProspectsForTelecaller(telecallerId: string): Prospect[] {
  return mockProspects.filter((p) => p.assignedTo === telecallerId)
}

// Helper to get call history for a prospect
export function getCallHistory(prospectId: string): CallAttempt[] {
  return mockCallAttempts.filter((ca) => ca.prospectId === prospectId)
}

// Helper to get follow-ups for a user
export function getFollowUpsForUser(userId: string): FollowUpTask[] {
  return mockFollowUps.filter((fu) => fu.assignedToUser === userId)
}

// Helper to get field reports for a spoc
export function getFieldReportsForSpoc(spocId: string): FieldReport[] {
  return mockFieldReports.filter((fr) => fr.spocId === spocId)
}

// Alias for mockCallAttempts (for backwards compatibility)
export const mockCallLogs = mockCallAttempts

