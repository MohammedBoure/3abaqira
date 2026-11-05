import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Mail,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Clock,
  ToggleLeft,
  ToggleRight,
  Search,
  Filter,
  Layers,
  Sparkles,
  RefreshCw,
  Eye,
  Reply,
  Shield,
  BellRing,
} from 'lucide-react';

export function CommunicationView({ selectedBranch = 'ALL' }) {
  const [activeTab, setActiveTab] = useState('parent-notes'); // 'parent-notes' | 'notification-queue'
  const [isMessagingActive, setIsMessagingActive] = useState(true);
  const [timeWindow, setTimeWindow] = useState({ start: '08:00', end: '17:00' });
  const [replyText, setReplyText] = useState({});
  const [replyModalNote, setReplyModalNote] = useState(null);

  // Mock Parent Notes (Module 7: 1-reply constraint & time-window control)
  const [parentNotes, setParentNotes] = useState([
    {
      id: 1,
      childName: 'يوسف بن سالم',
      guardianName: 'سالم بن سالم (الأب)',
      guardianPhone: '0550 12 34 56',
      branchName: 'روضة وحضانة العباقرة - جيجل',
      date: '2026-11-05 09:15',
      subject: 'طلب انتباه خاص لوجبة الغداء',
      content: 'السلام عليكم، يوسف يعاني من تحسس طفيف تجاه الفول السوداني نرجو تفادي تقديمه في وجبة اليوم.',
      isAnswered: true,
      staffReply: 'وعليكم السلام، تم تسجيل الملاحظة في ملف الطفل وتبليغ مسؤولة المطبخ والمربية أسماء فوراً. دمتم بخير.',
      repliedBy: 'المربية أسماء بوشامة',
      repliedAt: '2026-11-05 09:30',
    },
    {
      id: 2,
      childName: 'ريان بن علي',
      guardianName: 'طارق بن علي (الأب)',
      guardianPhone: '0661 22 33 44',
      branchName: 'المركز الأكاديمي الرئيسي - جيجل',
      date: '2026-11-05 10:45',
      subject: 'استفسار عن موعد مسابقة السوروبان القادمة',
      content: 'تحية طيبة، أود الاستفسار هل تم تحديد موعد البطولة الولائية للسوروبان لشهر ديسمبر؟',
      isAnswered: false,
      staffReply: null,
      repliedBy: null,
      repliedAt: null,
    },
    {
      id: 3,
      childName: 'مروة رحماني',
      guardianName: 'بشير رحماني (الأب)',
      guardianPhone: '0773 11 00 22',
      branchName: 'أكاديمية العباقرة - فرع الطاهير',
      date: '2026-11-04 16:20',
      subject: 'إشعار تأخر عن حصة القرآن',
      content: 'السلام عليكم، سنصل متأخرين بحوالي ربع ساعة عن حصة القاعدة النورانية لظرف طارئ.',
      isAnswered: true,
      staffReply: 'تم العلم، تم إخطار الأستاذ عبد الرحمن لاستقبال مروة فور وصولها.',
      repliedBy: 'الاستقبال المركزي',
      repliedAt: '2026-11-04 16:25',
    },
  ]);

  // Central Notification Queue Mock Data (Email, SMS, WhatsApp, Telegram)
  const [notificationQueue] = useState([
    {
      id: 'NTF-091',
      recipient: '0550 12 34 56 (سالم بن سالم)',
      channel: 'WHATSAPP',
      eventType: 'ABSENCE_ALERT',
      eventTitle: 'تنبيه غياب فوري',
      snippet: 'نحيطكم علماً بأن التلميذ يوسف بن سالم لم يسجل حضوره لحصة هذا الصباح.',
      status: 'DELIVERED',
      timestamp: '2026-11-05 08:35',
      retryCount: 0,
    },
    {
      id: 'NTF-092',
      recipient: '0661 22 33 44 (طارق بن علي)',
      channel: 'SMS_DZ',
      eventType: 'PAYMENT_RECEIPT',
      eventTitle: 'إيصال سداد نقدي',
      snippet: 'تم استلام مبلغ 8,500 دج نقداً لوصل السداد رقم #REC-2026-00482 بنجاح.',
      status: 'SENT',
      timestamp: '2026-11-05 09:12',
      retryCount: 0,
    },
    {
      id: 'NTF-093',
      recipient: 'parent.amira@gmail.com',
      channel: 'EMAIL',
      eventType: 'REPORT_APPROVAL',
      eventTitle: 'اعتماد التقرير الشهري',
      snippet: 'تم اعتماد بطاقة التقرير والمتابعة الشهرية للطفلة أميرة بوجمعة لشهر نوفمبر 2026.',
      status: 'DELIVERED',
      timestamp: '2026-11-05 10:00',
      retryCount: 0,
    },
    {
      id: 'NTF-094',
      recipient: '@Inas_Applicant_TG',
      channel: 'TELEGRAM',
      eventType: 'INTERVIEW_INVITE',
      eventTitle: 'دعوة لمقابلة التوظيف',
      snippet: 'يسرنا دعوتكم لمقابلة التوظيف الخاصة بمنصب مربية أطفال يوم 2026-11-08.',
      status: 'PENDING',
      timestamp: '2026-11-05 11:20',
      retryCount: 1,
    },
  ]);

  const handleSendSingleReply = (noteId) => {
    const text = replyText[noteId];
    if (!text || !text.trim()) return;

    setParentNotes((prev) =>
      prev.map((n) =>
        n.id === noteId
          ? {
              ...n,
              isAnswered: true,
              staffReply: text.trim(),
              repliedBy: 'محمد بوري (الإدارة المركزية)',
              repliedAt: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }),
            }
          : n
      )
    );
    setReplyModalNote(null);
  };

  return (
    <div className="space-y-3 font-arabic text-xs">
      {/* Top Banner */}
      <div className="bg-white border border-slate-300 p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-900 text-white">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 font-display">
              منظومة التواصل والإشعارات المركزية (Communication Console)
            </h2>
            <p className="text-[11px] text-slate-500">
              رسائل الأولياء المقيدة بإجابة واحدة وقنوات الإشعارات الموحدة (SMS، بريد، WhatsApp، Telegram)
            </p>
          </div>
        </div>

        {/* Messaging Time Window Control (Module 7 Requirement) */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-3 py-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-800">قناة رسائل الأولياء:</span>
            <button
              onClick={() => setIsMessagingActive(!isMessagingActive)}
              className={`px-2 py-0.5 text-[10px] font-bold border transition-colors ${
                isMessagingActive
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-400'
                  : 'bg-rose-100 text-rose-800 border-rose-400'
              }`}
            >
              {isMessagingActive ? 'مفعلة حالياً' : 'موقوفة مؤقتاً'}
            </button>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1 text-[11px] text-slate-600 font-mono">
            <Clock className="w-3.5 h-3.5 text-blue-900" />
            <span>النافذة الزمنية: {timeWindow.start} - {timeWindow.end}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-300 bg-white px-2">
        <button
          onClick={() => setActiveTab('parent-notes')}
          className={`px-3 py-2 font-bold text-xs border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'parent-notes'
              ? 'border-blue-900 text-blue-900 bg-blue-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>رسائل واستفسارات الأولياء ({parentNotes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('notification-queue')}
          className={`px-3 py-2 font-bold text-xs border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'notification-queue'
              ? 'border-blue-900 text-blue-900 bg-blue-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BellRing className="w-3.5 h-3.5" />
          <span>طابور الإشعارات الآلي الموحد (Queue: {notificationQueue.length})</span>
        </button>
      </div>

      {/* Tab 1: Parent Notes */}
      {activeTab === 'parent-notes' && (
        <div className="space-y-3">
          <div className="bg-blue-50/60 border border-blue-200 p-2.5 text-xs text-blue-950 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-900" />
              <span>
                <strong>قاعدة الإجابة الواحدة:</strong> يحق للإدارة أو الأستاذ الرد مرة واحدة فقط على كل رسالة لحسم التنسيق ومنع الإطناب.
              </span>
            </div>
            <span className="font-mono text-[10px] text-blue-800">1-Reply Rule Enforced</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {parentNotes.map((note) => (
              <div
                key={note.id}
                className="bg-white border border-slate-300 p-3 shadow-2xs space-y-2 hover:border-slate-400 transition-colors"
              >
                <div className="flex items-start justify-between border-b border-slate-200 pb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900 text-sm">{note.subject}</strong>
                      <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 text-[10px]">
                        التلميذ: {note.childName}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      المرسل: {note.guardianName} ({note.guardianPhone}) • {note.branchName}
                    </p>
                  </div>
                  <div className="text-end">
                    <span className="font-mono text-[10px] text-slate-400 block">{note.date}</span>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold border ${
                        note.isAnswered
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}
                    >
                      {note.isAnswered ? 'تمت الإجابة' : 'بانتظار الرد (غير مجاب)'}
                    </span>
                  </div>
                </div>

                {/* Parent Message Body */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed text-xs">
                  {note.content}
                </div>

                {/* Staff Response (Single Reply) */}
                {note.isAnswered ? (
                  <div className="p-2.5 bg-emerald-50/50 border border-emerald-200 text-slate-900 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-emerald-800 font-bold">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>رد المؤسسة ({note.repliedBy})</span>
                      </span>
                      <span className="font-mono">{note.repliedAt}</span>
                    </div>
                    <p className="text-slate-700">{note.staffReply}</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500">
                      لم يتم إرسال الرد بعد إلى ولي الأمر.
                    </span>
                    <button
                      onClick={() => setReplyModalNote(note)}
                      className="px-3 py-1 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      <span>كتابة الرد الحاسم (مرة واحدة)</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Notification Queue */}
      {activeTab === 'notification-queue' && (
        <div className="bg-white border border-slate-300 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                طابور الإشعارات الموحد (Unified Multi-Channel Dispatch Queue)
              </h3>
              <p className="text-[11px] text-slate-500">
                معالجة مركزية لكافة الإشعارات عبر 4 قنوات: SMS محلي (الجزائر)، بريد إلكتروني، WhatsApp API، وTelegram
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-xs">
                نسبة التسليم: 98.4%
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border border-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <th className="p-2.5 text-start">معرف الإشعار</th>
                  <th className="p-2.5 text-start">نوع الحدث</th>
                  <th className="p-2.5 text-center">القناة</th>
                  <th className="p-2.5 text-start">المستلم</th>
                  <th className="p-2.5 text-start">نص الإشعار</th>
                  <th className="p-2.5 text-center">الحالة</th>
                  <th className="p-2.5 text-start">التوقيت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {notificationQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold text-blue-900">{item.id}</td>
                    <td className="p-2.5 font-semibold text-slate-900">{item.eventTitle}</td>
                    <td className="p-2.5 text-center">
                      <span className="px-2 py-0.5 bg-slate-100 border border-slate-300 font-mono text-[10px] font-bold text-slate-800">
                        {item.channel}
                      </span>
                    </td>
                    <td className="p-2.5 font-mono text-slate-700">{item.recipient}</td>
                    <td className="p-2.5 text-slate-600 max-w-xs truncate">{item.snippet}</td>
                    <td className="p-2.5 text-center">
                      <span
                        className={`px-2 py-0.5 font-bold text-[10px] border ${
                          item.status === 'DELIVERED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : item.status === 'SENT'
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        {item.status === 'DELIVERED'
                          ? 'تم الاستلام'
                          : item.status === 'SENT'
                          ? 'مرسل'
                          : 'في الطابور'}
                      </span>
                    </td>
                    <td className="p-2.5 font-mono text-slate-500 text-[10px]">{item.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {replyModalNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white border-2 border-slate-800 shadow-2xl w-full max-w-lg p-4 space-y-3 font-arabic text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <strong className="text-sm font-bold text-blue-950">
                إرسال الرد الرسمي لولي أمر: {replyModalNote.childName}
              </strong>
              <button onClick={() => setReplyModalNote(null)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>
            <div className="p-2 bg-slate-50 border border-slate-200 text-slate-700">
              <span className="font-semibold block mb-0.5">رسالة الولي:</span>
              <p>{replyModalNote.content}</p>
            </div>
            <div>
              <label className="font-bold text-slate-800 block mb-1">
                نص الرد الرسمي (لا يمكن تعديله بعد الإرسال):
              </label>
              <textarea
                rows={4}
                value={replyText[replyModalNote.id] || ''}
                onChange={(e) =>
                  setReplyText({ ...replyText, [replyModalNote.id]: e.target.value })
                }
                placeholder="اكتب رد المؤسسة الواضح والشافي هنا..."
                className="w-full p-2 border border-slate-300 bg-white focus:outline-none focus:border-blue-900"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setReplyModalNote(null)}
                className="px-3 py-1 border border-slate-300 hover:bg-slate-100"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleSendSingleReply(replyModalNote.id)}
                className="px-4 py-1 bg-blue-900 hover:bg-blue-800 text-white font-bold flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>إرسال الرد الحاسم</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
