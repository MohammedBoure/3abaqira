import React from 'react';
import { Users, Wallet, BookOpen, UtensilsCrossed } from 'lucide-react';
import { StatCounterCard } from '../common/StatCounterCard';
import { MOCK_METRICS } from '../../mock/mockData';

export function MetricGrid({ metrics = MOCK_METRICS }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <StatCounterCard
        title={metrics.totalStudents.labelAr}
        value={metrics.totalStudents.value}
        change={metrics.totalStudents.change}
        subtext={metrics.totalStudents.subtextAr}
        icon={Users}
        accentColor="blue"
      />

      <StatCounterCard
        title={metrics.liveCashDrawer.labelAr}
        value={metrics.liveCashDrawer.value}
        change={metrics.liveCashDrawer.change}
        subtext={metrics.liveCashDrawer.subtextAr}
        icon={Wallet}
        accentColor="cyan"
      />

      <StatCounterCard
        title={metrics.activePrograms.labelAr}
        value={metrics.activePrograms.value}
        change={metrics.activePrograms.change}
        subtext={metrics.activePrograms.subtextAr}
        icon={BookOpen}
        accentColor="indigo"
      />

      <StatCounterCard
        title={metrics.kitchenSupplyStatus.labelAr}
        value={metrics.kitchenSupplyStatus.value}
        change={metrics.kitchenSupplyStatus.change}
        subtext={metrics.kitchenSupplyStatus.subtextAr}
        icon={UtensilsCrossed}
        accentColor="cyan"
      />
    </div>
  );
}
