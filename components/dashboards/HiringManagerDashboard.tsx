'use client';

import React, { useMemo } from 'react';
import { CandidateRecord } from '@/lib/types';
import { 
  calculateRecruiterMetrics, 
  calculatePanelistMetrics,
  getRecruitersForHM,
  getPanelistsForHM,
  calculatePipelineMetrics
} from '@/lib/calculations';
import { filterDataForHiringManager } from '@/lib/dataProcessing';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MetricCard, MetricCardGroup } from '@/components/ui/MetricCard';
import { RecruiterPerformance } from '@/components/charts/RecruiterPerformance';
import { PanelistPerformance } from '@/components/charts/PanelistPerformance';
import { formatHoursToReadable, formatDate, is48HourAlertTriggered } from '@/lib/utils';
import { Users, UserCheck, AlertTriangle, TrendingUp, Clock, CheckCircle } from 'lucide-react';

interface HiringManagerDashboardProps {
  data: CandidateRecord[];
  hmName: string;
}

export default function HiringManagerDashboard({ data, hmName }: HiringManagerDashboardProps) {
  // Filter data for this HM
  const hmData = useMemo(() => {
    return filterDataForHiringManager(data, hmName);
  }, [data, hmName]);
  
  // Get unique recruiters and panelists under this HM
  const recruiters = useMemo(() => getRecruitersForHM(hmData), [hmData]);
  const panelists = useMemo(() => getPanelistsForHM(hmData), [hmData]);
  
  // Calculate metrics for each recruiter
  const recruiterMetrics = useMemo(() => {
    return recruiters.map(recruiter => calculateRecruiterMetrics(hmData, recruiter));
  }, [hmData, recruiters]);
  
  // Calculate metrics for each panelist
  const panelistMetrics = useMemo(() => {
    return panelists.map(panelist => calculatePanelistMetrics(hmData, panelist));
  }, [hmData, panelists]);
  
  // Calculate pipeline metrics
  const pipelineMetrics = useMemo(() => {
    return calculatePipelineMetrics(hmData);
  }, [hmData]);
  
  // Get all recruiter alerts (48-hour violations)
  const recruiterAlerts = useMemo(() => {
    const alerts: { recruiterName: string; candidateName: string; sourcingDate: Date | null; screeningDate: Date | null; hours: number }[] = [];
    
    recruiterMetrics.forEach(rm => {
      rm.candidates.forEach(candidate => {
        if (is48HourAlertTriggered(candidate.sourcingDate, candidate.screeningDate)) {
          const hours = candidate.sourcingDate && candidate.screeningDate 
            ? Math.round((candidate.screeningDate.getTime() - candidate.sourcingDate.getTime()) / (1000 * 60 * 60))
            : 0;
          alerts.push({
            recruiterName: rm.recruiterName,
            candidateName: candidate.candidateName,
            sourcingDate: candidate.sourcingDate,
            screeningDate: candidate.screeningDate,
            hours,
          });
        }
      });
    });
    
    return alerts;
  }, [recruiterMetrics]);
  
  // Get all panelist alerts (48-hour feedback violations)
  const panelistAlerts = useMemo(() => {
    const alerts: { panelistName: string; candidateName: string; round: string; interviewDate: Date | null; feedbackDate: Date | null; hours: number | null; isPending: boolean }[] = [];
    
    panelistMetrics.forEach(pm => {
      pm.interviews.forEach(interview => {
        if (interview.isAlert || interview.isPendingFeedback) {
          alerts.push({
            panelistName: pm.panelistName,
            candidateName: interview.candidateName,
            round: interview.round,
            interviewDate: interview.interviewDate,
            feedbackDate: interview.feedbackDate,
            hours: interview.timeDifferenceHours,
            isPending: interview.isPendingFeedback,
          });
        }
      });
    });
    
    return alerts;
  }, [panelistMetrics]);
  
  const totalAlerts = recruiterAlerts.length + panelistAlerts.length;
  
  // Handle navigation to candidate when alert is clicked
  const handleAlertClick = (candidateName: string) => {
    // Scroll to the relevant section (can be enhanced to highlight specific candidate)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <DashboardHeader
        title="Hiring Manager Dashboard"
        subtitle={`Managing ${recruiters.length} recruiters and ${panelists.length} panelists`}
        userName={hmName}
        userRole="Hiring Manager"
        recruiterAlerts={recruiterAlerts}
        panelistAlerts={panelistAlerts}
        onAlertClick={handleAlertClick}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Overview</h2>
          <MetricCardGroup>
            <MetricCard
              title="Total Candidates"
              value={hmData.length}
              icon={Users}
              color="blue"
            />
            <MetricCard
              title="Selected"
              value={pipelineMetrics.selected}
              subtitle={`${hmData.length > 0 ? ((pipelineMetrics.selected / hmData.length) * 100).toFixed(1) : 0}% conversion`}
              icon={UserCheck}
              color="green"
            />
            <MetricCard
              title="Recruiters"
              value={recruiters.length}
              subtitle="Active recruiters"
              icon={Users}
              color="purple"
            />
            <MetricCard
              title="Alerts"
              value={totalAlerts}
              subtitle="48-hour violations"
              icon={AlertTriangle}
              color={totalAlerts > 0 ? 'red' : 'green'}
              onClick={() => {
                // Trigger bell icon click
                const bellButton = document.querySelector('[aria-label="View alerts"]') as HTMLButtonElement;
                if (bellButton) bellButton.click();
              }}
            />
          </MetricCardGroup>
        </section>
        
        {/* Recruiter Performance */}
        <section className="mb-8">
          <RecruiterPerformance recruiters={recruiterMetrics} />
        </section>
        
        {/* Panellist Performance */}
        <section className="mb-8">
          <PanelistPerformance panelists={panelistMetrics} />
        </section>
        
        {/* Quick Stats */}
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="dashboard-card text-center">
              <p className="text-3xl font-bold text-blue-600">
                {recruiterMetrics.reduce((sum, r) => sum + r.candidatesSourced, 0)}
              </p>
              <p className="text-sm text-slate-500 mt-1">Total Sourced</p>
            </div>
            <div className="dashboard-card text-center">
              <p className="text-3xl font-bold text-green-600">
                {recruiterMetrics.length > 0 
                  ? (recruiterMetrics.reduce((sum, r) => sum + r.screeningRate, 0) / recruiterMetrics.length).toFixed(1)
                  : 0}%
              </p>
              <p className="text-sm text-slate-500 mt-1">Avg Screening Rate</p>
            </div>
            <div className="dashboard-card text-center">
              <p className="text-3xl font-bold text-purple-600">
                {panelistMetrics.reduce((sum, p) => sum + p.totalInterviews, 0)}
              </p>
              <p className="text-sm text-slate-500 mt-1">Total Interviews</p>
            </div>
            <div className="dashboard-card text-center">
              <p className="text-3xl font-bold text-orange-600">
                {panelistMetrics.length > 0 
                  ? (panelistMetrics.reduce((sum, p) => sum + p.passRate, 0) / panelistMetrics.length).toFixed(1)
                  : 0}%
              </p>
              <p className="text-sm text-slate-500 mt-1">Avg Pass Rate</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
