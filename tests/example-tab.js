/* Aba de exemplo (Cofre) para a Lan House: exemplo minimo e completo da API (docs/TABS_API.md). */
(function () {
  var box = 0, el = {}, items = [];
  Engine.registerTab('lan', {
    id: 'cofre', label: 'Cofre', icon: '🐷',
    ach: [{ id: 'cofre1', ic: '🐷', n: 'Poupador', d: 'Guarde dinheiro no cofre.' }],
    unlock: function (api) { return api.owned('pc') >= 1; },
    mount: function (root, api) {
      root.innerHTML = '<p id="cf-v"></p><button id="cf-b" class="btn pri" type="button">Guardar</button><ul id="cf-l"></ul>';
      el.v = root.querySelector('#cf-v'); el.l = root.querySelector('#cf-l');
      el.list = api.list(el.l, {
        key: function (it) { return it.id; },
        create: function (it) { var li = document.createElement('li'); return { el: li, update: function (d) { api.ui.text(li, d.label); } }; }
      });
      root.querySelector('#cf-b').addEventListener('click', function () {
        if (!api.spend(10)) { api.toast('Sem dinheiro'); return; }
        box += 10; items.push({ id: 'i' + items.length, label: 'Depósito ' + items.length }); apply(api); api.unlock('cofre1'); api.save(); api.invalidate();
      });
    },
    load: function (d, api) { box = d && d.box || 0; items = d && d.items || []; apply(api); },
    save: function () { return { box: box, items: items }; },
    update: function (dt, api) { box += 0; },
    render: function (api) { api.ui.text(el.v, 'No cofre: ' + api.fmt(box)); el.list.set(items); }
  });
  function apply(api) { api.mult('cofre:bonus', 1 + box / 1000); }
  window.COFRE = { box: function () { return box; } };
})();
