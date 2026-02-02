// TypeScript interfaces for HR Analytics Dashboard

export type ScreeningStatus = 'Cleared' | 'Not Cleared' | 'In progress' | '';
export type InterviewStatus = 'Cleared' | 'Not Cleared' | 'Pending at R1' | 'Pending at R2' | 'Pending at R3' | '';
export type FinalStatus = 'Rejected' | 'Selected' | 'In progress' | 'Req on hold' | 'Pending at R1' | 'Pending at R2' | 'Pending at R3' | '';

export interface CandidateRecord {
  srNo: number;
  reqDate: Date | null;
  hmDetails: string;
  skill: string;
  designation: string;
  locationOfPosting: string;
  noOfOpenings: number;
  status: string;
  candidateName: string;
  resume: string;
  recruiterName: string;
  source: string;
  subSource: string;
  sourcingDate: Date | null;
  mobileNumber: string;
  mailId: string;
  gender: string;
  experience: number | null;
  currentCTC: number | null;
  expectedCTC: number | null;
  currentCompany: string;
  currentLocation: string;
  noticePeriod: string;
  dateOfBirth: Date | null;
  screeningDate: Date | null;
  testForScreening: string;
  recruiterRemarks: string;
  screeningCheckStatus: ScreeningStatus;
  dateR1Interview: Date | null;
  panelistNameR1: string;
  statusOfR1: InterviewStatus;
  dateOfFeedbackSharedR1: Date | null;
  dateR2Interview: Date | null;
  panelistNameR2: string;
  statusOfR2: InterviewStatus;
  dateOfFeedbackSharedR2: Date | null;
  dateR3Interview: Date | null;
  panelistNameR3: string;
  statusOfR3: InterviewStatus;
  dateOfFeedbackSharedR3: Date | null;
  assignmentStatus: string;
  finalStatus: FinalStatus;
  rejectionReason: string;
  reasonForOthersInAMColumn: string;
  rejectionMailerDate: Date | null;
  onboardingDocDate: Date | null;
  approvalDate: Date | null;
  offerDate: Date | null;
  offerAcceptanceDate: Date | null;
  pcRequestDate: Date | null;
  joiningDate: Date | null;
  ttf60Days: number | null;
  delayInTTF: number | null;
  tth30Days: number | null;
  delayInTTH: number | null;
}

export interface PipelineMetrics {
  totalCandidates: number;
  screeningCleared: number;
  screeningNotCleared: number;
  screeningInProgress: number;
  r1Cleared: number;
  r1NotCleared: number;
  r1Pending: number;
  r2Cleared: number;
  r2NotCleared: number;
  r2Pending: number;
  r3Cleared: number;
  r3NotCleared: number;
  r3Pending: number;
  offered: number;
  joined: number;
  selected: number;
  rejected: number;
  inProgress: number;
  onHold: number;
}

export interface SourceDistributionItem {
  source: string;
  count: number;
  percentage: number;
  subSources?: { subSource: string; count: number }[];
}

export interface RecruiterMetrics {
  recruiterName: string;
  candidatesSourced: number;
  screeningCleared: number;
  screeningNotCleared: number;
  screeningInProgress: number;
  screeningRate: number;
  alertCount: number;
  avgSourcingToScreeningHours: number;
  conversionRate: number; // Selected / Total sourced
  candidates: CandidateRecord[];
}

export interface InterviewRecord {
  candidateName: string;
  round: 'R1' | 'R2' | 'R3';
  interviewDate: Date | null;
  feedbackDate: Date | null;
  timeDifferenceHours: number | null;
  status: InterviewStatus;
  finalStatus: FinalStatus;
  isAlert: boolean;
  isPendingFeedback: boolean;
}

export interface PanelistMetrics {
  panelistName: string;
  totalInterviews: number;
  r1Interviews: number;
  r2Interviews: number;
  r3Interviews: number;
  passedInterviews: number;
  failedInterviews: number;
  pendingInterviews: number;
  passRate: number;
  r1PassRate: number;
  r2PassRate: number;
  r3PassRate: number;
  avgFeedbackTimeHours: number;
  alertCount: number;
  interviews: InterviewRecord[];
}

export interface DateFilters {
  reqDateFrom?: Date | null;
  reqDateTo?: Date | null;
  sourcingDateFrom?: Date | null;
  sourcingDateTo?: Date | null;
  screeningDateFrom?: Date | null;
  screeningDateTo?: Date | null;
}

export type UserType = 'super-admin' | 'hiring-manager' | 'recruiter' | 'panellist';

export interface UserState {
  userType: UserType | null;
  userName: string | null;
  setUserType: (type: UserType | null) => void;
  setUserName: (name: string | null) => void;
}
