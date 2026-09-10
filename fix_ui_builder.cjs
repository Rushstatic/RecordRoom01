const fs = require('fs');
const file = './src/pages/TemplateBuilderPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const usageUI = `
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  वापराचा प्रकार (Usage Type) *
                </label>
                <select
                  required
                  value={editingTemplate.usage_type || 'सामान्य नोंदवही'}
                  onChange={e => {
                     setEditingTemplate({
                        ...editingTemplate, 
                        usage_type: e.target.value,
                        requires_result: e.target.value === 'नमुना नोंदवही' ? editingTemplate.requires_result : false
                     })
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 text-sm font-medium bg-white"
                >
                  <option value="सामान्य नोंदवही">सामान्य नोंदवही</option>
                  <option value="नमुना नोंदवही">नमुना नोंदवही</option>
                  <option value="लाभार्थी नोंदवही">लाभार्थी नोंदवही</option>
                  <option value="सेवा/कार्य नोंदवही">सेवा/कार्य नोंदवही</option>
                  <option value="इतर">इतर</option>
                </select>
              </div>

              {editingTemplate.usage_type === 'नमुना नोंदवही' && (
                 <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                       तपासणी निकाल आवश्यक आहे का?
                     </label>
                     <div className="flex gap-4">
                       <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                         <input 
                           type="radio" 
                           checked={editingTemplate.requires_result === true}
                           onChange={() => setEditingTemplate({...editingTemplate, requires_result: true})}
                           className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-600"
                         />
                         होय (Yes)
                       </label>
                       <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                         <input 
                           type="radio" 
                           checked={!editingTemplate.requires_result}
                           onChange={() => setEditingTemplate({...editingTemplate, requires_result: false})}
                           className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-600"
                         />
                         नाही (No)
                       </label>
                     </div>
                   </div>

                   {editingTemplate.requires_result && (
                     <div className="space-y-3 pt-3 border-t border-slate-200">
                       <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex justify-between items-center">
                         <span>Result Options / निकाल पर्याय</span>
                       </label>
                       <div className="space-y-2 max-h-48 overflow-y-auto">
                         {resultOptions.map((opt, i) => (
                           <div key={i} className="flex items-center gap-2">
                             <input
                               type="text"
                               value={opt.label}
                               onChange={e => updateResultOption(i, e.target.value)}
                               placeholder={\`Option \${i + 1}\`}
                               className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-600"
                             />
                             <button
                               type="button"
                               onClick={() => removeResultOption(i)}
                               className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"
                             >
                               <Trash2 className="w-3.5 h-3.5" />
                             </button>
                           </div>
                         ))}
                       </div>
                       <button
                         type="button"
                         onClick={addResultOption}
                         className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
                       >
                         <Plus className="w-3.5 h-3.5" />
                         नवीन पर्याय जोडा (Add Option)
                       </button>
                     </div>
                   )}
                 </div>
              )}
`;

content = content.replace(
  "                </select>\n              </div>\n\n              <div className=\"space-y-1.5\">",
  "                </select>\n              </div>\n\n" + usageUI + "\n\n              <div className=\"space-y-1.5\">"
);

fs.writeFileSync(file, content);
console.log('done');
