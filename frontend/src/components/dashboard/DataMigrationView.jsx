import React, { useState } from 'react';
import {
  FileSpreadsheet,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  Database,
  Building2,
  Coins,
  History,
  ShieldCheck,
  Eye,
  Sliders,
} from 'lucide-react';

export function DataMigrationView({ selectedBranch = 'ALL' }) {
  const [activeStage, setActiveStage] = useState(4); // 1: Collect, 2: Stage, 3: Clean, 4: Review, 5: Convert, 6: Reconcile
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'AMBIGUOUS' | 'MATCHED' | 'RESOLVED'

  // Staging Rows Mock Data (Module 9 Requirement: mig_import_row structure)
  const [stagedRows, setStagedRows] = useState([
    {
      id: 101,
      batchFile: 'center_2025_soroban.xlsx',
      sheetName: 'سوروبان الفوج الأول',
      sourceRow: 14,
      rawName: 'بن علي ريان',
      cleanedGiven: 'ريان',
      cleanedFamily: 'بن علي',
      matchedPersonId: 'PER-00101',
      rawWorkshop: 'Soroban L1',
      mappedLevel: 'المستوى الأول (تأسيس)',
      excelInstallmentPaid: 8500,
      excelReceiptNo: 'REC-24-089',
      status: 'MATCHED',
      ambiguityReason: 'تم المطابقة الكاملة برقم الهاتف والاسم الثلاثي',
    },
    {
      id: 102,
      batchFile: 'rawda_2024_nursery.xlsx',
      sheetName: 'أفواج البراعم',
      sourceRow: 27,
      rawName: 'بوشامة يوسف بن س.',
      cleanedGiven: 'يوسف',
      cleanedFamily: 'بوشامة',
      matchedPersonId: null,
      rawWorkshop: 'فوج البراعم',
      mappedLevel: 'روضة - تمهيدي أول',
      excelInstallmentPaid: 7000,
      excelReceiptNo: 'REC-RW-112',
      status: 'AMBIGUOUS',
      ambiguityReason: 'اسم العائلة مختصر في الإكسل، يوجد شخصان متطابقان بنفس الهاتف',
    },
    {
      id: 103,
      batchFile: 'center_2024_languages.xlsx',
      sheetName: 'اللغات الفرنسية والألمانية',
      sourceRow: 32,
      rawName: 'رحماني مروة',
      cleanedGiven: 'مروة',
      cleanedFamily: 'رحماني',
      matchedPersonId: 'PER-00103',
      rawWorkshop: 'لغات - سنة أولى',
      mappedLevel: 'مستوى تأسيسي أ1',
      excelInstallmentPaid: 6000,
      excelReceiptNo: 'REC-24-301',
      status: 'PRICE_OVERRIDE_NEEDED',
      ambiguityReason: 'المبلغ المسجل بالإكسل (6,000 دج) يختلف عن تسعيرة الدليل (7,500 دج) - خصم أخوة محتمل',
    },
    {
      id: 104,
      batchFile: 'center_2023_support.xlsx',
      sheetName: 'دروس الدعم للطور الثانوي',
      sourceRow: 45,
      rawName: 'عمراوي صهيب',
      cleanedGiven: 'صهيب',
      cleanedFamily: 'عمراوي',
      matchedPersonId: 'PER-00104',
      rawWorkshop: 'رياضيات 3 ثانوي',
      mappedLevel: 'دعم نهائي علمي',
      excelInstallmentPaid: 4500,
      excelReceiptNo: 'REC-23-441',
      status: 'MATCHED',
      ambiguityReason: 'مطابقة مؤكدة',
    },
  ]);

  // Reconciliation summaries between Excel and ERP
  const reconciliationData = [
    {
      branch: 'أكاديمية العباقرة - المركز (جيجل)',
      period: 'الموسم 2024-2025',
      excelTotalCash: '4,850,000 دج',
      erpImportedCash: '4,850,000 دج',
      variance: '0 دج (تطابق تام)',
      status: 'BALANCED',
    },
    {
      branch: 'روضة الأطفال النموذجية (جيجل)',
      period: 'الموسم 2024-2025',
      excelTotalCash: '3,240,000 دج',
      erpImportedCash: '3,240,000 دج',
      variance: '0 دج (تطابق تام)',
      status: 'BALANCED',
    },
    {
      branch: 'أكاديمية فرع الميلية',
      period: 'الموسم 2023-2024',
      excelTotalCash: '2,150,000 دج',
      erpImportedCash: '2,150,000 دج',
      variance: '0 دج (تطابق تام)',
      status: 'BALANCED',
    },
  ];

  const handleResolveRow = (rowId) => {
    setStagedRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? { ...r, status: 'RESOLVED', ambiguityReason: 'تم التحقق اليدوي واعتماد المطابقة رسمياً' }
          : r
      )
    );
  };

  const filteredRows = stagedRows.filter((r) => {
    if (statusFilter === 'AMBIGUOUS') return r.status === 'AMBIGUOUS' || r.status === 'PRICE_OVERRIDE_NEEDED';
    if (statusFilter === 'MATCHED') return r.status === 'MATCHED';
    if (statusFilter === 'RESOLVED') return r.status === 'RESOLVED';
    return true;
  });

  const pipelineStages = [
    { num: 1, title: '1. التجميع (Collect)', desc: 'جمع ملفات إكسل من الـ 13 فرعاً' },
    { num: 2, title: '2. الاستيراد الخام (Stage)', desc: 'تحميل الصفوف في mig_import_row' },
    { num: 3, title: '3. التنظيف والفرز (Clean)', desc: 'معايرة الأسماء والأفواج والمستويات' },
    { num: 4, title: '4. مراجعة الالتباس (Review)', desc: 'التدقيق البشري للحالات غير المطابقة' },
    { num: 5, title: '5. التحويل (Convert)', desc: 'توليد الأشخاص والتسجيلات وسندات القبض' },
    { num: 6, title: '6. المطابقة المالية (Reconcile)', desc: 'مقارنة مجاميع الصناديق بدفاتر الكاش' },
  ];

  return (
    <div className="space-y-3 font-arabic text-xs">
      {/* Top Banner */}
      <div className="bg-white border border-slate-300 p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-800 text-white">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 font-display">
              وحدة ترحيل البيانات ومطابقة سجلات إكسل (Excel Data Migration Console)
            </h2>
            <p className="text-[11px] text-slate-500">
              استيراد سجلات 3 سنوات تاريخية (5,200 طالب عبر 13 فرعاً) ومطابقتها دفترياً
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-900 font-bold text-xs">
            13 ملف إكسل مجمع
          </span>
          <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-xs">
            نسبة المعالجة: 94.8%
          </span>
        </div>
      </div>

      {/* 6-Stage Pipeline Stepper */}
      <div className="bg-white border border-slate-300 p-3 shadow-2xs">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {pipelineStages.map((stage) => {
            const isCurrent = activeStage === stage.num;
            const isDone = stage.num < activeStage;
            return (
              <button
                key={stage.num}
                onClick={() => setActiveStage(stage.num)}
                className={`p-2 border text-start transition-all ${
                  isCurrent
                    ? 'border-blue-900 bg-blue-50/60 shadow-xs ring-1 ring-blue-900'
                    : isDone
                    ? 'border-emerald-300 bg-emerald-50/40 text-slate-800'
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[11px] text-slate-900">{stage.title}</span>
                  {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">{stage.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stage 4 Workbench: Review Ambiguities */}
      <div className="bg-white border border-slate-300 p-4 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <span>طاولة مراجعة الالتباسات والصفوف المعلقة (mig_import_row Review Workbench)</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              * القاعدة الإلزامية: لا يتم تحويل أي صف إلى قاعدة البيانات قبل فض الالتباس واعتماده بشرياً
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-7 px-2 border border-slate-300 bg-slate-50 text-xs"
            >
              <option value="ALL">جميع الصفوف المستوردة ({stagedRows.length})</option>
              <option value="AMBIGUOUS">الصفوف الملتبسة وبحاجة لقرار</option>
              <option value="MATCHED">الصفوف المطابقة آلياً</option>
              <option value="RESOLVED">الصفوف التي فُض التباسها</option>
            </select>
          </div>
        </div>

        {/* Rows Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs border border-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <th className="p-2.5 text-start">ملف المصدر / الورقة</th>
                <th className="p-2.5 text-center w-12">الصف</th>
                <th className="p-2.5 text-start">الاسم في الإكسل (Raw)</th>
                <th className="p-2.5 text-start">المطابقة المقترحة</th>
                <th className="p-2.5 text-start">النشاط / الفوج</th>
                <th className="p-2.5 text-center">المبلغ والوصل</th>
                <th className="p-2.5 text-start">حالة الالتباس والملاحظة</th>
                <th className="p-2.5 text-center">إجراء المعالجة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="p-2.5">
                    <span className="font-mono font-bold text-slate-900 block">{row.batchFile}</span>
                    <span className="text-[10px] text-slate-500">{row.sheetName}</span>
                  </td>
                  <td className="p-2.5 text-center font-mono text-slate-700">{row.sourceRow}</td>
                  <td className="p-2.5 font-bold text-blue-950">{row.rawName}</td>
                  <td className="p-2.5">
                    <span className="text-slate-800 font-semibold block">{row.cleanedGiven} {row.cleanedFamily}</span>
                    <span className="font-mono text-[10px] text-slate-400">{row.matchedPersonId || 'غير مربوط بعد'}</span>
                  </td>
                  <td className="p-2.5">
                    <span className="text-slate-900 font-medium block">{row.mappedLevel}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{row.rawWorkshop}</span>
                  </td>
                  <td className="p-2.5 text-center">
                    <span className="font-mono font-bold text-emerald-800 block">{row.excelInstallmentPaid.toLocaleString()} دج</span>
                    <span className="font-mono text-[10px] text-slate-500">{row.excelReceiptNo}</span>
                  </td>
                  <td className="p-2.5 text-slate-700">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className={`px-2 py-0.2 font-bold text-[10px] border ${
                          row.status === 'MATCHED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : row.status === 'RESOLVED'
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}
                      >
                        {row.status === 'MATCHED'
                          ? 'مطابق'
                          : row.status === 'RESOLVED'
                          ? 'معتمد بشرياً'
                          : 'التباس معلق'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">{row.ambiguityReason}</span>
                  </td>
                  <td className="p-2.5 text-center">
                    {row.status !== 'MATCHED' && row.status !== 'RESOLVED' ? (
                      <button
                        onClick={() => handleResolveRow(row.id)}
                        className="px-2.5 py-1 bg-blue-900 hover:bg-blue-800 text-white font-bold text-[10px] shadow-2xs"
                      >
                        فض الالتباس
                      </button>
                    ) : (
                      <span className="text-emerald-700 font-bold text-[10px] flex items-center justify-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>جاهز للتحويل</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stage 6: Cash Ledger Reconciliation Table */}
      <div className="bg-white border border-slate-300 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              المطابقة المالية الدفترية مع سجلات إكسل (Stage 6: Financial Reconciliation)
            </h3>
            <p className="text-[11px] text-slate-500">
              التحقق التام من عدم ضياع أو تكرار أي دينار جزائري أثناء عملية الهجرة
            </p>
          </div>
          <span className="text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 font-bold font-mono text-[10px]">
            100% RECONCILED
          </span>
        </div>

        <table className="w-full text-start text-xs border border-slate-300 border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
              <th className="p-2 text-start">الفرع والمقر</th>
              <th className="p-2 text-start">الفترة التاريخية</th>
              <th className="p-2 text-center">مجموع الكاش في إكسل</th>
              <th className="p-2 text-center">مجموع المقبوضات المحولة</th>
              <th className="p-2 text-center">فارق المطابقة (Variance)</th>
              <th className="p-2 text-center">حالة التدقيق</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {reconciliationData.map((rec, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="p-2 font-bold text-slate-900">{rec.branch}</td>
                <td className="p-2 text-slate-600">{rec.period}</td>
                <td className="p-2 text-center font-mono font-bold text-slate-800">{rec.excelTotalCash}</td>
                <td className="p-2 text-center font-mono font-bold text-blue-950">{rec.erpImportedCash}</td>
                <td className="p-2 text-center font-mono font-bold text-emerald-700">{rec.variance}</td>
                <td className="p-2 text-center">
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[10px]">
                    مطابق ومعتمد
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
