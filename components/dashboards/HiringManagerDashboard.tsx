'use client';

import React, { useMemo, useState } from 'react';
import { CandidateRecord, DateFilters } from '@/lib/types';
import { 
  calculatePanelistMetrics,
  getPanelistsForHM,
  calculatePipelineMetrics
} from '@/lib/calculations';
import { filterDataForHiringManager } from '@/lib/dataProcessing';
import { filterByDateRange, getTTFAlerts } from '@/lib/utils';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { DateFilter } from '@/components/ui/DateFilter';
import { MultiSelectFilter } from '@/components/ui/MultiSelectFilter';
import { FilterBadge } from '@/components/ui/FilterBadge';
import { MetricCard, MetricCardGroup } from '@/components/ui/MetricCard';
import { ChartCard } from '@/components/ui/ChartCard';
import { PanelistPerformance } from '@/components/charts/PanelistPerformance';
import { CandidateFunnel } from '@/components/charts/CandidateFunnel';
import { formatHoursToReadable, formatDate } from '@/lib/utils';
import { Users, UserCheck, AlertTriangle, TrendingUp, CheckCircle, Target, TrendingDown, X } from 'lucide-react';
import { useRef } from 'react';

interface HiringManagerDashboardProps {
  data: CandidateRecord[];
  hmName: string;
}

export default function HiringManagerDashboard({ data, hmName }: HiringManagerDashboardProps) {
  // State for filters
  const [dateFilters, setDateFilters] = useState<DateFilters>({});
  const [selectedPanelists, setSelectedPanelists] = useState<string[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [selectedDesignations, setSelectedDesignations] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const systemAlertsRef = useRef<HTMLDivElement>(null);
  
  // Filter data for this HM
  const hmData = useMemo(() => {
    return filterDataForHiringManager(data, hmName);
  }, [data, hmName]);
  
  // Apply all filters
  const filteredData = useMemo(() => {
    let result = filterByDateRange(hmData, dateFilters);
    
    if (selectedPanelists.length > 0) {
      result = result.filter(r =>
        selectedPanelists.includes(r.panelistNameR1) ||
        selectedPanelists.includes(r.panelistNameR2) ||
        selectedPanelists.includes(r.panelistNameR3)
      );
    }
    
    if (selectedCandidates.length > 0) {
      result = result.filter(r => selectedCandidates.includes(r.candidateName));
    }
    
    if (selectedDesignations.length > 0) {
      result = result.filter(r => selectedDesignations.includes(r.designation));
    }
    
    if (selectedLocations.length > 0) {
      result = result.filter(r => selectedLocations.includes(r.currentLocation));
    }
    
    return result;
  }, [hmData, dateFilters, selectedPanelists, selectedCandidates, selectedDesignations, selectedLocations]);
  
  // Get unique values for filters
  const allPanelists = useMemo(() => {
    return Array.from(new Set([
      ...hmData.map(r => r.panelistNameR1).filter(Boolean),
      ...hmData.map(r => r.panelistNameR2).filter(Boolean),
      ...hmData.map(r => r.panelistNameR3).filter(Boolean),
    ])).sort();
  }, [hmData]);
  
  const allCandidates = useMemo(() => {
    return Array.from(new Set(hmData.map(r => r.candidateName).filter(Boolean))).sort();
  }, [hmData]);
  
  const allDesignations = useMemo(() => {
    return Array.from(new Set(hmData.map(r => r.designation).filter(Boolean))).sort();
  }, [hmData]);
  
  const allLocations = useMemo(() => {
    return Array.from(new Set(hmData.map(r => r.currentLocation).filter(Boolean))).sort();
  }, [hmData]);
  
  // Get unique panelists under this HM from filtered data
  const panelists = useMemo(() => getPanelistsForHM(filteredData), [filteredData]);
  
  // Calculate metrics for each panelist
  const panelistMetrics = useMemo(() => {
    return panelists.map(panelist => calculatePanelistMetrics(filteredData, panelist));
  }, [filteredData, panelists]);
  
  // Calculate pipeline metrics
  const pipelineMetrics = useMemo(() => {
    return calculatePipelineMetrics(filteredData);
  }, [filteredData]);
  
  // Get pipeline data for chart
  const pipelineData = useMemo(() => {
    return [
      { name: 'Total Candidates', value: filteredData.length, fill: '#3B82F6', category: 'all' },
      { name: 'Screening Cleared', value: pipelineMetrics.screeningCleared, fill: '#6366F1', category: 'screening' },
      { name: 'Round 1 Cleared', value: pipelineMetrics.r1Cleared, fill: '#8B5CF6', category: 'r1' },
      { name: 'Round 2 Cleared', value: pipelineMetrics.r2Cleared, fill: '#EC4899', category: 'r2' },
      { name: 'Round 3 Cleared', value: pipelineMetrics.r3Cleared, fill: '#22C55E', category: 'r3' },
      { name: 'Selected', value: pipelineMetrics.selected, fill: '#10B981', category: 'selected' },
    ];
  }, [filteredData.length, pipelineMetrics]);
  
  // Calculate offer acceptance rate
  const offerAcceptanceRate = useMemo(() => {
    const offered = pipelineMetrics.selected;
    const joined = pipelineMetrics.joined;
    return offered > 0 ? ((joined / offered) * 100).toFixed(1) : '0.0';
  }, [pipelineMetrics]);
  
  // Calculate overall conversion rate
  const overallConversionRate = useMemo(() => {
    const total = filteredData.length;
    const selected = pipelineMetrics.selected;
    return total > 0 ? ((selected / total) * 100).toFixed(1) : '0.0';
  }, [filteredData.length, pipelineMetrics.selected]);
  
  // Get only panelist alerts (no recruiter alerts)
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
    
    // Sort by panelist name to group alerts together
    return alerts.sort((a, b) => a.panelistName.localeCompare(b.panelistName));
  }, [panelistMetrics]);
  
  // Calculate TTF alerts (HM only sees TTF, not TTH)
  const ttfAlerts = useMemo(() => getTTFAlerts(filteredData), [filteredData]);
  
  const totalAlerts = panelistAlerts.length + ttfAlerts.length;
  
  const activeFilterCount = selectedPanelists.length + selectedCandidates.length + selectedDesignations.length + selectedLocations.length;
  
  // Clear all filters
  const clearAllFilters = () => {
    setDateFilters({});
    setSelectedPanelists([]);
    setSelectedCandidates([]);
    setSelectedDesignations([]);
    setSelectedLocations([]);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <DashboardHeader
        title="Hiring Manager Dashboard"
        subtitle={`Managing ${panelists.length} panelists • ${filteredData.length} candidates`}
        userName={hmName}
        userRole="Hiring Manager"
        recruiterAlerts={[]}
        panelistAlerts={panelistAlerts}
        onBellClick={() => {
          setShowAllAlerts(true);
          setTimeout(() => {
            if (systemAlertsRef.current) {
              const elementPosition = systemAlertsRef.current.getBoundingClientRect().top + window.pageYOffset;
              const offsetPosition = elementPosition - 120; // Offset for header + filters
              window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            }
          }, 100);
        }}
        actions={
          <div className="flex items-center gap-2">
            <DateFilter
              filters={dateFilters}
              onChange={setDateFilters}
              showReqDate={true}
              showSourcingDate={true}
              showScreeningDate={true}
            />
            <MultiSelectFilter
              label="Panelists"
              options={allPanelists}
              selected={selectedPanelists}
              onChange={setSelectedPanelists}
              placeholder="Filter by panelist"
            />
            <MultiSelectFilter
              label="Designations"
              options={allDesignations}
              selected={selectedDesignations}
              onChange={setSelectedDesignations}
              placeholder="Filter by designation"
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
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium flex items-center gap-2 border border-red-200"
                title="Clear all filters"
              >
                <X className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>
        }
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Badges */}
        {activeFilterCount > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              {selectedPanelists.length > 0 && (
                <FilterBadge
                  label="Panelists"
                  count={selectedPanelists.length}
                  onClear={() => setSelectedPanelists([])}
                />
              )}
              {selectedDesignations.length > 0 && (
                <FilterBadge
                  label="Designations"
                  count={selectedDesignations.length}
                  onClear={() => setSelectedDesignations([])}
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
          </section>
        )}
        
        {/* Key Metrics */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Overview</h2>
          <MetricCardGroup>
            <MetricCard
              title="Total Candidates"
              value={filteredData.length}
              icon={Users}
              color="blue"
            />
            <MetricCard
              title="Selected"
              value={pipelineMetrics.selected}
              subtitle={`${filteredData.length > 0 ? ((pipelineMetrics.selected / filteredData.length) * 100).toFixed(1) : 0}% conversion`}
              icon={UserCheck}
              color="green"
            />
            <MetricCard
              title="Overall Conversion"
              value={`${overallConversionRate}%`}
              subtitle={`${pipelineMetrics.selected} selected of ${filteredData.length} total`}
              icon={TrendingUp}
              color="indigo"
            />
            <MetricCard
              title="Offer Acceptance"
              value={`${offerAcceptanceRate}%`}
              subtitle={`${pipelineMetrics.joined} joined of ${pipelineMetrics.selected} offered`}
              icon={Target}
              color="purple"
            />
          </MetricCardGroup>
        </section>
        
        {/* Candidate Breakdown Funnel */}
        <section className="mb-8">
          <ChartCard
            title="Candidate Breakdown"
            subtitle="Interview progression and conversion funnel"
            variant="glass"
          >
            <CandidateFunnel
              data={pipelineData}
            />
          </ChartCard>
        </section>
        
        {/* Panellist Performance */}
        <section className="mb-8">
          <PanelistPerformance panelists={panelistMetrics} />
        </section>
        
        {/* Interview Rounds Summary */}
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
                  <span className="font-medium text-green-600">{pipelineMetrics.r1Cleared}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Not Cleared</span>
                  <span className="font-medium text-red-600">{pipelineMetrics.r1NotCleared}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Pending</span>
                  <span className="font-medium text-yellow-600">{pipelineMetrics.r1Pending}</span>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-700 font-medium">Pass Rate</span>
                    <span className="font-bold text-blue-600">
                      {pipelineMetrics.r1Cleared + pipelineMetrics.r1NotCleared > 0
                        ? ((pipelineMetrics.r1Cleared / (pipelineMetrics.r1Cleared + pipelineMetrics.r1NotCleared)) * 100).toFixed(1)
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
                  <span className="font-medium text-green-600">{pipelineMetrics.r2Cleared}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Not Cleared</span>
                  <span className="font-medium text-red-600">{pipelineMetrics.r2NotCleared}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Pending</span>
                  <span className="font-medium text-yellow-600">{pipelineMetrics.r2Pending}</span>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-700 font-medium">Pass Rate</span>
                    <span className="font-bold text-purple-600">
                      {pipelineMetrics.r2Cleared + pipelineMetrics.r2NotCleared > 0
                        ? ((pipelineMetrics.r2Cleared / (pipelineMetrics.r2Cleared + pipelineMetrics.r2NotCleared)) * 100).toFixed(1)
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
                  <span className="font-medium text-green-600">{pipelineMetrics.r3Cleared}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Not Cleared</span>
                  <span className="font-medium text-red-600">{pipelineMetrics.r3NotCleared}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Pending</span>
                  <span className="font-medium text-yellow-600">{pipelineMetrics.r3Pending}</span>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-700 font-medium">Pass Rate</span>
                    <span className="font-bold text-orange-600">
                      {pipelineMetrics.r3Cleared + pipelineMetrics.r3NotCleared > 0
                        ? ((pipelineMetrics.r3Cleared / (pipelineMetrics.r3Cleared + pipelineMetrics.r3NotCleared)) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </ChartCard>
          </div>
        </section>
        
        {/* System Alerts Section */}
        <section className="mb-8" ref={systemAlertsRef}>
          <ChartCard
            title="System Alerts"
            subtitle={totalAlerts > 0 ? `${totalAlerts} alert${totalAlerts !== 1 ? 's' : ''} requiring attention` : 'All systems running smoothly'}
              icon={<AlertTriangle className="w-5 h-5 text-orange-600" />}
              variant="elevated"
              action={
                <button
                  onClick={() => setShowAllAlerts(!showAllAlerts)}
                  className="px-4 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium"
                >
                  {showAllAlerts ? 'Collapse Alerts' : 'View All Alerts'}
                </button>
              }
            >
              {showAllAlerts && (
                <div className="space-y-6">
                  {/* Panelist Feedback Alerts - Full Width */}
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></div>
                      <h4 className="font-semibold text-orange-800">
                        Panellist Feedback Alerts ({panelistAlerts.length})
                      </h4>
                    </div>
                    {panelistAlerts.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {panelistAlerts.map((alert, idx) => (
                          <div
                            key={idx}
                            className="bg-white rounded-lg p-3 shadow-sm"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-800 truncate">{alert.panelistName}</p>
                                <p className="text-xs text-slate-600 mt-0.5">
                                  {alert.candidateName} • Round: {alert.round}
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
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <p className="text-sm">No panelist alerts at this time</p>
                      </div>
                    )}
                  </div>

                  {/* TTF Alerts (Time to Fill) - Full Width */}
                  <div className="bg-rose-50 rounded-lg p-4 border border-rose-200">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 bg-rose-600 rounded-full animate-pulse"></div>
                      <h4 className="font-semibold text-rose-800">
                        TTF Alerts ({ttfAlerts.length})
                        <span className="text-xs font-normal text-rose-600 ml-1">&gt; 60 days</span>
                      </h4>
                    </div>
                    {ttfAlerts.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {ttfAlerts.map((alert, idx) => (
                          <div
                            key={idx}
                            className="bg-white rounded-lg p-3 shadow-sm"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-800 truncate">{alert.candidateName}</p>
                                <p className="text-xs text-slate-600 mt-0.5">
                                  {alert.designation}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                  Req Date: {alert.reqDate ? formatDate(alert.reqDate) : 'N/A'}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Offer Accepted: {alert.offerAcceptanceDate ? formatDate(alert.offerAcceptanceDate) : 'N/A'}
                                </p>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-lg font-bold text-rose-600">{alert.daysElapsed}d</span>
                                <span className="text-xs font-semibold text-rose-600">+{alert.daysElapsed - 60} over</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <p className="text-sm">No TTF alerts at this time</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </ChartCard>
          </section>
        
        {/* Quick Stats */}
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="text-center p-6 rounded-2xl bg-white/70 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.12)] border border-white/20 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.18)] transition-all duration-300">
              <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {panelistMetrics.reduce((sum, p) => sum + p.totalInterviews, 0)}
              </p>
              <p className="text-sm text-slate-600 mt-1 font-medium">Total Interviews</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-white/70 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.12)] border border-white/20 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.18)] transition-all duration-300">
              <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                {panelistMetrics.length > 0 
                  ? (panelistMetrics.reduce((sum, p) => sum + p.passRate, 0) / panelistMetrics.length).toFixed(1)
                  : 0}%
              </p>
              <p className="text-sm text-slate-600 mt-1 font-medium">Avg Pass Rate</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-white/70 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.12)] border border-white/20 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.18)] transition-all duration-300">
              <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {panelistMetrics.reduce((sum, p) => sum + p.passedInterviews, 0)}
              </p>
              <p className="text-sm text-slate-600 mt-1 font-medium">Interviews Cleared</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
