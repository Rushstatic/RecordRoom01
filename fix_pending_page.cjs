const fs = require('fs');
const file = './src/pages/PendingDynamicRecordsPage.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("templateService.getAllTemplates()", "templateService.getTemplates()");

const fixedSave = `
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
`;

content = content.replace(
  /const handleEditSave = async \(updatedData: any, printed: boolean\) => \{[\s\S]*?\};/,
  fixedSave
);

fs.writeFileSync(file, content);
console.log('done');
