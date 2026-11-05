import React, { useState } from 'react';
import {
  Bell,
  Send,
  MessageSquare,
  Mail,
  Smartphone,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Search,
  Filter,
  Printer,
  ChevronDown,
  Layers,
  Activity,
} from 'lucide-react';
import {
  MOCK_NOTIFICATION_QUEUE,
} from '../../../mock/geniusKindergartenFinanceMockData';

export function NotificationQueueMonitorView() {
  const [queue, setQueue] = useState(MOCK_NOTIFICATION_QUEUE);
  const [channelFilter, setChannelFilter] = useState('ALL'); // ALL, SMS, WHATSAPP, TELEGRAM, EMAIL
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, DELIVERED, SENT, PENDING, FAILED
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleRetryNotification = (notifId) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.id === notifId
          ? {
              ...item,
              status: 'SENT',
              retryCount: item.retryCount + 1,
              sentAt: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }),
            }
          : item
      )
    );
    triggerToast(`تمت إعادة جدولة وإرسال الإشعار رقم [${notifId}] إلى بوابة المزود.`);
  };

  const filteredQueue = queue.filter((item) => {
    const matchesChannel = channelFilter === 'ALL' || item.channel === channelFilter;
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesSearch =
      item.recipientName.includes(searchQuery) ||
      item.recipientTarget.includes(searchQuery) ||
      item.payloadText.includes(searchQuery) ||
      item.eventTitleAr.includes(searchQuery);
    return matchesChannel && matchesStatus && matchesSearch;
  });

  const deliveredCount = queue.filter((q) => q.status === 'DELIVERED').length;
  const sentCount = queue.filter((q) => q.status === 'SENT').length;
  const pendingCount = queue.filter((q) => q.status === 'PENDING').length;
  const failedCount = queue.filter((q) => q.status === 'FAILED').length;

  return (
    <div className="space-y-3 font-arabic text-slate-800">
      {/* 1. Header & Live Telemetry */}
      <div className="bg-white border border-slate-200 p-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2.5 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 leading-none">
                  طابور الإشعارات والرسائل الصادرة (Outbound Notification Queue Monitor)
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-50 text-blue-900 border border-blue-200 font-bold">
                  طابور موحد: SMS • WhatsApp • Telegram • Email
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                مراقبة إرسال تنبيهات الغياب، وصولات القبض، اعتماد التقارير، ودعوات المقابلات عبر بوابات الاتصال الجزائرية والدولية.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                triggerToast('تم تحديث حالة تسليم الإشعارات عبر بوابات الـ Webhooks.');
              }}
              className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-1.5 shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-900" />
              <span>تحديث الحالة الحية</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-2 py-1 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-1 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>طباعة السجل</span>
            </button>
          </div>
        </div>

        {/* 4 Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2 bg-emerald-50/50 border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-800 block">تم التسليم بنجاح (Delivered)</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-emerald-900">{deliveredCount}</span>
              <span className="text-[10px] text-emerald-700 font-bold">وصول مؤكد للولي</span>
            </div>
          </div>
          <div className="p-2 bg-blue-50/50 border border-blue-200">
            <span className="text-[10px] font-bold text-blue-800 block">مرسل عبر البوابة (Sent)</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-blue-900">{sentCount}</span>
              <span className="text-[10px] text-blue-700 font-mono">في انتظار التقرير</span>
            </div>
          </div>
          <div className="p-2 bg-amber-50/50 border border-amber-200">
            <span className="text-[10px] font-bold text-amber-800 block">في طابور الإرسال (Pending)</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-amber-900">{pendingCount}</span>
              <span className="text-[10px] text-amber-700 font-mono">جدولة زمنية</span>
            </div>
          </div>
          <div className="p-2 bg-rose-50/50 border border-rose-200">
            <span className="text-[10px] font-bold text-rose-800 block">فشل الإرسال (Failed)</span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="text-lg font-bold font-mono text-rose-900">{failedCount}</span>
              <span className="text-[10px] text-rose-700 font-bold">يتطلب إعادة محاولة</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-white border border-slate-200 p-2 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute start-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالمستلم، رقم الهاتف، أو نص الإشعار..."
              className="w-full ps-8 pe-2 py-1 text-xs border border-slate-200 bg-slate-50/50"
            />
          </div>
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="text-xs p-1 border border-slate-200 bg-white font-arabic font-semibold"
          >
            <option value="ALL">كافة القنوات (All Channels)</option>
            <option value="SMS">SMS (Mobilis/Ooredoo)</option>
            <option value="WHATSAPP">WhatsApp Cloud</option>
            <option value="TELEGRAM">Telegram Bot</option>
            <option value="EMAIL">البريد الإلكتروني (SMTP)</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs p-1 border border-slate-200 bg-white font-arabic font-semibold"
          >
            <option value="ALL">كافة الحالات</option>
            <option value="DELIVERED">تم التسليم</option>
            <option value="SENT">أرسل</option>
            <option value="PENDING">في الانتظار</option>
            <option value="FAILED">فشل</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          عرض <span className="font-bold text-slate-800">{filteredQueue.length}</span> إشعار في الطابور
        </div>
      </div>

      {/* 3. Notification Queue Grid */}
      <div className="bg-white border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold select-none">
                <th className="py-2 px-2 text-center border-e border-slate-200 w-10">#</th>
                <th className="py-2 px-2 text-center border-e border-slate-200 w-24">معرّف الإشعار</th>
                <th className="py-2 px-2 text-center border-e border-slate-200 w-24">القناة</th>
                <th className="py-2 px-2.5 text-start border-e border-slate-200">الحدث والهدف</th>
                <th className="py-2 px-2.5 text-start border-e border-slate-200">المستلم والوجهة</th>
                <th className="py-2 px-2.5 text-start border-e border-slate-200 min-w-[260px]">
                  نص الإشعار المرسل (Payload)
                </th>
                <th className="py-2 px-2 text-center border-e border-slate-200 w-24">التوقيت</th>
                <th className="py-2 px-2 text-center border-e border-slate-200 w-28">حالة التسليم</th>
                <th className="py-2 px-2 text-center w-24">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredQueue.map((item, idx) => {
                const isFailed = item.status === 'FAILED';
                const isDelivered = item.status === 'DELIVERED';
                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      isFailed ? 'bg-rose-50/20' : isDelivered ? 'hover:bg-slate-50' : 'bg-amber-50/10'
                    }`}
                  >
                    <td className="py-2 px-2 text-center font-mono text-slate-500 border-e border-slate-200">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-2 text-center font-mono font-bold text-slate-800 border-e border-slate-200">
                      {item.id}
                    </td>
                    <td className="py-2 px-2 text-center border-e border-slate-200">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold font-mono border ${
                          item.channel === 'WHATSAPP'
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                            : item.channel === 'SMS'
                            ? 'bg-blue-50 text-blue-900 border-blue-300'
                            : item.channel === 'TELEGRAM'
                            ? 'bg-sky-50 text-sky-900 border-sky-300'
                            : 'bg-purple-50 text-purple-900 border-purple-300'
                        }`}
                      >
                        {item.channel}
                      </span>
                    </td>
                    <td className="py-2 px-2.5 border-e border-slate-200 font-bold text-slate-900">
                      <div className="flex flex-col">
                        <span>{item.eventTitleAr}</span>
                        <span className="text-[10px] font-mono text-slate-400 font-normal">
                          {item.eventType}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-2.5 border-e border-slate-200">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">{item.recipientName}</span>
                        <span className="text-[10px] font-mono text-slate-500">{item.recipientTarget}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2.5 border-e border-slate-200 text-slate-700 leading-relaxed text-[11px]">
                      <p className="line-clamp-2">{item.payloadText}</p>
                      <span className="text-[9px] font-mono text-slate-400 block mt-0.5">
                        بوابة: {item.gatewayProvider}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center font-mono text-[10px] text-slate-600 border-e border-slate-200">
                      <div>{item.queuedAt?.split(' ')[1] || item.queuedAt}</div>
                      <div className="text-slate-400">{item.queuedAt?.split(' ')[0]}</div>
                    </td>
                    <td className="py-2 px-2 text-center border-e border-slate-200">
                      {isDelivered ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          تم التسليم
                        </span>
                      ) : item.status === 'SENT' ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          <Send className="w-3 h-3 text-blue-600" />
                          أرسل
                        </span>
                      ) : item.status === 'PENDING' ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          قيد الانتظار
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          فشل ({item.retryCount})
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center">
                      {isFailed ? (
                        <button
                          onClick={() => handleRetryNotification(item.id)}
                          className="px-2 py-0.5 text-[10px] font-bold bg-rose-700 hover:bg-rose-800 text-white flex items-center justify-center gap-1 w-full shadow-2xs"
                        >
                          <RefreshCw className="w-3 h-3" />
                          إعادة إرسال
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">--</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-12 end-4 z-50 bg-blue-950 text-white px-3.5 py-2 text-xs shadow-xl border border-blue-800 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Bell className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
