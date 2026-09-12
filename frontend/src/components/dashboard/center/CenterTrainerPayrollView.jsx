import React, { useState } from 'react';
import {
  Coins,
  Calculator,
  Users,
  Award,
  BookOpen,
  Languages,
  CheckCircle,
  Plus,
} from 'lucide-react';
import { StandardViewLayout } from '../common/StandardViewLayout';
import { MOCK_CENTER_TRAINERS } from '../../../mock/centerMockData';

export function CenterTrainerPayrollView() {
  const [activeTab, setActiveTab] = useState('soroban');
  const [trainersData, setTrainersData] = useState(MOCK_CENTER_TRAINERS);

  // Live Calculator Simulator state
  const [calcSpecialty, setCalcSpecialty] = useState('soroban');
  const [calcStudents, setCalcStudents] = useState(15);
  const [calcCoefficient, setCalcCoefficient] = useState(1200);
  const [calcSessions, setCalcSessions] = useState(16);
  const [calcHourlyRate, setCalcHourlyRate] = useState(1800);

  // 1. KPI Calculations (Section 3.3.12)
  const sorobanTotal = trainersData.soroban.reduce((acc, t) => acc + t.calculatedWage, 0);
  const quranTotal = trainersData.quran.reduce((acc, t) => acc + t.calculatedWage, 0);
  const languagesTotal = trainersData.languages.reduce((acc, t) => acc + t.calculatedWage, 0);
  const grandTotalTrainers = sorobanTotal + quranTotal + languagesTotal;

  const kpiCards = [
    {
      label: 'إجمالي أجور المؤطرين والمدربين',
      value: `${grandTotalTrainers.toLocaleString()} دج`,
      icon: Coins,
      subtext: 'مجموع أجور السوروبان والقرآن واللغات',
      change: 'مستحق الصرف',
      isPositive: true,
    },
    {
      label: 'كتلة أجور مدربي السوروبان',
      value: `${sorobanTotal.toLocaleString()} دج`,
      icon: Award,
      subtext: 'معادلة: عدد الطلاب × معامل المستوى',
      change: '4 أفواج نشطة',
      isPositive: true,
    },
    {
      label: 'كتلة أجور معلمي القرآن الكريم',
      value: `${quranTotal.toLocaleString()} دج`,
      icon: BookOpen,
      subtext: 'محسوبة بحصص الجمعة والسبت',
      change: '16 حصة مؤداة',
      isPositive: true,
    },
    {
      label: 'كتلة أجور أساتذة اللغات والدعم',
      value: `${languagesTotal.toLocaleString()} دج`,
      icon: Languages,
      subtext: 'معادلة: عدد الساعات × سعر الساعة',
      change: '62 ساعة منجزة',
      isPositive: true,
    },
  ];

  // Simulator Result
  const simulatorResult =
    calcSpecialty === 'soroban'
      ? Number(calcStudents) * Number(calcCoefficient)
      : Number(calcSessions) * Number(calcHourlyRate);

  return (
    <StandardViewLayout
      titleAr="وحدة احتساب أجور المدربين والأساتذة (بالحصة وحجم الفوج)"
      titleEn="Trainer & Instructor Dynamic Wage Computing Engine"
      description="نظام الاحتساب الآلي الدقيق لأجور الأساتذة والمؤطرين حسب تخصص التدريب: مدربو السوروبان (طلاب × معامل المستوى)، معلمو القرآن (حصص الجمعة والسبت)، وأساتذة اللغات والدعم (ساعات × سعر تعاقدي)."
      entityTag="الموارد البشرية والأجور"
      branchCode="CENTER"
      kpiCards={kpiCards}
      exportFileName={`center_trainers_payroll_${activeTab}`}
      exportData={trainersData[activeTab].map((t) => ({
        ...t,
        calculatedWage: `${t.calculatedWage} دج`,
      }))}
      filterSlot={
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 border border-slate-200">
          <button
            onClick={() => setActiveTab('soroban')}
            className={`h-6 px-3 text-xs font-semibold transition-colors ${
              activeTab === 'soroban'
                ? 'bg-blue-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            مدربو السوروبان ({sorobanTotal.toLocaleString()} دج)
          </button>
          <button
            onClick={() => setActiveTab('quran')}
            className={`h-6 px-3 text-xs font-semibold transition-colors ${
              activeTab === 'quran'
                ? 'bg-blue-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            معلمو القرآن ({quranTotal.toLocaleString()} دج)
          </button>
          <button
            onClick={() => setActiveTab('languages')}
            className={`h-6 px-3 text-xs font-semibold transition-colors ${
              activeTab === 'languages'
                ? 'bg-blue-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            أساتذة اللغات والدعم ({languagesTotal.toLocaleString()} دج)
          </button>
        </div>
      }
    >
      {/* 1. Live Interactive Calculator Simulator Widget */}
      <div className="p-3 bg-blue-50/50 border-b border-slate-200">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-900" />
            <span className="font-bold text-xs text-blue-950">
              محاكي الاحتساب التلقائي لأجر الحصة أو الفوج (Formula Simulator)
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">معادلات معتمدة ومطابقة للمواصفات الفنية</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 items-end text-xs">
          <div>
            <label className="block text-slate-600 mb-1">تخصص التدريب:</label>
            <select
              value={calcSpecialty}
              onChange={(e) => setCalcSpecialty(e.target.value)}
              className="w-full h-8 px-2 border border-slate-300 bg-white font-semibold text-slate-800"
            >
              <option value="soroban">السوروبان (عدد الأطفال × المعامل)</option>
              <option value="quran">القرآن (الحصص المؤداة × سعر الحصة)</option>
              <option value="languages">اللغات والدعم (الساعات × السعر التعاقدي)</option>
            </select>
          </div>

          {calcSpecialty === 'soroban' ? (
            <>
              <div>
                <label className="block text-slate-600 mb-1">عدد الأطفال المسجلين بالفوج:</label>
                <input
                  type="number"
                  value={calcStudents}
                  onChange={(e) => setCalcStudents(e.target.value)}
                  className="w-full h-8 px-2 border border-slate-300 bg-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">المعامل المالي للمستوى (دج):</label>
                <input
                  type="number"
                  value={calcCoefficient}
                  onChange={(e) => setCalcCoefficient(e.target.value)}
                  className="w-full h-8 px-2 border border-slate-300 bg-white font-mono font-bold"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-slate-600 mb-1">عدد الحصص / الساعات المنجزة:</label>
                <input
                  type="number"
                  value={calcSessions}
                  onChange={(e) => setCalcSessions(e.target.value)}
                  className="w-full h-8 px-2 border border-slate-300 bg-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">قيمة الحصة / الساعة التعاقدية (دج):</label>
                <input
                  type="number"
                  value={calcHourlyRate}
                  onChange={(e) => setCalcHourlyRate(e.target.value)}
                  className="w-full h-8 px-2 border border-slate-300 bg-white font-mono font-bold"
                />
              </div>
            </>
          )}

          <div className="bg-white p-1.5 border border-blue-200 flex flex-col justify-center text-center">
            <span className="text-[10px] text-slate-500 font-semibold">المستحق المحسوب تلقائياً:</span>
            <span className="text-base font-bold font-mono text-emerald-800">
              {simulatorResult.toLocaleString()} دج
            </span>
          </div>
        </div>
      </div>

      {/* 2. Specialty Tables */}
      <div className="overflow-x-auto">
        {/* Tab 1: Soroban */}
        {activeTab === 'soroban' && (
          <table className="w-full text-start text-xs border-collapse">
            <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold select-none">
              <tr>
                <th className="p-2.5 text-center border-e border-slate-200 w-12">#</th>
                <th className="p-2.5 text-start border-e border-slate-200 min-w-[160px]">المدرب المشرف</th>
                <th className="p-2.5 text-start border-e border-slate-200 min-w-[200px]">الفوج والمستوى</th>
                <th className="p-2.5 text-center border-e border-slate-200 min-w-[140px]">عدد الأطفال المسجلين</th>
                <th className="p-2.5 text-center border-e border-slate-200 min-w-[150px]">المعامل المالي للمستوى</th>
                <th className="p-2.5 text-end border-e border-slate-200 min-w-[150px] bg-slate-50 text-emerald-800">
                  الأجر المحسوب تلقائياً
                </th>
                <th className="p-2.5 text-start min-w-[220px]">صيغة المعادلة الحسابية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {trainersData.soroban.map((t, idx) => (
                <tr key={t.id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="p-2.5 text-center border-e border-slate-200 font-mono text-slate-400 font-bold">
                    {idx + 1}
                  </td>
                  <td className="p-2.5 border-e border-slate-200 font-bold text-slate-900">
                    {t.name}
                  </td>
                  <td className="p-2.5 border-e border-slate-200 font-semibold text-blue-950">
                    {t.cohort}
                  </td>
                  <td className="p-2.5 text-center border-e border-slate-200 font-mono font-bold text-slate-900">
                    {t.studentCount} طفل
                  </td>
                  <td className="p-2.5 text-center border-e border-slate-200 font-mono text-slate-700">
                    {t.coefficient.toLocaleString()} دج
                  </td>
                  <td className="p-2.5 text-end border-e border-slate-200 font-mono font-bold text-emerald-800 text-sm bg-slate-50/50">
                    {t.calculatedWage.toLocaleString()} دج
                  </td>
                  <td className="p-2.5 text-slate-600 font-mono text-[11px]">
                    {t.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Tab 2: Quran */}
        {activeTab === 'quran' && (
          <table className="w-full text-start text-xs border-collapse">
            <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold select-none">
              <tr>
                <th className="p-2.5 text-center border-e border-slate-200 w-12">#</th>
                <th className="p-2.5 text-start border-e border-slate-200 min-w-[160px]">المعلم والمشرف</th>
                <th className="p-2.5 text-start border-e border-slate-200 min-w-[240px]">
                  الفترات المؤداة (جمعة ص/م، سبت ص/م)
                </th>
                <th className="p-2.5 text-center border-e border-slate-200 min-w-[140px]">عدد الحصص الشهرية</th>
                <th className="p-2.5 text-end border-e border-slate-200 min-w-[140px]">سعر الحصة التعاقدي</th>
                <th className="p-2.5 text-end border-e border-slate-200 min-w-[150px] bg-slate-50 text-emerald-800">
                  الأجر المستحق شهرياً
                </th>
                <th className="p-2.5 text-start min-w-[200px]">الملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {trainersData.quran.map((t, idx) => (
                <tr key={t.id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="p-2.5 text-center border-e border-slate-200 font-mono text-slate-400 font-bold">
                    {idx + 1}
                  </td>
                  <td className="p-2.5 border-e border-slate-200 font-bold text-slate-900">
                    {t.name}
                  </td>
                  <td className="p-2.5 border-e border-slate-200 font-semibold text-blue-950">
                    {t.sessionSlot}
                  </td>
                  <td className="p-2.5 text-center border-e border-slate-200 font-mono font-bold text-slate-900">
                    {t.sessionsCount} حصص
                  </td>
                  <td className="p-2.5 text-end border-e border-slate-200 font-mono text-slate-700">
                    {t.sessionRate.toLocaleString()} دج
                  </td>
                  <td className="p-2.5 text-end border-e border-slate-200 font-mono font-bold text-emerald-800 text-sm bg-slate-50/50">
                    {t.calculatedWage.toLocaleString()} دج
                  </td>
                  <td className="p-2.5 text-slate-600 font-mono text-[11px]">
                    {t.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Tab 3: Languages & Tutoring */}
        {activeTab === 'languages' && (
          <table className="w-full text-start text-xs border-collapse">
            <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold select-none">
              <tr>
                <th className="p-2.5 text-center border-e border-slate-200 w-12">#</th>
                <th className="p-2.5 text-start border-e border-slate-200 min-w-[160px]">الأستاذ / المدرب</th>
                <th className="p-2.5 text-start border-e border-slate-200 min-w-[220px]">المادة والتخصص</th>
                <th className="p-2.5 text-center border-e border-slate-200 min-w-[140px]">عدد الحصص / الساعات المنجزة</th>
                <th className="p-2.5 text-end border-e border-slate-200 min-w-[140px]">قيمة الساعة التعاقدية</th>
                <th className="p-2.5 text-end border-e border-slate-200 min-w-[150px] bg-slate-50 text-emerald-800">
                  إجمالي الأجر المستحق
                </th>
                <th className="p-2.5 text-start min-w-[200px]">الملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {trainersData.languages.map((t, idx) => (
                <tr key={t.id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="p-2.5 text-center border-e border-slate-200 font-mono text-slate-400 font-bold">
                    {idx + 1}
                  </td>
                  <td className="p-2.5 border-e border-slate-200 font-bold text-slate-900">
                    {t.name}
                  </td>
                  <td className="p-2.5 border-e border-slate-200 font-semibold text-blue-950">
                    {t.subject}
                  </td>
                  <td className="p-2.5 text-center border-e border-slate-200 font-mono font-bold text-slate-900">
                    {t.sessionsCount} ساعة
                  </td>
                  <td className="p-2.5 text-end border-e border-slate-200 font-mono text-slate-700">
                    {t.hourlyRate.toLocaleString()} دج
                  </td>
                  <td className="p-2.5 text-end border-e border-slate-200 font-mono font-bold text-emerald-800 text-sm bg-slate-50/50">
                    {t.calculatedWage.toLocaleString()} دج
                  </td>
                  <td className="p-2.5 text-slate-600 font-mono text-[11px]">
                    {t.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </StandardViewLayout>
  );
}
