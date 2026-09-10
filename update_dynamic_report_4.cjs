const fs = require('fs');
const file = './src/pages/DynamicReportPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const filterUI = `
          {/* Result Filters */}
          {resultFields.map(f => {
            const opts = f.options_json || [];
            return (
              <select
                key={f.id}
                value={filterResultValues[f.field_key] || 'all'}
                onChange={e => setFilterResultValues(prev => ({ ...prev, [f.field_key]: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-medium text-teal-700"
              >
                <option value="all">सर्व {f.field_label}</option>
                {opts.map((opt: any, idx: number) => (
                  <option key={idx} value={opt.value || opt.label}>{opt.label}</option>
                ))}
              </select>
            );
          })}
`;

content = content.replace(
  "{/* Date Filter */}",
  filterUI + "\n          {/* Date Filter */}"
);

fs.writeFileSync(file, content);
console.log('done');
