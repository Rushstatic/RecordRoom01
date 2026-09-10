const fs = require('fs');
const file = './src/pages/MalariaTargetsPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `  const [targetLevel, setTargetLevel] = useState<'phc' | 'subcentre' | 'village' | 'employee'>('phc');
  const [targetValue, setTargetValue] = useState<string>('');
  const [savingTarget, setSavingTarget] = useState<boolean>(false);

  const availableSubcentres = subcentres.filter(s => !selectedPhcId || s.phc_id === selectedPhcId);
  const availableVillages = villages.filter(v => !selectedSubcentreId || v.subcentre_id === selectedSubcentreId);
  const availableEmployees = employees.filter(e => !selectedSubcentreId || e.subcentre_id === selectedSubcentreId);

  const activeProgressItems = 
    targetLevel === 'phc' ? phcProgressItems :
    targetLevel === 'subcentre' ? subcentreProgressItems :
    targetLevel === 'employee' ? employeeProgressItems :
    villageProgressItems;

  const handleSaveTarget = async () => {
    const val = Number(targetValue);
    if (isNaN(val) || val <= 0) {
      alert('कृपया वैध लक्ष्य संख्या टाका.');
      return;
    }

    let phcId: string | null = selectedPhcId || null;
    let subcentreId: string | null = null;
    let villageId: string | null = null;
    let employeeId: string | null = null;

    if (targetLevel === 'phc') {
      if (!phcId) return alert('कृपया PHC निवडा.');
    } else if (targetLevel === 'subcentre') {
      if (!selectedSubcentreId) return alert('कृपया उपकेंद्र निवडा.');
      subcentreId = selectedSubcentreId;
    } else if (targetLevel === 'village') {
      if (!selectedVillageId) return alert('कृपया गाव निवडा.');
      villageId = selectedVillageId;
      const v = villages.find(x => x.id === villageId);
      if (v) { subcentreId = v.subcentre_id; phcId = subcentres.find(s => s.id === subcentreId)?.phc_id || null; }
    } else if (targetLevel === 'employee') {
      if (!selectedEmployeeId) return alert('कृपया कर्मचारी निवडा.');
      employeeId = selectedEmployeeId;
      const e = employees.find(x => x.id === employeeId);
      if (e) { subcentreId = e.subcentre_id; phcId = subcentres.find(s => s.id === subcentreId)?.phc_id || null; }
    }

    const existingTarget = activeTargetsInPeriod.find(t => {
      if (targetLevel === 'phc') return t.phc_id === phcId && !t.subcentre_id && !t.village_id && !t.employee_id;
      if (targetLevel === 'subcentre') return t.subcentre_id === subcentreId && !t.village_id && !t.employee_id;
      if (targetLevel === 'village') return t.village_id === villageId && !t.employee_id;
      if (targetLevel === 'employee') return t.employee_id === employeeId;
      return false;
    });

    setSavingTarget(true);
    try {
      const payload = {
        target_type: filterType,
        target_year: filterYear,
        target_month: filterType === 'Monthly' ? filterMonth : null,
        target_value: val,
        phc_id: phcId,
        subcentre_id: subcentreId,
        village_id: villageId,
        employee_id: employeeId,
      };

      let error;
      if (existingTarget) {
        const res = await targetService.updateTarget(existingTarget.id, payload);
        error = res.error;
      } else {
        const res = await targetService.createTarget({ ...payload, created_by: user?.id });
        error = res.error;
      }

      if (error) {
        alert(error);
      } else {
        alert('लक्ष्य जतन केले! (Target Saved!)');
        setTargetValue('');
        loadData(true);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingTarget(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-12 p-4">
      <h1 className="text-xl font-bold text-slate-900 mb-2">मलेरिया रक्त नमुना लक्ष्य</h1>

      <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200">
        <h2 className="text-sm font-bold text-slate-700 mb-3">1. Target Type</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('Monthly')}
            className={\`flex-1 py-2 rounded-lg font-bold text-xs border transition-colors cursor-pointer \${filterType === 'Monthly' ? 'bg-emerald-100 border-emerald-500 text-emerald-900 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}\`}
          >
            Monthly
          </button>
          <button
            onClick={() => setFilterType('Yearly')}
            className={\`flex-1 py-2 rounded-lg font-bold text-xs border transition-colors cursor-pointer \${filterType === 'Yearly' ? 'bg-emerald-100 border-emerald-500 text-emerald-900 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}\`}
          >
            Yearly
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200">
        <h2 className="text-sm font-bold text-slate-700 mb-3">2. Target Level</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {['phc', 'subcentre', 'village', 'employee'].map(level => (
            <button
              key={level}
              onClick={() => {
                setTargetLevel(level as 'phc' | 'subcentre' | 'village' | 'employee');
                setSelectedPhcId('');
                setSelectedSubcentreId('');
                setSelectedVillageId('');
                setSelectedEmployeeId('');
              }}
              className={\`py-2 rounded-lg font-bold text-xs border capitalize transition-colors cursor-pointer \${targetLevel === level ? 'bg-emerald-100 border-emerald-500 text-emerald-900 shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}\`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200">
        <h2 className="text-sm font-bold text-slate-700 mb-3">3. Target Config</h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">PHC</label>
              <select className="w-full border border-slate-300 rounded-lg py-2 px-3 text-xs bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-hidden cursor-pointer" value={selectedPhcId} onChange={e => setSelectedPhcId(e.target.value)}>
                <option value="">Select PHC</option>
                {phcs.map(p => <option key={p.id} value={p.id}>{p.phc_name}</option>)}
              </select>
            </div>

            {(targetLevel === 'subcentre' || targetLevel === 'village' || targetLevel === 'employee') && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Subcentre</label>
                <select className="w-full border border-slate-300 rounded-lg py-2 px-3 text-xs bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-hidden cursor-pointer" value={selectedSubcentreId} onChange={e => setSelectedSubcentreId(e.target.value)}>
                  <option value="">Select Subcentre</option>
                  {availableSubcentres.map(s => <option key={s.id} value={s.id}>{s.subcentre_name}</option>)}
                </select>
              </div>
            )}

            {targetLevel === 'village' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Village</label>
                <select className="w-full border border-slate-300 rounded-lg py-2 px-3 text-xs bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-hidden cursor-pointer" value={selectedVillageId} onChange={e => setSelectedVillageId(e.target.value)}>
                  <option value="">Select Village</option>
                  {availableVillages.map(v => <option key={v.id} value={v.id}>{v.village_name}</option>)}
                </select>
              </div>
            )}

            {targetLevel === 'employee' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Employee</label>
                <select className="w-full border border-slate-300 rounded-lg py-2 px-3 text-xs bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-hidden cursor-pointer" value={selectedEmployeeId} onChange={e => setSelectedEmployeeId(e.target.value)}>
                  <option value="">Select Employee</option>
                  {availableEmployees.map(e => <option key={e.id} value={e.id}>{e.employee_name}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 my-3"></div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Period (Year)</label>
              <select className="w-full border border-slate-300 rounded-lg py-2 px-3 text-xs bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-hidden cursor-pointer" value={filterYear} onChange={e => setFilterYear(Number(e.target.value))}>
                {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            {filterType === 'Monthly' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Period (Month)</label>
                <select className="w-full border border-slate-300 rounded-lg py-2 px-3 text-xs bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-hidden cursor-pointer" value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))}>
                  {MONTH_NAMES_MR.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Target Number</label>
            <input 
              type="number" 
              className="w-full border border-slate-300 rounded-lg py-2 px-3 text-xs font-bold bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-hidden cursor-text" 
              value={targetValue} 
              onChange={e => setTargetValue(e.target.value)}
              placeholder="Enter target number"
            />
          </div>

          <button 
            onClick={handleSaveTarget}
            disabled={savingTarget}
            className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2.5 rounded-lg text-xs mt-2 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>{savingTarget ? 'Saving...' : 'Save Target'}</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-700">4. Target Progress</h2>
          <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
            {periodLabel}
          </span>
        </div>
        
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {activeProgressItems.map(item => (
            <div key={item.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50 flex flex-col gap-3">
              <div className="font-bold text-slate-900 text-sm">
                {item.entityName}
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-white border border-slate-200 py-1.5 px-1 rounded-md shadow-xs flex flex-col justify-center">
                  <div className="text-slate-500 mb-0.5 font-medium text-[10px]">Target</div>
                  <div className="font-bold text-slate-900">{item.targetValue}</div>
                </div>
                <div className="bg-white border border-slate-200 py-1.5 px-1 rounded-md shadow-xs flex flex-col justify-center">
                  <div className="text-slate-500 mb-0.5 font-medium text-[10px]">Actual</div>
                  <div className="font-bold text-emerald-700">{item.actualSamples}</div>
                </div>
                <div className="bg-white border border-slate-200 py-1.5 px-1 rounded-md shadow-xs flex flex-col justify-center">
                  <div className="text-slate-500 mb-0.5 font-medium text-[10px]">Remain</div>
                  <div className="font-bold text-amber-700">{item.remainingTarget}</div>
                </div>
                <div className="bg-white border border-slate-200 py-1.5 px-1 rounded-md shadow-xs flex flex-col justify-center">
                  <div className="text-slate-500 mb-0.5 font-medium text-[10px]">Prog %</div>
                  <div className="font-bold text-blue-700">{item.progressPercent}%</div>
                </div>
              </div>
            </div>
          ))}
          {activeProgressItems.length === 0 && (
            <div className="text-center text-xs text-slate-500 py-6 border border-dashed border-slate-200 rounded-lg">
              No data available for selected criteria
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
`;

const returnIndex = content.indexOf('  return (\n    <div className="space-y-5 pb-12">');
if (returnIndex !== -1) {
  content = content.substring(0, returnIndex) + replacement;
  fs.writeFileSync(file, content);
  console.log('Successfully replaced file content');
} else {
  console.error('Could not find the return block');
}
