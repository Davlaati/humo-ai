import React, { useEffect, useState } from 'react';

type Summary = {
  dau: number;
  mau: number;
  dauMauRatio: number;
  conversionRate: number;
  activeSubscribers: number;
  mrr: number;
  arpu: number;
  churnRate: number;
  openAbuseFlags: number;
  abuseRate: number;
};

type FeatureRow = {
  feature: string;
  totalEvents: number;
  uniqueUsers: number;
  engagementRate: number;
};

const defaultSummary: Summary = {
  dau: 0,
  mau: 0,
  dauMauRatio: 0,
  conversionRate: 0,
  activeSubscribers: 0,
  mrr: 0,
  arpu: 0,
  churnRate: 0,
  openAbuseFlags: 0,
  abuseRate: 0,
};

const GrowthDashboard: React.FC = () => {
  const [summary, setSummary] = useState<Summary>(defaultSummary);
  const [features, setFeatures] = useState<FeatureRow[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [overviewRes, featureRes] = await Promise.all([
          fetch('/.netlify/functions/analytics-overview'),
          fetch('/.netlify/functions/analytics-feature-usage')
        ]);

        if (!overviewRes.ok || !featureRes.ok) {
          return;
        }

        const overviewData = await overviewRes.json();
        const featureData = await featureRes.json();
        setSummary(overviewData.summary || defaultSummary);
        setFeatures(featureData.featureUsage || []);
      } catch (error) {
        console.warn('Growth analytics unavailable', error);
      }
    };

    load();
  }, []);

  const cards = [
    { label: 'DAU / MAU', value: `${summary.dau} / ${summary.mau}`, helper: `${summary.dauMauRatio.toFixed(1)}% stickiness` },
    { label: 'Conversion Rate', value: `${summary.conversionRate.toFixed(1)}%`, helper: `${summary.activeSubscribers} active paid users` },
    { label: 'Revenue Analytics', value: `$${summary.mrr.toFixed(2)} MRR`, helper: `$${summary.arpu.toFixed(2)} ARPU` },
    { label: 'Churn Tracking', value: `${summary.churnRate.toFixed(1)}%`, helper: 'last 30 days cancellation rate' },
    { label: 'Abuse Flags', value: `${summary.openAbuseFlags}`, helper: `${summary.abuseRate.toFixed(1)}% of MAU` },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {cards.map(card => (
          <div key={card.label} className="glass-card p-4 rounded-2xl border border-white/10 bg-slate-900/50">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">{card.label}</p>
            <p className="text-xl font-black text-white mt-2">{card.value}</p>
            <p className="text-[10px] text-slate-400 mt-1">{card.helper}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-6 rounded-2xl border border-white/10 bg-slate-900/50">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Feature Usage Stats</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-500 uppercase tracking-widest text-[10px]">
              <tr>
                <th className="pb-3">Feature</th>
                <th className="pb-3">Events</th>
                <th className="pb-3">Unique Users</th>
                <th className="pb-3">Engagement</th>
              </tr>
            </thead>
            <tbody>
              {features.map((row) => (
                <tr key={row.feature} className="border-t border-white/5">
                  <td className="py-3 text-white font-bold">{row.feature}</td>
                  <td className="py-3">{row.totalEvents}</td>
                  <td className="py-3">{row.uniqueUsers}</td>
                  <td className="py-3">{row.engagementRate.toFixed(1)}%</td>
                </tr>
              ))}
              {features.length === 0 && (
                <tr>
                  <td className="py-3 text-slate-500" colSpan={4}>No analytics data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GrowthDashboard;
