const fs = require('fs');
const file = './src/pages/TemplateBuilderPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const stateCode = `
  const [resultOptions, setResultOptions] = useState<{label: string; value: string}[]>([
    { label: 'Positive', value: 'Positive' },
    { label: 'Negative', value: 'Negative' },
    { label: 'Pending', value: 'Pending' }
  ]);
  
  const addResultOption = () => setResultOptions([...resultOptions, { label: '', value: '' }]);
  const updateResultOption = (index: number, val: string) => {
    const newOpts = [...resultOptions];
    newOpts[index] = { label: val, value: val };
    setResultOptions(newOpts);
  };
  const removeResultOption = (index: number) => {
    const newOpts = [...resultOptions];
    newOpts.splice(index, 1);
    setResultOptions(newOpts);
  };
`;

content = content.replace(
  "  const [loadingPreview, setLoadingPreview] = useState(false);",
  "  const [loadingPreview, setLoadingPreview] = useState(false);\n" + stateCode
);

const openNewModalCode = `
  const openNewModal = () => {
    setEditingTemplate({ 
      register_type: 'Other',
      usage_type: 'सामान्य नोंदवही',
      requires_result: false
    });
    setResultOptions([
      { label: 'Positive', value: 'Positive' },
      { label: 'Negative', value: 'Negative' },
      { label: 'Pending', value: 'Pending' }
    ]);
    setErrorMsg(null);
    setShowModal(true);
  };
`;

content = content.replace(
  "  const openNewModal = () => {\n    setEditingTemplate({ \n      register_type: 'Other' \n    });\n    setErrorMsg(null);\n    setShowModal(true);\n  };",
  openNewModalCode
);

const handleSaveChanges = `
      const isNew = !editingTemplate.id;
      const templateId = editingTemplate.id || crypto.randomUUID();
      const newTemplate: RecordRegisterTemplate = {
        id: templateId,
        register_code: cleanCode,
        register_name: editingTemplate.register_name.trim(),
        program_name: editingTemplate.program_name || null,
        description: editingTemplate.description || null,
        icon: editingTemplate.icon || 'FileText',
        register_type: editingTemplate.register_type || 'Other',
        usage_type: editingTemplate.usage_type || 'सामान्य नोंदवही',
        requires_result: editingTemplate.requires_result || false,
        is_active: editingTemplate.is_active ?? true,
        display_order: editingTemplate.display_order || templates.length + 1,
        created_by: user?.id,
      };
      
      await templateService.saveTemplate(newTemplate);
      
      // If new, and requires result, auto-add a result field
      if (isNew && newTemplate.usage_type === 'नमुना नोंदवही' && newTemplate.requires_result) {
        await templateService.saveTemplateField({
          id: crypto.randomUUID(),
          template_id: templateId,
          field_key: 'result_outcome',
          field_label: 'तपासणी निकाल',
          field_type: 'result',
          field_order: 99,
          is_required: true,
          is_searchable: true,
          show_in_list: true,
          show_in_report: true,
          show_in_print: true,
          default_value: null,
          placeholder: 'निकाल निवडा',
          help_text: null,
          options_json: resultOptions.filter(o => o.label.trim() !== ''),
          is_active: true
        });
      }
`;

content = content.replace(
  /const templateId = editingTemplate\.id \|\| crypto\.randomUUID\(\);\s*const newTemplate: RecordRegisterTemplate = \{([\s\S]*?)\};\s*await templateService\.saveTemplate\(newTemplate\);/,
  handleSaveChanges
);

fs.writeFileSync(file, content);
console.log('done');
