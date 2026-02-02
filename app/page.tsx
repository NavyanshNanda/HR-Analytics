'use client';

import React, { useState, useEffect } from 'react';
import { UserType, CandidateRecord } from '@/lib/types';
import { parseCSVContent, getUniqueHiringManagers, getUniqueRecruiters, getUniquePanelists } from '@/lib/dataProcessing';
import { UserTypeSelector } from '@/components/ui/UserTypeSelector';
import { UserNameLookup } from '@/components/ui/UserNameLookup';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { BarChart3, Users, Shield, TrendingUp } from 'lucide-react';

export default function Home() {
  const [selectedUserType, setSelectedUserType] = useState<UserType | null>(null);
  const [data, setData] = useState<CandidateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const response = await fetch('/api/data');
        if (!response.ok) {
          throw new Error('Failed to load data');
        }
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);
  
  const getUserList = (): string[] => {
    switch (selectedUserType) {
      case 'hiring-manager':
        return getUniqueHiringManagers(data);
      case 'recruiter':
        return getUniqueRecruiters(data);
      case 'panellist':
        return getUniquePanelists(data);
      default:
        return [];
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-slate-600">Loading HR Analytics Dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-800 mb-2">Error Loading Data</h1>
          <p className="text-slate-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">HR Analytics Dashboard</h1>
                <p className="text-sm text-slate-500">Recruitment Tracking & Analytics Platform</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
              <Users className="w-4 h-4" />
              <span>{data.length} candidates tracked</span>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {selectedUserType && selectedUserType !== 'super-admin' ? (
          <UserNameLookup 
            userType={selectedUserType}
            users={getUserList()}
            onBack={() => setSelectedUserType(null)}
          />
        ) : (
          <div>
            {/* Welcome Section */}
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-800 mb-4">
                Welcome to HR Analytics
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Select your role to access your personalized dashboard with relevant metrics, 
                performance analytics, and recruitment insights.
              </p>
            </div>
            
            {/* User Type Selection */}
            <UserTypeSelector onSelect={setSelectedUserType} />
            
            {/* Feature highlights */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">Real-time Analytics</h3>
                <p className="text-sm text-slate-600">
                  Track recruitment metrics and performance indicators in real-time
                </p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-purple-600" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">Role-based Access</h3>
                <p className="text-sm text-slate-600">
                  Customized dashboards for Super Admin, HM, Recruiters & Panellists
                </p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">48-Hour Alerts</h3>
                <p className="text-sm text-slate-600">
                  Automatic alerts for sourcing-to-screening and feedback delays
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-slate-500">
            HR Analytics Dashboard © 2026 • Recruitment Tracking & Analytics Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
