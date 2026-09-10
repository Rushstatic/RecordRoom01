const fs = require('fs');
const file = './src/services/templateService.ts';
let content = fs.readFileSync(file, 'utf8');

const autoNumLogic = `
    const isNewRecord = !isValidUUID(record.id);
    const validId = isValidUUID(record.id) ? record.id : crypto.randomUUID();
    const cleanRecord: DynamicRecordEntry = {
      ...record,
      id: validId,
      updated_at: new Date().toISOString()
    };
    
    if (isNewRecord) {
      // Find auto_number fields for this template
      const templateFields = await this.getTemplateFields(cleanRecord.template_id);
      const autoNumFields = templateFields.filter(f => f.field_type === 'auto_number');
      
      if (autoNumFields.length > 0) {
        // Fetch existing records for this template to calculate next number
        const allRecords = await this.getDynamicRecords(cleanRecord.template_id);
        const recordDate = cleanRecord.record_date || new Date().toISOString().split('T')[0];
        const recordYear = new Date(recordDate).getFullYear();
        
        for (const f of autoNumFields) {
          if (!cleanRecord.record_data) cleanRecord.record_data = {};
          
          let parsedConfig = { prefix: '', format: '0001', scope: 'register', reset: 'never' };
          if (typeof f.automation_json === 'string') {
            try { parsedConfig = JSON.parse(f.automation_json); } catch(e){}
          } else if (f.automation_json) {
            parsedConfig = f.automation_json as any;
          }
          
          let scopeRecords = allRecords;
          // Apply scope filter
          if (parsedConfig.scope === 'employee') {
             scopeRecords = scopeRecords.filter(r => r.employee_id === cleanRecord.employee_id);
          } else if (parsedConfig.scope === 'village') {
             scopeRecords = scopeRecords.filter(r => r.village_id === cleanRecord.village_id);
          }
          
          // Apply reset filter
          if (parsedConfig.reset === 'yearly') {
             scopeRecords = scopeRecords.filter(r => {
                const rDate = r.record_date || r.created_at;
                return rDate ? new Date(rDate).getFullYear() === recordYear : false;
             });
          }
          
          // Determine next number
          let maxNum = 0;
          scopeRecords.forEach(r => {
             const val = r.record_data ? r.record_data[f.field_key] : null;
             if (val && typeof val === 'string') {
                // Extract just the number part
                let numStr = val;
                if (parsedConfig.prefix) {
                   if (val.startsWith(parsedConfig.prefix)) {
                      numStr = val.substring(parsedConfig.prefix.length);
                   }
                }
                const num = parseInt(numStr.replace(/\\D/g, ''), 10);
                if (!isNaN(num) && num > maxNum) {
                   maxNum = num;
                }
             }
          });
          
          const nextNum = maxNum + 1;
          const formatLength = parsedConfig.format ? parsedConfig.format.length : 4;
          const paddedNum = String(nextNum).padStart(formatLength, '0');
          const finalValue = \`\${parsedConfig.prefix || ''}\${paddedNum}\`;
          
          cleanRecord.record_data[f.field_key] = finalValue;
        }
      }
    }
`;

content = content.replace(
  "    const validId = isValidUUID(record.id) ? record.id : crypto.randomUUID();\n    const cleanRecord: DynamicRecordEntry = {\n      ...record,\n      id: validId,\n      updated_at: new Date().toISOString()\n    };",
  autoNumLogic
);

fs.writeFileSync(file, content);
console.log('done');
