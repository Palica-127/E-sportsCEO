// copia o build web (../dist) para desktop/app e o ícone
const fs = require('node:fs');
const path = require('node:path');
const dist = path.join(__dirname, '..', 'dist');
const app = path.join(__dirname, 'app');
if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error('Rode "npm run build" na raiz do projeto antes.');
  process.exit(1);
}
fs.rmSync(app, { recursive: true, force: true });
fs.cpSync(dist, app, { recursive: true });
fs.rmSync(path.join(app, 'sw.js'), { force: true }); // service worker não é usado no PC
fs.copyFileSync(path.join(__dirname, '..', 'public', 'icons', 'icon-512.png'), path.join(__dirname, 'icon.png'));
console.log('Build copiado para desktop/app');
