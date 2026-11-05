import React, { useState } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle,
  AlertTriangle,
  GitMerge,
  Search,
  Filter,
  Layers,
  Database,
  ArrowRight,
  ShieldCheck,
  Printer,
  RefreshCw,
  Link2,
  FileCheck,
} from 'lucide-react';
import {
  MOCK_MIGRATION_BATCHES,
  MOCK_STAGING_ROWS,
  MOCK_LEGACY_REFS,
} from '../../../mock/geniusKindergartenFinanceMockData';
import { AmbiguousRowResolverModal } from './AmbiguousRowResolverModal';

export function DataMigrationConsoleView() {
  const [batches, setBatches] = useState(MOCK_MIGRATION_BATCHES);
  const [selectedBatch, setSelectedBatch] = useState(MOCK_MIGRATION_BATCHES[0]);
  const [stagingRows, setStagingRows] = useState(MOCK_STAGING_ROWS);
  const [legacyRefs, setLegacyRefs] = useState(MOCK_LEGACY_REFS);
  const [activeTab, setActiveTab] = useState('STAGING'); // 'STAGING' or 'LEGACY_REFS'
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, AMBIGUOUS_MATCH, VALIDATED, IMPORTED
  const [searchQuery, setSearchQuery] = useState('');
  const [resolvingRow, setResolvingRow] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleResolveAmbiguity = (rowId, resolutionResult) => {
    setStagingRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              matchStatus: 'VALIDATED',
              confidenceScore: 1.0,
              conflictDetails: null,
              resolvedEntityId: resolutionResult.targetEntityId,
            }
          : r
      )
    );

    // Add pointer to legacy ref ledger (Rule: "with a link back to the source sheet and row")
    const resolvedRow = stagingRows.find((r) => r.id === rowId);
    if (resolvedRow) {
      const newRef = {
        id: `LGC-REF-${String(legacyRefs.length + 10).padStart(3, '0')}`,
        legacyFile: selectedBatch.fileName,
        legacySheet: resolvedRow.sourceSheet,
        legacyRow: resolvedRow.sourceRowNumber,
        legacyIdentifier: `ROW-${resolvedRow.sourceRowNumber}-${resolvedRow.rawName.slice(0, 3)}`,
        targetTable: resolvedRow.targetTable,
        targetUuid: resolutionResult.targetEntityId,
        businessLabel: `تمت المعالجة: ${resolvedRow.rawName} (${resolutionResult.notes})`,
        migratedAt: new Date().toLocaleString('ar-DZ', { hour12: false }),
        migratedBy: 'محمد بوري (المدير العام)',
      };
      setLegacyRefs([newRef, ...legacyRefs]);
    }

    setResolvingRow(null);
    triggerToast('تمت معالجة السطر الغامض بنجاح وتوثيق مسار الرجوع في سجل المراجع القديمة.');
  };

  const filteredRows = stagingRows.filter((r) => {
    const matchesStatus = statusFilter === 'ALL' || r.matchStatus === statusFilter;
    const matchesSearch =
      r.rawName.includes(searchQuery) ||
      r.sourceSheet.includes(searchQuery) ||
      (r.rawPhone && r.rawPhone.includes(searchQuery));
    return matchesStatus && matchesSearch;
  });

  const ambiguousCount = stagingRows.filter((r) => r.matchStatus === 'AMBIGUOUS_MATCH').length;
  const validatedCount = stagingRows.filter((r) => r.matchStatus === 'VALIDATED').length;
  const importedCount = stagingRows.filter((r) => r.matchStatus === 'IMPORTED').length;

  return (
    <div className="space-y-3 font-arabic text-slate-800">
      {/* 1. Header & Live Staging Telemetry */}
      <div className="bg-white border border-slate-200 p-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2.5 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 leading-none">
                  منصة ترحيل وتدقيق بيانات الإكسل القديمة (Data Migration & Legacy Ledger)
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-50 text-blue-900 border border-blue-200 font-bold">
                  ربط السجلات بمصادرها الأصلية (Source Sheet & Row Pointer)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                استيراد تاريخ 3 مواسم دراسية، تدقيق ومطابقة أسطر الإكسل في جدول الفرز الأولي (Staging)، وفك غموض الأسماء المتضاربة.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-0.5 border border-slate-200 text-xs">
              <button
                onClick={() => setActiveTab('STAGING')}
                className={`px-3 py-1 font-bold transition-colors ${
                  activeTab === 'STAGING'
                    ? 'bg-blue-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                جدول فرز الأسطر (Staging Rows)
              </button>
              <button
                onClick={() => setActiveTab('LEGACY_REFS')}
                className={`px-3 py-1 font-bold transition-colors ${
                  activeTab === 'LEGACY_REFS'
                    ? 'bg-blue-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                سجل المراجع والروابط القديمة ({legacyRefs.length})
              </button>
            </div>
            <button
              onClick={() => window.print()}
              className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-1 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>طباعة التقرير</span>
            </button>
          </div>
        </div>

        {/* 4 Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2 bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 block">إجمالي أسطر الدفعة الحالية</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-slate-900">{selectedBatch.totalRows}</span>
              <span className="text-[10px] text-slate-500 font-mono">سطر إكسل أصلي</span>
            </div>
          </div>
          <div className="p-2 bg-amber-50/50 border border-amber-200">
            <span className="text-[10px] font-bold text-amber-800 block">أسطر غامضة تتطلب حلاً يدوياً</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-amber-900">{ambiguousCount}</span>
              <span className="text-[10px] text-amber-700 font-bold">تطابق مشبوه أو هاتف مكرر</span>
            </div>
          </div>
          <div className="p-2 bg-blue-50/50 border border-blue-200">
            <span className="text-[10px] font-bold text-blue-800 block">أسطر تم تدقيقها وتأكيدها</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-blue-900">{validatedCount}</span>
              <span className="text-[10px] text-blue-700 font-bold">جاهزة للترحيل النهائي</span>
            </div>
          </div>
          <div className="p-2 bg-emerald-50/50 border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-800 block">سجلات مرحلة فعلياً لقاعدة البيانات</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-emerald-900">{importedCount}</span>
              <span className="text-[10px] text-emerald-700 font-mono">مربوطة بـ UUID</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Batch Selector & Upload Dropzone Banner */}
      <div className="bg-white border border-slate-200 p-2.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs text-xs">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="font-bold text-slate-700">ملف الإكسل النشط:</span>
          <select
            value={selectedBatch.id}
            onChange={(e) => {
              const b = batches.find((item) => item.id === e.target.value);
              if (b) setSelectedBatch(b);
            }}
            className="p-1 font-mono font-bold text-blue-950 border border-slate-300 bg-slate-50"
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.fileName} ({b.sourceDescription})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="cursor-pointer px-2.5 py-1 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 flex items-center gap-1.5">
            <UploadCloud className="w-3.5 h-3.5" />
            <span>رفع ملف إكسل تاريخي جديد (.xlsx)</span>
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  triggerToast(`تم تحميل ملف [${e.target.files[0].name}] وفك ضغط جداوله إلى مرحلة الفرز.`);
                }
              }}
            />
          </label>
        </div>
      </div>

      {/* 3. Search and Status Filter */}
      <div className="bg-white border border-slate-200 p-2 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute start-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم، رقم السطر، أو اسم الشيت..."
              className="w-full ps-8 pe-2 py-1 text-xs border border-slate-200 bg-slate-50/50"
            />
          </div>
          {activeTab === 'STAGING' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs p-1 border border-slate-200 bg-white font-arabic font-semibold"
            >
              <option value="ALL">كافة حالات المطابقة</option>
              <option value="AMBIGUOUS_MATCH">أسطر غامضة (تتطلب حلاً)</option>
              <option value="VALIDATED">مدققة بنجاح</option>
              <option value="IMPORTED">مرحّلة بالكامل</option>
            </select>
          )}
        </div>

        <div className="text-xs text-slate-500 font-mono">
          {activeTab === 'STAGING' ? (
            <>
              عرض <span className="font-bold text-slate-800">{filteredRows.length}</span> سطر فرز
            </>
          ) : (
            <>
              عرض <span className="font-bold text-slate-800">{legacyRefs.length}</span> مرجع تاريخي
            </>
          )}
        </div>
      </div>

      {/* 4. Conditional Content: Staging Table vs Legacy Ref Ledger */}
      {activeTab === 'STAGING' ? (
        <div className="bg-white border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold select-none">
                  <th className="py-2 px-2 text-center border-e border-slate-200 w-10">#</th>
                  <th className="py-2 px-2.5 text-start border-e border-slate-200 w-36">
                    الورقة والسطر الأصلي
                  </th>
                  <th className="py-2 px-2.5 text-start border-e border-slate-200">الاسم المستخرج من الإكسل</th>
                  <th className="py-2 px-2 text-center border-e border-slate-200">تاريخ الميلاد</th>
                  <th className="py-2 px-2 text-start border-e border-slate-200">الفوج الأصلي</th>
                  <th className="py-2 px-2 text-start border-e border-slate-200">الهاتف المسجل</th>
                  <th className="py-2 px-2 text-center border-e border-slate-200 w-24">درجة الثقة</th>
                  <th className="py-2 px-2 text-center border-e border-slate-200 w-32">حالة المطابقة</th>
                  <th className="py-2 px-2 text-center w-28">إجراء الفرز</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRows.map((row, idx) => {
                  const isAmbiguous = row.matchStatus === 'AMBIGUOUS_MATCH';
                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors ${
                        isAmbiguous ? 'bg-amber-50/30' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-2 px-2 text-center font-mono text-slate-500 border-e border-slate-200">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-2.5 border-e border-slate-200 font-mono text-slate-800">
                        <div className="flex flex-col">
                          <span className="font-bold text-blue-950 font-sans">{row.sourceSheet}</span>
                          <span className="text-[10px] text-slate-500">سطر #{row.sourceRowNumber}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2.5 border-e border-slate-200 font-semibold text-slate-900">
                        <div>
                          <span>{row.rawName}</span>
                          {row.conflictDetails && (
                            <span className="text-[10px] text-rose-700 block mt-0.5">
                              {row.conflictDetails}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-slate-600 border-e border-slate-200">
                        {row.rawDob}
                      </td>
                      <td className="py-2 px-2 text-start border-e border-slate-200 text-slate-700">
                        {row.rawCohort}
                      </td>
                      <td className="py-2 px-2 text-start font-mono border-e border-slate-200 text-slate-600">
                        {row.rawPhone}
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-bold border-e border-slate-200">
                        <span
                          className={
                            row.confidenceScore >= 0.9
                              ? 'text-emerald-700'
                              : row.confidenceScore >= 0.7
                              ? 'text-amber-700'
                              : 'text-rose-700'
                          }
                        >
                          {Math.round(row.confidenceScore * 100)}%
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center border-e border-slate-200">
                        {isAmbiguous ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <AlertTriangle className="w-3 h-3 text-amber-700" />
                            تطابق مشبوه
                          </span>
                        ) : row.matchStatus === 'VALIDATED' ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-900 border border-blue-200">
                            <CheckCircle className="w-3 h-3 text-blue-600" />
                            مدقق ومؤكد
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <FileCheck className="w-3 h-3 text-emerald-600" />
                            مرحّل بالكامل
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {isAmbiguous ? (
                          <button
                            onClick={() => setResolvingRow(row)}
                            className="px-2 py-0.5 text-[10px] font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-1 w-full shadow-2xs"
                          >
                            <GitMerge className="w-3 h-3" />
                            حل الغموض
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {row.resolvedEntityId || 'جاهز'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Legacy Ref Ledger (Mapping legacy file, sheet, row to real database entity UUID) */
        <div className="bg-white border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-2.5 bg-blue-50/50 border-b border-blue-200 text-xs text-blue-950 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-blue-800 shrink-0" />
            <span>
              سجل التتبع والمراجع القديمة (`mig_legacy_ref`): يربط كل سجل حقيقي في قاعدة البيانات الحديثة بعنوانه الأصلي في ملف وشيت وسطر الإكسل.
            </span>
          </div>

          <table className="w-full text-start border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 select-none">
                <th className="py-2 px-2 text-center border-e border-slate-200 w-10">#</th>
                <th className="py-2 px-2 text-center border-e border-slate-200 w-28">كود المرجع</th>
                <th className="py-2 px-2.5 text-start border-e border-slate-200">ملف الإكسل الأصلي</th>
                <th className="py-2 px-2 text-start border-e border-slate-200">الورقة (Sheet)</th>
                <th className="py-2 px-2 text-center border-e border-slate-200 w-20">السطر</th>
                <th className="py-2 px-2 text-center border-e border-slate-200">الجدول الهدف</th>
                <th className="py-2 px-2.5 text-start border-e border-slate-200 min-w-[200px]">
                  المعرف الرقمي في المنظومة (Target UUID)
                </th>
                <th className="py-2 px-2.5 text-start border-e border-slate-200">البيان الوظيفي للسجل</th>
                <th className="py-2 px-2 text-center">المسؤول عن الترحيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {legacyRefs.map((ref, idx) => (
                <tr key={ref.id} className="hover:bg-slate-50 font-sans">
                  <td className="py-2 px-2 text-center font-mono text-slate-500 border-e border-slate-200">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-2 text-center font-mono font-bold text-blue-950 border-e border-slate-200">
                    {ref.id}
                  </td>
                  <td className="py-2 px-2.5 border-e border-slate-200 font-mono text-slate-700">
                    {ref.legacyFile}
                  </td>
                  <td className="py-2 px-2.5 border-e border-slate-200 text-slate-800">
                    {ref.legacySheet}
                  </td>
                  <td className="py-2 px-2 text-center font-mono font-bold text-slate-900 border-e border-slate-200">
                    #{ref.legacyRow}
                  </td>
                  <td className="py-2 px-2 text-center font-mono text-blue-900 font-semibold border-e border-slate-200">
                    {ref.targetTable}
                  </td>
                  <td className="py-2 px-2.5 font-mono text-[11px] text-slate-600 border-e border-slate-200">
                    {ref.targetUuid}
                  </td>
                  <td className="py-2 px-2.5 border-e border-slate-200 font-medium text-slate-900">
                    {ref.businessLabel}
                  </td>
                  <td className="py-2 px-2 text-center text-[10px] text-slate-600">
                    {ref.migratedBy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. Ambiguous Row Resolver Modal */}
      {resolvingRow && (
        <AmbiguousRowResolverModal
          row={resolvingRow}
          onClose={() => setResolvingRow(null)}
          onResolve={handleResolveAmbiguity}
        />
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
