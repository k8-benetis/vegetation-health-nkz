import React, { useState, useEffect } from 'react';
import { Card } from '@nekazari/ui-kit';
import { useVegetationContext } from '../services/vegetationContext';
import { useVegetationApi } from '../services/api';
import { TimeseriesChart } from './analytics/TimeseriesChart';
import { DistributionHistogram } from './analytics/DistributionHistogram';
import { useAuth } from '../hooks/useAuth';
import type { VegetationJob } from '../types';

export const VegetationAnalytics: React.FC = () => {
    const { selectedIndex, selectedEntityId, setSelectedEntityId } = useVegetationContext();
    const { isAuthenticated } = useAuth();
    const api = useVegetationApi();
    const [recentJobs, setRecentJobs] = useState<VegetationJob[]>([]);
    const [loadingJobs, setLoadingJobs] = useState(false);

    useEffect(() => {
        if (!selectedEntityId && isAuthenticated) {
            setLoadingJobs(true);
            api.listJobs('completed', 20, 0)
               .then(response => {
                   setRecentJobs(response.jobs);
               })
               .catch(console.error)
               .finally(() => setLoadingJobs(false));
        }
    }, [selectedEntityId, isAuthenticated]);
    
    // Group jobs by entity to show unique parcels
    const uniqueEntities = React.useMemo(() => {
        const map = new Map<string, VegetationJob>();
        recentJobs.forEach(job => {
            if (job.entity_id && !map.has(job.entity_id)) {
                map.set(job.entity_id, job);
            }
        });
        return Array.from(map.values());
    }, [recentJobs]);

    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center h-64">
               <p className="text-gray-500">Please log in to view analytics.</p>
            </div>
        );
    }
    
    if (!selectedEntityId) {
        return (
            <div className="space-y-6 max-w-4xl mx-auto py-8">
                <div className="flex items-center justify-center h-32 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                   <div className="text-center">
                       <p className="text-slate-500 font-medium">No parcel selected.</p>
                       <p className="text-xs text-slate-400">Select a recently analyzed parcel below or use the map.</p>
                   </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Recently Analyzed Parcels</h3>
                    {loadingJobs ? (
                        <div className="text-center py-4 text-slate-500">Loading history...</div>
                    ) : uniqueEntities.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {uniqueEntities.map(job => (
                                <div 
                                    key={job.entity_id} 
                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => setSelectedEntityId(job.entity_id || null)}
                                >
                                    <Card padding="md">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-slate-900">
                                                    {job.entity_type} {job.entity_id?.substring(0, 8)}...
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    Last Analysis: {new Date(job.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                                {job.job_type}
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-sm">No analysis history found.</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto py-8">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Analytics Dashboard</h2>
                <button 
                    onClick={() => setSelectedEntityId(null)}
                    className="text-sm text-slate-500 hover:text-slate-700 underline"
                >
                    Change Parcel
                </button>
            </div>
            
            {/* Main Timeseries */}
            <Card padding="lg" className="bg-white/90 backdrop-blur-md border border-slate-200/50 rounded-xl shadow-sm">
                <div className="mb-4">
                   <h3 className="text-lg font-semibold text-slate-800">Vegetation Trends ({selectedIndex})</h3>
                   <p className="text-sm text-slate-500">Historical performance over time</p>
                </div>
                <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center">
                    {/* Placeholder for real component */}
                    <TimeseriesChart series={[]} indexType={selectedIndex || 'NDVI'} />
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Histogram */}
                <Card padding="lg" className="bg-white/90 backdrop-blur-md border border-slate-200/50 rounded-xl shadow-sm">
                     <div className="mb-4">
                       <h3 className="text-md font-semibold text-slate-800">Value Distribution</h3>
                       <p className="text-xs text-slate-500">Pixel frequency for current view</p>
                    </div>
                     <div className="h-48 bg-slate-50 rounded-lg">
                        <DistributionHistogram values={[]} indexType={selectedIndex || 'NDVI'} />
                     </div>
                </Card>

                {/* Stats Summary */}
                <Card padding="lg" className="bg-white/90 backdrop-blur-md border border-slate-200/50 rounded-xl shadow-sm">
                     <div className="mb-4">
                       <h3 className="text-md font-semibold text-slate-800">Quick Stats</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                            <span className="block text-xs text-green-600 uppercase font-bold">Max {selectedIndex}</span>
                            <span className="text-2xl font-bold text-green-700">0.86</span>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                             <span className="block text-xs text-blue-600 uppercase font-bold">Mean</span>
                             <span className="text-2xl font-bold text-blue-700">0.62</span>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                             <span className="block text-xs text-amber-600 uppercase font-bold">Min</span>
                             <span className="text-2xl font-bold text-amber-700">0.12</span>
                        </div>
                         <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                             <span className="block text-xs text-purple-600 uppercase font-bold">Std Dev</span>
                             <span className="text-2xl font-bold text-purple-700">0.15</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};
