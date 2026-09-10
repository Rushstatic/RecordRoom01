const fs = require('fs');
const file = 'src/pages/MalariaTargetsPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /  if \(isPhcController\) \{[\s\S]*?    \);\n  \}/;

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
`;

if (regex.test(content)) {
  content = content.replace(regex, simpleView);
  fs.writeFileSync(file, content);
  console.log('Done');
} else {
  console.log('Regex not matched!');
}
