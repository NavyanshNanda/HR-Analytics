import Papa from 'papaparse';
import { CandidateRecord, ScreeningStatus, InterviewStatus, FinalStatus } from './types';
import { parseDate, parseNumber } from './utils';

// CSV column mapping
const columnMapping: Record<string, keyof CandidateRecord> = {
  'Sr No.': 'srNo',
  'Req Date': 'reqDate',
  'HM Details': 'hmDetails',
  'Skill': 'skill',
  'Designation': 'designation',
  'Location of posting': 'locationOfPosting',
  'No. of Openings': 'noOfOpenings',
  'Status': 'status',
  'Candidate Name': 'candidateName',
  'Resume': 'resume',
  'Recruiter Name': 'recruiterName',
  'Source': 'source',
  'Sub Source': 'subSource',
  'Sourcing Date': 'sourcingDate',
  'Mobile Number': 'mobileNumber',
  'Mail Id': 'mailId',
  'Gender': 'gender',
  'Experience': 'experience',
  'Current CTC': 'currentCTC',
  'Expected CTC': 'expectedCTC',
  'Current Company': 'currentCompany',
  'Current location': 'currentLocation',
  'Notice Period/Last working day': 'noticePeriod',
  'Date of Birth': 'dateOfBirth',
  'Screening Date': 'screeningDate',
  'Test for screening': 'testForScreening',
  'Recruiter remarks if any': 'recruiterRemarks',
  'Screening check status': 'screeningCheckStatus',
  'Date R1 Interview': 'dateR1Interview',
  'Status of R1': 'statusOfR1',
  'Date R2 Interview': 'dateR2Interview',
  'Status of R2': 'statusOfR2',
  'Date R3 Interview': 'dateR3Interview',
  'Status of R3': 'statusOfR3',
  'Assignment Status': 'assignmentStatus',
  'Final Status': 'finalStatus',
  'Rejection Reason': 'rejectionReason',
  'Reason for Others in AM column': 'reasonForOthersInAMColumn',
  'Rejection Mailer Date': 'rejectionMailerDate',
  'Onboarding doc date': 'onboardingDocDate',
  'Approval date': 'approvalDate',
  'Offer date': 'offerDate',
  'Offer Acceptance Date': 'offerAcceptanceDate',
  'PC Request date': 'pcRequestDate',
  'Joining Date': 'joiningDate',
  'TTF (60 days)': 'ttf60Days',
  'Delay in TTF': 'delayInTTF',
  'TTH (30 days)': 'tth30Days',
  'Delay in TTH': 'delayInTTH',
};

// Normalize screening status
function normalizeScreeningStatus(value: string): ScreeningStatus {
  const normalized = value?.toLowerCase().trim() || '';
  if (normalized === 'cleared') return 'Cleared';
  if (normalized === 'not cleared') return 'Not Cleared';
  if (normalized === 'in progress') return 'In progress';
  return '';
}

// Normalize interview status
function normalizeInterviewStatus(value: string): InterviewStatus {
  const normalized = value?.toLowerCase().trim() || '';
  if (normalized === 'cleared') return 'Cleared';
  if (normalized === 'not cleared') return 'Not Cleared';
  if (normalized.includes('pending at r1') || normalized === 'pending at r1') return 'Pending at R1';
  if (normalized.includes('pending at r2') || normalized === 'pending at r2') return 'Pending at R2';
  if (normalized.includes('pending at r3') || normalized === 'pending at r3') return 'Pending at R3';
  return '';
}

// Normalize final status
function normalizeFinalStatus(value: string): FinalStatus {
  const normalized = value?.toLowerCase().trim() || '';
  if (normalized === 'rejected' || normalized.includes('reject')) return 'Rejected';
  if (normalized === 'selected' || normalized === 'yes') return 'Selected';
  if (normalized === 'in progress') return 'In progress';
  if (normalized.includes('hold')) return 'Req on hold';
  if (normalized.includes('pending at r1')) return 'Pending at R1';
  if (normalized.includes('pending at r2')) return 'Pending at R2';
  if (normalized.includes('pending at r3')) return 'Pending at R3';
  return '';
}

// Parse CSV row to CandidateRecord
function parseRow(row: Record<string, string>, headers: string[]): CandidateRecord | null {
  // Skip header rows and empty rows
  const firstValue = Object.values(row)[0]?.toString().trim() || '';
  if (!firstValue || firstValue.toLowerCase().includes('insert new row') || firstValue === 'Sr No.') {
    return null;
  }
  
  // Skip rows without valid candidate data
  const candidateName = row['Candidate Name']?.trim();
  if (!candidateName) {
    return null;
  }

  // Find panelist columns dynamically (they might be repeated in headers)
  let panelistNameR1 = '';
  let panelistNameR2 = '';
  let panelistNameR3 = '';
  let dateOfFeedbackSharedR1: Date | null = null;
  let dateOfFeedbackSharedR2: Date | null = null;
  let dateOfFeedbackSharedR3: Date | null = null;

  // Handle panelist names - they appear as repeated "Panelist name" columns
  const panelistColumns = headers.filter(h => h.toLowerCase().includes('panelist name'));
  const feedbackColumns = headers.filter(h => h.toLowerCase().includes('date of feedback'));
  
  // Get values by position in the original row
  const values = Object.values(row);
  
  // Find indices for panelist names
  let panelistIdx = 0;
  let feedbackIdx = 0;
  
  headers.forEach((header, idx) => {
    const headerLower = header.toLowerCase();
    if (headerLower === 'panelist name' || headerLower.includes('panelist name')) {
      const value = values[idx]?.toString().trim() || '';
      if (panelistIdx === 0) {
        panelistNameR1 = value;
      } else if (panelistIdx === 1) {
        panelistNameR2 = value;
      } else if (panelistIdx === 2) {
        panelistNameR3 = value;
      }
      panelistIdx++;
    }
    
    if (headerLower.includes('date of feedback')) {
      const value = values[idx]?.toString().trim() || '';
      if (feedbackIdx === 0) {
        dateOfFeedbackSharedR1 = parseDate(value);
      } else if (feedbackIdx === 1) {
        dateOfFeedbackSharedR2 = parseDate(value);
      } else if (feedbackIdx === 2) {
        dateOfFeedbackSharedR3 = parseDate(value);
      }
      feedbackIdx++;
    }
  });

  const record: CandidateRecord = {
    srNo: parseNumber(row['Sr No.']) || 0,
    reqDate: parseDate(row['Req Date']),
    hmDetails: row['HM Details']?.trim() || '',
    skill: row['Skill']?.trim() || '',
    designation: row['Designation']?.trim() || '',
    locationOfPosting: row['Location of posting']?.trim() || '',
    noOfOpenings: parseNumber(row['No. of Openings']) || 0,
    status: row['Status']?.trim() || '',
    candidateName: candidateName,
    resume: row['Resume']?.trim() || '',
    recruiterName: row['Recruiter Name']?.trim() || '',
    source: row['Source']?.trim() || '',
    subSource: row['Sub Source']?.trim() || '',
    sourcingDate: parseDate(row['Sourcing Date']),
    mobileNumber: row['Mobile Number']?.toString().trim() || '',
    mailId: row['Mail Id']?.trim() || '',
    gender: row['Gender']?.trim() || '',
    experience: parseNumber(row['Experience']),
    currentCTC: parseNumber(row['Current CTC']),
    expectedCTC: parseNumber(row['Expected CTC']),
    currentCompany: row['Current Company']?.trim() || '',
    currentLocation: row['Current location']?.trim() || '',
    noticePeriod: row['Notice Period/Last working day']?.trim() || '',
    dateOfBirth: parseDate(row['Date of Birth']),
    screeningDate: parseDate(row['Screening Date']),
    testForScreening: row['Test for screening']?.trim() || '',
    recruiterRemarks: row['Recruiter remarks if any']?.trim() || '',
    screeningCheckStatus: normalizeScreeningStatus(row['Screening check status'] || ''),
    dateR1Interview: parseDate(row['Date R1 Interview']),
    panelistNameR1: panelistNameR1,
    statusOfR1: normalizeInterviewStatus(row['Status of R1'] || ''),
    dateOfFeedbackSharedR1: dateOfFeedbackSharedR1,
    dateR2Interview: parseDate(row['Date R2 Interview']),
    panelistNameR2: panelistNameR2,
    statusOfR2: normalizeInterviewStatus(row['Status of R2'] || ''),
    dateOfFeedbackSharedR2: dateOfFeedbackSharedR2,
    dateR3Interview: parseDate(row['Date R3 Interview']),
    panelistNameR3: panelistNameR3,
    statusOfR3: normalizeInterviewStatus(row['Status of R3'] || ''),
    dateOfFeedbackSharedR3: dateOfFeedbackSharedR3,
    assignmentStatus: row['Assignment Status']?.trim() || '',
    finalStatus: normalizeFinalStatus(row['Final Status'] || ''),
    rejectionReason: row['Rejection Reason']?.trim() || '',
    reasonForOthersInAMColumn: row['Reason for Others in AM column']?.trim() || '',
    rejectionMailerDate: parseDate(row['Rejection Mailer Date']),
    onboardingDocDate: parseDate(row['Onboarding doc date']),
    approvalDate: parseDate(row['Approval date']),
    offerDate: parseDate(row['Offer date']),
    offerAcceptanceDate: parseDate(row['Offer Acceptance Date']),
    pcRequestDate: parseDate(row['PC Request date']),
    joiningDate: parseDate(row['Joining Date']),
    ttf60Days: parseNumber(row['TTF (60 days)']),
    delayInTTF: parseNumber(row['Delay in TTF']),
    tth30Days: parseNumber(row['TTH (30 days)']),
    delayInTTH: parseNumber(row['Delay in TTH']),
  };

  return record;
}

// Parse CSV content
export function parseCSVContent(csvContent: string): CandidateRecord[] {
  // Split content into lines and skip the first instruction row
  const lines = csvContent.split('\n');
  
  // Find the header row (the one that starts with "Sr No.")
  let headerIndex = 0;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    if (lines[i].includes('Sr No.')) {
      headerIndex = i;
      break;
    }
  }
  
  // Rejoin from the header row onwards
  const cleanedContent = lines.slice(headerIndex).join('\n');
  
  const result = Papa.parse(cleanedContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });
  
  const headers = result.meta.fields || [];
  const records: CandidateRecord[] = [];
  
  result.data.forEach((row: any) => {
    const record = parseRow(row, headers);
    if (record) {
      records.push(record);
    }
  });
  
  return records;
}

// Filter functions for each user type
export function filterDataForHiringManager(data: CandidateRecord[], hmName: string): CandidateRecord[] {
  return data.filter(record => 
    record.hmDetails.toLowerCase().trim() === hmName.toLowerCase().trim()
  );
}

export function filterDataForRecruiter(data: CandidateRecord[], recruiterName: string): CandidateRecord[] {
  return data.filter(record => 
    record.recruiterName.toLowerCase().trim() === recruiterName.toLowerCase().trim()
  );
}

export function filterDataForPanellist(data: CandidateRecord[], panelistName: string): CandidateRecord[] {
  const nameLower = panelistName.toLowerCase().trim();
  return data.filter(record => 
    record.panelistNameR1?.toLowerCase().includes(nameLower) ||
    record.panelistNameR2?.toLowerCase().includes(nameLower) ||
    record.panelistNameR3?.toLowerCase().includes(nameLower)
  );
}

// Get unique values for dropdowns
export function getUniqueHiringManagers(data: CandidateRecord[]): string[] {
  const hms = data
    .map(r => r.hmDetails)
    .filter(hm => hm && hm.trim() !== '' && !hm.includes('#N/A'));
  return Array.from(new Set(hms)).sort();
}

export function getUniqueRecruiters(data: CandidateRecord[]): string[] {
  const recruiters = data
    .map(r => r.recruiterName)
    .filter(r => r && r.trim() !== '');
  return Array.from(new Set(recruiters)).sort();
}

export function getUniquePanelists(data: CandidateRecord[]): string[] {
  const panelists: string[] = [];
  
  data.forEach(record => {
    if (record.panelistNameR1 && record.panelistNameR1.trim()) {
      panelists.push(record.panelistNameR1.trim());
    }
    if (record.panelistNameR2 && record.panelistNameR2.trim()) {
      panelists.push(record.panelistNameR2.trim());
    }
    if (record.panelistNameR3 && record.panelistNameR3.trim()) {
      panelists.push(record.panelistNameR3.trim());
    }
  });
  
  // Clean and deduplicate
  const unique = Array.from(new Set(panelists))
    .filter(p => p && !p.toLowerCase().includes('na') && p.length > 1)
    .sort();
  
  return unique;
}
