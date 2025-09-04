'use client';

import { getPlatformConfig } from '@privyloop/core';

export default function HomePage() {
  const config = getPlatformConfig();

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-4">PrivyLoop Dashboard</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Platform Configuration</h2>
        <p><strong>Deployment Mode:</strong> {config.deploymentMode}</p>
        <p><strong>Environment:</strong> {config.environment}</p>
        <p><strong>Version:</strong> {config.version}</p>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Available Features</h2>
        <ul className="space-y-1">
          {Object.entries(config.features).map(([feature, enabled]) => (
            <li key={feature}>
              <span className={enabled ? 'text-green-600' : 'text-red-600'}>
                {enabled ? '✓' : '✗'}
              </span>
              {' '}
              {feature}: {enabled ? 'Enabled' : 'Disabled'}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}