const fs = require('fs');
const file = './src/pages/DynamicReportPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const summaryUI = `
        {/* Result Summaries */}
        {resultFields.length > 0 && (
          <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-slate-300">
            {resultFields.map(f => {
              const opts = f.options_json || [];
              return (
                <div key={f.id} className="flex gap-2 text-xs font-medium">
                  <span className="text-slate-600">{f.field_label}:</span>
                  {opts.map((opt: any, idx: number) => {
                    const count = filteredRecords.filter(r => (r.record_data || {})[f.field_key] === (opt.value || opt.label)).length;
                    return (
                      <span key={idx} className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded">
                        {opt.label}: {count}
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
`;

content = content.replace(
  "</div>\n      </div>\n\n      {/* Filters (Hidden in print) */}",
  "</div>\n" + summaryUI + "\n      </div>\n\n      {/* Filters (Hidden in print) */}"
);

fs.writeFileSync(file, content);
console.log('done');
