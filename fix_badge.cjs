const fs = require('fs');
const file = './src/pages/TemplateBuilderPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const newBadge = `
                            {t.register_type && (
                              <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                                {t.register_type}
                              </span>
                            )}
                            {t.usage_type && (
                              <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200">
                                {t.usage_type}
                              </span>
                            )}
`;

content = content.replace(
  /\{t\.register_type && \(\s*<span className="text-\[11px\] px-1\.5 py-0\.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">\s*\{t\.register_type\}\s*<\/span>\s*\)\}/g,
  newBadge
);

fs.writeFileSync(file, content);
console.log('done');
