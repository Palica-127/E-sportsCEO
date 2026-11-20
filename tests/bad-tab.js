/* Aba que sempre lança erro: o motor deve isolar (console.error uma vez por funcao) e seguir jogando. */
Engine.registerTab('lan', { id: 'ruim', label: 'Ruim', unlock: function () { return true; },
  mount: function () { throw new Error('mount ruim'); }, update: function () { throw new Error('update ruim'); },
  render: function () { throw new Error('render ruim'); }, save: function () { throw new Error('save ruim'); }, load: function () { throw new Error('load ruim'); } });
