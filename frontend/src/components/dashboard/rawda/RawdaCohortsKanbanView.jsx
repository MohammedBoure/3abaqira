import React, { useState, useMemo } from 'react';
import {
  Layers,
  Users,
  UserCheck,
  Building,
  ArrowLeftRight,
  MoveRight,
  Plus,
  X,
  Edit2,
  Phone,
  Calendar,
} from 'lucide-react';
import { StandardViewLayout } from '../common/StandardViewLayout';
import { MOCK_RAWDA_ROOMS } from '../../../mock/rawdaMockData';

export function RawdaCohortsKanbanView() {
  const [rooms, setRooms] = useState(MOCK_RAWDA_ROOMS);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');

  // Move child dialog state
  const [movingChild, setMovingChild] = useState(null); // { child, fromRoomId }
  const [targetRoomId, setTargetRoomId] = useState('');

  // Edit educator dialog state
  const [editingRoom, setEditingRoom] = useState(null);
  const [newEducatorName, setNewEducatorName] = useState('');

  // 1. KPI Calculations (Section 2.2)
  const totalRooms = rooms.length;
  const totalChildren = rooms.reduce((acc, r) => acc + r.children.length, 0);
  const totalCapacity = rooms.reduce((acc, r) => acc + r.maxCapacity, 0);
  const occupancyRate = totalCapacity > 0 ? Math.round((totalChildren / totalCapacity) * 100) : 0;

  const kpiCards = [
    {
      label: 'إجمالي القاعات والأفواج المعتمدة',
      value: `${totalRooms} قاعات`,
      icon: Building,
      subtext: 'Bébé, Petit, Moyen, Grand Sections',
      change: '100% نشطة',
      isPositive: true,
    },
    {
      label: 'إجمالي الأطفال الموزعين بالأفواج',
      value: `${totalChildren} طفل`,
      icon: Users,
      subtext: 'مربوطين بمربيات معتمدات',
      change: '+4 هذا الأسبوع',
      isPositive: true,
    },
    {
      label: 'السعة الاستيعابية الإجمالية',
      value: `${totalCapacity} مقعد`,
      icon: Layers,
      subtext: 'الحد الأقصى المسموح به تربوياً وصحياً',
      change: 'معياري',
      isPositive: true,
    },
    {
      label: 'معدل إشغال القاعات والحضانة',
      value: `${occupancyRate}%`,
      icon: UserCheck,
      subtext: `${totalCapacity - totalChildren} مقعد شاغر متاح`,
      change: `${occupancyRate}% إشغال`,
      isPositive: occupancyRate < 95,
    },
  ];

  // 2. Filter Rooms
  const filteredRooms = useMemo(() => {
    return rooms.map((room) => {
      const matchCategory = activeCategory === 'ALL' || room.category === activeCategory;
      if (!matchCategory) return null;

      // Filter children inside room by search term
      const matchingChildren = room.children.filter((c) => {
        if (!searchTerm) return true;
        return (
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.contact?.includes(searchTerm)
        );
      });

      return {
        ...room,
        displayChildren: matchingChildren,
      };
    }).filter(Boolean);
  }, [rooms, searchTerm, activeCategory]);

  // 3. Move Child Action
  const handleMoveChildSubmit = (e) => {
    e.preventDefault();
    if (!movingChild || !targetRoomId || movingChild.fromRoomId === targetRoomId) {
      setMovingChild(null);
      return;
    }

    setRooms((prevRooms) =>
      prevRooms.map((r) => {
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

  // 4. Update Educator Action
  const handleUpdateEducator = (e) => {
    e.preventDefault();
    if (!editingRoom || !newEducatorName.trim()) {
      setEditingRoom(null);
      return;
    }

    setRooms((prevRooms) =>
      prevRooms.map((r) => (r.id === editingRoom.id ? { ...r, educator: newEducatorName.trim() } : r))
    );

    setEditingRoom(null);
    setNewEducatorName('');
  };

  return (
    <StandardViewLayout
      titleAr="تنظيم وقاعات الأفواج (10 قاعات للروضة)"
      titleEn="Rawda Cohorts & Classrooms Kanban Organization"
      description="لوحة كانبان التفاعلية لإدارة وتوزيع أطفال الروضة على القاعات الـ 10 المعتمدة، مع تتبع نسب الإشغال، وإسناد المربيات المسؤولات، وتسهيل نقل الأطفال بين الأفواج."
      entityTag="تنظيم القاعات والأفواج"
      branchCode="RAWDA"
      kpiCards={kpiCards}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="ابحث باسم الطفل المسجل في الفوج..."
      exportFileName="rawda_cohorts_kanban"
      exportData={rooms.flatMap((r) =>
        r.children.map((c) => ({
          'القاعة': r.name,
          'فئة العمر': r.category,
          'المربية المسؤولة': r.educator,
          'اسم الطفل': c.name,
          'تاريخ الميلاد': c.birthDate,
          'هاتف ولي الأمر': c.contact,
        }))
      )}
      filterSlot={
        <div className="flex items-center gap-1.5">
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className="h-7 px-2 text-xs bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:border-blue-900"
          >
            <option value="ALL">كافة الأقسام (10 قاعات)</option>
            <option value="Bébé">Bébé (فوج الرضع)</option>
            <option value="Petit Section">أفواج الصغار (3 قاعات)</option>
            <option value="Moyen Section">أفواج المتوسطين (3 قاعات)</option>
            <option value="Grand Section">أفواج الكبار (3 قاعات)</option>
          </select>
        </div>
      }
    >
      {/* 10 Kanban Columns Grid */}
      <div className="p-3 bg-slate-50/50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {filteredRooms.map((room) => {
            const currentCount = room.children.length;
            const maxCap = room.maxCapacity;
            const isFull = currentCount >= maxCap;

            return (
              <div
                key={room.id}
                className="bg-white border border-slate-200 shadow-2xs flex flex-col min-h-[460px]"
              >
                {/* Column Header */}
                <div className="p-2.5 bg-slate-100 border-b border-slate-200">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-xs text-slate-900 truncate">{room.name}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 font-bold ${
                        isFull
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {currentCount} / {maxCap}
                    </span>
                  </div>

                  {/* Educator Pill */}
                  <div className="flex items-center justify-between text-[11px] text-slate-600 bg-white p-1.5 border border-slate-200">
                    <div className="flex items-center gap-1 truncate">
                      <UserCheck className="w-3 h-3 text-blue-900 shrink-0" />
                      <span className="truncate">{room.educator}</span>
                    </div>
                    <button
                      onClick={() => {
                        setEditingRoom(room);
                        setNewEducatorName(room.educator);
                      }}
                      className="text-slate-400 hover:text-blue-900 p-0.5"
                      title="تغيير المربية المسؤولة"
                    >
                      <Edit2 className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  {/* Capacity Bar */}
                  <div className="w-full bg-slate-200 h-1 mt-2 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        isFull ? 'bg-rose-600' : 'bg-blue-800'
                      }`}
                      style={{ width: `${Math.min((currentCount / maxCap) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Cards Body */}
                <div className="p-2 flex-1 space-y-2 overflow-y-auto max-h-[380px]">
                  {room.displayChildren.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200">
                      لا يوجد أطفال في هذه القاعة
                    </div>
                  ) : (
                    room.displayChildren.map((child) => (
                      <div
                        key={child.id}
                        className="p-2 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 transition-colors shadow-2xs group"
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <strong className="text-xs text-slate-900 leading-tight">
                            {child.name}
                          </strong>
                          <span
                            className={`text-[9px] px-1 py-0.2 ${
                              child.gender === 'أنثى'
                                ? 'bg-pink-100 text-pink-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {child.gender}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5 text-slate-400" />
                            {child.birthDate}
                          </span>
                          <button
                            onClick={() => {
                              setMovingChild({ child, fromRoomId: room.id });
                              setTargetRoomId(rooms.find((r) => r.id !== room.id)?.id || '');
                            }}
                            className="text-[10px] text-blue-900 font-bold hover:underline flex items-center gap-0.5 opacity-80 group-hover:opacity-100"
                            title="نقل الطفل إلى قاعة أخرى"
                          >
                            <ArrowLeftRight className="w-2.5 h-2.5" />
                            <span>نقل</span>
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
      </div>

      {/* Move Child Dialog */}
      {movingChild && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-sm p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 text-sm">نقل طفل بين قاعات الروضة</span>
              <button onClick={() => setMovingChild(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-slate-600">
              الطفل المختار: <strong className="text-slate-900">{movingChild.child.name}</strong>
            </p>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">اختر القاعة الجديدة المحول إليها:</label>
              <select
                value={targetRoomId}
                onChange={(e) => setTargetRoomId(e.target.value)}
                className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id} disabled={r.id === movingChild.fromRoomId}>
                    {r.name} ({r.children.length}/{r.maxCapacity}) {r.id === movingChild.fromRoomId ? '(القاعة الحالية)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setMovingChild(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleMoveChildSubmit}
                className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold"
              >
                تأكيد النقل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Educator Dialog */}
      {editingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-sm p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 text-sm">إسناد المربية المسؤولة</span>
              <button onClick={() => setEditingRoom(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-slate-600">
              القاعة: <strong className="text-slate-900">{editingRoom.name}</strong>
            </p>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">اسم المربية أو المربية البديلة:</label>
              <input
                type="text"
                value={newEducatorName}
                onChange={(e) => setNewEducatorName(e.target.value)}
                placeholder="مثال: مريم قاسمي"
                className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setEditingRoom(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleUpdateEducator}
                className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold"
              >
                حفظ التعيين
              </button>
            </div>
          </div>
        </div>
      )}
    </StandardViewLayout>
  );
}
