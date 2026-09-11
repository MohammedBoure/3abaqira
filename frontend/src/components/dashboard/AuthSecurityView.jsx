import React, { useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  UserCheck,
  Lock,
  Smartphone,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  UserPlus,
  Building2,
  CheckCircle2,
  AlertTriangle,
  X,
  Clock,
  Shield,
} from 'lucide-react';
import { MOCK_CURRENT_USER, MOCK_AUTH_USERS } from '../../mock/mockData';

export function AuthSecurityView() {
  const [currentUser, setCurrentUser] = useState(MOCK_CURRENT_USER);
  const [users, setUsers] = useState(MOCK_AUTH_USERS);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'users' | 'permissions'
  const [copiedToken, setCopiedToken] = useState(false);

  // Change Password Form State
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

  // New User Modal State
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    username: '',
    full_name: '',
    email: '',
    role: 'ACCOUNTANT',
    branch_id: 'ALL',
    password: '',
  });

  const mockJwtToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtb2hhbW1lZF9hZG1pbiIsInVzZXJfaWQiOjEsInJvbGUiOiJTVVBFUl9BRE1JTiIsImJyYW5jaF9pZCI6IkFMTCIsImV4cCI6MTc1NzY0MTYwMH0.3kL98AbQ-EnterpriseSecuritySignature';

  const handleCopyToken = () => {
    navigator.clipboard.writeText(mockJwtToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    setPasswordSuccessMsg('');
    setPasswordErrorMsg('');

    if (passwordForm.new_password.length < 6) {
      setPasswordErrorMsg('يجب أن لا تقل كلمة المرور الجديدة عن 6 أحرف أو أرقام.');
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordErrorMsg('كلمة المرور الجديدة غير متطابقة مع التأكيد.');
      return;
    }

    setPasswordSuccessMsg('تم تحديث كلمة المرور بنجاح في قاعدة البيانات (PUT /auth/change-password).');
    setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!newUserForm.username || !newUserForm.full_name) return;

    const created = {
      user_id: Date.now(),
      username: newUserForm.username,
      full_name: newUserForm.full_name,
      email: newUserForm.email || `${newUserForm.username}@3abaqira.dz`,
      role: newUserForm.role,
      role_label_ar:
        newUserForm.role === 'SUPER_ADMIN'
          ? 'مدير النظام الشامل'
          : newUserForm.role === 'DIRECTOR'
          ? 'مدير فرع'
          : newUserForm.role === 'ACCOUNTANT'
          ? 'مسؤول مالي'
          : 'مدرب / مربية',
      branch_id: newUserForm.branch_id,
      branch_name_ar: newUserForm.branch_id === 'CENTER' ? 'المركز الأكاديمي' : newUserForm.branch_id === 'RAWDA' ? 'الروضة' : 'كافة الفروع',
      is_active: true,
      last_login: 'لم يسجل دخول بعد',
      created_at: new Date().toISOString().substring(0, 10),
    };

    setUsers([created, ...users]);
    setIsNewUserModalOpen(false);
    setNewUserForm({ username: '', full_name: '', email: '', role: 'ACCOUNTANT', branch_id: 'ALL', password: '' });
  };

  const toggleUserStatus = (userId) => {
    setUsers((prev) =>
      prev.map((u) => (u.user_id === userId ? { ...u, is_active: !u.is_active } : u))
    );
  };

  return (
    <div className="space-y-3 font-arabic">
      {/* 1. Top Header & Module Info */}
      <div className="bg-white border border-slate-300 p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="eyebrow flex items-center gap-1.5 text-blue-900">
            <KeyRound className="w-3.5 h-3.5" />
            <span>IDENTITY & JWT TOKEN LIFECYCLE / backend/apis/auth.py</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold font-serif text-slate-900 mt-0.5">
            إدارة الهوية، الصلاحيات والأمان (Authentication & Security)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            إدارة جلسات الدخول المشفرة بـ JWT، فحص صلاحيات الأدوار، تعديل كلمات المرور، ودليل حسابات الطاقم الإداري.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sub-view switcher */}
          <div className="view-switch text-xs">
            <button
              onClick={() => setActiveTab('profile')}
              className={activeTab === 'profile' ? 'active' : ''}
            >
              <UserCheck className="w-3 h-3" />
              <span>الملف الشخصي والجلسة</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={activeTab === 'users' ? 'active' : ''}
            >
              <Building2 className="w-3 h-3" />
              <span>دليل الحسابات ({users.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={activeTab === 'permissions' ? 'active' : ''}
            >
              <Shield className="w-3 h-3" />
              <span>مصفوفة الصلاحيات</span>
            </button>
          </div>

          <button
            onClick={() => setIsNewUserModalOpen(true)}
            className="button button-primary text-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>إضافة حساب مستخدم</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Current User Profile & Token Security */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Left Column: User Profile Card & JWT Session Status */}
          <div className="lg:col-span-1 space-y-3">
            {/* Identity Card */}
            <div className="bg-white border border-slate-300 p-4 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-blue-900 text-white flex items-center justify-center font-serif font-bold text-lg border border-blue-950">
                  MB
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900 truncate">
                      {currentUser.full_name}
                    </h3>
                    <span className="w-2 h-2 rounded-full bg-emerald-600" title="جلسة نشطة" />
                  </div>
                  <span className="text-xs text-blue-900 font-mono block">
                    @{currentUser.username}
                  </span>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="tag tag-blue text-[9px] font-mono">
                      {currentUser.role}
                    </span>
                    <span className="tag text-[9px]">
                      نطاق الفروع: {currentUser.branch_id}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>البريد الإلكتروني:</span>
                  <span className="font-mono text-slate-900">{currentUser.email}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>آخر تسجيل دخول:</span>
                  <span className="font-mono text-slate-900">{currentUser.last_login}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>حالة الحساب:</span>
                  <span className="text-emerald-700 font-semibold">مفعل (Active)</span>
                </div>
              </div>
            </div>

            {/* Active JWT Token Telemetry */}
            <div className="bg-slate-900 text-slate-200 border border-slate-800 p-3.5 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="eyebrow text-blue-400">JWT SESSION TELEMETRY</span>
                <span className="text-[10px] font-mono text-emerald-400">OAuth2 Bearer</span>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Algorithm:</span>
                  <span className="text-white">HS256 (HMAC-SHA256)</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Token Expires In:</span>
                  <span className="text-amber-400 font-bold">{currentUser.expires_in_seconds}s (24 Hours)</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Endpoint:</span>
                  <span className="text-blue-300">GET /auth/me</span>
                </div>
              </div>

              {/* Raw Token Preview */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between mb-1 text-[10px] text-slate-400">
                  <span>ACCESS TOKEN HASH</span>
                  <button
                    onClick={handleCopyToken}
                    className="hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {copiedToken ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedToken ? 'تم النسخ!' : 'نسخ التوكن'}</span>
                  </button>
                </div>
                <div className="bg-slate-950 p-2 font-mono text-[10px] text-slate-300 truncate border border-slate-800">
                  {mockJwtToken}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Password Change & Security Policies */}
          <div className="lg:col-span-2 space-y-3">
            {/* Password Change Form */}
            <div className="bg-white border border-slate-300 p-4 shadow-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <Lock className="w-4 h-4 text-blue-900" />
                <h3 className="font-bold text-sm text-slate-900">
                  تعديل كلمة مرور الحساب (POST /auth/change-password)
                </h3>
              </div>

              {passwordSuccessMsg && (
                <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <span>{passwordSuccessMsg}</span>
                </div>
              )}

              {passwordErrorMsg && (
                <div className="mt-3 p-2.5 bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-700 flex-shrink-0" />
                  <span>{passwordErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="mt-3 space-y-3">
                <div>
                  <label className="eyebrow block mb-1 text-slate-700">
                    كلمة المرور الحالية (Current Password) *
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      required
                      value={passwordForm.current_password}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, current_password: e.target.value })
                      }
                      placeholder="أدخل كلمة المرور الحالية..."
                      className="w-full h-8 px-2.5 pe-8 text-xs border border-slate-300 focus:outline-none focus:border-blue-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute inset-y-0 end-2 my-auto text-slate-400 hover:text-slate-700"
                    >
                      {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="eyebrow block mb-1 text-slate-700">
                      كلمة المرور الجديدة (New Password) *
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        required
                        value={passwordForm.new_password}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, new_password: e.target.value })
                        }
                        placeholder="كلمة مرور قوية (6 أحرف فأكثر)..."
                        className="w-full h-8 px-2.5 pe-8 text-xs border border-slate-300 focus:outline-none focus:border-blue-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute inset-y-0 end-2 my-auto text-slate-400 hover:text-slate-700"
                      >
                        {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="eyebrow block mb-1 text-slate-700">
                      تأكيد كلمة المرور الجديدة *
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordForm.confirm_password}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, confirm_password: e.target.value })
                      }
                      placeholder="أعد إدخال كلمة المرور..."
                      className="w-full h-8 px-2.5 text-xs border border-slate-300 focus:outline-none focus:border-blue-900"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    يتم تشفير الكلمات باستخدام خوارزمية bcrypt مع salt آمن.
                  </span>
                  <button
                    type="submit"
                    className="button button-primary text-xs"
                  >
                    حفظ وتحديث كلمة المرور
                  </button>
                </div>
              </form>
            </div>

            {/* Active Permissions Card */}
            <div className="bg-white border border-slate-300 p-4 shadow-xs">
              <span className="eyebrow block mb-2">CURRENT ROLE GRANTED PRIVILEGES</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {currentUser.permissions.map((p) => (
                  <div
                    key={p}
                    className="p-2 border border-slate-200 bg-slate-50 flex items-center gap-1.5 text-xs font-mono text-slate-800"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                    <span className="truncate">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: User Accounts Directory */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-300 shadow-xs">
          <div className="overflow-x-auto">
            <table className="excel-table text-xs">
              <thead>
                <tr>
                  <th className="excel-th p-2 text-center w-12">#</th>
                  <th className="excel-th p-2 text-start">الاسم الكامل / اسم المستخدم</th>
                  <th className="excel-th p-2 text-start">البريد الإلكتروني</th>
                  <th className="excel-th p-2 text-center">الدور والصلاحية (Role)</th>
                  <th className="excel-th p-2 text-center">نطاق المقر (Branch)</th>
                  <th className="excel-th p-2 text-center">الحالة التشغيلية</th>
                  <th className="excel-th p-2 text-center">آخر تسجيل دخول</th>
                  <th className="excel-th p-2 text-center w-28">التحكم بالحساب</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <tr key={u.user_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="excel-td p-2 text-center font-mono text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="excel-td p-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-[3px] bg-slate-100 text-slate-700 font-mono font-bold text-[10px] flex items-center justify-center border border-slate-200">
                          {u.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{u.full_name}</span>
                          <span className="text-[10px] font-mono text-slate-400">@{u.username}</span>
                        </div>
                      </div>
                    </td>
                    <td className="excel-td p-2 font-mono text-slate-600">
                      {u.email}
                    </td>
                    <td className="excel-td p-2 text-center">
                      <span className="tag tag-blue text-[10px] font-mono font-bold">
                        {u.role}
                      </span>
                    </td>
                    <td className="excel-td p-2 text-center text-slate-700 font-semibold">
                      {u.branch_name_ar}
                    </td>
                    <td className="excel-td p-2 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold border ${
                          u.is_active
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}
                      >
                        {u.is_active ? 'نشط ومفعل' : 'موقوف'}
                      </span>
                    </td>
                    <td className="excel-td p-2 text-center font-mono text-[11px] text-slate-600">
                      {u.last_login}
                    </td>
                    <td className="excel-td p-2 text-center">
                      <button
                        onClick={() => toggleUserStatus(u.user_id)}
                        className={`button text-[10px] h-6 px-1.5 ${
                          u.is_active
                            ? 'text-rose-700 hover:bg-rose-50'
                            : 'text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {u.is_active ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="excel-status-bar p-2 text-slate-600 flex items-center justify-between text-[11px]">
            <span>إجمالي الحسابات المسجلة: <strong>{users.length}</strong></span>
            <span className="text-blue-900 font-mono">FastAPI: /auth/login, /auth/token</span>
          </div>
        </div>
      )}

      {/* Tab 3: Permissions Matrix */}
      {activeTab === 'permissions' && (
        <div className="bg-white border border-slate-300 p-4 shadow-xs space-y-3">
          <div className="border-b border-slate-200 pb-2">
            <h3 className="font-bold text-sm text-slate-900">
              مصفوفة الصلاحيات حسب الأدوار (Role-Based Access Control - RBAC)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              تحديد وصول واجهات برمجة التطبيقات (APIs) استناداً إلى دور المستخدم المشفر داخل توكن JWT.
            </p>
          </div>

          <table className="excel-table text-xs">
            <thead>
              <tr>
                <th className="excel-th p-2 text-start">الوحدة التشغيلية (Module API)</th>
                <th className="excel-th p-2 text-center">SUPER_ADMIN</th>
                <th className="excel-th p-2 text-center">DIRECTOR</th>
                <th className="excel-th p-2 text-center">ACCOUNTANT</th>
                <th className="excel-th p-2 text-center">TEACHER</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="excel-td p-2 font-bold text-slate-900">سجل الطلاب والاشتراكات (Students & Rosters)</td>
                <td className="excel-td p-2 text-center text-emerald-700 font-bold">قراءة + كتابة + حذف</td>
                <td className="excel-td p-2 text-center text-emerald-700 font-bold">قراءة + كتابة</td>
                <td className="excel-td p-2 text-center text-blue-700">قراءة فقط</td>
                <td className="excel-td p-2 text-center text-blue-700">قراءة فوج الخاص</td>
              </tr>
              <tr>
                <td className="excel-td p-2 font-bold text-slate-900">الصندوق والخزينة (Cash Drawer & Payments)</td>
                <td className="excel-td p-2 text-center text-emerald-700 font-bold">كامل الصلاحيات</td>
                <td className="excel-td p-2 text-center text-emerald-700 font-bold">اعتماد سندات</td>
                <td className="excel-td p-2 text-center text-emerald-700 font-bold">قبض وصرف يومي</td>
                <td className="excel-td p-2 text-center text-rose-600">محظور</td>
              </tr>
              <tr>
                <td className="excel-td p-2 font-bold text-slate-900">المواسم الأكاديمية (Academic Years)</td>
                <td className="excel-td p-2 text-center text-emerald-700 font-bold">إنشاء + تفعيل + تعديل</td>
                <td className="excel-td p-2 text-center text-blue-700">قراءة النطاق</td>
                <td className="excel-td p-2 text-center text-blue-700">قراءة</td>
                <td className="excel-td p-2 text-center text-blue-700">قراءة</td>
              </tr>
              <tr>
                <td className="excel-td p-2 font-bold text-slate-900">سجل الرقابة والتتبع (Audit Trail)</td>
                <td className="excel-td p-2 text-center text-emerald-700 font-bold">فحص شامل + Diffs</td>
                <td className="excel-td p-2 text-center text-emerald-700 font-bold">فحص نشاط الفرع</td>
                <td className="excel-td p-2 text-center text-rose-600">محظور</td>
                <td className="excel-td p-2 text-center text-rose-600">محظور</td>
              </tr>
              <tr>
                <td className="excel-td p-2 font-bold text-slate-900">إدارة الفروع والمقرات (Branches)</td>
                <td className="excel-td p-2 text-center text-emerald-700 font-bold">تعديل + فتح فروع جديدة</td>
                <td className="excel-td p-2 text-center text-blue-700">إدارة قاعات الفرع</td>
                <td className="excel-td p-2 text-center text-blue-700">قراءة</td>
                <td className="excel-td p-2 text-center text-blue-700">قراءة</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Add System User */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-3 select-none">
          <div className="bg-white border border-slate-400 max-w-md w-full shadow-lg">
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-900" />
                <h3 className="font-bold text-sm text-slate-900">
                  إنشاء حساب مستخدم جديد
                </h3>
              </div>
              <button
                onClick={() => setIsNewUserModalOpen(false)}
                className="icon-button w-6 h-6 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-4 space-y-3">
              <div>
                <label className="eyebrow block mb-1 text-slate-700">اسم المستخدم (Username) *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: accountant_ali"
                  value={newUserForm.username}
                  onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                  className="w-full h-8 px-2.5 text-xs border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="eyebrow block mb-1 text-slate-700">الاسم واللقب الكامل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: علي بلقاسم"
                  value={newUserForm.full_name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
                  className="w-full h-8 px-2.5 text-xs border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="eyebrow block mb-1 text-slate-700">الدور والصلاحية</label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                    className="w-full h-8 px-2 text-xs border border-slate-300 bg-white font-mono"
                  >
                    <option value="ACCOUNTANT">ACCOUNTANT</option>
                    <option value="DIRECTOR">DIRECTOR</option>
                    <option value="TEACHER">TEACHER</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="eyebrow block mb-1 text-slate-700">نطاق المقر</label>
                  <select
                    value={newUserForm.branch_id}
                    onChange={(e) => setNewUserForm({ ...newUserForm, branch_id: e.target.value })}
                    className="w-full h-8 px-2 text-xs border border-slate-300 bg-white font-mono"
                  >
                    <option value="ALL">ALL (كافة الفروع)</option>
                    <option value="CENTER">CENTER (المركز)</option>
                    <option value="RAWDA">RAWDA (الروضة)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="eyebrow block mb-1 text-slate-700">كلمة المرور الأولية *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="w-full h-8 px-2.5 text-xs border border-slate-300"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(false)}
                  className="button text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="button button-primary text-xs"
                >
                  حفظ وتفعيل الحساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
