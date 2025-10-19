const fs = require('fs');
const path = require('path');

// --- IMPOSTAZIONI ---
const BASE_URL = 'https://www.grazianagarbeni.com';

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
if (fs.existsSync(DIST_DIR)) { fs.rmSync(DIST_DIR, { recursive: true, force: true }); }
fs.mkdirSync(DIST_DIR, { recursive: true });

// 2. Leggi i dati e i template
const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
const operaTemplate = fs.readFileSync(OPERA_TEMPLATE, 'utf-8');
const paginaFissaTemplate = fs.readFileSync(PAGINA_FISSA_TEMPLATE, 'utf-8');
const indexTemplate = fs.readFileSync(INDEX_TEMPLATE, 'utf-8');

// 3. Funzione helper per i meta tag
function replacePlaceholders(html, item) {
    const pageUrl = (item.slug === 'index') ? BASE_URL + '/' : `${BASE_URL}/${item.slug}.html`;
    let imageUrl = `${BASE_URL}/immagini/static/header.png`;
    if (item.og_image && (item.immagine_fissa || item.slug === 'index')) { imageUrl = `${BASE_URL}/immagini/static/${item.og_image}`; }
    else if (item.og_image && item.immagini) { imageUrl = `${BASE_URL}/immagini/${item.slug}/${item.og_image}`; }
    const metaTitle = item.meta_title || `${item.titolo} | Graziana Garbeni`;
    const metaDescription = item.meta_description || `Scopri l'opera "${item.titolo}", un pezzo unico realizzato dall'artista visuale Graziana Garbeni.`;
    return html
        .replace(/{{META_TITLE}}/g, metaTitle)
        .replace(/{{META_DESCRIPTION}}/g, metaDescription)
        .replace(/{{OG_URL}}/g, pageUrl)
        .replace(/{{OG_IMAGE_URL}}/g, imageUrl)
        .replace(/{{TITOLO}}/g, item.titolo);
}

// 4. Funzione per generare l'header dinamicamente con la classe attiva
function generateHeaderNav(activeSlug) {
    let menuHtml = '';
    data.forEach(item => {
        if (item.is_on_menu) {
            const link = item.menu_link || `${item.slug}.html`;
            const liClass = (item.slug === activeSlug) ? ' class="is-active"' : '';
            menuHtml += `<li${liClass}><a href="${link}">${item.titolo}</a></li>`;
        }
    });
    return `
        <header class="main-header">
            <img src="/immagini/static/header.png" alt="GrazianaGarbeni">
        </header>
        <nav class="main-nav">
            <a href="/" class="nav-logo">
                <img src="/immagini/static/logo-trasp.png" alt="GrazianaGarbeni">
            </a>
            <div class="nav-menu">
                <ul>${menuHtml}</ul>
            </div>
        </nav>
    `;
}

// 5. Genera tutte le pagine
let grigliaOpereHtml = '';
data.forEach(item => {
    let paginaHtml;
    const headerNavHtml = generateHeaderNav(item.slug);

    if (item.immagine_fissa) {
        paginaHtml = paginaFissaTemplate
            .replace('{{HEADER_NAV_HTML}}', headerNavHtml)
            .replace('{{DESCRIZIONE}}', item.descrizione)
            .replace('{{IMMAGINE_FISSA}}', item.immagine_fissa);
        paginaHtml = replacePlaceholders(paginaHtml, item);
        fs.writeFileSync(path.join(DIST_DIR, `${item.slug}.html`), paginaHtml);
        console.log(`✅ Creata pagina fissa: ${item.slug}.html`);
    } else if (item.immagini) {
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
const homepageHeaderNav = generateHeaderNav(homepageData.slug);
let indexHtmlFinale = indexTemplate
    .replace('{{HEADER_NAV_HTML}}', homepageHeaderNav)
    .replace('{{GRIGLIA_OPERE_HTML}}', grigliaOpereHtml);
indexHtmlFinale = replacePlaceholders(indexHtmlFinale, homepageData);
fs.writeFileSync(path.join(DIST_DIR, 'index.html'), indexHtmlFinale);
console.log(`✅ Creata pagina: index.html`);

// 7. Copia gli asset
fs.cpSync(ASSETS_DIR.css, path.join(DIST_DIR, 'css'), { recursive: true });
fs.cpSync(ASSETS_DIR.immagini, path.join(DIST_DIR, 'immagini'), { recursive: true });
fs.copyFileSync(path.join(__dirname, '..', '_assets', 'favicon.ico'), path.join(DIST_DIR, 'favicon.ico'));
console.log('✅ Copiati asset: css, immagini, favicon');

console.log('\n🚀 Build completato con successo!');