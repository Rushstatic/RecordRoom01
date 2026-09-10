import React, { useState, useEffect } from 'react';
import { PageId } from '../types';
import { 
  Building2, Home, MapPin, Users, 
  Wrench, Flag, Clock, ShieldCheck, 
  Database, Activity, Target
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { malariaService } from '../services/malariaService';
import { tbService } from '../services/tbService';
import { templateService } from '../services/templateService';

interface AdminDashboardPageProps {
  onNavigate: (page: PageId) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigate }) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setIsLoading(true);
      try {
        const malariaSamples = await malariaService.getSamples();
        const malariaPending = malariaSamples.filter(s => !s.test_result || s.test_result === 'Pending').length;
        const malariaCompleted = malariaSamples.length - malariaPending;

        const tbSamples = await tbService.getSamples();
        const tbPending = tbSamples.filter(s => !s.test_result || s.test_result === 'Pending').length;
        const tbCompleted = tbSamples.length - tbPending;

        let dynamicPending = 0;
        let dynamicCompleted = 0;

        const templates = await templateService.getTemplates();
        for (const tpl of templates) {
          if (!tpl.is_active) continue;
          const fields = await templateService.getTemplateFields(tpl.id);
          const resultFields = fields.filter(f => f.field_type === 'result');
          if (resultFields.length > 0) {
            const records = await templateService.getDynamicRecords(tpl.id);
            for (const rec of records) {
              let isPending = false;
              for (const rf of resultFields) {
                const val = rec.record_data?.[rf.field_key];
                if (!val || val === 'Pending' || val === 'प्रलंबित') {
                  isPending = true;
                  break;
                }
              }
              if (isPending) {
                dynamicPending++;
              } else {
                dynamicCompleted++;
              }
            }
          }
        }

        setChartData([
          {
            name: 'Malaria',
            Pending: malariaPending,
            Completed: malariaCompleted,
          },
          {
            name: 'TB',
            Pending: tbPending,
            Completed: tbCompleted,
          },
          {
            name: 'Dynamic Registers',
            Pending: dynamicPending,
            Completed: dynamicCompleted,
          }
        ]);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            Admin Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            प्रशासनिक नियंत्रण आणि संनियंत्रण (PHC Controller)
          </p>
        </div>
      </div>

      {/* 0. Summary Chart */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
          <Activity className="w-4 h-4 text-indigo-600" />
          चाचणी स्थिती सारांश (Testing Overview)
        </h2>
        
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-sm text-slate-500">माहिती लोड होत आहे...</div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Pending" name="प्रलंबित (Pending)" stackId="a" fill="#f59e0b" radius={[0, 0, 4, 4]} />
                <Bar dataKey="Completed" name="पूर्ण (Completed)" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 1. Master Data */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
          <Database className="w-4 h-4 text-emerald-600" />
          1. मास्टर डेटा (Master Data)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => onNavigate('phc-master')}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs font-bold text-slate-700">प्रा.आ. केंद्र (PHC)</span>
          </button>
          <button
            onClick={() => onNavigate('subcentre-master')}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Home className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs font-bold text-slate-700">उपकेंद्र (Subcentre)</span>
          </button>
          <button
            onClick={() => onNavigate('village-master')}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <MapPin className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs font-bold text-slate-700">गाव (Village)</span>
          </button>
          <button
            onClick={() => onNavigate('employee-master')}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs font-bold text-slate-700">कर्मचारी (Employee)</span>
          </button>
        </div>
      </div>

      {/* 2. Dynamic Forms */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
          <Wrench className="w-4 h-4 text-indigo-600" />
          2. डायनॅमिक फॉर्म्स (Dynamic Forms)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => onNavigate('template-builder')}
            className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 transition-colors group text-left"
          >
            <div className="w-12 h-12 shrink-0 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wrench className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <span className="block text-sm font-bold text-slate-700 mb-0.5">रजिस्टर बिल्डर (Register Builder)</span>
              <span className="block text-xs text-slate-500">नवीन डायनॅमिक फॉर्म तयार करा किंवा व्यवस्थापित करा</span>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Targets */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
          <Target className="w-4 h-4 text-amber-600" />
          3. उद्दिष्टे (Targets)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => onNavigate('malaria-targets')}
            className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-100 hover:border-amber-200 transition-colors group text-left"
          >
            <div className="w-12 h-12 shrink-0 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              <Flag className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <span className="block text-sm font-bold text-slate-700 mb-0.5">उद्दिष्ट व्यवस्थापन (Target Management)</span>
              <span className="block text-xs text-slate-500">मासिक आणि वार्षिक लक्ष्य सेट करा</span>
            </div>
          </button>
        </div>
      </div>

      {/* 4. Monitoring */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
          <Activity className="w-4 h-4 text-blue-600" />
          4. संनियंत्रण (Monitoring)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          <button
            onClick={() => onNavigate('pending-dynamic-records')}
            className="flex flex-col items-center text-center p-4 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-xs font-bold text-slate-700">Pending Results</span>
          </button>

          <button
            onClick={() => onNavigate('send-samples')}
            className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-bold text-slate-700">प्रलंबित (Pending)</span>
          </button>
          <button
            onClick={() => onNavigate('malaria-targets')}
            className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Flag className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-bold text-slate-700">लक्ष्य प्रगती (Target Progress)</span>
          </button>
          <button
            onClick={() => onNavigate('data-validation')}
            className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-bold text-slate-700">डेटा गुणवत्ता (Data Quality)</span>
          </button>
        </div>
      </div>

    </div>
  );
};
