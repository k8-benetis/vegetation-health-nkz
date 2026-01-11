import React from 'react';
import { Card } from '@nekazari/ui-kit';
import { useVegetationContext } from '../services/vegetationContext';
import { TimeseriesChart } from './analytics/TimeseriesChart';
import { DistributionHistogram } from './analytics/DistributionHistogram';
import { useAuth } from '../hooks/useAuth';

export const VegetationAnalytics: React.FC = () => {
    const { selectedIndex, selectedDate, selectedEntityId } = useVegetationContext();
    const { isAuthenticated } = useAuth();
    
    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center h-64">
               <p className="text-gray-500">Please log in to view analytics.</p>
            </div>
        );
    }
    
    if (!selectedEntityId) {
        return (
            <div className="flex items-center justify-center h-64 bg-slate-50 rounded-xl border border-dashed border-slate-300">
               <div className="text-center">
                   <p className="text-slate-500 mb-2">Select a parcel to view analytics.</p>
                   <p className="text-xs text-slate-400">Click on a parcel in the map.</p>
               </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto py-8">
            <h2 className="text-2xl font-bold text-slate-800">Analytics Dashboard</h2>
            
            {/* Main Timeseries */}
            <Card padding="lg" className="bg-white/90 backdrop-blur-md border border-slate-200/50 rounded-xl shadow-sm">
                <div className="mb-4">
                   <h3 className="text-lg font-semibold text-slate-800">Vegetation Trends ({selectedIndex})</h3>
                   <p className="text-sm text-slate-500">Historical performance over time</p>
                </div>
                <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center">
                    {/* Placeholder for real component */}
                    <TimeseriesChart />
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
                        <DistributionHistogram />
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
