import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Search,
  Plus,
  Filter,
  CheckCircle,
  Clock,
  Printer,
  Bell,
  Eye,
  UserCheck,
  Building,
} from 'lucide-react';
import {
  MOCK_KG_INCIDENTS,
  MOCK_KG_STUDENTS,
} from '../../../mock/geniusKindergartenFinanceMockData';

export function IncidentTrackerLogView() {
  const [incidents, setIncidents] = useState(MOCK_KG_INCIDENTS);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newIncident, setNewIncident] = useState({
    studentId: '',
    category: 'BEHAVIOR',
    severity: 'LOW',
    description: '',
    actionTaken: '',
    parentInformed: true,
  });

  const categories = [
    { id: 'BEHAVIOR', labelAr: 'سلوكي وعدوانية' },
    { id: 'SLEEP', labelAr: 'اضطرابات نوم وفزع' },
    { id: 'EATING', labelAr: 'تغذية ورفض طعام' },
    { id: 'LEARNING', labelAr: 'صعوبات تعلم ونطق' },
  ];

  const handleCreateIncident = (e) => {
    e.preventDefault();
    const student = MOCK_KG_STUDENTS.find((s) => s.id === newIncident.studentId);
    if (!student) {
      alert('يرجى تحديد الطفل المعني');
      return;
    }
    const created = {
      id: `INC-2026-${String(incidents.length + 101).padStart(3, '0')}`,
      studentId: student.id,
      studentName: student.fullNameAr,
      bandName: student.bandId,
      timestamp: new Date().toLocaleString('ar-DZ', { hour12: false }),
      category: newIncident.category,
      severity: newIncident.severity,
      description: newIncident.description,
      actionTaken: newIncident.actionTaken,
      reportedBy: 'المربية المناوبة (توثيق نظامي)',
      parentInformed: newIncident.parentInformed,
      parentInformedVia: newIncident.parentInformed ? 'هاتف مباشر / إشعار فوري' : 'لم يبلغ بعد',
    };
    setIncidents([created, ...incidents]);
    setIsModalOpen(false);
    setNewIncident({
      studentId: '',
      category: 'BEHAVIOR',
      severity: 'LOW',
      description: '',
      actionTaken: '',
      parentInformed: true,
    });
  };

  const filtered = incidents.filter((inc) => {
    const matchesCat = selectedCategory === 'ALL' || inc.category === selectedCategory;
    const matchesSearch =
      inc.studentName.includes(searchQuery) ||
      inc.description.includes(searchQuery) ||
      inc.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const criticalCount = incidents.filter((i) => i.severity === 'CRITICAL').length;
  const mediumCount = incidents.filter((i) => i.severity === 'MEDIUM').length;
  const lowCount = incidents.filter((i) => i.severity === 'LOW').length;

  return (
    <div className="space-y-3 font-arabic text-slate-800">
      {/* 1. Header */}
      <div className="bg-white border border-slate-200 p-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2.5 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 leading-none">
                  سجل الحوادث والملاحظات السلوكية (Incident Tracker Log)
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-rose-50 text-rose-800 border border-rose-200 font-bold">
                  توثيق قانوني فوري
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                رصد وتوثيق الحوادث والملاحظات الطارئة: السلوك، النوم، اضطرابات الأكل، وصعوبات النطق والتعلم.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-2.5 py-1 text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white flex items-center gap-1 border border-rose-800 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>تسجيل حادثة جديدة</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-2 py-1 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-1 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>طباعة السجل</span>
            </button>
          </div>
        </div>

        {/* 4 Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2 bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 block">إجمالي الوقائع المسجلة</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-slate-900">{incidents.length}</span>
              <span className="text-[10px] text-slate-500 font-mono">سجل رسمي</span>
            </div>
          </div>
          <div className="p-2 bg-rose-50/50 border border-rose-200">
            <span className="text-[10px] font-bold text-rose-800 block">حوادث حرجة (Critical)</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-rose-900">{criticalCount}</span>
              <span className="text-[10px] text-rose-700 font-bold">تتطلب تدخلاً طبياً</span>
            </div>
          </div>
          <div className="p-2 bg-amber-50/50 border border-amber-200">
            <span className="text-[10px] font-bold text-amber-800 block">حالات متوسطة (Medium)</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-amber-900">{mediumCount}</span>
              <span className="text-[10px] text-amber-700">متابعة وإشعار الولي</span>
            </div>
          </div>
          <div className="p-2 bg-blue-50/50 border border-blue-200">
            <span className="text-[10px] font-bold text-blue-800 block">حالات منخفضة (عادية)</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-blue-900">{lowCount}</span>
              <span className="text-[10px] text-blue-700">احتواء داخلي</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filter & Search */}
      <div className="bg-white border border-slate-200 p-2 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute start-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالطفل، وصف الحادثة، الكود..."
              className="w-full ps-8 pe-2 py-1 text-xs border border-slate-200 bg-slate-50/50"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs p-1 border border-slate-200 bg-white font-arabic font-semibold"
          >
            <option value="ALL">كافة تصنيفات الحوادث</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.labelAr}
              </option>
            ))}
          </select>
        </div>
        <div className="text-xs text-slate-500">
          عرض <span className="font-mono font-bold text-slate-800">{filtered.length}</span> حادثة
        </div>
      </div>

      {/* 3. Incidents Grid */}
      <div className="bg-white border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold select-none">
                <th className="py-2 px-2 text-center border-e border-slate-200 w-10">#</th>
                <th className="py-2 px-2 text-center border-e border-slate-200 w-24">كود الواقعة</th>
                <th className="py-2 px-2.5 text-start border-e border-slate-200">الطفل والفوج</th>
                <th className="py-2 px-2 text-center border-e border-slate-200">التصنيف</th>
                <th className="py-2 px-2 text-center border-e border-slate-200 w-20">الخطورة</th>
                <th className="py-2 px-2.5 text-start border-e border-slate-200 min-w-[200px]">
                  تفاصيل ووصف الحادثة
                </th>
                <th className="py-2 px-2.5 text-start border-e border-slate-200 min-w-[180px]">
                  الإجراء المتخذ فوراً
                </th>
                <th className="py-2 px-2 text-center border-e border-slate-200">المبلغ</th>
                <th className="py-2 px-2 text-center w-28">إبلاغ الولي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((inc, idx) => {
                const catLabel = categories.find((c) => c.id === inc.category)?.labelAr || inc.category;
                return (
                  <tr key={inc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-2 text-center font-mono text-slate-500 border-e border-slate-200">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-2 text-center font-mono text-slate-700 font-bold border-e border-slate-200">
                      {inc.id}
                    </td>
                    <td className="py-2 px-2.5 border-e border-slate-200 font-semibold text-slate-900">
                      <div className="flex flex-col">
                        <span>{inc.studentName}</span>
                        <span className="text-[10px] text-slate-500 font-normal font-mono">{inc.timestamp}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center border-e border-slate-200">
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {catLabel}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center border-e border-slate-200">
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-bold border ${
                          inc.severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-900 border-rose-300'
                            : inc.severity === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {inc.severity === 'CRITICAL' ? 'حرج' : inc.severity === 'MEDIUM' ? 'متوسط' : 'عادي'}
                      </span>
                    </td>
                    <td className="py-2 px-2.5 border-e border-slate-200 text-slate-700 leading-relaxed">
                      {inc.description}
                    </td>
                    <td className="py-2 px-2.5 border-e border-slate-200 text-slate-600 bg-slate-50/50">
                      {inc.actionTaken}
                    </td>
                    <td className="py-2 px-2 text-center border-e border-slate-200 text-[10px] text-slate-600">
                      {inc.reportedBy?.split(' ')[1] || 'المربية'}
                    </td>
                    <td className="py-2 px-2 text-center">
                      {inc.parentInformed ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          تم الإبلاغ
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700">
                          <Clock className="w-3 h-3 text-amber-600" />
                          قيد المتابعة
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

      {/* 4. Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-3">
          <div className="bg-white border border-slate-300 shadow-xl w-full max-w-lg p-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-700" />
                <h3 className="text-sm font-bold text-slate-900">تسجيل وتوثيق حادثة جديدة في الروضة</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الطفل المعني بالواقعة *</label>
                <select
                  value={newIncident.studentId}
                  onChange={(e) => setNewIncident({ ...newIncident, studentId: e.target.value })}
                  className="w-full p-1.5 border border-slate-300 bg-white font-arabic focus:border-rose-800"
                  required
                >
                  <option value="">-- اختر الطفل من القائمة --</option>
                  {MOCK_KG_STUDENTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullNameAr} ({s.bookNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">تصنيف الحادثة *</label>
                  <select
                    value={newIncident.category}
                    onChange={(e) => setNewIncident({ ...newIncident, category: e.target.value })}
                    className="w-full p-1.5 border border-slate-300 bg-white font-arabic"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.labelAr}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">مستوى الخطورة *</label>
                  <select
                    value={newIncident.severity}
                    onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value })}
                    className="w-full p-1.5 border border-slate-300 bg-white font-arabic"
                  >
                    <option value="LOW">منخفض (عادي)</option>
                    <option value="MEDIUM">متوسط (يتطلب إشعار الولي)</option>
                    <option value="CRITICAL">حرج (يتطلب فحص طبي)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">وصف الحادثة بالتفصيل *</label>
                <textarea
                  rows={2}
                  value={newIncident.description}
                  onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                  placeholder="وصف موضوعي دقيق لما حدث وتوقيته..."
                  className="w-full p-1.5 border border-slate-300 font-arabic focus:border-rose-800"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الإجراء المتخذ فوراً *</label>
                <textarea
                  rows={2}
                  value={newIncident.actionTaken}
                  onChange={(e) => setNewIncident({ ...newIncident, actionTaken: e.target.value })}
                  placeholder="الإسعاف الأولي، التهدئة، استدعاء المساعدة..."
                  className="w-full p-1.5 border border-slate-300 font-arabic focus:border-rose-800"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="informParent"
                  checked={newIncident.parentInformed}
                  onChange={(e) => setNewIncident({ ...newIncident, parentInformed: e.target.checked })}
                  className="rounded text-rose-700"
                />
                <label htmlFor="informParent" className="font-semibold text-slate-700">
                  تم إبلاغ ولي الأمر فوراً أو إرسال إشعار للمنظومة
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold"
                >
                  تسجيل في السجل الرسمي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
