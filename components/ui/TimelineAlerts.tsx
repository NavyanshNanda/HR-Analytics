'use client';

import React from 'react';
import { TTHAlert, TTFAlert } from '@/lib/utils';
import { AlertTriangle, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface TimelineAlertsProps {
  tthAlerts: TTHAlert[];
  ttfAlerts: TTFAlert[];
  showTTH?: boolean;
  showTTF?: boolean;
}

export function TimelineAlerts({ tthAlerts, ttfAlerts, showTTH = true, showTTF = true }: TimelineAlertsProps) {
  const hasTTHAlerts = showTTH && tthAlerts.length > 0;
  const hasTTFAlerts = showTTF && ttfAlerts.length > 0;

  if (!hasTTHAlerts && !hasTTFAlerts) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <Clock className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">TTH/TTF Delays</h3>
            <p className="text-sm text-slate-600">Timeline compliance monitoring</p>
          </div>
        </div>
        <div className="text-center py-4">
          <p className="text-green-600 font-medium">✓ No timeline delays detected</p>
          <p className="text-sm text-slate-500 mt-1">All candidates are within expected timeframes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">TTH/TTF Delays</h3>
            <p className="text-sm text-slate-600">
              {hasTTHAlerts && hasTTFAlerts 
                ? `${tthAlerts.length} TTH + ${ttfAlerts.length} TTF alerts`
                : hasTTHAlerts 
                  ? `${tthAlerts.length} TTH alert${tthAlerts.length > 1 ? 's' : ''}`
                  : `${ttfAlerts.length} TTF alert${ttfAlerts.length > 1 ? 's' : ''}`
              }
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* TTH Alerts */}
        {hasTTHAlerts && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              <h4 className="font-semibold text-slate-700">Time to Hire (TTH) - Expected: ≤30 days</h4>
            </div>
            <div className="space-y-2">
              {tthAlerts.map((alert, index) => (
                <div
                  key={index}
                  className="p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-slate-800">{alert.candidateName}</p>
                        <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded">
                          {alert.designation}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">Recruiter: {alert.recruiterName}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span>Screening: {alert.screeningDate ? formatDate(alert.screeningDate) : 'N/A'}</span>
                        <span>→</span>
                        <span>Offer: {alert.offerAcceptanceDate ? formatDate(alert.offerAcceptanceDate) : 'N/A'}</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-orange-600">{alert.daysElapsed}</div>
                      <div className="text-xs text-slate-500">days elapsed</div>
                      <div className="text-xs font-medium text-orange-600 mt-1">
                        +{alert.daysElapsed - alert.expectedDays} over limit
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TTF Alerts */}
        {hasTTFAlerts && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <h4 className="font-semibold text-slate-700">Time to Fill (TTF) - Expected: ≤60 days</h4>
            </div>
            <div className="space-y-2">
              {ttfAlerts.map((alert, index) => (
                <div
                  key={index}
                  className="p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-slate-800">{alert.candidateName}</p>
                        <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded">
                          {alert.designation}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">
                        Recruiter: {alert.recruiterName} | HM: {alert.hmDetails}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span>Req Date: {alert.reqDate ? formatDate(alert.reqDate) : 'N/A'}</span>
                        <span>→</span>
                        <span>Offer: {alert.offerAcceptanceDate ? formatDate(alert.offerAcceptanceDate) : 'N/A'}</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-red-600">{alert.daysElapsed}</div>
                      <div className="text-xs text-slate-500">days elapsed</div>
                      <div className="text-xs font-medium text-red-600 mt-1">
                        +{alert.daysElapsed - alert.expectedDays} over limit
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
