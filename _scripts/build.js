const fs = require('fs');
const path = require('path');

// Definiamo i percorsi
const DATA_FILE = path.join(__dirname, '..', '_data', 'opere.json');
const OPERA_TEMPLATE = path.join(__dirname, '..', '_templates', 'template-opera.html');
const PAGINA_FISSA_TEMPLATE = path.join(__dirname, '..', '_templates', 'template-pagina-fissa.html');
const INDEX_TEMPLATE = path.join(__dirname, '..', '_templates', 'template-index.html');
const DIST_DIR = path.join(__dirname, '..', 'dist');
const ASSETS_DIR = {
    css: path.join(__dirname, '..', 'css'),
    immagini: path.join(__dirname, '..', 'immagini')
};

// 1. Pulisci e ricrea la cartella 'dist'
if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR, { recursive: true });

// 2. Leggi i dati e i template
const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
const operaTemplate = fs.readFileSync(OPERA_TEMPLATE, 'utf-8');
const paginaFissaTemplate = fs.readFileSync(PAGINA_FISSA_TEMPLATE, 'utf-8');
const indexTemplate = fs.readFileSync(INDEX_TEMPLATE, 'utf-8');

// 3. Genera dinamicamente il menu di navigazione
let menuHtml = '';
data.forEach(item => {
    if (item.is_on_menu) {
        // Usa menu_link per URL personalizzati (es. "/"), altrimenti costruisci il link dallo slug
        const link = item.menu_link || `${item.slug}.html`;
        menuHtml += `<li><a href="${link}">${item.titolo}</a></li>`;
    }
});

// Costruisci l'HTML completo per header e nav, che verrà riutilizzato in tutti i template
const headerNavHtml = `
    <header class="main-header">
        <img src="./immagini/static/header.png" alt="GrazianaGarbeni">
    </header>
    <nav class="main-nav">
        <a href="/" class="nav-logo">
            <img src="./immagini/static/logo.png" alt="GrazianaGarbeni">
        </a>
        <div class="nav-menu">
            <ul>${menuHtml}</ul>
        </div>
    </nav>
`;

// 4. Genera tutte le pagine e la griglia per la homepage
let grigliaOpereHtml = '';

data.forEach(item => {
    let paginaHtml;

    // A. Controlla se è una PAGINA FISSA (es. About, Contatti)
    if (item.immagine_fissa) {
        paginaHtml = paginaFissaTemplate
            .replace('{{HEADER_NAV_HTML}}', headerNavHtml)
            .replace(/{{TITOLO}}/g, item.titolo)
            .replace('{{DESCRIZIONE}}', item.descrizione)
            .replace('{{IMMAGINE_FISSA}}', item.immagine_fissa);
        
        fs.writeFileSync(path.join(DIST_DIR, `${item.slug}.html`), paginaHtml);
        console.log(`✅ Creata pagina fissa: ${item.slug}.html`);
    
    // B. Controlla se è un'OPERA da mostrare nella griglia
    } else if (item.immagini) {
        let immaginiHtml = '';
        item.immagini.forEach(img => {
            immaginiHtml += `<div class="artwork-images"><img src="immagini/${item.slug}/${img}" alt="${item.titolo}"></div>`;
        });
        
        paginaHtml = operaTemplate
            .replace('{{HEADER_NAV_HTML}}', headerNavHtml)
            .replace(/{{TITOLO}}/g, item.titolo)
            .replace('{{DESCRIZIONE}}', item.descrizione)
            .replace('{{IMMAGINI_HTML}}', immaginiHtml);

        fs.writeFileSync(path.join(DIST_DIR, `${item.slug}.html`), paginaHtml);
        console.log(`✅ Creata pagina opera: ${item.slug}.html`);

        // Aggiungi questa opera alla griglia per la homepage
        grigliaOpereHtml += `
            <div class="portfolio-item">
                <a href="${item.slug}.html">
                    <div class="image-container">
                        <img src="immagini/${item.slug}/${item.immagini[0]}" alt="${item.titolo}">
                        <p class="project-title">${item.titolo}</p>
                    </div>
                </a>
            </div>`;
    }
    // Nota: gli elementi che non sono né pagine fisse né opere (es. l'oggetto "Work" del menu) vengono ignorati qui.
});

// 5. Genera la homepage (index.html)
const indexHtmlFinale = indexTemplate
    .replace('{{HEADER_NAV_HTML}}', headerNavHtml)
    .replace('{{GRIGLIA_OPERE_HTML}}', grigliaOpereHtml);
fs.writeFileSync(path.join(DIST_DIR, 'index.html'), indexHtmlFinale);
console.log('✅ Creata pagina: index.html');

// 6. Copia gli asset (CSS e Immagini)
fs.cpSync(ASSETS_DIR.css, path.join(DIST_DIR, 'css'), { recursive: true });
fs.cpSync(ASSETS_DIR.immagini, path.join(DIST_DIR, 'immagini'), { recursive: true });
console.log('✅ Copiati asset: css, immagini');

console.log('\n🚀 Build completato con successo!');