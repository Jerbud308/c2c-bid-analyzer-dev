// ============================================================================
// Component: DashboardMetrics
// ============================================================================
// Displays key metrics at the top of the dashboard
// ============================================================================

import React from 'react';
import type { DashboardMetrics as MetricsType } from '../lib/types';

interface DashboardMetricsProps {
  metrics: MetricsType;
  loading?: boolean;
}

export function DashboardMetrics({ metrics, loading = false }: DashboardMetricsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map(i => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Total Opportunities */}
      <MetricCard
        title="Total Opportunities"
        value={metrics.total}
        subtitle="in pipeline"
        icon="📊"
        color="blue"
      />

      {/* Average Fit Score */}
      <MetricCard
        title="Average Fit Score"
        value={metrics.avg_fit_score}
        subtitle="out of 100"
        icon="🎯"
        color="green"
        valueFormatter={(v) => v.toFixed(1)}
      />

      {/* Urgent Deadlines */}
      <MetricCard
        title="Urgent"
        value={metrics.urgent_count}
        subtitle="due in next 7 days"
        icon="⚠️"
        color="red"
      />
    </div>
  );
}

// ----------------------------------------------------------------------------
// MetricCard Component
// ----------------------------------------------------------------------------

interface MetricCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: string;
  color: 'blue' | 'green' | 'red';
  valueFormatter?: (value: number) => string;
}

function MetricCard({ title, value, subtitle, icon, color, valueFormatter }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  };

  const formattedValue = valueFormatter ? valueFormatter(value) : value.toString();

  return (
    <div className={`p-6 rounded-lg border-2 ${colorClasses[color]} transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="mt-2">
        <p className="text-3xl font-bold">{formattedValue}</p>
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Skeleton Loader
// ----------------------------------------------------------------------------

function MetricCardSkeleton() {
  return (
    <div className="p-6 rounded-lg border-2 border-gray-200 bg-gray-50 animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        <div className="h-8 w-8 bg-gray-300 rounded"></div>
      </div>
      <div className="mt-2">
        <div className="h-8 bg-gray-300 rounded w-1/3 mb-2"></div>
        <div className="h-3 bg-gray-300 rounded w-2/3"></div>
      </div>
    </div>
  );
}
