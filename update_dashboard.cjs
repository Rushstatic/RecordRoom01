const fs = require('fs');

const file = 'src/pages/DashboardPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const s = content.indexOf('  return (\n    <div className="space-y-6">');

const injection = `  if (!isPhcController) {
    return (
      <div className="space-y-6 pb-12 max-w-lg mx-auto p-2">
        {/* Simple Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-emerald-950 rounded-2xl p-6 text-white shadow-md border border-emerald-700/80">
          <h2 className="text-2xl font-bold tracking-tight">
            नमस्कार, {user?.marathiName || user?.name || 'कर्मचारी'}
          </h2>
          <p className="text-sm text-emerald-100/90 mt-2">
            आरोग्य उपकेंद्र - दैनिक कामकाज
          </p>
        </div>

        {/* 1. 📝 आजची Data Entry */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">📝</span> आजची Data Entry
          </h3>
          <div className="space-y-3">
             <button
                onClick={() => onNavigate('daily-work')}
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-base px-4 py-3.5 rounded-xl shadow-md flex items-center justify-between transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <PlusCircle className="w-5 h-5" />
                  <span>नवीन नोंद करा</span>
                </div>
                <ArrowRight className="w-5 h-5 opacity-70" />
              </button>
             <button
                onClick={() => onNavigate('dynamic-registers')}
                className="w-full bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-bold text-base px-4 py-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                  <span>उपलब्ध Dynamic Registers</span>
                </div>
                <ArrowRight className="w-5 h-5 opacity-70" />
              </button>
          </div>
        </div>

        {/* 2. ⏳ Pending */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
           <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">⏳</span> Pending
          </h3>
          <div className="flex items-center justify-between bg-amber-50 rounded-xl border border-amber-200 p-4">
             <div className="flex flex-col">
               <span className="text-3xl font-black text-amber-700">{pendingSamplesCount}</span>
               <span className="text-sm font-semibold text-amber-900">Pending records</span>
             </div>
             <button
                onClick={() => onNavigate('send-samples')}
                className="bg-amber-100 hover:bg-amber-200 active:bg-amber-300 text-amber-900 font-bold text-sm px-4 py-2.5 rounded-lg shadow-xs border border-amber-300 transition-colors cursor-pointer"
             >
               View Pending
             </button>
          </div>
        </div>

        {/* 3. 📊 Reports */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
           <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">📊</span> Reports
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             <button
                onClick={() => onNavigate('reports')}
                className="bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-bold text-sm px-4 py-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Calendar className="w-5 h-5 text-blue-600" />
                <span>आजचा अहवाल</span>
              </button>
             <button
                onClick={() => onNavigate('reports')}
                className="bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-bold text-sm px-4 py-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <span>या महिन्याचा अहवाल</span>
              </button>
          </div>
        </div>
      </div>
    );
  }

`;

content = content.substring(0, s) + injection + content.substring(s);
fs.writeFileSync(file, content);
console.log('Updated dashboard');
