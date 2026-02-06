'use client';

import React, { useState, useMemo, useRef } from 'react';
import { CandidateRecord, DateFilters, DashboardCategory } from '@/lib/types';
import { calculatePipelineMetrics, calculateSourceDistribution, get5StagePipelineData, getRecruitersForHM, getPanelistsForHM, calculateRecruiterMetrics, calculatePanelistMetrics } from '@/lib/calculations';
import { filterByDateRange, is48HourAlertTriggered, calculateTimeDifferenceHours, formatDate, formatHoursToReadable } from '@/lib/utils';
import { useFilterStore } from '@/store/userStore';
import { DashboardHeader as OldDashboardHeader } from '@/components/ui/DashboardHeader';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { DateFilter } from '@/components/ui/DateFilter';
import { MultiSelectFilter } from '@/components/ui/MultiSelectFilter';
import { FilterBadge } from '@/components/ui/FilterBadge';
import { MetricCard, MetricCardGroup } from '@/components/ui/MetricCard';
import { ChartCard } from '@/components/ui/ChartCard';
import PipelineBarChart from '@/components/charts/PipelineBarChart';
import { SourceDistribution } from '@/components/charts/SourceDistribution';
import { FinalStatusBreakdown } from '@/components/charts/FinalStatusBreakdown';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Users, UserCheck, UserX, Clock, TrendingUp, Calendar, Filter as FilterIcon, X, AlertTriangle, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface SuperAdminDashboardProps {
  data: CandidateRecord[];
}

export default function SuperAdminDashboard({ data }: SuperAdminDashboardProps) {
  const [filters, setFilters] = useState<DateFilters>({});
  const [selectedHMs, setSelectedHMs] = useState<string[]>([]);
  const [selectedRecruiters, setSelectedRecruiters] = useState<string[]>([]);
  const [selectedPanelists, setSelectedPanelists] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const candidatesPerPage = 25;
  const { categoryFilter, setCategoryFilter, resetCategoryFilter } = useFilterStore();
  const candidateTableRef = useRef<HTMLDivElement>(null);
  
  const filteredData = useMemo(() => {
    let result = filterByDateRange(data, filters);
    
    // Apply additional filters
    if (selectedHMs.length > 0) {
      result = result.filter(r => selectedHMs.includes(r.hmDetails));
    }
    
    if (selectedRecruiters.length > 0) {
      result = result.filter(r => selectedRecruiters.includes(r.recruiterName));
    }
    
    if (selectedPanelists.length > 0) {
      result = result.filter(r =>
        selectedPanelists.includes(r.panelistNameR1) ||
        selectedPanelists.includes(r.panelistNameR2) ||
        selectedPanelists.includes(r.panelistNameR3)
      );
    }
    
    if (selectedSkills.length > 0) {
      result = result.filter(r => selectedSkills.includes(r.skill));
    }
    
    if (selectedCandidates.length > 0) {
      result = result.filter(r => selectedCandidates.includes(r.candidateName));
    }
    
    if (selectedLocations.length > 0) {
      result = result.filter(r => selectedLocations.includes(r.currentLocation));
    }
    
    // Apply category filter
    if (categoryFilter) {
      if (categoryFilter === 'all') {
        // Show all candidates
        result = result;
      } else if (categoryFilter === 'screening-cleared') {
        // Exclude Screening Rejects
        result = result.filter(r => r.dashboardCategory !== 'Screening Reject');
      } else if (categoryFilter === 'interview-cleared') {
        // Exclude Screening Rejects and Rejected
        result = result.filter(r => 
          r.dashboardCategory !== 'Screening Reject' && 
          r.dashboardCategory !== 'Rejected'
        );
      } else if (categoryFilter === 'offered') {
        // Only Selected
        result = result.filter(r => r.dashboardCategory === 'Selected');
      } else if (categoryFilter === 'joined') {
        // Only Joined
        result = result.filter(r => r.dashboardCategory === 'Joined');
      } else {
        // Direct category match (for dropdown filter)
        result = result.filter(r => r.dashboardCategory === categoryFilter);
      }
    }
    
    return result;
  }, [data, filters, selectedHMs, selectedRecruiters, selectedPanelists, selectedSkills, selectedCandidates, selectedLocations, categoryFilter]);
  
  // Get unique values for filters
  const allHMs = useMemo(() => {
    return Array.from(new Set(data.map(r => r.hmDetails).filter(Boolean))).sort();
  }, [data]);
  
  const allRecruiters = useMemo(() => {
    return Array.from(new Set(data.map(r => r.recruiterName).filter(Boolean))).sort();
  }, [data]);
  
  const allPanelists = useMemo(() => {
    return Array.from(new Set([
      ...data.map(r => r.panelistNameR1).filter(Boolean),
      ...data.map(r => r.panelistNameR2).filter(Boolean),
      ...data.map(r => r.panelistNameR3).filter(Boolean),
    ])).sort();
  }, [data]);
  
  const allSkills = useMemo(() => {
    return Array.from(new Set(data.map(r => r.skill).filter(Boolean))).sort();
  }, [data]);
  
  const allCandidates = useMemo(() => {
    return Array.from(new Set(data.map(r => r.candidateName).filter(Boolean))).sort();
  }, [data]);
  
  const allLocations = useMemo(() => {
    return Array.from(new Set(data.map(r => r.currentLocation).filter(Boolean))).sort();
  }, [data]);
  
  const metrics = useMemo(() => {
    // Always calculate metrics from filtered data
    return calculatePipelineMetrics(filteredData);
  }, [filteredData]);
  
  const pipelineData = useMemo(() => {
    return get5StagePipelineData(metrics);
  }, [metrics]);
  
  const sourceDistribution = useMemo(() => {
    return calculateSourceDistribution(filteredData);
  }, [filteredData]);
  
  // Calculate all recruiter alerts (48-hour violations)
  const recruiterAlerts = useMemo(() => {
    let baseFiltered = filterByDateRange(data, filters);
    
    // Apply additional filters
    if (selectedHMs.length > 0) {
      baseFiltered = baseFiltered.filter(r => selectedHMs.includes(r.hmDetails));
    }
    if (selectedRecruiters.length > 0) {
      baseFiltered = baseFiltered.filter(r => selectedRecruiters.includes(r.recruiterName));
    }
    if (selectedPanelists.length > 0) {
      baseFiltered = baseFiltered.filter(r =>
        selectedPanelists.includes(r.panelistNameR1) ||
        selectedPanelists.includes(r.panelistNameR2) ||
        selectedPanelists.includes(r.panelistNameR3)
      );
    }
    if (selectedSkills.length > 0) {
      baseFiltered = baseFiltered.filter(r => selectedSkills.includes(r.skill));
    }
    if (selectedCandidates.length > 0) {
      baseFiltered = baseFiltered.filter(r => selectedCandidates.includes(r.candidateName));
    }
    if (selectedLocations.length > 0) {
      baseFiltered = baseFiltered.filter(r => selectedLocations.includes(r.currentLocation));
    }
    
    const alerts: { recruiterName: string; candidateName: string; sourcingDate: Date | null; screeningDate: Date | null; hours: number }[] = [];
    
    // Get all unique recruiters
    const recruiters = Array.from(new Set(baseFiltered.map(r => r.recruiterName).filter(Boolean)));
    
    recruiters.forEach(recruiterName => {
      const recruiterData = baseFiltered.filter(r => r.recruiterName === recruiterName);
      recruiterData.forEach(candidate => {
        if (is48HourAlertTriggered(candidate.sourcingDate, candidate.screeningDate)) {
          const hours = calculateTimeDifferenceHours(candidate.sourcingDate, candidate.screeningDate) || 0;
          alerts.push({
            recruiterName,
            candidateName: candidate.candidateName,
            sourcingDate: candidate.sourcingDate,
            screeningDate: candidate.screeningDate,
            hours,
          });
        }
      });
    });
    
    return alerts;
  }, [data, filters, selectedHMs, selectedRecruiters, selectedPanelists, selectedSkills, selectedCandidates, selectedLocations]);
  
  // Calculate all panelist alerts (feedback delays)
  const panelistAlerts = useMemo(() => {
    let baseFiltered = filterByDateRange(data, filters);
    
    // Apply additional filters
    if (selectedHMs.length > 0) {
      baseFiltered = baseFiltered.filter(r => selectedHMs.includes(r.hmDetails));
    }
    if (selectedRecruiters.length > 0) {
      baseFiltered = baseFiltered.filter(r => selectedRecruiters.includes(r.recruiterName));
    }
    if (selectedPanelists.length > 0) {
      baseFiltered = baseFiltered.filter(r =>
        selectedPanelists.includes(r.panelistNameR1) ||
        selectedPanelists.includes(r.panelistNameR2) ||
        selectedPanelists.includes(r.panelistNameR3)
      );
    }
    if (selectedSkills.length > 0) {
      baseFiltered = baseFiltered.filter(r => selectedSkills.includes(r.skill));
    }
    if (selectedCandidates.length > 0) {
      baseFiltered = baseFiltered.filter(r => selectedCandidates.includes(r.candidateName));
    }
    if (selectedLocations.length > 0) {
      baseFiltered = baseFiltered.filter(r => selectedLocations.includes(r.currentLocation));
    }
    
    const alerts: { panelistName: string; candidateName: string; round: string; interviewDate: Date | null; feedbackDate: Date | null; hours: number | null; isPending: boolean }[] = [];
    
    // Get all unique panelists
    const panelists = Array.from(new Set([
      ...baseFiltered.map(r => r.panelistNameR1).filter(Boolean),
      ...baseFiltered.map(r => r.panelistNameR2).filter(Boolean),
      ...baseFiltered.map(r => r.panelistNameR3).filter(Boolean),
    ]));
    
    panelists.forEach(panelistName => {
      const panelistMetrics = calculatePanelistMetrics(baseFiltered, panelistName);
      panelistMetrics.interviews.forEach(interview => {
        if (interview.isAlert || interview.isPendingFeedback) {
          alerts.push({
            panelistName,
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
  }, [data, filters, selectedHMs, selectedRecruiters, selectedPanelists, selectedSkills, selectedCandidates, selectedLocations]);
  
  const totalAlerts = recruiterAlerts.length + panelistAlerts.length;
  const activeFilterCount = selectedHMs.length + selectedRecruiters.length + selectedPanelists.length + selectedSkills.length + selectedCandidates.length + selectedLocations.length;
  
  // Handle navigation to candidate when alert is clicked
  const handleAlertClick = (candidateName: string) => {
    // Filter to show this candidate
    resetCategoryFilter();
    setCurrentPage(1);
    // Scroll to table
    setTimeout(() => {
      candidateTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };
  
  const handleBarClick = (category: string) => {
    setCategoryFilter(category as any);
    setCurrentPage(1); // Reset to first page
    // Scroll to candidate table
    setTimeout(() => {
      candidateTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };
  
  const getCategoryFilterLabel = () => {
    if (!categoryFilter) return '';
    
    const labels: Record<string, string> = {
      'all': 'All Candidates',
      'screening-cleared': 'Screening Cleared',
      'interview-cleared': 'Interview Cleared',
      'offered': 'Offered',
      'joined': 'Joined',
      'Selected': 'Selected',
      'Rejected': 'Rejected',
      'Screening Reject': 'Screening Reject',
      'Pending/Active': 'Pending/Active',
      'Other': 'Other',
    };
    
    return labels[categoryFilter] || categoryFilter;
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <DashboardHeader
        title="Super Admin Dashboard"
        subtitle="Complete overview of recruitment analytics"
        userName="Super Admin"
        userRole="Super Admin"
        recruiterAlerts={recruiterAlerts}
        panelistAlerts={panelistAlerts}
        onAlertClick={handleAlertClick}
        actions={
          <div className="flex items-center gap-2">
            <DateFilter
              filters={filters}
              onChange={setFilters}
              showReqDate={true}
              showSourcingDate={true}
              showScreeningDate={true}
            />
            <MultiSelectFilter
              label="HMs"
              options={allHMs}
              selected={selectedHMs}
              onChange={setSelectedHMs}
              placeholder="Filter by HM"
            />
            <MultiSelectFilter
              label="Recruiters"
              options={allRecruiters}
              selected={selectedRecruiters}
              onChange={setSelectedRecruiters}
              placeholder="Filter by recruiter"
            />
            <MultiSelectFilter
              label="Panelists"
              options={allPanelists}
              selected={selectedPanelists}
              onChange={setSelectedPanelists}
              placeholder="Filter by panelist"
            />
            <MultiSelectFilter
              label="Skills"
              options={allSkills}
              selected={selectedSkills}
              onChange={setSelectedSkills}
              placeholder="Filter by skill"
            />
            <MultiSelectFilter
              label="Candidates"
              options={allCandidates}
              selected={selectedCandidates}
              onChange={setSelectedCandidates}
              placeholder="Filter by candidate"
            />
            <MultiSelectFilter
              label="Locations"
              options={allLocations}
              selected={selectedLocations}
              onChange={setSelectedLocations}
              placeholder="Filter by location"
            />
          </div>
        }
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Badges */}
        {activeFilterCount > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {selectedHMs.length > 0 && (
              <FilterBadge
                label="HMs"
                count={selectedHMs.length}
                onClear={() => setSelectedHMs([])}
              />
            )}
            {selectedRecruiters.length > 0 && (
              <FilterBadge
                label="Recruiters"
                count={selectedRecruiters.length}
                onClear={() => setSelectedRecruiters([])}
              />
            )}
            {selectedPanelists.length > 0 && (
              <FilterBadge
                label="Panelists"
                count={selectedPanelists.length}
                onClear={() => setSelectedPanelists([])}
              />
            )}
            {selectedSkills.length > 0 && (
              <FilterBadge
                label="Skills"
                count={selectedSkills.length}
                onClear={() => setSelectedSkills([])}
              />
            )}
            {selectedCandidates.length > 0 && (
              <FilterBadge
                label="Candidates"
                count={selectedCandidates.length}
                onClear={() => setSelectedCandidates([])}
              />
            )}
            {selectedLocations.length > 0 && (
              <FilterBadge
                label="Locations"
                count={selectedLocations.length}
                onClear={() => setSelectedLocations([])}
              />
            )}
          </div>
        )}
        
        {/* Key Metrics */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Key Metrics</h2>
          <MetricCardGroup>
            <MetricCard
              title="Total Candidates"
              value={metrics.totalCandidates}
              icon={Users}
              color="blue"
            />
            <MetricCard
              title="Screening Rejected"
              value={metrics.screeningReject}
              subtitle={`${metrics.totalCandidates > 0 ? ((metrics.screeningReject / metrics.totalCandidates) * 100).toFixed(1) : 0}% of total`}
              icon={UserX}
              color="red"
            />
            <MetricCard
              title="Rejected"
              value={metrics.rejected}
              subtitle={`${metrics.totalCandidates > 0 ? ((metrics.rejected / metrics.totalCandidates) * 100).toFixed(1) : 0}% of total`}
              icon={UserX}
              color="red"
            />
            <MetricCard
              title="Pending/Active"
              value={metrics.pendingActive}
              subtitle="In process"
              icon={Clock}
              color="yellow"
            />
            <MetricCard
              title="Alerts"
              value={totalAlerts}
              subtitle="48-hour violations"
              icon={AlertTriangle}
              color={totalAlerts > 0 ? 'red' : 'green'}
              onClick={() => {
                const bellButton = document.querySelector('[aria-label="View alerts"]') as HTMLButtonElement;
                if (bellButton) bellButton.click();
              }}
            />
          </MetricCardGroup>
        </section>
        
        {/* 5-Stage Pipeline and Pie Chart */}
        <section className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart Section */}
            <ChartCard
              title="Recruitment Pipeline"
              icon={<BarChart3 className="w-5 h-5 text-blue-600" />}
              variant="glass"
            >
              <PipelineBarChart data={pipelineData} onBarClick={handleBarClick} />
              
              {/* Percentage Metrics */}
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200/50">
                <div className="text-center group">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    {metrics.totalCandidates > 0 
                      ? (((metrics.totalCandidates - metrics.screeningReject) / metrics.totalCandidates) * 100).toFixed(1)
                      : 0}%
                  </div>
                  <div className="text-sm text-slate-600 mt-1 font-medium">Screening Rate</div>
                </div>
                <div className="text-center group">
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {(metrics.totalCandidates - metrics.screeningReject) > 0
                      ? (((metrics.totalCandidates - metrics.screeningReject - metrics.rejected) / (metrics.totalCandidates - metrics.screeningReject)) * 100).toFixed(1)
                      : 0}%
                  </div>
                  <div className="text-sm text-slate-600 mt-1 font-medium">Interview Success</div>
                </div>
                <div className="text-center group">
                  <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {metrics.totalCandidates > 0
                      ? ((metrics.joined / metrics.totalCandidates) * 100).toFixed(1)
                      : 0}%
                  </div>
                  <div className="text-sm text-slate-600 mt-1 font-medium">Overall Conversion</div>
                </div>
              </div>
            </ChartCard>
            
            {/* Pie Chart Section */}
            <ChartCard
              title="Status Distribution"
              icon={<PieChartIcon className="w-5 h-5 text-purple-600" />}
              variant="glass"
            >
              <div className="h-[340px] flex flex-col items-center justify-center">
                <div className="relative w-full h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Screening Cleared', value: metrics.totalCandidates - metrics.screeningReject, fill: '#3B82F6' },
                          { name: 'Interview Cleared', value: metrics.totalCandidates - metrics.screeningReject - metrics.rejected, fill: '#F59E0B' },
                          { name: 'Offered Candidates', value: metrics.selected, fill: '#EF4444' },
                          { name: 'Joined', value: metrics.joined, fill: '#8B5CF6' },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={0}
                        dataKey="value"
                      >
                        {[
                          { name: 'Screening Cleared', value: metrics.totalCandidates - metrics.screeningReject, fill: '#3B82F6' },
                          { name: 'Interview Cleared', value: metrics.totalCandidates - metrics.screeningReject - metrics.rejected, fill: '#F59E0B' },
                          { name: 'Offered Candidates', value: metrics.selected, fill: '#EF4444' },
                          { name: 'Joined', value: metrics.joined, fill: '#8B5CF6' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="text-sm text-slate-500">Total Candidates</div>
                    <div className="text-4xl font-bold text-slate-900">{metrics.totalCandidates}</div>
                  </div>
                </div>
                
                {/* Legend with Percentages */}
                <div className="w-full grid grid-cols-2 gap-x-6 gap-y-2 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-slate-700">
                      Screening Cleared: <strong>{metrics.totalCandidates > 0 ? (((metrics.totalCandidates - metrics.screeningReject) / metrics.totalCandidates) * 100).toFixed(0) : 0}%</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-sm text-slate-700">
                      Interview Cleared: <strong>{metrics.totalCandidates > 0 ? (((metrics.totalCandidates - metrics.screeningReject - metrics.rejected) / metrics.totalCandidates) * 100).toFixed(0) : 0}%</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm text-slate-700">
                      Offered Candidates: <strong>{metrics.totalCandidates > 0 ? ((metrics.selected / metrics.totalCandidates) * 100).toFixed(0) : 0}%</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-sm text-slate-700">
                      Joined: <strong>{metrics.totalCandidates > 0 ? ((metrics.joined / metrics.totalCandidates) * 100).toFixed(0) : 0}%</strong>
                    </span>
                  </div>
                </div>
              </div>
            </ChartCard>
          </div>
        </section>
        
        {/* Source Distribution */}
        <section className="mb-8">
          <SourceDistribution data={sourceDistribution} />
        </section>
        
        {/* Alerts Section */}
        {totalAlerts > 0 && (
          <section className="mb-8">
            <ChartCard
              title="System Alerts"
              subtitle={`${totalAlerts} active alerts requiring attention`}
              icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
              variant="elevated"
              action={
                <button
                  onClick={() => {
                    const bellButton = document.querySelector('[aria-label="View alerts"]') as HTMLButtonElement;
                    if (bellButton) bellButton.click();
                  }}
                  className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                >
                  View All Alerts
                </button>
              }
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recruiter Alerts */}
                {recruiterAlerts.length > 0 && (
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                      <h4 className="font-semibold text-red-800">
                        Recruiter Sourcing-to-Screening Alerts ({recruiterAlerts.length})
                      </h4>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {recruiterAlerts.slice(0, 5).map((alert, idx) => (
                        <div
                          key={idx}
                          className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => handleAlertClick(alert.candidateName)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-800 truncate">{alert.candidateName}</p>
                              <p className="text-xs text-slate-600 mt-0.5">Recruiter: {alert.recruiterName}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                <span>Sourced: {formatDate(alert.sourcingDate)}</span>
                                <span>•</span>
                                <span>Screened: {formatDate(alert.screeningDate)}</span>
                              </div>
                            </div>
                            <span className="text-xs font-semibold text-red-600 whitespace-nowrap ml-2">
                              {formatHoursToReadable(alert.hours)}
                            </span>
                          </div>
                        </div>
                      ))}
                      {recruiterAlerts.length > 5 && (
                        <p className="text-center text-sm text-red-600 font-medium pt-2">
                          +{recruiterAlerts.length - 5} more alerts
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Panelist Alerts */}
                {panelistAlerts.length > 0 && (
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></div>
                      <h4 className="font-semibold text-orange-800">
                        Panellist Feedback Alerts ({panelistAlerts.length})
                      </h4>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {panelistAlerts.slice(0, 5).map((alert, idx) => (
                        <div
                          key={idx}
                          className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => handleAlertClick(alert.candidateName)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-800 truncate">{alert.candidateName}</p>
                              <p className="text-xs text-slate-600 mt-0.5">
                                Panellist: {alert.panelistName} • Round: {alert.round}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                Interview: {formatDate(alert.interviewDate)}
                              </p>
                            </div>
                            {alert.isPending ? (
                              <span className="text-xs font-semibold text-yellow-600 whitespace-nowrap ml-2">
                                Pending
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-orange-600 whitespace-nowrap ml-2">
                                {alert.hours !== null ? formatHoursToReadable(alert.hours) : 'Delayed'}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      {panelistAlerts.length > 5 && (
                        <p className="text-center text-sm text-orange-600 font-medium pt-2">
                          +{panelistAlerts.length - 5} more alerts
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </ChartCard>
          </section>
        )}
        
        {/* Candidate Details Table */}
        <section className="mb-8" ref={candidateTableRef}>
          <div className="dashboard-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Candidate Details</h3>
                <p className="text-sm text-slate-500">
                  Showing {((currentPage - 1) * candidatesPerPage) + 1} to {Math.min(currentPage * candidatesPerPage, filteredData.length)} of {filteredData.length} candidates
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Category Filter Badge */}
                {categoryFilter && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                    <FilterIcon className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">
                      {getCategoryFilterLabel()}
                    </span>
                    <button
                      onClick={() => {
                        resetCategoryFilter();
                        setCurrentPage(1);
                      }}
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded p-0.5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                {/* Category Dropdown Filter */}
                <select
                  value={categoryFilter || ''}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value as any || null);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Categories</option>
                  <option value="Joined">Joined</option>
                  <option value="Selected">Selected</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Screening Reject">Screening Reject</option>
                  <option value="Pending/Active">Pending/Active</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Candidate
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Skill
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Recruiter
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      HM
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Reject Round
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredData
                    .slice((currentPage - 1) * candidatesPerPage, currentPage * candidatesPerPage)
                    .map((candidate, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                        {candidate.candidateName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          candidate.dashboardCategory === 'Joined' ? 'bg-green-100 text-green-800' :
                          candidate.dashboardCategory === 'Selected' ? 'bg-emerald-100 text-emerald-800' :
                          candidate.dashboardCategory === 'Rejected' ? 'bg-red-100 text-red-800' :
                          candidate.dashboardCategory === 'Screening Reject' ? 'bg-orange-100 text-orange-800' :
                          candidate.dashboardCategory === 'Pending/Active' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {candidate.dashboardCategory}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                        {candidate.skill}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                        {candidate.recruiterName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                        {candidate.hmDetails}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <StatusBadge status={candidate.finalStatus} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                        {candidate.rejectRound || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {filteredData.length > candidatesPerPage && (
              <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
                <div className="text-sm text-slate-600">
                  Page {currentPage} of {Math.ceil(filteredData.length / candidatesPerPage)}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredData.length / candidatesPerPage), p + 1))}
                    disabled={currentPage >= Math.ceil(filteredData.length / candidatesPerPage)}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
        
        {/* Additional Metrics */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Interview Rounds Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* R1 Summary */}
            <ChartCard
              title="Round 1"
              variant="glass"
              className="border-l-4 border-blue-500"
            >
              <div className="space-y-2 pt-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Cleared</span>
                  <span className="font-medium text-green-600">{metrics.r1Cleared}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Not Cleared</span>
                  <span className="font-medium text-red-600">{metrics.r1NotCleared}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Pending</span>
                  <span className="font-medium text-yellow-600">{metrics.r1Pending}</span>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-700 font-medium">Pass Rate</span>
                    <span className="font-bold text-blue-600">
                      {metrics.r1Cleared + metrics.r1NotCleared > 0
                        ? ((metrics.r1Cleared / (metrics.r1Cleared + metrics.r1NotCleared)) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </ChartCard>
            
            {/* R2 Summary */}
            <ChartCard
              title="Round 2"
              variant="glass"
              className="border-l-4 border-purple-500"
            >
              <div className="space-y-2 pt-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Cleared</span>
                  <span className="font-medium text-green-600">{metrics.r2Cleared}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Not Cleared</span>
                  <span className="font-medium text-red-600">{metrics.r2NotCleared}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Pending</span>
                  <span className="font-medium text-yellow-600">{metrics.r2Pending}</span>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-700 font-medium">Pass Rate</span>
                    <span className="font-bold text-purple-600">
                      {metrics.r2Cleared + metrics.r2NotCleared > 0
                        ? ((metrics.r2Cleared / (metrics.r2Cleared + metrics.r2NotCleared)) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </ChartCard>
            
            {/* R3 Summary */}
            <ChartCard
              title="Round 3"
              variant="glass"
              className="border-l-4 border-orange-500"
            >
              <div className="space-y-2 pt-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Cleared</span>
                  <span className="font-medium text-green-600">{metrics.r3Cleared}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Not Cleared</span>
                  <span className="font-medium text-red-600">{metrics.r3NotCleared}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Pending</span>
                  <span className="font-medium text-yellow-600">{metrics.r3Pending}</span>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-700 font-medium">Pass Rate</span>
                    <span className="font-bold text-orange-600">
                      {metrics.r3Cleared + metrics.r3NotCleared > 0
                        ? ((metrics.r3Cleared / (metrics.r3Cleared + metrics.r3NotCleared)) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </ChartCard>
          </div>
        </section>
        
        {/* Offers and Joining */}
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Offers & Joining</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartCard
              title="Offer Pipeline"
              variant="glass"
            >
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm text-slate-600">Offered</div>
                  <div className="flex-1">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill bg-blue-500"
                        style={{ 
                          width: `${metrics.totalCandidates > 0 ? (metrics.offered / metrics.totalCandidates) * 100 : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-16 text-right font-medium">{metrics.offered}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm text-slate-600">Joined</div>
                  <div className="flex-1">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill bg-green-500"
                        style={{ 
                          width: `${metrics.totalCandidates > 0 ? (metrics.joined / metrics.totalCandidates) * 100 : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-16 text-right font-medium">{metrics.joined}</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {metrics.offered > 0 
                      ? ((metrics.joined / metrics.offered) * 100).toFixed(1) 
                      : 0}%
                  </p>
                  <p className="text-sm text-slate-500">Offer to Join Ratio</p>
                </div>
              </div>
            </ChartCard>
            
            <ChartCard
              title="Screening Summary"
              variant="glass"
            >
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm text-slate-600">Cleared</div>
                  <div className="flex-1">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill bg-green-500"
                        style={{ 
                          width: `${metrics.totalCandidates > 0 ? (metrics.screeningCleared / metrics.totalCandidates) * 100 : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-16 text-right font-medium text-green-600">{metrics.screeningCleared}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm text-slate-600">Not Cleared</div>
                  <div className="flex-1">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill bg-red-500"
                        style={{ 
                          width: `${metrics.totalCandidates > 0 ? (metrics.screeningNotCleared / metrics.totalCandidates) * 100 : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-16 text-right font-medium text-red-600">{metrics.screeningNotCleared}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm text-slate-600">In Progress</div>
                  <div className="flex-1">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill bg-yellow-500"
                        style={{ 
                          width: `${metrics.totalCandidates > 0 ? (metrics.screeningInProgress / metrics.totalCandidates) * 100 : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-16 text-right font-medium text-yellow-600">{metrics.screeningInProgress}</div>
                </div>
              </div>
            </ChartCard>
          </div>
        </section>
      </main>
    </div>
  );
}
