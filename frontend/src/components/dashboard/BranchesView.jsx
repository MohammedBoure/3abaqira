import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Phone,
  Mail,
  MapPin,
  Users,
  DoorOpen,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Edit3,
  Trash2,
  Layers,
  Sparkles,
  School,
  X,
  Check,
} from 'lucide-react';
import { MOCK_BRANCHES_DETAILED } from '../../mock/mockData';

export function BranchesView({ selectedBranch: globalSelectedBranch, onSelectBranch: onGlobalSelectBranch }) {
  const [branches, setBranches] = useState(MOCK_BRANCHES_DETAILED);
  const [activeBranchId, setActiveBranchId] = useState('CENTER');
  const [isNewBranchModalOpen, setIsNewBranchModalOpen] = useState(false);
  const [isNewRoomModalOpen, setIsNewRoomModalOpen] = useState(false);

  // New Branch Form
  const [newBranchForm, setNewBranchForm] = useState({
    branch_id: '',
    name_ar: '',
    name_en: '',
    branch_type: 'ACADEMY',
    phone: '',
    email: '',
    address: '',
    is_active: true,
  });

  // New Classroom Form
  const [newRoomForm, setNewRoomForm] = useState({
    id: '',
    name: '',
    floor: 'الطابق الأرضي',
    capacity: 20,
    equipment: '',
  });

  const selectedBranchData =
    branches.find((b) => b.branch_id === activeBranchId) || branches[0];

  // Toggle Branch Active Status (PATCH /branches/{id}/status)
  const handleToggleBranchStatus = (branchId) => {
    setBranches((prev) =>
      prev.map((b) =>
        b.branch_id === branchId ? { ...b, is_active: !b.is_active } : b
      )
    );
  };

  // Add Branch Submit (POST /branches)
  const handleCreateBranch = (e) => {
    e.preventDefault();
    if (!newBranchForm.branch_id || !newBranchForm.name_ar) return;

    const newBranch = {
      branch_id: newBranchForm.branch_id.toUpperCase(),
      name_ar: newBranchForm.name_ar,
      name_en: newBranchForm.name_en || newBranchForm.branch_id,
      branch_type: newBranchForm.branch_type,
      phone: newBranchForm.phone || '+213 23 00 00 00',
      email: newBranchForm.email || `${newBranchForm.branch_id.toLowerCase()}@3abaqira.dz`,
      address: newBranchForm.address || 'الجزائر',
      is_active: newBranchForm.is_active,
      founded_year: '2026',
      total_capacity: 100,
      enrolled_count: 0,
      staff_count: 4,
      classrooms_count: 0,
      classrooms: [],
    };

    setBranches([...branches, newBranch]);
    setActiveBranchId(newBranch.branch_id);
    setIsNewBranchModalOpen(false);
    setNewBranchForm({
      branch_id: '',
      name_ar: '',
      name_en: '',
      branch_type: 'ACADEMY',
      phone: '',
      email: '',
      address: '',
      is_active: true,
    });
  };

  // Add Classroom Submit
  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!newRoomForm.name) return;

    const room = {
      id: newRoomForm.id || `R${Date.now().toString().slice(-3)}`,
      name: newRoomForm.name,
      floor: newRoomForm.floor,
      capacity: parseInt(newRoomForm.capacity, 10) || 20,
      current: 0,
      equipment: newRoomForm.equipment || 'مكيف + سبورة بيضاء',
      is_active: true,
    };

    setBranches((prev) =>
      prev.map((b) =>
        b.branch_id === activeBranchId
          ? {
              ...b,
              classrooms_count: b.classrooms_count + 1,
              total_capacity: b.total_capacity + room.capacity,
              classrooms: [...b.classrooms, room],
            }
          : b
      )
    );

    setIsNewRoomModalOpen(false);
    setNewRoomForm({ id: '', name: '', floor: 'الطابق الأرضي', capacity: 20, equipment: '' });
  };

  const totalCapacityAll = branches.reduce((acc, b) => acc + b.total_capacity, 0);
  const totalEnrolledAll = branches.reduce((acc, b) => acc + b.enrolled_count, 0);
  const totalRoomsAll = branches.reduce((acc, b) => acc + b.classrooms_count, 0);

  return (
    <div className="space-y-3 font-arabic">
      {/* 1. Header Ribbon */}
      <div className="bg-white border border-slate-300 p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="eyebrow flex items-center gap-1.5 text-blue-900">
            <Building2 className="w-3.5 h-3.5" />
            <span>المقرات والمرافق التعليمية المعتمدة</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold font-serif text-slate-900 mt-0.5">
            إدارة الفروع والمقرات والقاعات الدراسية (Branches & Facilities)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            إدارة المقرات والمرافق، توزيع القاعات والمخابر، متابعة التجهيزات ونسب استغلال المقاعد.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsNewRoomModalOpen(true)}
            className="button text-xs"
          >
            <DoorOpen className="w-3.5 h-3.5 text-blue-900" />
            <span>إضافة قاعة للفرع الحالي</span>
          </button>
          <button
            onClick={() => setIsNewBranchModalOpen(true)}
            className="button button-primary text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>تسجيل فرع تشغيلي جديد</span>
          </button>
        </div>
      </div>

      {/* 2. Global Metric Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-white border border-slate-300 p-3 border-s-4 border-s-blue-900 shadow-xs">
          <span className="eyebrow">ACTIVE CAMPUSES</span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {branches.length} مقرات تشغيلية
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {branches.filter((b) => b.is_active).length} نشط ومعتمد رسمياً
          </div>
        </div>

        <div className="bg-white border border-slate-300 p-3 border-s-4 border-s-emerald-700 shadow-xs">
          <span className="eyebrow">TOTAL CLASSROOMS</span>
          <div className="text-xl font-bold font-mono text-emerald-800 mt-1">
            {totalRoomsAll} قاعة ومخبر
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            مجهزة بالوسائل البيداغوجية والتقنية
          </div>
        </div>

        <div className="bg-white border border-slate-300 p-3 border-s-4 border-s-amber-600 shadow-xs">
          <span className="eyebrow">OVERALL CAPACITY</span>
          <div className="text-xl font-bold font-mono text-amber-800 mt-1">
            {totalCapacityAll} مقعداً
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            إجمالي استيعاب كافة الفروع
          </div>
        </div>

        <div className="bg-white border border-slate-300 p-3 border-s-4 border-s-slate-700 shadow-xs">
          <span className="eyebrow">GLOBAL OCCUPANCY RATE</span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {Math.round((totalEnrolledAll / (totalCapacityAll || 1)) * 100)}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {totalEnrolledAll} طالباً مسجلاً من أصل {totalCapacityAll}
          </div>
        </div>
      </div>

      {/* 3. Campuses Selector Tabs & Current Campus Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left: Campuses List / Cards */}
        <div className="lg:col-span-1 space-y-2.5">
          <span className="eyebrow px-1 block text-slate-600">REGISTERED CAMPUSES (SELECT TO INSPECT)</span>
          {branches.map((branch) => {
            const isSelected = branch.branch_id === activeBranchId;
            const occupancy = Math.round((branch.enrolled_count / (branch.total_capacity || 1)) * 100);

            return (
              <div
                key={branch.branch_id}
                onClick={() => setActiveBranchId(branch.branch_id)}
                className={`p-3 border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/60 border-blue-900 shadow-xs'
                    : 'bg-white border-slate-300 hover:border-slate-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-blue-900 block">
                      CODE: {branch.branch_id}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 mt-0.5">
                      {branch.name_ar}
                    </h4>
                  </div>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 font-bold uppercase ${
                      branch.branch_type === 'ACADEMY'
                        ? 'bg-blue-900 text-white'
                        : 'bg-emerald-800 text-white'
                    }`}
                  >
                    {branch.branch_type}
                  </span>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs font-mono text-slate-600">
                  <span>{branch.classrooms_count} قاعات</span>
                  <span>{branch.enrolled_count} / {branch.total_capacity} طالب</span>
                  <span className="font-bold text-blue-900">{occupancy}%</span>
                </div>

                {/* Occupancy Progress Bar */}
                <div className="w-full h-1 bg-slate-200 mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-blue-900 transition-all duration-300"
                    style={{ width: `${occupancy}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Selected Campus Detailed Profile & Operational Status */}
        <div className="lg:col-span-2 bg-white border border-slate-300 p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="tag tag-blue font-mono font-bold text-xs">
                    {selectedBranchData.branch_id}
                  </span>
                  <h3 className="font-serif font-bold text-base text-slate-900">
                    {selectedBranchData.name_ar}
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono mt-0.5 block">
                  {selectedBranchData.name_en}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleBranchStatus(selectedBranchData.branch_id)}
                  className={`button text-xs h-7 px-2 ${
                    selectedBranchData.is_active
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-rose-50 text-rose-800 border-rose-300'
                  }`}
                  title="تبديل الحالة التشغيلية (PATCH /branches/{id}/status)"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedBranchData.is_active ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                  <span>{selectedBranchData.is_active ? 'المقر نشط ومفتوح' : 'المقر موقوف مؤقتاً'}</span>
                </button>
              </div>
            </div>

            {/* Campus Coordinates & Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3 text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 flex items-start gap-2">
                <Phone className="w-4 h-4 text-blue-900 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="eyebrow block">هاتف الاستقبال</span>
                  <span className="font-mono text-slate-900">{selectedBranchData.phone}</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 flex items-start gap-2">
                <Mail className="w-4 h-4 text-blue-900 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="eyebrow block">البريد الإلكتروني</span>
                  <span className="font-mono text-slate-900">{selectedBranchData.email}</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-900 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="eyebrow block">العنوان والموقع الجغرافي</span>
                  <span className="text-slate-800 truncate block">{selectedBranchData.address}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>سنة التأسيس: <strong>{selectedBranchData.founded_year}</strong></span>
            <span>عدد الطاقم الإداري والتربوي: <strong>{selectedBranchData.staff_count} إطار</strong></span>
            <span className="text-blue-900 font-mono">API: /branches/{selectedBranchData.branch_id}</span>
          </div>
        </div>
      </div>

      {/* 4. Classrooms & Floor Plan Data Grid (GET /branches/{id}/classrooms) */}
      <div className="bg-white border border-slate-300 shadow-xs">
        <div className="p-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DoorOpen className="w-4 h-4 text-blue-900" />
            <h4 className="font-bold text-xs sm:text-sm text-slate-900">
              قاعات ومخابر: {selectedBranchData.name_ar} ({selectedBranchData.classrooms.length} قاعات)
            </h4>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            سجل القاعات المعتمد
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="excel-table text-xs">
            <thead>
              <tr>
                <th className="excel-th p-2 text-center w-16">كود القاعة</th>
                <th className="excel-th p-2 text-start">اسم القاعة والمجال البيداغوجي</th>
                <th className="excel-th p-2 text-center w-28">الموقع / الطابق</th>
                <th className="excel-th p-2 text-center w-24">السعة القصوى</th>
                <th className="excel-th p-2 text-center w-24">المسجلين حالياً</th>
                <th className="excel-th p-2 text-center w-36">مؤشر الإشغال</th>
                <th className="excel-th p-2 text-start">التجهيزات والوسائل المتوفرة</th>
                <th className="excel-th p-2 text-center w-24">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {selectedBranchData.classrooms.map((room) => {
                const roomOcc = Math.round((room.current / (room.capacity || 1)) * 100);

                return (
                  <tr key={room.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="excel-td p-2 text-center font-mono font-bold text-blue-900">
                      {room.id}
                    </td>
                    <td className="excel-td p-2 font-bold text-slate-900">
                      {room.name}
                    </td>
                    <td className="excel-td p-2 text-center text-slate-600 font-medium">
                      {room.floor}
                    </td>
                    <td className="excel-td p-2 text-center font-mono text-slate-700">
                      {room.capacity} مقعد
                    </td>
                    <td className="excel-td p-2 text-center font-mono font-bold text-emerald-800">
                      {room.current} طالب
                    </td>
                    <td className="excel-td p-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full ${
                              roomOcc > 90 ? 'bg-amber-600' : 'bg-blue-900'
                            }`}
                            style={{ width: `${roomOcc}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] font-semibold w-8 text-end">
                          {roomOcc}%
                        </span>
                      </div>
                    </td>
                    <td className="excel-td p-2 text-slate-600 text-[11px]">
                      {room.equipment}
                    </td>
                    <td className="excel-td p-2 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 border border-emerald-200">
                        <Check className="w-2.5 h-2.5" />
                        <span>جاهزة</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="excel-status-bar p-2 text-slate-600 flex items-center justify-between text-[11px]">
          <span>إجمالي طاقة استيعاب الفرع: <strong>{selectedBranchData.total_capacity} مقعد</strong></span>
          <span className="text-[10px] text-slate-400">ClassroomManager database entity mapped</span>
        </div>
      </div>

      {/* 5. Modal: Add New Branch */}
      {isNewBranchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-3 select-none">
          <div className="bg-white border border-slate-400 max-w-lg w-full shadow-lg">
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-900" />
                <h3 className="font-bold text-sm text-slate-900">
                  تسجيل مقر أو فرع تشغيلي جديد
                </h3>
              </div>
              <button
                onClick={() => setIsNewBranchModalOpen(false)}
                className="icon-button w-6 h-6 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="eyebrow block mb-1 text-slate-700">كود الفرع (Branch ID Code) *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: ANNABA"
                    value={newBranchForm.branch_id}
                    onChange={(e) => setNewBranchForm({ ...newBranchForm, branch_id: e.target.value })}
                    className="w-full h-8 px-2.5 text-xs border border-slate-300 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="eyebrow block mb-1 text-slate-700">تصنيف المقر (Branch Type) *</label>
                  <select
                    value={newBranchForm.branch_type}
                    onChange={(e) => setNewBranchForm({ ...newBranchForm, branch_type: e.target.value })}
                    className="w-full h-8 px-2 text-xs border border-slate-300 bg-white font-mono"
                  >
                    <option value="ACADEMY">ACADEMY (مركز أكاديمي)</option>
                    <option value="DAYCARE">DAYCARE (روضة وحضانة)</option>
                    <option value="HYBRID">HYBRID (مجمع مشترك)</option>
                    <option value="OTHER">OTHER (ملحق تدريبي)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="eyebrow block mb-1 text-slate-700">اسم المقر باللغة العربية *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أكاديمية العباقرة - فرع عنابة"
                  value={newBranchForm.name_ar}
                  onChange={(e) => setNewBranchForm({ ...newBranchForm, name_ar: e.target.value })}
                  className="w-full h-8 px-2.5 text-xs border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="eyebrow block mb-1 text-slate-700">الهاتف الرسمي</label>
                  <input
                    type="text"
                    placeholder="+213 23..."
                    value={newBranchForm.phone}
                    onChange={(e) => setNewBranchForm({ ...newBranchForm, phone: e.target.value })}
                    className="w-full h-8 px-2.5 text-xs border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="eyebrow block mb-1 text-slate-700">البريد الإلكتروني</label>
                  <input
                    type="email"
                    placeholder="branch@3abaqira.dz"
                    value={newBranchForm.email}
                    onChange={(e) => setNewBranchForm({ ...newBranchForm, email: e.target.value })}
                    className="w-full h-8 px-2.5 text-xs border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="eyebrow block mb-1 text-slate-700">العنوان الجغرافي للمقر</label>
                <input
                  type="text"
                  placeholder="المدينة، الحي، الشارع، رقم المبنى..."
                  value={newBranchForm.address}
                  onChange={(e) => setNewBranchForm({ ...newBranchForm, address: e.target.value })}
                  className="w-full h-8 px-2.5 text-xs border border-slate-300"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewBranchModalOpen(false)}
                  className="button text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="button button-primary text-xs"
                >
                  حفظ وتفعيل المقر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal: Add New Classroom */}
      {isNewRoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-3 select-none">
          <div className="bg-white border border-slate-400 max-w-md w-full shadow-lg">
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DoorOpen className="w-4 h-4 text-blue-900" />
                <h3 className="font-bold text-sm text-slate-900">
                  إضافة قاعة تعليمية لـ ({selectedBranchData.name_ar})
                </h3>
              </div>
              <button
                onClick={() => setIsNewRoomModalOpen(false)}
                className="icon-button w-6 h-6 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="p-4 space-y-3">
              <div>
                <label className="eyebrow block mb-1 text-slate-700">اسم القاعة أو المخبر *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: قاعة ابن بطوطة (الفنون واللغات)"
                  value={newRoomForm.name}
                  onChange={(e) => setNewRoomForm({ ...newRoomForm, name: e.target.value })}
                  className="w-full h-8 px-2.5 text-xs border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="eyebrow block mb-1 text-slate-700">الموقع / الطابق</label>
                  <select
                    value={newRoomForm.floor}
                    onChange={(e) => setNewRoomForm({ ...newRoomForm, floor: e.target.value })}
                    className="w-full h-8 px-2 text-xs border border-slate-300 bg-white"
                  >
                    <option value="الطابق الأرضي">الطابق الأرضي</option>
                    <option value="الطابق الأول">الطابق الأول</option>
                    <option value="الطابق الثاني">الطابق الثاني</option>
                    <option value="الجناح الخارجي">الجناح الخارجي</option>
                  </select>
                </div>
                <div>
                  <label className="eyebrow block mb-1 text-slate-700">السعة القصوى (مقاعد) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newRoomForm.capacity}
                    onChange={(e) => setNewRoomForm({ ...newRoomForm, capacity: e.target.value })}
                    className="w-full h-8 px-2.5 text-xs border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="eyebrow block mb-1 text-slate-700">التجهيزات والوسائل</label>
                <input
                  type="text"
                  placeholder="مثال: سبورة ذكية + تكييف هوائي + 20 طاولة فردية"
                  value={newRoomForm.equipment}
                  onChange={(e) => setNewRoomForm({ ...newRoomForm, equipment: e.target.value })}
                  className="w-full h-8 px-2.5 text-xs border border-slate-300"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewRoomModalOpen(false)}
                  className="button text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="button button-primary text-xs"
                >
                  إضافة القاعة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
