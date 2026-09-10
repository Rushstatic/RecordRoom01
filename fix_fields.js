const fs = require('fs');
const file = './src/pages/TemplateFieldsPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace FIELD_TYPE_LABELS
content = content.replace(
/const FIELD_TYPE_LABELS: Record<FieldType, \{ label: string; desc: string; category: string \}> = \{[\s\S]*?\};/,
`const FIELD_TYPE_LABELS: Partial<Record<FieldType, { label: string; desc: string; category: string }>> = {
  text: { label: 'Text', desc: 'साधा मजकूर', category: 'मूलभूत' },
  textarea: { label: 'Textarea', desc: 'तपशीलवार मजकूर', category: 'मूलभूत' },
  number: { label: 'Number', desc: 'संख्या', category: 'मूलभूत' },
  date: { label: 'Date', desc: 'तारीख', category: 'तारीख व वेळ' },
  mobile: { label: 'Mobile', desc: 'मोबाईल नंबर', category: 'वैद्यकीय / संपर्क' },
  dropdown: { label: 'Dropdown', desc: 'ड्रॉपडाउन निवडा', category: 'पर्याय' },
  radio: { label: 'Radio', desc: 'रेडिओ बटन्स', category: 'पर्याय' },
  checkbox: { label: 'Checkbox', desc: 'चेकबॉक्स', category: 'पर्याय' },
  auto_date: { label: 'Auto Date', desc: 'स्वयंचलित तारीख', category: 'प्रगत' },
};`
);

// Replace Fields / फील्ड्स
content = content.replace(
/या नोंदवहीतील सक्रिय फील्ड्स \(\{fields\.length\}\)/g,
'Fields / फील्ड्स ({fields.length})'
);

// Replace button content
content = content.replace(
/<button\s+onClick=\{openNewFieldModal\}\s+className="bg-indigo-600[^>]*>\s*<Plus className="w-4 h-4" \/> नवीन Field जोडा\s*<\/button>/g,
`<button
              onClick={openNewFieldModal}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> + नवीन Field जोडा
            </button>`
);

// We need to simplify the form modal
const formStart = '<form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">';
const formEnd = '            </form>';
const formBlockRegex = new RegExp(formStart.replace(/[.*+?^$\{\}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?' + formEnd.replace(/[.*+?^$\{\}()|[\]\\]/g, '\\$&'));

const newFormBlock = `<form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Field Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={editingField.field_label || ''}
                    onChange={e => setEditingField({...editingField, field_label: e.target.value})}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 text-sm font-medium"
                    placeholder="उदा. रुग्णाचे पूर्ण नाव"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Field Key *
                  </label>
                  <input
                    required
                    type="text"
                    value={editingField.field_key || ''}
                    onChange={e => setEditingField({...editingField, field_key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_')})}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 text-sm font-mono"
                    placeholder="उदा. patient_name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Field Type *
                  </label>
                  <select
                    required
                    value={editingField.field_type || 'text'}
                    onChange={e => setEditingField({...editingField, field_type: e.target.value as FieldType})}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 text-sm font-medium bg-white"
                  >
                    {Object.entries(FIELD_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {['dropdown', 'radio', 'checkbox'].includes(editingField.field_type || '') && (
                  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                          पर्याय व्यवस्थापन (Options)
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-500 font-semibold">रेडीमेड सेट्स:</span>
                        {Object.entries(PRESET_OPTIONS).map(([pk, pv]) => (
                          <button
                            key={pk}
                            type="button"
                            onClick={() => applyPreset(pk)}
                            className="px-2 py-0.5 rounded bg-white border border-indigo-200 text-[10px] font-bold text-indigo-800 hover:bg-indigo-100 transition-colors cursor-pointer"
                          >
                            {pv.label.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {customOptions.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={opt.label}
                            onChange={e => updateOptionRow(i, 'label', e.target.value)}
                            placeholder={\`पर्याय \${i + 1} लेबल\`}
                            className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                          />
                          <input
                            type="text"
                            value={opt.value}
                            onChange={e => updateOptionRow(i, 'value', e.target.value)}
                            placeholder="Value"
                            className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => removeOptionRow(i)}
                            className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addOptionRow}
                      className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> आणखी पर्याय जोडा
                    </button>
                  </div>
                )}
                
                <label className="flex items-center gap-2 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={editingField.is_required ?? false}
                    onChange={e => setEditingField({...editingField, is_required: e.target.checked})}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-xs font-bold text-slate-800">Required</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-5 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'सेव्ह करत आहे...' : 'Save Field'}
                </button>
              </div>
            </form>`;

content = content.replace(formBlockRegex, newFormBlock);

fs.writeFileSync(file, content);
console.log('done');
