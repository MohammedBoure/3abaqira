import React, { useState } from 'react';
import {
  Activity,
  Server,
  Database,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Edit2,
  Plus,
  ShieldCheck,
  Cpu,
  HardDrive,
  Clock,
  Layers,
  Sparkles,
  X,
  AlertCircle,
} from 'lucide-react';
import { MOCK_SYSTEM_TELEMETRY } from '../../mock/mockData';

export function SystemHealthView() {
  const [telemetry, setTelemetry] = useState(MOCK_SYSTEM_TELEMETRY);
  const [metadataList, setMetadataList] = useState([
    { key: 'academy_name_ar', value: telemetry.metadata.academy_name_ar, desc: 'الاسم الرسمي للأكاديمية بالعربية', category: 'BRANDING' },
    { key: 'academy_name_en', value: telemetry.metadata.academy_name_en, desc: 'الاسم الرسمي باللاتينية', category: 'BRANDING' },
    { key: 'currency', value: telemetry.metadata.currency, desc: 'عملة الفواتير والمعاملات المالية الافتراضية', category: 'FINANCE' },
    { key: 'active_year', value: telemetry.metadata.active_year, desc: 'الموسم الدراسي المالي والتربوي النشط حالياً', category: 'ACADEMIC' },
    { key: 'platform_version', value: telemetry.metadata.platform_version, desc: 'إصدار المنظومة البرمجية', category: 'SYSTEM' },
    { key: 'archive_mode', value: telemetry.metadata.archive_mode, desc: 'وضع فحص الأرشيف التاريخي غير الهدام', category: 'SECURITY' },
    { key: 'cash_drawer_auto_sync', value: 'ENABLED', desc: 'ترحيل إيرادات الوصولات فورياً إلى الصندوق', category: 'FINANCE' },
    { key: 'audit_retention_days', value: '365', desc: 'مدة الاحتفاظ بسجلات التدقيق الأمني (أيام)', category: 'AUDIT' },
  ]);

  const [activeSubTab, setActiveSubTab] = useState('telemetry'); // 'telemetry' | 'metadata'
  const [isPinging, setIsPinging] = useState(false);
  const [pingSuccess, setPingSuccess] = useState(false);
  const [selectedMetaEdit, setSelectedMetaEdit] = useState(null);
  const [isAddMetaModalOpen, setIsAddMetaModalOpen] = useState(false);
  const [newMeta, setNewMeta] = useState({ key: '', value: '', desc: '', category: 'SYSTEM' });

  const handlePing = () => {
    setIsPinging(true);
    setTimeout(() => {
      setIsPinging(false);
      setPingSuccess(true);
      setTimeout(() => setPingSuccess(false), 4000);
    }, 600);
  };

  const handleUpdateMeta = (e) => {
    e.preventDefault();
    if (!selectedMetaEdit) return;
    setMetadataList((prev) =>
      prev.map((item) =>
        item.key === selectedMetaEdit.key ? { ...item, value: selectedMetaEdit.value } : item
      )
    );
    setSelectedMetaEdit(null);
  };

  const handleAddMeta = (e) => {
    e.preventDefault();
    if (!newMeta.key || !newMeta.value) return;
    setMetadataList([...metadataList, newMeta]);
    setIsAddMetaModalOpen(false);
    setNewMeta({ key: '', value: '', desc: '', category: 'SYSTEM' });
  };

  return (
    <div className="space-y-3 font-arabic">
      {/* 1. Module Header */}
      <div className="bg-white border border-slate-300 p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="eyebrow flex items-center gap-1.5 text-blue-900">
            <Activity className="w-3.5 h-3.5" />
            <span>حالة الخادم وقاعدة البيانات المركزية</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold font-serif text-slate-900 mt-0.5">
            صحة الخادم، قاعدة البيانات والإعدادات (System Telemetry & Metadata)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            مراقبة زمن استجابة قاعدة البيانات (MySQL)، بركة الاتصالات النشطة، حالة وضع الأرشيف، وضبط معاملات النظام (App Metadata).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="view-switch text-xs">
            <button
              onClick={() => setActiveSubTab('telemetry')}
              className={activeSubTab === 'telemetry' ? 'active' : ''}
            >
              <Server className="w-3 h-3" />
              <span>مؤشرات الخادم وقاعدة البيانات</span>
            </button>
            <button
              onClick={() => setActiveSubTab('metadata')}
              className={activeSubTab === 'metadata' ? 'active' : ''}
            >
              <Sliders className="w-3 h-3" />
              <span>بارامترات النظام (Metadata)</span>
            </button>
          </div>

          <button
            onClick={handlePing}
            disabled={isPinging}
            className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-medium text-xs rounded flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
            <span>فحص الاتصال الفوري (Ping)</span>
          </button>
        </div>
      </div>

      {pingSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-3 py-2 rounded text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>قاعدة البيانات متصلة بنجاح: MySQL 8.0 InnoDB — زمن الاستجابة 1.2ms (Pool 10/10)</span>
          </div>
          <span className="font-mono text-[11px] text-emerald-700">STATUS 200 OK</span>
        </div>
      )}

      {/* 2. Operational Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="bg-white border border-slate-300 p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">حالة الخادم الخلفي</span>
            <Server className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-emerald-700">ONLINE</span>
            <span className="tag-blue text-[10px]">3abaqira-backend</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Uptime: 4 أيام و 6 ساعات متواصلة</p>
        </div>

        <div className="bg-white border border-slate-300 p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">زمن استجابة DB</span>
            <Database className="w-4 h-4 text-blue-900" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-blue-950">
              {telemetry.database.latency_ms} ms
            </span>
            <span className="text-[11px] text-emerald-700 font-bold">فائق السرعة</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">MySQL 8.0 (InnoDB) عبر بركة الاتصالات</p>
        </div>

        <div className="bg-white border border-slate-300 p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">جداول البيانات النشطة</span>
            <Layers className="w-4 h-4 text-indigo-700" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-indigo-700">
              {telemetry.database.tables_count}
            </span>
            <span className="text-[11px] text-slate-600 font-medium">جدول علائقي</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{telemetry.database.total_records.toLocaleString()} سجل إجمالي</p>
        </div>

        <div className="bg-white border border-slate-300 p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">وضع تدقيق الأرشيف</span>
            <ShieldCheck className="w-4 h-4 text-blue-950" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-slate-900">
              {telemetry.metadata.archive_mode}
            </span>
            <span className="tag-blue text-[10px]">قراءة وكتابة</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">الموسم الدراسي: {telemetry.metadata.active_year}</p>
        </div>
      </div>

      {/* 3. Sub-Tab 1: Telemetry & Multi-Branch Architecture */}
      {activeSubTab === 'telemetry' && (
        <div className="space-y-3">
          {/* Infrastructure Health Block */}
          <div className="bg-white border border-slate-300 p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-900" />
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                  البنية التحتية الموزعة للفروع والقاعات (Multi-Campus Infrastructure)
                </h3>
              </div>
              <span className="tag-blue text-[10px]">متزامن بنسبة 100%</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="text-slate-500 font-medium">الفروع النشطة</div>
                <div className="text-lg font-bold font-mono text-slate-900 mt-1">
                  {telemetry.infrastructure.campuses_count} فروع
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">المركز الأكاديمي + الروضة</div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="text-slate-500 font-medium">القاعات البيداغوجية</div>
                <div className="text-lg font-bold font-mono text-slate-900 mt-1">
                  {telemetry.infrastructure.classrooms_count} قاعة
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">موزعة على المقرين</div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="text-slate-500 font-medium">الطاقة الاستيعابية</div>
                <div className="text-lg font-bold font-mono text-slate-900 mt-1">
                  {telemetry.infrastructure.total_capacity} مقعد
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">سعة المقاعد القصوى</div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="text-slate-500 font-medium">الطلاب المسجلين</div>
                <div className="text-lg font-bold font-mono text-blue-900 mt-1">
                  {telemetry.infrastructure.enrolled_students} طالب
                </div>
                <div className="text-[11px] text-emerald-700 font-bold mt-0.5">نسبة إشغال 85.3%</div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="text-slate-500 font-medium">الطاقم الوظيفي</div>
                <div className="text-lg font-bold font-mono text-slate-900 mt-1">
                  {telemetry.infrastructure.active_staff} موظف
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">إدارة، مدربين ومربيات</div>
              </div>
            </div>
          </div>

          {/* Database & Pool State Table */}
          <div className="bg-white border border-slate-300 shadow-xs overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-300 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-semibold text-slate-700">
                <HardDrive className="w-4 h-4 text-blue-900" />
                <span>مواصفات الاتصال المباشر بقاعدة البيانات (Database Connection Specifications)</span>
              </div>
              <span className="font-mono text-emerald-700 text-[11px] font-bold">POOL HEALTHY ✓</span>
            </div>

            <div className="overflow-x-auto">
              <table className="excel-table text-xs w-full">
                <thead>
                  <tr>
                    <th>المعيار التقني</th>
                    <th>القيمة الحالية</th>
                    <th>الحالة التشغيلية</th>
                    <th>ملاحظات الأداء</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-bold text-slate-800">محرك قاعدة البيانات (DB Engine)</td>
                    <td className="font-mono text-blue-950 font-semibold">{telemetry.database.engine}</td>
                    <td>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                        ACTIVE
                      </span>
                    </td>
                    <td className="text-slate-500">معاملات ذرية كاملة تدعم ACID Transactions</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-slate-800">اسم قاعدة البيانات (Schema)</td>
                    <td className="font-mono text-slate-900">{telemetry.database.database_name}</td>
                    <td>
                      <span className="tag-blue text-[10px]">CONNECTED</span>
                    </td>
                    <td className="text-slate-500">قاعدة بيانات موحدة تربط كافة الفروع والحسابات</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-slate-800">بركة الاتصالات (Connection Pool)</td>
                    <td className="font-mono text-slate-900">{telemetry.database.connection_pool}</td>
                    <td>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                        OPTIMAL
                      </span>
                    </td>
                    <td className="text-slate-500">اتصالات مسبقة التهيئة بدون تكلفة Handshake إضافية</td>
                  </tr>
                  <tr>
                    <td className="font-bold text-slate-800">وضع الأرشيف (Archive View Mode)</td>
                    <td className="font-mono text-slate-900">{telemetry.metadata.archive_mode}</td>
                    <td>
                      <span className="tag-blue text-[10px]">NORMAL</span>
                    </td>
                    <td className="text-slate-500">الموسم الحالي نشط وقابل للإدخال والتعديل</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. Sub-Tab 2: Application Metadata & Configuration Table */}
      {activeSubTab === 'metadata' && (
        <div className="bg-white border border-slate-300 shadow-xs overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-300 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-semibold text-slate-700">
              <Sliders className="w-4 h-4 text-blue-900" />
              <span>جدول بارامترات النظام والهوية المؤسسية (App Metadata Registry)</span>
            </div>
            <button
              onClick={() => setIsAddMetaModalOpen(true)}
              className="px-2.5 py-1 bg-blue-900 hover:bg-blue-800 text-white rounded text-xs flex items-center gap-1 font-medium shadow-xs"
            >
              <Plus className="w-3 h-3" />
              <span>إضافة بارامتر جديد</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="excel-table text-xs w-full">
              <thead>
                <tr>
                  <th className="w-12 text-center">#</th>
                  <th>مفتاح الإعداد (Meta Key)</th>
                  <th>التصنيف</th>
                  <th>القيمة الحالية (Meta Value)</th>
                  <th>الوصف والوظيفة التشغيلية</th>
                  <th className="text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {metadataList.map((item, idx) => (
                  <tr key={item.key} className="hover:bg-blue-50/40">
                    <td className="text-center font-mono text-slate-400">{idx + 1}</td>
                    <td className="font-mono font-bold text-blue-950">{item.key}</td>
                    <td>
                      <span className="tag-blue text-[10px]">{item.category}</span>
                    </td>
                    <td className="font-bold text-slate-900 font-mono">{item.value}</td>
                    <td className="text-slate-600">{item.desc}</td>
                    <td className="text-center">
                      <button
                        onClick={() => setSelectedMetaEdit(item)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 text-blue-900 border border-slate-300 rounded text-[11px] font-medium inline-flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>تعديل</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Modal: Edit Metadata */}
      {selectedMetaEdit && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-300 w-full max-w-md shadow-2xl rounded p-4 font-arabic">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-1.5 text-blue-950 font-bold text-sm">
                <Edit2 className="w-4 h-4 text-blue-800" />
                <span>تعديل بارامتر النظام (Edit Metadata Value)</span>
              </div>
              <button
                onClick={() => setSelectedMetaEdit(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateMeta} className="space-y-3 mt-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">المفتاح البرمجي</label>
                <input
                  type="text"
                  disabled
                  value={selectedMetaEdit.key}
                  className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-300 rounded font-mono text-slate-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">القيمة الجديدة (Meta Value)</label>
                <input
                  type="text"
                  required
                  value={selectedMetaEdit.value}
                  onChange={(e) =>
                    setSelectedMetaEdit({ ...selectedMetaEdit, value: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none font-medium"
                />
              </div>

              <div className="p-2 bg-blue-50/50 border border-blue-200 rounded text-[11px] text-blue-900">
                <div className="flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-800" />
                  <span>تطبيق فوري:</span>
                </div>
                <p className="mt-0.5 text-slate-600">
                  يتم تحديث البارامتر وتطبيقه على كافة الفروع والمعاملات بدون الحاجة لإعادة تشغيل الخادم.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedMetaEdit(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-600 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded font-medium shadow-xs"
                >
                  حفظ التعديل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal: Add Metadata */}
      {isAddMetaModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-300 w-full max-w-md shadow-2xl rounded p-4 font-arabic">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-1.5 text-blue-950 font-bold text-sm">
                <Plus className="w-4 h-4 text-blue-800" />
                <span>إضافة بارامتر إعداد جديد (Add Configuration Key)</span>
              </div>
              <button
                onClick={() => setIsAddMetaModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMeta} className="space-y-3 mt-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">المفتاح البرمجي (Meta Key)</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: max_login_attempts"
                  value={newMeta.key}
                  onChange={(e) => setNewMeta({ ...newMeta, key: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">القيمة (Meta Value)</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: 5"
                    value={newMeta.value}
                    onChange={(e) => setNewMeta({ ...newMeta, value: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">التصنيف</label>
                  <select
                    value={newMeta.category}
                    onChange={(e) => setNewMeta({ ...newMeta, category: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none"
                  >
                    <option value="SYSTEM">SYSTEM</option>
                    <option value="FINANCE">FINANCE</option>
                    <option value="ACADEMIC">ACADEMIC</option>
                    <option value="BRANDING">BRANDING</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">الوصف البيداغوجي والتشغيلي</label>
                <input
                  type="text"
                  placeholder="وصف مختصر للوظيفة..."
                  value={newMeta.desc}
                  onChange={(e) => setNewMeta({ ...newMeta, desc: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-blue-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddMetaModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-600 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded font-medium shadow-xs"
                >
                  حفظ البارامتر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
