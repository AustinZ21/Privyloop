"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from 'src/components/ui/dialog';
import { Button } from 'src/components/ui/button';
import { Card } from 'src/components/ui/card';
import { Progress } from 'src/components/ui/progress';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

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

export function PrivacyAnalysisDialog({
  open,
  onOpenChange,
  platformId,
  platformName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  platformId?: string;
  platformName?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse['data'] | null>(null);
  const isEnterprise = process.env.NEXT_PUBLIC_DEPLOYMENT_MODE === 'enterprise';

  useEffect(() => {
    if (!open || !platformId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/ai/analysis?platformId=${encodeURIComponent(platformId)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as AnalysisResponse;
      })
      .then((json) => {
        if (!json.success) throw new Error(json.error?.message || 'Unknown error');
        setAnalysis(json.data || null);
      })
      .catch((err) => setError(err.message || 'Failed to load analysis'))
      .finally(() => setLoading(false));
  }, [open, platformId]);

  const scoreColor = useMemo(() => {
    const score = analysis?.aiAnalysis?.overallRiskScore ?? 50;
    return score >= 67 ? 'text-red-400' : score >= 34 ? 'text-yellow-400' : 'text-[#34D3A6]';
  }, [analysis]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl bg-bg-900 border-neutral-800 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-white flex items-center gap-2">
            Privacy Analysis {platformName ? `— ${platformName}` : ''}
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            Clear, plain-English insights generated once per template.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          {loading && (
            <div className="flex items-center gap-3 text-neutral-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading analysis...
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {!loading && !error && !platformId && (
            <Card className="p-4 bg-bg-800 border-neutral-800">
              <div className="text-sm text-neutral-300">Select a connected platform to view analysis.</div>
            </Card>
          )}

          {!loading && !error && analysis?.aiAnalysis && (
            <>
              {/* Summary + Score */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 bg-bg-800 border-neutral-800 md:col-span-2">
                  <p className="text-sm whitespace-pre-line text-neutral-200">
                    {analysis.aiAnalysis.summary || 'No summary available.'}
                  </p>
                </Card>
                <Card className="p-4 bg-bg-800 border-neutral-800">
                  <div className="text-sm text-neutral-400">Overall Risk</div>
                  <div className={`text-2xl font-bold ${scoreColor}`}>
                    {analysis.aiAnalysis.overallRiskScore}/100
                  </div>
                  <div className="mt-3">
                    <Progress value={analysis.aiAnalysis.overallRiskScore} className="h-2" />
                  </div>
                  <div className="text-xs text-neutral-400 mt-2">
                    Impact: {analysis.aiAnalysis.privacyImpact}
                  </div>
                </Card>
              </div>

              {/* Recommendations */}
              {analysis.aiAnalysis.keyRecommendations?.length ? (
                <Card className="p-4 bg-bg-800 border-neutral-800">
                  <div className="text-sm text-neutral-300 font-medium mb-2">Quick actions</div>
                  <ul className="list-disc list-inside text-neutral-200 text-sm space-y-1">
                    {analysis.aiAnalysis.keyRecommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </Card>
              ) : null}

              {/* Category insights */}
              {analysis.aiAnalysis.categoryInsights && (
                <div className="space-y-3">
                  {Object.entries(analysis.aiAnalysis.categoryInsights).map(([catId, info]) => (
                    <Card key={catId} className="p-4 bg-bg-800 border-neutral-800">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm text-white font-medium">
                            {analysis.categoryNameMap?.[catId] || info.title || catId}
                          </div>
                          <div className="text-sm text-neutral-300 mt-1">
                            {info.whatItMeans}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-neutral-400">Category score</div>
                          <div className="text-base text-neutral-200">
                            {analysis.aiAnalysis.categoryScores?.[catId] ?? '—'}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-neutral-200 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-[#34D3A6]" />
                        {info.recommendedAction}
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Enterprise-only: extras */}
              {isEnterprise && (
                <Card className="p-4 bg-bg-800 border-neutral-800">
                  <div className="text-sm text-neutral-300 font-medium mb-2">Advanced details</div>
                  <div className="text-xs text-neutral-400">
                    <div>Model: {analysis.aiAnalysis.modelUsed}</div>
                    <div>Generated: {new Date(analysis.aiAnalysis.generatedAt).toLocaleString()}</div>
                    {/* Future: change tracking, diffs, trends */}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
