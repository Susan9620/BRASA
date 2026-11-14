import React from 'react'

export const SkeletonBox: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-slate-700/60 rounded-md ${className}`} />
)

export const KpiCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
    <div className="flex items-center justify-between">
      <SkeletonBox className="h-4 w-28" />
      <SkeletonBox className="h-8 w-8 rounded-lg" />
    </div>
    <SkeletonBox className="h-8 w-36" />
    <SkeletonBox className="h-3 w-48" />
  </div>
)

export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = 'h-72' }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between ${height}`}>
    <div className="flex items-center justify-between">
      <SkeletonBox className="h-5 w-40" />
      <SkeletonBox className="h-4 w-20" />
    </div>
    <div className="space-y-3 my-auto">
      <SkeletonBox className="h-32 w-full" />
    </div>
    <div className="flex justify-between items-center pt-2">
      <SkeletonBox className="h-3 w-24" />
      <SkeletonBox className="h-3 w-32" />
    </div>
  </div>
)
