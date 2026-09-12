import React, { useState } from 'react';
import {
  Shield,
  User,
  KeyRound,
  Lock,
  Unlock,
  CheckCircle2,
  Building2,
  ChevronLeft,
  X,
  Sparkles,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { MOCK_AUTH_USERS } from '../../mock/mockData';

export function AuthLoginModal({
  isOpen,
  onClose,
  currentUser,
  onSelectUser,
}) {
  const [selectedTab, setSelectedTab] = useState('quick'); // 'quick' | 'credentials'
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  if (!isOpen) return null;

  const handleManualLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    const found = MOCK_AUTH_USERS.find(
      (u) => u.username.toLowerCase() === usernameInput.trim().toLowerCase()
    );
    if (found) {
      onSelectUser(found);
      onClose();
    } else {
      setLoginError('اسم المستخدم غير صحيح. يرجى اختيار حساب من القائمة السريعة.');
    }
  };

  const adminUsers = MOCK_AUTH_USERS.filter((u) => u.branch_id === 'ALL');
  const centerUsers = MOCK_AUTH_USERS.filter((u) => u.branch_id === 'CENTER');
  const rawdaUsers = MOCK_AUTH_USERS.filter((u) => u.branch_id === 'RAWDA');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 font-arabic select-none">
      <div className="bg-white border border-slate-300 w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-blue-950 text-white p-4 flex items-center justify-between border-b border-blue-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-900 text-blue-100 flex items-center justify-center font-bold text-sm border border-blue-800">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base leading-tight">
                تسجيل الدخول والتحكم بصلاحيات الفروع
              </h2>
              <p className="text-[11px] text-blue-300 font-mono mt-0.5">
                BRANCH-SCOPED AUTHENTICATION & ACCESS CONTROL
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-300 hover:text-white transition-colors p-1"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active User Banner */}
        <div className="bg-slate-50 p-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-slate-500 font-medium">الحساب النشط حالياً:</span>
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 border border-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <strong className="text-slate-900 font-bold">{currentUser?.full_name}</strong>
              <span className="text-slate-400">|</span>
              <span className="text-blue-950 font-semibold">{currentUser?.role_label_ar}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">نطاق المقر:</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 border ${
                currentUser?.branch_id === 'ALL'
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : currentUser?.branch_id === 'CENTER'
                  ? 'bg-blue-50 text-blue-950 border-blue-300'
                  : 'bg-emerald-50 text-emerald-950 border-emerald-300'
              }`}
            >
              {currentUser?.branch_id === 'ALL'
                ? '★ إدارة عامة (حرية التنقل بين الفروع)'
                : currentUser?.branch_id === 'CENTER'
                ? '🔒 مقيد: المركز الأكاديمي'
                : '🔒 مقيد: الروضة والحضانة'}
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-100 text-xs">
          <button
            onClick={() => setSelectedTab('quick')}
            className={`flex-1 py-2.5 px-4 font-semibold text-center transition-colors flex items-center justify-center gap-1.5 ${
              selectedTab === 'quick'
                ? 'bg-white text-blue-950 border-b-2 border-b-blue-950'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>التبديل الفوري بين حسابات المقرات والإدارة</span>
          </button>
          <button
            onClick={() => setSelectedTab('credentials')}
            className={`flex-1 py-2.5 px-4 font-semibold text-center transition-colors flex items-center justify-center gap-1.5 ${
              selectedTab === 'credentials'
                ? 'bg-white text-blue-950 border-b-2 border-b-blue-950'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>تسجيل الدخول بالاسم وكلمة المرور</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {selectedTab === 'quick' ? (
            <div className="space-y-4 text-xs">
              {/* Note / Policy */}
              <div className="p-2.5 bg-blue-50/70 border-s-4 border-s-blue-900 text-slate-700 text-[11px] leading-relaxed">
                <strong>سياسة المقرات والصلاحيات:</strong> حسابات الفروع (المركز أو الروضة) مقيدة بمقرها فقط ولا يمكنها تصفية بيانات مقر آخر. حساب الإدارة العامة (Admin) يملك السلطة الكاملة للتنقل بين المقرات والاطلاع على البيانات الموحدة.
              </div>

              {/* 1. Super Admin & Central Management */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5 font-bold text-slate-800">
                  <Unlock className="w-3.5 h-3.5 text-amber-700" />
                  <span className="text-amber-900">حسابات الإدارة العامة (صلاحية كاملة للتنقل بين المقرات)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {adminUsers.map((u) => {
                    const isCurrent = currentUser?.user_id === u.user_id;
                    return (
                      <button
                        key={u.user_id}
                        onClick={() => {
                          onSelectUser(u);
                          onClose();
                        }}
                        className={`p-2.5 text-start border transition-all flex items-start justify-between ${
                          isCurrent
                            ? 'bg-blue-900 text-white border-blue-950 shadow-xs ring-1 ring-blue-900'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-blue-900 hover:bg-blue-50/50'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className={`w-7 h-7 flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                              isCurrent ? 'bg-white text-blue-950' : 'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}
                          >
                            {u.full_name.split(' ').map((n) => n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-bold">{u.full_name}</div>
                            <div className={`text-[10px] ${isCurrent ? 'text-blue-200' : 'text-slate-500'}`}>
                              {u.role_label_ar}
                            </div>
                            <span
                              className={`inline-block mt-1 text-[9px] font-mono font-semibold px-1 py-0.2 border ${
                                isCurrent
                                  ? 'bg-blue-800 text-white border-blue-700'
                                  : 'bg-amber-50 text-amber-900 border-amber-200'
                              }`}
                            >
                              ★ كافة المقرات والفروع (ALL)
                            </span>
                          </div>
                        </div>
                        {isCurrent && (
                          <span className="text-[10px] font-bold bg-white text-blue-950 px-1.5 py-0.5 shrink-0">
                            النشط حالياً
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Center Branch Accounts */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5 font-bold text-slate-800">
                  <Lock className="w-3.5 h-3.5 text-blue-900" />
                  <span className="text-blue-950">حسابات المركز الأكاديمي (مقيد ببيانات المركز فقط)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {centerUsers.map((u) => {
                    const isCurrent = currentUser?.user_id === u.user_id;
                    return (
                      <button
                        key={u.user_id}
                        onClick={() => {
                          onSelectUser(u);
                          onClose();
                        }}
                        className={`p-2.5 text-start border transition-all flex items-start justify-between ${
                          isCurrent
                            ? 'bg-blue-900 text-white border-blue-950 shadow-xs ring-1 ring-blue-900'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-blue-900 hover:bg-blue-50/50'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className={`w-7 h-7 flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                              isCurrent ? 'bg-white text-blue-950' : 'bg-blue-100 text-blue-950 border border-blue-300'
                            }`}
                          >
                            {u.full_name.split(' ').map((n) => n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-bold">{u.full_name}</div>
                            <div className={`text-[10px] ${isCurrent ? 'text-blue-200' : 'text-slate-500'}`}>
                              {u.role_label_ar}
                            </div>
                            <span
                              className={`inline-block mt-1 text-[9px] font-mono font-semibold px-1 py-0.2 border ${
                                isCurrent
                                  ? 'bg-blue-800 text-white border-blue-700'
                                  : 'bg-blue-50 text-blue-950 border-blue-200'
                              }`}
                            >
                              🔒 المركز الأكاديمي فقط (CENTER)
                            </span>
                          </div>
                        </div>
                        {isCurrent && (
                          <span className="text-[10px] font-bold bg-white text-blue-950 px-1.5 py-0.5 shrink-0">
                            النشط حالياً
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Rawda Branch Accounts */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5 font-bold text-slate-800">
                  <Lock className="w-3.5 h-3.5 text-emerald-800" />
                  <span className="text-emerald-950">حسابات الروضة والحضانة (مقيد ببيانات الروضة فقط)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {rawdaUsers.map((u) => {
                    const isCurrent = currentUser?.user_id === u.user_id;
                    return (
                      <button
                        key={u.user_id}
                        onClick={() => {
                          onSelectUser(u);
                          onClose();
                        }}
                        className={`p-2.5 text-start border transition-all flex items-start justify-between ${
                          isCurrent
                            ? 'bg-blue-900 text-white border-blue-950 shadow-xs ring-1 ring-blue-900'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-800 hover:bg-emerald-50/50'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className={`w-7 h-7 flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                              isCurrent ? 'bg-white text-blue-950' : 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                            }`}
                          >
                            {u.full_name.split(' ').map((n) => n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-bold">{u.full_name}</div>
                            <div className={`text-[10px] ${isCurrent ? 'text-blue-200' : 'text-slate-500'}`}>
                              {u.role_label_ar}
                            </div>
                            <span
                              className={`inline-block mt-1 text-[9px] font-mono font-semibold px-1 py-0.2 border ${
                                isCurrent
                                  ? 'bg-blue-800 text-white border-blue-700'
                                  : 'bg-emerald-50 text-emerald-950 border-emerald-200'
                              }`}
                            >
                              🔒 روضة وحضانة العباقرة فقط (RAWDA)
                            </span>
                          </div>
                        </div>
                        {isCurrent && (
                          <span className="text-[10px] font-bold bg-white text-blue-950 px-1.5 py-0.5 shrink-0">
                            النشط حالياً
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Traditional Username/Password Login Form */
            <form onSubmit={handleManualLogin} className="space-y-3.5 text-xs max-w-md mx-auto py-2">
              <div className="text-center pb-2">
                <h3 className="font-bold text-sm text-slate-900">تسجيل الدخول ببيانات الحساب</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  أدخل اسم المستخدم للتحقق من هوية الحساب وصلاحية الفرع التابع له
                </p>
              </div>

              {loginError && (
                <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-800 text-xs">
                  {loginError}
                </div>
              )}

              <div>
                <label className="eyebrow block mb-1 text-slate-700">اسم المستخدم (Username)</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: mohammed_admin, amira_director, karim_rawda"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full h-8 px-2.5 border border-slate-300 font-mono text-xs focus:outline-none focus:border-blue-900"
                />
              </div>

              <div>
                <label className="eyebrow block mb-1 text-slate-700">كلمة المرور (Password)</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full h-8 px-2.5 border border-slate-300 font-mono text-xs focus:outline-none focus:border-blue-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="button text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="button button-primary text-xs px-4"
                >
                  تسجيل الدخول
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>منظومة الحسابات الموزعة لأكاديمية وروضة الأطفال العباقرة</span>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-semibold"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
}
