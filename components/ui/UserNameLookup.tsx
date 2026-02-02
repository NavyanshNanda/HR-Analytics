'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { UserType } from '@/lib/types';
import { Search, ArrowLeft, User } from 'lucide-react';

interface UserNameLookupProps {
  userType: UserType;
  users: string[];
  onBack: () => void;
}

const userTypeLabels: Record<UserType, string> = {
  'super-admin': 'Super Admin',
  'hiring-manager': 'Hiring Manager',
  'recruiter': 'Recruiter',
  'panellist': 'Panellist',
};

export function UserNameLookup({ userType, users, onBack }: UserNameLookupProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter(user => 
      user.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);
  
  const handleSelect = (userName: string) => {
    setSelectedUser(userName);
  };
  
  const handleProceed = () => {
    if (selectedUser) {
      const encodedName = encodeURIComponent(selectedUser);
      router.push(`/dashboard/${userType}/${encodedName}`);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to role selection
      </button>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          Select {userTypeLabels[userType]}
        </h2>
        <p className="text-slate-500 mb-6">
          Choose your name from the list to view your personalized dashboard
        </p>
        
        {/* Search input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        
        {/* User list */}
        <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg mb-6">
          {filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-slate-500">
              No users found matching "{searchTerm}"
            </div>
          ) : (
            filteredUsers.map((user) => (
              <button
                key={user}
                onClick={() => handleSelect(user)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 ${
                  selectedUser === user ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  selectedUser === user ? 'bg-blue-100' : 'bg-slate-100'
                }`}>
                  <User className="w-4 h-4" />
                </div>
                <span className="font-medium">{user}</span>
                {selectedUser === user && (
                  <span className="ml-auto text-blue-600 text-sm">Selected</span>
                )}
              </button>
            ))
          )}
        </div>
        
        {/* Proceed button */}
        <button
          onClick={handleProceed}
          disabled={!selectedUser}
          className={`w-full py-3 rounded-lg font-semibold transition-all ${
            selectedUser
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {selectedUser ? `View Dashboard as ${selectedUser}` : 'Select a user to continue'}
        </button>
      </div>
    </div>
  );
}
