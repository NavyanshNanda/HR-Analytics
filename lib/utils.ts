import { parse, isValid, differenceInHours } from 'date-fns';
import { 
  CandidateRecord, 
  DateFilters,
  InterviewRecord 
} from './types';

// Parse date from various formats in the CSV
export function parseDate(dateStr: string | undefined | null): Date | null {
  if (!dateStr || dateStr.trim() === '' || dateStr === '-' || dateStr === '0') {
    return null;
  }
  
  // Clean the string
  const cleaned = dateStr.toString().trim();
  
  // Handle negative numbers (Excel serial dates gone wrong)
  if (cleaned.startsWith('-') && /^-?\d+$/.test(cleaned)) {
    return null;
  }
  
  // Try different date formats
  const formats = [
    'd-MMM-yyyy',    // 1-Dec-2025
    'dd-MMM-yyyy',   // 01-Dec-2025
    'd-MMM-yy',      // 1-Dec-25
    'dd-MMM-yy',     // 01-Dec-25
    'yyyy-MM-dd',    // 2025-12-01
    'dd/MM/yyyy',    // 01/12/2025
    'd/M/yyyy',      // 1/12/2025
    'MM/dd/yyyy',    // 12/01/2025
  ];
  
  for (const format of formats) {
    try {
      const parsed = parse(cleaned, format, new Date());
      if (isValid(parsed)) {
        return parsed;
      }
    } catch {
      continue;
    }
  }
  
  // Try native Date parsing as fallback
  try {
    const date = new Date(cleaned);
    if (isValid(date) && date.getFullYear() > 1990) {
      return date;
    }
  } catch {
    // ignore
  }
  
  return null;
}

// Parse number safely
export function parseNumber(value: string | undefined | null): number | null {
  if (!value || value.trim() === '' || value === '-') {
    return null;
  }
  
  // Remove non-numeric characters except decimal point and negative sign
  const cleaned = value.toString().replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? null : parsed;
}

// Calculate time difference in hours between two dates
export function calculateTimeDifferenceHours(
  startDate: Date | null, 
  endDate: Date | null
): number | null {
  if (!startDate || !endDate) {
    return null;
  }
  
  return differenceInHours(endDate, startDate);
}

// Check if time difference exceeds 48 hours
export function is48HourAlertTriggered(
  startDate: Date | null, 
  endDate: Date | null
): boolean {
  const diff = calculateTimeDifferenceHours(startDate, endDate);
  return diff !== null && diff > 48;
}

// Check if feedback is pending (interview happened but no feedback date)
export function isFeedbackPending(
  interviewDate: Date | null,
  feedbackDate: Date | null,
  status: string
): boolean {
  if (!interviewDate) return false;
  if (feedbackDate) return false;
  
  // Check if status indicates pending
  const pendingStatuses = ['Pending at R1', 'Pending at R2', 'Pending at R3', ''];
  return pendingStatuses.includes(status);
}

// Format hours to readable string
export function formatHoursToReadable(hours: number | null): string {
  if (hours === null) return 'N/A';
  
  if (hours < 24) {
    return `${Math.round(hours)}h`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  
  if (remainingHours === 0) {
    return `${days}d`;
  }
  
  return `${days}d ${remainingHours}h`;
}

// Filter data by date range
export function filterByDateRange(
  data: CandidateRecord[],
  filters: DateFilters
): CandidateRecord[] {
  return data.filter(record => {
    // Req Date filter
    if (filters.reqDateFrom && record.reqDate) {
      if (record.reqDate < filters.reqDateFrom) return false;
    }
    if (filters.reqDateTo && record.reqDate) {
      if (record.reqDate > filters.reqDateTo) return false;
    }
    
    // Sourcing Date filter
    if (filters.sourcingDateFrom && record.sourcingDate) {
      if (record.sourcingDate < filters.sourcingDateFrom) return false;
    }
    if (filters.sourcingDateTo && record.sourcingDate) {
      if (record.sourcingDate > filters.sourcingDateTo) return false;
    }
    
    // Screening Date filter
    if (filters.screeningDateFrom && record.screeningDate) {
      if (record.screeningDate < filters.screeningDateFrom) return false;
    }
    if (filters.screeningDateTo && record.screeningDate) {
      if (record.screeningDate > filters.screeningDateTo) return false;
    }
    
    return true;
  });
}

// Get status color class
export function getStatusColor(status: string): string {
  const normalizedStatus = status.toLowerCase().trim();
  
  if (normalizedStatus === 'selected' || normalizedStatus === 'yes') {
    return 'bg-green-100 text-green-800 border-green-200';
  }
  if (normalizedStatus === 'rejected' || normalizedStatus.includes('reject')) {
    return 'bg-red-100 text-red-800 border-red-200';
  }
  if (normalizedStatus === 'in progress' || normalizedStatus.includes('pending')) {
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  }
  if (normalizedStatus === 'req on hold' || normalizedStatus.includes('hold')) {
    return 'bg-gray-100 text-gray-800 border-gray-200';
  }
  if (normalizedStatus === 'cleared') {
    return 'bg-green-100 text-green-800 border-green-200';
  }
  if (normalizedStatus === 'not cleared') {
    return 'bg-red-100 text-red-800 border-red-200';
  }
  
  return 'bg-gray-100 text-gray-600 border-gray-200';
}

// Get status badge color for Tailwind
export function getStatusBadgeClass(status: string): string {
  const normalizedStatus = status.toLowerCase().trim();
  
  if (normalizedStatus === 'selected' || normalizedStatus === 'cleared' || normalizedStatus === 'yes') {
    return 'status-selected';
  }
  if (normalizedStatus === 'rejected' || normalizedStatus === 'not cleared') {
    return 'status-rejected';
  }
  if (normalizedStatus.includes('pending') || normalizedStatus === 'in progress') {
    return 'status-in-progress';
  }
  if (normalizedStatus.includes('hold')) {
    return 'status-on-hold';
  }
  
  return 'status-default';
}

// Extract all interviews for a panelist across R1, R2, R3
export function extractInterviewsForPanelist(
  data: CandidateRecord[],
  panelistName: string
): InterviewRecord[] {
  const interviews: InterviewRecord[] = [];
  
  data.forEach(record => {
    // Check R1
    if (record.panelistNameR1 && 
        record.panelistNameR1.toLowerCase().includes(panelistName.toLowerCase())) {
      const timeDiff = calculateTimeDifferenceHours(
        record.dateR1Interview,
        record.dateOfFeedbackSharedR1
      );
      
      interviews.push({
        candidateName: record.candidateName,
        round: 'R1',
        interviewDate: record.dateR1Interview,
        feedbackDate: record.dateOfFeedbackSharedR1,
        timeDifferenceHours: timeDiff,
        status: record.statusOfR1,
        finalStatus: record.finalStatus,
        isAlert: is48HourAlertTriggered(record.dateR1Interview, record.dateOfFeedbackSharedR1),
        isPendingFeedback: isFeedbackPending(
          record.dateR1Interview,
          record.dateOfFeedbackSharedR1,
          record.statusOfR1
        ),
      });
    }
    
    // Check R2
    if (record.panelistNameR2 && 
        record.panelistNameR2.toLowerCase().includes(panelistName.toLowerCase())) {
      const timeDiff = calculateTimeDifferenceHours(
        record.dateR2Interview,
        record.dateOfFeedbackSharedR2
      );
      
      interviews.push({
        candidateName: record.candidateName,
        round: 'R2',
        interviewDate: record.dateR2Interview,
        feedbackDate: record.dateOfFeedbackSharedR2,
        timeDifferenceHours: timeDiff,
        status: record.statusOfR2,
        finalStatus: record.finalStatus,
        isAlert: is48HourAlertTriggered(record.dateR2Interview, record.dateOfFeedbackSharedR2),
        isPendingFeedback: isFeedbackPending(
          record.dateR2Interview,
          record.dateOfFeedbackSharedR2,
          record.statusOfR2
        ),
      });
    }
    
    // Check R3
    if (record.panelistNameR3 && 
        record.panelistNameR3.toLowerCase().includes(panelistName.toLowerCase())) {
      const timeDiff = calculateTimeDifferenceHours(
        record.dateR3Interview,
        record.dateOfFeedbackSharedR3
      );
      
      interviews.push({
        candidateName: record.candidateName,
        round: 'R3',
        interviewDate: record.dateR3Interview,
        feedbackDate: record.dateOfFeedbackSharedR3,
        timeDifferenceHours: timeDiff,
        status: record.statusOfR3,
        finalStatus: record.finalStatus,
        isAlert: is48HourAlertTriggered(record.dateR3Interview, record.dateOfFeedbackSharedR3),
        isPendingFeedback: isFeedbackPending(
          record.dateR3Interview,
          record.dateOfFeedbackSharedR3,
          record.statusOfR3
        ),
      });
    }
  });
  
  return interviews;
}

// Utility to safely get unique values from an array
export function getUniqueValues<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

// Format date for display
export function formatDate(date: Date | null): string {
  if (!date) return '-';
  
  try {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
}

// CN utility for class names
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
