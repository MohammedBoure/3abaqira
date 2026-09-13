import React, { useState, useMemo } from 'react';
import {
  Layers,
  Users,
  Building,
  ArrowLeftRight,
  Plus,
  X,
  Edit2,
  Trash2,
  Search,
  Info,
  HelpCircle,
  Calendar,
  Check,
  UserPlus,
  UserX,
  Filter,
  MoveRight,
} from 'lucide-react';
import { MOCK_RAWDA_ROOMS, MOCK_RAWDA_STUDENTS } from '../../../mock/rawdaMockData';

export function RawdaCohortsKanbanView() {
  const [rooms, setRooms] = useState(MOCK_RAWDA_ROOMS);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('2025-2026');

  // Modals state
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isNewRoomModalOpen, setIsNewRoomModalOpen] = useState(false);
  const [addingToRoomId, setAddingToRoomId] = useState(null); // When opening helper list to add student to this room
  const [movingChild, setMovingChild] = useState(null); // { child, fromRoomId }
  const [targetRoomId, setTargetRoomId] = useState('');

  // Helper list search term inside Add Student to Cohort modal
  const [helperSearch, setHelperSearch] = useState('');

  // New Cohort Form
  const [newRoomData, setNewRoomData] = useState({
    name: '',
    category: 'Petit Section',
    maxCapacity: 15,
  });

  // 1. KPI Calculations
  const totalRooms = rooms.length;
  const totalChildren = rooms.reduce((acc, r) => acc + r.children.length, 0);
  const totalCapacity = rooms.reduce((acc, r) => acc + r.maxCapacity, 0);
  const occupancyRate = totalCapacity > 0 ? Math.round((totalChildren / totalCapacity) * 100) : 0;

  const kpiCards = [
    {
      label: 'إجمالي الأفواج والقاعات',
      value: `${totalRooms} أفواج`,
      icon: Building,
      subtext: 'Bébé, Petit, Moyen, Grand Sections',
      change: '100% جاهزة',
      isPositive: true,
    },
    {
      label: 'إجمالي الأطفال الموزعين',
      value: `${totalChildren} طفل`,
      icon: Users,
      subtext: 'موزعين على الأفواج المعتمدة',
      change: '+4 موزعين',
      isPositive: true,
    },
    {
      label: 'السعة الاستيعابية المتاحة',
      value: `${totalCapacity} مقعد`,
      icon: Layers,
      subtext: 'الحد الأقصى المعتمد',
      change: 'معياري',
      isPositive: true,
    },
    {
      label: 'معدل إشغال الأفواج',
      value: `${occupancyRate}%`,
      icon: Users,
      subtext: `${totalCapacity - totalChildren} مقعد شاغر`,
      change: `${occupancyRate}% إشغال`,
      isPositive: occupancyRate < 95,
    },
  ];

  // 2. Filter Rooms
  const filteredRooms = useMemo(() => {
    return rooms
      .map((room) => {
        const matchCategory = activeCategory === 'ALL' || room.category === activeCategory;
        if (!matchCategory) return null;

        const matchingChildren = room.children.filter((c) => {
          if (!searchTerm) return true;
          return (
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.contact && c.contact.includes(searchTerm))
          );
        });

        return {
          ...room,
          displayChildren: matchingChildren,
        };
      })
      .filter(Boolean);
  }, [rooms, searchTerm, activeCategory]);

  // Pool of all students from the registrations view for the helper list
  const allRegisteredStudents = useMemo(() => {
    return MOCK_RAWDA_STUDENTS.map((s) => ({
      id: s.id,
      name: s.fullName,
      category: s.ageCategory,
      contact: s.guardianPhone,
      birthDate: s.ageCategory === 'Bébé' ? '2023-11-14' : '2022-04-12',
      gender: s.ageCategory === 'Bébé' ? 'ذكر' : 'أنثى',
    }));
  }, []);

  // Filtered helper students available for adding to cohort
  const helperStudentsList = useMemo(() => {
    if (!addingToRoomId) return [];
    const targetRoom = rooms.find((r) => r.id === addingToRoomId);
    if (!targetRoom) return [];

    const existingChildIds = new Set(targetRoom.children.map((c) => c.id));

    return allRegisteredStudents.filter((s) => {
      const isAlreadyInThisRoom = existingChildIds.has(s.id);
      const matchSearch =
        !helperSearch ||
        s.name.toLowerCase().includes(helperSearch.toLowerCase()) ||
        s.contact.includes(helperSearch) ||
        s.category.toLowerCase().includes(helperSearch.toLowerCase());
      return !isAlreadyInThisRoom && matchSearch;
    });
  }, [addingToRoomId, rooms, allRegisteredStudents, helperSearch]);

  // Action: Add Student to Cohort
  const handleAddStudentToRoom = (student) => {
    if (!addingToRoomId) return;

    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === addingToRoomId) {
          return {
            ...r,
            children: [
              ...r.children,
              {
                id: student.id,
                name: student.name,
                birthDate: student.birthDate || '2023-01-01',
                gender: student.gender || 'طفل',
                contact: student.contact || '0550 00 00 00',
              },
            ],
          };
        }
        return r;
      })
    );
  };

  // Action: Remove Student from Cohort
  const handleRemoveStudentFromRoom = (roomId, childId) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === roomId) {
          return {
            ...r,
            children: r.children.filter((c) => c.id !== childId),
          };
        }
        return r;
      })
    );
  };

  // Action: Move Child Submit
  const handleMoveChildSubmit = (e) => {
    e.preventDefault();
    if (!movingChild || !targetRoomId || movingChild.fromRoomId === targetRoomId) {
      setMovingChild(null);
      return;
    }

    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === movingChild.fromRoomId) {
          return {
            ...r,
            children: r.children.filter((c) => c.id !== movingChild.child.id),
          };
        }
        if (r.id === targetRoomId) {
          return {
            ...r,
            children: [...r.children, movingChild.child],
          };
        }
        return r;
      })
    );

    setMovingChild(null);
  };

  // Action: Create New Cohort
  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!newRoomData.name.trim()) return;

    const newId = `room-${Date.now()}`;
    const newCohort = {
      id: newId,
      name: newRoomData.name.trim(),
      category: newRoomData.category,
      maxCapacity: parseInt(newRoomData.maxCapacity) || 15,
      children: [],
    };

    setRooms([...rooms, newCohort]);
    setIsNewRoomModalOpen(false);
    setNewRoomData({ name: '', category: 'Petit Section', maxCapacity: 15 });
  };

  // Action: Delete Cohort
  const handleDeleteRoom = (roomId) => {
    if (confirm('هل أنت متأكد من حذف هذا الفوج بالكامل؟ سيتم فك ارتباط أطفاله.')) {
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
    }
  };

  return (
    <div className="space-y-2.5 print:p-0">
      {/* 1. COMPACT TOP HEADER BAR (Eliminates bulky banner to save screen real estate) */}
      <div className="bg-white border border-slate-200 px-3 py-2 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-blue-900 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                تقسيم الأفواج
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                روضة وحضانة الأطفال
              </span>
              {/* Info / Exclamation Button triggering Guide Modal */}
              <button
                onClick={() => setIsInfoModalOpen(true)}
                className="w-5 h-5 rounded-full bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-900 flex items-center justify-center transition-colors"
                title="معلومات وتفاصيل الواجهة وتوزيع الأفواج"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              توزيع وإدارة أطفال الروضة على الأفواج والقاعات، مع سهولة الإضافة والنقل وقائمة مساعدة بأسماء الطلبة المسجلين.
            </p>
          </div>
        </div>

        {/* Multi-Year Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 px-2 py-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-blue-900" />
            <span className="font-semibold text-slate-700 text-[11px] hidden md:inline">الموسم:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent font-mono font-bold text-slate-900 text-xs focus:outline-none cursor-pointer"
            >
              <option value="2024-2025">2024 - 2025</option>
              <option value="2025-2026">2025 - 2026 (الحالي)</option>
              <option value="2026-2027">2026 - 2027</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. COMPACT 4 KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 print:hidden">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon || Layers;
          return (
            <div
              key={idx}
              className="bg-white border border-slate-200 px-3 py-2 flex flex-col justify-between shadow-2xs hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center justify-between text-slate-500 mb-0.5">
                <span className="text-[11px] font-medium text-slate-600 truncate">{card.label}</span>
                <Icon className="w-3.5 h-3.5 text-blue-900 shrink-0" />
              </div>
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-base sm:text-lg font-bold font-mono text-slate-900 tracking-tight">
                  {card.value}
                </span>
                {card.change && (
                  <span
                    className={`text-[9px] font-medium font-mono px-1 py-0.2 rounded-[2px] ${
                      card.isPositive !== false
                        ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                        : 'text-rose-700 bg-rose-50 border border-rose-200'
                    }`}
                  >
                    {card.change}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. TOOLBAR DIRECTLY ABOVE COHORTS (Filter & Add Cohort button) */}
      <div className="bg-white border border-slate-200 px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs print:hidden">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute inset-y-0 start-2.5 my-auto text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث باسم الطفل داخل الأفواج..."
              className="w-full h-7 ps-8 pe-2 text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-900 focus:outline-none transition-colors"
            />
          </div>

          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className="h-7 px-2 text-xs bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:border-blue-900"
          >
            <option value="ALL">كافة الأقسام</option>
            <option value="Bébé">Bébé (فوج الرضع)</option>
            <option value="Petit Section">أفواج الصغار (Petit Section)</option>
            <option value="Moyen Section">أفواج المتوسطين (Moyen Section)</option>
            <option value="Grand Section">أفواج الكبار (Grand Section)</option>
          </select>
        </div>

        {/* Add New Cohort Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewRoomModalOpen(true)}
            className="h-7 px-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ إنشاء فوج جديد</span>
          </button>
        </div>
      </div>

      {/* 4. MAXIMIZED COHORTS KANBAN GRID (Prominently displaying student names) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5">
        {filteredRooms.map((room) => {
          const currentCount = room.children.length;
          const maxCap = room.maxCapacity;
          const isFull = currentCount >= maxCap;

          return (
            <div
              key={room.id}
              className="bg-white border border-slate-200 shadow-2xs flex flex-col min-h-[440px] hover:border-slate-300 transition-colors"
            >
              {/* Cohort Header: Focused on clean Cohort Name & Count */}
              <div className="p-2 bg-slate-100/90 border-b border-slate-200">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-bold text-xs text-slate-900 truncate">
                      {room.name}
                    </span>
                    <span className="text-[10px] font-mono px-1 py-0.2 bg-white border border-slate-200 text-slate-600">
                      {room.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 font-bold ${
                        isFull
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {currentCount} / {maxCap}
                    </span>
                    <button
                      onClick={() => handleDeleteRoom(room.id)}
                      className="text-slate-400 hover:text-rose-600 p-0.5"
                      title="حذف هذا الفوج"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                <div className="w-full bg-slate-200 h-1 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      isFull ? 'bg-rose-600' : 'bg-blue-800'
                    }`}
                    style={{ width: `${Math.min((currentCount / maxCap) * 100, 100)}%` }}
                  />
                </div>

                {/* Direct Add Student Action in Header */}
                <button
                  onClick={() => {
                    setAddingToRoomId(room.id);
                    setHelperSearch('');
                  }}
                  className="w-full mt-1.5 py-1 bg-white hover:bg-blue-50 border border-slate-200 text-blue-900 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ إضافة طفل للفوج</span>
                </button>
              </div>

              {/* Cohort Body: Maximizing display and prominence of student names */}
              <div className="p-1.5 flex-1 space-y-1.5 overflow-y-auto max-h-[460px] bg-slate-50/40">
                {room.displayChildren.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 mt-2 bg-white">
                    لا يوجد أطفال في هذا الفوج حالياً.
                  </div>
                ) : (
                  room.displayChildren.map((child) => (
                    <div
                      key={child.id}
                      className="bg-white border border-slate-200 p-2 shadow-2xs hover:border-blue-400 hover:shadow-xs transition-all flex items-center justify-between gap-2"
                    >
                      {/* Prominent Large Student Name */}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs sm:text-sm text-slate-900 tracking-tight truncate">
                          {child.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono mt-0.5">
                          <span>{child.contact || 'بدون هاتف'}</span>
                          {child.gender && (
                            <span className="text-[9px] px-1 bg-slate-100 text-slate-600">
                              {child.gender}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quick Actions (Move / Remove) */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setMovingChild({ child, fromRoomId: room.id });
                            setTargetRoomId('');
                          }}
                          className="p-1 text-slate-400 hover:text-blue-900 hover:bg-blue-50 transition-colors"
                          title="نقل الطفل إلى فوج آخر"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemoveStudentFromRoom(room.id, child.id)}
                          className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="إزالة الطفل من هذا الفوج"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. HELPER LIST MODAL: إضافة طفل للفوج مع قائمة مساعدة من المسجلين */}
      {addingToRoomId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-3 bg-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-300" />
                <span className="font-bold text-xs tracking-wide">
                  إضافة طفل إلى فوج: {rooms.find((r) => r.id === addingToRoomId)?.name}
                </span>
              </div>
              <button
                onClick={() => setAddingToRoomId(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Helper Search Input */}
            <div className="p-3 border-b border-slate-200 bg-slate-50">
              <div className="relative">
                <Search className="w-4 h-4 absolute inset-y-0 start-2.5 my-auto text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  value={helperSearch}
                  onChange={(e) => setHelperSearch(e.target.value)}
                  placeholder="ابحث بالاسم في قائمة الأطفال المسجلين..."
                  className="w-full h-8 ps-9 pe-3 text-xs bg-white border border-slate-300 focus:border-blue-900 focus:outline-none font-sans"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                اختر طفلاً من قائمة المسجلين لإضافته فوراً إلى هذا الفوج.
              </p>
            </div>

            {/* Scrollable List of Registered Students */}
            <div className="p-3 space-y-1.5 overflow-y-auto max-h-[380px]">
              {helperStudentsList.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  لا يوجد أطفال متاحين للإضافة يطابقون معايير البحث.
                </div>
              ) : (
                helperStudentsList.map((student) => (
                  <div
                    key={student.id}
                    className="p-2 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                    onClick={() => {
                      handleAddStudentToRoom(student);
                      setAddingToRoomId(null);
                    }}
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900">{student.name}</div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                        <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 font-sans font-semibold">
                          {student.category}
                        </span>
                        <span>{student.contact}</span>
                      </div>
                    </div>
                    <button
                      className="px-2.5 py-1 bg-blue-900 text-white text-xs font-bold flex items-center gap-1 shadow-2xs hover:bg-blue-800"
                    >
                      <Plus className="w-3 h-3" />
                      <span>إضافة</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setAddingToRoomId(null)}
                className="px-4 py-1.5 border border-slate-300 text-slate-600 hover:bg-slate-200 text-xs font-medium"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MOVE CHILD DIALOG */}
      {movingChild && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-3 bg-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-blue-300" />
                <span className="font-bold text-xs">نقل الطفل إلى فوج آخر</span>
              </div>
              <button onClick={() => setMovingChild(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleMoveChildSubmit} className="p-4 space-y-3 text-xs">
              <div className="bg-slate-50 p-2 border border-slate-200">
                <span className="text-[11px] text-slate-500 block">اسم الطفل:</span>
                <span className="font-bold text-slate-900 text-sm">{movingChild.child.name}</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">اختر الفوج المستهدف:</label>
                <select
                  required
                  value={targetRoomId}
                  onChange={(e) => setTargetRoomId(e.target.value)}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 text-xs"
                >
                  <option value="">-- اختر الفوج المطلوب --</option>
                  {rooms
                    .filter((r) => r.id !== movingChild.fromRoomId)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.children.length}/{r.maxCapacity} مقعد)
                      </option>
                    ))}
                </select>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMovingChild(null)}
                  className="px-3 py-1 border border-slate-300 text-slate-600 hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!targetRoomId}
                  className="px-4 py-1 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white font-bold"
                >
                  تأكيد النقل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. CREATE NEW COHORT MODAL */}
      {isNewRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-3 bg-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-300" />
                <span className="font-bold text-xs">إنشاء فوج وقاعة جديدة</span>
              </div>
              <button onClick={() => setIsNewRoomModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">اسم الفوج / القاعة *</label>
                <input
                  type="text"
                  required
                  value={newRoomData.name}
                  onChange={(e) => setNewRoomData({ ...newRoomData, name: e.target.value })}
                  placeholder="مثال: Moyen Section 4"
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">الفئة العمرية المعتمدة</label>
                <select
                  value={newRoomData.category}
                  onChange={(e) => setNewRoomData({ ...newRoomData, category: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                >
                  <option value="Bébé">Bébé (فوج الرضع)</option>
                  <option value="Petit Section">Petit Section (الصغار)</option>
                  <option value="Moyen Section">Moyen Section (المتوسطين)</option>
                  <option value="Grand Section">Grand Section (الكبار)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">السعة الاستيعابية القصوى</label>
                <input
                  type="number"
                  min="1"
                  max="40"
                  value={newRoomData.maxCapacity}
                  onChange={(e) => setNewRoomData({ ...newRoomData, maxCapacity: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewRoomModalOpen(false)}
                  className="px-3 py-1 border border-slate-300 text-slate-600 hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-blue-900 hover:bg-blue-800 text-white font-bold"
                >
                  إنشاء الفوج
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. INFORMATION & GUIDE MODAL (Replaces bulky header text) */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-3 bg-blue-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-300" />
                <span className="font-bold text-xs tracking-wide">دليل تنظيم وتقسيم الأفواج</span>
              </div>
              <button onClick={() => setIsInfoModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs text-slate-700 leading-relaxed max-h-[75vh] overflow-y-auto">
              <div className="bg-blue-50 border border-blue-200 p-2.5 text-blue-950">
                <h4 className="font-bold mb-1">روضة وحضانة الأطفال العباقرة — تنظيم القاعات والأفواج</h4>
                <p className="text-[11px] text-blue-900">
                  لوحة تفاعلية لإدارة وتوزيع أطفال الروضة على القاعات والأفواج المعتمدة، مع تتبع نسب الإشغال وتسهيل نقل الأطفال.
                </p>
              </div>

              <div>
                <h5 className="font-bold text-slate-900 mb-1">تعليمات استخدام لوحة الأفواج:</h5>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 ps-1">
                  <li><strong>إضافة طفل للفوج:</strong> انقر على زر "+ إضافة طفل للفوج" في رأس أي فوج لفتح القائمة المساعدة والبحث بين الأطفال المسجلين.</li>
                  <li><strong>نقل الطفل:</strong> اضغط على أيقونة النقل السريع المقابلة لاسم الطفل لاختيار الفوج البديل فوراً.</li>
                  <li><strong>إلغاء التعيين:</strong> اضغط على أيقونة الإزالة لحذف الطفل من الفوج وإعادته كطفل غير مخصص.</li>
                  <li><strong>إنشاء فوج جديد:</strong> يمكنك إنشاء أفواج مخصصة بالسعة والاسم الذي تريده بحرية تامة.</li>
                </ul>
              </div>
            </div>

            <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs"
              >
                فهمت ذلك
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
