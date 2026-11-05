import React, { useState } from 'react';
import {
  Baby,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  UtensilsCrossed,
  FileText,
  Search,
  Filter,
  Printer,
  Eye,
  ShieldCheck,
  Check,
  X,
  Layers,
  Heart,
  BookOpen,
} from 'lucide-react';
import { KindergartenMonthlyReportCardModal } from '../common/KindergartenMonthlyReportCardModal';

export function KindergartenConsoleView({ selectedBranch = 'RAWDA' }) {
  const [activeTab, setActiveTab] = useState('monthly-reports'); // 'monthly-reports' | 'daily-logs' | 'incidents' | 'menu'
  const [selectedReportForPrint, setSelectedReportForPrint] = useState(null);

  // Mock Monthly Reports list
  const [monthlyReports, setMonthlyReports] = useState([
    {
      id: 1,
      reportNumber: 'REP-RW-2026-11-001',
      childName: 'يوسف بن سالم',
      childCode: 'KID-001',
      cohortName: 'فوج البراعم (3 سنوات)',
      branchNameAr: 'روضة الأطفال العباقرة النموذجية - جيجل',
      monthLabel: 'نوفمبر 2026',
      nannyName: 'أسمـاء بوشامة',
      attendanceRate: '22 يوم من 22 (100%)',
      bookCode: 'BOOK-RW-N04-2026',
      isApproved: true,
      approverName: 'إدارة الروضة المركزية',
      approvalDate: '2026-11-05',
      orthophonistNotes: 'تطور ملحوظ في بناء الجمل اللغوية ونطق مخارج الحروف الشفوية (ب، م، و). التفاعل مع التوجيهات السمعية سريع ودقيق.',
      generalNotes: 'الطفل يتمتع بصحة ممتازة ونشاط ذهني متقد. نوصي بمواصلة تشجيعه على ممارسة مهارات التعبير الحر في المنزل.',
      evaluationMatrix: [
        { id: '1', itemAr: 'وجبة الإفطار الصباحي', rating: 'A', note: 'شهية منتظمة ويتناول الوجبة باستقلالية' },
        { id: '2', itemAr: 'وجبة الغداء والتغذية المتوازنة', rating: 'A', note: 'يتناول الخضار واللحوم بانتظام' },
        { id: '3', itemAr: 'اللمجة الخفيفة والماء', rating: 'B', note: 'يفضل العصائر الطبيعية مع كعك الروضة' },
        { id: '4', itemAr: 'النوم والقيلولة الهادئة', rating: 'A', note: 'نوم هادئ لمدة ساعة ونصف دون استيقاظ مفاجئ' },
        { id: '5', itemAr: 'الأنشطة البيداغوجية والتعلم الحسي', rating: 'A', note: 'متميز في التلوين والتعرف على الحروف والأشكال' },
        { id: '6', itemAr: 'التفاعل الاجتماعي واللعب مع الأقران', rating: 'A', note: 'متعاون جداً ويشارك ألعابه بروح إيجابية' },
        { id: '7', itemAr: 'البكاء والتكيف الوجداني', rating: 'A', note: 'لا يبكي عند الوصول، اندماج عاطفي ممتاز' },
        { id: '8', itemAr: 'تبديل الملابس والنظافة الشخصية', rating: 'B', note: 'تعاون جيد أثناء غسل اليدين وتبديل الحفاض' },
      ],
    },
    {
      id: 2,
      reportNumber: 'REP-RW-2026-11-002',
      childName: 'أميرة بوجمعة',
      childCode: 'KID-002',
      cohortName: 'فوج النجوم (4 سنوات)',
      branchNameAr: 'روضة الأطفال العباقرة النموذجية - جيجل',
      monthLabel: 'نوفمبر 2026',
      nannyName: 'فاطمة الزهراء',
      attendanceRate: '21 يوم من 22 (95%)',
      bookCode: 'BOOK-RW-N05-2026',
      isApproved: true,
      approverName: 'إدارة الروضة المركزية',
      approvalDate: '2026-11-05',
      orthophonistNotes: 'نطق سليم لجميع الحروف ومستوى استرسال لغوي ممتاز بالنسبة لسنها.',
      generalNotes: 'تشارك بفعالية في مسرح العرائس وحفظ الأناشيد الصباحية.',
      evaluationMatrix: [
        { id: '1', itemAr: 'وجبة الإفطار الصباحي', rating: 'A', note: 'تناول كامل وجبة الإفطار' },
        { id: '2', itemAr: 'وجبة الغداء والتغذية المتوازنة', rating: 'A', note: 'تفضل الشوربة والحساء' },
        { id: '3', itemAr: 'اللمجة الخفيفة والماء', rating: 'A', note: 'منتظمة' },
        { id: '4', itemAr: 'النوم والقيلولة الهادئة', rating: 'A', note: 'تستغرق في النوم بسرعة' },
        { id: '5', itemAr: 'الأنشطة البيداغوجية والتعلم الحسي', rating: 'A', note: 'شغف بالرسم والأشغال اليدوية' },
        { id: '6', itemAr: 'التفاعل الاجتماعي واللعب مع الأقران', rating: 'A', note: 'روح قيادية لطيفة' },
        { id: '7', itemAr: 'البكاء والتكيف الوجداني', rating: 'A', note: 'هدوء تام' },
        { id: '8', itemAr: 'تبديل الملابس والنظافة الشخصية', rating: 'A', note: 'نظافة شخصية ممتازة' },
      ],
    },
    {
      id: 3,
      reportNumber: 'REP-RW-2026-11-003',
      childName: 'أنس حمداوي',
      childCode: 'KID-003',
      cohortName: 'فوج العصافير (حضانة صغار)',
      branchNameAr: 'روضة الأطفال العباقرة النموذجية - جيجل',
      monthLabel: 'نوفمبر 2026',
      nannyName: 'كريمة لعماري',
      attendanceRate: '20 يوم من 22 (90%)',
      bookCode: 'BOOK-RW-N01-2026',
      isApproved: false,
      approverName: '-',
      approvalDate: '-',
      orthophonistNotes: 'استجابة جيدة للمؤثرات الصوتية والمناغاة الإيجابية.',
      generalNotes: 'يحتاج تشجيعاً إضافياً في تنظيم أوقات القيلولة الصباحية.',
    },
  ]);

  // Mock Incident Log (Module 6 Requirement)
  const [incidents] = useState([
    {
      id: 1,
      date: '2026-11-04 11:15',
      childName: 'ياسر كواشي',
      cohort: 'فوج البراعم',
      category: 'EATING',
      severity: 'LOW',
      description: 'رفض تناول حساء الخضار الصباحي، تم استبداله بعصير فواكه طازج بعد استشارة ولي الأمر.',
      resolvedBy: 'المربية أسماء',
      guardianNotified: true,
    },
    {
      id: 2,
      date: '2026-11-03 14:30',
      childName: 'إلياس بوزيد',
      cohort: 'فوج النجوم',
      category: 'BEHAVIOR',
      severity: 'LOW',
      description: 'مشادة خفيفة مع زميل حول لعبة المكعبات، تم حل النزاع بيداغوجياً وتوجيههما للتعاون.',
      resolvedBy: 'المربية فاطمة',
      guardianNotified: false,
    },
  ]);

  // Weekly Menu (Module 6 Requirement)
  const [weeklyMenu] = useState([
    { day: 'الأحد', breakfast: 'حليب دافئ + بسكويت صحي بالعسل', lunch: 'حساء عدس أحمر + صدر دجاج مطهو + سلطة جزر', snack: 'تفاح طازج + خبز بالجبن' },
    { day: 'الاثنين', breakfast: 'عصيدة شوفان بالتمر والحليب', lunch: 'كسكسي بالخضار الموسمية ولحم عجل مفروم', snack: 'زبادي طبيعي + بسكويت' },
    { day: 'الثلاثاء', breakfast: 'حليب + خبز وزيت زيتون وعسل', lunch: 'طاجين خضار مشكلة + بيض مسلوق + أرز بني', snack: 'موز + كعك الروضة المنزلي' },
    { day: 'الأربعاء', breakfast: 'حليب دافئ بالكاكاو الخام + توست', lunch: 'شوربة خضار + سمك طازج مشوي + هريس البطاطس', snack: 'عصير برتقال طبيعي + كعك' },
    { day: 'الخميس', breakfast: 'حليب + مربى تين طبيعي وخبز كامل', lunch: 'مكرونة بصلصة الطماطم الطازجة ولحم مفروم', snack: 'سلطة فواكه طازجة' },
  ]);

  const handleApproveReport = (reportId) => {
    setMonthlyReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              isApproved: true,
              approverName: 'محمد بوري (المدير الإداري)',
              approvalDate: new Date().toISOString().split('T')[0],
            }
          : r
      )
    );
  };

  return (
    <div className="space-y-3 font-arabic text-xs">
      {/* Top Banner */}
      <div className="bg-white border border-slate-300 p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-pink-700 text-white">
            <Baby className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 font-display">
              محطة عمل الروضة والتعليم المبكر (Kindergarten & Daycare Console)
            </h2>
            <p className="text-[11px] text-slate-500">
              تقارير المتابعة الشهرية المعتمدة، التقييم اليومي (A/B/C)، سجل الحوادث، وجدول الإطعام
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-pink-50 border border-pink-200 text-pink-900 font-bold text-xs">
            115 طفلاً مسجلاً بالروضة
          </span>
          <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-xs">
            10 قاعات بيداغوجية نشطة
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-300 bg-white px-2">
        <button
          onClick={() => setActiveTab('monthly-reports')}
          className={`px-3 py-2 font-bold text-xs border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'monthly-reports'
              ? 'border-pink-700 text-pink-950 bg-pink-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>بطاقات التقارير الشهرية واعتماد الإدارة ({monthlyReports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('incidents')}
          className={`px-3 py-2 font-bold text-xs border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'incidents'
              ? 'border-pink-700 text-pink-950 bg-pink-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>سجل الحوادث والملاحظات السلوكية ({incidents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          className={`px-3 py-2 font-bold text-xs border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'menu'
              ? 'border-pink-700 text-pink-950 bg-pink-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <UtensilsCrossed className="w-3.5 h-3.5" />
          <span>جدول الإطعام الأسبوعي والمطعم المدرسي</span>
        </button>
      </div>

      {/* Tab 1: Monthly Report Cards */}
      {activeTab === 'monthly-reports' && (
        <div className="bg-white border border-slate-300 p-3 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-slate-900">
              قائمة بطاقات المتابعة الشهرية الجاهزة للاعتماد والطباعة (شهر نوفمبر 2026):
            </span>
            <span className="text-[11px] text-slate-500">
              * يشترط التقرير موافقة الإدارة قبل ظهور التقرير في حساب ولي الأمر
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border border-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <th className="p-2.5 text-start">رقم التقرير</th>
                  <th className="p-2.5 text-start">اسم الطفل</th>
                  <th className="p-2.5 text-start">الفوج والسن</th>
                  <th className="p-2.5 text-start">المربية</th>
                  <th className="p-2.5 text-center">نسبة الحضور</th>
                  <th className="p-2.5 text-center">حالة الاعتماد الإداري</th>
                  <th className="p-2.5 text-center">معاينة وطباعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {monthlyReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold text-blue-900">{report.reportNumber}</td>
                    <td className="p-2.5 font-bold text-slate-900">{report.childName}</td>
                    <td className="p-2.5 text-slate-700">{report.cohortName}</td>
                    <td className="p-2.5 text-slate-600">{report.nannyName}</td>
                    <td className="p-2.5 text-center font-mono text-emerald-800 font-bold">
                      {report.attendanceRate}
                    </td>
                    <td className="p-2.5 text-center">
                      {report.isApproved ? (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[10px] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>معتمد للعرض</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleApproveReport(report.id)}
                          className="px-2 py-0.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-[10px] shadow-2xs"
                        >
                          اعتماد التقرير الآن
                        </button>
                      )}
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        onClick={() => setSelectedReportForPrint(report)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-pink-50 hover:text-pink-900 hover:border-pink-300 border border-slate-300 text-slate-700 font-semibold text-[11px] inline-flex items-center gap-1 transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>طباعة البطاقة</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Incidents Log */}
      {activeTab === 'incidents' && (
        <div className="bg-white border border-slate-300 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div>
              <h3 className="font-bold text-sm text-slate-900">سجل الوقائع والحوادث البيداغوجية اليومية</h3>
              <p className="text-[11px] text-slate-500">
                متابعة دقيقة لمشاكل السلوك، النوم، الأكل، والصعوبات الحركية والتعلمية
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border border-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <th className="p-2 text-start">التاريخ والوقت</th>
                  <th className="p-2 text-start">اسم الطفل والفوج</th>
                  <th className="p-2 text-center w-28">التصنيف</th>
                  <th className="p-2 text-start">تفاصيل الواقعة والإجراء المتخذ</th>
                  <th className="p-2 text-start">المسؤول المعالج</th>
                  <th className="p-2 text-center">إشعار الولي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50">
                    <td className="p-2 font-mono text-slate-600">{inc.date}</td>
                    <td className="p-2">
                      <strong className="text-slate-900 block">{inc.childName}</strong>
                      <span className="text-[10px] text-slate-500">{inc.cohort}</span>
                    </td>
                    <td className="p-2 text-center">
                      <span className="px-2 py-0.5 border border-amber-300 bg-amber-50 text-amber-900 font-bold text-[10px]">
                        {inc.category === 'EATING' ? 'تغذية وطعام' : 'سلوك وتكيف'}
                      </span>
                    </td>
                    <td className="p-2 text-slate-800">{inc.description}</td>
                    <td className="p-2 text-slate-600 font-semibold">{inc.resolvedBy}</td>
                    <td className="p-2 text-center">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold border ${
                          inc.guardianNotified
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {inc.guardianNotified ? 'تم الاتصال' : 'غير مطلوب'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Weekly Rotating Menu */}
      {activeTab === 'menu' && (
        <div className="bg-white border border-slate-300 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                البرنامج الغذائي الأسبوعي المعتمد للوجبات (المطعم المدرسي)
              </h3>
              <p className="text-[11px] text-slate-500">
                برنامج دوري يعرض في تطبيق الأولياء، خاضع للرقابة الصحية ومطابق لمعايير التغذية
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border border-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <th className="p-2.5 text-center w-24">اليوم</th>
                  <th className="p-2.5 text-start">وجبة الإفطار الصباحي (08:30)</th>
                  <th className="p-2.5 text-start">وجبة الغداء المتوازنة (11:45)</th>
                  <th className="p-2.5 text-start">اللمجة المسائية (15:30)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {weeklyMenu.map((item, idx) => (
                  <tr key={idx} className="hover:bg-pink-50/20">
                    <td className="p-2.5 text-center font-bold text-pink-950 bg-slate-50">{item.day}</td>
                    <td className="p-2.5 text-slate-800 font-medium">{item.breakfast}</td>
                    <td className="p-2.5 text-slate-800 font-semibold">{item.lunch}</td>
                    <td className="p-2.5 text-slate-800">{item.snack}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printable Report Card Modal */}
      <KindergartenMonthlyReportCardModal
        isOpen={Boolean(selectedReportForPrint)}
        onClose={() => setSelectedReportForPrint(null)}
        reportData={selectedReportForPrint}
      />
    </div>
  );
}
