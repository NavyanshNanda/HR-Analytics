import { Suspense } from 'react';
import fs from 'fs';
import path from 'path';
import { parseCSVContent } from '@/lib/dataProcessing';
import SuperAdminDashboard from '@/components/dashboards/SuperAdminDashboard';
import { PageLoading } from '@/components/ui/LoadingSpinner';

async function getData() {
  const csvPath = path.join(process.cwd(), 'TA Tracker - HM Sheet.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  return parseCSVContent(csvContent);
}

export default async function SuperAdminPage() {
  const data = await getData();
  
  return (
    <Suspense fallback={<PageLoading />}>
      <SuperAdminDashboard data={data} />
    </Suspense>
  );
}
