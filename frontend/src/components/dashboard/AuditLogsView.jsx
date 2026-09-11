import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Eye,
  FileCode,
  Calendar,
  User,
  ArrowRight,
  Database,
  CheckCircle2,
  Clock,
  Plus,
  X,
  ExternalLink,
  Layers,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { MOCK_AUDIT_LOGS, MOCK_AUDIT_STATS } from '../../mock/mockData';

export function AuditLogsView() {
  const [logs, setLogs] = useState(MOCK_AUDIT_LOGS);
  const [stats] = useState(MOCK_AUDIT_STATS);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL'); // 'ALL' | 'INSERT' | 'UPDATE' | 'DELETE'
  const [tableFilter, setTableFilter] = useState('ALL');
  const [actorFilter, setActorFilter] = useState('ALL');
  const [selectedLogForDiff, setSelectedLogForDiff] = useState(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('formatted'); // 'formatted' | 'json'

  // Form for manual audit log
  const [manualForm, setManualForm] = useState({
    table_name: 'payments',
    record_id: '',
    action: 'UPDATE',
    performed_by: 'mohammed_admin',
    summary: '',
  });

  // Filtering
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.performed_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(log.record_id).includes(searchTerm);
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    const matchesTable = tableFilter === 'ALL' || log.table_name === tableFilter;
    const matchesActor = actorFilter === 'ALL' || log.performed_by === actorFilter;
    return matchesSearch && matchesAction && matchesTable && matchesActor;
  });

  const handleCreateManualLog = (e) => {
    e.preventDefault();
    if (!manualForm.summary || !manualForm.record_id) return;
    const newEntry = {
      audit_id: Date.now(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      table_name: manualForm.table_name,
      record_id: parseInt(manualForm.record_id, 10) || 1,
      action: manualForm.action,
      performed_by: manualForm.performed_by,
      actor_name: 'محمد بوري',
      actor_role: 'SUPER_ADMIN',
      ip_address: '127.0.0.1',
      summary: manualForm.summary,
      old_values: { note: 'حالة مسجلة يدوياً' },
      new_values: { note: manualForm.summary, manual: true },
    };
    setLogs([newEntry, ...logs]);
    setIsManualModalOpen(false);
    setManualForm({ table_name: 'payments', record_id: '', action: 'UPDATE', performed_by: 'mohammed_admin', summary: '' });
  };

  return (
    <div className="space-y-3 font-arabic">
      {/* 1. Top Header & Overview */}
      <div className="bg-white border border-slate-300 p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="eyebrow flex items-center gap-1.5 text-blue-900">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>AUDIT LOGGING & COMPLIANCE / backend/apis/audit.py</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold font-serif text-slate-900 mt-0.5">
            سجل الرقابة والتتبع الأمني للنظام (System Audit Trail)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            توثيق رقمي لحظي لكافة عمليات التعديل، الإضافة، والحذف عبر جميع جداول قاعدة البيانات مع مقارنة الحالات السابقة واللاحقة (Diffs).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="button button-primary text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>تسجيل قيد تدقيق يدوي (POST /logs)</span>
          </button>
        </div>
      </div>

      {/* 2. Key Audit Telemetry Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-white border border-slate-300 p-3 border-s-4 border-s-blue-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="eyebrow">TOTAL AUDITED EVENTS</span>
            <Database className="w-3.5 h-3.5 text-blue-900" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {stats.total_events.toLocaleString()} قيداً
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.today_events} تعديلاً مسجلاً خلال الـ 24 ساعة الماضية
          </div>
        </div>

        <div className="bg-white border border-slate-300 p-3 border-s-4 border-s-emerald-700 shadow-xs">
          <span className="eyebrow">ACTION BREAKDOWN</span>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
              INSERT {stats.action_breakdown.insert}%
            </span>
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-mono font-bold">
              UPDATE {stats.action_breakdown.update}%
            </span>
            <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-mono font-bold">
              DELETE {stats.action_breakdown.delete}%
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            توزيع وتصنيف العمليات المنفذة
          </div>
        </div>

        <div className="bg-white border border-slate-300 p-3 border-s-4 border-s-amber-600 shadow-xs">
          <span className="eyebrow">HIGHEST ACTIVITY TABLE</span>
          <div className="text-xl font-bold font-mono text-amber-800 mt-1">
            payments (39%)
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            5,820 حركة مدفوعات وسندات قبض
          </div>
        </div>

        <div className="bg-white border border-slate-300 p-3 border-s-4 border-s-slate-700 shadow-xs">
          <span className="eyebrow">SECURITY INTEGRITY</span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            100% SHA-256
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            سجلات مشفرة غير قابلة للحذف أو التلاعب
          </div>
        </div>
      </div>

      {/* 3. Master Audit Trail Filter Ribbon & Grid */}
      <div className="bg-white border border-slate-300 shadow-xs">
        {/* Advanced Filters */}
        <div className="p-2.5 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search Input */}
            <div className="relative min-w-[220px] flex-1">
              <Search className="w-3.5 h-3.5 absolute inset-y-0 start-2 my-auto text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث في التفاصيل، المنفذ، أو رقم السجل..."
                className="w-full h-7 ps-7 pe-2 text-xs border border-slate-300 bg-white focus:outline-none focus:border-blue-900"
              />
            </div>

            {/* Table Dropdown */}
            <select
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              className="h-7 px-2 text-xs border border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-blue-900"
            >
              <option value="ALL">كافة الجداول (All Tables)</option>
              <option value="payments">payments (المدفوعات)</option>
              <option value="students">students (المسجلين)</option>
              <option value="cash_drawer">cash_drawer (الصندوق)</option>
              <option value="payroll_runs">payroll_runs (الرواتب)</option>
              <option value="academic_years">academic_years (المواسم)</option>
              <option value="branches">branches (الفروع)</option>
            </select>

            {/* Actor Dropdown */}
            <select
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              className="h-7 px-2 text-xs border border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-blue-900"
            >
              <option value="ALL">كافة المنفذين (All Actors)</option>
              <option value="admin_mohammed">محمد بوري (Super Admin)</option>
              <option value="accountant_sarah">سارة منصوري (Accountant)</option>
              <option value="director_amira">أميرة بوعبد الله (Director)</option>
            </select>
          </div>

          {/* Action Filter Pills */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-500 font-semibold me-1">العملية:</span>
            {['ALL', 'INSERT', 'UPDATE', 'DELETE'].map((act) => (
              <button
                key={act}
                onClick={() => setActionFilter(act)}
                className={`px-2 py-0.5 text-[10px] font-semibold border ${
                  actionFilter === act
                    ? 'bg-blue-900 text-white border-blue-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {act}
              </button>
            ))}
          </div>
        </div>

        {/* Excel-like Audit Grid */}
        <div className="overflow-x-auto">
          <table className="excel-table text-xs">
            <thead>
              <tr>
                <th className="excel-th p-2 text-center w-16">ID القيد</th>
                <th className="excel-th p-2 text-center w-36">التوقيت الدقيق</th>
                <th className="excel-th p-2 text-center w-24">نوع الإجراء</th>
                <th className="excel-th p-2 text-center w-32">الجدول (Table)</th>
                <th className="excel-th p-2 text-center w-20">السجل</th>
                <th className="excel-th p-2 text-start w-40">المستخدم المنفذ</th>
                <th className="excel-th p-2 text-center w-28">عنوان IP</th>
                <th className="excel-th p-2 text-start">ملخص العملية والتغييرات</th>
                <th className="excel-th p-2 text-center w-28">فحص الفروقات</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => {
                const isInsert = log.action === 'INSERT';
                const isUpdate = log.action === 'UPDATE';
                const isDelete = log.action === 'DELETE';

                return (
                  <tr key={log.audit_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="excel-td p-2 text-center font-mono text-slate-500">
                      #{log.audit_id}
                    </td>
                    <td className="excel-td p-2 text-center font-mono text-[11px] text-slate-700">
                      {log.timestamp}
                    </td>
                    <td className="excel-td p-2 text-center">
                      <span
                        className={`inline-flex items-center gap-1 font-mono font-bold text-[10px] px-2 py-0.5 border ${
                          isInsert
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : isUpdate
                            ? 'bg-blue-50 text-blue-900 border-blue-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="excel-td p-2 text-center font-mono font-semibold text-slate-800">
                      <span className="bg-slate-100 px-1.5 py-0.5 text-[11px]">
                        {log.table_name}
                      </span>
                    </td>
                    <td className="excel-td p-2 text-center font-mono text-blue-900 font-bold">
                      #{log.record_id}
                    </td>
                    <td className="excel-td p-2 text-start">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 leading-tight">
                          {log.actor_name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {log.performed_by} ({log.actor_role})
                        </span>
                      </div>
                    </td>
                    <td className="excel-td p-2 text-center font-mono text-[10px] text-slate-500">
                      {log.ip_address}
                    </td>
                    <td className="excel-td p-2 text-slate-700 text-xs">
                      {log.summary}
                    </td>
                    <td className="excel-td p-2 text-center">
                      <button
                        onClick={() => setSelectedLogForDiff(log)}
                        className="button text-[10px] h-6 px-2 text-blue-900 hover:bg-blue-50"
                        title="فحص الفروقات قبل وبعد (GET /audit/logs/{id})"
                      >
                        <Eye className="w-3 h-3" />
                        <span>مقارنة Diffs</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="excel-status-bar p-2 text-slate-600 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span>عدد العمليات المعروضة: <strong>{filteredLogs.length}</strong></span>
            <span>•</span>
            <span className="text-blue-900 font-mono">FastAPI Router: /audit/logs</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Requires: SUPER_ADMIN or ADMIN role
          </div>
        </div>
      </div>

      {/* 4. Modal: Before-and-After Change Inspector (Diff Viewer) */}
      {selectedLogForDiff && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-3 select-none">
          <div className="bg-white border border-slate-400 max-w-2xl w-full shadow-lg max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-900" />
                <h3 className="font-bold text-sm text-slate-900">
                  فحص تفاصيل التعديل وفروقات الحقول (Audit #{selectedLogForDiff.audit_id})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode(viewMode === 'formatted' ? 'json' : 'formatted')}
                  className="button text-[10px] h-6 px-2"
                >
                  {viewMode === 'formatted' ? 'عرض JSON خام' : 'عرض منسق'}
                </button>
                <button
                  onClick={() => setSelectedLogForDiff(null)}
                  className="icon-button w-6 h-6 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-3 text-xs">
              {/* Event Metadata Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 border border-slate-200 text-[11px]">
                <div>
                  <span className="eyebrow block">TARGET ENTITY</span>
                  <strong className="font-mono text-slate-900">
                    {selectedLogForDiff.table_name} #{selectedLogForDiff.record_id}
                  </strong>
                </div>
                <div>
                  <span className="eyebrow block">ACTION TYPE</span>
                  <strong className="font-mono text-blue-900">{selectedLogForDiff.action}</strong>
                </div>
                <div>
                  <span className="eyebrow block">ACTOR</span>
                  <span className="text-slate-800 font-semibold">{selectedLogForDiff.actor_name}</span>
                </div>
                <div>
                  <span className="eyebrow block">TIMESTAMP</span>
                  <span className="font-mono text-slate-600">{selectedLogForDiff.timestamp}</span>
                </div>
              </div>

              <div>
                <span className="eyebrow block mb-1">OPERATION SUMMARY</span>
                <p className="p-2 bg-blue-50/50 border border-blue-200 text-slate-800 text-xs leading-relaxed">
                  {selectedLogForDiff.summary}
                </p>
              </div>

              {/* Side-by-Side Before vs After Diffs */}
              {viewMode === 'formatted' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {/* Before (Old Values) */}
                  <div className="border border-rose-200 bg-rose-50/30 p-3">
                    <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-rose-200 text-rose-900 font-bold text-xs">
                      <span>الحالة السابقة (old_values)</span>
                      <span className="text-[10px] font-mono">BEFORE</span>
                    </div>
                    {selectedLogForDiff.old_values ? (
                      <div className="space-y-1.5 font-mono text-[11px]">
                        {Object.entries(selectedLogForDiff.old_values).map(([k, v]) => (
                          <div key={k} className="p-1 bg-white/70 border border-rose-100">
                            <span className="text-slate-500 font-semibold">{k}: </span>
                            <span className="text-rose-900 font-bold">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-slate-400 text-xs italic py-4 text-center">
                        لا توجد حالة سابقة (عملية إضافة جديدة INSERT)
                      </div>
                    )}
                  </div>

                  {/* After (New Values) */}
                  <div className="border border-emerald-200 bg-emerald-50/30 p-3">
                    <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-emerald-200 text-emerald-900 font-bold text-xs">
                      <span>الحالة اللاحقة (new_values)</span>
                      <span className="text-[10px] font-mono">AFTER</span>
                    </div>
                    {selectedLogForDiff.new_values ? (
                      <div className="space-y-1.5 font-mono text-[11px]">
                        {Object.entries(selectedLogForDiff.new_values).map(([k, v]) => (
                          <div key={k} className="p-1 bg-white/70 border border-emerald-100">
                            <span className="text-slate-500 font-semibold">{k}: </span>
                            <span className="text-emerald-900 font-bold">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-rose-600 text-xs italic py-4 text-center">
                        تم حذف السجل من قاعدة البيانات (DELETE)
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Raw JSON View */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="eyebrow block mb-1">RAW old_values JSON</span>
                    <pre className="p-2.5 bg-slate-900 text-rose-300 font-mono text-[11px] overflow-x-auto h-44">
                      {JSON.stringify(selectedLogForDiff.old_values, null, 2) || 'null'}
                    </pre>
                  </div>
                  <div>
                    <span className="eyebrow block mb-1">RAW new_values JSON</span>
                    <pre className="p-2.5 bg-slate-900 text-emerald-300 font-mono text-[11px] overflow-x-auto h-44">
                      {JSON.stringify(selectedLogForDiff.new_values, null, 2) || 'null'}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                API: /audit/history/{selectedLogForDiff.table_name}/{selectedLogForDiff.record_id}
              </span>
              <button
                onClick={() => setSelectedLogForDiff(null)}
                className="button text-xs"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal: Manual Audit Event Record */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-3 select-none">
          <div className="bg-white border border-slate-400 max-w-md w-full shadow-lg">
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-900" />
                <h3 className="font-bold text-sm text-slate-900">
                  تسجيل قيد تدقيق ومراقبة يدوي (POST /audit/logs)
                </h3>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="icon-button w-6 h-6 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualLog} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="eyebrow block mb-1 text-slate-700">الجدول المستهدف</label>
                  <select
                    value={manualForm.table_name}
                    onChange={(e) => setManualForm({ ...manualForm, table_name: e.target.value })}
                    className="w-full h-8 px-2 text-xs border border-slate-300 bg-white"
                  >
                    <option value="payments">payments</option>
                    <option value="students">students</option>
                    <option value="cash_drawer">cash_drawer</option>
                    <option value="payroll_runs">payroll_runs</option>
                    <option value="branches">branches</option>
                  </select>
                </div>
                <div>
                  <label className="eyebrow block mb-1 text-slate-700">معرف السجل (record_id)</label>
                  <input
                    type="number"
                    required
                    placeholder="مثال: 104"
                    value={manualForm.record_id}
                    onChange={(e) => setManualForm({ ...manualForm, record_id: e.target.value })}
                    className="w-full h-8 px-2.5 text-xs border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="eyebrow block mb-1 text-slate-700">نوع الإجراء</label>
                <select
                  value={manualForm.action}
                  onChange={(e) => setManualForm({ ...manualForm, action: e.target.value })}
                  className="w-full h-8 px-2 text-xs border border-slate-300 bg-white font-mono"
                >
                  <option value="UPDATE">UPDATE (تعديل)</option>
                  <option value="INSERT">INSERT (إضافة)</option>
                  <option value="DELETE">DELETE (حذف)</option>
                </select>
              </div>

              <div>
                <label className="eyebrow block mb-1 text-slate-700">ملخص ومبرر الإجراء الرقابي *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="بيان سبب وتفاصيل التعديل الإداري..."
                  value={manualForm.summary}
                  onChange={(e) => setManualForm({ ...manualForm, summary: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-300"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="button text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="button button-primary text-xs"
                >
                  تسجيل القيد في الأرشيف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
