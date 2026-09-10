const fs = require('fs');
const file = './src/pages/PendingDynamicRecordsPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// add imports
content = content.replace(
  "import { templateService } from '../services/templateService';",
  "import { templateService } from '../services/templateService';\nimport { masterDataService } from '../services/masterDataService';\nimport { EmployeeMaster, Subcentre, Village } from '../types';"
);

// add state variables
const stateVars = `
  const [employees, setEmployees] = useState<EmployeeMaster[]>([]);
  const [subcentres, setSubcentres] = useState<Subcentre[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [filterDate, setFilterDate] = useState('');
`;

content = content.replace(
  "  const [filterVillageId, setFilterVillageId] = useState('all');",
  "  const [filterVillageId, setFilterVillageId] = useState('all');\n" + stateVars
);

// add load data
const loadData = `
    try {
      const emps = await masterDataService.getEmployees();
      const scs = await masterDataService.getSubcentres();
      const vils = await masterDataService.getVillages();
      setEmployees(emps);
      setSubcentres(scs);
      setVillages(vils);
`;

content = content.replace(
  "    try {\n      const templates",
  loadData + "      const templates"
);

// add date filter logic
const filterLogic = `
      if (filterVillageId !== 'all' && item.record.village_id !== filterVillageId) return false;
      if (filterDate && item.record.record_date !== filterDate) return false;
`;

content = content.replace(
  "      if (filterVillageId !== 'all' && item.record.village_id !== filterVillageId) return false;",
  filterLogic
);

// add UI
const ui = `
          <select
            value={filterTemplateId}
            onChange={e => setFilterTemplateId(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 bg-white"
          >
            <option value="">सर्व रजिस्टर (All Registers)</option>
            {allTemplates.filter(t => t.is_active).map(t => (
              <option key={t.id} value={t.id}>{t.register_name}</option>
            ))}
          </select>
          {isPhcController && (
            <>
              <select
                value={filterEmployeeId}
                onChange={e => setFilterEmployeeId(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 bg-white"
              >
                <option value="all">सर्व कर्मचारी (All Employees)</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.designation})</option>
                ))}
              </select>
              <select
                value={filterSubcentreId}
                onChange={e => setFilterSubcentreId(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 bg-white"
              >
                <option value="all">सर्व उपकेंद्र (All Subcentres)</option>
                {subcentres.map(sc => (
                  <option key={sc.id} value={sc.id}>{sc.name}</option>
                ))}
              </select>
              <select
                value={filterVillageId}
                onChange={e => setFilterVillageId(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 bg-white"
              >
                <option value="all">सर्व गावे (All Villages)</option>
                {villages.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
              <input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 bg-white"
              />
            </>
          )}
`;

content = content.replace(
  /<select[\s\S]*?<\/select>/,
  ui
);

fs.writeFileSync(file, content);
console.log('done');
