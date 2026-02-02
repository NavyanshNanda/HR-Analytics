import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import { parseCSVContent } from '@/lib/dataProcessing';
import HiringManagerDashboard from '@/components/dashboards/HiringManagerDashboard';
import RecruiterDashboard from '@/components/dashboards/RecruiterDashboard';
import PanellistDashboard from '@/components/dashboards/PanellistDashboard';
import { PageLoading } from '@/components/ui/LoadingSpinner';

async function getData() {
  const csvPath = path.join(process.cwd(), 'TA Tracker - HM Sheet.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  return parseCSVContent(csvContent);
}

interface PageProps {
  params: {
    userType: string;
    userId: string;
  };
}

export default async function DashboardPage({ params }: PageProps) {
  const { userType, userId } = params;
  const decodedUserId = decodeURIComponent(userId);
  const data = await getData();
  
  const renderDashboard = () => {
    switch (userType) {
      case 'hiring-manager':
        return <HiringManagerDashboard data={data} hmName={decodedUserId} />;
      case 'recruiter':
        return <RecruiterDashboard data={data} recruiterName={decodedUserId} />;
      case 'panellist':
        return <PanellistDashboard data={data} panelistName={decodedUserId} />;
      default:
        notFound();
    }
  };
  
  return (
    <Suspense fallback={<PageLoading />}>
      {renderDashboard()}
    </Suspense>
  );
}

export async function generateStaticParams() {
  // Return empty array for dynamic generation
  return [];
}
