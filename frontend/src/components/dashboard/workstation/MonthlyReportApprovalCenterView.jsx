import React, { useState } from 'react';
import {
  FileCheck,
  CheckCircle,
  Clock,
  Printer,
  ShieldCheck,
  AlertCircle,
  Search,
  Eye,
  Award,
  Calendar,
  Building,
  UserCheck,
  Baby,
} from 'lucide-react';
import {
  MOCK_MONTHLY_REPORTS,
  MOCK_KG_STUDENTS,
  MOCK_KG_AGE_BANDS,
} from '../../../mock/geniusKindergartenFinanceMockData';

export function MonthlyReportApprovalCenterView() {
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, PENDING_APPROVAL, APPROVED, PRINT_VIEW
  const [reports, setReports] = useState(MOCK_MONTHLY_REPORTS);
  const [selectedReportForPrint, setSelectedReportForPrint] = useState(MOCK_MONTHLY_REPORTS[0]);
  const [adminSignOffNote, setAdminSignOffNote] = useState('معتمد رسمياً للنشر في منصة الأولياء والطباعة.');
  const [currentAdminUser] = useState('محمد بوري (المدير العام)');
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Segregation of duties rule check
  const handleApproveReport = (reportId) => {
    const report = reports.find((r) => r.id === reportId);
    if (!report) return;

    // Rule: "The person who reviews a test result must differ from the one who corrected it; the same rule applies to kindergarten monthly reports."
    if (report.preparedBy === currentAdminUser) {
      alert('خطأ في الصلاحيات الرقابية: لا يمكن لنفس المربي الذي حرر التقرير الشهري أن يعتمده كمسؤول إدارة (Segregation of Duties).');
      return;
    }

    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: 'APPROVED',
              reviewedBy: currentAdminUser,
              reviewedAt: new Date().toISOString().split('T')[0],
              adminSignOffRemarks: adminSignOffNote,
            }
          : r
      )
    );
    triggerToast(`تم اعتماد التقرير الشهري بنجاح للطالب: ${report.studentName} وإتاحته لولي الأمر.`);
  };

  const filteredReports = reports.filter((r) => {
    if (activeTab === 'PENDING_APPROVAL') return r.status === 'SUBMITTED' || r.status === 'DRAFT';
    if (activeTab === 'APPROVED') return r.status === 'APPROVED';
    return true;
  });

  const pendingCount = reports.filter((r) => r.status === 'SUBMITTED').length;
  const approvedCount = reports.filter((r) => r.status === 'APPROVED').length;
  const draftCount = reports.filter((r) => r.status === 'DRAFT').length;

  return (
    <div className="space-y-3 font-arabic text-slate-800">
      {/* 1. Header & Live Telemetry */}
      <div className="bg-white border border-slate-200 p-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2.5 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 leading-none">
                  مركز اعتماد وطباعة التقارير الشهرية (Monthly Report Approval Center)
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-50 text-blue-900 border border-blue-200 font-bold">
                  فصل الصلاحيات الرقابي (Segregation of Duties)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                معاينة مسودات التقارير، توقيع الإدارة والاعتماد الرسمي، وتصدير البطاقة الشهرية الرسمية للتسليم للولي.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('PRINT_VIEW');
              }}
              className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 flex items-center gap-1 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-blue-800" />
              <span>معاينة نموذج الطباعة الرسمي</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2 bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 block">إجمالي التقارير الشهرية</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-slate-900">{reports.length}</span>
              <span className="text-[10px] text-slate-500 font-mono">شهر أكتوبر 2026</span>
            </div>
          </div>
          <div className="p-2 bg-amber-50/50 border border-amber-200">
            <span className="text-[10px] font-bold text-amber-800 block">بانتظار اعتماد الإدارة</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-amber-900">{pendingCount}</span>
              <span className="text-[10px] text-amber-700 font-bold">يتطلب توقيع المدير</span>
            </div>
          </div>
          <div className="p-2 bg-emerald-50/50 border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-800 block">تقارير معتمدة ومنشورة</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-emerald-900">{approvedCount}</span>
              <span className="text-[10px] text-emerald-700 font-bold">متاحة للأولياء</span>
            </div>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 block">مسودات قيد الإعداد</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-slate-700">{draftCount}</span>
              <span className="text-[10px] text-slate-500">لدى المربيات</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sub-tab Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-3 py-1.5 text-xs font-bold transition-colors ${
            activeTab === 'ALL'
              ? 'bg-blue-900 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          كافة التقارير ({reports.length})
        </button>
        <button
          onClick={() => setActiveTab('PENDING_APPROVAL')}
          className={`px-3 py-1.5 text-xs font-bold transition-colors ${
            activeTab === 'PENDING_APPROVAL'
              ? 'bg-amber-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          بانتظار الاعتماد ({pendingCount})
        </button>
        <button
          onClick={() => setActiveTab('APPROVED')}
          className={`px-3 py-1.5 text-xs font-bold transition-colors ${
            activeTab === 'APPROVED'
              ? 'bg-emerald-700 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          المعتمدة رسمياً ({approvedCount})
        </button>
        <button
          onClick={() => setActiveTab('PRINT_VIEW')}
          className={`px-3 py-1.5 text-xs font-bold transition-colors ${
            activeTab === 'PRINT_VIEW'
              ? 'bg-slate-800 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          معاينة وطباعة بطاقة التقرير
        </button>
      </div>

      {/* 3. Conditional Content */}
      {activeTab !== 'PRINT_VIEW' ? (
        <div className="bg-white border border-slate-200 overflow-hidden shadow-2xs">
          <table className="w-full text-start border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold select-none">
                <th className="py-2 px-2 text-center border-e border-slate-200 w-10">#</th>
                <th className="py-2 px-2.5 text-start border-e border-slate-200">الطفل والفوج</th>
                <th className="py-2 px-2 text-center border-e border-slate-200">الشهر</th>
                <th className="py-2 px-2 text-center border-e border-slate-200">الحضور/الغياب</th>
                <th className="py-2 px-2 text-center border-e border-slate-200">معدل التقييمات</th>
                <th className="py-2 px-2.5 text-start border-e border-slate-200">ملاحظة المربية</th>
                <th className="py-2 px-2 text-center border-e border-slate-200">معد التقرير</th>
                <th className="py-2 px-2 text-center border-e border-slate-200">حالة الاعتماد</th>
                <th className="py-2 px-2 text-center">إجراء الإدارة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredReports.map((rpt, idx) => {
                const isApproved = rpt.status === 'APPROVED';
                return (
                  <tr key={rpt.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-2 text-center font-mono text-slate-500 border-e border-slate-200">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-2.5 border-e border-slate-200 font-semibold text-slate-900">
                      <div className="flex flex-col">
                        <span>{rpt.studentName}</span>
                        <span className="text-[10px] text-slate-500 font-normal">{rpt.bandName}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center font-bold text-slate-700 border-e border-slate-200">
                      {rpt.month}
                    </td>
                    <td className="py-2 px-2 text-center font-mono border-e border-slate-200">
                      <span className="text-emerald-700 font-bold">{rpt.stats.attendanceDays} يوم</span> /{' '}
                      <span className="text-rose-700">{rpt.stats.absenceDays} غ</span>
                    </td>
                    <td className="py-2 px-2 text-center border-e border-slate-200">
                      <div className="flex items-center justify-center gap-1 font-mono text-[11px] font-bold">
                        <span className="text-emerald-700" title="وجبات">وجبة: {rpt.stats.mealsAvg}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-blue-700" title="دراسة">تعلم: {rpt.stats.studyAvg}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2.5 border-e border-slate-200 text-slate-600 max-w-[220px] truncate">
                      {rpt.teacherComments}
                    </td>
                    <td className="py-2 px-2 text-center border-e border-slate-200 text-[11px] text-slate-600">
                      {rpt.preparedBy}
                    </td>
                    <td className="py-2 px-2 text-center border-e border-slate-200">
                      {isApproved ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          معتمد رسمياً
                        </span>
                      ) : rpt.status === 'SUBMITTED' ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          بانتظار التوقيع
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600">
                          مسودة
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {!isApproved ? (
                          <button
                            onClick={() => handleApproveReport(rpt.id)}
                            className="px-2 py-0.5 text-[10px] font-bold bg-emerald-700 hover:bg-emerald-800 text-white border border-emerald-800 shadow-2xs"
                          >
                            توقيع واعتماد
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedReportForPrint(rpt);
                              setActiveTab('PRINT_VIEW');
                            }}
                            className="px-2 py-0.5 text-[10px] font-semibold text-blue-900 hover:bg-blue-50 border border-blue-200 flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            معاينة
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Printable Report Card View */
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-slate-100 p-2.5 border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">اختر التلميذ لمعاينة بطاقته:</span>
              <select
                value={selectedReportForPrint.id}
                onChange={(e) => {
                  const found = reports.find((r) => r.id === e.target.value);
                  if (found) setSelectedReportForPrint(found);
                }}
                className="text-xs p-1 border border-slate-300 bg-white font-arabic font-semibold"
              >
                {reports.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.studentName} ({r.bandName} - {r.month})
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3 py-1 text-xs font-bold bg-blue-900 hover:bg-blue-950 text-white flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة هذه البطاقة (A4)</span>
            </button>
          </div>

          {/* Official Printable Report Card Document Sheet */}
          <div className="bg-white border-2 border-slate-800 p-6 max-w-3xl mx-auto shadow-md font-arabic text-slate-900 print:border-none print:shadow-none">
            {/* Header */}
            <div className="border-b-2 border-slate-800 pb-3 mb-4 flex items-center justify-between">
              <div>
                <h1 className="text-base font-bold tracking-tight text-blue-950">
                  الجمهورية الجزائرية الديمقراطية الشعبية
                </h1>
                <h2 className="text-sm font-bold text-slate-800">
                  مؤسسة العباقرة للتربية والتعليم المبكر — فرع جيجل المركزي
                </h2>
                <p className="text-[10px] text-slate-500 font-mono">
                  رخصة وزارة التضامن والتربية الوطنية رقم: 2024/0912
                </p>
              </div>
              <div className="text-end">
                <span className="text-xs font-mono font-bold block text-slate-800">
                  بطاقة المتابعة الشهرية الرسمية
                </span>
                <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 border border-blue-200 inline-block mt-1">
                  دورة: {selectedReportForPrint.month}
                </span>
              </div>
            </div>

            {/* Student Info Box */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-slate-50 border border-slate-300 text-xs mb-4">
              <div>
                <span className="text-[10px] text-slate-500 block">اسم ولقب الطفل:</span>
                <span className="font-bold text-slate-900">{selectedReportForPrint.studentName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">الفئة والفوج:</span>
                <span className="font-semibold text-slate-800">{selectedReportForPrint.bandName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">أيام الحضور الفعلي:</span>
                <span className="font-mono font-bold text-emerald-800">
                  {selectedReportForPrint.stats.attendanceDays} يوم
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">الغيابات المسجلة:</span>
                <span className="font-mono font-bold text-rose-800">
                  {selectedReportForPrint.stats.absenceDays} يوم
                </span>
              </div>
            </div>

            {/* Monthly Evaluation Matrix */}
            <table className="w-full text-start border-collapse border border-slate-800 text-xs mb-4">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-800 font-bold">
                  <th className="p-2 border-e border-slate-800 text-start">مجال المتابعة والنمو</th>
                  <th className="p-2 border-e border-slate-800 text-center w-28">التقييم الشهري</th>
                  <th className="p-2 text-start">الملاحظة التفصيلية للمربية</th>
                </tr>
              </thead>
              <tbody className="divide-y border-slate-800">
                <tr>
                  <td className="p-2 border-e border-slate-800 font-semibold">التغذية والشهية الغذائية</td>
                  <td className="p-2 border-e border-slate-800 text-center font-bold text-emerald-800">
                    {selectedReportForPrint.stats.mealsAvg} (ممتاز)
                  </td>
                  <td className="p-2 text-slate-700">إقبال ممتاز على الوجبات الصحية وتناول كامل للوجبة الرئيسية.</td>
                </tr>
                <tr>
                  <td className="p-2 border-e border-slate-800 font-semibold">النوم والقيلولة الهادئة</td>
                  <td className="p-2 border-e border-slate-800 text-center font-bold text-emerald-800">
                    {selectedReportForPrint.stats.sleepAvg}
                  </td>
                  <td className="p-2 text-slate-700">قيلولة منتظمة ومريحة بمعدل ساعة ونصف يومياً.</td>
                </tr>
                <tr>
                  <td className="p-2 border-e border-slate-800 font-semibold">الأنشطة المعرفية والتعلمية</td>
                  <td className="p-2 border-e border-slate-800 text-center font-bold text-blue-800">
                    {selectedReportForPrint.stats.studyAvg}
                  </td>
                  <td className="p-2 text-slate-700">تركيز عالي وتجاوب ذكي مع ألعاب الذكاء والأشكال الحسابية.</td>
                </tr>
                <tr>
                  <td className="p-2 border-e border-slate-800 font-semibold">التفاعل الاجتماعي والسلوك</td>
                  <td className="p-2 border-e border-slate-800 text-center font-bold text-emerald-800">
                    {selectedReportForPrint.stats.interactionAvg}
                  </td>
                  <td className="p-2 text-slate-700">روح تعاون ومشاركة رائعة للألعاب مع زملائه في الفوج.</td>
                </tr>
              </tbody>
            </table>

            {/* Overall Teacher Recommendation */}
            <div className="border border-slate-300 p-3 bg-slate-50/50 mb-4 text-xs">
              <span className="font-bold text-slate-900 block mb-1">
                توصيات وملاحظات المربية المباشرة:
              </span>
              <p className="text-slate-700 leading-relaxed">{selectedReportForPrint.teacherComments}</p>
            </div>

            {/* Sign-off & Audit Stamp */}
            <div className="grid grid-cols-2 gap-4 border-t-2 border-slate-800 pt-3 text-xs">
              <div>
                <span className="font-bold block text-slate-800">توقيع المربية المحررة للتقرير:</span>
                <span className="text-[11px] text-slate-600 block mt-1">
                  {selectedReportForPrint.preparedBy}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  تاريخ التحضير: {selectedReportForPrint.preparedAt}
                </span>
              </div>
              <div className="text-end">
                <span className="font-bold block text-slate-800">تأشيرة وختم المدير العام للمؤسسة:</span>
                <span className="text-[11px] text-emerald-800 font-bold block mt-1">
                  {selectedReportForPrint.reviewedBy || 'بانتظار الاعتماد'}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  تاريخ التأشيرة: {selectedReportForPrint.reviewedAt || '--'}
                </span>
                <div className="mt-2 inline-block border-2 border-emerald-700 text-emerald-800 px-3 py-1 font-bold text-[10px] rotate-[-2deg]">
                  معتمد رسمياً — 3ABAQIRA ERP
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-12 end-4 z-50 bg-blue-950 text-white px-3.5 py-2 text-xs shadow-xl border border-blue-800 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
