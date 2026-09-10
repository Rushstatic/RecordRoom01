const fs = require('fs');
const file = './src/pages/DynamicReportPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const editLogic = `
  const canEditRecord = (record: DynamicRecordEntry) => {
    if (!record.created_at) return true; // allow edit if date missing
    const createdTime = new Date(record.created_at).getTime();
    const now = Date.now();
    const diffDays = (now - createdTime) / (1000 * 60 * 60 * 24);
    
    if (isPhcController) {
      return diffDays <= 30; // 1 month approx
    } else {
      return diffDays <= 7;  // 7 days for employee
    }
  };
`;

// Insert after `const isPhcController = ...`
content = content.replace(
  "const isPhcController = role === 'phc_controller' || user?.role === 'phc_controller';",
  "const isPhcController = role === 'phc_controller' || user?.role === 'phc_controller';\n" + editLogic
);

const actionButtons = `
                    <button 
                      onClick={() => setViewRecord(r)}
                      className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded" 
                      title="पहा"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {canEditRecord(r) ? (
                      <button 
                        onClick={() => setEditRecord(r)}
                        className="p-1 text-indigo-600 hover:bg-indigo-50 rounded" 
                        title="संपादित करा"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium border border-slate-200">
                        Read Only
                      </span>
                    )}
`;

content = content.replace(
  /<button \n\s*onClick=\{\(\) => setViewRecord\(r\)\}([\s\S]*?)<Edit3 className="w-4 h-4" \/>\n\s*<\/button>/g,
  actionButtons
);

fs.writeFileSync(file, content);
console.log('done');
