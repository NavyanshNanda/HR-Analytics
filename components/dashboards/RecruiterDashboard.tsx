'use client';

import React, { useMemo, useState } from 'react';
import { CandidateRecord, DateFilters } from '@/lib/types';
import { calculateRecruiterMetrics, calculateSourceDistribution, calculatePipelineMetrics, calculatePanelistMetrics, getPanelistsForHM, get5StagePipelineData } from '@/lib/calculations';
import { filterDataForRecruiter } from '@/lib/dataProcessing';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MetricCard, MetricCardGroup } from '@/components/ui/MetricCard';
import { ChartCard } from '@/components/ui/ChartCard';
import { SourceDistribution } from '@/components/charts/SourceDistribution';
import { PanelistPerformance } from '@/components/charts/PanelistPerformance';
import { CandidateFunnel } from '@/components/charts/CandidateFunnel';
import { TimelineAlerts } from '@/components/ui/TimelineAlerts';
import { AlertBadge } from '@/components/ui/AlertBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDate, formatHoursToReadable, is48HourAlertTriggered, calculateTimeDifferenceHours, getTTHAlerts, getTTFAlerts } from '@/lib/utils';
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
  const [selectedDesignations, setSelectedDesignations] = useState<string[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedSourceForDrilldown, setSelectedSourceForDrilldown] = useState<string | null>(null);
  const [showCandidateTable, setShowCandidateTable] = useState(false);
  const [showSystemAlerts, setShowSystemAlerts] = useState(false);
  const candidateTableRef = React.useRef<HTMLDivElement>(null);
  const systemAlertsRef = React.useRef<HTMLDivElement>(null);
  
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

  const allDesignations = useMemo(() => {
    const designations = new Set<string>();
    recruiterData.forEach(r => {
      if (r.designation) designations.add(r.designation);
    });
    return Array.from(designations).sort();
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
      
      // Designation filter
      if (selectedDesignations.length > 0 && !selectedDesignations.includes(record.designation)) return false;
      
      // Candidate filter
      if (selectedCandidates.length > 0 && !selectedCandidates.includes(record.candidateName)) return false;
      
      // Location filter
      if (selectedLocations.length > 0 && (!record.currentLocation || !selectedLocations.includes(record.currentLocation))) return false;
      
      return true;
    });
  }, [recruiterData, filters, selectedPanelists, selectedDesignations, selectedCandidates, selectedLocations]);
  
  // Active filter count
  const activeFilterCount = 
    selectedPanelists.length +
    selectedDesignations.length +
    selectedCandidates.length +
    selectedLocations.length +
    (showAlertsOnly ? 1 : 0);
  
  // Clear all filters
  const clearAllFilters = () => {
    setFilters({});
    setSelectedPanelists([]);
    setSelectedDesignations([]);
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
  
  // Get pipeline data for recruitment funnel chart
  const pipelineData = useMemo(() => {
    return get5StagePipelineData(pipelineMetrics);
  }, [pipelineMetrics]);
  
  // Get unique panelists from filtered data
  const panelists = useMemo(() => getPanelistsForHM(filteredData), [filteredData]);
  
  // Calculate metrics for each panelist
  const panelistMetrics = useMemo(() => {
    return panelists.map(panelist => calculatePanelistMetrics(filteredData, panelist));
  }, [filteredData, panelists]);
  
  // Calculate TTH/TTF alerts
  const tthAlerts = useMemo(() => getTTHAlerts(filteredData), [filteredData]);
  const ttfAlerts = useMemo(() => getTTFAlerts(filteredData), [filteredData]);
  
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
  
  const totalAlerts = recruiterAlerts.length + tthAlerts.length + ttfAlerts.length;
  
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
          <div className="mb-6 flex flex-wrap gap-2">
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
        
        {/* Recruitment Pipeline and Status Distribution */}
        <section className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart Section */}
            <ChartCard
              title="Recruitment Pipeline"
              icon={<BarChart3 className="w-5 h-5 text-blue-600" />}
              variant="glass"
            >
              <CandidateFunnel
                data={pipelineData}
                onBarClick={() => {}}
              />
              
              {/* Percentage Metrics */}
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200/50">
                <div className="text-center group">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    {pipelineMetrics.totalCandidates > 0 
                      ? (((pipelineMetrics.totalCandidates - pipelineMetrics.screeningReject) / pipelineMetrics.totalCandidates) * 100).toFixed(1)
                      : 0}%
                  </div>
                  <div className="text-sm text-slate-600 mt-1 font-medium">Screening Rate</div>
                </div>
                <div className="text-center group">
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {(pipelineMetrics.totalCandidates - pipelineMetrics.screeningReject) > 0
                      ? (((pipelineMetrics.totalCandidates - pipelineMetrics.screeningReject - pipelineMetrics.rejected) / (pipelineMetrics.totalCandidates - pipelineMetrics.screeningReject)) * 100).toFixed(1)
                      : 0}%
                  </div>
                  <div className="text-sm text-slate-600 mt-1 font-medium">Interview Success</div>
                </div>
                <div className="text-center group">
                  <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {pipelineMetrics.totalCandidates > 0
                      ? ((pipelineMetrics.joined / pipelineMetrics.totalCandidates) * 100).toFixed(1)
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
                          { name: 'Screening Cleared', value: pipelineMetrics.totalCandidates - pipelineMetrics.screeningReject, fill: '#3B82F6' },
                          { name: 'Interview Cleared', value: pipelineMetrics.totalCandidates - pipelineMetrics.screeningReject - pipelineMetrics.rejected, fill: '#F59E0B' },
                          { name: 'Offered Candidates', value: pipelineMetrics.selected, fill: '#EF4444' },
                          { name: 'Joined', value: pipelineMetrics.joined, fill: '#8B5CF6' },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={0}
                        dataKey="value"
                      >
                        {[
                          { name: 'Screening Cleared', value: pipelineMetrics.totalCandidates - pipelineMetrics.screeningReject, fill: '#3B82F6' },
                          { name: 'Interview Cleared', value: pipelineMetrics.totalCandidates - pipelineMetrics.screeningReject - pipelineMetrics.rejected, fill: '#F59E0B' },
                          { name: 'Offered Candidates', value: pipelineMetrics.selected, fill: '#EF4444' },
                          { name: 'Joined', value: pipelineMetrics.joined, fill: '#8B5CF6' },
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
                    <div className="text-4xl font-bold text-slate-900">{pipelineMetrics.totalCandidates}</div>
                  </div>
                </div>
                
                {/* Legend with Percentages */}
                <div className="w-full grid grid-cols-2 gap-x-6 gap-y-2 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-slate-700">
                      Screening Cleared: <strong>{pipelineMetrics.totalCandidates > 0 ? (((pipelineMetrics.totalCandidates - pipelineMetrics.screeningReject) / pipelineMetrics.totalCandidates) * 100).toFixed(0) : 0}%</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-sm text-slate-700">
                      Interview Cleared: <strong>{pipelineMetrics.totalCandidates > 0 ? (((pipelineMetrics.totalCandidates - pipelineMetrics.screeningReject - pipelineMetrics.rejected) / pipelineMetrics.totalCandidates) * 100).toFixed(0) : 0}%</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm text-slate-700">
                      Offered Candidates: <strong>{pipelineMetrics.totalCandidates > 0 ? ((pipelineMetrics.selected / pipelineMetrics.totalCandidates) * 100).toFixed(0) : 0}%</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-sm text-slate-700">
                      Joined: <strong>{pipelineMetrics.totalCandidates > 0 ? ((pipelineMetrics.joined / pipelineMetrics.totalCandidates) * 100).toFixed(0) : 0}%</strong>
                    </span>
                  </div>
                </div>
              </div>
            </ChartCard>
          </div>
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
        
        {/* System Alerts Section */}
        <section className="mb-8" ref={systemAlertsRef}>
          <ChartCard
            title="System Alerts"
            subtitle={totalAlerts > 0 ? `${totalAlerts} active alerts requiring attention` : 'All systems running smoothly'}
              icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
              variant="elevated"
              action={
                <button
                  onClick={() => setShowSystemAlerts(!showSystemAlerts)}
                  className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                >
                  {showSystemAlerts ? 'Collapse Alerts' : 'View All Alerts'}
                </button>
              }
            >
              {showSystemAlerts && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Recruiter Sourcing Alerts */}
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                      <h4 className="font-semibold text-red-800">
                        Sourcing Alerts ({recruiterAlerts.length})
                      </h4>
                    </div>
                    {recruiterAlerts.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {recruiterAlerts.map((alert, idx) => (
                          <div
                            key={idx}
                            className="bg-white rounded-lg p-3 shadow-sm"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-800 truncate">{alert.candidateName}</p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                  <span>Sourced: {formatDate(alert.sourcingDate)}</span>
                                  <span>→</span>
                                  <span>Screened: {formatDate(alert.screeningDate)}</span>
                                </div>
                              </div>
                              <span className="text-xs font-semibold text-red-600 whitespace-nowrap ml-2">
                                {formatHoursToReadable(alert.hours)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <p className="text-sm">No sourcing alerts at this time</p>
                      </div>
                    )}
                  </div>
                  
                  {/* TTH Alerts */}
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 bg-amber-600 rounded-full animate-pulse"></div>
                      <h4 className="font-semibold text-amber-800">
                        TTH Alerts ({tthAlerts.length})
                      </h4>
                    </div>
                    {tthAlerts.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {tthAlerts.map((alert, idx) => (
                          <div
                            key={idx}
                            className="bg-white rounded-lg p-3 shadow-sm"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-800 truncate">{alert.candidateName}</p>
                                <p className="text-xs text-slate-600 mt-0.5">{alert.designation}</p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                  <span>{formatDate(alert.screeningDate)}</span>
                                  <span>→</span>
                                  <span>{formatDate(alert.offerAcceptanceDate)}</span>
                                </div>
                              </div>
                              <div className="text-right ml-2">
                                <span className="text-xs font-semibold text-amber-600 whitespace-nowrap block">
                                  {alert.daysElapsed}d
                                </span>
                                <span className="text-xs text-slate-500">
                                  +{alert.daysElapsed - alert.expectedDays}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <p className="text-sm">No TTH alerts at this time</p>
                      </div>
                    )}
                  </div>
                  
                  {/* TTF Alerts */}
                  <div className="bg-rose-50 rounded-lg p-4 border border-rose-200">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 bg-rose-600 rounded-full animate-pulse"></div>
                      <h4 className="font-semibold text-rose-800">
                        TTF Alerts ({ttfAlerts.length})
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
                                  {alert.designation} • HM: {alert.hmDetails}
                                </p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                  <span>{formatDate(alert.reqDate)}</span>
                                  <span>→</span>
                                  <span>{formatDate(alert.offerAcceptanceDate)}</span>
                                </div>
                              </div>
                              <div className="text-right ml-2">
                                <span className="text-xs font-semibold text-rose-600 whitespace-nowrap block">
                                  {alert.daysElapsed}d
                                </span>
                                <span className="text-xs text-slate-500">
                                  +{alert.daysElapsed - alert.expectedDays}
                                </span>
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
      </main>
    </div>
  );
}
