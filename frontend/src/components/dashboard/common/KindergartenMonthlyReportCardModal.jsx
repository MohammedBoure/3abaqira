import React from 'react';
import { X, Printer, ShieldCheck, CheckCircle2, Award, Baby, Heart, Clock, UserCheck } from 'lucide-react';

export function KindergartenMonthlyReportCardModal({ isOpen, onClose, reportData }) {
  if (!isOpen || !reportData) return null;

  const handlePrint = () => {
    window.print();
  };

  const defaultMatrix = [
    { id: 'breakfast', itemAr: 'وجبة الإفطار الصباحي', rating: 'A', note: 'شهية منتظمة ويتناول الوجبة باستقلالية' },
    { id: 'lunch', itemAr: 'وجبة الغداء والتغذية المتوازنة', rating: 'A', note: 'يتناول الخضار واللحوم بانتظام' },
    { id: 'snack', itemAr: 'اللمجة الخفيفة والماء', rating: 'B', note: 'يفضل العصائر الطبيعية مع كعك الروضة' },
    { id: 'sleep', itemAr: 'النوم والقيلولة الهادئة', rating: 'A', note: 'نوم هادئ لمدة ساعة ونصف دون استيقاظ مفاجئ' },
    { id: 'study', itemAr: 'الأنشطة البيداغوجية والتعلم الحسي', rating: 'A', note: 'متميز في التلوين والتعرف على الحروف والأشكال' },
    { id: 'interaction', itemAr: 'التفاعل الاجتماعي واللعب مع الأقران', rating: 'A', note: 'متعاون جداً ويشارك ألعابه بروح إيجابية' },
    { id: 'crying', itemAr: 'البكاء والتكيف الوجداني', rating: 'A', note: 'لا يبكي عند الوصول، اندماج عاطفي ممتاز' },
    { id: 'clothes', itemAr: 'تبديل الملابس والنظافة الشخصية', rating: 'B', note: 'تعاون جيد أثناء غسل اليدين وتبديل الحفاض' },
  ];

  const evalItems = reportData.evaluationMatrix || defaultMatrix;
  const isApproved = reportData.isApproved !== false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white border-2 border-blue-900 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col print:shadow-none print:border-none my-auto">
        {/* Screen Header (Hidden on Print) */}
        <div className="p-3 bg-blue-950 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Baby className="w-5 h-5 text-pink-300" />
            <span className="font-bold text-sm tracking-wide">
              بطاقة المتابعة الشهرية للطفل بالروضة (Kindergarten Monthly Report Card)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة بطاقة التقرير (A4)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-300 hover:text-white hover:bg-blue-900 transition-colors rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Card Canvas */}
        <div className="reportcard-printable-canvas p-6 bg-white text-slate-900 text-xs font-arabic">
          {/* Institutional Header */}
          <div className="reportcard-header border-b-2 border-blue-950 pb-3 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/assets/branding/logo.webp"
                alt="3abaqira"
                className="w-14 h-14 rounded-full border border-blue-200 object-cover"
              />
              <div>
                <h1 className="font-bold text-base text-blue-950 font-display">
                  منظومة روضة وحضانة الأطفال العباقرة النموذجية
                </h1>
                <p className="text-[11px] text-slate-600 font-medium">
                  {reportData.branchNameAr || 'فرع الروضة الرئيسي - جيجل'} • ولاية جيجل، الجزائر
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  قسم التوجيه التربوي والتعليم المبكر • الجمهورية الجزائرية الديمقراطية الشعبية
                </p>
              </div>
            </div>

            <div className="text-end space-y-1">
              <div className="inline-block border border-blue-950 bg-blue-50 px-2.5 py-1 text-blue-950 font-bold font-mono text-xs">
                {reportData.reportNumber || 'REP-RW-2026-11'}
              </div>
              <p className="text-[11px] text-slate-600 font-bold">
                الشهر: {reportData.monthLabel || 'نوفمبر 2026'}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                الموسم: 2026 / 2027
              </p>
            </div>
          </div>

          {/* Title Banner */}
          <div className="text-center my-3 py-1.5 bg-blue-50/60 border-y border-blue-200">
            <h2 className="font-bold text-sm text-blue-950">
              بطاقة المتابعة والتطور السلوكي والبدني الشهري
            </h2>
            <p className="text-[10px] text-slate-500">
              وفق المعايير البيداغوجية المعتمدة لتقييم الطفولة المبكرة (A / B / C)
            </p>
          </div>

          {/* Child Information Meta Table */}
          <table className="reportcard-meta-table w-full mb-3 text-xs border border-slate-300">
            <tbody>
              <tr className="bg-slate-50">
                <td className="p-2 border border-slate-300 font-semibold text-slate-700 w-1/4">اسم ولقب الطفل:</td>
                <td className="p-2 border border-slate-300 font-bold text-blue-950 text-sm w-1/4">
                  {reportData.childName || 'يوسف بن سالم'}
                </td>
                <td className="p-2 border border-slate-300 font-semibold text-slate-700 w-1/4">الفوج التربوي والسن:</td>
                <td className="p-2 border border-slate-300 font-bold text-slate-900 w-1/4">
                  {reportData.cohortName || 'فوج البراعم (3 سنوات)'}
                </td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-300 font-semibold text-slate-700">المربية المسؤولة:</td>
                <td className="p-2 border border-slate-300 text-slate-900">
                  {reportData.nannyName || 'أسمـاء بوشامة'}
                </td>
                <td className="p-2 border border-slate-300 font-semibold text-slate-700">نسبة الحضور الشهري:</td>
                <td className="p-2 border border-slate-300 text-emerald-800 font-bold">
                  {reportData.attendanceRate || '22 يوم من 22 (100%)'}
                </td>
              </tr>
              <tr className="bg-slate-50">
                <td className="p-2 border border-slate-300 font-semibold text-slate-700">رقم الكراس التربوي:</td>
                <td className="p-2 border border-slate-300 font-mono text-slate-800">
                  {reportData.bookCode || 'BOOK-RW-N04-2026'}
                </td>
                <td className="p-2 border border-slate-300 font-semibold text-slate-700">تاريخ إصدار التقرير:</td>
                <td className="p-2 border border-slate-300 font-mono text-slate-800">
                  {reportData.issueDate || '2026-11-05'}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Evaluation Matrix (8 Core Items rated A/B/C) */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-xs text-blue-950 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-pink-600" />
                <span>سجل الملاحظات والتقييمات اليومية والشهرية (Daily & Monthly Indicators)</span>
              </h3>
              <div className="flex items-center gap-3 text-[10px] text-slate-600">
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold inline-flex items-center justify-center border border-emerald-400">A</span>
                  <span>ممتاز / منتظم</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 font-bold inline-flex items-center justify-center border border-amber-400">B</span>
                  <span>متوسط / مقبول</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-800 font-bold inline-flex items-center justify-center border border-rose-400">C</span>
                  <span>يحتاج رعاية خاصة</span>
                </span>
              </div>
            </div>

            <table className="eval-matrix-table w-full text-xs border border-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 border-b border-slate-300">
                  <th className="p-2 text-start w-8">#</th>
                  <th className="p-2 text-start w-48">مجال التقييم اليومي</th>
                  <th className="p-2 text-center w-16">الدرجة</th>
                  <th className="p-2 text-start">الملاحظات التوجيهية وتطور السلوك</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {evalItems.map((item, index) => {
                  const ratingBadgeClass =
                    item.rating === 'A'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                      : item.rating === 'B'
                      ? 'bg-amber-100 text-amber-900 border-amber-400'
                      : 'bg-rose-100 text-rose-900 border-rose-400';

                  return (
                    <tr key={item.id || index} className={index % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                      <td className="p-2 text-center font-mono text-slate-500">{index + 1}</td>
                      <td className="p-2 font-semibold text-slate-900">{item.itemAr}</td>
                      <td className="p-2 text-center">
                        <span className={`eval-badge font-bold font-mono px-2 py-0.5 border ${ratingBadgeClass}`}>
                          {item.rating}
                        </span>
                      </td>
                      <td className="p-2 text-slate-700">{item.note}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Orthophonist Section (Module 6 Requirement) */}
          <div className="p-2.5 bg-blue-50/40 border border-blue-200 mb-3 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-blue-950 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-blue-800" />
                <span>ملاحظات الأخصائي الأرطوفوني (Speech Therapist & Language Specialist):</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-white border border-blue-300 text-blue-800 font-semibold">
                مصرح للعرض لولي الأمر
              </span>
            </div>
            <p className="text-slate-800 leading-relaxed text-[11px]">
              {reportData.orthophonistNotes ||
                'تطور ملحوظ في بناء الجمل اللغوية ونطق مخارج الحروف الشفوية (ب، م، و). التفاعل مع التوجيهات السمعية سريع ودقيق، ولا توجد أي مؤشرات لتأخر لغوي أو صعوبات تواصلية.'}
            </p>
          </div>

          {/* Educator General Conclusion */}
          <div className="p-2.5 bg-slate-50 border border-slate-300 mb-4 text-xs">
            <span className="font-bold text-slate-900 block mb-1">
              خلاصة وتوجيهات المربية للشهر:
            </span>
            <p className="text-slate-700 leading-relaxed text-[11px]">
              {reportData.generalNotes ||
                'الطفل يتمتع بصحة ممتازة ونشاط ذهني متقد. نوصي بمواصلة تشجيعه على ممارسة مهارات التعبير الحر في المنزل وسرد القصص المصورة المسائية لتعزيز ثقته بنفسه.'}
            </p>
          </div>

          {/* Administrative Approval and Signatures Block */}
          <div className="pt-3 border-t-2 border-slate-300 grid grid-cols-3 gap-4 text-center">
            {/* Educator Signature */}
            <div>
              <span className="text-slate-600 text-[10px] block">توقيع المربية المسؤولة</span>
              <div className="h-14 mt-1 border-b border-slate-300 flex items-end justify-center pb-1">
                <span className="text-xs font-semibold text-slate-800">
                  {reportData.nannyName || 'أسمـاء بوشامة'}
                </span>
              </div>
            </div>

            {/* Administration Approval Stamp */}
            <div>
              <span className="text-slate-600 text-[10px] block">اعتماد الإدارة العامة</span>
              <div className="h-14 mt-1 border-b border-slate-300 flex items-center justify-center">
                {isApproved ? (
                  <div className="approval-seal border-2 border-emerald-700 bg-emerald-50 text-emerald-800 text-[8px] font-bold p-1 leading-tight flex flex-col items-center rotate-[-3deg]">
                    <span className="flex items-center gap-1 font-bold">
                      <UserCheck className="w-3 h-3" />
                      <span>معتمد إدارياً</span>
                    </span>
                    <span>مصرح لولي الأمر</span>
                    <span className="font-mono text-[7px]">نوفمبر 2026</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-1 border border-amber-300">
                    قيد المراجعة الإدارية
                  </span>
                )}
              </div>
            </div>

            {/* Parent Endorsement */}
            <div>
              <span className="text-slate-600 text-[10px] block">اطلع عليه ولي الأمر</span>
              <div className="h-14 mt-1 border-b border-slate-300 flex items-end justify-center pb-1">
                <span className="text-[10px] text-slate-400 font-serif italic">
                  التوقيع أو التأشير الإلكتروني
                </span>
              </div>
            </div>
          </div>

          {/* Legal / System Footnote */}
          <div className="mt-3 pt-2 border-t border-slate-200 text-center text-[9px] text-slate-400 flex items-center justify-between">
            <span>منظومة العباقرة للتعليم المبكر • وثيقة تقييم شهرية رسمية صادرة آلياً</span>
            <span className="font-mono">{reportData.reportNumber || 'REP-RW-2026-11'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
