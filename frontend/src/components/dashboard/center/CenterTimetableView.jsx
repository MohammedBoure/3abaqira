import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Building,
  Users,
  CheckCircle,
  Plus,
  X,
  Printer,
  Download,
  Search,
  Info,
  Filter,
  Check,
  Edit2,
  Trash2,
  Copy,
  Sliders,
  TrendingUp,
  Settings,
  Layers,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

// Default 14 rooms as specified in docs/3abaqira.md
const DEFAULT_ROOMS = [
  { id: 'r1', name: 'قاعة 1', type: 'عامة' },
  { id: 'r2', name: 'قاعة 2', type: 'عامة' },
  { id: 'r3', name: 'قاعة 3', type: 'عامة' },
  { id: 'r4', name: 'قاعة 4', type: 'عامة' },
  { id: 'r5', name: 'قاعة 5', type: 'عامة' },
  { id: 'r6', name: 'قاعة 6', type: 'عامة' },
  { id: 'r7', name: 'قاعة 7', type: 'عامة' },
  { id: 'r8', name: 'قاعة 8', type: 'عامة' },
  { id: 'r9', name: 'قاعة 9', type: 'عامة' },
  { id: 'r10', name: 'قاعة 10', type: 'عامة' },
  { id: 'r11', name: 'قاعة 11', type: 'عامة' },
  { id: 'r_hall', name: 'قاعة المحاضرات', type: 'كبرى' },
  { id: 'r_quran1', name: 'قاعة القرآن 1', type: 'تخصصية' },
  { id: 'r_quran2', name: 'قاعة القرآن 2', type: 'تخصصية' },
];

const DEFAULT_LEVELS = [
  'سوربان - مستوى P1',
  'سوربان - مستوى P2',
  'سوربان - مستوى P3',
  'لغة فرنسية - مستوى A1',
  'لغة إنجليزية - مستوى B1',
  'روبوتيك وSTEM - فوج 1',
  'تحفيظ القرآن - سداسي 1',
  'تحفيظ القرآن - سداسي 2',
  'دعم رياضيات - تحضيري',
];

const DEFAULT_COACHES = [
  'يوسف بن عيسى',
  'سمية بلعابد',
  'الشيخ بوعلام أرزقي',
  'أستاذة نادية قاسي',
  'كريم طاهري',
  'أمينة بوغرارة',
  'حمزة مجاهد',
];

const DEFAULT_PERIODS = [
  {
    id: 'fri_pm',
    title: 'فترة الجمعة (14:00 - 16:30)',
    day: 'الجمعة',
    time: '14:00 - 16:30',
    duration: 'ساعتان ونصف',
    maxSeats: 18,
  },
  {
    id: 'sat_am',
    title: 'فترة السبت (09:00 - 11:30)',
    day: 'السبت',
    time: '09:00 - 11:30',
    duration: 'ساعتان ونصف',
    maxSeats: 20,
  },
  {
    id: 'tue_pm',
    title: 'فترة الثلاثاء (14:00 - 16:30)',
    day: 'الثلاثاء (مساءً)',
    time: '14:00 - 16:30',
    duration: 'ساعتان ونصف',
    maxSeats: 18,
  },
];

// Helper to generate mock allocations for a period
const generateInitialMatrix = () => {
  const data = {};
  DEFAULT_PERIODS.forEach((p) => {
    data[p.id] = {};
    DEFAULT_ROOMS.forEach((room, roomIdx) => {
      const level = DEFAULT_LEVELS[roomIdx % DEFAULT_LEVELS.length];
      const coach = DEFAULT_COACHES[roomIdx % DEFAULT_COACHES.length];
      const seats = {};
      const seatLimit = p.maxSeats;
      // Pre-fill some mock student names
      for (let s = 1; s <= seatLimit; s++) {
        if (s <= Math.floor(seatLimit * 0.7)) {
          seats[s] = `طالب ${room.name}-${s}`;
        } else {
          seats[s] = ''; // empty seat
        }
      }
      data[p.id][room.id] = {
        level,
        coach,
        seats,
      };
    });
  });
  return data;
};

export function CenterTimetableView() {
  const [selectedYear, setSelectedYear] = useState('2025-2026');
  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix' | 'config' | 'kpis'
  const [selectedPeriodId, setSelectedPeriodId] = useState('fri_pm');

  // Configurable Entities
  const [rooms, setRooms] = useState(DEFAULT_ROOMS);
  const [periods, setPeriods] = useState(DEFAULT_PERIODS);
  const [levelsList, setLevelsList] = useState(DEFAULT_LEVELS);
  const [coachesList, setCoachesList] = useState(DEFAULT_COACHES);

  // Matrix Data: [periodId][roomId] = { level, coach, seats: { [seatNum]: studentName } }
  const [matrixData, setMatrixData] = useState(generateInitialMatrix);

  // Quick Filters inside Matrix
  const [roomFilter, setRoomFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Context Menu State
  const [contextMenu, setContextMenu] = useState(null); // { x, y, type: 'seat'|'level'|'coach', periodId, roomId, seatNum, currentValue }

  // UI Modals
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [editModalData, setEditModalData] = useState(null);

  // Close context menu on global click
  useEffect(() => {
    const handleWindowClick = () => setContextMenu(null);
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  // Current active period object
  const currentPeriod = useMemo(() => {
    return periods.find((p) => p.id === selectedPeriodId) || periods[0];
  }, [periods, selectedPeriodId]);

  // Filtered rooms to display
  const displayedRooms = useMemo(() => {
    return rooms.filter((r) => {
      const matchFilter = roomFilter === 'ALL' || r.id === roomFilter;
      const matchSearch =
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.type.toLowerCase().includes(searchTerm.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [rooms, roomFilter, searchTerm]);

  // Handle Cell Update
  const updateMatrixCell = (periodId, roomId, field, value, seatNum = null) => {
    setMatrixData((prev) => {
      const pData = { ...(prev[periodId] || {}) };
      const rData = { ...(pData[roomId] || { level: '', coach: '', seats: {} }) };

      if (field === 'seat' && seatNum) {
        rData.seats = { ...rData.seats, [seatNum]: value };
      } else if (field === 'level') {
        rData.level = value;
      } else if (field === 'coach') {
        rData.coach = value;
      }

      pData[roomId] = rData;
      return { ...prev, [periodId]: pData };
    });
  };

  // Open Right-Click Context Menu on Cell
  const handleCellContextMenu = (e, type, roomId, seatNum = null) => {
    e.preventDefault();
    e.stopPropagation();
    const periodId = currentPeriod.id;
    const roomState = matrixData[periodId]?.[roomId] || { level: '', coach: '', seats: {} };

    let currentValue = '';
    if (type === 'seat') currentValue = roomState.seats?.[seatNum] || '';
    if (type === 'level') currentValue = roomState.level || '';
    if (type === 'coach') currentValue = roomState.coach || '';

    const x = Math.min(e.clientX, window.innerWidth - 240);
    const y = Math.min(e.clientY, window.innerHeight - 260);

    setContextMenu({
      x,
      y,
      type,
      periodId,
      roomId,
      seatNum,
      currentValue,
    });
  };

  // KPIs
  const kpiStats = useMemo(() => {
    let totalSeats = 0;
    let occupiedSeats = 0;
    const periodData = matrixData[currentPeriod.id] || {};

    rooms.forEach((r) => {
      const rSeats = periodData[r.id]?.seats || {};
      totalSeats += currentPeriod.maxSeats;
      for (let s = 1; s <= currentPeriod.maxSeats; s++) {
        if (rSeats[s] && rSeats[s].trim()) occupiedSeats++;
      }
    });

    const occupancyRate = totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0;
    const activeRoomsCount = rooms.filter((r) => periodData[r.id]?.coach).length;

    return { totalSeats, occupiedSeats, occupancyRate, activeRoomsCount };
  }, [rooms, currentPeriod, matrixData]);

  // Export Matrix to CSV
  const handleExportCSV = () => {
    const periodData = matrixData[currentPeriod.id] || {};
    const headerRow = ['البند / الترتيب', ...displayedRooms.map((r) => `"${r.name}"`)];
    const levelRow = ['المستوى', ...displayedRooms.map((r) => `"${periodData[r.id]?.level || ''}"`)];

    const seatRows = [];
    for (let s = 1; s <= currentPeriod.maxSeats; s++) {
      const row = [`المقعد ${s}`, ...displayedRooms.map((r) => `"${periodData[r.id]?.seats?.[s] || ''}"`)];
      seatRows.push(row);
    }

    const coachRow = ['المدرب المشرف', ...displayedRooms.map((r) => `"${periodData[r.id]?.coach || ''}"`)];

    const allRows = [headerRow, levelRow, ...seatRows, coachRow];
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' + allRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `timetable_${currentPeriod.id}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 text-xs overflow-hidden">
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-white border-b border-slate-200 shrink-0">
        {/* Title & Badge */}
        <div className="flex items-center gap-2">
          <div className="p-1 bg-blue-50 text-blue-900 border border-blue-200">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 text-sm">
                جدول توقيت الأفواج والقاعات (المصفوفة التقاطعية)
              </span>
              <span className="text-[10px] text-slate-400">|</span>
              <span className="text-[10px] text-slate-500 font-mono">Classroom & Schedule Matrix</span>
            </div>
          </div>
        </div>

        {/* Year Selector & Internal Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              aria-label="تحديد السنة الدراسية لجدول التوقيت"
              className="bg-transparent font-bold text-slate-800 text-xs border-none focus:outline-hidden cursor-pointer"
            >
              <option value="2024-2025">موسم 2024 - 2025</option>
              <option value="2025-2026">موسم 2025 - 2026</option>
              <option value="2026-2027">موسم 2026 - 2027</option>
            </select>
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 border border-slate-200">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1 text-xs font-bold transition-colors ${
                activeTab === 'matrix'
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              مصفوفة التوقيت والقاعات ({rooms.length} قاعة)
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`px-3 py-1 text-xs font-bold flex items-center gap-1 transition-colors ${
                activeTab === 'config'
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings className="w-3 h-3" />
              إعدادات القاعات والتواقيت
            </button>
            <button
              onClick={() => setActiveTab('kpis')}
              className={`px-3 py-1 text-xs font-bold flex items-center gap-1 transition-colors ${
                activeTab === 'kpis'
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              مؤشرات الإشغال
            </button>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1 border-s border-slate-200 ps-2">
            <button
              onClick={handleExportCSV}
              title="تصدير مصفوفة التوقيت كـ CSV"
              className="p-1 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.print()}
              title="طباعة جدول التوقيت"
              className="p-1 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsInfoModalOpen(true)}
              title="معلومات ودليل استخدام مصفوفة التوقيت"
              className="p-1 hover:bg-amber-50 text-amber-700 border border-amber-200 transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Matrix Period Switcher & Filter Bar */}
      {activeTab === 'matrix' && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-white border-b border-slate-200 shrink-0 gap-2">
          {/* Period Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] font-bold text-slate-500 ps-1">الفترة الزمنية:</span>
            {periods.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPeriodId(p.id)}
                className={`px-2.5 py-1 text-xs font-bold rounded-xs transition-all flex items-center gap-1.5 ${
                  selectedPeriodId === p.id
                    ? 'bg-blue-900 text-white shadow-2xs ring-1 ring-blue-900'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{p.title}</span>
                <span className="text-[10px] font-mono px-1 py-0.2 bg-black/15 rounded-xs">
                  {p.maxSeats} مقعد
                </span>
              </button>
            ))}
          </div>

          {/* Room Filter & Quick Search */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute right-2 top-1.5 w-3 h-3 text-slate-400" />
              <input
                type="text"
                placeholder="بحث بالقاعة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-36 h-7 pr-6 pl-2 bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-hidden"
              />
            </div>

            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              aria-label="تصفية حسب القاعة"
              className="h-7 px-2 bg-slate-50 border border-slate-200 text-[11px] text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">جميع القاعات ({rooms.length})</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 ps-2 border-s border-slate-200">
              <span>
                إشغال المقاعد:{' '}
                <strong className="text-blue-900">
                  {kpiStats.occupiedSeats} / {kpiStats.totalSeats} ({kpiStats.occupancyRate}%)
                </strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Workspace Area */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'matrix' ? (
          /* Matrix Table View */
          <div className="min-w-max inline-block align-middle pb-8">
            <table className="text-start text-xs border-collapse select-none border border-slate-300">
              {/* Rooms Header Axis */}
              <thead className="sticky top-0 z-20 shadow-xs">
                <tr className="bg-slate-800 text-white font-bold text-center">
                  <th className="p-2 border border-slate-600 w-28 bg-slate-900 sticky left-0 z-30 shadow-md">
                    المحور / القاعة
                  </th>
                  {displayedRooms.map((room) => (
                    <th
                      key={room.id}
                      className={`p-2 border border-slate-600 min-w-[130px] max-w-[150px] text-center ${
                        room.type === 'كبرى'
                          ? 'bg-amber-950 text-amber-100'
                          : room.type === 'تخصصية'
                          ? 'bg-emerald-950 text-emerald-100'
                          : 'bg-slate-800'
                      }`}
                    >
                      <div className="font-bold text-xs">{room.name}</div>
                      <div className="text-[9px] opacity-75 font-normal">
                        {room.type} ({currentPeriod.maxSeats} مقعد)
                      </div>
                    </th>
                  ))}
                </tr>

                {/* Level Row */}
                <tr className="bg-blue-900 text-white font-bold text-xs">
                  <th className="p-1.5 border border-blue-800 bg-blue-950 sticky left-0 z-30 text-center">
                    المستوى
                  </th>
                  {displayedRooms.map((room) => {
                    const currentLevel = matrixData[currentPeriod.id]?.[room.id]?.level || 'غير محدد';
                    return (
                      <td
                        key={room.id}
                        onContextMenu={(e) => handleCellContextMenu(e, 'level', room.id)}
                        onClick={() =>
                          setEditModalData({
                            type: 'level',
                            periodId: currentPeriod.id,
                            roomId: room.id,
                            roomName: room.name,
                            currentValue: currentLevel,
                          })
                        }
                        className="p-1.5 border border-blue-800 text-center cursor-pointer hover:bg-blue-800 transition-colors"
                        title="انقر لتغيير المستوى أو بالزر الأيمن"
                      >
                        <span className="px-1.5 py-0.5 bg-blue-950/70 border border-blue-400/40 rounded-xs text-[11px] block truncate">
                          {currentLevel}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {/* Numbered Seats Rows (1 to maxSeats) */}
                {Array.from({ length: currentPeriod.maxSeats }, (_, idx) => {
                  const seatNum = idx + 1;
                  return (
                    <tr key={seatNum} className="h-7 hover:bg-amber-50/40 transition-colors">
                      {/* Row Label (Seat Number) */}
                      <td className="p-1 text-center font-bold bg-slate-100 border border-slate-300 text-slate-700 sticky left-0 z-10 shadow-xs">
                        المقعد {seatNum}
                      </td>

                      {/* Each Room's Seat Cell */}
                      {displayedRooms.map((room) => {
                        const studentName =
                          matrixData[currentPeriod.id]?.[room.id]?.seats?.[seatNum] || '';
                        const isOccupied = Boolean(studentName.trim());

                        return (
                          <td
                            key={room.id}
                            onContextMenu={(e) =>
                              handleCellContextMenu(e, 'seat', room.id, seatNum)
                            }
                            onClick={() =>
                              setEditModalData({
                                type: 'seat',
                                periodId: currentPeriod.id,
                                roomId: room.id,
                                seatNum,
                                roomName: room.name,
                                currentValue: studentName,
                              })
                            }
                            className={`p-1 border border-slate-300 text-center cursor-pointer transition-colors ${
                              isOccupied
                                ? 'bg-white hover:bg-blue-50 text-slate-900 font-sans font-medium'
                                : 'bg-slate-50/50 hover:bg-slate-100 text-slate-300 font-sans'
                            }`}
                            title={`المقعد ${seatNum} - ${room.name} (انقر للتعديل أو بالزر الأيمن)`}
                          >
                            <span className="block truncate max-w-[140px] mx-auto text-[11px]">
                              {isOccupied ? studentName : '— فارغ —'}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {/* Supervisor Coach Row (Bottom Anchor) */}
                <tr className="bg-emerald-900 text-white font-bold text-xs sticky bottom-0 z-20 shadow-md">
                  <th className="p-2 border border-emerald-800 bg-emerald-950 sticky left-0 z-30 text-center">
                    المدرب المشرف
                  </th>
                  {displayedRooms.map((room) => {
                    const currentCoach =
                      matrixData[currentPeriod.id]?.[room.id]?.coach || 'غير مسند';
                    return (
                      <td
                        key={room.id}
                        onContextMenu={(e) => handleCellContextMenu(e, 'coach', room.id)}
                        onClick={() =>
                          setEditModalData({
                            type: 'coach',
                            periodId: currentPeriod.id,
                            roomId: room.id,
                            roomName: room.name,
                            currentValue: currentCoach,
                          })
                        }
                        className="p-2 border border-emerald-800 text-center cursor-pointer hover:bg-emerald-800 transition-colors"
                        title="انقر لتعيين المدرب أو بالزر الأيمن"
                      >
                        <span className="px-1.5 py-0.5 bg-emerald-950/70 border border-emerald-400/40 rounded-xs text-[11px] block truncate">
                          {currentCoach}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        ) : activeTab === 'config' ? (
          /* Config / Customization Tab (Excel replacement) */
          <div className="p-4 space-y-4 max-w-5xl mx-auto">
            <div className="bg-blue-50 border border-blue-200 p-3 flex items-start gap-2">
              <Settings className="w-4 h-4 text-blue-900 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-950">
                <strong>مركز التحكم المخصص بالأبعاد والهيكل (بديل Excel التفاعلي):</strong>
                <p className="mt-0.5 text-blue-900 leading-relaxed">
                  يمكنك هنا إضافة قاعات جديدة، تعديل سعة المقاعد لكل فترة زمنية، إضافة فترات دراسية
                  مخصصة، وتحديث قائمة المدربين والمستويات المعتمدة في المركز.
                </p>
              </div>
            </div>

            {/* 1. Rooms Manager */}
            <div className="bg-white border border-slate-200 p-3 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-blue-900" />
                  قاعات المركز ({rooms.length} قاعة معتمدة)
                </h4>
                <button
                  onClick={() => {
                    const newId = `r_${Date.now()}`;
                    const name = prompt('أدخل اسم القاعة الجديدة:', `قاعة ${rooms.length + 1}`);
                    if (!name) return;
                    setRooms([...rooms, { id: newId, name, type: 'عامة' }]);
                  }}
                  className="px-2 py-1 bg-blue-900 text-white text-[11px] font-bold flex items-center gap-1 hover:bg-blue-950"
                >
                  <Plus className="w-3 h-3" />
                  إضافة قاعة جديدة
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {rooms.map((r, idx) => (
                  <div
                    key={r.id}
                    className="p-2 border border-slate-200 bg-slate-50 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-900 text-xs">{r.name}</span>
                      <span className="text-[10px] text-slate-500 block">{r.type}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          const newName = prompt('تعديل اسم القاعة:', r.name);
                          if (newName) {
                            setRooms(rooms.map((x) => (x.id === r.id ? { ...x, name: newName } : x)));
                          }
                        }}
                        className="p-1 text-slate-500 hover:text-blue-900"
                        title="تعديل"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      {rooms.length > 2 && (
                        <button
                          onClick={() => {
                            if (window.confirm(`هل أنت متأكد من حذف ${r.name}؟`)) {
                              setRooms(rooms.filter((x) => x.id !== r.id));
                            }
                          }}
                          className="p-1 text-slate-500 hover:text-rose-600"
                          title="حذف"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Periods & Seats Manager */}
            <div className="bg-white border border-slate-200 p-3 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-800" />
                  الفترات الزمنية وسعة المقاعد
                </h4>
                <button
                  onClick={() => {
                    const title = prompt('أدخل عنوان الفترة الجديدة (مثال: الأحد 14:00 - 16:30):');
                    if (!title) return;
                    const max = Number(prompt('سعة المقاعد القصوى:', '20')) || 20;
                    const pId = `p_${Date.now()}`;
                    setPeriods([
                      ...periods,
                      {
                        id: pId,
                        title,
                        day: title.split(' ')[0],
                        time: title,
                        duration: 'ساعتان ونصف',
                        maxSeats: max,
                      },
                    ]);
                  }}
                  className="px-2 py-1 bg-emerald-800 text-white text-[11px] font-bold flex items-center gap-1 hover:bg-emerald-900"
                >
                  <Plus className="w-3 h-3" />
                  إضافة فترة زمنية جديدة
                </button>
              </div>

              <div className="space-y-2">
                {periods.map((p) => (
                  <div
                    key={p.id}
                    className="p-2 border border-slate-200 flex items-center justify-between bg-slate-50"
                  >
                    <div>
                      <strong className="text-slate-900 text-xs">{p.title}</strong>
                      <span className="text-[10px] text-slate-500 block">
                        المدة: {p.duration} | اليوم: {p.day}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-700">
                        {p.maxSeats} مقعد
                      </span>
                      <button
                        onClick={() => {
                          const newMax = Number(prompt(`تعديل سعة مقاعد ${p.title}:`, p.maxSeats));
                          if (newMax) {
                            setPeriods(
                              periods.map((x) => (x.id === p.id ? { ...x, maxSeats: newMax } : x))
                            );
                          }
                        }}
                        className="px-2 py-0.5 border border-slate-300 text-[11px] hover:bg-white"
                      >
                        تعديل المقاعد
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Coaches & Levels Roster */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white border border-slate-200 p-3 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-xs text-slate-900">طاقم المدربين والمؤطرين</h4>
                  <button
                    onClick={() => {
                      const name = prompt('أدخل اسم المدرب الجديد:');
                      if (name && !coachesList.includes(name)) {
                        setCoachesList([...coachesList, name.trim()]);
                      }
                    }}
                    className="px-2 py-0.5 bg-slate-800 text-white text-[10px] font-bold"
                  >
                    + إضافة مدرب
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {coachesList.map((coach) => (
                    <span
                      key={coach}
                      className="px-2 py-1 bg-slate-100 border border-slate-200 text-[11px] rounded-xs font-semibold text-slate-800"
                    >
                      {coach}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-3 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-xs text-slate-900">المستويات والبرامج المعتمدة</h4>
                  <button
                    onClick={() => {
                      const lvl = prompt('أدخل اسم المستوى الجديد:');
                      if (lvl && !levelsList.includes(lvl)) {
                        setLevelsList([...levelsList, lvl.trim()]);
                      }
                    }}
                    className="px-2 py-0.5 bg-slate-800 text-white text-[10px] font-bold"
                  >
                    + إضافة مستوى
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {levelsList.map((lvl) => (
                    <span
                      key={lvl}
                      className="px-2 py-1 bg-blue-50 border border-blue-200 text-[11px] rounded-xs font-semibold text-blue-900"
                    >
                      {lvl}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* KPIs & Occupancy Tab */
          <div className="p-4 space-y-4 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-3 bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold">القاعات المستغلة</span>
                  <Building className="w-4 h-4 text-blue-900" />
                </div>
                <div className="text-xl font-bold font-mono text-slate-900">
                  {kpiStats.activeRoomsCount} / {rooms.length} قاعة
                </div>
                <div className="text-[10px] text-slate-400 mt-1">{currentPeriod.title}</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold">المقاعد الإجمالية</span>
                  <Users className="w-4 h-4 text-slate-700" />
                </div>
                <div className="text-xl font-bold font-mono text-slate-900">
                  {kpiStats.totalSeats} مقعد
                </div>
                <div className="text-[10px] text-slate-400 mt-1">سعة الفترة الحالية</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold">الطلاب المسجلين</span>
                  <CheckCircle className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="text-xl font-bold font-mono text-emerald-700">
                  {kpiStats.occupiedSeats} طالب
                </div>
                <div className="text-[10px] text-emerald-600 mt-1">مسكنين بالمصفوفة</div>
              </div>

              <div className="p-3 bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold">نسبة إشغال القاعات</span>
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-xl font-bold font-mono text-amber-600">
                  {kpiStats.occupancyRate}%
                </div>
                <div className="text-[10px] text-amber-700 mt-1">كفاءة استغلال المساحات</div>
              </div>
            </div>

            {/* Occupancy per Room Breakdown */}
            <div className="bg-white border border-slate-200 p-3 shadow-2xs">
              <h4 className="font-bold text-xs text-slate-900 mb-2">
                تفاصيل الإشغال والمدرب المشرف لكل قاعة ({currentPeriod.title}):
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                    <tr>
                      <th className="p-2 text-start">القاعة</th>
                      <th className="p-2 text-start">المستوى المبرمج</th>
                      <th className="p-2 text-start">المدرب المشرف</th>
                      <th className="p-2 text-center">الطلاب المسجلين</th>
                      <th className="p-2 text-center">السعة القصوى</th>
                      <th className="p-2 text-center">نسبة الإشغال</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {rooms.map((r) => {
                      const rState = matrixData[currentPeriod.id]?.[r.id] || {
                        level: '-',
                        coach: '-',
                        seats: {},
                      };
                      let rCount = 0;
                      for (let s = 1; s <= currentPeriod.maxSeats; s++) {
                        if (rState.seats?.[s]?.trim()) rCount++;
                      }
                      const rRate = Math.round((rCount / currentPeriod.maxSeats) * 100);

                      return (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="p-2 font-sans font-bold text-slate-900">{r.name}</td>
                          <td className="p-2 font-sans text-blue-900">{rState.level}</td>
                          <td className="p-2 font-sans text-emerald-800 font-semibold">
                            {rState.coach}
                          </td>
                          <td className="p-2 text-center font-bold">{rCount}</td>
                          <td className="p-2 text-center text-slate-500">
                            {currentPeriod.maxSeats}
                          </td>
                          <td className="p-2 text-center">
                            <span
                              className={`px-1.5 py-0.5 rounded-xs font-bold text-[10px] ${
                                rRate >= 80
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : rRate >= 50
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {rRate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right-Click Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white border border-slate-300 shadow-xl py-1 text-xs min-w-[210px] animate-in fade-in"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1 bg-slate-100 border-b border-slate-200 font-bold text-[10px] text-slate-700">
            {contextMenu.type === 'seat'
              ? `المقعد ${contextMenu.seatNum} - ${
                  rooms.find((r) => r.id === contextMenu.roomId)?.name
                }`
              : contextMenu.type === 'level'
              ? `مستوى القاعة - ${rooms.find((r) => r.id === contextMenu.roomId)?.name}`
              : `المدرب المشرف - ${rooms.find((r) => r.id === contextMenu.roomId)?.name}`}
          </div>

          {contextMenu.type === 'seat' ? (
            <>
              <button
                onClick={() => {
                  setEditModalData({
                    type: 'seat',
                    periodId: contextMenu.periodId,
                    roomId: contextMenu.roomId,
                    seatNum: contextMenu.seatNum,
                    roomName: rooms.find((r) => r.id === contextMenu.roomId)?.name,
                    currentValue: contextMenu.currentValue,
                  });
                  setContextMenu(null);
                }}
                className="w-full text-start px-3 py-1.5 hover:bg-blue-50 text-slate-800 flex items-center gap-2"
              >
                <Edit2 className="w-3.5 h-3.5 text-blue-800" />
                تعديل / تعيين اسم الطالب
              </button>
              <button
                onClick={() => {
                  updateMatrixCell(
                    contextMenu.periodId,
                    contextMenu.roomId,
                    'seat',
                    '',
                    contextMenu.seatNum
                  );
                  setContextMenu(null);
                }}
                className="w-full text-start px-3 py-1.5 hover:bg-amber-50 text-amber-800 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5 text-amber-700" />
                تفريغ المقعد (حذف الطالب)
              </button>
            </>
          ) : contextMenu.type === 'level' ? (
            <div className="max-h-48 overflow-y-auto">
              <span className="px-3 py-1 text-[10px] font-bold text-slate-400 block">
                اختر المستوى:
              </span>
              {levelsList.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => {
                    updateMatrixCell(contextMenu.periodId, contextMenu.roomId, 'level', lvl);
                    setContextMenu(null);
                  }}
                  className="w-full text-start px-3 py-1 hover:bg-blue-50 text-slate-800 text-[11px] truncate block"
                >
                  {lvl}
                </button>
              ))}
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto">
              <span className="px-3 py-1 text-[10px] font-bold text-slate-400 block">
                اختر المدرب:
              </span>
              {coachesList.map((coach) => (
                <button
                  key={coach}
                  onClick={() => {
                    updateMatrixCell(contextMenu.periodId, contextMenu.roomId, 'coach', coach);
                    setContextMenu(null);
                  }}
                  className="w-full text-start px-3 py-1 hover:bg-emerald-50 text-slate-800 text-[11px] truncate block"
                >
                  {coach}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Cell Modal */}
      {editModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-sm p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 text-sm">
                {editModalData.type === 'seat'
                  ? `تعديل المقعد ${editModalData.seatNum} (${editModalData.roomName})`
                  : editModalData.type === 'level'
                  ? `تعيين مستوى ${editModalData.roomName}`
                  : `تعيين مدرب ${editModalData.roomName}`}
              </span>
              <button
                onClick={() => setEditModalData(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMatrixCell(
                  editModalData.periodId,
                  editModalData.roomId,
                  editModalData.type,
                  editModalData.currentValue,
                  editModalData.seatNum
                );
                setEditModalData(null);
              }}
              className="space-y-3"
            >
              {editModalData.type === 'seat' ? (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    اسم الطالب المسكن بالمقعد:
                  </label>
                  <input
                    type="text"
                    autoFocus
                    placeholder="اكتب اسم الطالب..."
                    value={editModalData.currentValue}
                    onChange={(e) =>
                      setEditModalData({ ...editModalData, currentValue: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                  />
                </div>
              ) : editModalData.type === 'level' ? (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">اختر المستوى:</label>
                  <select
                    value={editModalData.currentValue}
                    onChange={(e) =>
                      setEditModalData({ ...editModalData, currentValue: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                  >
                    {levelsList.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">اختر المدرب المشرف:</label>
                  <select
                    value={editModalData.currentValue}
                    onChange={(e) =>
                      setEditModalData({ ...editModalData, currentValue: e.target.value })
                    }
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                  >
                    {coachesList.map((coach) => (
                      <option key={coach} value={coach}>
                        {coach}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditModalData(null)}
                  className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-bold"
                >
                  حفظ التعديل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-lg p-5 text-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-slate-900 text-sm">
                  دليل وإرشادات مصفوفة توزيع الأفواج والقاعات (Classroom Matrix)
                </span>
              </div>
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-slate-700 leading-relaxed">
              <p>
                <strong>الهدف من الواجهة:</strong> نظام مصفوفي تقاطعي لإدارة وتسكين حصص التدريب في
                قاعات المركز (14 قاعة)، وتوزيع الطلاب والمستويات والمدربين المشرفين.
              </p>
              <ul className="list-disc list-inside space-y-1 bg-slate-50 p-2.5 border border-slate-200">
                <li>
                  <strong>الفترات الزمنية:</strong> فترة الجمعة (14:00 - 16:30 بـ 18 مقعد) وفترة
                  السبت (09:00 - 11:30 بـ 20 مقعد) مع إمكانية إضافة أي فترة أخرى.
                </li>
                <li>
                  <strong>التفاعل والزر الأيمن:</strong> انقر بالزر الأيمن على أي مقعد لتسجيل أو
                  تفريغ الطالب، أو على صف المستوى وصف المدرب لتغيير الإشراف فورياً.
                </li>
                <li>
                  <strong>تبويب الإعدادات المخصصة:</strong> يتيح لك إضافة قاعات جديدة، ضبط عدد
                  المقاعد، وإدارة قوائم المدربين والمستويات لتغنيك الواجهة عن Excel تماماً.
                </li>
              </ul>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-black text-white font-bold"
              >
                إغلاق الدليل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
