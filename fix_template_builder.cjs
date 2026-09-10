const fs = require('fs');
const file = './src/pages/TemplateBuilderPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const dropdownHTML = `
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  नोंदवही प्रकार (Register Type)
                </label>
                <select
                  value={editingTemplate.register_type || ''}
                  onChange={e => setEditingTemplate({...editingTemplate, register_type: e.target.value})}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 text-sm font-medium bg-white"
                >
                  <option value="">निवडा (Select)</option>
                  <option value="रक्त नमुना नोंदवही">रक्त नमुना नोंदवही</option>
                  <option value="थुंकी नमुना नोंदवही">थुंकी नमुना नोंदवही</option>
                  <option value="इतर नमुना नोंदवही">इतर नमुना नोंदवही</option>
                  <option value="प्रसूती नोंदवही">प्रसूती नोंदवही</option>
                  <option value="इतर नोंदवही">इतर नोंदवही</option>
                </select>
              </div>
`;

content = content.replace(
  "{/* Icon Picker */}",
  dropdownHTML + "\n              {/* Icon Picker */}"
);

fs.writeFileSync(file, content);
console.log('done');
