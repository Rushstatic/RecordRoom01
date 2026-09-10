const fs = require('fs');
const file = './src/pages/DashboardPage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "        <div className=\"grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4\">",
  "        <div className=\"grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4\">"
);

const newCard = `
          {/* 5. Pending Results (Dynamic) */}
          <div
            onClick={() => onNavigate('pending-dynamic-records')}
            className="bg-white rounded-xl border-2 border-amber-300 p-4 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between bg-amber-50/40"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-950 leading-tight">Pending Results</span>
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-900 group-hover:bg-amber-200 transition-colors">
                <Clock className="w-4 h-4 text-amber-900" />
              </div>
            </div>
            <div>
              <div className="text-[11px] text-amber-800 font-semibold mt-0.5 flex items-center justify-between">
                <span>डायनॅमिक नोंदी (प्रलंबित)</span>
                <span className="text-[10px] text-amber-900 underline font-bold">View →</span>
              </div>
            </div>
          </div>
`;

content = content.replace(
  "              <div className=\"text-[11px] text-amber-800 font-semibold mt-0.5 flex items-center justify-between\">\n                <span>पाठविणे प्रलंबित</span>\n                <span className=\"text-[10px] text-amber-900 underline font-bold\">पाठवा →</span>\n              </div>\n            </div>\n          </div>",
  "              <div className=\"text-[11px] text-amber-800 font-semibold mt-0.5 flex items-center justify-between\">\n                <span>पाठविणे प्रलंबित</span>\n                <span className=\"text-[10px] text-amber-900 underline font-bold\">पाठवा →</span>\n              </div>\n            </div>\n          </div>\n" + newCard
);

fs.writeFileSync(file, content);
console.log('done');
