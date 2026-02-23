import { useEffect, useState } from 'react';
import { api } from '../hooks/useApi';
import type { HealthResponse } from '../types';
import { Activity, AlertCircle } from 'lucide-react';

export function AccountHealth() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<HealthResponse>('/health')
      .then(setHealth)
      .catch(err => setError(err.message));
  }, []);

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', padding: '6px 0' }}>
        <AlertCircle size={13} style={{ flexShrink: 0, color: 'var(--error)' }} />
        <span>API unreachable — check server</span>
      </div>
    );
  }

  if (!health) {
    return (
      <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '6px 0' }}>
        Checking API connection…
      </div>
    );
  }

  const acct = health.primaryAccount;

  return (
    <div className="flex items-center gap-4 text-sm bg-white border border-gray-200 px-4 py-3 rounded-lg">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-green-500" />
        <span className="font-medium">
          {acct?.health === 'OK' ? 'Connected' : acct?.health || health.status}
        </span>
      </div>
      {acct?.email && (
        <span className="text-gray-500">{acct.email}</span>
      )}
      {acct?.credits && (
        <span className="text-gray-600">
          {acct.credits.credits} credits ({acct.credits.userPaygateTier})
        </span>
      )}
    </div>
  );
}
