const fs = require('fs');
const file = './src/services/templateService.ts';
let content = fs.readFileSync(file, 'utf8');

const validationLogic = `
    // Edit deadline enforcement
    if (isValidUUID(record.id)) {
      let existingCreatedAt = null;
      if (isSupabaseConfigured() && supabase) {
         const { data } = await supabase.from('dynamic_record_entries').select('created_at').eq('id', record.id).single();
         if (data) existingCreatedAt = data.created_at;
      } else {
         let raw = storage.getItem(DYNAMIC_RECORDS_KEY);
         if (raw) {
            let records = JSON.parse(raw);
            const existing = records.find(r => r.id === record.id);
            if (existing) existingCreatedAt = existing.created_at || null;
         }
      }
      
      if (existingCreatedAt) {
        const createdTime = new Date(existingCreatedAt).getTime();
        const diffDays = (Date.now() - createdTime) / (1000 * 60 * 60 * 24);
        const user = authService.getCurrentUser();
        const isPhcController = user?.role === 'phc_controller' || user?.role === 'PHC_CONTROLLER';
        const limitDays = isPhcController ? 30 : 7;
        
        if (diffDays > limitDays) {
           throw new Error('वेळमर्यादा संपली आहे (Time Limit Exceeded). ही जुनी नोंद आता Read Only आहे.');
        }
      }
    }
`;

content = content.replace(
  "    const validId = isValidUUID(record.id) ? record.id : crypto.randomUUID();\n    const cleanRecord",
  validationLogic + "\n    const validId = isValidUUID(record.id) ? record.id : crypto.randomUUID();\n    const cleanRecord"
);

fs.writeFileSync(file, content);
console.log('done');
