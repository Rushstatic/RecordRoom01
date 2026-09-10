import React, { useState, useEffect } from 'react';
import { RecordTemplateField, RecordRegisterTemplate, FieldType, PageId } from '../types';
import { templateService } from '../services/templateService';
import { useAuth } from '../hooks/useAuth';
import { storage } from '../lib/storage';
import { DynamicRecordForm } from '../components/DynamicRecordForm';
import {  
  ArrowLeft, Plus, Trash2, Edit3, GripVertical, CheckCircle2, 
  XCircle, Eye, Settings, ChevronUp, ChevronDown, Sparkles, 
  AlertCircle, HelpCircle, Layers, FileSpreadsheet, Lock
, Save } from 'lucide-react';

const FIELD_TYPE_LABELS: Partial<Record<FieldType, { label: string; desc: string; category: string }>> = {
  text: { label: 'Text', desc: 'साधा मजकूर', category: 'मूलभूत' },
  textarea: { label: 'Textarea', desc: 'तपशीलवार मजकूर', category: 'मूलभूत' },
  number: { label: 'Number', desc: 'संख्या', category: 'मूलभूत' },
  date: { label: 'Date', desc: 'तारीख', category: 'तारीख व वेळ' },
  mobile: { label: 'Mobile', desc: 'मोबाईल नंबर', category: 'वैद्यकीय / संपर्क' },
  dropdown: { label: 'Dropdown', desc: 'ड्रॉपडाउन निवडा', category: 'पर्याय' },
  radio: { label: 'Radio', desc: 'रेडिओ बटन्स', category: 'पर्याय' },
  checkbox: { label: 'Checkbox', desc: 'चेकबॉक्स', category: 'पर्याय' },
  result: { label: 'Result / Outcome', desc: 'निकाल / निष्कर्ष', category: 'पर्याय' },
  auto_date: { label: 'Auto Date', desc: 'स्वयंचलित तारीख', category: 'प्रगत' },
  auto_number: { label: 'Auto Number', desc: 'स्वयंचलित क्रमांक', category: 'प्रगत' },
};

const PRESET_OPTIONS: Record<string, { label: string; options: { value: string; label: string }[] }> = {
  gender: {
    label: 'लिंग (पुरुष, स्त्री, इतर)',
    options: [
      { value: 'पुरुष', label: 'पुरुष (Male)' },
      { value: 'स्त्री', label: 'स्त्री (Female)' },
      { value: 'इतर', label: 'इतर (Other)' },
    ]
  },
  yes_no: {
    label: 'होय / नाही (Yes / No)',
    options: [
      { value: 'होय', label: 'होय (Yes)' },
      { value: 'नाही', label: 'नाही (No)' },
    ]
  },
  test_result: {
    label: 'तपासणी निष्कर्ष (Positive / Negative)',
    options: [
      { value: 'Negative', label: 'निगेटिव्ह (Negative / निरोगी)' },
      { value: 'Positive', label: 'पॉझिटिव्ह (Positive / संशयित)' },
    ]
  },
  blood_group: {
    label: 'रक्तगट (Blood Group A, B, O, AB)',
    options: [
      { value: 'A+', label: 'A+' },
      { value: 'A-', label: 'A-' },
      { value: 'B+', label: 'B+' },
      { value: 'B-', label: 'B-' },
      { value: 'AB+', label: 'AB+' },
      { value: 'AB-', label: 'AB-' },
      { value: 'O+', label: 'O+' },
      { value: 'O-', label: 'O-' },
    ]
  },
  general_status: {
    label: 'स्थिती (सामान्य / असामान्य)',
    options: [
      { value: 'सामान्य', label: 'सामान्य (Normal)' },
      { value: 'असामान्य', label: 'असामान्य (Abnormal)' },
      { value: 'गंभीर', label: 'गंभीर (Critical)' },
    ]
  },
  treatment_status: {
    label: 'उपचार स्थिती (सुरू / संदर्भित / पूर्ण)',
    options: [
      { value: 'सुरू', label: 'सुरू (Ongoing)' },
      { value: 'संदर्भित', label: 'संदर्भित (Referred)' },
      { value: 'पूर्ण', label: 'पूर्ण (Completed)' },
    ]
  }
};

export default function TemplateFieldsPage({ 
  onNavigate, 
  templateId 
}: { 
  onNavigate: (page: PageId) => void;
  templateId: string;
}) {
  const { user, role } = useAuth();
  const isPhcController = role === 'phc_controller' || user?.role === 'phc_controller';

  const [template, setTemplate] = useState<RecordRegisterTemplate | null>(null);
  const [fields, setFields] = useState<RecordTemplateField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Field Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingField, setEditingField] = useState<Partial<RecordTemplateField>>({});
  
  // Custom option pairs state for Dropdown / Radio / Checkbox
  const [customOptions, setCustomOptions] = useState<{ value: string; label: string }[]>([]);
  const [autoNumberConfig, setAutoNumberConfig] = useState<{
    prefix: string;
    format: string;
    scope: 'register' | 'employee' | 'village';
    reset: 'never' | 'yearly';
  }>({
    prefix: '',
    format: '0001',
    scope: 'register',
    reset: 'never'
  });

  
  // Conditional logic state
  const [enableCondition, setEnableCondition] = useState(false);
  const [condDependsOn, setCondDependsOn] = useState('');
  const [condOperator, setCondOperator] = useState('equals');
  const [condValue, setCondValue] = useState('');
  const [condAction, setCondAction] = useState('show');

  // Preview Modal
  const [showPreview, setShowPreview] = useState(false);

  const activeTemplateId = templateId || storage.getItem('selectedTemplateId') || '';

  useEffect(() => {
    if (!isPhcController) {
      onNavigate('dashboard');
      return;
    }
    if (!activeTemplateId) {
      onNavigate('template-builder');
      return;
    }
    loadData();
  }, [activeTemplateId, isPhcController]);

  const loadData = async () => {
    setLoading(true);
    try {
      const templates = await templateService.getTemplates();
      const t = templates.find(x => x.id === activeTemplateId);
      if (!t) {
        setErrorMsg('टेम्पलेट सापडले नाही.');
        setLoading(false);
        return;
      }
      setTemplate(t);

      const f = await templateService.getTemplateFields(activeTemplateId);
      setFields(f);
    } catch (err: any) {
      setErrorMsg('डेटा लोड करताना त्रुटी: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openNewFieldModal = () => {
    const nextOrder = fields.length + 1;
    setEditingField({
      field_type: 'text',
      field_order: nextOrder,
      is_required: false,
      is_searchable: false,
      show_in_list: true,
      show_in_report: true,
      show_in_print: true,
      is_active: true,
    });
    setCustomOptions([
      { value: 'पर्याय १', label: 'पर्याय १' },
      { value: 'पर्याय २', label: 'पर्याय २' },
    ]);
    setEnableCondition(false);
    setCondDependsOn('');
    setCondOperator('equals');
    setCondValue('');
    setCondAction('show');
    setAutoNumberConfig({ prefix: '', format: '0001', scope: 'register', reset: 'never' });
    setShowModal(true);
  };

  const openEditModal = (f: RecordTemplateField) => {
    setEditingField(f);

    // Options
    let parsedOpts: { value: string; label: string }[] = [];
    if (f.options_json) {
      if (Array.isArray(f.options_json)) {
        parsedOpts = f.options_json;
      } else if (typeof f.options_json === 'string') {
        try { parsedOpts = JSON.parse(f.options_json); } catch (e) {}
      }
    }
    if (parsedOpts.length === 0) {
      parsedOpts = [{ value: '', label: '' }];
    }
    setCustomOptions(parsedOpts);


    // Auto Number
    if (f.field_type === 'auto_number' && f.automation_json) {
       let parsedAuto = { prefix: '', format: '0001', scope: 'register', reset: 'never' };
       if (typeof f.automation_json === 'string') {
          try { parsedAuto = JSON.parse(f.automation_json); } catch(e){}
       } else {
          parsedAuto = f.automation_json;
       }
       setAutoNumberConfig(parsedAuto as any);
    } else {
       setAutoNumberConfig({ prefix: '', format: '0001', scope: 'register', reset: 'never' });
    }

    // Conditional
    if (f.conditional_json && (f.conditional_json.depends_on || f.conditional_json.field)) {
      setEnableCondition(true);
      setCondDependsOn(f.conditional_json.depends_on || f.conditional_json.field || '');
      setCondOperator(f.conditional_json.operator || 'equals');
      setCondValue(f.conditional_json.value || '');
      setCondAction(f.conditional_json.action || 'show');
    } else {
      setEnableCondition(false);
      setCondDependsOn('');
      setCondOperator('equals');
      setCondValue('');
      setCondAction('show');
    }

    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingField.field_label || !editingField.field_key) {
      setErrorMsg('कृपया फील्ड लेबल आणि फील्ड की प्रविष्ट करा.');
      return;
    }

    const cleanKey = editingField.field_key.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

    // Check key uniqueness
    const keyExists = fields.some(
      f => f.id !== editingField.id && f.field_key.toLowerCase() === cleanKey
    );
    if (keyExists) {
      setErrorMsg(`फील्ड की '${cleanKey}' या टेम्पलेटमध्ये आधीच अस्तित्वात आहे. कृपया वेगळी की वापरा.`);
      return;
    }

    // Process options
    let optionsJson: any = null;
    if (['dropdown', 'radio'].includes(editingField.field_type || '')) {
      const validOptions = customOptions.filter(o => o.value.trim() !== '');
      if (validOptions.length === 0) {
        setErrorMsg('कृपया किमान एक पर्याय जोडा.');
        return;
      }
      optionsJson = validOptions;
    }

    // Process conditional logic
    let conditionalJson: any = null;
    if (enableCondition && condDependsOn) {
      conditionalJson = {
        depends_on: condDependsOn,
        operator: condOperator,
        value: condValue,
        action: condAction,
      };
    }


    let automationJson = editingField.automation_json || null;
    if (editingField.field_type === 'auto_number') {
      automationJson = {
        type: 'auto_number',
        prefix: autoNumberConfig.prefix,
        format: autoNumberConfig.format,
        scope: autoNumberConfig.scope,
        reset: autoNumberConfig.reset
      };
    }

    try {
      const newFieldId = editingField.id || crypto.randomUUID();
      const savedField: RecordTemplateField = {
        id: newFieldId,
        template_id: activeTemplateId,
        field_key: cleanKey,
        field_label: editingField.field_label.trim(),
        field_type: editingField.field_type || 'text',
        field_order: editingField.field_order || fields.length + 1,
        is_required: editingField.is_required ?? false,
        is_searchable: editingField.is_searchable ?? false,
        show_in_list: editingField.show_in_list ?? true,
        show_in_report: editingField.show_in_report ?? true,
        show_in_print: editingField.show_in_print ?? true,
        default_value: editingField.default_value || null,
        placeholder: editingField.placeholder || null,
        help_text: editingField.help_text || null,
        options_json: optionsJson,
        validation_json: editingField.validation_json || null,
        automation_json: automationJson,
        conditional_json: conditionalJson,
        is_active: editingField.is_active ?? true,
      };

      await templateService.saveTemplateField(savedField);
      setShowModal(false);
      setSuccessMsg('फील्ड यशस्वीरित्या जतन केले गेले.');
      setTimeout(() => setSuccessMsg(null), 3000);
      loadData();
    } catch (err: any) {
      setErrorMsg('फील्ड जतन करता आले नाही: ' + err.message);
    }
  };

  const handleDelete = async (fieldId: string) => {
    if (!window.confirm('तुम्हाला हे फील्ड नक्की डिलीट करायचे आहे का?')) return;
    try {
      await templateService.deleteTemplateField(fieldId);
      setSuccessMsg('फील्ड हटवले गेले.');
      setTimeout(() => setSuccessMsg(null), 3000);
      loadData();
    } catch (err: any) {
      setErrorMsg('फील्ड हटवता आले नाही: ' + err.message);
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === fields.length - 1) return;

    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newFields[index];
    newFields[index] = newFields[targetIndex];
    newFields[targetIndex] = temp;

    const orderedIds = newFields.map(f => f.id);
    await templateService.reorderFields(activeTemplateId, orderedIds);
    loadData();
  };

  const applyPreset = (presetKey: string) => {
    const p = PRESET_OPTIONS[presetKey];
    if (p) {
      setCustomOptions([...p.options]);
    }
  };

  const addOptionRow = () => {
    setCustomOptions([...customOptions, { value: '', label: '' }]);
  };

  const updateOptionRow = (index: number, key: 'value' | 'label', text: string) => {
    const updated = [...customOptions];
    updated[index][key] = text;
    if (key === 'label') {
      updated[index].value = text;
    }
    setCustomOptions(updated);
  };

  const removeOptionRow = (index: number) => {
    setCustomOptions(customOptions.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-600">फील्ड्स लोड होत आहेत...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 pb-24 max-w-7xl mx-auto space-y-6">
      {/* Top Navigation & Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <button
              onClick={() => onNavigate('template-builder')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 mb-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> सर्व नोंदवह्यांकडे परत जा
            </button>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                {template?.register_code}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-600">{template?.program_name || 'आरोग्य कार्यक्रम'}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-1">
              {template?.register_name} - फील्ड्स व्यवस्थापन (Field Builder)
            </h1>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setShowPreview(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-4 h-4 text-slate-600" /> फॉर्म प्रीव्ह्यू पहा
            </button>
            <button
              onClick={() => {
                storage.setItem('selectedTemplateId', activeTemplateId);
                onNavigate('dynamic-register');
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-4 h-4 text-emerald-600" /> नोंदवहीत जा
            </button>
            <button
              onClick={openNewFieldModal}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> + नवीन Field जोडा
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="ml-auto text-rose-600 hover:text-rose-900 font-bold">×</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="ml-auto text-emerald-600 hover:text-emerald-900 font-bold">×</button>
        </div>
      )}

      {/* Fields List */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50/75 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Fields / फील्ड्स
            </span>
          </div>
          <span className="text-xs text-slate-500">
            वर-खाली बाण वापरून फॉर्ममधील क्रम बदला
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {fields.map((f, idx) => (
            <div 
              key={f.id} 
              className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                {/* Reordering */}
                <div className="flex flex-col items-center gap-0.5 text-slate-400">
                  <button
                    disabled={idx === 0}
                    onClick={() => handleMoveOrder(idx, 'up')}
                    className="hover:text-indigo-600 disabled:opacity-20 cursor-pointer"
                    title="वर हलवा"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-600">{f.field_order}</span>
                  <button
                    disabled={idx === fields.length - 1}
                    onClick={() => handleMoveOrder(idx, 'down')}
                    className="hover:text-indigo-600 disabled:opacity-20 cursor-pointer"
                    title="खाली हलवा"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Field Details */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{f.field_label}</span>
                    {f.is_required && (
                      <span className="px-1.5 py-0.2 text-[10px] font-bold bg-rose-50 text-rose-700 rounded border border-rose-200">
                        आवश्यक *
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase">
                      {f.field_type}
                    </span>
                    {f.conditional_json?.depends_on && (
                      <span className="px-1.5 py-0.2 text-[10px] font-bold bg-amber-50 text-amber-800 rounded border border-amber-200">
                        अट लागू (Conditional)
                      </span>
                    )}
                    {f.automation_json?.action && (
                      <span className="px-1.5 py-0.2 text-[10px] font-bold bg-purple-50 text-purple-700 rounded border border-purple-200">
                        {f.automation_json.action}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px] text-slate-700 font-semibold">
                      {f.field_key}
                    </span>
                    {f.placeholder && <span>Placeholder: "{f.placeholder}"</span>}
                    {f.show_in_list && <span className="text-emerald-700 font-medium">✓ यादीत</span>}
                    {f.show_in_report && <span className="text-teal-700 font-medium">✓ अहवालात</span>}
                    {f.show_in_print && <span className="text-indigo-700 font-medium">✓ प्रिंटमध्ये</span>}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openEditModal(f)}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                  title="संपादित करा"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(f.id)}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="डिलीट करा"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {fields.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              <p className="font-bold text-slate-800">या नोंदवहीत अद्याप कोणतेही फील्ड नाही.</p>
              <p className="text-xs text-slate-400 mt-1">
                फॉर्म तयार करण्यासाठी वर दिलेल्या 'नवीन Field जोडा' बटनावर क्लिक करा.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Field Editor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-6 border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-lg">
                  {editingField.id ? 'Field संपादित करा' : 'नवीन Field तयार करा (Add Register Field)'}
                </h3>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
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

                {['dropdown', 'radio', 'result'].includes(editingField.field_type || '') && (
                  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                          Options / पर्याय
                        </h4>
                      </div>
                      
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {customOptions.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={opt.label}
                            onChange={e => updateOptionRow(i, 'label', e.target.value)}
                            placeholder={`Option ${i + 1}`}
                            className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
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
                      <Plus className="w-3.5 h-3.5" /> + पर्याय जोडा
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
            </form>
          </div>
        </div>
      )}

      {/* Live Preview Modal */}
      {showPreview && template && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-6 border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    LIVE FIELD PREVIEW
                  </span>
                  <h3 className="font-black text-slate-900 text-lg mt-0.5">
                    {template.register_name} (फॉर्म कसा दिसेल ते पहा)
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setShowPreview(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/50">
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs">
                <DynamicRecordForm
                  fields={fields}
                  onSave={(data) => {
                    alert('प्रीव्ह्यू यशस्वी! डेटा व्हॅलिडेशन पास झाले.\n' + JSON.stringify(data, null, 2));
                  }}
                  onCancel={() => setShowPreview(false)}
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-white flex justify-end shrink-0">
              <button
                onClick={() => setShowPreview(false)}
                className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900"
              >
                प्रीव्ह्यू बंद करा
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
