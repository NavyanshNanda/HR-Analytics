import { 
  CandidateRecord, 
  PipelineMetrics, 
  SourceDistributionItem,
  RecruiterMetrics,
  PanelistMetrics,
  InterviewRecord
} from './types';
import { 
  calculateTimeDifferenceHours, 
  is48HourAlertTriggered,
  extractInterviewsForPanelist,
  isFeedbackPending
} from './utils';
import { filterDataForRecruiter } from './dataProcessing';

// Calculate recruitment pipeline metrics
export function calculatePipelineMetrics(data: CandidateRecord[]): PipelineMetrics {
  return {
    totalCandidates: data.length,
    screeningCleared: data.filter(r => r.screeningCheckStatus === 'Cleared').length,
    screeningNotCleared: data.filter(r => r.screeningCheckStatus === 'Not Cleared').length,
    screeningInProgress: data.filter(r => r.screeningCheckStatus === 'In progress').length,
    r1Cleared: data.filter(r => r.statusOfR1 === 'Cleared').length,
    r1NotCleared: data.filter(r => r.statusOfR1 === 'Not Cleared').length,
    r1Pending: data.filter(r => r.statusOfR1 === 'Pending at R1').length,
    r2Cleared: data.filter(r => r.statusOfR2 === 'Cleared').length,
    r2NotCleared: data.filter(r => r.statusOfR2 === 'Not Cleared').length,
    r2Pending: data.filter(r => r.statusOfR2 === 'Pending at R2').length,
    r3Cleared: data.filter(r => r.statusOfR3 === 'Cleared').length,
    r3NotCleared: data.filter(r => r.statusOfR3 === 'Not Cleared').length,
    r3Pending: data.filter(r => r.statusOfR3 === 'Pending at R3').length,
    offered: data.filter(r => r.offerDate !== null).length,
    joined: data.filter(r => r.joiningDate !== null).length,
    selected: data.filter(r => r.finalStatus === 'Selected').length,
    rejected: data.filter(r => r.finalStatus === 'Rejected').length,
    inProgress: data.filter(r => 
      r.finalStatus === 'In progress' || 
      r.finalStatus === 'Pending at R1' || 
      r.finalStatus === 'Pending at R2' ||
      r.finalStatus === 'Pending at R3'
    ).length,
    onHold: data.filter(r => r.finalStatus === 'Req on hold').length,
  };
}

// Calculate source distribution
export function calculateSourceDistribution(data: CandidateRecord[]): SourceDistributionItem[] {
  const sourceMap = new Map<string, { count: number; subSources: Map<string, number> }>();
  
  data.forEach(record => {
    const source = record.source || 'Unknown';
    const subSource = record.subSource || 'Direct';
    
    if (!sourceMap.has(source)) {
      sourceMap.set(source, { count: 0, subSources: new Map() });
    }
    
    const sourceData = sourceMap.get(source)!;
    sourceData.count++;
    
    const currentSubCount = sourceData.subSources.get(subSource) || 0;
    sourceData.subSources.set(subSource, currentSubCount + 1);
  });
  
  const total = data.length;
  const result: SourceDistributionItem[] = [];
  
  sourceMap.forEach((value, source) => {
    const subSourcesArray = Array.from(value.subSources.entries()).map(([subSource, count]) => ({
      subSource,
      count,
    }));
    
    result.push({
      source,
      count: value.count,
      percentage: total > 0 ? Math.round((value.count / total) * 100) : 0,
      subSources: subSourcesArray,
    });
  });
  
  return result.sort((a, b) => b.count - a.count);
}

// Calculate recruiter metrics
export function calculateRecruiterMetrics(
  data: CandidateRecord[], 
  recruiterName: string
): RecruiterMetrics {
  const recruiterData = filterDataForRecruiter(data, recruiterName);
  
  const screeningCleared = recruiterData.filter(r => r.screeningCheckStatus === 'Cleared').length;
  const screeningNotCleared = recruiterData.filter(r => r.screeningCheckStatus === 'Not Cleared').length;
  const screeningInProgress = recruiterData.filter(r => r.screeningCheckStatus === 'In progress').length;
  const total = recruiterData.length;
  
  // Calculate 48-hour alerts
  let alertCount = 0;
  let totalSourcingToScreeningHours = 0;
  let validSourcingToScreeningCount = 0;
  
  recruiterData.forEach(record => {
    if (is48HourAlertTriggered(record.sourcingDate, record.screeningDate)) {
      alertCount++;
    }
    
    const timeDiff = calculateTimeDifferenceHours(record.sourcingDate, record.screeningDate);
    if (timeDiff !== null && timeDiff >= 0) {
      totalSourcingToScreeningHours += timeDiff;
      validSourcingToScreeningCount++;
    }
  });
  
  // Calculate conversion rate (Selected / Total sourced)
  const selectedCount = recruiterData.filter(r => r.finalStatus === 'Selected').length;
  const conversionRate = total > 0 ? (selectedCount / total) * 100 : 0;
  
  return {
    recruiterName,
    candidatesSourced: total,
    screeningCleared,
    screeningNotCleared,
    screeningInProgress,
    screeningRate: total > 0 ? (screeningCleared / total) * 100 : 0,
    alertCount,
    avgSourcingToScreeningHours: validSourcingToScreeningCount > 0 
      ? totalSourcingToScreeningHours / validSourcingToScreeningCount 
      : 0,
    conversionRate,
    candidates: recruiterData,
  };
}

// Calculate panelist metrics
export function calculatePanelistMetrics(
  data: CandidateRecord[],
  panelistName: string
): PanelistMetrics {
  const interviews = extractInterviewsForPanelist(data, panelistName);
  
  const r1Interviews = interviews.filter(i => i.round === 'R1');
  const r2Interviews = interviews.filter(i => i.round === 'R2');
  const r3Interviews = interviews.filter(i => i.round === 'R3');
  
  const passedInterviews = interviews.filter(i => i.status === 'Cleared').length;
  const failedInterviews = interviews.filter(i => i.status === 'Not Cleared').length;
  const pendingInterviews = interviews.filter(i => 
    i.status === 'Pending at R1' || 
    i.status === 'Pending at R2' || 
    i.status === 'Pending at R3' ||
    i.status === ''
  ).length;
  
  // Calculate pass rates
  const calculatePassRate = (arr: InterviewRecord[]): number => {
    const completed = arr.filter(i => i.status === 'Cleared' || i.status === 'Not Cleared');
    if (completed.length === 0) return 0;
    const passed = completed.filter(i => i.status === 'Cleared').length;
    return (passed / completed.length) * 100;
  };
  
  // Calculate average feedback time
  let totalFeedbackHours = 0;
  let validFeedbackCount = 0;
  let alertCount = 0;
  
  interviews.forEach(interview => {
    if (interview.timeDifferenceHours !== null && interview.timeDifferenceHours >= 0) {
      totalFeedbackHours += interview.timeDifferenceHours;
      validFeedbackCount++;
    }
    
    if (interview.isAlert || interview.isPendingFeedback) {
      alertCount++;
    }
  });
  
  return {
    panelistName,
    totalInterviews: interviews.length,
    r1Interviews: r1Interviews.length,
    r2Interviews: r2Interviews.length,
    r3Interviews: r3Interviews.length,
    passedInterviews,
    failedInterviews,
    pendingInterviews,
    passRate: calculatePassRate(interviews),
    r1PassRate: calculatePassRate(r1Interviews),
    r2PassRate: calculatePassRate(r2Interviews),
    r3PassRate: calculatePassRate(r3Interviews),
    avgFeedbackTimeHours: validFeedbackCount > 0 
      ? totalFeedbackHours / validFeedbackCount 
      : 0,
    alertCount,
    interviews,
  };
}

// Get all unique recruiters for a hiring manager
export function getRecruitersForHM(data: CandidateRecord[]): string[] {
  const recruiters = data
    .map(r => r.recruiterName)
    .filter(r => r && r.trim() !== '');
  return Array.from(new Set(recruiters)).sort();
}

// Get all unique panelists for a hiring manager
export function getPanelistsForHM(data: CandidateRecord[]): string[] {
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
  
  return Array.from(new Set(panelists))
    .filter(p => p && p.length > 1)
    .sort();
}

// Get funnel data for charts
export function getFunnelData(metrics: PipelineMetrics) {
  return [
    { name: 'Total Candidates', value: metrics.totalCandidates, fill: '#3B82F6' },
    { name: 'Screening Cleared', value: metrics.screeningCleared, fill: '#8B5CF6' },
    { name: 'R1 Cleared', value: metrics.r1Cleared, fill: '#EC4899' },
    { name: 'R2 Cleared', value: metrics.r2Cleared, fill: '#F97316' },
    { name: 'R3 Cleared', value: metrics.r3Cleared, fill: '#EAB308' },
    { name: 'Offered', value: metrics.offered, fill: '#22C55E' },
    { name: 'Joined', value: metrics.joined, fill: '#10B981' },
  ];
}

// Get final status data for pie chart
export function getFinalStatusData(metrics: PipelineMetrics) {
  return [
    { name: 'Selected', value: metrics.selected, fill: '#10B981' },
    { name: 'Rejected', value: metrics.rejected, fill: '#EF4444' },
    { name: 'In Progress', value: metrics.inProgress, fill: '#F59E0B' },
    { name: 'On Hold', value: metrics.onHold, fill: '#6B7280' },
  ].filter(item => item.value > 0);
}
