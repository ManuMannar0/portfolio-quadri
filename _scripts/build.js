const fs = require('fs');
const path = require('path');

// --- IMPOSTAZIONI ---
const BASE_URL = 'https://www.grazianagarbeni.com'; // Il tuo dominio finale

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

// 3. Funzione helper per sostituire tutti i segnaposto, con logica di fallback
function replacePlaceholders(html, item) {
    const pageUrl = (item.slug === 'index') ? BASE_URL + '/' : `${BASE_URL}/${item.slug}.html`;
    
    let imageUrl = `${BASE_URL}/immagini/static/header.png`; // Immagine di fallback
    if (item.og_image && (item.immagine_fissa || item.slug === 'index')) {
        imageUrl = `${BASE_URL}/immagini/static/${item.og_image}`;
    } else if (item.og_image && item.immagini) {
        imageUrl = `${BASE_URL}/immagini/${item.slug}/${item.og_image}`;
    }

    // Logica di fallback per i meta tag
    const metaTitle = item.meta_title || `${item.titolo} | Graziana Garbeni`;
    const metaDescription = item.meta_description || `Scopri l'opera dell'artista visuale Graziana Garbeni.`;
    // const metaDescription = item.meta_description || `Scopri l'opera "${item.titolo}", un pezzo unico realizzato dall'artista visuale Graziana Garbeni.`;

    return html
        .replace(/{{META_TITLE}}/g, metaTitle)
        .replace(/{{META_DESCRIPTION}}/g, metaDescription)
        .replace(/{{OG_URL}}/g, pageUrl)
        .replace(/{{OG_IMAGE_URL}}/g, imageUrl)
        .replace(/{{TITOLO}}/g, item.titolo); // Per gli H1
}

// 4. Genera dinamicamente il menu di navigazione
let menuHtml = '';
data.forEach(item => {
    if (item.is_on_menu) {
        const link = item.menu_link || `${item.slug}.html`;
        menuHtml += `<li><a href="${link}">${item.titolo}</a></li>`;
    }
});

const headerNavHtml = `
    <header class="main-header">
        <img src="/immagini/static/header.png" alt="Logo principale dell'artista">
    </header>
    <nav class="main-nav">
        <a href="/" class="nav-logo">
            <img src="https://mr.bingo/wp-content/themes/bingo/images/bingo_logo.png" alt="Logo piccolo">
        </a>
        <div class="nav-menu">
            <ul>${menuHtml}</ul>
        </div>
    </nav>
`;

// 5. Genera tutte le pagine e la griglia
let grigliaOpereHtml = '';
data.forEach(item => {
    let paginaHtml;

    if (item.immagine_fissa) { // Pagina fissa
        paginaHtml = paginaFissaTemplate
            .replace('{{HEADER_NAV_HTML}}', headerNavHtml)
            .replace('{{DESCRIZIONE}}', item.descrizione)
            .replace('{{IMMAGINE_FISSA}}', item.immagine_fissa);
        paginaHtml = replacePlaceholders(paginaHtml, item);
        fs.writeFileSync(path.join(DIST_DIR, `${item.slug}.html`), paginaHtml);
        console.log(`✅ Creata pagina fissa: ${item.slug}.html`);
    } else if (item.immagini) { // Opera
        let immaginiHtml = '';
        item.immagini.forEach(img => {
            immaginiHtml += `<div class="artwork-images"><img src="immagini/${item.slug}/${img}" alt="${item.titolo}"></div>`;
        });
        paginaHtml = operaTemplate
            .replace('{{HEADER_NAV_HTML}}', headerNavHtml)
            .replace('{{DESCRIZIONE}}', item.descrizione)
            .replace('{{IMMAGINI_HTML}}', immaginiHtml);
        paginaHtml = replacePlaceholders(paginaHtml, item);
        fs.writeFileSync(path.join(DIST_DIR, `${item.slug}.html`), paginaHtml);
        console.log(`✅ Creata pagina opera: ${item.slug}.html`);
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
});

// 6. Genera la homepage
const homepageData = data.find(item => item.slug === 'index');
let indexHtmlFinale = indexTemplate
    .replace('{{HEADER_NAV_HTML}}', headerNavHtml)
    .replace('{{GRIGLIA_OPERE_HTML}}', grigliaOpereHtml);
indexHtmlFinale = replacePlaceholders(indexHtmlFinale, homepageData);
fs.writeFileSync(path.join(DIST_DIR, 'index.html'), indexHtmlFinale);
console.log(`✅ Creata pagina: index.html`);

// 7. Copia gli asset
fs.cpSync(ASSETS_DIR.css, path.join(DIST_DIR, 'css'), { recursive: true });
fs.cpSync(ASSETS_DIR.immagini, path.join(DIST_DIR, 'immagini'), { recursive: true });
console.log('✅ Copiati asset: css, immagini');

console.log('\n🚀 Build completato con successo!');