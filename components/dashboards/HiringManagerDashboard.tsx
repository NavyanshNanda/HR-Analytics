'use client';

import React, { useMemo, useState } from 'react';
import { CandidateRecord, DateFilters } from '@/lib/types';
import { 
  calculatePanelistMetrics,
  getPanelistsForHM,
  calculatePipelineMetrics
} from '@/lib/calculations';
import { filterDataForHiringManager } from '@/lib/dataProcessing';
import { filterByDateRange } from '@/lib/utils';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { DateFilter } from '@/components/ui/DateFilter';
import { MultiSelectFilter } from '@/components/ui/MultiSelectFilter';
import { FilterBadge } from '@/components/ui/FilterBadge';
import { MetricCard, MetricCardGroup } from '@/components/ui/MetricCard';
import { PanelistPerformance } from '@/components/charts/PanelistPerformance';
import { formatHoursToReadable, formatDate } from '@/lib/utils';
import { Users, UserCheck, AlertTriangle, TrendingUp, CheckCircle, Target } from 'lucide-react';

interface HiringManagerDashboardProps {
  data: CandidateRecord[];
  hmName: string;
}

export default function HiringManagerDashboard({ data, hmName }: HiringManagerDashboardProps) {
  // State for filters
  const [dateFilters, setDateFilters] = useState<DateFilters>({});
  const [selectedPanelists, setSelectedPanelists] = useState<string[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  
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
    
    if (selectedSkills.length > 0) {
      result = result.filter(r => selectedSkills.includes(r.skill));
    }
    
    if (selectedLocations.length > 0) {
      result = result.filter(r => selectedLocations.includes(r.currentLocation));
    }
    
    return result;
  }, [hmData, dateFilters, selectedPanelists, selectedCandidates, selectedSkills, selectedLocations]);
  
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
  
  const allSkills = useMemo(() => {
    return Array.from(new Set(hmData.map(r => r.skill).filter(Boolean))).sort();
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
  
  // Calculate offer acceptance rate
  const offerAcceptanceRate = useMemo(() => {
    const offered = pipelineMetrics.selected;
    const joined = pipelineMetrics.joined;
    return offered > 0 ? ((joined / offered) * 100).toFixed(1) : '0.0';
  }, [pipelineMetrics]);
  
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
    
    return alerts;
  }, [panelistMetrics]);
  
  const totalAlerts = panelistAlerts.length;
  
  // Handle navigation to candidate when alert is clicked
  const handleAlertClick = (candidateName: string) => {
    // Scroll to the relevant section (can be enhanced to highlight specific candidate)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const activeFilterCount = selectedPanelists.length + selectedCandidates.length + selectedSkills.length + selectedLocations.length;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <DashboardHeader
        title="Hiring Manager Dashboard"
        subtitle={`Managing ${panelists.length} panelists • ${filteredData.length} candidates`}
        userName={hmName}
        userRole="Hiring Manager"
        recruiterAlerts={[]}
        panelistAlerts={panelistAlerts}
        onAlertClick={handleAlertClick}
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
          <section className="mb-6">
            <div className="flex items-center gap-2 flex-wrap">
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
              title="Offer Acceptance"
              value={`${offerAcceptanceRate}%`}
              subtitle={`${pipelineMetrics.joined} joined of ${pipelineMetrics.selected} offered`}
              icon={Target}
              color="purple"
            />
            <MetricCard
              title="Alerts"
              value={totalAlerts}
              subtitle="Feedback delays"
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
        
        {/* Panellist Performance */}
        <section className="mb-8">
          <PanelistPerformance panelists={panelistMetrics} />
        </section>
        
        {/* Quick Stats */}
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <div className="dashboard-card text-center">
              <p className="text-3xl font-bold text-green-600">
                {panelistMetrics.reduce((sum, p) => sum + p.passedInterviews, 0)}
              </p>
              <p className="text-sm text-slate-500 mt-1">Interviews Cleared</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
