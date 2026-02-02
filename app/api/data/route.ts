import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parseCSVContent } from '@/lib/dataProcessing';

export async function GET() {
  try {
    // Read CSV file from the root directory
    const csvPath = path.join(process.cwd(), 'TA Tracker - HM Sheet.csv');
    
    if (!fs.existsSync(csvPath)) {
      return NextResponse.json(
        { error: 'CSV file not found' },
        { status: 404 }
      );
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const data = parseCSVContent(csvContent);
    
    return NextResponse.json({ 
      data,
      count: data.length 
    });
  } catch (error) {
    console.error('Error reading CSV:', error);
    return NextResponse.json(
      { error: 'Failed to load data' },
      { status: 500 }
    );
  }
}
