import { storage } from '../lib/storage';
import { RecordRegisterTemplate, RecordTemplateField, DynamicRecordEntry } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { isDemoMode } from '../lib/env';
import { authService } from './authService';
import { assertValidUUID, isValidUUID } from '../utils/uuid';

export const MALARIA_TEMPLATE_ID = 'b1000000-0000-4000-8000-000000000001';
export const TB_TEMPLATE_ID = 'b2000000-0000-4000-8000-000000000002';

export function normalizeTemplateId(id: string): string {
  if (!id) return id;
  const lower = id.toLowerCase();
  if (
    lower === 'malaria' ||
    lower === MALARIA_TEMPLATE_ID ||
    lower === 'b2000000-0000-4000-8000-000000000001' ||
    lower === 'a1000000-0000-4000-8000-000000000001'
  ) {
    return MALARIA_TEMPLATE_ID;
  }
  if (lower === 'tb' || lower === TB_TEMPLATE_ID) {
    return TB_TEMPLATE_ID;
  }
  return id;
}

const TEMPLATES_KEY = 'arogya_register_templates';
const TEMPLATE_FIELDS_KEY = 'arogya_template_fields';
const DYNAMIC_RECORDS_KEY = 'arogya_dynamic_records';

export const DEFAULT_TEMPLATES: RecordRegisterTemplate[] = [
  {
    id: MALARIA_TEMPLATE_ID,
    register_code: 'MALARIA',
    register_name: 'मलेरिया रक्त नमुना नोंद (Malaria Register)',
    program_name: 'राष्ट्रीय हिवताप नियंत्रण कार्यक्रम (NVBDCP)',
    description: 'मलेरिया संशयित रक्त नमुना नोंदवही व प्रयोगशाळा निकाल',
    icon: 'Droplet',
    register_type: 'रक्त नमुना नोंदवही',
    usage_type: 'नमुना नोंदवही',
    requires_result: true,
    is_active: true,
    display_order: 1,
    created_at: new Date().toISOString()
  },
  {
    id: TB_TEMPLATE_ID,
    register_code: 'TB',
    register_name: 'क्षयरोग संशयित रुग्ण नोंद (TB Register)',
    program_name: 'राष्ट्रीय क्षयरोग निर्मूलन कार्यक्रम (NTEP)',
    description: 'क्षयरोग संशयित रुग्ण थुंकी/एक्स-रे नमुना नोंदवही व निकाल',
    icon: 'Activity',
    register_type: 'थुंकी नमुना नोंदवही',
    usage_type: 'नमुना नोंदवही',
    requires_result: true,
    is_active: true,
    display_order: 2,
    created_at: new Date().toISOString()
  }
];

export const DEFAULT_MALARIA_FIELDS: RecordTemplateField[] = [
  {
    id: 'f1000000-0000-4000-8000-000000000001',
    template_id: MALARIA_TEMPLATE_ID,
    field_key: 'sample_number',
    field_label: 'रक्त नमुना क्रमांक (Blood Sample No.)',
    field_type: 'number',
    field_order: 1,
    is_required: true,
    is_searchable: true,
    show_in_list: true,
    show_in_report: true,
    show_in_print: true,
    is_active: true
  },
  {
    id: 'f1000000-0000-4000-8000-000000000002',
    template_id: MALARIA_TEMPLATE_ID,
    field_key: 'patient_name',
    field_label: 'रुग्णाचे पूर्ण नाव (Patient Name)',
    field_type: 'text',
    field_order: 2,
    is_required: true,
    is_searchable: true,
    show_in_list: true,
    show_in_report: true,
    show_in_print: true,
    is_active: true
  },
  {
    id: 'f1000000-0000-4000-8000-000000000003',
    template_id: MALARIA_TEMPLATE_ID,
    field_key: 'age',
    field_label: 'वय (Age)',
    field_type: 'number',
    field_order: 3,
    is_required: true,
    is_searchable: false,
    show_in_list: true,
    show_in_report: true,
    show_in_print: true,
    is_active: true
  },
  {
    id: 'f1000000-0000-4000-8000-000000000004',
    template_id: MALARIA_TEMPLATE_ID,
    field_key: 'gender',
    field_label: 'लिंग (Gender)',
    field_type: 'dropdown',
    field_order: 4,
    is_required: true,
    is_searchable: false,
    show_in_list: true,
    show_in_report: true,
    show_in_print: true,
    options_json: [
      { label: 'पुरुष (Male)', value: 'पुरुष' },
      { label: 'स्त्री (Female)', value: 'स्त्री' },
      { label: 'इतर (Other)', value: 'इतर' }
    ],
    is_active: true
  },
  {
    id: 'f1000000-0000-4000-8000-000000000005',
    template_id: MALARIA_TEMPLATE_ID,
    field_key: 'malaria_smear_code',
    field_label: 'स्मिअर कोड / पट्टा क्र. (Smear Code)',
    field_type: 'text',
    field_order: 5,
    is_required: true,
    is_searchable: true,
    show_in_list: true,
    show_in_report: true,
    show_in_print: true,
    is_active: true
  },
  {
    id: 'f1000000-0000-4000-8000-000000000006',
    template_id: MALARIA_TEMPLATE_ID,
    field_key: 'sample_collection_date',
    field_label: 'नमुना संकलन दिनांक (Collection Date)',
    field_type: 'date',
    field_order: 6,
    is_required: true,
    is_searchable: false,
    show_in_list: true,
    show_in_report: true,
    show_in_print: true,
    is_active: true
  },
  {
    id: 'f1000000-0000-4000-8000-000000000007',
    template_id: MALARIA_TEMPLATE_ID,
    field_key: 'result_outcome',
    field_label: 'तपासणी निकाल / निष्कर्ष (Result / Outcome)',
    field_type: 'result',
    field_order: 7,
    is_required: false,
    is_searchable: true,
    show_in_list: true,
    show_in_report: true,
    show_in_print: true,
    default_value: 'Pending',
    options_json: [
      { label: 'Pending (प्रलंबित)', value: 'Pending' },
      { label: 'Negative (निगेटिव्ह)', value: 'Negative' },
      { label: 'Positive (Pf) (पॉझिटिव्ह Pf)', value: 'Positive (Pf)' },
      { label: 'Positive (Pv) (पॉझिटिव्ह Pv)', value: 'Positive (Pv)' },
      { label: 'Positive (Mixed) (मिश्र पॉझिटिव्ह)', value: 'Positive (Mixed)' },
      { label: 'Equivocal (अस्पष्ट)', value: 'Equivocal' }
    ],
    is_active: true
  }
];

export const DEFAULT_TB_FIELDS: RecordTemplateField[] = [
  {
    id: 'f2000000-0000-4000-8000-000000000001',
    template_id: TB_TEMPLATE_ID,
    field_key: 'patient_name',
    field_label: 'संशयित रुग्णाचे नाव (Patient Name)',
    field_type: 'text',
    field_order: 1,
    is_required: true,
    is_searchable: true,
    show_in_list: true,
    show_in_report: true,
    show_in_print: true,
    is_active: true
  },
  {
    id: 'f2000000-0000-4000-8000-000000000002',
    template_id: TB_TEMPLATE_ID,
    field_key: 'age',
    field_label: 'वय (Age)',
    field_type: 'number',
    field_order: 2,
    is_required: true,
    is_searchable: false,
    show_in_list: true,
    show_in_report: true,
    show_in_print: true,
    is_active: true
  },
  {
    id: 'f2000000-0000-4000-8000-000000000003',
    template_id: TB_TEMPLATE_ID,
    field_key: 'gender',
    field_label: 'लिंग (Gender)',
    field_type: 'dropdown',
    field_order: 3,
    is_required: true,
    is_searchable: false,
    show_in_list: true,
    show_in_report: true,
    show_in_print: true,
    options_json: [
      { label: 'पुरुष (Male)', value: 'पुरुष' },
      { label: 'स्त्री (Female)', value: 'स्त्री' },
      { label: 'इतर (Other)', value: 'इतर' }
    ],
    is_active: true
  },
  {
    id: 'f2000000-0000-4000-8000-000000000004',
    template_id: TB_TEMPLATE_ID,
    field_key: 'nikshay_id',
    field_label: 'निक्षय आयडी (Nikshay ID)',
    field_type: 'text',
    field_order: 4,
    is_required: false,
    is_searchable: true,
    show_in_list: true,
    show_in_report: true,
    show_in_print: true,
    is_active: true
  },
  {
    id: 'f2000000-0000-4000-8000-000000000005',
    template_id: TB_TEMPLATE_ID,
    field_key: 'sample_type',
    field_label: 'नमुना प्रकार (Sample Type)',
    field_type: 'dropdown',
    field_order: 5,
    is_required: true,
    is_searchable: false,
    show_in_list: true,
    show_in_report: true,
    show_in_print: true,
    options_json: [
      { label: 'Sputum (थुंकी)', value: 'Sputum' },
      { label: 'Xray (क्ष-किरण)', value: 'Xray' },
      { label: 'LPA (एल.पी.ए.)', value: 'LPA' },
      { label: 'Followup Sputum (फॉलोअप थुंकी)', value: 'Followup Sputum' },
      { label: 'FoodBasket (पोषण आहार किट)', value: 'FoodBasket' }
    ],
    is_active: true
  },
  {
    id: 'f2000000-0000-4000-8000-000000000006',
    template_id: TB_TEMPLATE_ID,
    field_key: 'sample_collection_date',
    field_label: 'नमुना संकलन दिनांक (Collection Date)',
    field_type: 'date',
    field_order: 6,
    is_required: true,
    is_searchable: false,
    show_in_list: true,
    show_in_report: true,
    show_in_print: true,
    is_active: true
  },
  {
    id: 'f2000000-0000-4000-8000-000000000007',
    template_id: TB_TEMPLATE_ID,
    field_key: 'result_outcome',
    field_label: 'तपासणी निकाल / निष्कर्ष (Result / Outcome)',
    field_type: 'result',
    field_order: 7,
    is_required: false,
    is_searchable: true,
    show_in_list: true,
    show_in_report: true,
    show_in_print: true,
    default_value: 'Pending',
    options_json: [
      { label: 'Pending (प्रलंबित / Not Tested)', value: 'Pending' },
      { label: 'Negative (निगेटिव्ह)', value: 'Negative' },
      { label: 'Positive (1+) (पॉझिटिव्ह 1+)', value: 'Positive (1+)' },
      { label: 'Positive (2+) (पॉझिटिव्ह 2+)', value: 'Positive (2+)' },
      { label: 'Positive (3+) (पॉझिटिव्ह 3+)', value: 'Positive (3+)' },
      { label: 'Scanty (अल्प जंतू)', value: 'Scanty' }
    ],
    is_active: true
  }
];

class TemplateService {
  async getTemplates(): Promise<RecordRegisterTemplate[]> {
    let list: RecordRegisterTemplate[] = [];
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.from('record_register_templates').select('*').order('display_order');
        if (!error && data && data.length > 0) {
          list = data as RecordRegisterTemplate[];
        }
      } catch (e) {
        console.warn('Supabase templates error, using local:', e);
      }
    }

    if (list.length === 0) {
      const raw = storage.getItem(TEMPLATES_KEY);
      if (raw) {
        try {
          list = JSON.parse(raw) as RecordRegisterTemplate[];
        } catch {}
      }
    }

    // Always guarantee MALARIA and TB templates are present in the list
    const malariaIndex = list.findIndex(
      t => t.id === MALARIA_TEMPLATE_ID || t.register_code === 'MALARIA'
    );
    if (malariaIndex < 0) {
      list.unshift(DEFAULT_TEMPLATES[0]);
    } else {
      // Ensure flags and descriptions are updated
      list[malariaIndex] = {
        ...DEFAULT_TEMPLATES[0],
        ...list[malariaIndex],
        requires_result: true,
        usage_type: 'नमुना नोंदवही',
      };
    }

    const tbIndex = list.findIndex(
      t => t.id === TB_TEMPLATE_ID || t.register_code === 'TB'
    );
    if (tbIndex < 0) {
      list.splice(1, 0, DEFAULT_TEMPLATES[1]);
    } else {
      list[tbIndex] = {
        ...DEFAULT_TEMPLATES[1],
        ...list[tbIndex],
        requires_result: true,
        usage_type: 'नमुना नोंदवही',
      };
    }

    storage.setItem(TEMPLATES_KEY, JSON.stringify(list));
    return list;
  }

  async getActiveTemplates(): Promise<RecordRegisterTemplate[]> {
    const templates = await this.getTemplates();
    return templates.filter(t => t.is_active).sort((a, b) => a.display_order - b.display_order);
  }

  async getTemplateById(id: string): Promise<RecordRegisterTemplate | null> {
    const templates = await this.getTemplates();
    return templates.find(t => t.id === id) || null;
  }

  async saveTemplate(template: RecordRegisterTemplate): Promise<void> {
    const validId = isValidUUID(template.id) ? template.id : crypto.randomUUID();
    const cleanTemplate: RecordRegisterTemplate = {
      ...template,
      id: validId,
      updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured() && supabase) {
      const dbPayload = {
        id: cleanTemplate.id,
        register_code: cleanTemplate.register_code,
        register_name: cleanTemplate.register_name,
        program_name: cleanTemplate.program_name || null,
        description: cleanTemplate.description || null,
        icon: cleanTemplate.icon || 'FileText',
        register_type: cleanTemplate.register_type || null,
        is_active: cleanTemplate.is_active ?? true,
        display_order: cleanTemplate.display_order ?? 0,
        created_by: isValidUUID(cleanTemplate.created_by) ? cleanTemplate.created_by : null,
        updated_at: cleanTemplate.updated_at,
      };

      const { error } = await supabase.from('record_register_templates').upsert(dbPayload);
      if (error) {
        console.error('Supabase save template error:', error);
        if (!isDemoMode()) {
          throw new Error(`नोंदवही टेम्पलेट जतन करता आले नाही: ${error.message}`);
        }
      }
    } else if (!isDemoMode()) {
      throw new Error('Supabase कॉन्फिगर केलेले नाही.');
    }

    const templates = await this.getTemplates();
    const index = templates.findIndex(t => t.id === cleanTemplate.id);
    if (index >= 0) {
      templates[index] = cleanTemplate;
    } else {
      templates.push({ ...cleanTemplate, created_at: new Date().toISOString() });
    }
    storage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  }

  async deleteTemplate(templateId: string): Promise<{ success: boolean; message: string; archived: boolean }> {
    assertValidUUID(templateId, 'टेम्पलेट ID');
    const normId = normalizeTemplateId(templateId);
    if (normId === MALARIA_TEMPLATE_ID || normId === TB_TEMPLATE_ID) {
      return {
        success: false,
        archived: false,
        message: 'मलेरिया आणि क्षयरोग या राष्ट्रीय कार्यक्रमांच्या मूळ शासकीय नोंदवह्या आहेत, त्या डिलीट करता येणार नाहीत.'
      };
    }
    
    // Check if dynamic records exist for this template
    let recordCount = 0;
    if (isSupabaseConfigured() && supabase) {
      try {
        const { count, error } = await supabase
          .from('dynamic_record_entries')
          .select('id', { count: 'exact', head: true })
          .eq('template_id', templateId);
        if (!error && typeof count === 'number') {
          recordCount = count;
        }
      } catch (e) {
        console.warn('Could not check record count in Supabase:', e);
      }
    } else {
      const records = await this.getDynamicRecords(templateId);
      recordCount = records.length;
    }

    // If records exist, DO NOT hard delete to protect clinical data integrity. Soft-archive instead.
    if (recordCount > 0) {
      const existing = await this.getTemplateById(templateId);
      if (existing) {
        await this.saveTemplate({ ...existing, is_active: false });
      }
      return {
        success: true,
        archived: true,
        message: `या नोंदवहीत ${recordCount} नोंदी असल्याने डेटा सुरक्षिततेसाठी हे रजिस्टर हटवण्याऐवजी निष्क्रीय (Archived/Inactive) करण्यात आले आहे.`
      };
    }

    // Hard delete when no records exist
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('record_register_templates').delete().eq('id', templateId);
      if (error) {
        console.error('Supabase delete template error:', error);
        if (!isDemoMode()) {
          throw new Error(`नोंदवही टेम्पलेट हटवता आले नाही: ${error.message}`);
        }
      }
    }

    let raw = storage.getItem(TEMPLATES_KEY);
    let templates = raw ? JSON.parse(raw) as RecordRegisterTemplate[] : [];
    templates = templates.filter(t => t.id !== templateId);
    storage.setItem(TEMPLATES_KEY, JSON.stringify(templates));

    return {
      success: true,
      archived: false,
      message: 'नोंदवही टेम्पलेट यशस्वीरित्या डिलीट केले गेले.'
    };
  }

  async reorderTemplates(orderedIds: string[]): Promise<void> {
    const templates = await this.getTemplates();
    const updated = templates.map(t => {
      const idx = orderedIds.indexOf(t.id);
      return idx >= 0 ? { ...t, display_order: idx + 1 } : t;
    });
    
    if (isSupabaseConfigured() && supabase) {
      for (const t of updated) {
        await supabase.from('record_register_templates').update({ display_order: t.display_order }).eq('id', t.id);
      }
    }
    storage.setItem(TEMPLATES_KEY, JSON.stringify(updated));
  }

  async getTemplateFields(templateId: string): Promise<RecordTemplateField[]> {
    const normId = normalizeTemplateId(templateId);
    let fields: RecordTemplateField[] = [];

    if (isSupabaseConfigured() && supabase && isValidUUID(normId)) {
      try {
        const { data, error } = await supabase.from('record_template_fields').select('*').eq('template_id', normId).order('field_order');
        if (!error && data && data.length > 0) {
          fields = data as RecordTemplateField[];
        }
      } catch (e) {
        console.warn('Supabase fields error, using local:', e);
      }
    }

    if (fields.length === 0) {
      const raw = storage.getItem(TEMPLATE_FIELDS_KEY);
      if (raw) {
        try {
          const allFields = JSON.parse(raw) as RecordTemplateField[];
          fields = allFields.filter(f => normalizeTemplateId(f.template_id) === normId).sort((a, b) => a.field_order - b.field_order);
        } catch {}
      }
    }

    // Default fields seeding for fixed Malaria Register
    if (normId === MALARIA_TEMPLATE_ID) {
      if (fields.length === 0) {
        fields = [...DEFAULT_MALARIA_FIELDS];
        this.saveDefaultFields(fields).catch(() => {});
      } else {
        // Guarantee Result/Outcome field exists
        const hasResult = fields.some(f => f.field_type === 'result' || f.field_key === 'result_outcome' || f.field_key === 'result');
        if (!hasResult) {
          const defaultResultField = DEFAULT_MALARIA_FIELDS.find(f => f.field_type === 'result')!;
          fields.push(defaultResultField);
          this.saveTemplateField(defaultResultField).catch(() => {});
        }
      }
    }

    // Default fields seeding for fixed TB Register
    if (normId === TB_TEMPLATE_ID) {
      if (fields.length === 0) {
        fields = [...DEFAULT_TB_FIELDS];
        this.saveDefaultFields(fields).catch(() => {});
      } else {
        // Guarantee Result/Outcome field exists
        const hasResult = fields.some(f => f.field_type === 'result' || f.field_key === 'result_outcome' || f.field_key === 'result');
        if (!hasResult) {
          const defaultResultField = DEFAULT_TB_FIELDS.find(f => f.field_type === 'result')!;
          fields.push(defaultResultField);
          this.saveTemplateField(defaultResultField).catch(() => {});
        }
      }
    }

    return fields;
  }

  private async saveDefaultFields(fieldsToSeed: RecordTemplateField[]): Promise<void> {
    const raw = storage.getItem(TEMPLATE_FIELDS_KEY);
    let allFields = raw ? (JSON.parse(raw) as RecordTemplateField[]) : [];
    for (const f of fieldsToSeed) {
      const idx = allFields.findIndex(item => item.id === f.id);
      if (idx >= 0) {
        allFields[idx] = f;
      } else {
        allFields.push(f);
      }
    }
    storage.setItem(TEMPLATE_FIELDS_KEY, JSON.stringify(allFields));

    if (isSupabaseConfigured() && supabase) {
      try {
        const payload = fieldsToSeed.map(cleanField => ({
          id: cleanField.id,
          template_id: cleanField.template_id,
          field_key: cleanField.field_key,
          field_label: cleanField.field_label,
          field_type: cleanField.field_type,
          field_order: cleanField.field_order ?? 0,
          is_required: cleanField.is_required ?? false,
          is_searchable: cleanField.is_searchable ?? false,
          show_in_list: cleanField.show_in_list ?? true,
          show_in_report: cleanField.show_in_report ?? true,
          show_in_print: cleanField.show_in_print ?? true,
          default_value: cleanField.default_value || null,
          placeholder: cleanField.placeholder || null,
          help_text: cleanField.help_text || null,
          options_json: cleanField.options_json || [],
          validation_json: cleanField.validation_json || {},
          automation_json: cleanField.automation_json || {},
          conditional_json: cleanField.conditional_json || {},
          is_active: cleanField.is_active ?? true,
          updated_at: new Date().toISOString(),
        }));
        await supabase.from('record_template_fields').upsert(payload);
      } catch (err) {
        console.warn('Seeding default fields to Supabase warning:', err);
      }
    }
  }

  async updateResultOptions(templateId: string, options: { label: string; value: string }[]): Promise<void> {
    const normId = normalizeTemplateId(templateId);
    const fields = await this.getTemplateFields(normId);
    const resField = fields.find(f => f.field_type === 'result' || f.field_key === 'result_outcome' || f.field_key === 'result');
    if (resField) {
      await this.saveTemplateField({
        ...resField,
        options_json: options
      });
    } else {
      const defaultField = normId === MALARIA_TEMPLATE_ID 
        ? DEFAULT_MALARIA_FIELDS.find(f => f.field_type === 'result')!
        : DEFAULT_TB_FIELDS.find(f => f.field_type === 'result')!;
      await this.saveTemplateField({
        ...defaultField,
        template_id: normId,
        options_json: options
      });
    }
  }

  async saveTemplateField(field: RecordTemplateField): Promise<void> {
    const normTemplateId = normalizeTemplateId(field.template_id);
    assertValidUUID(normTemplateId, 'टेम्पलेट ID');
    const validId = isValidUUID(field.id) ? field.id : crypto.randomUUID();
    const cleanField: RecordTemplateField = {
      ...field,
      id: validId,
      template_id: normTemplateId,
      updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured() && supabase) {
      const dbPayload = {
        id: cleanField.id,
        template_id: cleanField.template_id,
        field_key: cleanField.field_key,
        field_label: cleanField.field_label,
        field_type: cleanField.field_type,
        field_order: cleanField.field_order ?? 0,
        is_required: cleanField.is_required ?? false,
        is_searchable: cleanField.is_searchable ?? false,
        show_in_list: cleanField.show_in_list ?? true,
        show_in_report: cleanField.show_in_report ?? true,
        show_in_print: cleanField.show_in_print ?? true,
        default_value: cleanField.default_value || null,
        placeholder: cleanField.placeholder || null,
        help_text: cleanField.help_text || null,
        options_json: cleanField.options_json || [],
        validation_json: cleanField.validation_json || {},
        automation_json: cleanField.automation_json || {},
        conditional_json: cleanField.conditional_json || {},
        is_active: cleanField.is_active ?? true,
        updated_at: cleanField.updated_at,
      };

      const { error } = await supabase.from('record_template_fields').upsert(dbPayload);
      if (error) {
        console.error('Supabase save field error:', error);
        if (!isDemoMode()) {
          throw new Error(`नोंदवही फील्ड जतन करता आले नाही: ${error.message}`);
        }
      }
    } else if (!isDemoMode()) {
      throw new Error('Supabase कॉन्फिगर केलेले नाही.');
    }

    let raw = storage.getItem(TEMPLATE_FIELDS_KEY);
    let fields = raw ? JSON.parse(raw) as RecordTemplateField[] : [];
    const index = fields.findIndex(f => f.id === cleanField.id);
    if (index >= 0) {
      fields[index] = cleanField;
    } else {
      fields.push({ ...cleanField, created_at: new Date().toISOString() });
    }
    storage.setItem(TEMPLATE_FIELDS_KEY, JSON.stringify(fields));
  }
  
  async deleteTemplateField(fieldId: string): Promise<void> {
    assertValidUUID(fieldId, 'फील्ड ID');
    
    // Check if protected field of fixed registers
    const raw = storage.getItem(TEMPLATE_FIELDS_KEY);
    if (raw) {
      try {
        const fields = JSON.parse(raw) as RecordTemplateField[];
        const target = fields.find(f => f.id === fieldId);
        if (target) {
          const normTemplateId = normalizeTemplateId(target.template_id);
          if (normTemplateId === MALARIA_TEMPLATE_ID || normTemplateId === TB_TEMPLATE_ID) {
            if (target.field_type === 'result' || target.field_key === 'result_outcome' || target.is_required) {
              throw new Error('हे फील्ड राष्ट्रीय नोंदवहीचा अनिवार्य भाग आहे, ते हटवता येणार नाही. आपण त्याचे पर्याय (Options) संपादित करू शकता.');
            }
          }
        }
      } catch (err: any) {
        if (err.message && err.message.includes('अनिवार्य')) throw err;
      }
    }

    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('record_template_fields').delete().eq('id', fieldId);
      if (error) {
        console.error('Supabase delete field error:', error);
        if (!isDemoMode()) {
          throw new Error(`नोंदवही फील्ड हटवता आले नाही: ${error.message}`);
        }
      }
    } else if (!isDemoMode()) {
      throw new Error('Supabase कॉन्फिगर केलेले नाही.');
    }

    let rawFields = storage.getItem(TEMPLATE_FIELDS_KEY);
    let fields = rawFields ? JSON.parse(rawFields) as RecordTemplateField[] : [];
    fields = fields.filter(f => f.id !== fieldId);
    storage.setItem(TEMPLATE_FIELDS_KEY, JSON.stringify(fields));
  }

  async getDynamicRecords(templateId: string): Promise<DynamicRecordEntry[]> {
    if (isSupabaseConfigured() && supabase && isValidUUID(templateId)) {
      try {
        const { data, error } = await supabase.from('dynamic_record_entries').select('*').eq('template_id', templateId).order('created_at', { ascending: false });
        if (!error && data) return data as DynamicRecordEntry[];
      } catch (e) { console.warn('Supabase records error, using local'); }
    }
    const raw = storage.getItem(DYNAMIC_RECORDS_KEY);
    if (!raw) return [];
    const records = JSON.parse(raw) as DynamicRecordEntry[];
    return records.filter(r => r.template_id === templateId).sort((a, b) => {
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
  }

  async saveDynamicRecord(record: DynamicRecordEntry): Promise<void> {
    assertValidUUID(record.template_id, 'टेम्पलेट ID');
    assertValidUUID(record.employee_id, 'कर्मचारी ID');
    assertValidUUID(record.phc_id, 'प्रा.आ.के. ID');
    assertValidUUID(record.subcentre_id, 'उपकेंद्र ID');
    if (record.village_id) assertValidUUID(record.village_id, 'गाव ID');


    // Edit deadline enforcement
    if (isValidUUID(record.id)) {
      let existingCreatedAt = null;
      if (isSupabaseConfigured() && supabase) {
         const { data } = await supabase.from('dynamic_record_entries').select('created_at').eq('id', record.id).single();
         if (data) existingCreatedAt = data.created_at;
      } else {
         let raw = storage.getItem(DYNAMIC_RECORDS_KEY);
         if (raw) {
            let records = JSON.parse(raw);
            const existing = records.find(r => r.id === record.id);
            if (existing) existingCreatedAt = existing.created_at || null;
         }
      }
      
      if (existingCreatedAt) {
        const createdTime = new Date(existingCreatedAt).getTime();
        const diffDays = (Date.now() - createdTime) / (1000 * 60 * 60 * 24);
        const user = authService.getCurrentUser();
        const isPhcController = user?.role === 'phc_controller';
        const limitDays = isPhcController ? 30 : 7;
        
        if (diffDays > limitDays) {
           throw new Error('वेळमर्यादा संपली आहे (Time Limit Exceeded). ही जुनी नोंद आता Read Only आहे.');
        }
      }
    }


    const isNewRecord = !isValidUUID(record.id);
    const validId = isValidUUID(record.id) ? record.id : crypto.randomUUID();
    const cleanRecord: DynamicRecordEntry = {
      ...record,
      id: validId,
      updated_at: new Date().toISOString()
    };
    
    if (isNewRecord) {
      // Find auto_number fields for this template
      const templateFields = await this.getTemplateFields(cleanRecord.template_id);
      const autoNumFields = templateFields.filter(f => f.field_type === 'auto_number');
      
      if (autoNumFields.length > 0) {
        // Fetch existing records for this template to calculate next number
        const allRecords = await this.getDynamicRecords(cleanRecord.template_id);
        const recordDate = cleanRecord.record_date || new Date().toISOString().split('T')[0];
        const recordYear = new Date(recordDate).getFullYear();
        
        for (const f of autoNumFields) {
          if (!cleanRecord.record_data) cleanRecord.record_data = {};
          
          let parsedConfig = { prefix: '', format: '0001', scope: 'register', reset: 'never' };
          if (typeof f.automation_json === 'string') {
            try { parsedConfig = JSON.parse(f.automation_json); } catch(e){}
          } else if (f.automation_json) {
            parsedConfig = f.automation_json as any;
          }
          
          let scopeRecords = allRecords;
          // Apply scope filter
          if (parsedConfig.scope === 'employee') {
             scopeRecords = scopeRecords.filter(r => r.employee_id === cleanRecord.employee_id);
          } else if (parsedConfig.scope === 'village') {
             scopeRecords = scopeRecords.filter(r => r.village_id === cleanRecord.village_id);
          }
          
          // Apply reset filter
          if (parsedConfig.reset === 'yearly') {
             scopeRecords = scopeRecords.filter(r => {
                const rDate = r.record_date || r.created_at;
                return rDate ? new Date(rDate).getFullYear() === recordYear : false;
             });
          }
          
          // Determine next number
          let maxNum = 0;
          scopeRecords.forEach(r => {
             const val = r.record_data ? r.record_data[f.field_key] : null;
             if (val && typeof val === 'string') {
                // Extract just the number part
                let numStr = val;
                if (parsedConfig.prefix) {
                   if (val.startsWith(parsedConfig.prefix)) {
                      numStr = val.substring(parsedConfig.prefix.length);
                   }
                }
                const num = parseInt(numStr.replace(/\D/g, ''), 10);
                if (!isNaN(num) && num > maxNum) {
                   maxNum = num;
                }
             }
          });
          
          const nextNum = maxNum + 1;
          const formatLength = parsedConfig.format ? parsedConfig.format.length : 4;
          const paddedNum = String(nextNum).padStart(formatLength, '0');
          const finalValue = `${parsedConfig.prefix || ''}${paddedNum}`;
          
          cleanRecord.record_data[f.field_key] = finalValue;
        }
      }
    }


    if (isSupabaseConfigured() && supabase) {
      const dbPayload = {
        id: cleanRecord.id,
        template_id: cleanRecord.template_id,
        employee_id: cleanRecord.employee_id,
        phc_id: cleanRecord.phc_id,
        subcentre_id: cleanRecord.subcentre_id,
        village_id: cleanRecord.village_id || null,
        record_data: cleanRecord.record_data || {},
        record_date: cleanRecord.record_date || new Date().toISOString().split('T')[0],
        is_printed: cleanRecord.is_printed ?? false,
        printed_at: cleanRecord.printed_at || null,
        printed_by: isValidUUID(cleanRecord.printed_by) ? cleanRecord.printed_by : null,
        print_count: cleanRecord.print_count ?? 0,
        created_by: isValidUUID(cleanRecord.created_by) ? cleanRecord.created_by : null,
        updated_by: isValidUUID(cleanRecord.updated_by) ? cleanRecord.updated_by : null,
        updated_at: cleanRecord.updated_at,
      };

      const { error } = await supabase.from('dynamic_record_entries').upsert(dbPayload);
      if (error) {
        console.error('Supabase save record error:', error);
        throw new Error(`डायनॅमिक नोंद जतन करता आली नाही: ${error.message}`);
      }
    } else if (!isDemoMode()) {
      throw new Error('Supabase कॉन्फिगर केलेले नाही.');
    }

    let raw = storage.getItem(DYNAMIC_RECORDS_KEY);
    let records = raw ? JSON.parse(raw) as DynamicRecordEntry[] : [];
    const index = records.findIndex(r => r.id === cleanRecord.id);
    if (index >= 0) {
      records[index] = { ...cleanRecord, created_at: records[index].created_at || cleanRecord.created_at };
    } else {
      records.push({ ...cleanRecord, created_at: new Date().toISOString() });
    }
    storage.setItem(DYNAMIC_RECORDS_KEY, JSON.stringify(records));
  }

  async deleteDynamicRecord(recordId: string): Promise<void> {
    assertValidUUID(recordId, 'नोंद ID');
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('dynamic_record_entries').delete().eq('id', recordId);
      if (error) {
        console.error('Supabase delete record error:', error);
        if (!isDemoMode()) {
          throw new Error(`डायनॅमिक नोंद हटवता आली नाही: ${error.message}`);
        }
      }
    } else if (!isDemoMode()) {
      throw new Error('Supabase कॉन्फिगर केलेले नाही.');
    }

    let raw = storage.getItem(DYNAMIC_RECORDS_KEY);
    let records = raw ? JSON.parse(raw) as DynamicRecordEntry[] : [];
    records = records.filter(r => r.id !== recordId);
    storage.setItem(DYNAMIC_RECORDS_KEY, JSON.stringify(records));
  }

  async reorderFields(templateId: string, orderedFieldIds: string[]): Promise<void> {
    assertValidUUID(templateId, 'टेम्पलेट ID');
    const fields = await this.getTemplateFields(templateId);
    const updated = fields.map(f => {
      const idx = orderedFieldIds.indexOf(f.id);
      return idx >= 0 ? { ...f, field_order: idx + 1 } : f;
    });

    if (isSupabaseConfigured() && supabase) {
      for (const f of updated) {
        await supabase.from('record_template_fields').update({ field_order: f.field_order }).eq('id', f.id);
      }
    }

    let raw = storage.getItem(TEMPLATE_FIELDS_KEY);
    let allFields = raw ? JSON.parse(raw) as RecordTemplateField[] : [];
    allFields = allFields.map(f => {
      if (f.template_id === templateId) {
        const found = updated.find(u => u.id === f.id);
        return found || f;
      }
      return f;
    });
    storage.setItem(TEMPLATE_FIELDS_KEY, JSON.stringify(allFields));
  }

  async getRecordStats(templateId: string): Promise<{ total: number; today: number; printed: number }> {
    const records = await this.getDynamicRecords(templateId);
    const todayStr = new Date().toISOString().split('T')[0];
    const today = records.filter(r => r.record_date === todayStr).length;
    const printed = records.filter(r => r.is_printed).length;
    return {
      total: records.length,
      today,
      printed
    };
  }
}

export const templateService = new TemplateService();
