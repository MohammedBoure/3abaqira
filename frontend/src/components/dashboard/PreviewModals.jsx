import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { ModalDialog } from '../common/ModalDialog';

export function StudentRegistrationModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('STUDENT');

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title="تسجيل تلميذ / طالب جديد (معاينة مرئية)"
      subtitle="استمارة إلكترونية ثنائية اللغة لربط أولياء الأمور وتحديد جدول الرسوم والأقساط"
    >
      {/* Step Tabs */}
      <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 border border-slate-200 mb-5">
        <button
          onClick={() => setActiveTab('STUDENT')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'STUDENT'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          1. البيانات الشخصية
        </button>
        <button
          onClick={() => setActiveTab('GUARDIAN')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'GUARDIAN'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          2. ولي الأمر والاتصال
        </button>
        <button
          onClick={() => setActiveTab('PLAN')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'PLAN'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          3. البرنامج ونظام السداد
        </button>
      </div>

      {/* Tab 1: Student Information */}
      {activeTab === 'STUDENT' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                الاسم واللقب (بالعربية) *
              </label>
              <input
                type="text"
                defaultValue="يونس لعموري"
                className="w-full h-10 px-3.5 text-xs rounded-xl glass-input text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nom et Prénom (en français)
              </label>
              <input
                type="text"
                defaultValue="Laamouri Younes"
                className="w-full h-10 px-3.5 text-xs rounded-xl glass-input text-slate-900 font-latin"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                تاريخ الميلاد
              </label>
              <input
                type="date"
                defaultValue="2018-05-14"
                className="w-full h-10 px-3.5 text-xs rounded-xl glass-input text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                الجنس
              </label>
              <select className="w-full h-10 px-3.5 text-xs rounded-xl glass-input text-slate-900">
                <option value="Male">ذكر (Masculin)</option>
                <option value="Female">أنثى (Féminin)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                المقر / الفرع
              </label>
              <select className="w-full h-10 px-3.5 text-xs rounded-xl glass-input text-slate-900">
                <option value="CENTER">المركز - الأكاديمية</option>
                <option value="RAWDA">الروضة والحضانة</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Guardian Information */}
      {activeTab === 'GUARDIAN' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                اسم الولي الكامل
              </label>
              <input
                type="text"
                defaultValue="عبد الحميد لعموري"
                className="w-full h-10 px-3.5 text-xs rounded-xl glass-input text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                صفة القرابة
              </label>
              <select className="w-full h-10 px-3.5 text-xs rounded-xl glass-input text-slate-900">
                <option value="Father">الأب (Père)</option>
                <option value="Mother">الأم (Mère)</option>
                <option value="Guardian">ولي شرعي (Tuteur)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                رقم الهاتف الرئيسي *
              </label>
              <input
                type="tel"
                defaultValue="0550 12 34 56"
                className="w-full h-10 px-3.5 text-xs rounded-xl glass-input text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                رقم هاتف الطوارئ (الاحتياطي)
              </label>
              <input
                type="tel"
                defaultValue="0661 98 76 54"
                className="w-full h-10 px-3.5 text-xs rounded-xl glass-input text-slate-900 font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Program & Fee Plan */}
      {activeTab === 'PLAN' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                البرنامج التعليمي
              </label>
              <select className="w-full h-10 px-3.5 text-xs rounded-xl glass-input text-slate-900">
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
              <select className="w-full h-10 px-3.5 text-xs rounded-xl glass-input text-slate-900">
                <option value="INSTALLMENTS">4 أقساط قياسية (دفعات)</option>
                <option value="CASH_DISCOUNT">دفع كامل كاش (خصم 500 دج)</option>
                <option value="MONTHLY">اشتراك شهري متكرر</option>
              </select>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs font-medium text-slate-800">
            <span>المبلغ الإجمالي المتفق عليه:</span>
            <span className="font-mono text-base font-bold text-emerald-700">
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
      title="مطابقة الصندوق اليومي النشط (وصل الخزينة)"
      subtitle="محاكاة إغلاق الخزينة اليومية ومطابقة الرصيد الفعلي مع المسجل في النظام"
    >
      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-xl bg-slate-100 border border-slate-200">
            <span className="text-slate-500 block mb-1">الرصيد الافتتاحي</span>
            <span className="font-mono font-bold text-sm text-slate-900">25,000 دج</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="text-emerald-800 block mb-1">إجمالي المداخيل</span>
            <span className="font-mono font-bold text-sm text-emerald-700">+121,200 دج</span>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
            <span className="text-rose-800 block mb-1">إجمالي المصاريف</span>
            <span className="font-mono font-bold text-sm text-rose-700">-3,700 دج</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
          <div>
            <div className="font-bold text-slate-900 text-sm">الرصيد النظري الإجمالي:</div>
            <div className="text-[11px] text-slate-500">المطابق مع مجموع الأوصال المحصلة</div>
          </div>
          <div className="font-mono font-extrabold text-xl text-blue-700">
            142,500 دج
          </div>
        </div>

        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>لا يوجد أي فارق أو عجز بين العد الفعلي للنقد والحسابات الآلية (الفارق: 0.00 دج).</span>
        </div>
      </div>
    </ModalDialog>
  );
}
