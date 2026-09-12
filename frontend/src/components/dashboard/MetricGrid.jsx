import React from 'react';
import { Users, Wallet, BookOpen, UtensilsCrossed, Building2 } from 'lucide-react';
import { StatCounterCard } from '../common/StatCounterCard';
import { MOCK_METRICS } from '../../mock/mockData';

export function MetricGrid({ metrics, selectedBranch = 'ALL' }) {
  // Derive dynamic metrics based on selected branch
  let displayMetrics = { ...MOCK_METRICS };

  if (selectedBranch === 'CENTER') {
    displayMetrics = {
      totalStudents: {
        value: 158,
        labelAr: 'المسجلين بالمركز الأكاديمي',
        labelEn: 'Center Students',
        change: '+9 هذا الشهر',
        isPositive: true,
        subtextAr: 'فرع المركز الأكاديمي (الخوارزمي، الروبوتيك، اللغات)',
      },
      liveCashDrawer: {
        value: '115,000 دج',
        labelAr: 'صندوق المركز الأكاديمي',
        labelEn: 'Center Cash Drawer',
        change: '+11,250 دج اليوم',
        isPositive: true,
        subtextAr: 'شباك الاستقبال الرئيسي - المركز',
      },
      activePrograms: {
        value: 5,
        labelAr: 'البرامج وورشات المركز',
        labelEn: 'Center Programs',
        change: '8 أفواج أسبوعية',
        isPositive: true,
        subtextAr: 'الحساب الذهني، الروبوتيك، اللغات، القرآن، الدعم',
      },
      kitchenSupplyStatus: {
        value: '86.4%',
        labelAr: 'نسبة تحصيل المركز الأكاديمي',
        labelEn: 'Center Collection Rate',
        change: '+4.1% هذا الشهر',
        isPositive: true,
        subtextAr: '1,120,000 دج محصل من 1,296,000 دج',
      },
    };
  } else if (selectedBranch === 'RAWDA') {
    displayMetrics = {
      totalStudents: {
        value: 115,
        labelAr: 'أطفال الروضة والحضانة',
        labelEn: 'Daycare Children',
        change: '+5 أطفال جدد',
        isPositive: true,
        subtextAr: 'حضانة صغار، تمهيدي 1، تمهيدي 2، وتحضيري معتمد',
      },
      liveCashDrawer: {
        value: '69,500 دج',
        labelAr: 'صندوق روضة العباقرة',
        labelEn: 'Rawda Cash Drawer',
        change: '+6,750 دج اليوم',
        isPositive: true,
        subtextAr: 'شباك الاشتراكات والإطعام بالروضة',
      },
      activePrograms: {
        value: 4,
        labelAr: 'أفواج وأقسام الروضة',
        labelEn: 'Daycare Sections',
        change: '6 قاعات وفضاءات',
        isPositive: true,
        subtextAr: 'العصافير، البراعم، النجوم، العباقرة الصغار',
      },
      kitchenSupplyStatus: {
        value: '100% منتظم',
        labelAr: 'تموين المطبخ وإطعام الروضة',
        labelEn: 'Rawda Kitchen Supplies',
        change: 'وجبات يومية كاملة',
        isPositive: true,
        subtextAr: '80 خبزة يومياً + تموين أسبوعي باللحوم والخضر',
      },
    };
  }

  const m = metrics || displayMetrics;

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
        title={m?.activePrograms?.labelAr || 'البرامج والأفواج النشطة'}
        value={m?.activePrograms?.value ?? 9}
        change={m?.activePrograms?.change || ''}
        subtext={m?.activePrograms?.subtextAr || ''}
        icon={BookOpen}
        accentColor="navy"
      />

      <StatCounterCard
        title={m?.kitchenSupplyStatus?.labelAr || 'حالة تموين المطبخ والمخبزة'}
        value={m?.kitchenSupplyStatus?.value ?? '100% منتظم'}
        change={m?.kitchenSupplyStatus?.change || ''}
        subtext={m?.kitchenSupplyStatus?.subtextAr || ''}
        icon={selectedBranch === 'CENTER' ? Building2 : UtensilsCrossed}
        accentColor="slate"
      />
    </div>
  );
}
