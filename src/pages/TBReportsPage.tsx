import React, { useState, useEffect } from 'react';
import { PageId, TBPatientRecord } from '../types';
import { templateService } from '../services/templateService';
import { tbService, formatIndianDate } from '../services/tbService';
import { masterDataService } from '../services/masterDataService';
import { Download, Printer, Search, Filter, Activity, FileSpreadsheet, FileText, XCircle, CheckCircle2 } from 'lucide-react';
import { exportElementToPDF } from '../utils/pdfExport';
import { useAuth } from '../hooks/useAuth';

interface TBReportsPageProps {
  onNavigate: (page: PageId) => void;
}

export const TBReportsPage: React.FC<TBReportsPageProps> = ({ onNavigate }) => {
  const { user, role } = useAuth();
  const [records, setRecords] = useState<TBPatientRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<TBPatientRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [selectedSampleType, setSelectedSampleType] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [villages, setVillages] = useState<any[]>([]);

  const [resultFields, setResultFields] = useState<any[]>([]);
  const [selectedResult, setSelectedResult] = useState('all');
  
  const [resultRecord, setResultRecord] = useState<TBPatientRecord | null>(null);
  const [resultUpdates, setResultUpdates] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const isPhcController = role === 'phc_controller' || user?.role === 'phc_controller';

  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [isBulkUpdateModalOpen, setIsBulkUpdateModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedVillage, selectedSampleType, selectedLocation, selectedResult, records]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const v = await masterDataService.getVillages();
      setVillages(v);
      
      let filter = {};
      if (role === 'subcentre_employee' && user?.phcId) {
        filter = { phc_id: user.phcId };
      }
      const data = await tbService.getSamples(filter);
      
      const tbFields = await templateService.getTemplateFields('b2000000-0000-4000-8000-000000000002');
      const rFields = tbFields.filter(f => f.field_type === 'result');
      setResultFields(rFields);
      
      // Additional client-side role filtering just in case
      let finalData = data;
      if (role === 'subcentre_employee' && user?.employeeId) {
        finalData = data.filter(d => d.employee_id === user.employeeId);
      }
      
      setRecords(finalData);
      setFilteredRecords(finalData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let result = records;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(r => 
        r.patient_name.toLowerCase().includes(q) ||
        (r.mobile_number && r.mobile_number.includes(q)) ||
        (r.nikshay_id && r.nikshay_id.toLowerCase().includes(q))
      );
    }

    if (selectedVillage) {
      result = result.filter(r => r.village_id === selectedVillage);
    }

    if (selectedSampleType) {
      result = result.filter(r => r.sample_type === selectedSampleType);
    }

    if (selectedLocation) {
      result = result.filter(r => r.sample_given_at === selectedLocation);
    }

    if (selectedResult && selectedResult !== 'all') {
      if (selectedResult === 'Pending') {
        result = result.filter(r => !r.test_result || r.test_result === 'Pending');
      } else {
        result = result.filter(r => r.test_result === selectedResult);
      }
    }

    setFilteredRecords(result);
  };

  const handleUpdateResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultRecord) return;
    try {
      await tbService.updateSample(resultRecord.id, {
        test_result: resultUpdates,
        tested_on: new Date().toISOString().split('T')[0],
        tested_by: user?.employeeId || null,
      });
      setResultRecord(null);
      loadData();
      setSuccessToast('तपासणी निकाल यशस्वीरित्या जतन केला (Result saved successfully).');
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      alert('Error updating result: ' + err.message);
    }
  };

  const handleBulkUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRecords.length === 0) return;
    try {
      await tbService.bulkUpdateResults(
        selectedRecords,
        resultUpdates,
        user?.employeeId || ''
      );
      setIsBulkUpdateModalOpen(false);
      setSelectedRecords([]);
      loadData();
      setSuccessToast('तपासणी निकाल यशस्वीरित्या जतन केले (Bulk results saved successfully).');
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      alert('Error updating results: ' + err.message);
    }
  };

  const toggleSelectAll = () => {
    if (selectedRecords.length === filteredRecords.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(filteredRecords.map(r => r.id));
    }
  };

  const toggleSelectRecord = (id: string) => {
    setSelectedRecords(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const exportCSV = () => {
    if (filteredRecords.length === 0) return;
    const headers = [
      'अ.क्र.', 'संशयित रुग्णाचे नाव', 'वय', 'लिंग', 'मोबाईल', 'निक्षय ID',
      'नमुना घेतल्याचा दिनांक', 'नमुना पाठवण्याचा दिनांक', 'जोखीम प्रकार', 'नमुना प्रकार', 'कोठे दिला'
    ];
    
    const rows = filteredRecords.map((r, index) => [
      index + 1,
      r.patient_name,
      r.age,
      r.gender === 'Male' ? 'पुरुष' : r.gender === 'Female' ? 'स्त्री' : 'इतर',
      r.mobile_number || '-',
      r.nikshay_id || '-',
      formatIndianDate(r.sample_collection_date),
      formatIndianDate(r.sample_sent_date),
      r.risk_type,
      r.sample_type,
      r.sample_given_at === 'PHC_BHADA' ? 'प्राथमिक आरोग्य केंद्र भादा' : r.sample_given_at === 'RURAL_HOSPITAL_AUSA' ? 'ग्रामीण रुग्णालय औसा' : '-'
    ]);

    const csvContent = "\uFEFF" + [
      headers.join(','),
      ...rows.map(row => row.map(v => `"\${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `TB_Register_Report_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html lang="mr">
      <head>
        <meta charset="UTF-8">
        <title>TB Register Print</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
          h1 { text-align: center; color: #065f46; font-size: 18px; margin-bottom: 5px; }
          h2 { text-align: center; color: #334155; font-size: 14px; margin-top: 0; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
          th { background-color: #f8fafc; font-weight: bold; }
          .footer { margin-top: 30px; display: flex; justify-content: space-between; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>राष्ट्रीय क्षयरोग नियंत्रण कार्यक्रम</h1>
        <h2>संशयित रुग्ण नमुना नोंदवही</h2>
        <table>
          <thead>
            <tr>
              <th>अ.क्र.</th>
              <th>संशयित रुग्णाचे नाव</th>
              <th>वय</th>
              <th>लिंग</th>
              <th>मोबाईल</th>
              <th>निक्षय ID</th>
              <th>नमुना दिनांक</th>
              <th>पाठवल्याचा दिनांक</th>
              <th>जोखीम प्रकार</th>
              <th>नमुना प्रकार</th>
              <th>कोठे दिला</th>
            </tr>
          </thead>
          <tbody>
            ${filteredRecords.map((r, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${r.patient_name}</td>
                <td>${r.age}</td>
                <td>${r.gender === 'Male' ? 'पुरुष' : r.gender === 'Female' ? 'स्त्री' : 'इतर'}</td>
                <td>${r.mobile_number || '-'}</td>
                <td>${r.nikshay_id || '-'}</td>
                <td>${formatIndianDate(r.sample_collection_date)}</td>
                <td>${formatIndianDate(r.sample_sent_date)}</td>
                <td>${r.risk_type}</td>
                <td>${r.sample_type}</td>
                <td>${r.sample_given_at === 'PHC_BHADA' ? 'प्राथमिक आरोग्य केंद्र भादा' : r.sample_given_at === 'RURAL_HOSPITAL_AUSA' ? 'ग्रामीण रुग्णालय औसा' : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <div>PHC: ${user?.phcId ? 'भादा' : 'All'}</div>
          <div>Report Date: ${formatIndianDate(new Date().toISOString())}</div>
        </div>
        <script>
          window.onload = () => { window.print(); window.close(); };
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div id="tb-report-container" className="max-w-6xl mx-auto space-y-4 pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-xs border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">TB अहवाल</h1>
            <p className="text-xs text-slate-500">राष्ट्रीय क्षयरोग नियंत्रण कार्यक्रम सांख्यिकी</p>
          </div>
        </div>
        <div className="flex gap-2">
          {selectedRecords.length > 0 && (
            <button 
              onClick={() => setIsBulkUpdateModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm flex items-center gap-2 transition-colors animate-in fade-in"
            >
              <Activity className="w-4 h-4" />
              Update Selected ({selectedRecords.length})
            </button>
          )}
          <button onClick={exportCSV} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm flex items-center gap-2 cursor-pointer transition-colors">
            <Download className="w-4 h-4" /> CSV Export
          </button>
          <button onClick={() => exportElementToPDF('tb-report-container', 'tb-report.pdf', 'l')} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-lg text-sm flex items-center gap-2 cursor-pointer transition-colors">
            <FileText className="w-4 h-4" /> PDF Export
          </button>
          <button onClick={printReport} className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-sm flex items-center gap-2 cursor-pointer transition-colors">
            <Printer className="w-4 h-4" /> Print (A4)
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200">
        <div className={`grid grid-cols-1 ${role === 'phc_controller' ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4`}>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input 
              type="text"
              placeholder="नाव, मोबाईल, निक्षय ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          {role === 'phc_controller' && (
            <select value={selectedVillage} onChange={e => setSelectedVillage(e.target.value)} className="w-full p-2 text-sm border border-slate-300 rounded-lg">
              <option value="">सर्व गावे</option>
              {villages.map(v => (
                <option key={v.id} value={v.id}>{v.nameMarathi || v.village_name}</option>
              ))}
            </select>
          )}
          <select value={selectedSampleType} onChange={e => setSelectedSampleType(e.target.value)} className="w-full p-2 text-sm border border-slate-300 rounded-lg">
            <option value="">सर्व नमुना प्रकार</option>
            <option value="Sputum">Sputum</option>
            <option value="X-Ray">X-Ray</option>
            <option value="LPA">LPA</option>
            <option value="Followup Sputum">Followup Sputum</option>
            <option value="FoodBasket">FoodBasket</option>
          </select>
          <select value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)} className="w-full p-2 text-sm border border-slate-300 rounded-lg">
            <option value="">सर्व लोकेशन्स</option>
            <option value="PHC_BHADA">PHC भादा</option>
            <option value="RURAL_HOSPITAL_AUSA">ग्रामीण रुग्णालय औसा</option>
          </select>
          {resultFields.map(f => {
            let opts: any[] = [];
            try {
              opts = typeof f.options_json === 'string' ? JSON.parse(f.options_json) : (f.options_json || []);
            } catch(e) {}
            return (
              <select
                key={f.id}
                value={selectedResult}
                onChange={e => setSelectedResult(e.target.value)}
                className="w-full p-2 text-sm border border-slate-300 rounded-lg text-teal-700 font-medium"
              >
                <option value="all">सर्व {f.field_label}</option>
                <option value="Pending">Pending</option>
                {opts.map((opt: any, idx: number) => (
                  <option key={idx} value={opt.value || opt.label}>{opt.label}</option>
                ))}
              </select>
            );
          })}
        </div>

        {/* Result Summaries */}
        {resultFields.length > 0 && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-200">
            {resultFields.map(f => {
              let opts: any[] = [];
              try {
                opts = typeof f.options_json === 'string' ? JSON.parse(f.options_json) : (f.options_json || []);
              } catch(e) {}
              
              const pendingCount = filteredRecords.filter(r => !r.test_result || r.test_result === 'Pending').length;
              
              return (
                <div key={`summary-${f.id}`} className="flex flex-wrap items-center gap-2 text-xs font-medium">
                  <span className="text-slate-700 font-bold mr-1">{f.field_label} Summary:</span>
                  <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded shadow-sm border border-amber-200">
                    Pending: {pendingCount}
                  </span>
                  {opts.map((opt: any, idx: number) => {
                    const count = filteredRecords.filter(r => r.test_result === (opt.value || opt.label)).length;
                    if (count === 0) return null;
                    return (
                      <span key={idx} className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded shadow-sm border border-emerald-200">
                        {opt.label}: {count}
                      </span>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                {isPhcController && (
                  <th className="px-4 py-3 text-center w-12">
                    <input 
                      type="checkbox" 
                      checked={selectedRecords.length > 0 && selectedRecords.length === filteredRecords.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                  </th>
                )}
                <th className="px-4 py-3">संशयित रुग्णाचे नाव</th>
                <th className="px-4 py-3 text-center">वय / लिंग</th>
                <th className="px-4 py-3">निक्षय ID</th>
                <th className="px-4 py-3 text-center">नमुना दिनांक</th>
                <th className="px-4 py-3 text-center">प्रकार</th>
                <th className="px-4 py-3">कोठे दिला</th>
                {resultFields.length > 0 && <th className="px-4 py-3 text-center">निकाल (Result)</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={resultFields.length > 0 ? (isPhcController ? 8 : 7) : (isPhcController ? 7 : 6)} className="px-4 py-8 text-center text-slate-500">माहिती लोड होत आहे...</td></tr>
              ) : filteredRecords.length === 0 ? (
                <tr><td colSpan={resultFields.length > 0 ? (isPhcController ? 8 : 7) : (isPhcController ? 7 : 6)} className="px-4 py-8 text-center text-slate-500">कोणतीही नोंद आढळली नाही.</td></tr>
              ) : (
                filteredRecords.map((r, i) => (
                  <tr key={r.id} className={`hover:bg-slate-50/50 transition-colors ${selectedRecords.includes(r.id) ? 'bg-emerald-50/50' : ''}`}>
                    {isPhcController && (
                      <td className="px-4 py-3 text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedRecords.includes(r.id)}
                          onChange={() => toggleSelectRecord(r.id)}
                          className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {r.patient_name}
                      {r.mobile_number && <div className="text-xs text-slate-500 font-normal">{r.mobile_number}</div>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        {r.age} / {r.gender === 'Male' ? 'M' : r.gender === 'Female' ? 'F' : 'O'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{r.nikshay_id || '-'}</td>
                    <td className="px-4 py-3 text-center text-slate-600">
                      {formatIndianDate(r.sample_collection_date)}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">
                      <span className="bg-slate-100 px-2 py-1 rounded text-xs">{r.sample_type}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 truncate max-w-[150px]">
                      {r.sample_given_at === 'PHC_BHADA' ? 'PHC भादा' : r.sample_given_at === 'RURAL_HOSPITAL_AUSA' ? 'ग्रा.रु. औसा' : '-'}
                    </td>
                    {resultFields.length > 0 && (
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${!r.test_result || r.test_result === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {!r.test_result || r.test_result === 'Pending' ? 'Pending' : r.test_result}
                          </span>
                          {isPhcController && (
                            <button
                              onClick={() => {
                                setResultRecord(r);
                                setResultUpdates(r.test_result || 'Pending');
                              }}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              title="निकाल अद्यतनित करा"
                            >
                              <Activity className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Result Modal */}
      {resultRecord && resultFields.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">नोंद दुरुस्ती / Update Result</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {resultRecord.patient_name} 
                  {resultRecord.nikshay_id ? ` - ${resultRecord.nikshay_id}` : ''}
                </p>
              </div>
              <button onClick={() => setResultRecord(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateResult} className="p-5 space-y-4">
              {resultFields.map(f => {
                let options = [];
                try {
                  options = typeof f.options_json === 'string' ? JSON.parse(f.options_json) : (f.options_json || []);
                } catch(e) {}
                
                return (
                  <div key={f.id}>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {f.field_label}
                    </label>
                    <select
                      value={resultUpdates || 'Pending'}
                      onChange={(e) => setResultUpdates(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      required
                    >
                      <option value="Pending">Pending (प्रलंबित)</option>
                      {options.map((opt: any, i: number) => (
                        <option key={i} value={opt.value || opt.label}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
              
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setResultRecord(null)}
                  className="flex-1 px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  सेव्ह करा (Save)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Update Result Modal */}
      {isBulkUpdateModalOpen && resultFields.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">सामूहिक नोंद दुरुस्ती / Bulk Update Results</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  एकूण {selectedRecords.length} नोंदी अद्यतनित केल्या जात आहेत
                </p>
              </div>
              <button onClick={() => setIsBulkUpdateModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleBulkUpdate} className="p-5 space-y-4">
              {resultFields.map(f => {
                let options = [];
                try {
                  options = typeof f.options_json === 'string' ? JSON.parse(f.options_json) : (f.options_json || []);
                } catch(e) {}
                
                return (
                  <div key={`bulk-${f.id}`}>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {f.field_label} (सर्वांसाठी)
                    </label>
                    <select
                      value={resultUpdates || 'Pending'}
                      onChange={(e) => setResultUpdates(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      required
                    >
                      <option value="Pending">Pending (प्रलंबित)</option>
                      {options.map((opt: any, i: number) => (
                        <option key={i} value={opt.value || opt.label}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
              
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsBulkUpdateModalOpen(false)}
                  className="flex-1 px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  सामूहिक बदल करा (Update All)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-4 right-4 z-[60] bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium text-sm">{successToast}</span>
        </div>
      )}
    </div>
  );
};
