import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { ModalDialog } from '../common/ModalDialog';

export function StudentRegistrationModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('STUDENT');

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="تسجيل تلميذ / طالب جديد (استمارة إلكترونية)"
      subtitle="ربط أولياء الأمور وتحديد جدول الرسوم والأقساط متوافق مع بنية Excel"
    >
      {/* Step Tabs */}
      <div className="flex items-center border border-slate-300 bg-slate-100 mb-4">
        <button
          onClick={() => setActiveTab('STUDENT')}
          className={`flex-1 py-1.5 text-xs font-semibold transition-all ${
            activeTab === 'STUDENT'
              ? 'bg-blue-900 text-white'
              : 'text-slate-700 hover:text-slate-950'
          }`}
        >
          1. البيانات الشخصية
        </button>
        <button
          onClick={() => setActiveTab('GUARDIAN')}
          className={`flex-1 py-1.5 text-xs font-semibold transition-all ${
            activeTab === 'GUARDIAN'
              ? 'bg-blue-900 text-white'
              : 'text-slate-700 hover:text-slate-950'
          }`}
        >
          2. ولي الأمر والاتصال
        </button>
        <button
          onClick={() => setActiveTab('PLAN')}
          className={`flex-1 py-1.5 text-xs font-semibold transition-all ${
            activeTab === 'PLAN'
              ? 'bg-blue-900 text-white'
              : 'text-slate-700 hover:text-slate-950'
          }`}
        >
          3. البرنامج ونظام السداد
        </button>
      </div>

      {/* Tab 1: Student Information */}
      {activeTab === 'STUDENT' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                الاسم واللقب (بالعربية) *
              </label>
              <input
                type="text"
                defaultValue="يونس لعموري"
                className="w-full h-8 px-2.5 text-xs sharp-input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nom et Prénom (en français)
              </label>
              <input
                type="text"
                defaultValue="Laamouri Younes"
                className="w-full h-8 px-2.5 text-xs sharp-input font-latin"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                تاريخ الميلاد
              </label>
              <input
                type="date"
                defaultValue="2018-05-14"
                className="w-full h-8 px-2.5 text-xs sharp-input font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                الجنس
              </label>
              <select className="w-full h-8 px-2.5 text-xs sharp-input">
                <option value="Male">ذكر (Masculin)</option>
                <option value="Female">أنثى (Féminin)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                المقر / الفرع
              </label>
              <select className="w-full h-8 px-2.5 text-xs sharp-input">
                <option value="CENTER">المركز - الأكاديمية</option>
                <option value="RAWDA">الروضة والحضانة</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Guardian Information */}
      {activeTab === 'GUARDIAN' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                اسم الولي الكامل
              </label>
              <input
                type="text"
                defaultValue="عبد الحميد لعموري"
                className="w-full h-8 px-2.5 text-xs sharp-input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                صفة القرابة
              </label>
              <select className="w-full h-8 px-2.5 text-xs sharp-input">
                <option value="Father">الأب (Père)</option>
                <option value="Mother">الأم (Mère)</option>
                <option value="Guardian">ولي شرعي (Tuteur)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                رقم الهاتف الرئيسي *
              </label>
              <input
                type="tel"
                defaultValue="0550 12 34 56"
                className="w-full h-8 px-2.5 text-xs sharp-input font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                رقم هاتف الطوارئ (الاحتياطي)
              </label>
              <input
                type="tel"
                defaultValue="0661 98 76 54"
                className="w-full h-8 px-2.5 text-xs sharp-input font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Program & Fee Plan */}
      {activeTab === 'PLAN' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                البرنامج التعليمي
              </label>
              <select className="w-full h-8 px-2.5 text-xs sharp-input">
                <option value="SOROBAN">الحساب الذهني (السوروبان)</option>
                <option value="ROBOTICS">الروبوتيك والذكاء الاصطناعي</option>
                <option value="DAYCARE">روضة الأطفال والحضانة</option>
                <option value="QURAN">تحفيظ القرآن الكريم</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                نظام الدفع
              </label>
              <select className="w-full h-8 px-2.5 text-xs sharp-input">
                <option value="INSTALLMENTS">4 أقساط قياسية (دفعات)</option>
                <option value="CASH_DISCOUNT">دفع كامل كاش (خصم 500 دج)</option>
                <option value="MONTHLY">اشتراك شهري متكرر</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-300 flex items-center justify-between text-xs font-medium text-slate-800">
            <span>المبلغ الإجمالي المتفق عليه:</span>
            <span className="font-mono text-base font-bold text-emerald-800">
              12,000 دج
            </span>
          </div>
        </div>
      )}
    </ModalDialog>
  );
}

export function CashDrawerModal({ isOpen, onClose }) {
  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="مطابقة الخزينة والصندوق اليومي (إغلاق الوردية)"
      subtitle="محاكاة مطابقة الرصيد النقدي الفعلي مع مجموع الإيصالات المسجلة في المنظومة"
    >
      <div className="space-y-3 text-xs">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 bg-slate-50 border border-slate-300">
            <span className="text-slate-500 block mb-1">الرصيد الافتتاحي</span>
            <span className="font-mono font-bold text-sm text-slate-900">25,000 دج</span>
          </div>
          <div className="p-2.5 bg-emerald-50 border border-emerald-300">
            <span className="text-emerald-900 block mb-1">إجمالي المقبوضات</span>
            <span className="font-mono font-bold text-sm text-emerald-800">+163,200 دج</span>
          </div>
          <div className="p-2.5 bg-rose-50 border border-rose-300">
            <span className="text-rose-900 block mb-1">إجمالي المصاريف</span>
            <span className="font-mono font-bold text-sm text-rose-800">-3,700 دج</span>
          </div>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-300 flex items-center justify-between">
          <div>
            <div className="font-bold text-slate-900 text-sm">الرصيد الصافي الإجمالي:</div>
            <div className="text-[11px] text-slate-600">مطابق تماماً مع إيصالات القبض والصرف</div>
          </div>
          <div className="font-mono font-extrabold text-xl text-blue-950">
            184,500 دج
          </div>
        </div>

        <div className="p-2.5 bg-emerald-50 border border-emerald-300 flex items-center gap-2 text-emerald-900">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
          <span>تم التدقيق: لا يوجد أي فارق أو عجز بين العد الفعلي للنقد والحسابات الآلية (الفارق: 0.00 دج).</span>
        </div>
      </div>
    </ModalDialog>
  );
}

