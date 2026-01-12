// =============================================================================
// Hello World Module - NKZ Platform
// =============================================================================
// This is a template module demonstrating the basic structure.
// Replace this content with your own module functionality.
//
// IMPORTANT: This component is loaded by the Host, which already provides:
// - NekazariI18nProvider (i18n context)
// - AuthProvider (authentication context)
// - Layout (navigation, sidebar)
//
// This component should NOT wrap itself with providers - it's just the content.
// =============================================================================

import React from 'react';
import { Sparkles, CheckCircle } from 'lucide-react';
import { useAuth, useTranslation } from '@nekazari/sdk';
import { Card, Button } from '@nekazari/ui-kit';
import './index.css';

const HelloWorldApp: React.FC = () => {
  const { user, token, tenantId, isAuthenticated, hasRole, getToken } = useAuth();
  const { t } = useTranslation('common');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Sparkles className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              Hello World Module
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Your first Nekazari module is working! 🎉
          </p>
        </div>

        {/* Content Card */}
        <Card padding="lg" className="mb-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Module Successfully Loaded
                </h2>
                <p className="text-gray-600">
                  This module demonstrates the basic structure of a Nekazari addon.
                  You can now extend this with your own functionality.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Next Steps:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Update <code className="bg-gray-100 px-1 rounded">manifest.json</code> with your module details</li>
                <li>Replace this component with your custom functionality</li>
                <li>Use the Nekazari SDK for API calls (imported from <code className="bg-gray-100 px-1 rounded">@nekazari/sdk</code>)</li>
                <li>Use UI-Kit components (imported from <code className="bg-gray-100 px-1 rounded">@nekazari/ui-kit</code>)</li>
                <li>Add your module icon to <code className="bg-gray-100 px-1 rounded">assets/icon.png</code></li>
                <li>Build and package for upload</li>
              </ul>
            </div>

            {isAuthenticated && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Authenticated as: <span className="font-medium">{user?.email || user?.name}</span>
                  {tenantId && <span className="ml-2">(Tenant: {tenantId})</span>}
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <Button variant="primary" onClick={() => alert('Hello from Nekazari module!')}>
                Test Button (from UI-Kit)
              </Button>
            </div>
          </div>
        </Card>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This template uses the published SDK packages from NPM:
            <code className="bg-blue-100 px-1 rounded mx-1">@nekazari/sdk</code> and
            <code className="bg-blue-100 px-1 rounded mx-1">@nekazari/ui-kit</code>.
            When loaded by the NKZ host, you'll have full access to authentication, API client, and UI components.
          </p>
        </div>
      </div>
    </div>
  );
};

// CRITICAL: Export as default - required for Module Federation
export default HelloWorldApp;
