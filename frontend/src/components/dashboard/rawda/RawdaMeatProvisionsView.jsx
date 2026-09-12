import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Beef,
  Droplets,
  Coins,
  CheckCircle,
  Plus,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { StandardViewLayout } from '../common/StandardViewLayout';
import { MOCK_RAWDA_MEAT_PROVISIONS } from '../../../mock/rawdaMockData';

export function RawdaMeatProvisionsView() {
  const [provisions, setProvisions] = useState(MOCK_RAWDA_MEAT_PROVISIONS);
  const [selectedWeek, setSelectedWeek] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newOrder, setNewOrder] = useState({
    week: 1,
    item: 'اللحم البقري الطازج',
    quantity: '',
    unit: 'كغ',
    unitPrice: 2200,
    supplier: 'قصابة الأمانة - بحاية',
    notes: '',
  });

  // Approved monitored categories
  const categoriesList = [
    'اللحم البقري الطازج',
    'الدجاج الكامل المنظف',
    'سكالوب دجاج مرحي',
    'ماء معدني عبوة 5 لتر',
    'بيض طازج استهلاك غذائي',
    'جبن طري مخصص للأطفال',
  ];

  // 1. KPI Calculations (Section 2.8)
  const filteredList = useMemo(() => {
    return provisions.filter((p) => {
      const matchWeek = selectedWeek === 'ALL' || p.week === Number(selectedWeek);
      const matchCat = selectedCategory === 'ALL' || p.item.includes(selectedCategory);
      return matchWeek && matchCat;
    });
  }, [provisions, selectedWeek, selectedCategory]);

  const totalCost = filteredList.reduce((acc, p) => acc + p.totalAmount, 0);
  const totalMeatKg = filteredList
    .filter((p) => p.item.includes('اللحم') || p.item.includes('الدجاج') || p.item.includes('سكالوب'))
    .reduce((acc, p) => acc + p.quantity, 0);
  const totalWaterUnits = filteredList
    .filter((p) => p.item.includes('ماء'))
    .reduce((acc, p) => acc + p.quantity, 0);
  const ordersCount = filteredList.length;

  const kpiCards = [
    {
      label: 'إجمالي قيمة التموين والطلبيات',
      value: `${totalCost.toLocaleString()} دج`,
      icon: Coins,
      subtext: 'شامل اللحوم والمواد الطازجة والماء',
      change: 'مضبوط بفواتير',
      isPositive: true,
    },
    {
      label: 'كمية اللحوم والدواجن الموردة',
      value: `${totalMeatKg} كغ`,
      icon: Beef,
      subtext: 'بقري، دجاج كامل، وسكالوب مرحي',
      change: 'طازج أسبوعياً',
      isPositive: true,
    },
    {
      label: 'مخزون الماء المعدني (5 لتر)',
      value: `${totalWaterUnits} عبوة`,
      icon: Droplets,
      subtext: 'مياه شرب وطهي صحية نقية',
      change: 'كافي لـ 20 يوم',
      isPositive: true,
    },
    {
      label: 'عدد طلبيات التوريد المعتمدة',
      value: `${ordersCount} طلبيات`,
      icon: ShoppingBag,
      subtext: 'موردين معتمدين ومطابقين للشروط',
      change: '100% مستلمة',
      isPositive: true,
    },
  ];

  // 2. Add Provision Order
  const handleSaveOrder = (e) => {
    e.preventDefault();
    const qty = Number(newOrder.quantity) || 0;
    const price = Number(newOrder.unitPrice) || 0;
    const total = qty * price;

    const entry = {
      id: `prv-${Date.now()}`,
      week: Number(newOrder.week),
      item: newOrder.item,
      quantity: qty,
      unit: newOrder.unit,
      unitPrice: price,
      totalAmount: total,
      supplier: newOrder.supplier,
      notes: newOrder.notes || 'استلام معتمد',
    };

    setProvisions([...provisions, entry]);
    setIsModalOpen(false);
  };

  return (
    <StandardViewLayout
      titleAr="طلبيات اللحوم والتموين الغذائي الأسبوعي"
      titleEn="Rawda Weekly Provisions, Poultry, Meat & Dietary Supplies"
      description="مراقبة ومتابعة التموين الغذائي الأسبوعي لفئات الروضة الستة المعتمدة (لحم بقري، دجاج، سكالوب، ماء 5 لتر، بيض، جبن) مع احتساب إجمالي الفواتير وفحص الموردين."
      entityTag="التموين وإطعام الروضة"
      branchCode="RAWDA"
      kpiCards={kpiCards}
      actionButtonLabel="+ طلبية تموين جديدة"
      onActionButtonClick={() => setIsModalOpen(true)}
      exportFileName="rawda_provisions_orders"
      exportData={filteredList.map((p) => ({
        'الأسبوع': `الأسبوع ${p.week}`,
        'المادة الغذائية': p.item,
        'الكمية': `${p.quantity} ${p.unit}`,
        'السعر للوحدة': p.unitPrice,
        'المبلغ الإجمالي (دج)': p.totalAmount,
        'المورد': p.supplier,
        'ملاحظات': p.notes,
      }))}
      filterSlot={
        <div className="flex items-center gap-1.5">
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="h-7 px-2 text-xs bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:border-blue-900"
          >
            <option value="ALL">كافة الأسابيع (1 إلى 5)</option>
            <option value="1">الأسبوع 1</option>
            <option value="2">الأسبوع 2</option>
            <option value="3">الأسبوع 3</option>
            <option value="4">الأسبوع 4</option>
            <option value="5">الأسبوع 5</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-7 px-2 text-xs bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:border-blue-900"
          >
            <option value="ALL">كافة فئات التموين (6 فئات)</option>
            <option value="اللحم البقري">اللحم البقري</option>
            <option value="الدجاج الكامل">الدجاج الكامل</option>
            <option value="سكالوب">سكالوب مرحي</option>
            <option value="ماء معدني">الماء المعدني 5 لتر</option>
            <option value="بيض">البيض</option>
            <option value="جبن">الجبن</option>
          </select>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-start text-xs border-collapse">
          <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold select-none">
            <tr>
              <th className="p-2.5 text-center border-e border-slate-200 w-12">#</th>
              <th className="p-2.5 text-center border-e border-slate-200 min-w-[90px]">الأسبوع</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[200px]">التعيين / المادة الغذائية</th>
              <th className="p-2.5 text-center border-e border-slate-200 min-w-[120px]">الكمية المستلمة</th>
              <th className="p-2.5 text-end border-e border-slate-200 min-w-[140px]">السعر للوحدة (دج)</th>
              <th className="p-2.5 text-end border-e border-slate-200 min-w-[150px]">المبلغ الإجمالي</th>
              <th className="p-2.5 text-start border-e border-slate-200 min-w-[180px]">المورد المعتمد</th>
              <th className="p-2.5 text-start min-w-[240px]">ملاحظات الفاتورة والجودة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {filteredList.map((p, index) => (
              <tr key={p.id} className="hover:bg-blue-50/40 transition-colors">
                <td className="p-2.5 text-center border-e border-slate-200 font-mono text-slate-400 font-bold">
                  {index + 1}
                </td>
                <td className="p-2.5 text-center border-e border-slate-200 font-bold text-slate-700">
                  <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-[10px]">
                    الأسبوع {p.week}
                  </span>
                </td>
                <td className="p-2.5 border-e border-slate-200 font-bold text-slate-900 text-sm">
                  {p.item}
                </td>
                <td className="p-2.5 text-center border-e border-slate-200 font-mono font-bold text-blue-900">
                  {p.quantity} {p.unit}
                </td>
                <td className="p-2.5 text-end border-e border-slate-200 font-mono text-slate-700">
                  {p.unitPrice.toLocaleString()} دج
                </td>
                <td className="p-2.5 text-end border-e border-slate-200 font-mono font-bold text-emerald-800 text-sm">
                  {p.totalAmount.toLocaleString()} دج
                </td>
                <td className="p-2.5 border-e border-slate-200 font-medium text-slate-900">
                  {p.supplier}
                </td>
                <td className="p-2.5 text-slate-600">
                  {p.notes}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 font-mono">
            <tr>
              <td colSpan={5} className="p-2.5 text-start font-sans text-xs border-e border-slate-200">
                المجموع العام لطلبيات التموين واللحوم
              </td>
              <td className="p-2.5 text-end border-e border-slate-200 text-emerald-800 text-sm font-bold">
                {totalCost.toLocaleString()} دج
              </td>
              <td colSpan={2} className="p-2.5 font-sans text-[11px] text-slate-500">
                {filteredList.length} طلبيات غذائية مسجلة ومطابقة للشروط الصحية
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-300 shadow-2xl w-full max-w-md p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-900 text-sm">تسجيل طلبية تموين غذائي</span>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOrder} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الأسبوع *</label>
                  <select
                    value={newOrder.week}
                    onChange={(e) => setNewOrder({ ...newOrder, week: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                  >
                    <option value="1">الأسبوع 1</option>
                    <option value="2">الأسبوع 2</option>
                    <option value="3">الأسبوع 3</option>
                    <option value="4">الأسبوع 4</option>
                    <option value="5">الأسبوع 5</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">المادة الغذائية *</label>
                  <select
                    value={newOrder.item}
                    onChange={(e) => setNewOrder({ ...newOrder, item: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الكمية *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="10"
                    value={newOrder.quantity}
                    onChange={(e) => setNewOrder({ ...newOrder, quantity: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الوحدة *</label>
                  <select
                    value={newOrder.unit}
                    onChange={(e) => setNewOrder({ ...newOrder, unit: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                  >
                    <option value="كغ">كغ</option>
                    <option value="عبوة">عبوة (5 لتر)</option>
                    <option value="صينية">صينية (بيض)</option>
                    <option value="علبة">علبة (جبن)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">سعر الوحدة (دج) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="2200"
                    value={newOrder.unitPrice}
                    onChange={(e) => setNewOrder({ ...newOrder, unitPrice: e.target.value })}
                    className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Real-time total preview */}
              <div className="p-2 bg-blue-50 border border-blue-200 flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">المبلغ الإجمالي المحتسب تلقائياً:</span>
                <strong className="font-mono text-emerald-800 font-bold text-sm">
                  {((Number(newOrder.quantity) || 0) * (Number(newOrder.unitPrice) || 0)).toLocaleString()} دج
                </strong>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">المورد المعتمد</label>
                <input
                  type="text"
                  placeholder="اسم المورد أو القصابة..."
                  value={newOrder.supplier}
                  onChange={(e) => setNewOrder({ ...newOrder, supplier: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ملاحظات الفاتورة والجودة</label>
                <input
                  type="text"
                  placeholder="أي ملاحظات حول التخزين أو جودة الاستلام..."
                  value={newOrder.notes}
                  onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
                  className="w-full h-8 px-2 border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold"
                >
                  حفظ الطلبية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </StandardViewLayout>
  );
}
