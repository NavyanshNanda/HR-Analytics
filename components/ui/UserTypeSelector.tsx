'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { UserType } from '@/lib/types';
import { Users, UserCircle, Briefcase, ClipboardList, Shield } from 'lucide-react';

interface UserTypeSelectorProps {
  onSelect?: (type: UserType) => void;
}

const userTypes: { type: UserType; label: string; description: string; icon: React.ReactNode }[] = [
  {
    type: 'super-admin',
    label: 'Super Admin',
    description: 'Access to all data and metrics across the organization',
    icon: <Shield className="w-8 h-8" />,
  },
  {
    type: 'hiring-manager',
    label: 'Hiring Manager',
    description: 'View your recruiters and panellist performance',
    icon: <Briefcase className="w-8 h-8" />,
  },
  {
    type: 'recruiter',
    label: 'Recruiter',
    description: 'Track your sourced candidates and screening metrics',
    icon: <Users className="w-8 h-8" />,
  },
  {
    type: 'panellist',
    label: 'Panellist',
    description: 'View your interview history and feedback metrics',
    icon: <ClipboardList className="w-8 h-8" />,
  },
];

export function UserTypeSelector({ onSelect }: UserTypeSelectorProps) {
  const router = useRouter();
  
  const handleSelect = (type: UserType) => {
    if (type === 'super-admin') {
      router.push('/dashboard/super-admin');
    } else if (onSelect) {
      onSelect(type);
    }
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      {userTypes.map(({ type, label, description, icon }) => (
        <button
          key={type}
          onClick={() => handleSelect(type)}
          className="group flex flex-col items-center p-8 bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all duration-300 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            {icon}
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">{label}</h3>
          <p className="text-sm text-slate-500">{description}</p>
        </button>
      ))}
    </div>
  );
}
