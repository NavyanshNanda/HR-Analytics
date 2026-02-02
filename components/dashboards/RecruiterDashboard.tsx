'use client';

import React, { useMemo, useState } from 'react';
import { CandidateRecord } from '@/lib/types';
import { calculateRecruiterMetrics, calculateSourceDistribution } from '@/lib/calculations';
import { filterDataForRecruiter } from '@/lib/dataProcessing';
import { DashboardHeader } from '@/components/ui/DashboardHeader';
import { MetricCard, MetricCardGroup } from '@/components/ui/MetricCard';
import { SourceDistribution } from '@/components/charts/SourceDistribution';
import { AlertPanel, AlertBadge } from '@/components/ui/AlertBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDate, formatHoursToReadable, is48HourAlertTriggered, calculateTimeDifferenceHours } from '@/lib/utils';
import { Users, UserCheck, AlertTriangle, TrendingUp, Percent, Search } from 'lucide-react';

interface RecruiterDashboardProps {
  data: CandidateRecord[];
  recruiterName: string;
}

export default function RecruiterDashboard({ data, recruiterName }: RecruiterDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Filter data for this recruiter
  const recruiterData = useMemo(() => {
    return filterDataForRecruiter(data, recruiterName);
  }, [data, recruiterName]);
  
  // Calculate metrics
  const metrics = useMemo(() => {
    return calculateRecruiterMetrics(data, recruiterName);
  }, [data, recruiterName]);
  
  // Calculate source distribution
  const sourceDistribution = useMemo(() => {
    return calculateSourceDistribution(recruiterData);
  }, [recruiterData]);
  
  // Get candidates with alerts
  const alertCandidates = useMemo(() => {
    return recruiterData.filter(r => 
      is48HourAlertTriggered(r.sourcingDate, r.screeningDate)
    ).map(r => ({
      ...r,
      delayHours: calculateTimeDifferenceHours(r.sourcingDate, r.screeningDate) || 0,
    }));
  }, [recruiterData]);
  
  // Filter candidates for table
  const filteredCandidates = useMemo(() => {
    let filtered = recruiterData;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.candidateName.toLowerCase().includes(term) ||
        c.skill.toLowerCase().includes(term) ||
        c.designation.toLowerCase().includes(term)
      );
    }
    
    if (statusFilter !== 'all') {
      if (statusFilter === 'alert') {
        filtered = filtered.filter(c => is48HourAlertTriggered(c.sourcingDate, c.screeningDate));
      } else {
        filtered = filtered.filter(c => c.finalStatus.toLowerCase() === statusFilter.toLowerCase());
      }
    }
    
    return filtered;
  }, [recruiterData, searchTerm, statusFilter]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <DashboardHeader
        title="Recruiter Dashboard"
        subtitle={`${recruiterData.length} candidates sourced`}
        userName={recruiterName}
        userType="Recruiter"
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">My Performance</h2>
          <MetricCardGroup>
            <MetricCard
              title="Candidates Sourced"
              value={metrics.candidatesSourced}
              icon={Users}
              color="blue"
            />
            <MetricCard
              title="Screening Cleared"
              value={metrics.screeningCleared}
              subtitle={`${metrics.screeningRate.toFixed(1)}% pass rate`}
              icon={UserCheck}
              color="green"
            />
            <MetricCard
              title="Conversion Rate"
              value={`${metrics.conversionRate.toFixed(1)}%`}
              subtitle="Selected / Total"
              icon={TrendingUp}
              color="purple"
            />
            <MetricCard
              title="Alerts"
              value={metrics.alertCount}
              subtitle="48-hour violations"
              icon={AlertTriangle}
              color={metrics.alertCount > 0 ? 'red' : 'green'}
            />
          </MetricCardGroup>
        </section>
        
        {/* Screening Breakdown */}
        <section className="mb-8">
          <div className="dashboard-card">
            <h3 className="section-header">Screening Breakdown</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-3xl font-bold text-green-700">{metrics.screeningCleared}</p>
                <p className="text-sm text-green-600">Cleared</p>
                <div className="mt-2 h-2 bg-green-200 rounded-full">
                  <div 
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${metrics.candidatesSourced > 0 ? (metrics.screeningCleared / metrics.candidatesSourced) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-3xl font-bold text-red-700">{metrics.screeningNotCleared}</p>
                <p className="text-sm text-red-600">Not Cleared</p>
                <div className="mt-2 h-2 bg-red-200 rounded-full">
                  <div 
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${metrics.candidatesSourced > 0 ? (metrics.screeningNotCleared / metrics.candidatesSourced) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-3xl font-bold text-yellow-700">{metrics.screeningInProgress}</p>
                <p className="text-sm text-yellow-600">In Progress</p>
                <div className="mt-2 h-2 bg-yellow-200 rounded-full">
                  <div 
                    className="h-full bg-yellow-500 rounded-full"
                    style={{ width: `${metrics.candidatesSourced > 0 ? (metrics.screeningInProgress / metrics.candidatesSourced) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-200 text-center">
              <p className="text-sm text-slate-500">
                Average Sourcing to Screening Time: 
                <span className={`ml-2 font-semibold ${metrics.avgSourcingToScreeningHours > 48 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatHoursToReadable(metrics.avgSourcingToScreeningHours)}
                </span>
              </p>
            </div>
          </div>
        </section>
        
        {/* Alerts */}
        {alertCandidates.length > 0 && (
          <section className="mb-8">
            <AlertPanel title="48-Hour Violation Alerts" count={alertCandidates.length}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-red-700">
                      <th className="pb-2">Candidate</th>
                      <th className="pb-2">Skill</th>
                      <th className="pb-2">Sourcing Date</th>
                      <th className="pb-2">Screening Date</th>
                      <th className="pb-2">Delay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alertCandidates.map((candidate, idx) => (
                      <tr key={idx} className="border-t border-red-200">
                        <td className="py-2 font-medium">{candidate.candidateName}</td>
                        <td className="py-2">{candidate.skill}</td>
                        <td className="py-2">{formatDate(candidate.sourcingDate)}</td>
                        <td className="py-2">{formatDate(candidate.screeningDate)}</td>
                        <td className="py-2 font-medium text-red-600">
                          {formatHoursToReadable(candidate.delayHours)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AlertPanel>
          </section>
        )}
        
        {/* Source Distribution */}
        <section className="mb-8">
          <SourceDistribution data={sourceDistribution} title="My Source Distribution" />
        </section>
        
        {/* Candidate Profiles Table */}
        <section>
          <div className="dashboard-card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h3 className="section-header mb-0">Candidate Profiles</h3>
              
              <div className="flex gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search candidates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field pl-9 py-2 text-sm w-48"
                  />
                </div>
                
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="select-field py-2 text-sm w-40"
                >
                  <option value="all">All Status</option>
                  <option value="selected">Selected</option>
                  <option value="rejected">Rejected</option>
                  <option value="in progress">In Progress</option>
                  <option value="alert">With Alerts</option>
                </select>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Skill</th>
                    <th>Designation</th>
                    <th>Sourcing Date</th>
                    <th>Screening Date</th>
                    <th>Time</th>
                    <th>Screening</th>
                    <th>Final Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-500">
                        No candidates found matching your criteria
                      </td>
                    </tr>
                  ) : (
                    filteredCandidates.slice(0, 20).map((candidate, idx) => {
                      const isAlert = is48HourAlertTriggered(candidate.sourcingDate, candidate.screeningDate);
                      const timeDiff = calculateTimeDifferenceHours(candidate.sourcingDate, candidate.screeningDate);
                      
                      return (
                        <tr key={idx} className={isAlert ? 'bg-red-50' : ''}>
                          <td className="font-medium">
                            <div className="flex items-center gap-2">
                              {candidate.candidateName}
                              {isAlert && <AlertBadge isAlert={true} compact />}
                            </div>
                          </td>
                          <td>{candidate.skill || '-'}</td>
                          <td>{candidate.designation || '-'}</td>
                          <td>{formatDate(candidate.sourcingDate)}</td>
                          <td>{formatDate(candidate.screeningDate)}</td>
                          <td className={isAlert ? 'text-red-600 font-medium' : ''}>
                            {formatHoursToReadable(timeDiff)}
                          </td>
                          <td>
                            <StatusBadge status={candidate.screeningCheckStatus} size="sm" />
                          </td>
                          <td>
                            <StatusBadge status={candidate.finalStatus} size="sm" />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              
              {filteredCandidates.length > 20 && (
                <p className="text-sm text-slate-500 mt-4 text-center">
                  Showing 20 of {filteredCandidates.length} candidates
                </p>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
