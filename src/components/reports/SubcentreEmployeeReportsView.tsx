import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { templateService } from '../../services/templateService';
import { currentUserService } from '../../services/currentUserService';
import { RecordRegisterTemplate, RecordTemplateField, PageId } from '../../types';
import { storage } from '../../lib/storage';
import { exportElementToPDF } from '../../utils/pdfExport';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  RefreshCw, 
  Calendar, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText,
  User,
  Building,
  MapPin,
  ChevronRight
} from 'lucide-react';

interface SubcentreEmployeeReportsViewProps {
  onNavigate?: (page: PageId) => void;
}

export const formatIndianDate = (dateStr?: string | null): string => {
  if (!dateStr) return '-';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return dateStr;
};

export const SubcentreEmployeeReportsView: React.FC<SubcentreEmployeeReportsViewProps> = ({ onNavigate }) => {
  const { user, userContext } = useAuth();

  // State: Dynamic templates list
  const [dynamicTemplates, setDynamicTemplates] = useState<RecordRegisterTemplate[]>([]);
  const [templateFields, setTemplateFields] = useState<RecordTemplateField[]>([]);

  // State: Filters
  const [datePreset, setDatePreset] = useState<'today' | 'this_month' | 'this_year' | 'custom'>(() => {
    const saved = storage.getItem('employee_report_filter_date');
    if (saved === 'today' || saved === 'this_month' || saved === 'this_year' || saved === 'custom') {
      storage.removeItem('employee_report_filter_date');
      return saved;
    }
    return 'today';
  });

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [customFrom, setCustomFrom] = useState<string>(todayStr);
  const [customTo, setCustomTo] = useState<string>(todayStr);

  // Register filter: 'malaria' | 'tb' | template_id
  const [selectedRegister, setSelectedRegister] = useState<string>('malaria');

  // Status filter: 'all' | 'pending' | 'sent' | 'result_pending'
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'sent' | 'result_pending'>('all');

  // Loaded records
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Authoritative employee info
  const [authoritativeEmployeeId, setAuthoritativeEmployeeId] = useState<string>(
    user?.employeeId || userContext?.employeeId || ''
  );

  const employeeName = userContext?.employeeName || user?.marathiName || user?.name || 'आरोग्य कर्मचारी';
  const phcName = userContext?.phcName || user?.assignedPhc || 'प्रा.आ.के. भादा';
  const subcentreName = userContext?.subcentreName || user?.assignedSubcentre || 'उपकेंद्र';

  // 1. Initial resolution of Employee ID & Templates
  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        // Resolve dynamic templates
        const tpls = await templateService.getActiveTemplates();
        if (isMounted) {
          setDynamicTemplates(tpls.filter(t => t.register_code !== 'MALARIA' && t.register_code !== 'TB'));
        }

        // If employeeId missing from current state, fetch context
        if (!authoritativeEmployeeId) {
          const ctx = await currentUserService.getCurrentUserContext();
          if (ctx?.employeeId && isMounted) {
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
  }, [authoritativeEmployeeId]);

  // Compute actual date range from preset
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
    } else {
      return {
        from: customFrom,
        to: customTo,
        label: `कालावधी: ${formatIndianDate(customFrom)} ते ${formatIndianDate(customTo)}`,
      };
    }
  }, [datePreset, todayStr, customFrom, customTo]);

  // Load records directly from Supabase for this logged-in employee
  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError(null);

    const empId = authoritativeEmployeeId || user?.employeeId || userContext?.employeeId;
    if (!empId) {
      setLoading(false);
      setError('कर्मचारी ओळख (Employee ID) सापडली नाही.');
      return;
    }

    try {
      if (selectedRegister === 'malaria') {
        // MALARIA RECORDS
        if (isSupabaseConfigured() && supabase) {
          let query = supabase
            .from('malaria_blood_samples')
            .select(`
              id,
              employee_id,
              village_id,
              house_number,
              patient_name,
              age,
              gender,
              sample_collection_date,
              sample_number,
              sample_year,
              malaria_smear_code,
              sent_date,
              created_at,
              village:village_master(id, village_name)
            `)
            .eq('employee_id', empId)
            .gte('sample_collection_date', dateRange.from)
            .lte('sample_collection_date', dateRange.to)
            .order('sample_collection_date', { ascending: false })
            .order('sample_number', { ascending: false });

          if (statusFilter === 'pending') {
            query = query.is('sent_date', null);
          } else if (statusFilter === 'sent') {
            query = query.not('sent_date', 'is', null);
          } else if (statusFilter === 'result_pending') {
            // Sent samples where lab result is pending
            query = query.not('sent_date', 'is', null);
          }

          const { data, error: sbError } = await query;
          if (sbError) throw sbError;

          const mapped = (data || []).map((s: any) => ({
            ...s,
            village_name: s.village?.village_name || '-',
            status: s.sent_date ? 'पाठविले' : 'प्रलंबित',
            status_code: s.sent_date ? 'sent' : 'pending',
          }));
          setRecords(mapped);
        } else {
          setRecords([]);
        }
      } else if (selectedRegister === 'tb') {
        // TB RECORDS
        if (isSupabaseConfigured() && supabase) {
          let query = supabase
            .from('tb_suspected_patient_register')
            .select('*')
            .eq('employee_id', empId)
            .gte('sample_collection_date', dateRange.from)
            .lte('sample_collection_date', dateRange.to)
            .order('sample_collection_date', { ascending: false });

          if (statusFilter === 'pending') {
            query = query.is('sample_sent_date', null);
          } else if (statusFilter === 'sent') {
            query = query.not('sample_sent_date', 'is', null);
          } else if (statusFilter === 'result_pending') {
            query = query.not('sample_sent_date', 'is', null);
          }

          const { data, error: sbError } = await query;
          if (sbError) throw sbError;

          const mapped = (data || []).map((s: any) => ({
            ...s,
            status: s.sample_sent_date ? 'पाठविले' : 'प्रलंबित',
            status_code: s.sample_sent_date ? 'sent' : 'pending',
          }));
          setRecords(mapped);
        } else {
          setRecords([]);
        }
      } else {
        // DYNAMIC REGISTER RECORDS
        if (isSupabaseConfigured() && supabase) {
          // Fetch fields for this template to know table columns
          const fields = await templateService.getTemplateFields(selectedRegister);
          setTemplateFields(fields.filter(f => f.show_in_list || f.show_in_print));

          let query = supabase
            .from('dynamic_record_entries')
            .select('*')
            .eq('template_id', selectedRegister)
            .eq('employee_id', empId)
            .gte('record_date', dateRange.from)
            .lte('record_date', dateRange.to)
            .order('record_date', { ascending: false });

          const { data, error: sbError } = await query;
          if (sbError) throw sbError;

          let mapped = (data || []).map((r: any) => {
            const hasData = r.record_data && Object.keys(r.record_data).length > 0;
            const isSent = r.is_printed || r.record_data?.status === 'sent' || r.record_data?.status === 'पूर्ण';
            return {
              ...r,
              status: isSent ? 'पूर्ण / पाठविले' : 'प्रलंबित',
              status_code: isSent ? 'sent' : 'pending',
            };
          });

          if (statusFilter === 'pending') {
            mapped = mapped.filter(r => r.status_code === 'pending');
          } else if (statusFilter === 'sent') {
            mapped = mapped.filter(r => r.status_code === 'sent');
          }

          setRecords(mapped);
        } else {
          setRecords([]);
        }
      }
    } catch (err: any) {
      console.error('Failed to load employee records:', err);
      setError(err.message || 'अहवाल नोंदी लोड करता आल्या नाहीत. कृपया पुन्हा प्रयत्न करा.');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [authoritativeEmployeeId, user, userContext, selectedRegister, dateRange, statusFilter]);

  // Reload records whenever filters change or sync event occurs
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

  // Register Display Name
  const registerDisplayName = useMemo(() => {
    if (selectedRegister === 'malaria') return 'हिवताप / मलेरिया रक्त नमुना नोंदवही (Malaria M1/M2)';
    if (selectedRegister === 'tb') return 'राष्ट्रीय क्षयरोग नियंत्रण कार्यक्रम (TB Register)';
    const found = dynamicTemplates.find(t => t.id === selectedRegister);
    return found ? found.register_name : 'डायनॅमिक नोंदवही';
  }, [selectedRegister, dynamicTemplates]);

  // Status Display Name
  const statusDisplayName = useMemo(() => {
    if (statusFilter === 'all') return 'सर्व नोंदी (All)';
    if (statusFilter === 'pending') return 'प्रलंबित (Pending)';
    if (statusFilter === 'sent') return 'पाठविले / पूर्ण (Sent/Completed)';
    if (statusFilter === 'result_pending') return 'निकाल प्रलंबित (Result Pending)';
    return 'सर्व';
  }, [statusFilter]);

  // READ-ONLY Print Handler (does NOT modify sent_date or database)
  const handlePrint = () => {
    try {
      window.print();
    } catch (e) {
      console.error('Print trigger error:', e);
    }
  };

  // PDF Export Handler
  const handleDownloadPDF = async () => {
    await exportElementToPDF('printable-employee-report', `${selectedRegister}-report.pdf`, 'l');
  };

  const totalCount = records.length;

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & IDENTITY BAR (Screen only) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">
              उपकेंद्र कर्मचारी अहवाल (Reports)
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium mt-1">
            <span className="inline-flex items-center gap-1 text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <User className="w-3.5 h-3.5" />
              {employeeName}
            </span>
            <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
              <Building className="w-3.5 h-3.5 text-blue-600" />
              {phcName}
            </span>
            <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
              <MapPin className="w-3.5 h-3.5 text-rose-600" />
              {subcentreName}
            </span>
          </div>
        </div>

        {/* Action Buttons: Refresh, Print, PDF */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={() => loadRecords()}
            disabled={loading}
            title="रिफ्रेश करा"
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 rounded-xl text-sm font-bold flex items-center gap-2 border border-slate-300 transition-all cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>PDF डाउनलोड</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>प्रिंट अहवाल (A4)</span>
          </button>
        </div>
      </div>

      {/* 2. FILTER CONTROLS PANEL (Screen only) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs print:hidden space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Filter className="w-4 h-4 text-emerald-700" />
          <h2 className="text-sm font-bold text-slate-800">अहवाल फिल्टर्स (Filters)</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* FILTER 1: REGISTER */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              1. नोंदवही निवडा (Register)
            </label>
            <select
              value={selectedRegister}
              onChange={(e) => setSelectedRegister(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none cursor-pointer"
            >
              <option value="malaria">🦟 हिवताप / मलेरिया (Malaria Blood Smears)</option>
              <option value="tb">🫁 क्षयरोग (TB Suspected Register)</option>
              {dynamicTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  📋 {t.register_name}
                </option>
              ))}
            </select>
          </div>

          {/* FILTER 2: DATE PRESET */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              2. कालावधी निवडा (Date Period)
            </label>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              <button
                type="button"
                onClick={() => setDatePreset('today')}
                className={`px-2.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
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
                className={`px-2.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
                  datePreset === 'this_month'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                चालू महिना
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('this_year')}
                className={`px-2.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
                  datePreset === 'this_year'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                चालू वर्ष
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('custom')}
                className={`px-2.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
                  datePreset === 'custom'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                कस्टम
              </button>
            </div>

            {/* Custom Date Pickers */}
            {datePreset === 'custom' && (
              <div className="flex items-center gap-2 pt-2">
                <div className="flex-1">
                  <span className="text-[10px] text-slate-500 font-bold block">पासून</span>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                  />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] text-slate-500 font-bold block">पर्यंत</span>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                  />
                </div>
              </div>
            )}
          </div>

          {/* FILTER 3: STATUS */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              3. नोंद स्थिती (Status)
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
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
                className={`px-2.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
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
                className={`px-2.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
                  statusFilter === 'sent'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                पाठविले / पूर्ण (Sent)
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('result_pending')}
                className={`px-2.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
                  statusFilter === 'result_pending'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                निकाल प्रलंबित
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. REPORT SUMMARY & DYNAMIC TOTAL BAR (Screen only) */}
      <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 shadow-2xs print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
            {totalCount}
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
              {registerDisplayName}
            </div>
            <div className="text-sm font-semibold text-emerald-950">
              {dateRange.label} • स्थिती: <span className="font-bold underline">{statusDisplayName}</span>
            </div>
          </div>
        </div>

        <div className="bg-white px-4 py-2 rounded-xl border border-emerald-200 flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-bold text-slate-600">एकूण नोंदी (Total):</span>
          <span className="text-lg font-black text-emerald-800">{totalCount}</span>
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-800 text-sm flex items-center gap-2 print:hidden">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4. ON-SCREEN REPORT DATA TABLE (Screen only) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print:hidden">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-600">अहवाल नोंदी लोड होत आहेत...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">या कालावधीसाठी कोणतीही नोंद उपलब्ध नाही</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              निवडलेल्या नोंदवही, कालावधी किंवा स्थितीनुसार नोंदी आढळल्या नाहीत. कृपया वरील फिल्टर्स तपासा.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                  <th className="p-3 w-12 text-center">अ.क्र.</th>
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
                      <th className="p-3">पाठविल्याची तारीख</th>
                    </>
                  )}

                  {selectedRegister === 'tb' && (
                    <>
                      <th className="p-3">नमुना तारीख</th>
                      <th className="p-3">रुग्णाचे नाव</th>
                      <th className="p-3">वय / लिंग</th>
                      <th className="p-3">मोबाईल क्र.</th>
                      <th className="p-3">नमुना प्रकार</th>
                      <th className="p-3">निक्षय आयडी</th>
                      <th className="p-3 text-center">स्थिती</th>
                      <th className="p-3">पाठविल्याची तारीख</th>
                    </>
                  )}

                  {selectedRegister !== 'malaria' && selectedRegister !== 'tb' && (
                    <>
                      <th className="p-3">नोंद तारीख</th>
                      {templateFields.slice(0, 5).map((f) => (
                        <th key={f.id} className="p-3">
                          {f.field_label}
                        </th>
                      ))}
                      <th className="p-3 text-center">स्थिती</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-center font-bold text-slate-500">{idx + 1}</td>

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
                              <CheckCircle2 className="w-3 h-3" />
                              पाठविले
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3" />
                              प्रलंबित
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-700 font-medium">
                          {formatIndianDate(row.sent_date)}
                        </td>
                      </>
                    )}

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
                              <CheckCircle2 className="w-3 h-3" />
                              पाठविले
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3" />
                              प्रलंबित
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-700 font-medium">
                          {formatIndianDate(row.sample_sent_date)}
                        </td>
                      </>
                    )}

                    {selectedRegister !== 'malaria' && selectedRegister !== 'tb' && (
                      <>
                        <td className="p-3 font-medium text-slate-700">
                          {formatIndianDate(row.record_date || row.created_at)}
                        </td>
                        {templateFields.slice(0, 5).map((f) => (
                          <td key={f.id} className="p-3 text-slate-800 font-medium">
                            {row.record_data?.[f.field_key] !== undefined
                              ? String(row.record_data[f.field_key])
                              : '-'}
                          </td>
                        ))}
                        <td className="p-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                              row.status_code === 'sent'
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : 'bg-amber-100 text-amber-800 border-amber-200'
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
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
                        : 2 + Math.min(5, templateFields.length)
                    }
                    className="p-3 text-right text-xs"
                  >
                    एकूण नोंदी (Total Displayed Records):
                  </td>
                  <td colSpan={2} className="p-3 text-left font-black text-sm text-emerald-800">
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
        <div className="border border-black p-2.5 mb-3 bg-slate-50 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div>
            <span className="font-bold">कर्मचारी नाव:</span> {employeeName}
          </div>
          <div>
            <span className="font-bold">नोंदवही:</span> {selectedRegister.toUpperCase()}
          </div>
          <div>
            <span className="font-bold">अहवाल कालावधी:</span> {dateRange.label}
          </div>
          <div>
            <span className="font-bold">नोंद स्थिती:</span> {statusDisplayName}
          </div>
        </div>

        {/* Print Records Table */}
        <table className="w-full border-collapse text-xs border border-black mb-3">
          <thead>
            <tr className="bg-slate-200 border-b border-black font-bold text-black">
              <th className="border border-black p-1.5 text-center w-10">अ.क्र.</th>
              {selectedRegister === 'malaria' && (
                <>
                  <th className="border border-black p-1.5 text-center">नमुना क्र.</th>
                  <th className="border border-black p-1.5">नमुना तारीख</th>
                  <th className="border border-black p-1.5">रुग्णाचे नाव</th>
                  <th className="border border-black p-1.5">वय/लिंग</th>
                  <th className="border border-black p-1.5">गाव</th>
                  <th className="border border-black p-1.5">घर क्र.</th>
                  <th className="border border-black p-1.5">स्मिअर कोड</th>
                  <th className="border border-black p-1.5 text-center">स्थिती</th>
                  <th className="border border-black p-1.5">पाठविले तारीख</th>
                </>
              )}

              {selectedRegister === 'tb' && (
                <>
                  <th className="border border-black p-1.5">नमुना तारीख</th>
                  <th className="border border-black p-1.5">रुग्णाचे नाव</th>
                  <th className="border border-black p-1.5">वय/लिंग</th>
                  <th className="border border-black p-1.5">मोबाईल क्र.</th>
                  <th className="border border-black p-1.5">नमुना प्रकार</th>
                  <th className="border border-black p-1.5">निक्षय आयडी</th>
                  <th className="border border-black p-1.5 text-center">स्थिती</th>
                  <th className="border border-black p-1.5">पाठविले तारीख</th>
                </>
              )}

              {selectedRegister !== 'malaria' && selectedRegister !== 'tb' && (
                <>
                  <th className="border border-black p-1.5">नोंद तारीख</th>
                  {templateFields.slice(0, 5).map((f) => (
                    <th key={f.id} className="border border-black p-1.5">
                      {f.field_label}
                    </th>
                  ))}
                  <th className="border border-black p-1.5 text-center">स्थिती</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="border border-black p-4 text-center font-bold text-slate-600"
                >
                  या कालावधीसाठी कोणतीही नोंद उपलब्ध नाही.
                </td>
              </tr>
            ) : (
              records.map((row, idx) => (
                <tr key={row.id || idx} className="border-b border-black">
                  <td className="border border-black p-1.5 text-center font-bold">{idx + 1}</td>

                  {selectedRegister === 'malaria' && (
                    <>
                      <td className="border border-black p-1.5 text-center font-bold">
                        #{row.sample_number}
                      </td>
                      <td className="border border-black p-1.5">
                        {formatIndianDate(row.sample_collection_date)}
                      </td>
                      <td className="border border-black p-1.5 font-bold">{row.patient_name}</td>
                      <td className="border border-black p-1.5">
                        {row.age} / {row.gender}
                      </td>
                      <td className="border border-black p-1.5">{row.village_name || '-'}</td>
                      <td className="border border-black p-1.5">{row.house_number || '-'}</td>
                      <td className="border border-black p-1.5 font-mono">
                        {row.malaria_smear_code || '-'}
                      </td>
                      <td className="border border-black p-1.5 text-center font-bold">
                        {row.sent_date ? 'पाठविले' : 'प्रलंबित'}
                      </td>
                      <td className="border border-black p-1.5">
                        {formatIndianDate(row.sent_date)}
                      </td>
                    </>
                  )}

                  {selectedRegister === 'tb' && (
                    <>
                      <td className="border border-black p-1.5">
                        {formatIndianDate(row.sample_collection_date)}
                      </td>
                      <td className="border border-black p-1.5 font-bold">{row.patient_name}</td>
                      <td className="border border-black p-1.5">
                        {row.age} / {row.gender}
                      </td>
                      <td className="border border-black p-1.5">{row.mobile_number || '-'}</td>
                      <td className="border border-black p-1.5">{row.sample_type || 'कफ'}</td>
                      <td className="border border-black p-1.5 font-mono">{row.nikshay_id || '-'}</td>
                      <td className="border border-black p-1.5 text-center font-bold">
                        {row.sample_sent_date ? 'पाठविले' : 'प्रलंबित'}
                      </td>
                      <td className="border border-black p-1.5">
                        {formatIndianDate(row.sample_sent_date)}
                      </td>
                    </>
                  )}

                  {selectedRegister !== 'malaria' && selectedRegister !== 'tb' && (
                    <>
                      <td className="border border-black p-1.5">
                        {formatIndianDate(row.record_date || row.created_at)}
                      </td>
                      {templateFields.slice(0, 5).map((f) => (
                        <td key={f.id} className="border border-black p-1.5">
                          {row.record_data?.[f.field_key] !== undefined
                            ? String(row.record_data[f.field_key])
                            : '-'}
                        </td>
                      ))}
                      <td className="border border-black p-1.5 text-center font-bold">
                        {row.status}
                      </td>
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
                    : 2 + Math.min(5, templateFields.length)
                }
                className="border border-black p-1.5 text-right font-black text-xs"
              >
                एकूण नोंदी (Total Records):
              </td>
              <td colSpan={2} className="border border-black p-1.5 text-center font-black text-sm">
                {totalCount}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Footer & Institutional Signatures */}
        <div className="flex justify-between items-end pt-12 mt-6 text-xs font-bold">
          <div className="text-center border-t border-black pt-1 w-52">
            कर्मचारी स्वाक्षरी<br />
            ({employeeName})
          </div>
          <div className="text-center text-[10px] text-slate-600">
            अहवाल तयार तारीख: {formatIndianDate(todayStr)} | आरोग्य उपकेंद्र {subcentreName}
          </div>
          <div className="text-center border-t border-black pt-1 w-52">
            वैद्यकीय अधिकारी स्वाक्षरी<br />
            (प्रा.आ.के. {phcName})
          </div>
        </div>
      </div>
    </div>
  );
};
export default SubcentreEmployeeReportsView;
