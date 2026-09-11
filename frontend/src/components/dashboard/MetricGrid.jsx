import React from 'react';
import { Users, Wallet, BookOpen, UtensilsCrossed } from 'lucide-react';
import { StatCounterCard } from '../common/StatCounterCard';
import { MOCK_METRICS } from '../../mock/mockData';

export function MetricGrid({ metrics = MOCK_METRICS }) {
  const m = metrics || MOCK_METRICS;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
      <StatCounterCard
        title={m?.totalStudents?.labelAr || 'إجمالي المسجلين النشطين'}
        value={m?.totalStudents?.value ?? 273}
        change={m?.totalStudents?.change || ''}
        subtext={m?.totalStudents?.subtextAr || ''}
        icon={Users}
        accentColor="navy"
      />

      <StatCounterCard
        title={m?.liveCashDrawer?.labelAr || 'سيولة الصندوق اليومي'}
        value={m?.liveCashDrawer?.value ?? '184,500 دج'}
        change={m?.liveCashDrawer?.change || ''}
        subtext={m?.liveCashDrawer?.subtextAr || ''}
        icon={Wallet}
        accentColor="emerald"
      />

      <StatCounterCard
        title={m?.activePrograms?.labelAr || m?.collectionRate?.labelAr || 'البرامج والأفواج النشطة'}
        value={m?.activePrograms?.value ?? m?.collectionRate?.value ?? 9}
        change={m?.activePrograms?.change || m?.collectionRate?.change || ''}
        subtext={m?.activePrograms?.subtextAr || m?.collectionRate?.subtextAr || ''}
        icon={BookOpen}
        accentColor="navy"
      />

      <StatCounterCard
        title={m?.kitchenSupplyStatus?.labelAr || 'حالة تموين المطبخ والمخبزة'}
        value={m?.kitchenSupplyStatus?.value ?? '100% منتظم'}
        change={m?.kitchenSupplyStatus?.change || ''}
        subtext={m?.kitchenSupplyStatus?.subtextAr || ''}
        icon={UtensilsCrossed}
        accentColor="slate"
      />
    </div>
  );
}
