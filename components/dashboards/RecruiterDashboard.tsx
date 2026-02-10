'use client';

import React, { useMemo, useState } from 'react';
import { CandidateRecord, DateFilters } from '@/lib/types';
import { calculateRecruiterMetrics, calculateSourceDistribution, calculatePipelineMetrics, calculatePanelistMetrics, getPanelistsForHM } from '@/lib/calculations';
import { filterDataForRecruiter } from '@/lib/dataProcessing';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MetricCard, MetricCardGroup } from '@/components/ui/MetricCard';
import { ChartCard } from '@/components/ui/ChartCard';
import { SourceDistribution } from '@/components/charts/SourceDistribution';
import { PanelistPerformance } from '@/components/charts/PanelistPerformance';
import { AlertBadge } from '@/components/ui/AlertBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDate, formatHoursToReadable, is48HourAlertTriggered, calculateTimeDifferenceHours } from '@/lib/utils';
import { Users, UserCheck, AlertTriangle, TrendingUp, Percent, Search, BarChart3, PieChart as PieChartIcon, Clock, X } from 'lucide-react';
import { DateFilter } from '@/components/ui/DateFilter';
import { MultiSelectFilter } from '@/components/ui/MultiSelectFilter';
import { FilterBadge } from '@/components/ui/FilterBadge';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';

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
  const itemsPerPage = 20;
  const [filters, setFilters] = useState<DateFilters>({});
  const [selectedPanelists, setSelectedPanelists] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedSourceForDrilldown, setSelectedSourceForDrilldown] = useState<string | null>(null);
  const [showCandidateTable, setShowCandidateTable] = useState(false);
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
    selectedLocations.length +
    (showAlertsOnly ? 1 : 0);
  
  // Clear all filters
  const clearAllFilters = () => {
    setFilters({});
    setSelectedPanelists([]);
    setSelectedSkills([]);
    setSelectedCandidates([]);
    setSelectedLocations([]);
    setSelectedSourceForDrilldown(null);
    setShowAlertsOnly(false);
    setCurrentPage(1);
  };
  
  // Calculate metrics from filtered data
  const metrics = useMemo(() => {
    return calculateRecruiterMetrics(filteredData, recruiterName);
  }, [filteredData, recruiterName]);
  
  // Calculate pipeline metrics for round summary
  const pipelineMetrics = useMemo(() => {
    return calculatePipelineMetrics(filteredData);
  }, [filteredData]);
  
  // Get unique panelists from filtered data
  const panelists = useMemo(() => getPanelistsForHM(filteredData), [filteredData]);
  
  // Calculate metrics for each panelist
  const panelistMetrics = useMemo(() => {
    return panelists.map(panelist => calculatePanelistMetrics(filteredData, panelist));
  }, [filteredData, panelists]);
  
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
    // Scroll to table with offset for fixed header
    setTimeout(() => {
      const tableSection = document.querySelector('#candidates-table');
      if (tableSection) {
        const elementPosition = tableSection.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - 120; // Offset for header + filters
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
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
          setShowCandidateTable(true);
          setTimeout(() => {
            if (candidateTableRef.current) {
              const elementPosition = candidateTableRef.current.getBoundingClientRect().top + window.pageYOffset;
              const offsetPosition = elementPosition - 120; // Offset for header + filters
              window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            }
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
            <MetricCard
              title="Avg Sourcing to Screening"
              value={formatHoursToReadable(metrics.avgSourcingToScreeningHours)}
              subtitle="Processing time"
              icon={Clock}
              color={metrics.avgSourcingToScreeningHours > 48 ? "red" : "green"}
            />
          </MetricCardGroup>
        </section>
        
        {/* Source Distribution */}
        <section className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart Section */}
            <ChartCard
              title={selectedSourceForDrilldown ? `${selectedSourceForDrilldown} - Sub-sources` : "My Source Distribution"}
              icon={<BarChart3 className="w-5 h-5 text-blue-600" />}
              variant="glass"
              action={selectedSourceForDrilldown ? (
                <button
                  onClick={() => setSelectedSourceForDrilldown(null)}
                  className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  ← Back to Sources
                </button>
              ) : undefined}
            >
              <div className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={selectedSourceForDrilldown 
                      ? (sourceDistribution.find(s => s.source === selectedSourceForDrilldown)?.subSources || []).map(sub => ({
                          name: sub.subSource,
                          count: sub.count,
                          percentage: sourceDistribution.find(s => s.source === selectedSourceForDrilldown)!.count > 0
                            ? Math.round((sub.count / sourceDistribution.find(s => s.source === selectedSourceForDrilldown)!.count) * 100)
                            : 0
                        }))
                      : sourceDistribution.map(s => ({ name: s.source, count: s.count, percentage: s.percentage }))
                    }
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    barSize={40}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.96)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      radius={[6, 6, 0, 0]}
                      onClick={(data) => {
                        if (!selectedSourceForDrilldown) {
                          const sourceItem = sourceDistribution.find(s => s.source === data.name);
                          if (sourceItem && sourceItem.subSources && sourceItem.subSources.length > 0) {
                            setSelectedSourceForDrilldown(data.name);
                          }
                        }
                      }}
                      style={{ cursor: selectedSourceForDrilldown ? 'default' : 'pointer' }}
                    >
                      {(selectedSourceForDrilldown 
                        ? sourceDistribution.find(s => s.source === selectedSourceForDrilldown)?.subSources || []
                        : sourceDistribution
                      ).map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={[
                            '#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#10B981',
                            '#EAB308', '#6366F1', '#14B8A6', '#F43F5E', '#84CC16'
                          ][index % 10]}
                        />
                      ))}
                      <LabelList 
                        dataKey="count" 
                        position="top" 
                        fill="#475569" 
                        fontSize={12} 
                        fontWeight="600"
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
            
            {/* Pie Chart Section */}
            <ChartCard
              title={selectedSourceForDrilldown ? "Sub-source Distribution" : "Source Breakdown"}
              icon={<PieChartIcon className="w-5 h-5 text-purple-600" />}
              variant="glass"
            >
              <div className="h-[340px] flex flex-col items-center justify-center">
                <div className="relative w-full h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={selectedSourceForDrilldown
                          ? (sourceDistribution.find(s => s.source === selectedSourceForDrilldown)?.subSources || []).map((sub, idx) => ({
                              name: sub.subSource,
                              value: sub.count,
                              fill: [
                                '#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#10B981',
                                '#EAB308', '#6366F1', '#14B8A6', '#F43F5E', '#84CC16'
                              ][idx % 10]
                            }))
                          : sourceDistribution.map((item, idx) => ({
                              name: item.source,
                              value: item.count,
                              fill: [
                                '#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#10B981',
                                '#EAB308', '#6366F1', '#14B8A6', '#F43F5E', '#84CC16'
                              ][idx % 10]
                            }))
                        }
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={0}
                        dataKey="value"
                      >
                        {(selectedSourceForDrilldown
                          ? sourceDistribution.find(s => s.source === selectedSourceForDrilldown)?.subSources || []
                          : sourceDistribution
                        ).map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={[
                              '#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#10B981',
                              '#EAB308', '#6366F1', '#14B8A6', '#F43F5E', '#84CC16'
                            ][index % 10]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="text-sm text-slate-500">{selectedSourceForDrilldown ? selectedSourceForDrilldown : 'Total Candidates'}</div>
                    <div className="text-4xl font-bold text-slate-900">
                      {selectedSourceForDrilldown
                        ? sourceDistribution.find(s => s.source === selectedSourceForDrilldown)?.count || 0
                        : filteredData.length
                      }
                    </div>
                  </div>
                </div>
                
                {/* Legend with Percentages */}
                <div className="w-full grid grid-cols-2 gap-x-6 gap-y-2 mt-4">
                  {(selectedSourceForDrilldown
                    ? (sourceDistribution.find(s => s.source === selectedSourceForDrilldown)?.subSources || []).map((sub, idx) => ({
                        name: sub.subSource,
                        count: sub.count,
                        percentage: sourceDistribution.find(s => s.source === selectedSourceForDrilldown)!.count > 0
                          ? Math.round((sub.count / sourceDistribution.find(s => s.source === selectedSourceForDrilldown)!.count) * 100)
                          : 0,
                        color: [
                          '#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#10B981',
                          '#EAB308', '#6366F1', '#14B8A6', '#F43F5E', '#84CC16'
                        ][idx % 10]
                      }))
                    : sourceDistribution.map((item, idx) => ({
                        name: item.source,
                        count: item.count,
                        percentage: item.percentage,
                        color: [
                          '#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#10B981',
                          '#EAB308', '#6366F1', '#14B8A6', '#F43F5E', '#84CC16'
                        ][idx % 10]
                      }))
                  ).slice(0, 6).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm text-slate-700">
                        {item.name}: <strong>{item.percentage}%</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>
          </div>
        </section>
        
        {/* Candidate Profiles Table */}
        <section ref={candidateTableRef} className="mb-8">
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
            subtitle={`${filteredCandidates.length} total candidates`}
            variant="glass"
            action={
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCandidateTable(!showCandidateTable)}
                  className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  {showCandidateTable ? 'Collapse' : 'View All'}
                </button>
                {showCandidateTable && (
                  <>
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
                  </>
                )}
              </div>
            }
          >
            {showCandidateTable && (
            <div className="overflow-x-auto" style={{ maxHeight: '400px', overflowY: 'auto' }}>
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
                    filteredCandidates
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((candidate, idx) => {
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
              
              {filteredCandidates.length > itemsPerPage && (
                <div className="mt-4 border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    
                    <div className="flex gap-2">
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
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredCandidates.length / itemsPerPage), p + 1))}
                      disabled={currentPage >= Math.ceil(filteredCandidates.length / itemsPerPage)}
                      className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
            )}
          </ChartCard>
        </section>
        
        {/* Panelist Performance */}
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
      </main>
    </div>
  );
}
