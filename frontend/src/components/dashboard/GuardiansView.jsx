import React, { useState } from 'react';
import {
  Users,
  Phone,
  MessageSquare,
  Search,
  Filter,
  Plus,
  UserCheck,
  MapPin,
  Mail,
  Shield,
  X,
  FileText,
  ExternalLink,
  GraduationCap,
} from 'lucide-react';
import { MOCK_GUARDIANS } from '../../mock/mockData';

export function GuardiansView() {
  const [guardians, setGuardians] = useState(MOCK_GUARDIANS);
  const [searchTerm, setSearchTerm] = useState('');
  const [relationshipFilter, setRelationshipFilter] = useState('ALL');
  const [isAddGuardianModalOpen, setIsAddGuardianModalOpen] = useState(false);
  const [selectedGuardianForWards, setSelectedGuardianForWards] = useState(null);

  // New Guardian Form
  const [guardianForm, setGuardianForm] = useState({
    full_name_ar: '',
    full_name_fr: '',
    relationship: 'الأب (Father)',
    phone_primary: '',
    phone_secondary: '',
    national_id: '',
    address: 'الجزائر العاصمة',
    email: '',
    notes: '',
  });

  const totalGuardians = guardians.length;
  const totalWards = guardians.reduce((acc, g) => acc + (g.wards_count || 0), 0);
  const verifiedNinCount = guardians.filter((g) => g.national_id).length;
  const ninCoverageRate = totalGuardians > 0 ? Math.round((verifiedNinCount / totalGuardians) * 100) : 0;

  const filteredGuardians = guardians.filter((g) => {
    const matchesRel =
      relationshipFilter === 'ALL' ||
      g.relationship.includes(relationshipFilter);
    const matchesSearch =
      g.full_name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.full_name_fr && g.full_name_fr.toLowerCase().includes(searchTerm.toLowerCase())) ||
      g.phone_primary.includes(searchTerm) ||
      (g.phone_secondary && g.phone_secondary.includes(searchTerm)) ||
      (g.national_id && g.national_id.includes(searchTerm)) ||
      (g.wards_names && g.wards_names.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesRel && matchesSearch;
  });

  const handleCreateGuardian = (e) => {
    e.preventDefault();
    if (!guardianForm.full_name_ar || !guardianForm.phone_primary) return;
    const newEntry = {
      guardian_id: Date.now(),
      ...guardianForm,
      wards_count: 0,
      wards_names: 'قيد ربط الملف المدرسي',
    };
    setGuardians([newEntry, ...guardians]);
    setIsAddGuardianModalOpen(false);
    setGuardianForm({
      full_name_ar: '',
      full_name_fr: '',
      relationship: 'الأب (Father)',
      phone_primary: '',
      phone_secondary: '',
      national_id: '',
      address: 'الجزائر العاصمة',
      email: '',
      notes: '',
    });
  };

  return (
    <div className="space-y-3 font-arabic">
      {/* 1. Module Header */}
      <div className="bg-white border border-slate-300 p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="eyebrow flex items-center gap-1.5 text-blue-900">
            <Users className="w-3.5 h-3.5" />
            <span>GUARDIANS & PARENTS REGISTRY / backend/apis/guardians.py</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold font-serif text-slate-900 mt-0.5">
            سجل أولياء الأمور وجهات الاتصال (Guardians Master Directory)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            دليل آباء وأمهات الطلاب، أرقام التواصل الأساسية والاحتياطية، ربط الأبناء، والتحقق من الهوية الوطنية وتفويض الاستلام.
          </p>
        </div>

        <button
          onClick={() => setIsAddGuardianModalOpen(true)}
          className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-medium text-xs rounded flex items-center gap-1.5 shadow-xs transition-colors self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>تسجيل ولي أمر جديد</span>
        </button>
      </div>

      {/* 2. Key Operational Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="bg-white border border-slate-300 p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">أولياء الأمور المسجلين</span>
            <Users className="w-4 h-4 text-blue-900" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-slate-900">{totalGuardians}</span>
            <span className="text-[11px] text-blue-900 font-medium">ملف رسمي</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">جهات اتصال معتمدة للطلبة</p>
        </div>

        <div className="bg-white border border-slate-300 p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">الأبناء والقصّر المربوطين</span>
            <GraduationCap className="w-4 h-4 text-indigo-700" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-indigo-700">{totalWards}</span>
            <span className="text-[11px] text-slate-600 font-medium">طالب متمدرس</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">تغطية كافة المسجلين بالأفواج</p>
        </div>

        <div className="bg-white border border-slate-300 p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">جاهزية التواصل الفوري</span>
            <Phone className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-emerald-700">100%</span>
            <span className="tag-blue text-[10px]">واتساب وهاتف</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">أرقام محققة ومربوطة بالإشعارات</p>
        </div>

        <div className="bg-white border border-slate-300 p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">توثيق بطاقة الهوية (NIN)</span>
            <Shield className="w-4 h-4 text-blue-950" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-slate-900">{ninCoverageRate}%</span>
            <span className="text-[11px] text-slate-600 font-medium">مكتمل</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{verifiedNinCount} من {totalGuardians} ملف مدقق</p>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="bg-white border border-slate-300 p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs shadow-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="بحث بالاسم، رقم الهاتف، رقم الهوية، أو اسم الطالب..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-8 pl-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-blue-900 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="text-slate-400 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>الصفة:</span>
          </span>
          {['ALL', 'الأب', 'الأم', 'ولي'].map((rel) => (
            <button
              key={rel}
              onClick={() => setRelationshipFilter(rel)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                relationshipFilter === rel
                  ? 'bg-blue-900 text-white font-medium'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {rel === 'ALL' ? 'الكل' : rel}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Guardians Table */}
      <div className="bg-white border border-slate-300 shadow-xs overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-300 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <Users className="w-4 h-4 text-blue-900" />
            <span>قائمة أولياء الأمور وبيانات الاتصال والأبناء (Guardians Ledger)</span>
          </div>
          <span className="text-slate-500 font-mono">{filteredGuardians.length} ولي أمر</span>
        </div>

        <div className="overflow-x-auto">
          <table className="excel-table text-xs w-full">
            <thead>
              <tr>
                <th className="w-12 text-center">#</th>
                <th>اسم ولي الأمر (عربي / فرنسي)</th>
                <th>الصفة العائلية</th>
                <th>الهاتف الأساسي</th>
                <th>الهاتف الثانوي / واتساب</th>
                <th>رقم التعريف الوطني (NIN)</th>
                <th>العنوان السكني</th>
                <th className="text-center">الأبناء المسجلين</th>
                <th className="text-center">إجراءات سريعة</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuardians.map((g, idx) => (
                <tr key={g.guardian_id} className="hover:bg-blue-50/40">
                  <td className="text-center font-mono text-slate-400">{idx + 1}</td>
                  <td>
                    <div className="font-bold text-slate-900">{g.full_name_ar}</div>
                    {g.full_name_fr && (
                      <div className="text-[11px] text-slate-500 font-mono">{g.full_name_fr}</div>
                    )}
                  </td>
                  <td>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 rounded text-[11px] font-medium">
                      {g.relationship}
                    </span>
                  </td>
                  <td className="font-mono font-semibold text-blue-950">
                    <a
                      href={`tel:${g.phone_primary}`}
                      className="hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3 text-emerald-600" />
                      <span>{g.phone_primary}</span>
                    </a>
                  </td>
                  <td className="font-mono text-slate-600">
                    {g.phone_secondary ? (
                      <a
                        href={`https://wa.me/213${g.phone_secondary.replace(/[^0-9]/g, '').slice(-9)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline text-emerald-800 flex items-center gap-1"
                      >
                        <MessageSquare className="w-3 h-3 text-emerald-600" />
                        <span>{g.phone_secondary}</span>
                      </a>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="font-mono text-slate-700">
                    {g.national_id ? (
                      <span className="px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded">
                        {g.national_id}
                      </span>
                    ) : (
                      <span className="text-amber-600 text-[11px]">غير مدخل</span>
                    )}
                  </td>
                  <td className="text-slate-600 max-w-xs truncate" title={g.address}>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{g.address || 'الجزائر'}</span>
                    </div>
                  </td>
                  <td className="text-center">
                    <button
                      onClick={() => setSelectedGuardianForWards(g)}
                      className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded text-[11px] font-bold"
                    >
                      {g.wards_count} طلاب ({g.wards_names})
                    </button>
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <a
                        href={`tel:${g.phone_primary}`}
                        title="اتصال هاتفي"
                        className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300"
                      >
                        <Phone className="w-3 h-3 text-blue-800" />
                      </a>
                      <button
                        onClick={() => setSelectedGuardianForWards(g)}
                        title="عرض كشف الأبناء"
                        className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300"
                      >
                        <FileText className="w-3 h-3 text-slate-700" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Modal: Add Guardian */}
      {isAddGuardianModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-300 w-full max-w-md shadow-2xl rounded p-4 font-arabic">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-1.5 text-blue-950 font-bold text-sm">
                <Plus className="w-4 h-4 text-blue-800" />
                <span>تسجيل ولي أمر جديد (Add Guardian Profile)</span>
              </div>
              <button
                onClick={() => setIsAddGuardianModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGuardian} className="space-y-3 mt-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">الاسم واللقب (بالعربية)</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: يوسف بلخير"
                    value={guardianForm.full_name_ar}
                    onChange={(e) => setGuardianForm({ ...guardianForm, full_name_ar: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">الاسم باللاتينية (اختياري)</label>
                  <input
                    type="text"
                    placeholder="Youcef Belkheir"
                    value={guardianForm.full_name_fr}
                    onChange={(e) => setGuardianForm({ ...guardianForm, full_name_fr: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">الصفة العائلية</label>
                  <select
                    value={guardianForm.relationship}
                    onChange={(e) => setGuardianForm({ ...guardianForm, relationship: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none"
                  >
                    <option value="الأب (Father)">الأب (Father)</option>
                    <option value="الأم (Mother)">الأم (Mother)</option>
                    <option value="ولي أمر شرعي (Guardian)">ولي أمر شرعي (Guardian)</option>
                    <option value="الجد / الجدة (Grandparent)">الجد / الجدة (Grandparent)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">رقم التعريف الوطني (NIN)</label>
                  <input
                    type="text"
                    placeholder="18 رقماً"
                    value={guardianForm.national_id}
                    onChange={(e) => setGuardianForm({ ...guardianForm, national_id: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">الهاتف الأساسي</label>
                  <input
                    type="tel"
                    required
                    placeholder="0550123456"
                    value={guardianForm.phone_primary}
                    onChange={(e) => setGuardianForm({ ...guardianForm, phone_primary: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">هاتف احتياطي / واتساب</label>
                  <input
                    type="tel"
                    placeholder="0661987654"
                    value={guardianForm.phone_secondary}
                    onChange={(e) => setGuardianForm({ ...guardianForm, phone_secondary: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">العنوان السكني</label>
                <input
                  type="text"
                  value={guardianForm.address}
                  onChange={(e) => setGuardianForm({ ...guardianForm, address: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">البريد الإلكتروني (اختياري)</label>
                <input
                  type="email"
                  placeholder="parent@email.dz"
                  value={guardianForm.email}
                  onChange={(e) => setGuardianForm({ ...guardianForm, email: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddGuardianModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-600 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded font-medium shadow-xs"
                >
                  حفظ بطاقة ولي الأمر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal: Linked Student Wards Inspection */}
      {selectedGuardianForWards && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-300 w-full max-w-lg shadow-2xl rounded p-4 font-arabic">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-1.5 text-blue-950 font-bold text-sm">
                <GraduationCap className="w-4 h-4 text-blue-800" />
                <span>كشف الأبناء المتمدرسين: {selectedGuardianForWards.full_name_ar}</span>
              </div>
              <button
                onClick={() => setSelectedGuardianForWards(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 text-xs space-y-2">
              <div className="bg-slate-50 p-2.5 border border-slate-200 flex flex-wrap justify-between gap-2 text-slate-600 rounded">
                <span>الهاتف: <b className="font-mono text-slate-900">{selectedGuardianForWards.phone_primary}</b></span>
                <span>الصفة: <b className="text-slate-900">{selectedGuardianForWards.relationship}</b></span>
                <span>NIN: <b className="font-mono text-slate-900">{selectedGuardianForWards.national_id || 'غير مدخل'}</b></span>
              </div>

              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-2 text-right">اسم الطالب</th>
                      <th className="p-2 text-right">البرنامج والفوج</th>
                      <th className="p-2 text-center">حالة السداد</th>
                      <th className="p-2 text-center">تفويض الاستلام</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="hover:bg-slate-50">
                      <td className="p-2 font-bold text-slate-900">
                        {selectedGuardianForWards.wards_names.split('،')[0] || selectedGuardianForWards.wards_names}
                      </td>
                      <td className="p-2 text-slate-700">سوروبان الفوج أ1 (المستوى 1)</td>
                      <td className="p-2 text-center">
                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                          مسدد بالكامل
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <span className="tag-blue text-[10px]">مفوض رسمي ✓</span>
                      </td>
                    </tr>
                    {selectedGuardianForWards.wards_count > 1 && (
                      <tr className="hover:bg-slate-50">
                        <td className="p-2 font-bold text-slate-900">
                          {selectedGuardianForWards.wards_names.split('،')[1] || 'ياسمين بن علي'}
                        </td>
                        <td className="p-2 text-slate-700">روضة الأطفال (قسم التحضيري)</td>
                        <td className="p-2 text-center">
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                            مسدد بالكامل
                          </span>
                        </td>
                        <td className="p-2 text-center">
                          <span className="tag-blue text-[10px]">مفوض رسمي ✓</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 mt-3">
              <button
                onClick={() => setSelectedGuardianForWards(null)}
                className="px-3 py-1.5 bg-blue-900 text-white text-xs rounded hover:bg-blue-800"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
