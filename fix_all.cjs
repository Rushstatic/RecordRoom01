const fs = require('fs');
const file = 'src/pages/MalariaTargetsPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix handleResetFilters and useMemos
const startReset = content.indexOf('  const handleResetFilters = () => {');
const endResetMarker = '  // Sorted and searched lists';
const endReset = content.indexOf(endResetMarker);

const cleanResetAndMemos = `  const handleResetFilters = () => {
    setFilterType('Monthly');
    setFilterYear(currentYear);
    setFilterMonth(currentMonth);
    setSearchQuery('');
    setSortOption('progress-desc');
    if (isPhcController) {
      setSelectedPhcId('');
      setSelectedSubcentreId('');
      setSelectedVillageId('');
      setSelectedEmployeeId('');
    } else {
      setSelectedVillageId('');
      setSelectedEmployeeId('');
    }
  };

  // Target and Sample Period Filtering
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

  // Village Progress Items
  const villageProgressItems = useMemo(() => {
    return villages.map(v => {
      const vTargets = activeTargetsInPeriod.filter(t => t.village_id === v.id);
      const targetValue = vTargets.reduce((sum, t) => sum + t.target_value, 0);
      
      const vSamples = samplesInPeriod.filter(s => s.village_id === v.id);
      const actualSamples = vSamples.length;
      const sentSamples = vSamples.filter(s => !!s.sent_date).length;
      const pendingSamples = actualSamples - sentSamples;
      
      const remainingTarget = Math.max(0, targetValue - actualSamples);
      const progressPercent = targetValue > 0 ? Math.round((actualSamples / targetValue) * 100) : 0;
      
      return {
        id: v.id,
        entityId: v.id,
        entityName: v.village_name,
        entityType: 'village',
        targetValue,
        actualSamples,
        sentSamples,
        pendingSamples,
        remainingTarget,
        progressPercent
      };
    });
  }, [villages, activeTargetsInPeriod, samplesInPeriod]);

  // Employee Progress Items
  const employeeProgressItems = useMemo(() => {
    return employees.map(e => {
      const eTargets = activeTargetsInPeriod.filter(t => t.employee_id === e.id);
      const targetValue = eTargets.reduce((sum, t) => sum + t.target_value, 0);
      
      const eSamples = samplesInPeriod.filter(s => s.employee_id === e.id);
      const actualSamples = eSamples.length;
      const sentSamples = eSamples.filter(s => !!s.sent_date).length;
      const pendingSamples = actualSamples - sentSamples;
      
      const remainingTarget = Math.max(0, targetValue - actualSamples);
      const progressPercent = targetValue > 0 ? Math.round((actualSamples / targetValue) * 100) : 0;
      
      return {
        id: e.id,
        entityId: e.id,
        entityName: e.employee_name,
        entityType: 'employee',
        targetValue,
        actualSamples,
        sentSamples,
        pendingSamples,
        remainingTarget,
        progressPercent
      };
    });
  }, [employees, activeTargetsInPeriod, samplesInPeriod]);

  // Subcentre Progress Items
  const subcentreProgressItems = useMemo(() => {
    return subcentres.map(sc => {
      const scTargets = activeTargetsInPeriod.filter(t => t.subcentre_id === sc.id);
      const targetValue = scTargets.reduce((sum, t) => sum + t.target_value, 0);
      
      // Calculate actuals from samples in this subcentre (by village)
      const scSamples = samplesInPeriod.filter(s => {
        const v = villages.find(v => v.id === s.village_id);
        return v && v.subcentre_id === sc.id;
      });
      const actualSamples = scSamples.length;
      const sentSamples = scSamples.filter(s => !!s.sent_date).length;
      const pendingSamples = actualSamples - sentSamples;
      
      const remainingTarget = Math.max(0, targetValue - actualSamples);
      const progressPercent = targetValue > 0 ? Math.round((actualSamples / targetValue) * 100) : 0;
      
      return {
        id: sc.id,
        entityId: sc.id,
        entityName: sc.subcentre_name,
        entityType: 'subcentre',
        targetValue,
        actualSamples,
        sentSamples,
        pendingSamples,
        remainingTarget,
        progressPercent
      };
    });
  }, [subcentres, villages, activeTargetsInPeriod, samplesInPeriod]);

  // PHC Progress Items
  const phcProgressItems = useMemo(() => {
    return phcs.map(p => {
      const pTargets = activeTargetsInPeriod.filter(t => t.phc_id === p.id);
      const targetValue = pTargets.reduce((sum, t) => sum + t.target_value, 0);
      
      const pSamples = samplesInPeriod.filter(s => {
        const v = villages.find(v => v.id === s.village_id);
        if (!v) return false;
        const sc = subcentres.find(sc => sc.id === v.subcentre_id);
        return sc && sc.phc_id === p.id;
      });
      const actualSamples = pSamples.length;
      const sentSamples = pSamples.filter(s => !!s.sent_date).length;
      const pendingSamples = actualSamples - sentSamples;
      
      const remainingTarget = Math.max(0, targetValue - actualSamples);
      const progressPercent = targetValue > 0 ? Math.round((actualSamples / targetValue) * 100) : 0;
      
      return {
        id: p.id,
        entityId: p.id,
        entityName: p.phc_name,
        entityType: 'phc',
        targetValue,
        actualSamples,
        sentSamples,
        pendingSamples,
        remainingTarget,
        progressPercent
      };
    });
  }, [phcs, subcentres, villages, activeTargetsInPeriod, samplesInPeriod]);

  // KPI Summary
  const kpiSummary = useMemo(() => {
    let targetSum = 0;
    const actualSum = samplesInPeriod.length;
    const sentSum = samplesInPeriod.filter(s => !!s.sent_date).length;
    const pendingSum = actualSum - sentSum;
    
    if (activeTab === 'employees') {
      targetSum = employeeProgressItems.reduce((a, b) => a + b.targetValue, 0);
    } else if (activeTab === 'villages') {
      targetSum = villageProgressItems.reduce((a, b) => a + b.targetValue, 0);
    } else if (activeTab === 'subcentres') {
      targetSum = subcentreProgressItems.reduce((a, b) => a + b.targetValue, 0);
    } else if (activeTab === 'phcs') {
      targetSum = phcProgressItems.reduce((a, b) => a + b.targetValue, 0);
    }
    
    const remaining = Math.max(0, targetSum - actualSum);
    const progressPercent = targetSum > 0 ? Math.round((actualSum / targetSum) * 100) : 0;

    return {
      target: targetSum,
      actual: actualSum,
      sent: sentSum,
      pending: pendingSum,
      remaining,
      progressPercent
    };
  }, [samplesInPeriod, activeTab, employeeProgressItems, villageProgressItems, subcentreProgressItems, phcProgressItems]);

\n`;

content = content.substring(0, startReset) + cleanResetAndMemos + content.substring(endReset);


// 2. Now properly replace the `if (isPhcController) {` block!
// It's the only one left now.
const simpleView = `
  if (!isPhcController) {
    const mySubcentreItem = subcentreProgressItems.find(s => s.entityId === user?.assignedSubcentre);
    const myEmployeeItem = employeeProgressItems.find(e => e.entityId === user?.employeeId);
    const myVillageItems = villageProgressItems.filter(v => v.targetValue > 0 || v.actualSamples > 0);

    const applicableItems = [];
    if (mySubcentreItem && (mySubcentreItem.targetValue > 0 || mySubcentreItem.actualSamples > 0)) {
        applicableItems.push({...mySubcentreItem, entityName: 'उपकेंद्र: ' + mySubcentreItem.entityName});
    }
    if (myEmployeeItem && (myEmployeeItem.targetValue > 0 || myEmployeeItem.actualSamples > 0)) {
        applicableItems.push({...myEmployeeItem, entityName: 'कर्मचारी: ' + myEmployeeItem.entityName});
    }
    
    myVillageItems.forEach(v => {
        applicableItems.push({...v, entityName: 'गाव: ' + v.entityName});
    });

    return (
      <div className="max-w-3xl mx-auto space-y-4 pb-12 p-4">
        <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-4">
            <div className="p-2.5 rounded-xl bg-emerald-800 text-white shrink-0 shadow-xs">
              <Flag className="w-6 h-6" />
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
                <select className="border border-slate-300 rounded-lg py-1.5 px-3 text-xs bg-white focus:ring-2 focus:ring-emerald-700" value={filterType} onChange={e => setFilterType(e.target.value)}>
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
`;

const regex = /  if \(isPhcController\) \{[\s\S]*?    \);\n  \}/;
if (regex.test(content)) {
  content = content.replace(regex, simpleView);
  console.log('Successfully replaced second view!');
}

fs.writeFileSync(file, content);
console.log('done');
