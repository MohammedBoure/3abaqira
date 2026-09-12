import React, { useState } from 'react';
import {
  Trophy,
  Award,
  Users,
  Receipt,
  Plus,
  Search,
  Filter,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  Printer,
  X,
  FileSpreadsheet,
  Coins,
  Sparkles,
} from 'lucide-react';
import { MOCK_COMPETITIONS, MOCK_COMPETITION_REGISTRATIONS } from '../../mock/mockData';

export function CompetitionsView() {
  const [competitions, setCompetitions] = useState(MOCK_COMPETITIONS);
  const [registrations, setRegistrations] = useState(MOCK_COMPETITION_REGISTRATIONS);
  const [activeSubTab, setActiveSubTab] = useState('events'); // 'events' | 'registrations'
  const [scopeFilter, setScopeFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddCompModalOpen, setIsAddCompModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // New Event Form
  const [compForm, setCompForm] = useState({
    name: '',
    scope: 'NATIONAL',
    branch_id: 'CENTER',
    event_date: '2026-05-15',
    location: 'قاعة المؤتمرات الكبرى - الجزائر العاصمة',
    registration_fee: 3500,
    descriptionAr: '',
  });

  // Candidate Registration Form
  const [regForm, setRegForm] = useState({
    competition_name: 'المسابقة الوطنية الكبرى للحساب الذهني 2026',
    competitor_name: '',
    is_internal_student: true,
    division_level: 'المستوى 1 (6-8 سنوات)',
    registration_fee: 3500,
    payment_method: 'CASH',
  });

  const totalCandidates = registrations.length + 188; // total participants
  const grossRevenue = competitions.reduce((acc, c) => acc + (c.total_revenue || 0), 0);
  const activeEventsCount = competitions.filter((c) => c.is_active).length;

  const filteredCompetitions = competitions.filter((c) => {
    const matchesScope = scopeFilter === 'ALL' || c.scope === scopeFilter;
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.location && c.location.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesScope && matchesSearch;
  });

  const filteredRegistrations = registrations.filter((r) => {
    return (
      r.competitor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.receipt_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.competition_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleCreateCompetition = (e) => {
    e.preventDefault();
    if (!compForm.name) return;
    const newComp = {
      competition_id: Date.now(),
      ...compForm,
      registration_fee: parseFloat(compForm.registration_fee) || 0,
      total_candidates: 0,
      total_revenue: 0,
      is_active: true,
    };
    setCompetitions([newComp, ...competitions]);
    setIsAddCompModalOpen(false);
    setCompForm({
      name: '',
      scope: 'NATIONAL',
      branch_id: 'CENTER',
      event_date: '2026-05-15',
      location: 'قاعة المؤتمرات الكبرى - الجزائر العاصمة',
      registration_fee: 3500,
      descriptionAr: '',
    });
  };

  const handleRegisterCandidate = (e) => {
    e.preventDefault();
    if (!regForm.competitor_name) return;
    const newReg = {
      registration_id: Date.now(),
      competition_name: regForm.competition_name,
      receipt_code: `CMP-CENTER-2026-${Date.now().toString().slice(-5)}`,
      competitor_name: regForm.competitor_name,
      is_internal_student: regForm.is_internal_student,
      division_level: regForm.division_level,
      registration_fee: parseFloat(regForm.registration_fee) || 3500,
      payment_status: 'PAID',
      registration_date: new Date().toISOString().substring(0, 10),
    };
    setRegistrations([newReg, ...registrations]);
    setIsRegisterModalOpen(false);
    setSelectedReceipt(newReg);
    setRegForm({
      competition_name: 'المسابقة الوطنية الكبرى للحساب الذهني 2026',
      competitor_name: '',
      is_internal_student: true,
      division_level: 'المستوى 1 (6-8 سنوات)',
      registration_fee: 3500,
      payment_method: 'CASH',
    });
  };

  return (
    <div className="space-y-3 font-arabic">
      {/* 1. Module Header */}
      <div className="bg-white border border-slate-300 p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="eyebrow flex items-center gap-1.5 text-blue-900">
            <Trophy className="w-3.5 h-3.5" />
            <span>سجل المسابقات والبطولات الرسمية</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold font-serif text-slate-900 mt-0.5">
            المسابقات الوطنية والبطولات وتوليد الوصولات (Competitions Registry)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            إعداد المسابقات الكبرى، تسجيل المترشحين الداخليين والأحرار، إصدار وصولات الاستلام الرسمية (CMP-XXXXX)، وربط العائدات بالصندوق فورياً.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="view-switch text-xs">
            <button
              onClick={() => setActiveSubTab('events')}
              className={activeSubTab === 'events' ? 'active' : ''}
            >
              <Trophy className="w-3 h-3" />
              <span>دليل البطولات والمسابقات</span>
            </button>
            <button
              onClick={() => setActiveSubTab('registrations')}
              className={activeSubTab === 'registrations' ? 'active' : ''}
            >
              <Users className="w-3 h-3" />
              <span>سجل المترشحين والوصولات</span>
            </button>
          </div>

          {activeSubTab === 'events' ? (
            <button
              onClick={() => setIsAddCompModalOpen(true)}
              className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-medium text-xs rounded flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>تهيئة مسابقة جديدة</span>
            </button>
          ) : (
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs rounded flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>تسجيل مترشح جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Key Operational Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="bg-white border border-slate-300 p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">البطولات النشطة</span>
            <Trophy className="w-4 h-4 text-blue-900" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-slate-900">{activeEventsCount}</span>
            <span className="tag-blue text-[10px]">استقبال التسجيلات</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">مسابقات وطنية وجهوية مبرمجة</p>
        </div>

        <div className="bg-white border border-slate-300 p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">إجمالي المترشحين</span>
            <Users className="w-4 h-4 text-indigo-700" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-indigo-700">{totalCandidates}</span>
            <span className="text-[11px] text-slate-600 font-medium">مشارك مؤكد</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">منهم 142 في البطولة الوطنية</p>
        </div>

        <div className="bg-white border border-slate-300 p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">إجمالي حقوق المشاركة</span>
            <Coins className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-emerald-700">
              {grossRevenue.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-600 font-bold">دج</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">مقيدة تلقائياً في حركة الخزينة</p>
        </div>

        <div className="bg-white border border-slate-300 p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">الوصولات الرسمية المصدرة</span>
            <Receipt className="w-4 h-4 text-blue-950" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-slate-900">{registrations.length}</span>
            <span className="text-[11px] text-slate-600 font-medium">وصل رقمي</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">وفق كود CMP-BRANCH-YYYY</p>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="bg-white border border-slate-300 p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs shadow-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="بحث بالمسابقة، اسم المترشح، أو رقم الوصل..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-8 pl-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-blue-900 focus:outline-none"
            />
          </div>
        </div>

        {activeSubTab === 'events' && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="text-slate-400 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <span>نطاق الحدث:</span>
            </span>
            {['ALL', 'NATIONAL', 'REGIONAL', 'WILAYA', 'INTERNAL'].map((scope) => (
              <button
                key={scope}
                onClick={() => setScopeFilter(scope)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  scopeFilter === scope
                    ? 'bg-blue-900 text-white font-medium'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {scope === 'ALL'
                  ? 'الكل'
                  : scope === 'NATIONAL'
                  ? 'وطنية'
                  : scope === 'REGIONAL'
                  ? 'جهوية'
                  : scope === 'WILAYA'
                  ? 'ولائية'
                  : 'داخلية'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4. Sub-Tab 1: Competitions Master List */}
      {activeSubTab === 'events' && (
        <div className="bg-white border border-slate-300 shadow-xs overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-300 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-semibold text-slate-700">
              <Trophy className="w-4 h-4 text-blue-900" />
              <span>دليل البطولات والفعاليات الرسمية (Master Events Catalog)</span>
            </div>
            <span className="text-slate-500 font-mono">{filteredCompetitions.length} مسابقات</span>
          </div>

          <div className="overflow-x-auto">
            <table className="excel-table text-xs w-full">
              <thead>
                <tr>
                  <th className="w-12 text-center">#</th>
                  <th>عنوان المسابقة / البطولة</th>
                  <th>النطاق</th>
                  <th>التاريخ والموقع</th>
                  <th className="text-left">رسوم التسجيل (دج)</th>
                  <th className="text-center">المترشحين المسجلين</th>
                  <th className="text-left">العائد الإجمالي (دج)</th>
                  <th className="text-center">الحالة</th>
                  <th className="text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompetitions.map((comp, idx) => (
                  <tr key={comp.competition_id} className="hover:bg-blue-50/40">
                    <td className="text-center font-mono text-slate-400">{idx + 1}</td>
                    <td>
                      <div className="font-bold text-slate-900">{comp.name}</div>
                      <div className="text-[11px] text-slate-500">{comp.descriptionAr}</div>
                    </td>
                    <td>
                      <span className="tag-blue text-[10px]">
                        {comp.scope === 'NATIONAL'
                          ? 'بطولة وطنية'
                          : comp.scope === 'REGIONAL'
                          ? 'تصفيات جهوية'
                          : comp.scope}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 font-mono text-slate-700">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{comp.event_date}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{comp.location}</span>
                      </div>
                    </td>
                    <td className="text-left font-mono font-bold text-slate-900">
                      {comp.registration_fee.toLocaleString()} دج
                    </td>
                    <td className="text-center font-mono font-bold text-blue-900">
                      {comp.total_candidates} مرشح
                    </td>
                    <td className="text-left font-mono font-bold text-emerald-700">
                      {comp.total_revenue.toLocaleString()} دج
                    </td>
                    <td className="text-center">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                        نشطة ومفتوحة
                      </span>
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => {
                          setRegForm({
                            ...regForm,
                            competition_name: comp.name,
                            registration_fee: comp.registration_fee,
                          });
                          setIsRegisterModalOpen(true);
                        }}
                        className="px-2 py-1 bg-blue-900 hover:bg-blue-800 text-white rounded text-[11px] font-medium"
                      >
                        تسجيل مترشح
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Sub-Tab 2: Candidate Registrations & Receipts */}
      {activeSubTab === 'registrations' && (
        <div className="bg-white border border-slate-300 shadow-xs overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-300 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-semibold text-slate-700">
              <Receipt className="w-4 h-4 text-blue-900" />
              <span>كشف تسجيلات المترشحين ووصولات السداد (Candidates Roster & Vouchers)</span>
            </div>
            <span className="text-slate-500 font-mono">{filteredRegistrations.length} مترشح</span>
          </div>

          <div className="overflow-x-auto">
            <table className="excel-table text-xs w-full">
              <thead>
                <tr>
                  <th className="w-12 text-center">#</th>
                  <th>رقم الوصل الرسمي</th>
                  <th>اسم المترشح</th>
                  <th>الصفة</th>
                  <th>المسابقة</th>
                  <th>الفئة العمرية / المستوى</th>
                  <th className="text-left">حقوق المشاركة</th>
                  <th className="text-center">حالة السداد</th>
                  <th className="text-center">تاريخ التسجيل</th>
                  <th className="text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((reg, idx) => (
                  <tr key={reg.registration_id} className="hover:bg-blue-50/40">
                    <td className="text-center font-mono text-slate-400">{idx + 1}</td>
                    <td className="font-mono font-bold text-blue-950">
                      {reg.receipt_code}
                    </td>
                    <td className="font-bold text-slate-900">{reg.competitor_name}</td>
                    <td>
                      {reg.is_internal_student ? (
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded text-[10px] font-bold">
                          طالب بالأكاديمية
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded text-[10px] font-bold">
                          مترشح خارجي حر
                        </span>
                      )}
                    </td>
                    <td className="text-slate-700 max-w-xs truncate" title={reg.competition_name}>
                      {reg.competition_name}
                    </td>
                    <td className="font-medium text-slate-800">{reg.division_level}</td>
                    <td className="text-left font-mono font-bold text-slate-900">
                      {reg.registration_fee.toLocaleString()} دج
                    </td>
                    <td className="text-center">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                        تم السداد نقداً
                      </span>
                    </td>
                    <td className="text-center font-mono text-slate-600">
                      {reg.registration_date}
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => setSelectedReceipt(reg)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-[11px] inline-flex items-center gap-1"
                      >
                        <Printer className="w-3 h-3" />
                        <span>طباعة الوصل</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Modal: Create Competition */}
      {isAddCompModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-300 w-full max-w-md shadow-2xl rounded p-4 font-arabic">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-1.5 text-blue-950 font-bold text-sm">
                <Trophy className="w-4 h-4 text-blue-800" />
                <span>تهيئة مسابقة رسمية جديدة (Create Competition)</span>
              </div>
              <button
                onClick={() => setIsAddCompModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCompetition} className="space-y-3 mt-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">اسم المسابقة / البطولة</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: البطولة الولائية للروبوتيك والذكاء الاصطناعي 2026"
                  value={compForm.name}
                  onChange={(e) => setCompForm({ ...compForm, name: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">نطاق المسابقة</label>
                  <select
                    value={compForm.scope}
                    onChange={(e) => setCompForm({ ...compForm, scope: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none"
                  >
                    <option value="NATIONAL">وطنية (National)</option>
                    <option value="REGIONAL">جهوية (Regional)</option>
                    <option value="WILAYA">ولائية (Wilaya)</option>
                    <option value="INTERNAL">داخلية للأكاديمية (Internal)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">رسوم التسجيل (دج)</label>
                  <input
                    type="number"
                    required
                    value={compForm.registration_fee}
                    onChange={(e) => setCompForm({ ...compForm, registration_fee: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">تاريخ الفعالية</label>
                  <input
                    type="date"
                    required
                    value={compForm.event_date}
                    onChange={(e) => setCompForm({ ...compForm, event_date: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">الفرع المسؤول</label>
                  <select
                    value={compForm.branch_id}
                    onChange={(e) => setCompForm({ ...compForm, branch_id: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none"
                  >
                    <option value="CENTER">المركز الأكاديمي</option>
                    <option value="RAWDA">روضة العباقرة</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">مكان إقامة الفعالية</label>
                <input
                  type="text"
                  required
                  value={compForm.location}
                  onChange={(e) => setCompForm({ ...compForm, location: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">وصف موجز وشروط المشاركة</label>
                <textarea
                  rows="2"
                  value={compForm.descriptionAr}
                  onChange={(e) => setCompForm({ ...compForm, descriptionAr: e.target.value })}
                  placeholder="الفئات المستهدفة، مراحل التصفيات، الجوائز..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddCompModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-600 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded font-medium shadow-xs"
                >
                  حفظ وفتح التسجيل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Modal: Register Candidate */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-300 w-full max-w-md shadow-2xl rounded p-4 font-arabic">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-1.5 text-emerald-950 font-bold text-sm">
                <Users className="w-4 h-4 text-emerald-700" />
                <span>تسجيل مترشح بالمسابقة (Register Candidate)</span>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterCandidate} className="space-y-3 mt-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">المسابقة المستهدفة</label>
                <select
                  value={regForm.competition_name}
                  onChange={(e) => setRegForm({ ...regForm, competition_name: e.target.value })}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none"
                >
                  {competitions.map((c) => (
                    <option key={c.competition_id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">اسم ولقب المترشح</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ياسمين بن علي"
                  value={regForm.competitor_name}
                  onChange={(e) => setRegForm({ ...regForm, competitor_name: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">صفة المشارك</label>
                  <select
                    value={regForm.is_internal_student ? 'INTERNAL' : 'EXTERNAL'}
                    onChange={(e) =>
                      setRegForm({
                        ...regForm,
                        is_internal_student: e.target.value === 'INTERNAL',
                      })
                    }
                    className="w-full px-2 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none"
                  >
                    <option value="INTERNAL">طالب مسجل بالأكاديمية</option>
                    <option value="EXTERNAL">مترشح خارجي حر</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">المستوى / الفئة</label>
                  <select
                    value={regForm.division_level}
                    onChange={(e) => setRegForm({ ...regForm, division_level: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none"
                  >
                    <option value="المستوى 1 (6-8 سنوات)">المستوى 1 (6-8 سنوات)</option>
                    <option value="المستوى 2 (8-10 سنوات)">المستوى 2 (8-10 سنوات)</option>
                    <option value="المستوى 3 (10-14 سنة)">المستوى 3 (10-14 سنة)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">حقوق التسجيل (دج)</label>
                  <input
                    type="number"
                    value={regForm.registration_fee}
                    onChange={(e) => setRegForm({ ...regForm, registration_fee: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">طريقة الدفع</label>
                  <select
                    value={regForm.payment_method}
                    onChange={(e) => setRegForm({ ...regForm, payment_method: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none"
                  >
                    <option value="CASH">نقداً في الصندوق (Cash)</option>
                    <option value="BANK_TRANSFER">تحويل بنكي / CCP</option>
                  </select>
                </div>
              </div>

              <div className="p-2 bg-emerald-50/50 border border-emerald-200 rounded text-[11px] text-emerald-900">
                <div className="flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>توليد كود الوصل وقيد الصندوق:</span>
                </div>
                <p className="mt-0.5 text-slate-600">
                  سيتم إنشاء سند استلام فوري CMP-CENTER-2026-XXXXX وإضافة المبلغ لمقبوضات الصندوق اليومي.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-600 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-medium shadow-xs"
                >
                  تأكيد وطباعة الوصل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Receipt Voucher Printable Preview */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-400 w-full max-w-md shadow-2xl rounded p-5 font-arabic">
            <div className="flex items-center justify-between border-b border-slate-300 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-blue-900" />
                <div>
                  <h3 className="font-serif font-bold text-slate-900 text-sm">أكاديمية الأطفال العباقرة</h3>
                  <p className="text-[10px] text-slate-500 font-mono">3ABAQIRA OFFICIAL VOUCHER</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 p-3 bg-slate-50 border border-dashed border-slate-300 rounded space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>رقم الوصل:</span>
                <span className="font-mono font-bold text-blue-950">{selectedReceipt.receipt_code}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>تاريخ الإصدار:</span>
                <span className="font-mono text-slate-900">{selectedReceipt.registration_date}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>اسم المترشح:</span>
                <span className="font-bold text-slate-900">{selectedReceipt.competitor_name}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>المسابقة:</span>
                <span className="font-medium text-slate-900">{selectedReceipt.competition_name}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>الفئة المعتمدة:</span>
                <span className="text-slate-900">{selectedReceipt.division_level}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                <span className="font-bold text-slate-900">المبلغ المقبوض:</span>
                <span className="text-sm font-mono font-bold text-emerald-700">
                  {selectedReceipt.registration_fee.toLocaleString()} دج
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200 pt-3">
              <span>خاتم وتوقيع إدارة الأكاديمية</span>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-3 py-1.5 bg-blue-900 text-white rounded flex items-center gap-1 font-medium hover:bg-blue-800"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة الوصل الآن</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
