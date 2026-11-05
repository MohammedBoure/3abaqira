import React, { useState } from 'react';
import {
  Activity,
  Search,
  Plus,
  Lock,
  Globe,
  CheckCircle,
  FileText,
  Printer,
  Calendar,
  User,
  HeartPulse,
} from 'lucide-react';
import {
  MOCK_ORTHOPHONIST_NOTES,
  MOCK_KG_STUDENTS,
} from '../../../mock/geniusKindergartenFinanceMockData';

export function OrthophonistObservationPanelView() {
  const [notes, setNotes] = useState(MOCK_ORTHOPHONIST_NOTES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState(MOCK_ORTHOPHONIST_NOTES[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNote, setNewNote] = useState({
    studentId: '',
    specialistName: 'د. سلمى قيطوني (أخصائية أمراض النطق والتخاطب)',
    assessmentDate: new Date().toISOString().split('T')[0],
    focusArea: '',
    clinicalObservations: '',
    treatmentPlan: '',
    visibilityToParents: false,
  });

  const toggleVisibility = (noteId) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId ? { ...n, visibilityToParents: !n.visibilityToParents } : n
      )
    );
    if (selectedNote?.id === noteId) {
      setSelectedNote((prev) => ({ ...prev, visibilityToParents: !prev.visibilityToParents }));
    }
  };

  const handleCreateNote = (e) => {
    e.preventDefault();
    const student = MOCK_KG_STUDENTS.find((s) => s.id === newNote.studentId);
    if (!student) {
      alert('يرجى اختيار التلميذ');
      return;
    }
    const created = {
      id: `ORTHO-2026-${String(notes.length + 15).padStart(3, '0')}`,
      studentId: student.id,
      studentName: student.fullNameAr,
      bandName: student.bandId,
      specialistName: newNote.specialistName,
      assessmentDate: newNote.assessmentDate,
      focusArea: newNote.focusArea,
      clinicalObservations: newNote.clinicalObservations,
      treatmentPlan: newNote.treatmentPlan,
      visibilityToParents: newNote.visibilityToParents,
      parentConsentSigned: true,
      nextReviewDate: '2026-12-15',
    };
    setNotes([created, ...notes]);
    setSelectedNote(created);
    setIsModalOpen(false);
  };

  const filtered = notes.filter(
    (n) =>
      n.studentName.includes(searchQuery) ||
      n.focusArea.includes(searchQuery) ||
      n.clinicalObservations.includes(searchQuery)
  );

  return (
    <div className="space-y-3 font-arabic text-slate-800">
      {/* 1. Header */}
      <div className="bg-white border border-slate-200 p-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2.5 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800">
              <HeartPulse className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 leading-none">
                  لوحة المتابعة الإكلينيكية وأخصائية الأرطوفونيا (Orthophonist Observation Panel)
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 font-bold">
                  سرية طبية / تحكم في مشاركة الولي
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                فحص النطق، التخاطب، فرط الحركة، وخطة التأهيل الفردية مع إمكانية إتاحة الملاحظات للأولياء أو حصرها بالطاقم.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-2.5 py-1 text-xs font-bold bg-teal-800 hover:bg-teal-900 text-white flex items-center gap-1.5 border border-teal-900 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة تقرير تشخيصي</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-2 py-1 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-1 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>طباعة الملف الإكلينيكي</span>
            </button>
          </div>
        </div>

        {/* 4 Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2 bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 block">إجمالي الملفات المتابعة</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-slate-900">{notes.length}</span>
              <span className="text-[10px] text-slate-500">حالات نشطة</span>
            </div>
          </div>
          <div className="p-2 bg-teal-50/50 border border-teal-200">
            <span className="text-[10px] font-bold text-teal-800 block">مرئي للولي في تطبيقه</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-teal-900">
                {notes.filter((n) => n.visibilityToParents).length}
              </span>
              <span className="text-[10px] text-teal-700 font-bold">مشاركة شفافة</span>
            </div>
          </div>
          <div className="p-2 bg-amber-50/50 border border-amber-200">
            <span className="text-[10px] font-bold text-amber-800 block">سري محصور بالطاقم الإداري</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-amber-900">
                {notes.filter((n) => !n.visibilityToParents).length}
              </span>
              <span className="text-[10px] text-amber-700">تداول داخلي</span>
            </div>
          </div>
          <div className="p-2 bg-blue-50/50 border border-blue-200">
            <span className="text-[10px] font-bold text-blue-800 block">الأخصائية المسؤولة</span>
            <div className="mt-1 text-[11px] font-bold text-slate-800 truncate">
              د. سلمى قيطوني (نطق وتخاطب)
            </div>
          </div>
        </div>
      </div>

      {/* 2. Split Workspace: Master List (Right) & Clinical Details Card (Left) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Master List (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 shadow-2xs flex flex-col">
          <div className="p-2 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute start-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بالطفل أو التشخيص..."
                className="w-full ps-7 pe-2 py-0.5 text-xs border border-slate-200 bg-white"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[500px]">
            {filtered.map((note) => {
              const isSelected = selectedNote?.id === note.id;
              return (
                <div
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className={`p-2.5 cursor-pointer transition-colors ${
                    isSelected ? 'bg-teal-50/70 border-s-4 border-teal-800' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900">{note.studentName}</span>
                    <span className="text-[10px] font-mono text-slate-500">{note.assessmentDate}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-1 mb-1.5">{note.focusArea}</p>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 font-mono">{note.id}</span>
                    {note.visibilityToParents ? (
                      <span className="inline-flex items-center gap-1 font-bold text-teal-800 bg-teal-50 px-1 py-0.2 border border-teal-200">
                        <Globe className="w-3 h-3 text-teal-600" />
                        مرئي للولي
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-bold text-slate-600 bg-slate-100 px-1 py-0.2 border border-slate-200">
                        <Lock className="w-3 h-3 text-slate-500" />
                        سري للطاقم
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Clinical Dossier View (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 shadow-2xs p-4 flex flex-col justify-between">
          {selectedNote ? (
            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <div>
                  <span className="text-[10px] text-slate-500 block font-mono">
                    الملف الطبي رقم: {selectedNote.id}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    {selectedNote.studentName} — {selectedNote.bandName}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleVisibility(selectedNote.id)}
                    className={`px-2 py-1 text-xs font-bold flex items-center gap-1 border transition-colors ${
                      selectedNote.visibilityToParents
                        ? 'bg-teal-50 text-teal-900 border-teal-300 hover:bg-teal-100'
                        : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {selectedNote.visibilityToParents ? (
                      <>
                        <Globe className="w-3.5 h-3.5 text-teal-700" />
                        <span>معروض للولي (انقر للإخفاء)</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-slate-600" />
                        <span>محصور بالطاقم (انقر للمشاركة)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 border border-slate-200 text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-500 block">الأخصائية الفاحصة:</span>
                  <span className="font-semibold text-slate-900">{selectedNote.specialistName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">تاريخ الفحص / المراجعة القادمة:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedNote.assessmentDate} • القادم: {selectedNote.nextReviewDate}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-800 block mb-1">
                  محور التقييم والتشخيص الأولي (Diagnosis & Focus):
                </span>
                <div className="p-2 bg-teal-50/40 border border-teal-200 font-semibold text-teal-950">
                  {selectedNote.focusArea}
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-800 block mb-1">
                  الملاحظات الإكلينيكية المفصلة (Clinical Observations):
                </span>
                <p className="p-2.5 bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
                  {selectedNote.clinicalObservations}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-800 block mb-1">
                  خطة التأهيل والتمارين الفردية (Treatment Plan):
                </span>
                <p className="p-2.5 bg-emerald-50/40 border border-emerald-200 text-emerald-950 leading-relaxed">
                  {selectedNote.treatmentPlan}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">يرجى اختيار تقرير للمعاينة</div>
          )}
        </div>
      </div>

      {/* 3. New Report Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-3">
          <div className="bg-white border border-slate-300 shadow-xl w-full max-w-lg p-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-teal-800" />
                <h3 className="text-sm font-bold text-slate-900">إضافة تقرير تشخيص أرطوفونيا جديد</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الطفل المفحوص *</label>
                <select
                  value={newNote.studentId}
                  onChange={(e) => setNewNote({ ...newNote, studentId: e.target.value })}
                  className="w-full p-1.5 border border-slate-300 bg-white font-arabic focus:border-teal-800"
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

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  محور الفحص (تأخر نطق، تلعثم، مخارج حروف...) *
                </label>
                <input
                  type="text"
                  value={newNote.focusArea}
                  onChange={(e) => setNewNote({ ...newNote, focusArea: e.target.value })}
                  placeholder="مثال: صعوبة نطق الحروف اللثوية"
                  className="w-full p-1.5 border border-slate-300 font-arabic focus:border-teal-800"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الملاحظة السريرية التفصيلية *</label>
                <textarea
                  rows={3}
                  value={newNote.clinicalObservations}
                  onChange={(e) => setNewNote({ ...newNote, clinicalObservations: e.target.value })}
                  placeholder="تدوين استجابة الطفل وتناسق أعضاء النطق..."
                  className="w-full p-1.5 border border-slate-300 font-arabic focus:border-teal-800"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">البرنامج العلاجي المقترح *</label>
                <textarea
                  rows={2}
                  value={newNote.treatmentPlan}
                  onChange={(e) => setNewNote({ ...newNote, treatmentPlan: e.target.value })}
                  placeholder="جلسات تأهيلية، تمارين منزلية..."
                  className="w-full p-1.5 border border-slate-300 font-arabic focus:border-teal-800"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="visToggle"
                  checked={newNote.visibilityToParents}
                  onChange={(e) => setNewNote({ ...newNote, visibilityToParents: e.target.checked })}
                  className="rounded text-teal-800"
                />
                <label htmlFor="visToggle" className="font-semibold text-slate-700">
                  إتاحة هذا التقرير ليظهر في حساب ولي الأمر عبر المنظومة
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
                  className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white font-bold"
                >
                  حفظ وتأكيد التقرير
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
