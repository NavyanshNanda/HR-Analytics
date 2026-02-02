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
import { DashboardHeader } from '@/components/ui/DashboardHeader';
import { MetricCard, MetricCardGroup } from '@/components/ui/MetricCard';
import { RecruiterPerformance } from '@/components/charts/RecruiterPerformance';
import { PanelistPerformance } from '@/components/charts/PanelistPerformance';
import { AlertPanel } from '@/components/ui/AlertBadge';
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
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <DashboardHeader
        title="Hiring Manager Dashboard"
        subtitle={`Managing ${recruiters.length} recruiters and ${panelists.length} panelists`}
        userName={hmName}
        userType="Hiring Manager"
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
            />
          </MetricCardGroup>
        </section>
        
        {/* Alerts Section */}
        {recruiterAlerts.length > 0 && (
          <section className="mb-8">
            <AlertPanel title="Recruiter Sourcing-to-Screening Alerts" count={recruiterAlerts.length}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-red-700">
                      <th className="pb-2">Recruiter</th>
                      <th className="pb-2">Candidate</th>
                      <th className="pb-2">Sourcing Date</th>
                      <th className="pb-2">Screening Date</th>
                      <th className="pb-2">Delay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recruiterAlerts.slice(0, 5).map((alert, idx) => (
                      <tr key={idx} className="border-t border-red-200">
                        <td className="py-2 font-medium">{alert.recruiterName}</td>
                        <td className="py-2">{alert.candidateName}</td>
                        <td className="py-2">{formatDate(alert.sourcingDate)}</td>
                        <td className="py-2">{formatDate(alert.screeningDate)}</td>
                        <td className="py-2 font-medium text-red-600">{formatHoursToReadable(alert.hours)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {recruiterAlerts.length > 5 && (
                  <p className="text-xs text-red-600 mt-2">
                    +{recruiterAlerts.length - 5} more alerts
                  </p>
                )}
              </div>
            </AlertPanel>
          </section>
        )}
        
        {panelistAlerts.length > 0 && (
          <section className="mb-8">
            <AlertPanel title="Panellist Feedback Alerts" count={panelistAlerts.length}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-red-700">
                      <th className="pb-2">Panellist</th>
                      <th className="pb-2">Candidate</th>
                      <th className="pb-2">Round</th>
                      <th className="pb-2">Interview Date</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {panelistAlerts.slice(0, 5).map((alert, idx) => (
                      <tr key={idx} className="border-t border-red-200">
                        <td className="py-2 font-medium">{alert.panelistName}</td>
                        <td className="py-2">{alert.candidateName}</td>
                        <td className="py-2">{alert.round}</td>
                        <td className="py-2">{formatDate(alert.interviewDate)}</td>
                        <td className="py-2">
                          {alert.isPending ? (
                            <span className="text-yellow-600 font-medium">Pending</span>
                          ) : (
                            <span className="text-red-600 font-medium">
                              {alert.hours !== null ? formatHoursToReadable(alert.hours) : 'Delayed'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {panelistAlerts.length > 5 && (
                  <p className="text-xs text-red-600 mt-2">
                    +{panelistAlerts.length - 5} more alerts
                  </p>
                )}
              </div>
            </AlertPanel>
          </section>
        )}
        
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
