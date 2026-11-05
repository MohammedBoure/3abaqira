import React, { useState } from 'react';
import {
  GitMerge,
  AlertTriangle,
  UserCheck,
  CheckCircle,
  FileSpreadsheet,
  Link,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { MOCK_KG_STUDENTS } from '../../../mock/geniusKindergartenFinanceMockData';

export function AmbiguousRowResolverModal({ row, onClose, onResolve }) {
  const [resolutionType, setResolutionType] = useState('LINK_EXISTING'); // LINK_EXISTING or CREATE_NEW
  const [selectedStudentId, setSelectedStudentId] = useState(MOCK_KG_STUDENTS[0].id);
  const [resolutionNotes, setResolutionNotes] = useState('تم التحقق ومطابقة الهوية مع السجل المركزي بعد التدقيق مع الولي.');

  const handleConfirm = (e) => {
    e.preventDefault();
    onResolve(row.id, {
      type: resolutionType,
      targetEntityId: resolutionType === 'LINK_EXISTING' ? selectedStudentId : `KGS-${String(Math.floor(Math.random() * 900) + 100)}`,
      notes: resolutionNotes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-3 font-arabic">
      <div className="bg-white border-2 border-amber-500 shadow-2xl w-full max-w-xl p-5 animate-in fade-in zoom-in-95 text-slate-800">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-amber-700" />
            <h3 className="text-sm font-bold text-slate-900">
              معالج وحل غموض السجل التاريخي (Ambiguous Row Resolver)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 font-mono text-sm"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleConfirm} className="space-y-3.5 text-xs">
          {/* Source Info Box */}
          <div className="p-3 bg-amber-50/50 border border-amber-200 text-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-950 flex items-center gap-1">
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-800" />
                المصدر: ورقة [{row.sourceSheet}] — السطر #{row.sourceRowNumber}
              </span>
              <span className="font-mono text-[10px] font-bold text-amber-900 bg-amber-100 px-1.5 py-0.2 border border-amber-300">
                درجة التطابق: {Math.round(row.confidenceScore * 100)}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
              <div>
                <span className="text-slate-500 block">الاسم في ملف الإكسل:</span>
                <span className="font-bold text-slate-900">{row.rawName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">تاريخ الميلاد المستخرج:</span>
                <span className="font-bold text-slate-900">{row.rawDob}</span>
              </div>
              <div>
                <span className="text-slate-500 block">الفوج / المستوى الأصلي:</span>
                <span className="font-bold text-slate-900">{row.rawCohort}</span>
              </div>
              <div>
                <span className="text-slate-500 block">الهاتف المدون:</span>
                <span className="font-bold text-slate-900">{row.rawPhone}</span>
              </div>
            </div>
          </div>

          {/* Conflict Details Alert */}
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-950 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">سبب الغموض والتضارب (Conflict Details):</span>
              <p className="text-[11px] leading-relaxed mt-0.5">{row.conflictDetails}</p>
            </div>
          </div>

          {/* Resolution Options */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">اختر آلية حل التعارض والربط *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setResolutionType('LINK_EXISTING')}
                className={`p-2 text-start border transition-all ${
                  resolutionType === 'LINK_EXISTING'
                    ? 'bg-blue-50/70 border-blue-900 ring-1 ring-blue-900 font-bold'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-blue-900">
                  <Link className="w-3.5 h-3.5" />
                  <span>ربط بسجل تلميذ موجود مسبقاً</span>
                </div>
                <p className="text-[10px] text-slate-500 font-normal">
                  دمج السطر التاريخي مع بروفايل التلميذ لمنع التكرار بين الفروع.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setResolutionType('CREATE_NEW')}
                className={`p-2 text-start border transition-all ${
                  resolutionType === 'CREATE_NEW'
                    ? 'bg-emerald-50/70 border-emerald-900 ring-1 ring-emerald-900 font-bold'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-emerald-900">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>اعتماد كملف تلميذ جديد ومستقل</span>
                </div>
                <p className="text-[10px] text-slate-500 font-normal">
                  توليد معرف رقمي جديد (UUID) وفصله كشخص منفصل.
                </p>
              </button>
            </div>
          </div>

          {/* Target Selection if LINK_EXISTING */}
          {resolutionType === 'LINK_EXISTING' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                اختر التلميذ المطابق من قاعدة البيانات الموحدة *
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full p-2 border border-slate-300 font-arabic bg-white focus:border-blue-900"
                required
              >
                {MOCK_KG_STUDENTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullNameAr} ({s.fullNameFr}) — رقم الدفتر: {s.bookNumber} — الولي: {s.guardianPhone}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Resolution Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              ملاحظة التدقيق والتوثيق الرقابي للحل *
            </label>
            <textarea
              rows={2}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="w-full p-2 border border-slate-300 font-arabic focus:border-blue-900"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-bold flex items-center gap-1.5 shadow-2xs"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>تأكيد الحل وترحيل السجل إلى قاعدة البيانات</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
