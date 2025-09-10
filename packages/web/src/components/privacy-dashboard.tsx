"use client";

import React, { useState, useEffect, useRef } from 'react';
import { cn } from 'src/lib/utils';
import { Button } from 'src/components/ui/button';
import { Card } from 'src/components/ui/card';
import { Badge } from 'src/components/ui/badge';
import { Input } from 'src/components/ui/input';
import { Progress } from 'src/components/ui/progress';
import Sidebar from 'src/components/ui/sidebar';
import { PrivacyAnalysisDialog } from 'src/components/analysis/privacy-analysis-dialog';
import { useRouter } from 'next/navigation';
import { flags } from 'src/lib/flags';
import { 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Loader2, 
  Eye, 
  Menu, 
  X, 
  Settings, 
  Home, 
  BarChart3, 
  Users, 
  Bell,
  Search,
  Plus,
  Scan,
  Wifi,
  WifiOff,
  AlertTriangle
} from 'lucide-react';


interface Platform {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: 'connected' | 'connecting' | 'failed' | 'scanning';
  lastScan?: string;
  riskLevel: 'low' | 'medium' | 'high';
  progress?: number;
  dataPoints?: number;
  privacyScore?: number;
}

interface SidebarLink {
  id: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}

interface PrivacyDashboardProps {
  platforms?: Platform[];
  sidebarLinks?: SidebarLink[];
  showUpgradeHint?: boolean;
  freeLimit?: number;
}

const defaultPlatforms: Platform[] = [
  {
    id: 'google',
    name: 'Google',
    icon: <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">G</div>,
    status: 'connected',
    lastScan: '2 hours ago',
    riskLevel: 'medium',
    dataPoints: 847,
    privacyScore: 72
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">in</div>,
    status: 'scanning',
    lastScan: 'Scanning now...',
    riskLevel: 'low',
    progress: 65,
    dataPoints: 234,
    privacyScore: 85
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">f</div>,
    status: 'connected',
    lastScan: '1 day ago',
    riskLevel: 'high',
    dataPoints: 1203,
    privacyScore: 45
  },
  {
    id: 'twitter',
    name: 'Twitter',
    icon: <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center text-white text-xs font-bold">𝕏</div>,
    status: 'failed',
    lastScan: 'Failed to connect',
    riskLevel: 'medium',
    dataPoints: 0,
    privacyScore: 0
  },
  {
    id: 'amazon',
    name: 'Amazon',
    icon: <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">A</div>,
    status: 'connecting',
    lastScan: 'Connecting...',
    riskLevel: 'low',
    dataPoints: 0,
    privacyScore: 0
  }
];

const defaultSidebarLinks: SidebarLink[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" />, active: true },
  { id: 'scans', label: 'Privacy Scans', icon: <Scan className="w-5 h-5" /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'accounts', label: 'Connected Accounts', icon: <Users className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> }
];

const StatusIcon = ({ status }: { status: Platform['status'] }) => {
  switch (status) {
    case 'connected':
      return <CheckCircle className="w-4 h-4 text-[#34D3A6]" />;
    case 'connecting':
      return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
    case 'failed':
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    case 'scanning':
      return <Loader2 className="w-4 h-4 text-[#34D3A6] animate-spin" />;
    default:
      return <Clock className="w-4 h-4 text-gray-500" />;
  }
};

const RiskBadge = ({ level }: { level: Platform['riskLevel'] }) => {
  const variants = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <Badge variant="outline" className={cn("text-xs font-medium", variants[level])}>
      {level.charAt(0).toUpperCase() + level.slice(1)} Risk
    </Badge>
  );
};

const PlatformCard = ({ platform, isUpgradeGated = false, onViewDetails }: { platform: Platform; isUpgradeGated?: boolean; onViewDetails?: (p: Platform) => void }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card 
      className={cn(
        "relative p-6 transition-all duration-300 cursor-pointer group",
        "bg-[#101518] border-[#233037] hover:border-[#34D3A6]/30",
        "hover:shadow-lg hover:shadow-[#34D3A6]/10 hover:-translate-y-1",
        isUpgradeGated && "opacity-60"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isUpgradeGated && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <Shield className="w-8 h-8 text-[#34D3A6] mx-auto mb-2" />
            <p className="text-sm text-white font-medium">Upgrade to Pro</p>
            <p className="text-xs text-gray-400">Unlock more platforms</p>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {platform.icon}
          <div>
            <h3 className="font-semibold text-white">{platform.name}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <StatusIcon status={platform.status} />
              <span className="text-sm text-gray-400 capitalize">{platform.status}</span>
            </div>
          </div>
        </div>
        <RiskBadge level={platform.riskLevel} />
      </div>

      {platform.status === 'scanning' && platform.progress && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Scanning progress</span>
            <span className="text-[#34D3A6]">{platform.progress}%</span>
          </div>
          <Progress value={platform.progress} className="h-2" />
        </div>
      )}

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Last scan:</span>
          <span className="text-white">{platform.lastScan}</span>
        </div>
        {platform.privacyScore !== undefined && platform.privacyScore > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Privacy Score:</span>
            <div className="flex items-center space-x-2">
              <span className={cn(
                "text-sm font-medium",
                platform.privacyScore >= 80 ? "text-[#34D3A6]" :
                platform.privacyScore >= 60 ? "text-yellow-400" : "text-red-400"
              )}>{platform.privacyScore}/100</span>
              <div className={cn(
                "w-12 h-1.5 rounded-full",
                platform.privacyScore >= 80 ? "bg-[#34D3A6]" :
                platform.privacyScore >= 60 ? "bg-yellow-400" : "bg-red-400"
              )} style={{ width: `${Math.max(platform.privacyScore / 100 * 48, 4)}px` }} />
            </div>
          </div>
        )}
        {platform.dataPoints !== undefined && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Data points:</span>
            <span className="text-white">{platform.dataPoints.toLocaleString()}</span>
          </div>
        )}
      </div>

      <Button 
        className={cn(
          "w-full bg-[#34D3A6] hover:bg-[#34D3A6]/90 text-black font-medium",
          "transition-all duration-200",
          isHovered && "shadow-lg shadow-[#34D3A6]/20"
        )}
        disabled={isUpgradeGated}
        onClick={() => onViewDetails?.(platform)}
      >
        <Eye className="w-4 h-4 mr-2" />
        View Details
      </Button>
    </Card>
  );
};



export function PrivacyDashboard({
  platforms = defaultPlatforms,
  sidebarLinks = defaultSidebarLinks,
  showUpgradeHint = true,
  freeLimit = 3
}: PrivacyDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | undefined>(undefined);
  const [selectedPlatformName, setSelectedPlatformName] = useState<string | undefined>(undefined);
  const router = useRouter();
  const [metaBySlug, setMetaBySlug] = useState<Record<string, { id: string; slug: string; logoUrl?: string | null }>>({});
  const [liveList, setLiveList] = useState<Array<{ id: string; name: string; slug: string; logoUrl?: string | null }>>([]);
  const [displayPlatforms, setDisplayPlatforms] = useState<Platform[]>(platforms);

  const filteredPlatforms = displayPlatforms.filter(platform =>
    platform.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats source: prefer merged/enriched list if available; fallback to curated defaults
  const statsSource = displayPlatforms.length ? displayPlatforms : platforms;
  const scanStatus = {
    active: statsSource.some(p => p.status === 'scanning' || p.status === 'connecting'),
    count: statsSource.filter(p => p.status === 'scanning' || p.status === 'connecting').length
  };
  const connectedCount = statsSource.filter(p => p.status === 'connected').length;
  const highRiskCount = statsSource.filter(p => p.riskLevel === 'high').length;
  const dataPointsTotal = statsSource.reduce((sum, p) => sum + (p.dataPoints || 0), 0);

  function handleViewDetails(p: Platform) {
    const slug = p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, '-');
    const meta = metaBySlug[slug];
    if (meta?.id) {
      router.push(`/dashboard/analytics?platformId=${encodeURIComponent(meta.id)}`);
    } else {
      router.push(`/dashboard/analytics?platform=${encodeURIComponent(slug)}`);
    }
  }

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === 'analytics') {
      router.push('/dashboard/analytics');
    }
  };

  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => document.documentElement.classList.remove('dark');
  }, []);

  // Load platform IDs/slugs to support analytics navigation while keeping current UI unchanged.
  // NOTE: This does NOT alter card visuals or curated values. It only enables
  // deep-linking to the Analytics page using real platformId when available.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/scraping/platforms');
        const json = await res.json();
        if (!json?.success || !Array.isArray(json.data)) return;
        const map: Record<string, { id: string; slug: string; logoUrl?: string | null }> = {};
        const list: Array<{ id: string; name: string; slug: string; logoUrl?: string | null }> = [];
        for (const p of json.data) {
          map[p.slug] = { id: p.id, slug: p.slug, logoUrl: p.logoUrl ?? null };
          list.push({ id: p.id, name: p.name, slug: p.slug, logoUrl: p.logoUrl ?? null });
        }
        if (mounted) {
          setMetaBySlug(map);
          setLiveList(list);
        }
      } catch {
        // ignore silently to avoid UI disruption
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Merge default design cards with live DB platforms without changing visuals.
  useEffect(() => {
    // Helper for slug from name
    const toSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, '-');

    // 1) Start with curated default cards to preserve order/visuals
    const bySlug = new Map<string, Platform>();
    const seeded: Platform[] = platforms.map((p) => {
      const slug = (p as any).slug || toSlug(p.name);
      const meta = metaBySlug[slug];
      const merged: Platform = {
        ...p,
        slug,
        platformId: meta?.id,
      };
      bySlug.set(slug, merged);
      return merged;
    });

    // 2) Append extra live platforms not in defaults
    const extras: Platform[] = [];
    for (const lp of liveList) {
      if (bySlug.has(lp.slug)) continue;
      extras.push({
        id: lp.slug,
        name: lp.name,
        icon: (
          <div className="w-6 h-6 bg-neutral-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {lp.name.charAt(0)}
          </div>
        ),
        status: 'connected',
        riskLevel: 'medium',
        dataPoints: 0,
        privacyScore: undefined,
        slug: lp.slug,
        platformId: lp.id,
      });
    }

    setDisplayPlatforms([...seeded, ...extras]);
  }, [platforms, metaBySlug, liveList]);

  // Enrich card values (lastScan, privacyScore, risk badge) using AI analysis; keep UI design intact.
  // IMPORTANT: Controlled by flags.liveCards to avoid accidental design regressions
  // or inconsistent demo data. When off, curated values remain as-is.
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!Object.keys(metaBySlug).length) return;
      const updated = await Promise.all(
        displayPlatforms.map(async (p) => {
          try {
            const slug = (p as any).slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, '-');
            const meta = metaBySlug[slug];
            if (!meta?.id) return p;
            const res = await fetch(`/api/ai/analysis?platformId=${encodeURIComponent(meta.id)}`);
            if (!res.ok) return p;
            const json = await res.json();
            const ai = json?.data?.aiAnalysis;
            if (!ai) return p;
            const score = Math.max(0, Math.min(100, Math.round(100 - (ai.overallRiskScore ?? 50))));
            const next: Platform = { ...p };
            if (flags.liveCards) {
              // Overlay all live card metrics when available, else keep curated.
              if (Number.isFinite(score)) next.privacyScore = score;
              if (typeof ai.generatedAt === 'string') next.lastScan = formatRelativeTime(ai.generatedAt) || p.lastScan;
              const impact = (ai.privacyImpact as 'low' | 'medium' | 'high') || (ai.overallRiskScore >= 67 ? 'high' : ai.overallRiskScore >= 34 ? 'medium' : 'low');
              if (impact) next.riskLevel = impact;
            }
            return next;
          } catch {
            return p;
          }
        })
      );
       if (mounted) {
         // Avoid update loops: only set if key overlay fields changed
         let changed = false;
         for (let i = 0; i < updated.length; i++) {
           const a = updated[i];
           const b = displayPlatforms[i];
           if (!b || a.privacyScore !== b.privacyScore || a.lastScan !== b.lastScan || a.riskLevel !== b.riskLevel) {
             changed = true;
             break;
           }
         }
         if (changed) setDisplayPlatforms(updated);
       }
    })();
    return () => { mounted = false; };
  }, [displayPlatforms, metaBySlug]);

  function formatRelativeTime(isoTs?: string): string | undefined {
    if (!isoTs) return undefined;
    const now = Date.now();
    const t = new Date(isoTs).getTime();
    if (!Number.isFinite(t)) return undefined;
    const sec = Math.max(0, Math.floor((now - t) / 1000));
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} min${min === 1 ? '' : 's'} ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
    const day = Math.floor(hr / 24);
    return `${day} day${day === 1 ? '' : 's'} ago`;
  }

  return (
    <div className="h-screen bg-[#0B0F12] text-white flex overflow-hidden">
      <Sidebar 
        activeItem={activeTab}
        onItemClick={handleTabClick}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white">Privacy Dashboard</h1>
                <p className="text-neutral-400">Monitor and manage your digital privacy</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 px-3 py-2 bg-bg-700 rounded-lg border border-neutral-700">
                  {scanStatus.active ? (
                    <>
                      <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
                      <span className="text-sm text-white">Scanning {scanStatus.count} platforms</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 text-brand-500" />
                      <span className="text-sm text-white">All scans complete</span>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="border-neutral-700 text-neutral-400 hover:text-white hover:border-brand-500/30"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Alerts
                </Button>
              </div>
            </div>
          </div>

          {/* Search and filters */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  placeholder="Search platforms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-bg-700 border-neutral-700 text-white placeholder:text-neutral-400 focus:border-brand-500/50"
                />
              </div>
              
              <Button className="bg-brand-500 hover:bg-brand-600 text-bg-900 font-medium">
                <Plus className="w-4 h-4 mr-2" />
                Add Platform
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card className="p-4 sm:p-6 bg-bg-800 border-neutral-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-400 text-sm">Connected Platforms</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    {connectedCount}
                  </p>
                </div>
                <Wifi className="w-6 h-6 sm:w-8 sm:h-8 text-brand-500" />
              </div>
            </Card>

            <Card className="p-4 sm:p-6 bg-bg-800 border-neutral-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-400 text-sm">High Risk</p>
                  <p className="text-2xl font-bold text-red-400">
                    {highRiskCount}
                  </p>
                </div>
                <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" />
              </div>
            </Card>

            <Card className="p-4 sm:p-6 bg-bg-800 border-neutral-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-400 text-sm">Data Points</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    {dataPointsTotal.toLocaleString()}
                  </p>
                </div>
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-brand-500" />
              </div>
            </Card>

            <Card className="p-4 sm:p-6 bg-bg-800 border-neutral-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-400 text-sm">Active Scans</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {scanStatus.count}
                  </p>
                </div>
                <Scan className="w-8 h-8 text-yellow-400" />
              </div>
            </Card>
          </div>

          {/* Platforms grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredPlatforms.map((platform, index) => (
              <PlatformCard 
                key={platform.id} 
                platform={platform}
                isUpgradeGated={showUpgradeHint && index >= freeLimit}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>

          {/* Upgrade hint */}
          {showUpgradeHint && filteredPlatforms.length > freeLimit && (
            <Card className="mt-8 p-6 bg-gradient-to-r from-[#34D3A6]/10 to-[#34D3A6]/5 border-[#34D3A6]/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-[#34D3A6]/20 rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-[#34D3A6]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Upgrade to PrivyLoop Pro</h3>
                    <p className="text-gray-400">Connect unlimited platforms and get advanced privacy insights</p>
                  </div>
                </div>
                <Button className="bg-[#34D3A6] hover:bg-[#34D3A6]/90 text-black font-medium">
                  Upgrade Now
                </Button>
              </div>
            </Card>
          )}
        </main>
        {/* Analysis dialog overlay (legacy, unused; navigation used instead) */}
      </div>
    </div>
  );
}

export default function PrivacyDashboardDemo() {
  return <PrivacyDashboard />;
}
