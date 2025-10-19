const { execSync } = require('child_process');

try {
    console.log('🚀 Inizio del deploy...');
    
    // 1. Esegui lo script di build
    console.log('   Eseguo il build del sito...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // 2. Aggiungi tutti i file e fai il commit
    console.log('   Aggiungo e committo i file...');
    const commitMessage = `Deploy automatico: ${new Date().toISOString()}`;
    execSync('git add dist _data immagini', { stdio: 'inherit' }); // Specifica cosa aggiungere
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
    
    // 3. Fai il push
    console.log('   Eseguo il push su GitHub...');
    execSync('git push', { stdio: 'inherit' });
    
    console.log('✅ Deploy completato!');

} catch (error) {
    console.error('❌ Errore durante il deploy:', error.message);
    process.exit(1);
}