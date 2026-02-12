import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@common/components/ui/card';
import { Skeleton } from '@common/components/ui/skeleton';

const DashboardSkeleton = () => {
  return (
    <>
      {/* Welcome Banner Skeleton */}
      <div className="mx-6 my-4 bg-indigo-50 border border-indigo-100 rounded-xl p-5 flex justify-between items-center h-32">
        <div className="space-y-3 w-1/2">
          <Skeleton className="h-8 w-3/4 bg-indigo-200" />
          <Skeleton className="h-4 w-1/2 bg-indigo-100" />
        </div>
        <Skeleton className="h-24 w-24 rounded-full bg-indigo-200" />
      </div>

      {/* Branch Indicator Skeleton */}
      <div className="mx-6 mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-3 w-1/3">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>

      {/* Stats Widgets Skeleton - Grid */}
      <div className="mx-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-white shadow-sm border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart Widgets - First Row (2 columns) */}
      <div className="mx-6 grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="col-span-1 shadow-sm border-gray-200">
            <CardHeader>
              <Skeleton className="h-6 w-1/3 mb-2" />
              <Skeleton className="h-4 w-1/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[250px] w-full rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sales Trend Skeleton - Full Width */}
      <div className="mx-6 mb-6">
        <Card className="shadow-sm border-gray-200">
          <CardHeader>
            <Skeleton className="h-6 w-1/4 mb-2" />
            <Skeleton className="h-4 w-1/5" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full rounded-xl" />
          </CardContent>
        </Card>
      </div>

      {/* Chart Widgets - Second Row (2 columns) */}
      <div className="mx-6 grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="col-span-1 shadow-sm border-gray-200">
            <CardHeader>
              <Skeleton className="h-6 w-1/3 mb-2" />
              <Skeleton className="h-4 w-1/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[250px] w-full rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table Widgets Skeleton */}
      <div className="mx-6 mb-6">
        <Card className="shadow-sm border-gray-200">
          <CardHeader>
            <Skeleton className="h-6 w-1/4 mb-2" />
            <Skeleton className="h-4 w-1/5" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default DashboardSkeleton;
