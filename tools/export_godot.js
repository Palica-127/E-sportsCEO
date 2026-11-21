// Exporta js/data/*.js (window.X = ...) para JSON em godot/data (usado pelo port Godot).
const fs = require('fs'), vm = require('vm'), path = require('path');
const dir = path.join(__dirname, '..', 'js', 'data'), out = path.join(__dirname, '..', 'godot', 'data');
fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.js'))) {
  const w = {}; vm.runInNewContext(fs.readFileSync(path.join(dir, f), 'utf8'), { window: w });
  for (const k of Object.keys(w)) { fs.writeFileSync(path.join(out, f.replace('.js', '') + '.' + k + '.json'), JSON.stringify(w[k])); }
}
