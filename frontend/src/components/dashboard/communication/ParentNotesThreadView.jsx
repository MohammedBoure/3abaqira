import React, { useState } from 'react';
import {
  MessageSquare,
  Clock,
  Send,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  Shield,
  Search,
  User,
  Baby,
  Reply,
  Lock,
  Unlock,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import {
  MOCK_PARENT_NOTES,
  MOCK_COMM_POLICY,
  MOCK_KG_STUDENTS,
} from '../../../mock/geniusKindergartenFinanceMockData';

export function ParentNotesThreadView() {
  const [notes, setNotes] = useState(MOCK_PARENT_NOTES);
  const [policy, setPolicy] = useState(MOCK_COMM_POLICY);
  const [selectedNote, setSelectedNote] = useState(MOCK_PARENT_NOTES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, PENDING, ANSWERED
  const [replyText, setReplyText] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Toggle master communication active state
  const handleTogglePolicyEnabled = () => {
    const nextState = !policy.isEnabled;
    setPolicy({ ...policy, isEnabled: nextState });
    triggerToast(
      nextState
        ? 'تم تفعيل استقبال رسائل وملاحظات الأولياء بنجاح.'
        : 'تم إيقاف استقبال رسائل وملاحظات الأولياء مؤقتاً من قبل الإدارة.'
    );
  };

  // Toggle time window restriction
  const handleToggleWindowRestriction = () => {
    setPolicy({ ...policy, isWindowRestricted: !policy.isWindowRestricted });
    triggerToast('تم تحديث سياسة النافذة الزمنية المخصصة لرسائل الأولياء.');
  };

  // Staff single reply action (Rule: "staff answer once")
  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim()) {
      alert('يرجى كتابة نص الرد قبل الإرسال');
      return;
    }
    if (selectedNote.status === 'ANSWERED') {
      alert('قاعدة النظام: تم الرد على هذه الملاحظة سابقاً. يسمح بالرد لمرة واحدة فقط لكل رسالة (Staff answer once).');
      return;
    }

    const nowStr = new Date().toLocaleString('ar-DZ', { hour12: false });
    const updatedNote = {
      ...selectedNote,
      staffReply: replyText,
      repliedBy: 'محمد بوري (المدير العام)',
      repliedAt: nowStr,
      status: 'ANSWERED',
    };

    setNotes((prev) => prev.map((n) => (n.id === updatedNote.id ? updatedNote : n)));
    setSelectedNote(updatedNote);
    setReplyText('');
    triggerToast(`تم إرسال الرد الرسمي لولي أمر التلميذ: ${updatedNote.studentName}`);
  };

  const filteredNotes = notes.filter((n) => {
    const matchesStatus = statusFilter === 'ALL' || n.status === statusFilter;
    const matchesSearch =
      n.studentName.includes(searchQuery) ||
      n.parentName.includes(searchQuery) ||
      n.message.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const pendingCount = notes.filter((n) => n.status === 'PENDING').length;
  const answeredCount = notes.filter((n) => n.status === 'ANSWERED').length;

  return (
    <div className="space-y-3 font-arabic text-slate-800">
      {/* 1. Header & Policy Configuration Strip */}
      <div className="bg-white border border-slate-200 p-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2.5 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 leading-none">
                  دفتر الملاحظات والمراسلات الثنائية مع الأولياء (Parent Notes Thread)
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-50 text-blue-900 border border-blue-200 font-bold">
                  رد موظف لمرة واحدة (Staff Answer Once)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                ملاحظات الأولياء المباشرة للإدارة أو المربيات، مع التحكم الإداري بالنوافذ الزمنية المسموحة والرد الرسمي الموحد.
              </p>
            </div>
          </div>

          {/* Admin Policy Controls */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Window Restriction Toggle */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1">
              <Clock className="w-3.5 h-3.5 text-blue-800" />
              <span className="font-semibold text-slate-700">النافذة الزمنية:</span>
              <span className="font-mono font-bold text-slate-900">
                {policy.windowStart} - {policy.windowEnd}
              </span>
              <button
                onClick={handleToggleWindowRestriction}
                className="ms-1 text-slate-500 hover:text-slate-800"
                title="تفعيل/تعطيل تقييد الإرسال بأوقات الدوام"
              >
                {policy.isWindowRestricted ? (
                  <ToggleRight className="w-5 h-5 text-emerald-600 inline" />
                ) : (
                  <ToggleLeft className="w-5 h-5 text-slate-400 inline" />
                )}
              </button>
            </div>

            {/* Master Enabled Toggle */}
            <button
              onClick={handleTogglePolicyEnabled}
              className={`px-2.5 py-1 text-xs font-bold flex items-center gap-1.5 border transition-colors shadow-2xs ${
                policy.isEnabled
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100'
              }`}
            >
              {policy.isEnabled ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>المراسلة مفتوحة للأولياء</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-rose-700" />
                  <span>المراسلة مغلقة بقرار إداري</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 4 Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2 bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 block">إجمالي الملاحظات الواردة</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-slate-900">{notes.length}</span>
              <span className="text-[10px] text-slate-500 font-mono">رسالة مسجلة</span>
            </div>
          </div>
          <div className="p-2 bg-amber-50/50 border border-amber-200">
            <span className="text-[10px] font-bold text-amber-800 block">بانتظار رد الطاقم (Pending)</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-amber-900">{pendingCount}</span>
              <span className="text-[10px] text-amber-700 font-bold">يتطلب رداً سريعاً</span>
            </div>
          </div>
          <div className="p-2 bg-emerald-50/50 border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-800 block">تمت الإجابة عنها (Answered)</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-emerald-900">{answeredCount}</span>
              <span className="text-[10px] text-emerald-700 font-bold">رد رسمي مغلق</span>
            </div>
          </div>
          <div className="p-2 bg-blue-50/50 border border-blue-200">
            <span className="text-[10px] font-bold text-blue-800 block">سياسة الرد المعتمدة</span>
            <div className="mt-1 text-[11px] font-bold text-slate-800">
              رد واحد محدد لكل رسالة
            </div>
          </div>
        </div>
      </div>

      {/* 2. Split Workspace: Threads List (5 cols) & Thread Interaction Panel (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Threads List */}
        <div className="lg:col-span-5 bg-white border border-slate-200 shadow-2xs flex flex-col">
          <div className="p-2 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute start-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بالطفل، الولي، أو نص الرسالة..."
                className="w-full ps-7 pe-2 py-0.5 text-xs border border-slate-200 bg-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs p-1 border border-slate-200 bg-white font-arabic font-semibold"
            >
              <option value="ALL">الكل</option>
              <option value="PENDING">في الانتظار</option>
              <option value="ANSWERED">مجاب عنها</option>
            </select>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[500px]">
            {filteredNotes.map((note) => {
              const isSelected = selectedNote?.id === note.id;
              const isPending = note.status === 'PENDING';
              return (
                <div
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className={`p-2.5 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50/70 border-s-4 border-blue-900' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900">{note.studentName}</span>
                    <span className="text-[10px] font-mono text-slate-500">{note.sentAt}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mb-1 flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    <span className="font-semibold text-slate-700">{note.parentName}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-blue-900 font-bold">{note.recipientLabelAr}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2 mb-1.5 leading-relaxed">
                    "{note.message}"
                  </p>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 font-mono">{note.id}</span>
                    {isPending ? (
                      <span className="font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 border border-amber-200">
                        بانتظار الرد
                      </span>
                    ) : (
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 border border-emerald-200">
                        تم الرد رسمياً
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Thread Interaction Panel */}
        <div className="lg:col-span-7 bg-white border border-slate-200 shadow-2xs p-4 flex flex-col justify-between">
          {selectedNote ? (
            <div className="space-y-4 text-xs">
              {/* Header Box */}
              <div className="border-b border-slate-200 pb-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    محادثة رقم: {selectedNote.id} • {selectedNote.sentAt}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    التلميذ: {selectedNote.studentName} ({selectedNote.bandName})
                  </h3>
                </div>
                <div className="text-end">
                  <span className="text-[10px] text-slate-500 block">الجهة المقصودة:</span>
                  <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 border border-blue-200 inline-block mt-0.5">
                    {selectedNote.recipientLabelAr}
                  </span>
                </div>
              </div>

              {/* Parent Message Bubble */}
              <div className="p-3 bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-[11px] border-b border-slate-200/60 pb-1 text-slate-600">
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-blue-800" />
                    رسالة الولي: {selectedNote.parentName}
                  </span>
                  <span className="font-mono text-slate-500">{selectedNote.sentAt}</span>
                </div>
                <p className="text-slate-800 leading-relaxed ps-1 pt-1 text-xs">
                  {selectedNote.message}
                </p>
              </div>

              {/* Staff Response Bubble or Reply Input */}
              {selectedNote.staffReply ? (
                <div className="p-3 bg-emerald-50/40 border border-emerald-200 space-y-1">
                  <div className="flex items-center justify-between text-[11px] border-b border-emerald-200/60 pb-1 text-emerald-900">
                    <span className="font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                      رد المؤسسة الرسمي: {selectedNote.repliedBy}
                    </span>
                    <span className="font-mono text-emerald-700">{selectedNote.repliedAt}</span>
                  </div>
                  <p className="text-emerald-950 leading-relaxed ps-1 pt-1 text-xs font-medium">
                    {selectedNote.staffReply}
                  </p>
                  <div className="pt-2 text-[10px] text-slate-400 font-mono text-end">
                    • تم إغلاق الموضوع رسمياً (Staff answer once policy enforced)
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSendReply} className="space-y-2 border-t border-slate-200 pt-3">
                  <label className="block font-bold text-slate-800">
                    تحرير الرد الرسمي من قبل الإدارة أو المربية المعنية *
                  </label>
                  <textarea
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="اكتب رداً مهنياً وواضحاً لولي الأمر (سيتم إرسال هذا الرد لمرة واحدة فقط وإغلاق الرسالة)..."
                    className="w-full p-2.5 border border-slate-300 font-arabic text-xs focus:outline-none focus:border-blue-900"
                    required
                  />
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-500">
                      قاعدة النظام: يسمح برد واحد محدد من المؤسسة ولا تفتح محادثات غير منتهية.
                    </span>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-bold flex items-center gap-1.5 shadow-2xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>إرسال الرد الرسمي</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">يرجى اختيار ملاحظة للمعاينة والرد</div>
          )}
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-12 end-4 z-50 bg-blue-950 text-white px-3.5 py-2 text-xs shadow-xl border border-blue-800 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
