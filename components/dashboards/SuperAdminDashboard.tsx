'use client';

import React, { useState, useMemo } from 'react';
import { CandidateRecord, DateFilters } from '@/lib/types';
import { calculatePipelineMetrics, calculateSourceDistribution } from '@/lib/calculations';
import { filterByDateRange } from '@/lib/utils';
import { DashboardHeader } from '@/components/ui/DashboardHeader';
import { DateFilter } from '@/components/ui/DateFilter';
import { MetricCard, MetricCardGroup } from '@/components/ui/MetricCard';
import { RecruitmentPipeline } from '@/components/charts/RecruitmentPipeline';
import { SourceDistribution } from '@/components/charts/SourceDistribution';
import { FinalStatusBreakdown } from '@/components/charts/FinalStatusBreakdown';
import { Users, UserCheck, UserX, Clock, TrendingUp, Calendar } from 'lucide-react';

interface SuperAdminDashboardProps {
  data: CandidateRecord[];
}

export default function SuperAdminDashboard({ data }: SuperAdminDashboardProps) {
  const [filters, setFilters] = useState<DateFilters>({});
  
  const filteredData = useMemo(() => {
    return filterByDateRange(data, filters);
  }, [data, filters]);
  
  const metrics = useMemo(() => {
    return calculatePipelineMetrics(filteredData);
  }, [filteredData]);
  
  const sourceDistribution = useMemo(() => {
    return calculateSourceDistribution(filteredData);
  }, [filteredData]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <DashboardHeader
        title="Super Admin Dashboard"
        subtitle="Complete overview of recruitment analytics"
        userType="Super Admin"
        actions={
          <DateFilter
            filters={filters}
            onChange={setFilters}
            showReqDate={true}
            showSourcingDate={true}
            showScreeningDate={true}
          />
        }
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              title="Selected"
              value={metrics.selected}
              subtitle={`${metrics.totalCandidates > 0 ? ((metrics.selected / metrics.totalCandidates) * 100).toFixed(1) : 0}% of total`}
              icon={UserCheck}
              color="green"
            />
            <MetricCard
              title="Rejected"
              value={metrics.rejected}
              subtitle={`${metrics.totalCandidates > 0 ? ((metrics.rejected / metrics.totalCandidates) * 100).toFixed(1) : 0}% of total`}
              icon={UserX}
              color="red"
            />
            <MetricCard
              title="In Progress"
              value={metrics.inProgress}
              subtitle="Active candidates"
              icon={Clock}
              color="yellow"
            />
          </MetricCardGroup>
        </section>
        
        {/* Pipeline and Status */}
        <section className="mb-8">
          <div className="dashboard-grid-2">
            <RecruitmentPipeline metrics={metrics} />
            <FinalStatusBreakdown metrics={metrics} />
          </div>
        </section>
        
        {/* Source Distribution */}
        <section className="mb-8">
          <SourceDistribution data={sourceDistribution} />
        </section>
        
        {/* Additional Metrics */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Interview Rounds Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* R1 Summary */}
            <div className="dashboard-card">
              <h3 className="font-semibold text-blue-700 mb-3">Round 1</h3>
              <div className="space-y-2">
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
            </div>
            
            {/* R2 Summary */}
            <div className="dashboard-card">
              <h3 className="font-semibold text-purple-700 mb-3">Round 2</h3>
              <div className="space-y-2">
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
            </div>
            
            {/* R3 Summary */}
            <div className="dashboard-card">
              <h3 className="font-semibold text-orange-700 mb-3">Round 3</h3>
              <div className="space-y-2">
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
            </div>
          </div>
        </section>
        
        {/* Offers and Joining */}
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Offers & Joining</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="dashboard-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-700">Offer Pipeline</h3>
              </div>
              <div className="space-y-4">
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
            </div>
            
            <div className="dashboard-card">
              <h3 className="font-semibold text-slate-700 mb-4">Screening Summary</h3>
              <div className="space-y-4">
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
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
