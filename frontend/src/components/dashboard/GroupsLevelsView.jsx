import React, { useState } from 'react';
import {
  GraduationCap,
  Layers,
  Plus,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Building2,
  DoorOpen,
  X,
  BookOpen,
} from 'lucide-react';
import { MOCK_GROUPS_LIST, MOCK_LEVELS_LIST } from '../../mock/mockData';

export function GroupsLevelsView() {
  const [groups, setGroups] = useState(MOCK_GROUPS_LIST);
  const [levels, setLevels] = useState(MOCK_LEVELS_LIST);
  const [subTab, setSubTab] = useState('groups'); // 'groups' | 'levels'
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  // New Group Form
  const [groupForm, setGroupForm] = useState({
    group_name: '',
    branch_id: 'CENTER',
    level_name: 'المستوى التمهيدي 1',
    lead_teacher: 'فاطمة الزهراء قدور',
    classroom_name: 'قاعة الخوارزمي',
    max_capacity: 20,
  });

  const totalSeats = groups.reduce((acc, g) => acc + g.max_capacity, 0);
  const totalEnrolled = groups.reduce((acc, g) => acc + g.enrolled_count, 0);

  const handleCreateGroup = (e) => {
    e.preventDefault();
    if (!groupForm.group_name) return;

    const newG = {
      group_id: Date.now(),
      group_name: groupForm.group_name,
      branch_id: groupForm.branch_id,
      level_name: groupForm.level_name,
      lead_teacher: groupForm.lead_teacher,
      classroom_name: groupForm.classroom_name,
      max_capacity: Number(groupForm.max_capacity),
      enrolled_count: 0,
      status: 'ACTIVE',
    };

    setGroups([...groups, newG]);
    setIsGroupModalOpen(false);
    setGroupForm({ group_name: '', branch_id: 'CENTER', level_name: 'المستوى التمهيدي 1', lead_teacher: 'فاطمة الزهراء قدور', classroom_name: 'قاعة الخوارزمي', max_capacity: 20 });
  };

  return (
    <div className="space-y-3 font-arabic">
      {/* 1. Header */}
      <div className="bg-white border border-slate-300 p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="eyebrow flex items-center gap-1.5 text-blue-900">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>الهيكل البيداغوجي والأفواج الدراسية المعتمدة</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold font-serif text-slate-900 mt-0.5">
            إدارة الأفواج، المراحل والمستويات الأكاديمية (Groups & Levels)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            هيكلة الأفواج الدراسية، تخصيص الأساتذة والمدربين، ربط القاعات المادية، ومتابعة نسب الإشغال الاستيعابية.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="view-switch text-xs">
            <button
              onClick={() => setSubTab('groups')}
              className={subTab === 'groups' ? 'active' : ''}
            >
              <Users className="w-3 h-3" />
              <span>الأفواج والأقسام النشطة ({groups.length})</span>
            </button>
            <button
              onClick={() => setSubTab('levels')}
              className={subTab === 'levels' ? 'active' : ''}
            >
              <Layers className="w-3 h-3" />
              <span>المستويات البيداغوجية ({levels.length})</span>
            </button>
          </div>

          <button
            onClick={() => setIsGroupModalOpen(true)}
            className="button button-primary text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إنشاء فوج دراسي جديد</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="bg-white border border-slate-300 p-3 border-s-4 border-s-blue-900 shadow-xs">
          <span className="eyebrow">ACTIVE COHORTS</span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {groups.length} أفواج دراسية
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            موزعة بين المركز الأكاديمي والروضة
          </div>
        </div>

        <div className="bg-white border border-slate-300 p-3 border-s-4 border-s-emerald-700 shadow-xs">
          <span className="eyebrow">TOTAL SEAT CAPACITY</span>
          <div className="text-xl font-bold font-mono text-emerald-800 mt-1">
            {totalSeats} مقعداً
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {totalEnrolled} طالباً مسجلاً حالياً
          </div>
        </div>

        <div className="bg-white border border-slate-300 p-3 border-s-4 border-s-amber-600 shadow-xs">
          <span className="eyebrow">OCCUPANCY EFFICIENCY</span>
          <div className="text-xl font-bold font-mono text-amber-800 mt-1">
            {Math.round((totalEnrolled / (totalSeats || 1)) * 100)}% إشغال
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            معدل استغلال الطاقات الاستيعابية
          </div>
        </div>
      </div>

      {/* 3. Tables Content */}
      {subTab === 'groups' ? (
        <div className="bg-white border border-slate-300 shadow-xs">
          <div className="overflow-x-auto">
            <table className="excel-table text-xs">
              <thead>
                <tr>
                  <th className="excel-th p-2 text-center w-14">#</th>
                  <th className="excel-th p-2 text-start">مسمى الفوج الأكاديمي</th>
                  <th className="excel-th p-2 text-center">المقر</th>
                  <th className="excel-th p-2 text-start">المستوى البيداغوجي</th>
                  <th className="excel-th p-2 text-start">المدرب / الأستاذ المشرف</th>
                  <th className="excel-th p-2 text-start">القاعة الدراسية</th>
                  <th className="excel-th p-2 text-center">المقاعد القصوى</th>
                  <th className="excel-th p-2 text-center">المسجلين</th>
                  <th className="excel-th p-2 text-center">مؤشر الإشغال</th>
                  <th className="excel-th p-2 text-center">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => {
                  const occ = Math.round((g.enrolled_count / (g.max_capacity || 1)) * 100);
                  return (
                    <tr key={g.group_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="excel-td p-2 text-center font-mono text-slate-500">
                        #{g.group_id}
                      </td>
                      <td className="excel-td p-2 font-bold text-slate-900">
                        {g.group_name}
                      </td>
                      <td className="excel-td p-2 text-center font-semibold text-slate-700">
                        {g.branch_id}
                      </td>
                      <td className="excel-td p-2 text-slate-800">
                        {g.level_name}
                      </td>
                      <td className="excel-td p-2 text-slate-900 font-medium">
                        {g.lead_teacher}
                      </td>
                      <td className="excel-td p-2 text-slate-700">
                        {g.classroom_name}
                      </td>
                      <td className="excel-td p-2 text-center font-mono text-slate-600">
                        {g.max_capacity}
                      </td>
                      <td className="excel-td p-2 text-center font-mono font-bold text-emerald-800">
                        {g.enrolled_count}
                      </td>
                      <td className="excel-td p-2 text-center">
                        <div className="flex items-center gap-1.5 justify-center">
                          <div className="w-16 h-1.5 bg-slate-200 overflow-hidden">
                            <div className="h-full bg-blue-900" style={{ width: `${occ}%` }} />
                          </div>
                          <span className="font-mono text-[10px] font-semibold">{occ}%</span>
                        </div>
                      </td>
                      <td className="excel-td p-2 text-center">
                        <span className="tag tag-blue text-[10px]">{g.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="excel-status-bar p-2 text-slate-600 flex items-center justify-between text-[11px]">
            <span>عدد الأفواج: <strong>{groups.length}</strong></span>
            <span className="text-slate-600 font-medium">أفواج معتمدة وموزعة على القاعات</span>
          </div>
        </div>
      ) : (
        /* Levels Tab */
        <div className="bg-white border border-slate-300 shadow-xs">
          <div className="overflow-x-auto">
            <table className="excel-table text-xs">
              <thead>
                <tr>
                  <th className="excel-th p-2 text-center w-20">كود المستوى</th>
                  <th className="excel-th p-2 text-start">البرنامج التعليمي</th>
                  <th className="excel-th p-2 text-start">مسمى المرحلة والمستوى</th>
                  <th className="excel-th p-2 text-center">الحد الأقصى للطلاب</th>
                  <th className="excel-th p-2 text-center">الحالة البيداغوجية</th>
                </tr>
              </thead>
              <tbody>
                {levels.map((l) => (
                  <tr key={l.level_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="excel-td p-2 text-center font-mono font-bold text-blue-900">
                      {l.code}
                    </td>
                    <td className="excel-td p-2 font-bold text-slate-900">
                      {l.program_name}
                    </td>
                    <td className="excel-td p-2 font-semibold text-slate-800">
                      {l.level_name}
                    </td>
                    <td className="excel-td p-2 text-center font-mono text-slate-700">
                      {l.max_students} طالب
                    </td>
                    <td className="excel-td p-2 text-center">
                      <span className="tag text-[10px] text-emerald-800 bg-emerald-50 border-emerald-300">
                        معتمد ونشط
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="excel-status-bar p-2 text-slate-600 flex items-center justify-between text-[11px]">
            <span>إجمالي المستويات: <strong>{levels.length}</strong></span>
            <span className="text-slate-600 font-medium">مستويات معتمدة في البرامج</span>
          </div>
        </div>
      )}

      {/* Modal: Add Group */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-3 select-none">
          <div className="bg-white border border-slate-400 max-w-md w-full shadow-lg">
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-900" />
                <h3 className="font-bold text-sm text-slate-900">
                  إنشاء وتحديد فوج دراسي جديد
                </h3>
              </div>
              <button
                onClick={() => setIsGroupModalOpen(false)}
                className="icon-button w-6 h-6 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-4 space-y-3">
              <div>
                <label className="eyebrow block mb-1 text-slate-700">مسمى الفوج الدراسي *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: فوج السبت صباحاً (أ)"
                  value={groupForm.group_name}
                  onChange={(e) => setGroupForm({ ...groupForm, group_name: e.target.value })}
                  className="w-full h-8 px-2.5 text-xs border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="eyebrow block mb-1 text-slate-700">المقر</label>
                  <select
                    value={groupForm.branch_id}
                    onChange={(e) => setGroupForm({ ...groupForm, branch_id: e.target.value })}
                    className="w-full h-8 px-2 text-xs border border-slate-300 bg-white"
                  >
                    <option value="CENTER">CENTER</option>
                    <option value="RAWDA">RAWDA</option>
                  </select>
                </div>
                <div>
                  <label className="eyebrow block mb-1 text-slate-700">المستوى</label>
                  <input
                    type="text"
                    value={groupForm.level_name}
                    onChange={(e) => setGroupForm({ ...groupForm, level_name: e.target.value })}
                    className="w-full h-8 px-2.5 text-xs border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="eyebrow block mb-1 text-slate-700">المدرب / الأستاذ</label>
                  <input
                    type="text"
                    value={groupForm.lead_teacher}
                    onChange={(e) => setGroupForm({ ...groupForm, lead_teacher: e.target.value })}
                    className="w-full h-8 px-2.5 text-xs border border-slate-300"
                  />
                </div>
                <div>
                  <label className="eyebrow block mb-1 text-slate-700">السعة القصوى</label>
                  <input
                    type="number"
                    value={groupForm.max_capacity}
                    onChange={(e) => setGroupForm({ ...groupForm, max_capacity: e.target.value })}
                    className="w-full h-8 px-2.5 text-xs border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="button text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="button button-primary text-xs"
                >
                  حفظ وتفعيل الفوج
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
