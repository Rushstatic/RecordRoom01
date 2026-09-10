const fs = require('fs');
const file = './src/pages/AdminDashboardPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const newBtn = `
          <button
            onClick={() => onNavigate('pending-dynamic-records')}
            className="flex flex-col items-center text-center p-4 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-xs font-bold text-slate-700">Pending Results</span>
          </button>
`;

content = content.replace(
  "        <div className=\"grid grid-cols-1 sm:grid-cols-3 gap-4\">",
  "        <div className=\"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4\">\n" + newBtn
);

fs.writeFileSync(file, content);
console.log('done');
