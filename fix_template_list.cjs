const fs = require('fs');
const file = './src/pages/TemplateBuilderPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `
                            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                              {t.register_code}
                            </span>
                            {t.register_type && (
                              <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                                {t.register_type}
                              </span>
                            )}
`;

content = content.replace(
  `<span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                              {t.register_code}
                            </span>`,
  replacement
);

fs.writeFileSync(file, content);
console.log('done');
