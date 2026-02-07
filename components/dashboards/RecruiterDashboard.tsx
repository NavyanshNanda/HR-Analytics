'use client';

import React, { useMemo, useState } from 'react';
import { CandidateRecord, DateFilters } from '@/lib/types';
import { calculateRecruiterMetrics, calculateSourceDistribution } from '@/lib/calculations';
import { filterDataForRecruiter } from '@/lib/dataProcessing';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MetricCard, MetricCardGroup } from '@/components/ui/MetricCard';
import { ChartCard } from '@/components/ui/ChartCard';
import { SourceDistribution } from '@/components/charts/SourceDistribution';
import { AlertBadge } from '@/components/ui/AlertBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDate, formatHoursToReadable, is48HourAlertTriggered, calculateTimeDifferenceHours } from '@/lib/utils';
import { Users, UserCheck, AlertTriangle, TrendingUp, Percent, Search } from 'lucide-react';
import { DateFilter } from '@/components/ui/DateFilter';
import { MultiSelectFilter } from '@/components/ui/MultiSelectFilter';
import { FilterBadge } from '@/components/ui/FilterBadge';

interface RecruiterDashboardProps {
  data: CandidateRecord[];
  recruiterName: string;
}

export default function RecruiterDashboard({ data, recruiterName }: RecruiterDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAlertsOnly, setShowAlertsOnly] = useState(false);
  const [showAllCandidates, setShowAllCandidates] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const [filters, setFilters] = useState<DateFilters>({});
  const [selectedPanelists, setSelectedPanelists] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const candidateTableRef = React.useRef<HTMLDivElement>(null);
  
  // Filter data for this recruiter
  const recruiterData = useMemo(() => {
    return filterDataForRecruiter(data, recruiterName);
  }, [data, recruiterName]);
  
  // Get all unique options for filters
  const allPanelists = useMemo(() => {
    const panelists = new Set<string>();
    recruiterData.forEach(r => {
      if (r.panelistNameR1) panelists.add(r.panelistNameR1);
      if (r.panelistNameR2) panelists.add(r.panelistNameR2);
      if (r.panelistNameR3) panelists.add(r.panelistNameR3);
    });
    return Array.from(panelists).sort();
  }, [recruiterData]);

  const allSkills = useMemo(() => {
    const skills = new Set<string>();
    recruiterData.forEach(r => {
      if (r.skill) skills.add(r.skill);
    });
    return Array.from(skills).sort();
  }, [recruiterData]);

  const allCandidates = useMemo(() => {
    return Array.from(new Set(recruiterData.map(r => r.candidateName))).sort();
  }, [recruiterData]);

  const allLocations = useMemo(() => {
    const locations = new Set<string>();
    recruiterData.forEach(r => {
      if (r.currentLocation) locations.add(r.currentLocation);
    });
    return Array.from(locations).sort();
  }, [recruiterData]);
  
  // Apply all filters
  const filteredData = useMemo(() => {
    return recruiterData.filter(record => {
      // Date filters
      if (filters.reqDateFrom && (!record.reqDate || record.reqDate < filters.reqDateFrom)) return false;
      if (filters.reqDateTo && (!record.reqDate || record.reqDate > filters.reqDateTo)) return false;
      if (filters.sourcingDateFrom && (!record.sourcingDate || record.sourcingDate < filters.sourcingDateFrom)) return false;
      if (filters.sourcingDateTo && (!record.sourcingDate || record.sourcingDate > filters.sourcingDateTo)) return false;
      if (filters.screeningDateFrom && (!record.screeningDate || record.screeningDate < filters.screeningDateFrom)) return false;
      if (filters.screeningDateTo && (!record.screeningDate || record.screeningDate > filters.screeningDateTo)) return false;
      
      // Panelist filter
      if (selectedPanelists.length > 0) {
        const hasPanelist = [
          record.panelistNameR1,
          record.panelistNameR2,
          record.panelistNameR3
        ].some(p => p && selectedPanelists.includes(p));
        if (!hasPanelist) return false;
      }
      
      // Skill filter
      if (selectedSkills.length > 0 && !selectedSkills.includes(record.skill)) return false;
      
      // Candidate filter
      if (selectedCandidates.length > 0 && !selectedCandidates.includes(record.candidateName)) return false;
      
      // Location filter
      if (selectedLocations.length > 0 && (!record.currentLocation || !selectedLocations.includes(record.currentLocation))) return false;
      
      return true;
    });
  }, [recruiterData, filters, selectedPanelists, selectedSkills, selectedCandidates, selectedLocations]);
  
  // Active filter count
  const activeFilterCount = 
    selectedPanelists.length +
    selectedSkills.length +
    selectedCandidates.length +
    selectedLocations.length;
  
  // Calculate metrics from filtered data
  const metrics = useMemo(() => {
    return calculateRecruiterMetrics(filteredData, recruiterName);
  }, [filteredData, recruiterName]);
  
  // Calculate source distribution from filtered data
  const sourceDistribution = useMemo(() => {
    return calculateSourceDistribution(filteredData);
  }, [filteredData]);
  
  // Get candidates with alerts from filtered data
  const alertCandidates = useMemo(() => {
    return filteredData.filter(r => 
      is48HourAlertTriggered(r.sourcingDate, r.screeningDate)
    ).map(r => ({
      ...r,
      delayHours: calculateTimeDifferenceHours(r.sourcingDate, r.screeningDate) || 0,
    }));
  }, [filteredData]);
  
  // Format alerts for dropdown
  const recruiterAlerts = useMemo(() => {
    return alertCandidates.map(c => ({
      recruiterName: recruiterName,
      candidateName: c.candidateName,
      sourcingDate: c.sourcingDate,
      screeningDate: c.screeningDate,
      hours: c.delayHours,
    }));
  }, [alertCandidates, recruiterName]);
  
  // Handle navigation to candidate when alert is clicked
  const handleAlertClick = (candidateName: string) => {
    setSearchTerm(candidateName);
    setStatusFilter('all');
    // Scroll to table
    setTimeout(() => {
      const tableSection = document.querySelector('#candidates-table');
      if (tableSection) {
        tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };
  
  // Filter candidates for table
  const filteredCandidates = useMemo(() => {
    let filtered = filteredData;
    
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
    
    // Apply alert filter when bell is clicked
    if (showAlertsOnly) {
      filtered = filtered.filter(c => is48HourAlertTriggered(c.sourcingDate, c.screeningDate));
    }
    
    return filtered;
  }, [filteredData, searchTerm, statusFilter, showAlertsOnly]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <DashboardHeader
        title="Recruiter Dashboard"
        subtitle={`${filteredData.length} candidates sourced`}
        userName={recruiterName}
        userRole="Recruiter"
        recruiterAlerts={recruiterAlerts}
        panelistAlerts={[]}
        onAlertClick={handleAlertClick}
        onBellClick={() => {
          setShowAlertsOnly(!showAlertsOnly);
          setTimeout(() => {
            candidateTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }}
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
          </MetricCardGroup>
        </section>
        
        {/* Screening Breakdown */}
        <section className="mb-8">
          <ChartCard
            title="Screening Breakdown"
            variant="glass"
          >
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
          </ChartCard>
        </section>
        
        {/* Source Distribution */}
        <section className="mb-8">
          <SourceDistribution data={sourceDistribution} title="My Source Distribution" />
        </section>
        
        {/* Candidate Profiles Table */}
        <section ref={candidateTableRef}>
          {showAlertsOnly && (
            <div className="mb-4 flex items-center gap-2">
              <FilterBadge
                label="Filtered by Alerts"
                count={filteredCandidates.length}
                onClear={() => setShowAlertsOnly(false)}
              />
            </div>
          )}
          <ChartCard
            title="Candidate Profiles"
            variant="glass"
            action={
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
            }
          >
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
                    (showAllCandidates 
                      ? (filteredCandidates.length > itemsPerPage 
                          ? filteredCandidates.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                          : filteredCandidates)
                      : filteredCandidates.slice(0, 5)).map((candidate, idx) => {
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
              
              {filteredCandidates.length > 5 && (
                <div className="mt-4 border-t border-slate-200 pt-4">
                  {!showAllCandidates ? (
                    <div className="flex justify-center">
                      <button
                        onClick={() => {
                          setShowAllCandidates(true);
                          setCurrentPage(1);
                        }}
                        className="px-6 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        Show More ({filteredCandidates.length - 5} more candidates)
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          setShowAllCandidates(false);
                          setCurrentPage(1);
                        }}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        Show Less
                      </button>
                      
                      {filteredCandidates.length > itemsPerPage && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Previous
                          </button>
                          
                          {Array.from({ length: Math.ceil(filteredCandidates.length / itemsPerPage) }, (_, i) => i + 1).map(pageNum => (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                currentPage === pageNum
                                  ? 'bg-blue-600 text-white border border-blue-600'
                                  : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          ))}
                          
                          <button
                            onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredCandidates.length / itemsPerPage), p + 1))}
                            disabled={currentPage >= Math.ceil(filteredCandidates.length / itemsPerPage)}
                            className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </ChartCard>
        </section>
      </main>
    </div>
  );
}
