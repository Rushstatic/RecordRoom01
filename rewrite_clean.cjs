const fs = require('fs');

const code = `import React, { useState, useEffect, useMemo } from 'react';
import {
  Flag, Target, PlusCircle, RefreshCw, Printer, Download, Search, Filter,
  AlertTriangle, CheckCircle2, Clock, Building2, Home, MapPin, Users, Edit2,
  Trash2, ArrowUpDown, Code2, ChevronDown, X, FileSpreadsheet, Save
} from 'lucide-react';
import {
  PageId, MalariaTarget, TargetType, TargetScopeLevel, TargetProgressItem,
  ProgressStatus, PhcMaster, SubcentreMaster, VillageMaster, EmployeeMaster,
  MalariaBloodSample
} from '../types';
import { useAuth } from '../hooks/useAuth';
import { targetService } from '../services/targetService';
import { masterDataService } from '../services/masterDataService';
import { malariaService } from '../services/malariaService';
import { MalariaTargetModal } from '../components/targets/MalariaTargetModal';
import { MalariaTargetPrintView } from '../components/targets/MalariaTargetPrintView';

const MONTH_NAMES_MR = ['', 'जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'];

interface MalariaTargetsPageProps {
  onNavigate?: (page: PageId) => void;
}

export const MalariaTargetsPage: React.FC<MalariaTargetsPageProps> = ({ onNavigate }) => {
  const { user, role } = useAuth();
  const isPhcController = role === 'phc_controller';

  // Master lists
  const [phcs, setPhcs] = useState<PhcMaster[]>([]);
  const [subcentres, setSubcentres] = useState<SubcentreMaster[]>([]);
  const [villages, setVillages] = useState<VillageMaster[]>([]);
  const [employees, setEmployees] = useState<EmployeeMaster[]>([]);
  const [samples, setSamples] = useState<MalariaBloodSample[]>([]);
  const [targets, setTargets] = useState<MalariaTarget[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // States
  const [filterType, setFilterType] = useState<TargetType>('Monthly');
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [filterYear, setFilterYear] = useState<number>(currentYear);
  const [filterMonth, setFilterMonth] = useState<number>(currentMonth);
  const [activeTab, setActiveTab] = useState<'villages' | 'employees' | 'subcentres' | 'phcs'>('villages');
  const [searchQuery, setSearchQuery] = useState('');

  // Admin filter states
  const [selectedPhcId, setSelectedPhcId] = useState<string>('');
  const [selectedSubcentreId, setSelectedSubcentreId] = useState<string>('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetToEdit, setTargetToEdit] = useState<MalariaTarget | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [phcList, scList, vilList, empList, sampleList, targetList] = await Promise.all([
        masterDataService.getPhcs(),
        masterDataService.getSubcentres(),
        masterDataService.getVillages(),
        masterDataService.getEmployees(),
        malariaService.getSamples(),
        targetService.getTargets(),
      ]);
      setPhcs(phcList);
      setSubcentres(scList);
      setVillages(vilList);
      setEmployees(empList);
      setSamples(sampleList);
      setTargets(targetList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper Memos
  const activeTargetsInPeriod = useMemo(() => {
    return targets.filter(t => {
      if (t.target_year !== filterYear) return false;
      if (filterType === 'Monthly' && t.target_month !== filterMonth) return false;
      if (filterType === 'Yearly' && t.target_type === 'Monthly') return false;
      return true;
    });
  }, [targets, filterYear, filterMonth, filterType]);

  const samplesInPeriod = useMemo(() => {
    return samples.filter(s => {
      if (!s.sample_collection_date) return false;
      const dt = new Date(s.sample_collection_date);
      if (isNaN(dt.getTime())) return false;
      if (dt.getFullYear() !== filterYear) return false;
      if (filterType === 'Monthly' && (dt.getMonth() + 1) !== filterMonth) return false;
      return true;
    });
  }, [samples, filterYear, filterMonth, filterType]);

  const villageProgressItems = useMemo(() => {
    return villages.map(v => {
      const vTargets = activeTargetsInPeriod.filter(t => t.village_id === v.id);
      const targetValue = vTargets.reduce((sum, t) => sum + t.target_value, 0);
      const vSamples = samplesInPeriod.filter(s => s.village_id === v.id);
      const actualSamples = vSamples.length;
      const remainingTarget = Math.max(0, targetValue - actualSamples);
      const progressPercent = targetValue > 0 ? Math.round((actualSamples / targetValue) * 100) : 0;
      return { id: v.id, entityId: v.id, entityName: v.village_name, entityType: 'village', targetValue, actualSamples, remainingTarget, progressPercent, sentSamples: 0, pendingSamples: 0 } as TargetProgressItem;
    });
  }, [villages, activeTargetsInPeriod, samplesInPeriod]);

  const employeeProgressItems = useMemo(() => {
    return employees.map(e => {
      const eTargets = activeTargetsInPeriod.filter(t => t.employee_id === e.id);
      const targetValue = eTargets.reduce((sum, t) => sum + t.target_value, 0);
      const eSamples = samplesInPeriod.filter(s => s.employee_id === e.id);
      const actualSamples = eSamples.length;
      const remainingTarget = Math.max(0, targetValue - actualSamples);
      const progressPercent = targetValue > 0 ? Math.round((actualSamples / targetValue) * 100) : 0;
      return { id: e.id, entityId: e.id, entityName: e.employee_name, entityType: 'employee', targetValue, actualSamples, remainingTarget, progressPercent, sentSamples: 0, pendingSamples: 0 } as TargetProgressItem;
    });
  }, [employees, activeTargetsInPeriod, samplesInPeriod]);

  const subcentreProgressItems = useMemo(() => {
    return subcentres.map(sc => {
      const scTargets = activeTargetsInPeriod.filter(t => t.subcentre_id === sc.id);
      const targetValue = scTargets.reduce((sum, t) => sum + t.target_value, 0);
      const scSamples = samplesInPeriod.filter(s => {
        const v = villages.find(v => v.id === s.village_id);
        return v && v.subcentre_id === sc.id;
      });
      const actualSamples = scSamples.length;
      const remainingTarget = Math.max(0, targetValue - actualSamples);
      const progressPercent = targetValue > 0 ? Math.round((actualSamples / targetValue) * 100) : 0;
      return { id: sc.id, entityId: sc.id, entityName: sc.subcentre_name, entityType: 'subcentre', targetValue, actualSamples, remainingTarget, progressPercent, sentSamples: 0, pendingSamples: 0 } as TargetProgressItem;
    });
  }, [subcentres, villages, activeTargetsInPeriod, samplesInPeriod]);

  // Employee Simple View
  if (!isPhcController) {
    if (loading) {
      return <div className="p-8 text-center text-slate-500">Loading...</div>;
    }

    const mySubcentreItem = subcentreProgressItems.find(s => s.entityId === user?.assignedSubcentre);
    const myEmployeeItem = employeeProgressItems.find(e => e.entityId === user?.employeeId);
    
    // villages in employee's assigned subcentre
    const empSubcentreVillages = villages.filter(v => v.subcentre_id === user?.assignedSubcentre);
    const myVillageItems = villageProgressItems.filter(v => empSubcentreVillages.some(ev => ev.id === v.entityId));

    const applicableItems = [];
    if (mySubcentreItem && (mySubcentreItem.targetValue > 0 || mySubcentreItem.actualSamples > 0)) {
        applicableItems.push({...mySubcentreItem, entityName: 'उपकेंद्र: ' + mySubcentreItem.entityName});
    }
    if (myEmployeeItem && (myEmployeeItem.targetValue > 0 || myEmployeeItem.actualSamples > 0)) {
        applicableItems.push({...myEmployeeItem, entityName: 'कर्मचारी: ' + myEmployeeItem.entityName});
    }
    myVillageItems.forEach(v => {
        if (v.targetValue > 0 || v.actualSamples > 0) {
            applicableItems.push({...v, entityName: 'गाव: ' + v.entityName});
        }
    });

    return (
      <div className="max-w-3xl mx-auto space-y-4 pb-12 p-4">
        <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-4">
            <div className="p-2.5 rounded-xl bg-emerald-800 text-white shrink-0 shadow-xs">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">माझे लक्ष्य व प्रगती</h1>
              <p className="text-xs text-slate-500 mt-1">Subcentre Employee: कार्यक्षेत्रातील नेमून दिलेले उद्दिष्ट व प्रत्यक्ष संकलन प्रगती दर्शक.</p>
            </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800">सध्याची प्रगती</h2>
            <div className="flex gap-2">
                <select className="border border-slate-300 rounded-lg py-1.5 px-3 text-xs bg-white focus:ring-2 focus:ring-emerald-700" value={filterType} onChange={e => setFilterType(e.target.value as any)}>
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                </select>
                {filterType === 'Monthly' && (
                    <select className="border border-slate-300 rounded-lg py-1.5 px-3 text-xs bg-white focus:ring-2 focus:ring-emerald-700" value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))}>
                        {MONTH_NAMES_MR.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                    </select>
                )}
                <select className="border border-slate-300 rounded-lg py-1.5 px-3 text-xs bg-white focus:ring-2 focus:ring-emerald-700" value={filterYear} onChange={e => setFilterYear(Number(e.target.value))}>
                    {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>
          </div>

          <div className="space-y-4">
            {applicableItems.map((item, idx) => (
              <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col gap-3">
                <div className="font-bold text-slate-900 text-sm">
                  {item.entityName}
                </div>
                <div className="grid grid-cols-4 gap-3 text-center text-sm">
                  <div className="bg-white border border-slate-200 py-3 px-2 rounded-xl shadow-xs flex flex-col justify-center">
                    <div className="text-slate-500 mb-1 font-semibold text-xs">Target</div>
                    <div className="font-bold text-slate-900 text-lg">{item.targetValue}</div>
                  </div>
                  <div className="bg-white border border-slate-200 py-3 px-2 rounded-xl shadow-xs flex flex-col justify-center">
                    <div className="text-slate-500 mb-1 font-semibold text-xs">Actual</div>
                    <div className="font-bold text-emerald-700 text-lg">{item.actualSamples}</div>
                  </div>
                  <div className="bg-white border border-slate-200 py-3 px-2 rounded-xl shadow-xs flex flex-col justify-center">
                    <div className="text-slate-500 mb-1 font-semibold text-xs">Remaining</div>
                    <div className="font-bold text-amber-700 text-lg">{item.remainingTarget}</div>
                  </div>
                  <div className="bg-white border border-slate-200 py-3 px-2 rounded-xl shadow-xs flex flex-col justify-center">
                    <div className="text-slate-500 mb-1 font-semibold text-xs">Progress %</div>
                    <div className="font-bold text-blue-700 text-lg">{item.progressPercent}%</div>
                  </div>
                </div>
              </div>
            ))}
            {applicableItems.length === 0 && (
              <div className="text-center text-sm font-medium text-slate-500 py-10 border-2 border-dashed border-slate-200 rounded-xl">
                या कालावधीसाठी कोणतेही लक्ष्य आढळले नाही. (No targets found)
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // PHC Admin Complex View
  const filteredVillages = villageProgressItems.filter(v => {
    if (selectedSubcentreId) {
       const vil = villages.find(vi => vi.id === v.entityId);
       if (vil && vil.subcentre_id !== selectedSubcentreId) return false;
    }
    if (searchQuery && !v.entityName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-5 pb-12 p-4 max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-800 text-white shrink-0 shadow-xs">
            <Flag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">
              मलेरिया रक्त नमुना लक्ष्य व प्रगती व्यवस्थापन
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              PHC Controller: उद्दिष्ट निश्चिती (Target Setting), प्रत्यक्ष संकलन तुलना व कार्यप्रगती विश्लेषण.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-800 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-xs hover:bg-emerald-900"
          >
            <PlusCircle className="w-4 h-4" />
            नवीन लक्ष्य जोडा (Create Target)
          </button>
        </div>
      </div>

      {/* Target Level Tabs */}
      <div className="bg-white p-2 rounded-xl shadow-xs border border-slate-200 flex flex-wrap gap-2">
         {['villages', 'employees', 'subcentres'].map(tab => (
           <button
             key={tab}
             onClick={() => setActiveTab(tab as any)}
             className={\`px-4 py-2 rounded-lg text-sm font-bold capitalize \${activeTab === tab ? 'bg-emerald-100 text-emerald-900' : 'text-slate-600 hover:bg-slate-50'}\`}
           >
             {tab}
           </button>
         ))}
      </div>

      {/* Progress Cards */}
      <div className="space-y-3">
        {filteredVillages.map(item => (
          <div key={item.id} className="border border-slate-200 rounded-lg p-4 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="font-bold text-slate-900">{item.entityName}</div>
            <div className="flex gap-4 text-center">
               <div><div className="text-xs text-slate-500">Target</div><div className="font-bold">{item.targetValue}</div></div>
               <div><div className="text-xs text-slate-500">Actual</div><div className="font-bold text-emerald-700">{item.actualSamples}</div></div>
               <div><div className="text-xs text-slate-500">Remain</div><div className="font-bold text-amber-700">{item.remainingTarget}</div></div>
               <div><div className="text-xs text-slate-500">Prog %</div><div className="font-bold text-blue-700">{item.progressPercent}%</div></div>
            </div>
            <div className="flex gap-2">
               <button onClick={() => {}} className="p-2 text-slate-400 hover:text-emerald-700"><Edit2 className="w-4 h-4"/></button>
               <button onClick={() => {}} className="p-2 text-slate-400 hover:text-rose-700"><Trash2 className="w-4 h-4"/></button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <MalariaTargetModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaved={() => loadData()}
          targetToEdit={targetToEdit}
          phcs={phcs}
          subcentres={subcentres}
          villages={villages}
          employees={employees}
        />
      )}
    </div>
  );
};
`;

fs.writeFileSync('src/pages/MalariaTargetsPage.tsx', code);
