import React, { useState, useEffect, useMemo } from 'react';
import { PageId, RecordRegisterTemplate, RecordTemplateField, DynamicRecordEntry } from '../types';
import { templateService } from '../services/templateService';
import { masterDataService } from '../services/masterDataService';
import { EmployeeMaster, Subcentre, Village } from '../types';
import { useAuth } from '../hooks/useAuth';
import { ArrowLeft, Search, Eye, Edit3, Clock, XCircle } from 'lucide-react';
import { DynamicRecordForm } from '../components/DynamicRecordForm';

export default function PendingDynamicRecordsPage({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  const { user, role } = useAuth();
  const isPhcController = role === 'phc_controller' || user?.role === 'phc_controller';

  const [loading, setLoading] = useState(true);
  const [allTemplates, setAllTemplates] = useState<RecordRegisterTemplate[]>([]);
  const [allResultFields, setAllResultFields] = useState<RecordTemplateField[]>([]);
  const [pendingRecords, setPendingRecords] = useState<{ record: DynamicRecordEntry, template: RecordRegisterTemplate, resultField: RecordTemplateField }[]>([]);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTemplateId, setFilterTemplateId] = useState('');
  const [filterEmployeeId, setFilterEmployeeId] = useState('all');
  const [filterSubcentreId, setFilterSubcentreId] = useState('all');
  const [filterVillageId, setFilterVillageId] = useState('all');

  const [employees, setEmployees] = useState<EmployeeMaster[]>([]);
  const [subcentres, setSubcentres] = useState<Subcentre[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [filterDate, setFilterDate] = useState('');


  // Modals
  const [viewRecord, setViewRecord] = useState<{ record: DynamicRecordEntry, template: RecordRegisterTemplate } | null>(null);
  const [editRecord, setEditRecord] = useState<{ record: DynamicRecordEntry, template: RecordRegisterTemplate } | null>(null);
  const [editFields, setEditFields] = useState<RecordTemplateField[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    try {
      const emps = await masterDataService.getEmployees();
      const scs = await masterDataService.getSubcentres();
      const vils = await masterDataService.getVillages();
      setEmployees(emps);
      setSubcentres(scs);
      setVillages(vils);
      const templates = await templateService.getTemplates();
      setAllTemplates(templates);

      let pRecords: { record: DynamicRecordEntry, template: RecordRegisterTemplate, resultField: RecordTemplateField }[] = [];
      let rFields: RecordTemplateField[] = [];

      for (const tpl of templates) {
        if (!tpl.is_active) continue;
        const fields = await templateService.getTemplateFields(tpl.id);
        const resultFields = fields.filter(f => f.field_type === 'result');
        if (resultFields.length > 0) {
          rFields.push(...resultFields);
          const records = await templateService.getDynamicRecords(tpl.id);
          
          let accessible = records;
          if (!isPhcController && user?.employeeId) {
            accessible = records.filter(x => x.employee_id === user.employeeId || x.created_by === user.id);
          }

          for (const rec of accessible) {
            for (const rf of resultFields) {
              const val = rec.record_data?.[rf.field_key];
              if (val === 'Pending' || val === 'प्रलंबित') {
                pRecords.push({ record: rec, template: tpl, resultField: rf });
                break;
              }
            }
          }
        }
      }
      setAllResultFields(rFields);
      setPendingRecords(pRecords.sort((a,b) => new Date(b.record.record_date || 0).getTime() - new Date(a.record.record_date || 0).getTime()));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = useMemo(() => {
    return pendingRecords.filter(item => {
      if (filterTemplateId && item.template.id !== filterTemplateId) return false;
      if (filterEmployeeId !== 'all' && item.record.employee_id !== filterEmployeeId) return false;
      if (filterSubcentreId !== 'all' && item.record.subcentre_id !== filterSubcentreId) return false;

      if (filterVillageId !== 'all' && item.record.village_id !== filterVillageId) return false;
      if (filterDate && item.record.record_date !== filterDate) return false;


      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const dataStr = JSON.stringify(item.record.record_data || {}).toLowerCase();
        if (!dataStr.includes(query) && !item.template.register_name.toLowerCase().includes(query)) {
           return false;
        }
      }

      return true;
    });
  }, [pendingRecords, filterTemplateId, filterEmployeeId, filterSubcentreId, filterVillageId, searchQuery]);

  const canEditRecord = (record: DynamicRecordEntry) => {
    if (!record.created_at) return true;
    const createdTime = new Date(record.created_at).getTime();
    const diffDays = (Date.now() - createdTime) / (1000 * 60 * 60 * 24);
    if (isPhcController) {
      return diffDays <= 30;
    } else {
      return diffDays <= 7;
    }
  };

  const handleEditClick = async (item: any) => {
    try {
      const flds = await templateService.getTemplateFields(item.template.id);
      setEditFields(flds);
      setEditRecord({ record: item.record, template: item.template });
    } catch(e) {
       console.error(e);
    }
  };

  const handleEditSave = async (updatedData: any, subcentreId?: string, villageId?: string, recordDate?: string) => {
    if (!editRecord) return;
    try {
      const rec = { 
        ...editRecord.record, 
        record_data: updatedData,
        record_date: recordDate || editRecord.record.record_date,
        subcentre_id: subcentreId || editRecord.record.subcentre_id,
        village_id: villageId || editRecord.record.village_id
      };
      await templateService.saveDynamicRecord(rec);
      setEditRecord(null);
      loadData();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const getPatientName = (record: DynamicRecordEntry) => {
    const data = record.record_data || {};
    if (data['patient_name']) return data['patient_name'];
    if (data['beneficiary_name']) return data['beneficiary_name'];
    if (data['name']) return data['name'];
    for (const key of Object.keys(data)) {
       if (typeof data[key] === 'string' && data[key] !== 'Pending' && data[key].trim() !== '') {
          return data[key];
       }
    }
    return '-';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigate(isPhcController ? 'admin-dashboard' : 'dashboard')} 
            className="p-2 -ml-2 rounded-full hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Pending Records</h1>
            <p className="text-sm text-slate-500 font-medium">सर्व प्रलंबित (Pending) नोंदी</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          
          
          <select
            value={filterTemplateId}
            onChange={e => setFilterTemplateId(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 bg-white"
          >
            <option value="">सर्व रजिस्टर (All Registers)</option>
            {allTemplates.filter(t => t.is_active).map(t => (
              <option key={t.id} value={t.id}>{t.register_name}</option>
            ))}
          </select>
          {isPhcController && (
            <>
              <select
                value={filterEmployeeId}
                onChange={e => setFilterEmployeeId(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 bg-white"
              >
                <option value="all">सर्व कर्मचारी (All Employees)</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.designation})</option>
                ))}
              </select>
              <select
                value={filterSubcentreId}
                onChange={e => setFilterSubcentreId(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 bg-white"
              >
                <option value="all">सर्व उपकेंद्र (All Subcentres)</option>
                {subcentres.map(sc => (
                  <option key={sc.id} value={sc.id}>{sc.name}</option>
                ))}
              </select>
              <select
                value={filterVillageId}
                onChange={e => setFilterVillageId(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 bg-white"
              >
                <option value="all">सर्व गावे (All Villages)</option>
                {villages.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
              <input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 bg-white"
              />
            </>
          )}

        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 font-medium">Loading records...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider">
                  <th className="p-3 border-r border-slate-200">Date</th>
                  <th className="p-3 border-r border-slate-200">Register</th>
                  <th className="p-3 border-r border-slate-200">Patient/Beneficiary</th>
                  <th className="p-3 border-r border-slate-200">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">
                      कोणीतीही प्रलंबित नोंद आढळली नाही.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((item, i) => (
                    <tr key={item.record.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-700 border-r border-slate-200 whitespace-nowrap">
                        {item.record.record_date?.split('-').reverse().join('-') || '-'}
                      </td>
                      <td className="p-3 border-r border-slate-200">
                        <div className="font-bold text-slate-900">{item.template.register_name}</div>
                        <div className="text-xs text-slate-500 font-mono">{item.template.register_code}</div>
                      </td>
                      <td className="p-3 border-r border-slate-200 font-medium text-slate-800">
                        {getPatientName(item.record)}
                      </td>
                      <td className="p-3 border-r border-slate-200">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-[11px] font-black border border-amber-200 uppercase tracking-wide">
                          <Clock className="w-3.5 h-3.5" /> 
                          {item.record.record_data?.[item.resultField.field_key]}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1 whitespace-nowrap">
                        <button 
                          onClick={() => setViewRecord(item)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEditRecord(item.record) ? (
                          <button 
                            onClick={() => handleEditClick(item)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit / Update Status"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium border border-slate-200">
                            Read Only
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-6 border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="font-black text-slate-900 text-lg">नोंद तपशील (View Record)</h3>
                <p className="text-xs text-slate-500">{viewRecord.template.register_name}</p>
              </div>
              <button onClick={() => setViewRecord(null)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4">
              {Object.entries(viewRecord.record.record_data || {}).map(([key, val]) => (
                <div key={key} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <div className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-wide">{key}</div>
                  <div className="text-sm font-medium text-slate-900">{String(val) || '-'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-6 border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 shrink-0">
              <h3 className="font-bold text-slate-900 text-base">नोंद दुरुस्ती / Update Result</h3>
              <button onClick={() => setEditRecord(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 overflow-y-auto">
              <DynamicRecordForm
                fields={editFields}
                initialSubcentreId={editRecord.record.subcentre_id}
                initialVillageId={editRecord.record.village_id}
                initialData={editRecord.record.record_data}
                initialRecordDate={editRecord.record.record_date}
                onSave={handleEditSave}
                onCancel={() => setEditRecord(null)}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
