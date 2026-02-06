'use client';

import React, { useMemo, useState } from 'react';
import { CandidateRecord, DateFilters } from '@/lib/types';
import { calculatePanelistMetrics } from '@/lib/calculations';
import { filterDataForPanellist } from '@/lib/dataProcessing';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MetricCard, MetricCardGroup } from '@/components/ui/MetricCard';
import { PassRateChart } from '@/components/charts/PassRateChart';
import { AlertBadge } from '@/components/ui/AlertBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDate, formatHoursToReadable } from '@/lib/utils';
import { 
  ClipboardList, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock,
  Search,
  Filter
} from 'lucide-react';
import { DateFilter } from '@/components/ui/DateFilter';
import { MultiSelectFilter } from '@/components/ui/MultiSelectFilter';
import { FilterBadge } from '@/components/ui/FilterBadge';

interface PanellistDashboardProps {
  data: CandidateRecord[];
  panelistName: string;
}

export default function PanellistDashboard({ data, panelistName }: PanellistDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roundFilter, setRoundFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [filters, setFilters] = useState<DateFilters>({});
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  
  // Filter data for this panelist
  const panelistData = useMemo(() => {
    return filterDataForPanellist(data, panelistName);
  }, [data, panelistName]);
  
  // Get all unique options for filters
  const allSkills = useMemo(() => {
    const skills = new Set<string>();
    panelistData.forEach(r => {
      if (r.skill) skills.add(r.skill);
    });
    return Array.from(skills).sort();
  }, [panelistData]);

  const allCandidates = useMemo(() => {
    return Array.from(new Set(panelistData.map(r => r.candidateName))).sort();
  }, [panelistData]);

  const allLocations = useMemo(() => {
    const locations = new Set<string>();
    panelistData.forEach(r => {
      if (r.currentLocation) locations.add(r.currentLocation);
    });
    return Array.from(locations).sort();
  }, [panelistData]);
  
  // Apply all filters
  const filteredData = useMemo(() => {
    return panelistData.filter(record => {
      // Date filters
      if (filters.reqDateFrom && (!record.reqDate || record.reqDate < filters.reqDateFrom)) return false;
      if (filters.reqDateTo && (!record.reqDate || record.reqDate > filters.reqDateTo)) return false;
      if (filters.sourcingDateFrom && (!record.sourcingDate || record.sourcingDate < filters.sourcingDateFrom)) return false;
      if (filters.sourcingDateTo && (!record.sourcingDate || record.sourcingDate > filters.sourcingDateTo)) return false;
      if (filters.screeningDateFrom && (!record.screeningDate || record.screeningDate < filters.screeningDateFrom)) return false;
      if (filters.screeningDateTo && (!record.screeningDate || record.screeningDate > filters.screeningDateTo)) return false;
      
      // Skill filter
      if (selectedSkills.length > 0 && !selectedSkills.includes(record.skill)) return false;
      
      // Candidate filter
      if (selectedCandidates.length > 0 && !selectedCandidates.includes(record.candidateName)) return false;
      
      // Location filter
      if (selectedLocations.length > 0 && (!record.currentLocation || !selectedLocations.includes(record.currentLocation))) return false;
      
      return true;
    });
  }, [panelistData, filters, selectedSkills, selectedCandidates, selectedLocations]);
  
  // Active filter count
  const activeFilterCount = 
    selectedSkills.length +
    selectedCandidates.length +
    selectedLocations.length;
  
  // Calculate metrics from filtered data
  const metrics = useMemo(() => {
    return calculatePanelistMetrics(filteredData, panelistName);
  }, [filteredData, panelistName]);
  
  // Get interviews with alerts from filtered data
  const alertInterviews = useMemo(() => {
    return metrics.interviews.filter(i => i.isAlert || i.isPendingFeedback);
  }, [metrics.interviews]);
  
  // Format alerts for dropdown
  const panelistAlerts = useMemo(() => {
    return alertInterviews.map(i => ({
      panelistName: panelistName,
      candidateName: i.candidateName,
      round: i.round,
      interviewDate: i.interviewDate,
      feedbackDate: i.feedbackDate,
      hours: i.timeDifferenceHours,
      isPending: i.isPendingFeedback,
    }));
  }, [alertInterviews, panelistName]);
  
  // Handle navigation to interview when alert is clicked
  const handleAlertClick = (candidateName: string) => {
    setSearchTerm(candidateName);
    setRoundFilter('all');
    setStatusFilter('all');
    // Scroll to table
    setTimeout(() => {
      const tableSection = document.querySelector('#interviews-table');
      if (tableSection) {
        tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };
  
  // Filter interviews for table
  const filteredInterviews = useMemo(() => {
    let filtered = metrics.interviews;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(i => 
        i.candidateName.toLowerCase().includes(term)
      );
    }
    
    if (roundFilter !== 'all') {
      filtered = filtered.filter(i => i.round === roundFilter);
    }
    
    if (statusFilter !== 'all') {
      if (statusFilter === 'alert') {
        filtered = filtered.filter(i => i.isAlert || i.isPendingFeedback);
      } else {
        filtered = filtered.filter(i => i.status.toLowerCase().includes(statusFilter.toLowerCase()));
      }
    }
    
    return filtered;
  }, [metrics.interviews, searchTerm, roundFilter, statusFilter]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <DashboardHeader
        title="Panellist Dashboard"
        subtitle={`${metrics.totalInterviews} interviews conducted`}
        userName={panelistName}
        userRole="Panellist"
        recruiterAlerts={[]}
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
          <h2 className="text-lg font-semibold text-slate-800 mb-4">My Performance</h2>
          <MetricCardGroup>
            <MetricCard
              title="Total Interviews"
              value={metrics.totalInterviews}
              icon={ClipboardList}
              color="blue"
            />
            <MetricCard
              title="Passed"
              value={metrics.passedInterviews}
              subtitle={`${metrics.passRate.toFixed(1)}% pass rate`}
              icon={CheckCircle}
              color="green"
            />
            <MetricCard
              title="Avg Feedback Time"
              value={formatHoursToReadable(metrics.avgFeedbackTimeHours)}
              subtitle={metrics.avgFeedbackTimeHours > 48 ? 'Exceeds 48h limit' : 'Within limit'}
              icon={Clock}
              color={metrics.avgFeedbackTimeHours > 48 ? 'red' : 'green'}
            />
            <MetricCard
              title="Alerts"
              value={metrics.alertCount}
              subtitle="Feedback delays"
              icon={AlertTriangle}
              color={metrics.alertCount > 0 ? 'red' : 'green'}
              onClick={() => {
                const bellButton = document.querySelector('[aria-label="View alerts"]') as HTMLButtonElement;
                if (bellButton) bellButton.click();
              }}
            />
          </MetricCardGroup>
        </section>
        
        {/* Interviews by Round */}
        <section className="mb-8">
          <div className="dashboard-card">
            <h3 className="section-header">Interviews by Round</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-3xl font-bold text-blue-700">{metrics.r1Interviews}</p>
                <p className="text-sm text-blue-600">Round 1</p>
                <p className="text-xs text-blue-500 mt-1">
                  {metrics.r1PassRate.toFixed(1)}% pass rate
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-3xl font-bold text-purple-700">{metrics.r2Interviews}</p>
                <p className="text-sm text-purple-600">Round 2</p>
                <p className="text-xs text-purple-500 mt-1">
                  {metrics.r2PassRate.toFixed(1)}% pass rate
                </p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-3xl font-bold text-orange-700">{metrics.r3Interviews}</p>
                <p className="text-sm text-orange-600">Round 3</p>
                <p className="text-xs text-orange-500 mt-1">
                  {metrics.r3PassRate.toFixed(1)}% pass rate
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Pass Rate Chart */}
        <section className="mb-8">
          <PassRateChart data={{
            r1PassRate: metrics.r1PassRate,
            r2PassRate: metrics.r2PassRate,
            r3PassRate: metrics.r3PassRate,
            passRate: metrics.passRate,
          }} />
        </section>
        
        {/* Interview Status Summary */}
        <section className="mb-8">
          <div className="dashboard-card">
            <h3 className="section-header">Interview Outcomes</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-3xl font-bold text-green-700">{metrics.passedInterviews}</p>
                <p className="text-sm text-green-600">Passed</p>
                <div className="mt-2 h-2 bg-green-200 rounded-full">
                  <div 
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${metrics.totalInterviews > 0 ? (metrics.passedInterviews / metrics.totalInterviews) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-3xl font-bold text-red-700">{metrics.failedInterviews}</p>
                <p className="text-sm text-red-600">Failed</p>
                <div className="mt-2 h-2 bg-red-200 rounded-full">
                  <div 
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${metrics.totalInterviews > 0 ? (metrics.failedInterviews / metrics.totalInterviews) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-3xl font-bold text-yellow-700">{metrics.pendingInterviews}</p>
                <p className="text-sm text-yellow-600">Pending</p>
                <div className="mt-2 h-2 bg-yellow-200 rounded-full">
                  <div 
                    className="h-full bg-yellow-500 rounded-full"
                    style={{ width: `${metrics.totalInterviews > 0 ? (metrics.pendingInterviews / metrics.totalInterviews) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Interview Details Table */}
        <section>
          <div className="dashboard-card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h3 className="section-header mb-0">Interview Details</h3>
              
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
                
                {/* Round Filter */}
                <select
                  value={roundFilter}
                  onChange={(e) => setRoundFilter(e.target.value)}
                  className="select-field py-2 text-sm w-28"
                >
                  <option value="all">All Rounds</option>
                  <option value="R1">R1</option>
                  <option value="R2">R2</option>
                  <option value="R3">R3</option>
                </select>
                
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="select-field py-2 text-sm w-32"
                >
                  <option value="all">All Status</option>
                  <option value="cleared">Cleared</option>
                  <option value="not cleared">Not Cleared</option>
                  <option value="pending">Pending</option>
                  <option value="alert">With Alerts</option>
                </select>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Round</th>
                    <th>Interview Date</th>
                    <th>Feedback Date</th>
                    <th>Time Diff</th>
                    <th>Round Status</th>
                    <th>Final Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInterviews.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500">
                        No interviews found matching your criteria
                      </td>
                    </tr>
                  ) : (
                    filteredInterviews.map((interview, idx) => (
                      <tr 
                        key={idx} 
                        className={interview.isAlert || interview.isPendingFeedback ? 'bg-red-50' : ''}
                      >
                        <td className="font-medium">
                          <div className="flex items-center gap-2">
                            {interview.candidateName}
                            {(interview.isAlert || interview.isPendingFeedback) && (
                              <AlertBadge isAlert={true} compact />
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            interview.round === 'R1' ? 'bg-blue-100 text-blue-700' :
                            interview.round === 'R2' ? 'bg-purple-100 text-purple-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {interview.round}
                          </span>
                        </td>
                        <td>{formatDate(interview.interviewDate)}</td>
                        <td>{formatDate(interview.feedbackDate)}</td>
                        <td className={interview.isAlert ? 'text-red-600 font-medium' : ''}>
                          {interview.isPendingFeedback ? (
                            <span className="text-yellow-600">Pending</span>
                          ) : (
                            formatHoursToReadable(interview.timeDifferenceHours)
                          )}
                        </td>
                        <td>
                          <StatusBadge status={interview.status} size="sm" />
                        </td>
                        <td>
                          <StatusBadge status={interview.finalStatus} size="sm" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              
              {filteredInterviews.length > 0 && (
                <p className="text-sm text-slate-500 mt-4 text-center">
                  Showing {filteredInterviews.length} interviews
                </p>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
