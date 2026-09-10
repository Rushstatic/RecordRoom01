import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { templateService } from '../../services/templateService';
import { currentUserService } from '../../services/currentUserService';
import { malariaService } from '../../services/malariaService';
import { tbService } from '../../services/tbService';
import { RecordRegisterTemplate, RecordTemplateField, PageId } from '../../types';
import { storage } from '../../lib/storage';
import { 
  Printer, 
  RefreshCw, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileSpreadsheet,
  X
} from 'lucide-react';

interface SubcentreEmployeeReportsViewProps {
  onNavigate?: (page: PageId) => void;
  initialRegisterId?: string;
}

export const formatIndianDate = (dateStr?: string | null): string => {
  if (!dateStr) return '-';
  const clean = dateStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return dateStr;
};

// Normalize template ID to handle Malaria and TB UUIDs vs built-in aliases
const normalizeRegisterId = (id?: string | null, templates?: RecordRegisterTemplate[]): string => {
  if (!id) return 'malaria';
  if (id === 'malaria' || id === 'a1000000-0000-4000-8000-000000000001') return 'malaria';
  if (id === 'tb' || id === 'b2000000-0000-4000-8000-000000000002') return 'tb';
  
  if (templates && templates.length > 0) {
    const matched = templates.find(t => t.id === id);
    if (matched?.register_code === 'MALARIA') return 'malaria';
    if (matched?.register_code === 'TB') return 'tb';
  }
  return id;
};

export const SubcentreEmployeeReportsView: React.FC<SubcentreEmployeeReportsViewProps> = ({ 
  onNavigate,
  initialRegisterId
}) => {
  const { user, userContext } = useAuth();

  // Dynamic templates list from builder
  const [dynamicTemplates, setDynamicTemplates] = useState<RecordRegisterTemplate[]>([]);
  const [templateFields, setTemplateFields] = useState<RecordTemplateField[]>([]);

  // Register selection: 'malaria' | 'tb' | template_id
  const [selectedRegister, setSelectedRegister] = useState<string>(() => {
    return normalizeRegisterId(initialRegisterId || storage.getItem('selectedTemplateId') || 'malaria');
  });

  // Date filters: 'today' | 'this_month' | 'this_year' | 'custom' | 'all'
  // Default to 'all' so existing records are never hidden with a 0 count on initial view
  const [datePreset, setDatePreset] = useState<'today' | 'this_month' | 'this_year' | 'custom' | 'all'>(() => {
    const saved = storage.getItem('employee_report_filter_date');
    if (saved === 'today' || saved === 'this_month' || saved === 'this_year' || saved === 'custom' || saved === 'all') {
      storage.removeItem('employee_report_filter_date');
      return saved as any;
    }
    return 'all';
  });

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [customFrom, setCustomFrom] = useState<string>(todayStr);
  const [customTo, setCustomTo] = useState<string>(todayStr);

  // Status filter: 'all' | 'pending' | 'sent' | 'result_pending'
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'sent' | 'result_pending'>('all');

  // Search filter across configured fields
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Loaded raw records from Supabase / data source
  const [rawRecords, setRawRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Authoritative employee info
  const [authoritativeEmployeeId, setAuthoritativeEmployeeId] = useState<string>(
    userContext?.employeeId || user?.employeeId || ''
  );

  const employeeName = userContext?.employeeName || user?.marathiName || user?.name || 'आरोग्य कर्मचारी';
  const phcName = userContext?.phcName || user?.assignedPhc || 'प्रा.आ.के. भादा';
  const subcentreName = userContext?.subcentreName || user?.assignedSubcentre || 'उपकेंद्र';

  // 1. Initial resolution of Employee ID & Active Templates
  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const [tpls, ctx] = await Promise.all([
          templateService.getActiveTemplates().catch(() => []),
          currentUserService.getCurrentUserContext().catch(() => null),
        ]);

        if (isMounted) {
          const activeOnly = tpls.filter(t => t.is_active !== false);
          // Keep custom dynamic templates (excluding built-in MALARIA or TB if registered with code)
          const customOnly = activeOnly.filter(t => t.register_code !== 'MALARIA' && t.register_code !== 'TB');
          setDynamicTemplates(customOnly);

          if (ctx?.employeeId) {
            setAuthoritativeEmployeeId(ctx.employeeId);
          }
        }
      } catch (e) {
        console.error('Init employee reports failed:', e);
      }
    }

    init();
    return () => {
      isMounted = false;
    };
  }, []);

  // If initialRegisterId changes externally, update selectedRegister
  useEffect(() => {
    if (initialRegisterId) {
      setSelectedRegister(normalizeRegisterId(initialRegisterId, dynamicTemplates));
    }
  }, [initialRegisterId, dynamicTemplates]);

  // Keep selectedRegister stored in local storage for session state
  useEffect(() => {
    if (selectedRegister) {
      storage.setItem('selectedTemplateId', selectedRegister);
    }
  }, [selectedRegister]);

  // 2. Active registers matching Data Entry:
  // Data Entry shows: Malaria Blood Smear, TB Sputum, and every active dynamic register
  const availableRegisters = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      icon: string;
      isDynamic: boolean;
      template?: RecordRegisterTemplate;
    }> = [
      {
        id: 'malaria',
        name: 'मलेरिया रक्त नमुना नोंद (Malaria Blood Smear)',
        icon: '🦟',
        isDynamic: false,
      },
      {
        id: 'tb',
        name: 'क्षयरोग संशयित रुग्ण नोंद (TB Sputum)',
        icon: '🫁',
        isDynamic: false,
      },
    ];

    for (const t of dynamicTemplates) {
      list.push({
        id: t.id,
        name: t.register_name,
        icon: '📋',
        isDynamic: true,
        template: t,
      });
    }

    return list;
  }, [dynamicTemplates]);

  // Current register object
  const currentRegisterObj = useMemo(() => {
    return availableRegisters.find(r => r.id === selectedRegister) || availableRegisters[0];
  }, [availableRegisters, selectedRegister]);

  // 3. Load fields for selected dynamic template
  useEffect(() => {
    let isMounted = true;
    if (selectedRegister !== 'malaria' && selectedRegister !== 'tb') {
      templateService.getTemplateFields(selectedRegister).then((fields) => {
        if (isMounted) {
          setTemplateFields(fields);
        }
      }).catch((e) => {
        console.error('Failed to load fields for template:', e);
        if (isMounted) {
          setTemplateFields([]);
        }
      });
    } else {
      setTemplateFields([]);
    }
    return () => {
      isMounted = false;
    };
  }, [selectedRegister]);

  // 4. Fields configured in the Builder: show_in_list or show_in_report
  const activeFields = useMemo(() => {
    return templateFields
      .filter(f => f.is_active !== false && f.field_type !== 'hidden')
      .sort((a, b) => (a.field_order ?? 0) - (b.field_order ?? 0));
  }, [templateFields]);

  // Identify if a Result/Outcome field was configured by Admin
  const resultField = useMemo(() => {
    return activeFields.find(
      f =>
        f.field_type === 'result' ||
        f.field_key.toLowerCase().includes('result') ||
        f.field_key.toLowerCase().includes('outcome') ||
        f.field_label.includes('निकाल') ||
        f.field_label.includes('निष्कर्ष')
    );
  }, [activeFields]);

  // Report fields configured in Builder (show_in_report or show_in_list)
  // Excludes resultField so it can be rendered exclusively in the dedicated Result column
  const reportFields = useMemo(() => {
    const configured = activeFields.filter(f => f.show_in_report || f.show_in_list);
    const candidateList = configured.length > 0 ? configured : activeFields;
    if (resultField) {
      return candidateList.filter(f => f.id !== resultField.id);
    }
    return candidateList;
  }, [activeFields, resultField]);

  // Has result capability (Malaria and TB inherently have results, dynamic registers only if configured)
  const hasResultCapability = useMemo(() => {
    if (selectedRegister === 'malaria' || selectedRegister === 'tb') return true;
    return !!resultField;
  }, [selectedRegister, resultField]);

  // Compute date range label
  const dateRange = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (datePreset === 'today') {
      return {
        from: todayStr,
        to: todayStr,
        label: `आज (${formatIndianDate(todayStr)})`,
      };
    } else if (datePreset === 'this_month') {
      const from = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(currentYear, currentMonth, 0).getDate();
      const to = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      return {
        from,
        to,
        label: `चालू महिना (${currentMonth}/${currentYear})`,
      };
    } else if (datePreset === 'this_year') {
      return {
        from: `${currentYear}-01-01`,
        to: `${currentYear}-12-31`,
        label: `चालू वर्ष (${currentYear})`,
      };
    } else if (datePreset === 'custom') {
      return {
        from: customFrom,
        to: customTo,
        label: `कालावधी: ${formatIndianDate(customFrom)} ते ${formatIndianDate(customTo)}`,
      };
    } else {
      return {
        from: '',
        to: '',
        label: 'सर्व नोंदी (All Records)',
      };
    }
  }, [datePreset, todayStr, customFrom, customTo]);

  // Helper to extract record date across record types
  const getRecordDate = (r: any): string => {
    if (r.record_date) return r.record_date.split('T')[0];
    if (r.sample_collection_date) return r.sample_collection_date.split('T')[0];
    if (r.collection_date) return r.collection_date.split('T')[0];
    if (r.created_at) return r.created_at.split('T')[0];
    if (r.record_data) {
      for (const key of Object.keys(r.record_data)) {
        if (key.includes('date') || key.includes('dinank') || key.includes('tarikh')) {
          const val = r.record_data[key];
          if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
            return val.split('T')[0];
          }
        }
      }
    }
    return '';
  };

  // 5. Load records from the same Supabase table/source used by Data Entry
  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Resolve employee id dynamically
    let empId = userContext?.employeeId || user?.employeeId || authoritativeEmployeeId;
    let authId = user?.id || userContext?.profileId || userContext?.authUserId;

    if (!empId) {
      try {
        const ctx = await currentUserService.getCurrentUserContext();
        if (ctx?.employeeId) {
          empId = ctx.employeeId;
          setAuthoritativeEmployeeId(ctx.employeeId);
        }
        if (!authId && ctx?.profileId) {
          authId = ctx.profileId;
        }
      } catch (e) {
        console.warn('Context resolution error:', e);
      }
    }

    // Scoping predicate for logged-in employee
    const isRecordInScope = (r: any) => {
      // If unauthenticated or no identifiers available, do not filter out everything
      if (!empId && !authId && !user?.id) return true;

      // Match employee_id
      if (empId && r.employee_id === empId) return true;

      // Match created_by or auth id
      if (authId && (r.created_by === authId || r.employee_id === authId)) return true;
      if (user?.id && (r.created_by === user.id || r.employee_id === user.id)) return true;
      if (userContext?.profileId && (r.created_by === userContext.profileId || r.employee_id === userContext.profileId)) return true;
      if (userContext?.authUserId && (r.created_by === userContext.authUserId || r.employee_id === userContext.authUserId)) return true;

      // Match record_data employee_id if present
      if (empId && r.record_data?.employee_id === empId) return true;

      return false;
    };

    try {
      if (selectedRegister === 'malaria') {
        // Load Malaria Blood Smears from Supabase malaria_blood_samples
        if (isSupabaseConfigured() && supabase) {
          const { data, error: sbError } = await supabase
            .from('malaria_blood_samples')
            .select('*')
            .order('sample_collection_date', { ascending: false });

          if (sbError) {
            console.error('Supabase malaria samples error:', sbError);
            throw new Error(`मलेरिया नोंदी लोड करताना त्रुटी: ${sbError.message}`);
          }

          const scoped = (data || []).filter(isRecordInScope);
          setRawRecords(
            scoped.map((s: any) => ({
              ...s,
              record_date: s.sample_collection_date,
              status_code: s.sent_date ? 'sent' : 'pending',
              status_label: s.sent_date ? 'पाठविले' : 'प्रलंबित',
              is_result_pending: !s.result || s.result === 'Pending' || s.result === 'प्रलंबित',
              display_result: s.result || 'निकाल प्रलंबित',
            }))
          );
        } else {
          // Local fallback for offline/demo
          const all = await malariaService.getSamples();
          const scoped = all.filter(isRecordInScope);
          setRawRecords(
            scoped.map((s: any) => ({
              ...s,
              record_date: s.sample_collection_date,
              status_code: s.sent_date ? 'sent' : 'pending',
              status_label: s.sent_date ? 'पाठविले' : 'प्रलंबित',
              is_result_pending: !s.result || s.result === 'Pending' || s.result === 'प्रलंबित',
              display_result: s.result || 'निकाल प्रलंबित',
            }))
          );
        }
      } else if (selectedRegister === 'tb') {
        // Load TB Sputum samples from Supabase tb_suspected_samples
        if (isSupabaseConfigured() && supabase) {
          const { data, error: sbError } = await supabase
            .from('tb_suspected_samples')
            .select('*')
            .order('sample_collection_date', { ascending: false });

          if (sbError) {
            console.error('Supabase TB samples error:', sbError);
            throw new Error(`क्षयरोग (TB) नोंदी लोड करताना त्रुटी: ${sbError.message}`);
          }

          const scoped = (data || []).filter(isRecordInScope);
          setRawRecords(
            scoped.map((s: any) => ({
              ...s,
              record_date: s.sample_collection_date || s.created_at?.split('T')[0],
              status_code: s.sample_sent_date ? 'sent' : 'pending',
              status_label: s.sample_sent_date ? 'पाठविले' : 'प्रलंबित',
              is_result_pending: !s.result || s.result === 'Awaiting' || s.result === 'प्रलंबित',
              display_result: s.result || 'निकाल प्रलंबित',
            }))
          );
        } else {
          const all = await tbService.getSamples();
          const scoped = all.filter(isRecordInScope);
          setRawRecords(
            scoped.map((s: any) => ({
              ...s,
              record_date: s.sample_collection_date || s.created_at?.split('T')[0],
              status_code: s.sample_sent_date ? 'sent' : 'pending',
              status_label: s.sample_sent_date ? 'पाठविले' : 'प्रलंबित',
              is_result_pending: !s.result || s.result === 'Awaiting' || s.result === 'प्रलंबित',
              display_result: s.result || 'निकाल प्रलंबित',
            }))
          );
        }
      } else {
        // DYNAMIC REGISTER: Load from Supabase dynamic_record_entries table
        if (isSupabaseConfigured() && supabase) {
          const { data, error: sbError } = await supabase
            .from('dynamic_record_entries')
            .select('*')
            .eq('template_id', selectedRegister)
            .order('created_at', { ascending: false });

          if (sbError) {
            console.error('Supabase dynamic records error:', sbError);
            throw new Error(`डायनॅमिक नोंदवही लोड करताना त्रुटी: ${sbError.message}`);
          }

          let combined = (data || []).filter(isRecordInScope);

          // Also check if any local dynamic records exist that haven't synced
          const rawLocal = storage.getItem('arogya_dynamic_records');
          if (rawLocal) {
            try {
              const localList = JSON.parse(rawLocal) as any[];
              const unsynced = localList.filter(
                r => r.template_id === selectedRegister && isRecordInScope(r) && !combined.some(c => c.id === r.id)
              );
              if (unsynced.length > 0) {
                combined = [...combined, ...unsynced];
              }
            } catch (err) {
              console.warn('Error reading local dynamic records:', err);
            }
          }

          setRawRecords(combined);
        } else {
          // Fallback to templateService
          const all = await templateService.getDynamicRecords(selectedRegister);
          const scoped = all.filter(isRecordInScope);
          setRawRecords(scoped);
        }
      }
    } catch (err: any) {
      console.error('Load records error:', err);
      setError(`डेटा लोड अयशस्वी झाला: ${err.message || 'सर्व्हरशी संपर्क होऊ शकला नाही'}`);
      setRawRecords([]);
    } finally {
      setLoading(false);
    }
  }, [authoritativeEmployeeId, user, userContext, selectedRegister]);

  // Reload records when selectedRegister changes
  useEffect(() => {
    loadRecords();

    const handleSync = () => loadRecords();
    window.addEventListener('arogya-sample-saved', handleSync);
    window.addEventListener('arogya-sync-status-changed', handleSync);
    return () => {
      window.removeEventListener('arogya-sample-saved', handleSync);
      window.removeEventListener('arogya-sync-status-changed', handleSync);
    };
  }, [loadRecords]);

  // 6. Filtered records with search and date filters using configured fields
  const filteredRecords = useMemo(() => {
    let list = [...rawRecords];

    // Date Filter
    if (datePreset === 'today') {
      list = list.filter((r) => {
        const d = getRecordDate(r);
        return d === todayStr;
      });
    } else if (datePreset === 'this_month') {
      const ym = todayStr.substring(0, 7);
      list = list.filter((r) => {
        const d = getRecordDate(r);
        return d && d.startsWith(ym);
      });
    } else if (datePreset === 'this_year') {
      const y = todayStr.substring(0, 4);
      list = list.filter((r) => {
        const d = getRecordDate(r);
        return d && d.startsWith(y);
      });
    } else if (datePreset === 'custom') {
      list = list.filter((r) => {
        const d = getRecordDate(r);
        if (!d) return false;
        if (customFrom && d < customFrom) return false;
        if (customTo && d > customTo) return false;
        return true;
      });
    }
    // 'all' keeps all records

    // Status Filter (applicable to registers with status or result)
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        list = list.filter((r) => {
          if (r.status_code) return r.status_code === 'pending';
          const isSent = r.is_printed || r.record_data?.status === 'sent' || r.record_data?.status === 'पूर्ण';
          return !isSent;
        });
      } else if (statusFilter === 'sent') {
        list = list.filter((r) => {
          if (r.status_code) return r.status_code === 'sent';
          const isSent = r.is_printed || r.record_data?.status === 'sent' || r.record_data?.status === 'पूर्ण';
          return isSent;
        });
      } else if (statusFilter === 'result_pending') {
        list = list.filter((r) => {
          if (r.is_result_pending !== undefined) return r.is_result_pending;
          if (resultField) {
            const resVal = r.record_data?.[resultField.field_key];
            return !resVal || resVal === 'Pending' || resVal === 'प्रलंबित' || resVal === 'Awaiting';
          }
          return false;
        });
      }
    }

    // Search filter across configured fields and common patient/sample fields
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter((r) => {
        if (r.patient_name && String(r.patient_name).toLowerCase().includes(q)) return true;
        if (r.sample_number && String(r.sample_number).toLowerCase().includes(q)) return true;
        if (r.village_name && String(r.village_name).toLowerCase().includes(q)) return true;
        if (r.malaria_smear_code && String(r.malaria_smear_code).toLowerCase().includes(q)) return true;
        if (r.nikshay_id && String(r.nikshay_id).toLowerCase().includes(q)) return true;
        if (r.mobile_number && String(r.mobile_number).toLowerCase().includes(q)) return true;

        if (r.record_data) {
          for (const f of activeFields) {
            const val = r.record_data[f.field_key];
            if (val !== null && val !== undefined && String(val).toLowerCase().includes(q)) {
              return true;
            }
          }
          const dataStr = JSON.stringify(r.record_data).toLowerCase();
          if (dataStr.includes(q)) return true;
        }
        return false;
      });
    }

    return list;
  }, [rawRecords, datePreset, todayStr, customFrom, customTo, statusFilter, searchTerm, activeFields, resultField]);

  // Total count exactly matches records displayed on screen
  const totalCount = filteredRecords.length;

  const registerDisplayName = currentRegisterObj ? currentRegisterObj.name : 'नोंदवही अहवाल';

  // Status Display Name
  const statusDisplayName = useMemo(() => {
    if (statusFilter === 'all') return 'सर्व नोंदी (All)';
    if (statusFilter === 'pending') return 'प्रलंबित (Pending)';
    if (statusFilter === 'sent') return 'पाठविले / पूर्ण (Sent)';
    if (statusFilter === 'result_pending') return 'निकाल प्रलंबित (Result Pending)';
    return 'सर्व';
  }, [statusFilter]);

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. TOP HEADER (Screen only) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              उपकेंद्र कर्मचारी अहवाल
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-bold text-slate-600">
              {subcentreName} | {phcName}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {registerDisplayName}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            कर्मचारी: <strong className="text-slate-800">{employeeName}</strong> • अहवाल फिल्टर करा व A4 फॉरमॅटमध्ये प्रिंट करा.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => loadRecords()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer"
            title="नोंदी रिफ्रेश करा"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            <span>रिफ्रेश</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>A4 प्रिंट करा</span>
          </button>
        </div>
      </div>

      {/* 2. FILTER CONTROLS CARD (Screen only) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 print:hidden">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-700" />
            <h2 className="text-sm font-bold text-slate-800">अहवाल फिल्टर्स (Report Filters)</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            फिल्टर बदलल्यावर नोंदी तात्काळ बदलतात
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* FILTER 1: REGISTER SELECTION */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              १. नोंदवही निवडा (Select Register)
            </label>
            <select
              value={selectedRegister}
              onChange={(e) => setSelectedRegister(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none cursor-pointer"
            >
              {availableRegisters.map((reg) => (
                <option key={reg.id} value={reg.id}>
                  {reg.icon} {reg.name}
                </option>
              ))}
            </select>
          </div>

          {/* FILTER 2: DATE PERIOD */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              २. कालावधी निवडा (Date Period)
            </label>
            <div className="grid grid-cols-5 gap-1">
              <button
                type="button"
                onClick={() => setDatePreset('today')}
                className={`py-2 text-[11px] font-bold rounded-xl transition-all cursor-pointer text-center ${
                  datePreset === 'today'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                आज
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('this_month')}
                className={`py-2 text-[11px] font-bold rounded-xl transition-all cursor-pointer text-center ${
                  datePreset === 'this_month'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                महिना
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('this_year')}
                className={`py-2 text-[11px] font-bold rounded-xl transition-all cursor-pointer text-center ${
                  datePreset === 'this_year'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                वर्ष
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('custom')}
                className={`py-2 text-[11px] font-bold rounded-xl transition-all cursor-pointer text-center ${
                  datePreset === 'custom'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                कस्टम
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('all')}
                className={`py-2 text-[11px] font-bold rounded-xl transition-all cursor-pointer text-center ${
                  datePreset === 'all'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                सर्व
              </button>
            </div>

            {/* Custom Date Pickers */}
            {datePreset === 'custom' && (
              <div className="flex items-center gap-2 pt-1.5">
                <div className="flex-1">
                  <span className="text-[10px] text-slate-500 font-bold block">पासून</span>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800"
                  />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] text-slate-500 font-bold block">पर्यंत</span>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800"
                  />
                </div>
              </div>
            )}
          </div>

          {/* FILTER 3: STATUS (if applicable) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              ३. स्थिती निवडा (Status)
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
                  statusFilter === 'all'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                सर्व (All)
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`px-2 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
                  statusFilter === 'pending'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                प्रलंबित (Pending)
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('sent')}
                className={`px-2 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
                  statusFilter === 'sent'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                पाठविले / पूर्ण
              </button>
              {hasResultCapability ? (
                <button
                  type="button"
                  onClick={() => setStatusFilter('result_pending')}
                  className={`px-2 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
                    statusFilter === 'result_pending'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  निकाल प्रलंबित
                </button>
              ) : (
                <div className="px-2 py-2 text-[11px] text-slate-400 font-medium flex items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                  निकाल लागू नाही
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SEARCH BAR (Filters using configured fields) */}
        <div className="pt-2 border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="नोंदींमध्ये शोधा (रुग्णाचे नाव, नमुना क्रमांक, गाव किंवा इतर माहिती)..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-9 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. REPORT SUMMARY & DYNAMIC TOTAL BAR (Screen only) */}
      <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 shadow-2xs print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg shadow-xs ${
            error ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
          }`}>
            {error ? '!' : totalCount}
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
              {registerDisplayName}
            </div>
            <div className="text-sm font-semibold text-emerald-950">
              {error ? (
                <span className="text-rose-700 font-bold">डेटा लोड त्रुटी (Error loading data)</span>
              ) : (
                <>
                  {dateRange.label} • स्थिती: <span className="font-bold underline">{statusDisplayName}</span>
                  {searchTerm && <span className="ml-2 text-xs text-slate-600 font-normal">| शोध: "{searchTerm}"</span>}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white px-4 py-2 rounded-xl border border-emerald-200 flex items-center gap-2 self-start sm:self-auto shadow-2xs">
          <span className="text-xs font-bold text-slate-600">एकूण नोंदी (Total Records):</span>
          <span className={`text-lg font-black ${error ? 'text-rose-600' : 'text-emerald-800'}`}>
            {error ? 'त्रुटी' : totalCount}
          </span>
        </div>
      </div>

      {/* Supabase Error Alert (shows error instead of 0) */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-rose-800 text-xs sm:text-sm flex items-start gap-3 print:hidden">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-sm text-rose-900">Supabase डेटा लोड त्रुटी</h4>
            <p className="mt-1 text-rose-700">{error}</p>
            <button
              type="button"
              onClick={() => loadRecords()}
              className="mt-2.5 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 cursor-pointer transition-colors"
            >
              पुन्हा प्रयत्न करा (Retry)
            </button>
          </div>
        </div>
      )}

      {/* 4. ON-SCREEN REPORT DATA TABLE (Screen only) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print:hidden">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-600">अहवाल नोंदी लोड होत आहेत...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-rose-600 space-y-2 p-6">
            <AlertCircle className="w-8 h-8 mx-auto text-rose-500" />
            <p className="text-sm font-bold">डेटा लोड अयशस्वी झाला.</p>
            <p className="text-xs text-slate-500">वरील त्रुटी संदेश पहा व पुन्हा प्रयत्न करा.</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">
              या कालावधीसाठी कोणतीही नोंद उपलब्ध नाही.
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              निवडलेल्या नोंदवही, कालावधी किंवा स्थितीनुसार नोंदी आढळल्या नाहीत.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                  <th className="p-3 w-12 text-center">अ.क्र.</th>
                  
                  {/* MALARIA COLUMNS */}
                  {selectedRegister === 'malaria' && (
                    <>
                      <th className="p-3">नमुना क्र.</th>
                      <th className="p-3">नमुना तारीख</th>
                      <th className="p-3">रुग्णाचे नाव</th>
                      <th className="p-3">वय / लिंग</th>
                      <th className="p-3">गाव</th>
                      <th className="p-3">घर क्र.</th>
                      <th className="p-3">स्मिअर कोड</th>
                      <th className="p-3 text-center">स्थिती</th>
                      <th className="p-3 text-center">निकाल (Result)</th>
                    </>
                  )}

                  {/* TB COLUMNS */}
                  {selectedRegister === 'tb' && (
                    <>
                      <th className="p-3">नोंद तारीख</th>
                      <th className="p-3">रुग्णाचे नाव</th>
                      <th className="p-3">वय / लिंग</th>
                      <th className="p-3">मोबाईल क्र.</th>
                      <th className="p-3">नमुना प्रकार</th>
                      <th className="p-3">निक्षय आयडी</th>
                      <th className="p-3 text-center">स्थिती</th>
                      <th className="p-3 text-center">निकाल (Result)</th>
                    </>
                  )}

                  {/* DYNAMIC REGISTER COLUMNS (Configured via Builder: show_in_list / show_in_report) */}
                  {selectedRegister !== 'malaria' && selectedRegister !== 'tb' && (
                    <>
                      <th className="p-3">नोंद तारीख</th>
                      {reportFields.map((f) => (
                        <th key={f.id} className="p-3">
                          {f.field_label}
                        </th>
                      ))}
                      {/* Show Result column ONLY if register has a result field configured by admin */}
                      {resultField && (
                        <th className="p-3 text-center bg-purple-50/60 text-purple-900 border-l border-purple-100">
                          {resultField.field_label}
                        </th>
                      )}
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>

                    {/* MALARIA ROW */}
                    {selectedRegister === 'malaria' && (
                      <>
                        <td className="p-3 font-bold text-slate-900">#{row.sample_number}</td>
                        <td className="p-3 font-medium text-slate-700">
                          {formatIndianDate(row.sample_collection_date)}
                        </td>
                        <td className="p-3 font-bold text-slate-900">{row.patient_name}</td>
                        <td className="p-3 text-slate-700">
                          {row.age} वर्षे / {row.gender}
                        </td>
                        <td className="p-3 text-slate-700">{row.village_name || '-'}</td>
                        <td className="p-3 text-slate-700">{row.house_number || '-'}</td>
                        <td className="p-3 font-mono font-semibold text-emerald-800">
                          {row.malaria_smear_code || '-'}
                        </td>
                        <td className="p-3 text-center">
                          {row.sent_date ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              <CheckCircle2 className="w-3 h-3" /> पाठविले
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3" /> प्रलंबित
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                            row.result === 'Positive' || row.result === 'PF' || row.result === 'PV'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : row.result === 'Negative'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {row.display_result}
                          </span>
                        </td>
                      </>
                    )}

                    {/* TB ROW */}
                    {selectedRegister === 'tb' && (
                      <>
                        <td className="p-3 font-medium text-slate-700">
                          {formatIndianDate(row.sample_collection_date)}
                        </td>
                        <td className="p-3 font-bold text-slate-900">{row.patient_name}</td>
                        <td className="p-3 text-slate-700">
                          {row.age} वर्षे / {row.gender}
                        </td>
                        <td className="p-3 text-slate-700">{row.mobile_number || '-'}</td>
                        <td className="p-3 text-slate-700 font-medium">{row.sample_type || 'कफ'}</td>
                        <td className="p-3 font-mono text-slate-700">{row.nikshay_id || '-'}</td>
                        <td className="p-3 text-center">
                          {row.sample_sent_date ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              <CheckCircle2 className="w-3 h-3" /> पाठविले
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3" /> प्रलंबित
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                            row.result === 'Positive'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : row.result === 'Negative'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {row.display_result}
                          </span>
                        </td>
                      </>
                    )}

                    {/* DYNAMIC REGISTER ROW */}
                    {selectedRegister !== 'malaria' && selectedRegister !== 'tb' && (
                      <>
                        <td className="p-3 font-medium text-slate-700 whitespace-nowrap">
                          {formatIndianDate(row.record_date || row.created_at)}
                        </td>
                        {reportFields.map((f) => {
                          const val = row.record_data?.[f.field_key];
                          return (
                            <td key={f.id} className="p-3 text-slate-800 font-medium">
                              {val !== undefined && val !== null && val !== ''
                                ? String(val)
                                : '-'}
                            </td>
                          );
                        })}
                        {/* Show Result cell ONLY if resultField exists */}
                        {resultField && (
                          <td className="p-3 text-center bg-purple-50/30 border-l border-purple-100">
                            {row.record_data?.[resultField.field_key] ? (
                              <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                {String(row.record_data[resultField.field_key])}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">प्रलंबित</span>
                            )}
                          </td>
                        )}
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100/90 border-t-2 border-slate-300 font-bold text-slate-900">
                  <td
                    colSpan={
                      selectedRegister === 'malaria'
                        ? 8
                        : selectedRegister === 'tb'
                        ? 7
                        : 1 + reportFields.length
                    }
                    className="p-3 text-right text-xs"
                  >
                    एकूण नोंदी (Total Displayed Records):
                  </td>
                  <td
                    colSpan={
                      selectedRegister === 'malaria' || selectedRegister === 'tb'
                        ? 2
                        : resultField ? 1 : 1
                    }
                    className="p-3 text-left font-black text-sm text-emerald-800"
                  >
                    {totalCount}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* 5. A4 PRINT-ONLY REPORT LAYOUT (Strict Requirement) */}
      {/* This section is completely hidden on screen and visible ONLY during window.print() */}
      <div id="printable-employee-report" className="hidden print:block font-sans text-black">
        {/* Institutional Header */}
        <div className="text-center border-b-2 border-black pb-2 mb-3">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            सार्वजनिक आरोग्य विभाग • महाराष्ट्र शासन
          </div>
          <h1 className="text-base font-black text-black my-1">
            {registerDisplayName}
          </h1>
          <div className="text-xs font-bold text-slate-900">
            प्राथमिक आरोग्य केंद्र: {phcName} | आरोग्य उपकेंद्र: {subcentreName}
          </div>
        </div>

        {/* Metadata Details Bar */}
        <div className="border border-black p-2 mb-3 bg-slate-50 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div>
            <span className="font-bold">कर्मचारी नाव:</span> {employeeName}
          </div>
          <div>
            <span className="font-bold">नोंदवही:</span> {registerDisplayName}
          </div>
          <div>
            <span className="font-bold">अहवाल कालावधी:</span> {dateRange.label}
          </div>
          <div>
            <span className="font-bold">एकूण नोंदी:</span> {totalCount}
          </div>
        </div>

        {/* Print Records Table */}
        <table className="w-full border-collapse text-xs border border-black mb-3">
          <thead>
            <tr className="bg-slate-200 border-b border-black font-bold text-black">
              <th className="border border-black p-1 text-center w-8">अ.क्र.</th>
              
              {selectedRegister === 'malaria' && (
                <>
                  <th className="border border-black p-1 text-center">नमुना क्र.</th>
                  <th className="border border-black p-1">नमुना तारीख</th>
                  <th className="border border-black p-1">रुग्णाचे नाव</th>
                  <th className="border border-black p-1">वय/लिंग</th>
                  <th className="border border-black p-1">गाव</th>
                  <th className="border border-black p-1">घर क्र.</th>
                  <th className="border border-black p-1">स्मिअर कोड</th>
                  <th className="border border-black p-1 text-center">स्थिती</th>
                  <th className="border border-black p-1 text-center">निकाल</th>
                </>
              )}

              {selectedRegister === 'tb' && (
                <>
                  <th className="border border-black p-1">नोंद तारीख</th>
                  <th className="border border-black p-1">रुग्णाचे नाव</th>
                  <th className="border border-black p-1">वय/लिंग</th>
                  <th className="border border-black p-1">मोबाईल क्र.</th>
                  <th className="border border-black p-1">नमुना प्रकार</th>
                  <th className="border border-black p-1">निक्षय आयडी</th>
                  <th className="border border-black p-1 text-center">स्थिती</th>
                  <th className="border border-black p-1 text-center">निकाल</th>
                </>
              )}

              {selectedRegister !== 'malaria' && selectedRegister !== 'tb' && (
                <>
                  <th className="border border-black p-1">नोंद तारीख</th>
                  {reportFields.map((f) => (
                    <th key={f.id} className="border border-black p-1">
                      {f.field_label}
                    </th>
                  ))}
                  {resultField && (
                    <th className="border border-black p-1 text-center">
                      {resultField.field_label}
                    </th>
                  )}
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    selectedRegister === 'malaria'
                      ? 10
                      : selectedRegister === 'tb'
                      ? 9
                      : 1 + reportFields.length + (resultField ? 1 : 0)
                  }
                  className="border border-black p-4 text-center font-bold text-slate-600"
                >
                  या कालावधीसाठी कोणतीही नोंद उपलब्ध नाही.
                </td>
              </tr>
            ) : (
              filteredRecords.map((row, idx) => (
                <tr key={row.id || idx} className="border-b border-black">
                  <td className="border border-black p-1 text-center font-bold">{idx + 1}</td>

                  {selectedRegister === 'malaria' && (
                    <>
                      <td className="border border-black p-1 text-center font-bold">
                        #{row.sample_number}
                      </td>
                      <td className="border border-black p-1">
                        {formatIndianDate(row.sample_collection_date)}
                      </td>
                      <td className="border border-black p-1 font-bold">{row.patient_name}</td>
                      <td className="border border-black p-1">
                        {row.age} / {row.gender}
                      </td>
                      <td className="border border-black p-1">{row.village_name || '-'}</td>
                      <td className="border border-black p-1">{row.house_number || '-'}</td>
                      <td className="border border-black p-1 font-mono">
                        {row.malaria_smear_code || '-'}
                      </td>
                      <td className="border border-black p-1 text-center font-bold">
                        {row.sent_date ? 'पाठविले' : 'प्रलंबित'}
                      </td>
                      <td className="border border-black p-1 text-center">
                        {row.display_result}
                      </td>
                    </>
                  )}

                  {selectedRegister === 'tb' && (
                    <>
                      <td className="border border-black p-1">
                        {formatIndianDate(row.sample_collection_date)}
                      </td>
                      <td className="border border-black p-1 font-bold">{row.patient_name}</td>
                      <td className="border border-black p-1">
                        {row.age} / {row.gender}
                      </td>
                      <td className="border border-black p-1">{row.mobile_number || '-'}</td>
                      <td className="border border-black p-1">{row.sample_type || 'कफ'}</td>
                      <td className="border border-black p-1 font-mono">{row.nikshay_id || '-'}</td>
                      <td className="border border-black p-1 text-center font-bold">
                        {row.sample_sent_date ? 'पाठविले' : 'प्रलंबित'}
                      </td>
                      <td className="border border-black p-1 text-center">
                        {row.display_result}
                      </td>
                    </>
                  )}

                  {selectedRegister !== 'malaria' && selectedRegister !== 'tb' && (
                    <>
                      <td className="border border-black p-1">
                        {formatIndianDate(row.record_date || row.created_at)}
                      </td>
                      {reportFields.map((f) => {
                        const val = row.record_data?.[f.field_key];
                        return (
                          <td key={f.id} className="border border-black p-1">
                            {val !== undefined && val !== null && val !== ''
                              ? String(val)
                              : '-'}
                          </td>
                        );
                      })}
                      {resultField && (
                        <td className="border border-black p-1 text-center font-bold">
                          {row.record_data?.[resultField.field_key] !== undefined
                            ? String(row.record_data[resultField.field_key])
                            : '-'}
                        </td>
                      )}
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="bg-slate-200 border-t-2 border-black font-black">
              <td
                colSpan={
                  selectedRegister === 'malaria'
                    ? 8
                    : selectedRegister === 'tb'
                    ? 7
                    : 1 + reportFields.length
                }
                className="border border-black p-1 text-right font-black text-xs"
              >
                एकूण नोंदी (Total Records):
              </td>
              <td
                colSpan={
                  selectedRegister === 'malaria' || selectedRegister === 'tb'
                    ? 2
                    : resultField ? 1 : 1
                }
                className="border border-black p-1 text-center font-black text-sm"
              >
                {totalCount}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Footer & Signatures */}
        <div className="flex justify-between items-end pt-8 mt-4 text-xs font-bold">
          <div className="text-center border-t border-black pt-1 w-48">
            कर्मचारी स्वाक्षरी<br />
            ({employeeName})
          </div>
          <div className="text-center text-[10px] text-slate-600">
            अहवाल दिनांक: {formatIndianDate(todayStr)} | आरोग्य उपकेंद्र {subcentreName}
          </div>
          <div className="text-center border-t border-black pt-1 w-48">
            वैद्यकीय अधिकारी स्वाक्षरी<br />
            (प्रा.आ.के. {phcName})
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubcentreEmployeeReportsView;
