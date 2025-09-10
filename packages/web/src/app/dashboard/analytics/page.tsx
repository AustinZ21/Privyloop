"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Progress } from 'src/components/ui/progress';
import Sidebar from 'src/components/ui/sidebar';
import { CheckCircle, AlertCircle, Loader2, ChevronDown } from 'lucide-react';
import { flags } from 'src/lib/flags';

type PlatformItem = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
};

type PlatformsResponse = {
  success: boolean;
  data?: Array<{
    id: string; name: string; slug: string; logoUrl?: string | null;
  }>;
};

type AnalysisResponse = {
  success: boolean;
  data?: {
    templateId: string;
    platformId: string;
    version: string;
    aiAnalysis: {
      overallRiskScore: number;
      privacyImpact: 'low' | 'medium' | 'high';
      keyRecommendations: string[];
      categoryScores: Record<string, number>;
      riskFactors: string[];
      generatedAt: string;
      modelUsed: string;
      summary?: string;
      categoryInsights?: Record<string, { title: string; whatItMeans: string; recommendedAction: string }>;
    } | null;
    categoryNameMap?: Record<string, string>;
  };
  error?: { code: string; message: string };
};

export default function AnalyticsPage() {
  const router = useRouter();
  const search = useSearchParams();
  const platformParam = search.get('platform'); // slug
  const platformIdParam = search.get('platformId'); // uuid
  // Enterprise gating for additional modules (change tracking, trends, admin refresh).
  // NOTE: Visual design remains identical; only content blocks change.
  const [enterpriseEnabled, setEnterpriseEnabled] = useState(false);
  const isEnterprise = flags.isEnterprise && enterpriseEnabled;

  const [loadingPlatforms, setLoadingPlatforms] = useState(true);
  const [platforms, setPlatforms] = useState<PlatformItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResponse['data'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load platforms list
  useEffect(() => {
    setLoadingPlatforms(true);
    fetch('/api/scraping/platforms')
      .then(async (r) => (await r.json()) as PlatformsResponse)
      .then((json) => {
        if (!json.success || !json.data) throw new Error('Failed to fetch platforms');
        const list: PlatformItem[] = json.data.map(p => ({ id: p.id, name: p.name, slug: p.slug, logoUrl: (p as any).logoUrl }));
        setPlatforms(list);
      })
      .catch((err) => setError(err.message || 'Failed to fetch platforms'))
      .finally(() => setLoadingPlatforms(false));
  }, []);

  // Fetch server capabilities so enterprise UI cannot be enabled by client flag alone
  useEffect(() => {
    fetch('/api/capabilities')
      .then((r) => r.ok ? r.json() : { success: false })
      .then((json) => setEnterpriseEnabled(Boolean(json?.data?.enterpriseEnabled)))
      .catch(() => setEnterpriseEnabled(false));
  }, []);

  // Resolve selected platform id from query or default
  useEffect(() => {
    if (loadingPlatforms) return;
    if (!platforms.length) return;

    let id = selectedId;
    if (platformIdParam) {
      id = platformIdParam;
    } else if (platformParam) {
      const bySlug = platforms.find(p => p.slug === platformParam);
      id = bySlug?.id || null;
    } else if (!id) {
      id = platforms[0].id;
    }
    setSelectedId(id);
  }, [loadingPlatforms, platforms, platformParam, platformIdParam]);

  // Fetch analysis when selected id changes
  useEffect(() => {
    if (!selectedId) return;
    setLoadingAnalysis(true);
    setError(null);
    fetch(`/api/ai/analysis?platformId=${encodeURIComponent(selectedId)}`)
      .then(async (r) => {
        if (r.status === 404) {
          // Treat as "no analysis yet" rather than an error to keep UX friendly
          return { success: true, data: undefined } as AnalysisResponse;
        }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as AnalysisResponse;
      })
      .then((json) => {
        if (!json.success) throw new Error(json.error?.message || 'Failed to fetch analysis');
        setAnalysis(json.data || null);
      })
      .catch((err) => setError(err.message || 'Failed to fetch analysis'))
      .finally(() => setLoadingAnalysis(false));
  }, [selectedId]);

  const selectedPlatform = useMemo(() => platforms.find(p => p.id === selectedId) || null, [platforms, selectedId]);
  const score = analysis?.aiAnalysis?.overallRiskScore ?? 0;
  const scoreColor = score >= 67 ? 'text-red-400' : score >= 34 ? 'text-yellow-400' : 'text-[#34D3A6]';

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    const p = platforms.find(pl => pl.id === id);
    setSelectedId(id);
    if (p) router.replace(`/dashboard/analytics?platform=${encodeURIComponent(p.slug)}`);
  }

  return (
    <div className="h-screen bg-[#0B0F12] text-white flex overflow-hidden">
      <Sidebar activeItem="analytics" onItemClick={(id) => {
        if (id === 'dashboard') router.push('/dashboard');
        if (id === 'analytics') router.push('/dashboard/analytics');
      }} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Analytics</h1>
              <p className="text-neutral-400">AI insights and privacy metrics per platform</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="bg-bg-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-neutral-200"
                value={selectedId || ''}
                onChange={handleSelectChange}
                disabled={loadingPlatforms || !platforms.length}
              >
                {platforms.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {isEnterprise && (
                <Button
                  variant="outline"
                  className="border-neutral-700 text-neutral-300 hover:text-white hover:border-brand-500/40"
                  onClick={async () => {
                    // Admin-only refresh; prompts for token because client cannot access env secrets.
                    // This calls POST /api/ai/analysis/refresh with x-ai-admin-token header.
                    if (!selectedId) return;
                    const token = window.prompt('Enter AI admin token to refresh analysis');
                    if (!token) return;
                    try {
                      const res = await fetch('/api/ai/analysis/refresh', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-ai-admin-token': token },
                        body: JSON.stringify({ templateId: undefined, platformId: selectedId }),
                      });
                      if (!res.ok) throw new Error(`HTTP ${res.status}`);
                      await res.json();
                      // Re-fetch analysis after refresh
                      const url = new URL(window.location.href);
                      url.searchParams.set('platformId', selectedId);
                      router.replace(url.toString());
                    } catch (e) {
                      console.error('Refresh failed', e);
                      alert('Failed to refresh analysis');
                    }
                  }}
                >
                  Refresh Analysis
                </Button>
              )}
            </div>
          </div>

          {loadingPlatforms && (
            <div className="flex items-center gap-2 text-neutral-400"><Loader2 className="w-4 h-4 animate-spin" /> Loading platforms…</div>
          )}
          {!loadingPlatforms && error && (
            <div className="flex items-center gap-2 text-red-400"><AlertCircle className="w-4 h-4" /> {error}</div>
          )}

          {/* Empty state if no platforms configured */}
          {!loadingPlatforms && !error && platforms.length === 0 && (
            <Card className="p-6 bg-bg-800 border-neutral-800">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-neutral-300">
                  No platforms found. Add a platform from your Dashboard to see analytics.
                </div>
                <Button
                  className="bg-brand-500 hover:bg-brand-600 text-bg-900 font-medium"
                  onClick={() => router.push('/dashboard')}
                >
                  + Add Platform
                </Button>
              </div>
            </Card>
          )}

          {!loadingPlatforms && !error && selectedPlatform && (
            <>
              {/* Hero header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-white font-semibold">
                    {selectedPlatform.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-white font-semibold text-lg">{selectedPlatform.name}</div>
                    <div className="text-xs text-neutral-400">Real-time analysis • Template-based</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="border-neutral-700 text-neutral-300 hover:text-white hover:border-brand-500/40">Download Report</Button>
                </div>
              </div>

              {/* Header cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="p-4 bg-bg-800 border-neutral-800">
                  <div className="text-sm text-neutral-400">Platform</div>
                  <div className="text-lg font-semibold text-white">{selectedPlatform.name}</div>
                </Card>
                <Card className="p-4 bg-bg-800 border-neutral-800">
                  <div className="text-sm text-neutral-400">Overall Risk</div>
                  <div className={`text-2xl font-bold ${scoreColor}`}>{score}/100</div>
                  <div className="mt-2"><Progress value={score} className="h-2" /></div>
                </Card>
                <Card className="p-4 bg-bg-800 border-neutral-800">
                  <div className="text-sm text-neutral-400">Analysis</div>
                  <div className="text-neutral-300 text-sm">{analysis?.aiAnalysis?.privacyImpact ?? '—'}</div>
                </Card>
              </div>

              {/* Summary */}
              {loadingAnalysis ? (
                <div className="flex items-center gap-2 text-neutral-400 mb-6"><Loader2 className="w-4 h-4 animate-spin" /> Loading analysis…</div>
              ) : analysis?.aiAnalysis ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                  <Card className="p-4 bg-bg-800 border-neutral-800 lg:col-span-2">
                    <div className="text-sm text-neutral-300 font-medium mb-2">Summary</div>
                    <p className="text-sm whitespace-pre-line text-neutral-200">{analysis.aiAnalysis.summary || '—'}</p>
                  </Card>
                  <Card className="p-4 bg-bg-800 border-neutral-800">
                    <div className="text-sm text-neutral-300 font-medium mb-2">Quick actions</div>
                    <ul className="list-disc list-inside text-neutral-200 text-sm space-y-1">
                      {(analysis.aiAnalysis.keyRecommendations || []).map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </Card>
                </div>
              ) : (
                <Card className="p-6 bg-bg-800 border-neutral-800 mb-6">
                  <div className="text-sm text-neutral-300">No analysis available yet.</div>
                </Card>
              )}

              {/* Metrics & facts */}
              {analysis?.aiAnalysis && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card className="p-4 bg-bg-800 border-neutral-800">
                    <div className="text-sm text-neutral-400">Categories</div>
                    <div className="text-xl font-semibold text-white">{Object.keys(analysis.categoryNameMap || {}).length || '—'}</div>
                  </Card>
                  <Card className="p-4 bg-bg-800 border-neutral-800">
                    <div className="text-sm text-neutral-400">Recommendations</div>
                    <div className="text-xl font-semibold text-white">{analysis.aiAnalysis.keyRecommendations?.length ?? 0}</div>
                  </Card>
                  <Card className="p-4 bg-bg-800 border-neutral-800">
                    <div className="text-sm text-neutral-400">Model</div>
                    <div className="text-sm text-neutral-200">{analysis.aiAnalysis.modelUsed}</div>
                  </Card>
                  <Card className="p-4 bg-bg-800 border-neutral-800">
                    <div className="text-sm text-neutral-400">Generated</div>
                    <div className="text-sm text-neutral-200">{new Date(analysis.aiAnalysis.generatedAt).toLocaleString()}</div>
                  </Card>
                </div>
              )}

              {/* Categories */}
              {analysis?.aiAnalysis?.categoryInsights && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {Object.entries(analysis.aiAnalysis.categoryInsights).map(([catId, info]) => (
                    <Card key={catId} className="p-4 bg-bg-800 border-neutral-800">
                      <div className="text-sm text-white font-medium">{analysis.categoryNameMap?.[catId] || info.title || catId}</div>
                      <div className="text-sm text-neutral-300 mt-1">{info.whatItMeans}</div>
                      <div className="mt-3 text-sm text-neutral-200 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-[#34D3A6]" />
                        {info.recommendedAction}
                      </div>
                      {typeof analysis.aiAnalysis.categoryScores?.[catId] === 'number' && (
                        <div className="mt-3">
                          <div className="text-xs text-neutral-400">Score</div>
                          <Progress value={analysis.aiAnalysis.categoryScores[catId]} className="h-2" />
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}

              {/* Risk factors */}
              {analysis?.aiAnalysis?.riskFactors?.length ? (
                <Card className="p-4 bg-bg-800 border-neutral-800 mb-12">
                  <div className="text-sm text-neutral-300 font-medium mb-2">Risk factors</div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.aiAnalysis.riskFactors.slice(0, 8).map((rf, i) => (
                      <span key={i} className="px-2 py-1 rounded-md text-xs bg-bg-700 border border-neutral-700 text-neutral-300">{rf}</span>
                    ))}
                  </div>
                </Card>
              ) : null}

              {/* Enterprise-only placeholders (roadmap):
                 - Change-tracking timeline (diffs by version/time)
                 - Trends & alerts (time-series of risk / category scores)
                 - Admin refresh (calls POST /api/ai/analysis/refresh)
                 These sections are intentionally gated by flags to keep
                 open-source UX identical while allowing enterprise layering. */}
              {!isEnterprise && (
                <Card className="p-4 bg-bg-800 border-neutral-800">
                  <div className="text-sm text-neutral-300 font-medium mb-1">Enterprise analytics</div>
                  <div className="text-sm text-neutral-400">Upgrade to enable change tracking, trends, and admin refresh.</div>
                </Card>
              )}

              {/* Enterprise-only future modules */}
              {isEnterprise && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card className="p-4 bg-bg-800 border-neutral-800">
                    <div className="text-sm text-neutral-300 font-medium mb-2">Change Tracking (coming soon)</div>
                    <div className="text-sm text-neutral-400">Track diffs across scans and versions.</div>
                  </Card>
                  <Card className="p-4 bg-bg-800 border-neutral-800">
                    <div className="text-sm text-neutral-300 font-medium mb-2">Trends & Alerts (coming soon)</div>
                    <div className="text-sm text-neutral-400">Risk trends and notifications over time.</div>
                  </Card>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
