/**
 * Analytics Page - Advanced reports and historical comparisons.
 */

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Calendar, Filter } from 'lucide-react';
import { useUIKit } from '../../hooks/useUIKit';
import { Select } from '../ui/Select';
import { useVegetationApi } from '../../services/api';
import { JobDetailsModal } from '../JobDetailsModal';
import type { VegetationJob } from '../../types';

export const AnalyticsPage: React.FC = () => {
  // Get UI components safely from Host
  const { Card } = useUIKit();
  const api = useVegetationApi();
  const [jobs, setJobs] = useState<VegetationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadJobs();
  }, [statusFilter]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await api.listJobs(statusFilter !== 'all' ? statusFilter : undefined);
      // Defensive: Ensure jobs is always an array, even if API returns undefined
      setJobs(data?.jobs || []);
    } catch (err) {
      console.error('Error loading jobs:', err);
      // On error, set empty array to prevent crashes
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalJobs = jobs.length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  const failedJobs = jobs.filter(j => j.status === 'failed').length;
  const runningJobs = jobs.filter(j => j.status === 'running').length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">Vegetation Analytics</h1>
          </div>
          <p className="text-gray-600">Advanced reports and job monitoring</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{totalJobs}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-500" />
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedJobs}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Running</p>
                <p className="text-2xl font-bold text-yellow-600">{runningJobs}</p>
              </div>
              <Calendar className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Failed</p>
                <p className="text-2xl font-bold text-red-600">{failedJobs}</p>
              </div>
              <Filter className="w-8 h-8 text-red-500" />
            </div>
          </Card>
        </div>

        {/* Jobs Table */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Jobs</h2>
            <Select
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'pending', label: 'Pending' },
                { value: 'running', label: 'Running' },
                { value: 'completed', label: 'Completed' },
                { value: 'failed', label: 'Failed' },
              ]}
              className="w-48"
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No jobs found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Job ID</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Progress</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr
                      key={job.id}
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedJobId(job.id);
                        setIsModalOpen(true);
                      }}
                    >
                      <td className="py-3 px-4 text-sm text-gray-900 font-mono">
                        {job.id.substring(0, 8)}...
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">{job.job_type}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            job.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : job.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : job.status === 'running'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${job.progress_percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600">{job.progress_percentage}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(job.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Job Details Modal */}
        {selectedJobId && (
          <JobDetailsModal
            jobId={selectedJobId}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedJobId(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;

