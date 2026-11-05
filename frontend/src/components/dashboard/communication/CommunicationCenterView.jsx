import React, { useState } from 'react';
import { MessageSquare, Bell, Clock, Activity } from 'lucide-react';
import { ParentNotesThreadView } from './ParentNotesThreadView';
import { NotificationQueueMonitorView } from './NotificationQueueMonitorView';

export function CommunicationCenterView({ initialTab = 'notes' }) {
  const [activeSubTab, setActiveSubTab] = useState(initialTab);

  const tabs = [
    {
      id: 'notes',
      labelAr: 'دفتر ملاحظات الأولياء ومحادثات الروضة',
      subtitleAr: 'Parent Notes & Threads',
      icon: MessageSquare,
      tag: 'رد موحد',
    },
    {
      id: 'queue',
      labelAr: 'طابور الإشعارات والرسائل الصادرة',
      subtitleAr: 'Outbound Notification Queue',
      icon: Bell,
      tag: 'SMS/WhatsApp',
    },
  ];

  return (
    <div className="space-y-2.5 font-arabic text-slate-800">
      {/* High-density Ribbon */}
      <div className="bg-white border border-slate-200 p-1 shadow-2xs">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-3 py-1.5 flex items-center gap-2 rounded-none border text-start transition-all shrink-0 ${
                  isActive
                    ? 'bg-blue-900 text-white border-blue-950 font-bold shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-200' : 'text-slate-500'}`} />
                <div className="flex flex-col">
                  <span className="text-xs leading-tight">{tab.labelAr}</span>
                  <span
                    className={`text-[9px] font-mono leading-none ${
                      isActive ? 'text-blue-200' : 'text-slate-400'
                    }`}
                  >
                    {tab.subtitleAr}
                  </span>
                </div>
                <span
                  className={`text-[9px] font-mono px-1 py-0.2 border ms-1 ${
                    isActive
                      ? 'bg-blue-800 text-blue-100 border-blue-700'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {tab.tag}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Active Sub-View */}
      {activeSubTab === 'notes' && <ParentNotesThreadView />}
      {activeSubTab === 'queue' && <NotificationQueueMonitorView />}
    </div>
  );
}
