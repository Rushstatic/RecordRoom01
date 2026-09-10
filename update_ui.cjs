const fs = require('fs');
const file = './src/pages/TemplateFieldsPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const autoNumberUI = `
                {editingField.field_type === 'auto_number' && (
                  <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-4">
                    <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                      Auto Number Configuration
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800">Prefix (e.g. TB, NCD)</label>
                        <input
                          type="text"
                          value={autoNumberConfig.prefix}
                          onChange={e => setAutoNumberConfig({...autoNumberConfig, prefix: e.target.value.toUpperCase()})}
                          placeholder="Optional Prefix"
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800">Format Structure *</label>
                        <select
                          value={autoNumberConfig.format}
                          onChange={e => setAutoNumberConfig({...autoNumberConfig, format: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                        >
                          <option value="1">1, 2, 3...</option>
                          <option value="01">01, 02...</option>
                          <option value="001">001, 002...</option>
                          <option value="0001">0001, 0002...</option>
                          <option value="00001">00001, 00002...</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800">Numbering Scope *</label>
                        <select
                          value={autoNumberConfig.scope}
                          onChange={e => setAutoNumberConfig({...autoNumberConfig, scope: e.target.value as any})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                        >
                          <option value="register">Register-wise (नोंदवही नुसार)</option>
                          <option value="employee">Employee-wise (कर्मचारी नुसार)</option>
                          <option value="village">Village-wise (गावानुसार)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-800">Reset Rule *</label>
                        <select
                          value={autoNumberConfig.reset}
                          onChange={e => setAutoNumberConfig({...autoNumberConfig, reset: e.target.value as any})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                        >
                          <option value="never">Never (कधीही नाही)</option>
                          <option value="yearly">Yearly (दरवर्षी 1 पासून सुरू)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
`;

content = content.replace(
  "                {['dropdown', 'radio', 'result'].includes(editingField.field_type || '') && (",
  autoNumberUI + "\n                {['dropdown', 'radio', 'result'].includes(editingField.field_type || '') && ("
);

fs.writeFileSync(file, content);
console.log('done');
