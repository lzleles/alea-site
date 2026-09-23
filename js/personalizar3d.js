/* CATALOGO:
   nome: personalizar3d
   categoria: UTIL
   objetivo: Janela "Personalize aqui" da página de produto: a peça em 3D (do arquivo do Cassiano), girando,
             com o nome do pet GRAVADO ao vivo enquanto a pessoa digita e as cores trocando na hora.
   entrada: ALEA.modelos3d[slug] (config.js): o .glb (corpo sem nome, zonas topo/principal/base) e o
            _nome.json (onde e como o nome original estava gravado), a fonte da gravação (.otf)
   saida: a janela (modal) e, ao fechar, o nome digitado de volta no campo "Nome do pet"
   status: protótipo (23/09/2026) — só o Luke (Bowl Wave G) e só a aba Fosco com 5 cores
   validado_em: 23/09/2026 (teste headless: abre, grava o nome, troca a cor, 0 erro de script)
*/
/* =============================================================================
   O QUE ELE PEDIU (áudio de 23/09/2026, 14:27)
   -----------------------------------------------------------------------------
   "A gente clica no personalizar e aí abre uma segunda aba, não de tela cheia, pro cliente não sair
    daquela janela, mas uma aba menor, fazendo a janela do fundo ficar embaçada (...) Nome do pet:
    enquanto ele escreve o nome do pet, você vai mudar lá na peça (...) E também você vai deixar a cor
    original (...) laranja, branca e cinza. Só que você já vai colocar do lado (...) só a aba dos foscos
    agora (...) conforme eu mudar na aba de fosco, você vai mudar o desenho da esquerda automaticamente."

   COMO FUNCIONA
   - O .glb é o próprio arquivo dele (3mf -> Blender, exportar_glb_configurador_v1.py), SEM o nome.
   - O nome é gravado aqui mesmo: o texto vira sólido (fonte Defante, a do arquivo) e é SUBTRAÍDO da peça
     (three-bvh-csg), no mesmo lugar, tamanho e profundidade do nome original ("Luke"). O fundo da letra
     fica na cor da peça, como na impressão ("nome em baixo relevo na cor do objeto").
   - three.js só é baixado quando a janela abre: quem não clica não paga nada de carregamento.
   ============================================================================= */
var CDN = 'https://cdn.jsdelivr.net/npm/';
var VERSOES = {
  three: CDN + 'three@0.170.0/build/three.module.js',
  addons: CDN + 'three@0.170.0/examples/jsm/',
  bvh: CDN + 'three-mesh-bvh@0.8.3/build/index.module.js',
  csg: CDN + 'three-bvh-csg@0.0.17/build/index.module.js'
};

/* import map: as bibliotecas se pedem por nome ("three"); precisa existir ANTES do primeiro import de módulo */
export function prepararImportMap() {
  if (document.querySelector('script[type="importmap"][data-alea]')) return;
  var s = document.createElement('script');
  s.type = 'importmap';
  s.setAttribute('data-alea', '');
  s.textContent = JSON.stringify({ imports: {
    'three': VERSOES.three, 'three/addons/': VERSOES.addons,
    'three-mesh-bvh': VERSOES.bvh, 'three-bvh-csg': VERSOES.csg } });
  document.head.appendChild(s);
}

var ACABAMENTO_MATERIAL = {           // como cada acabamento reflete a luz
  fosco:      { roughness: 0.88, metalness: 0.0 },
  basico:     { roughness: 0.5,  metalness: 0.0 },
  perolizado: { roughness: 0.28, metalness: 0.35 }
};

export async function abrirJanela3D(cfg, aoFechar) {
  var THREE = await import('three');
  var { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  var { TTFLoader } = await import('three/addons/loaders/TTFLoader.js');
  var { Font } = await import('three/addons/loaders/FontLoader.js');
  var { TextGeometry } = await import('three/addons/geometries/TextGeometry.js');
  var { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
  var { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
  var { mergeVertices } = await import('three/addons/utils/BufferGeometryUtils.js');
  var { TessellateModifier } = await import('three/addons/modifiers/TessellateModifier.js');
  var CSG = await import('three-bvh-csg');

  /* ---------------- a janela */
  var fundo = document.createElement('div');
  fundo.className = 'janela3d-fundo';
  fundo.innerHTML =
    '<div class="janela3d" role="dialog" aria-modal="true" aria-label="Personalize sua peça">' +
      '<button type="button" class="janela3d-fechar" aria-label="Fechar">&times;</button>' +
      '<div class="janela3d-palco"><canvas></canvas><p class="janela3d-dica">Arraste para girar</p>' +
        '<p class="janela3d-carregando">Carregando a peça…</p></div>' +
      '<div class="janela3d-lado">' +
        '<h2>Personalize</h2>' +
        '<label class="janela3d-rotulo">Nome do pet<input type="text" maxlength="18" data-j3-nome placeholder="Digite aqui."></label>' +
        '<div class="janela3d-abas" role="tablist"></div>' +
        '<div class="janela3d-zonas"></div>' +
        '<p class="janela3d-aviso">Simulação. A cor na tela pode variar um pouco da peça real.</p>' +
        '<button type="button" class="botao janela3d-pronto">Pronto</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(fundo);
  document.documentElement.classList.add('janela3d-aberta');
  requestAnimationFrame(function () { fundo.classList.add('visivel'); });
  var canvas = fundo.querySelector('canvas');
  var palco = fundo.querySelector('.janela3d-palco');

  /* ---------------- cena */
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 0.85;
  var cena = new THREE.Scene();
  var pmrem = new THREE.PMREMGenerator(renderer);
  cena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  cena.environmentIntensity = 0.7;
  /* uma luz de estúdio de cima-esquerda: é ela que desenha a sombra dentro das letras gravadas */
  var luzChave = new THREE.DirectionalLight(0xffffff, 1.6); luzChave.position.set(-0.4, 0.6, 0.5); cena.add(luzChave);
  var camera = new THREE.PerspectiveCamera(28, 1, 0.01, 10);
  var controles = new OrbitControls(camera, canvas);
  controles.enableDamping = true; controles.enablePan = false;
  controles.autoRotate = !/debug3d/.test(location.search); controles.autoRotateSpeed = 1.2;
  controles.minDistance = 0.25; controles.maxDistance = 1.2;
  controles.addEventListener('start', function () { controles.autoRotate = false; });

  function redimensionar() {
    var w = palco.clientWidth, h = palco.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', redimensionar);
  redimensionar();

  var vivo = true;
  (function laco() { if (!vivo) return; controles.update(); renderer.render(cena, camera); requestAnimationFrame(laco); })();

  /* ---------------- materiais por zona (topo / principal / base) */
  function material(hex, acab) {
    /* flatShading: a peça é FACETADA de verdade, e a normal vem da própria face (os cortes do CSG deixavam pontinhos
       de luz errada); DoubleSide: fresta mínima do corte mostra a parede, não o fundo preto */
    var m = new THREE.MeshStandardMaterial(Object.assign({ color: new THREE.Color(hex), flatShading: true, side: THREE.DoubleSide },
      ACABAMENTO_MATERIAL[acab] || ACABAMENTO_MATERIAL.fosco));
    m.userData.acab = acab; return m;
  }
  var mats = {};
  Object.keys(cfg.original).forEach(function (z) { mats[z] = material(cfg.original[z].hex, cfg.original[z].acabamento); });
  /* as paredes de DENTRO da letra: a mesma cor da peça, um pouco mais escura (na peça real é a sombra da gravação) */
  var matLetra = mats.principal.clone();
  function acertarLetra() { matLetra.color.copy(mats.principal.color).multiplyScalar(0.72); matLetra.roughness = mats.principal.roughness; matLetra.metalness = mats.principal.metalness; }
  acertarLetra();

  /* ---------------- a peça e o quadro do nome */
  var [gltf, quadro, fonteBin] = await Promise.all([
    new GLTFLoader().loadAsync(cfg.glb),
    fetch(cfg.nome).then(function (r) { return r.json(); }),
    new Promise(function (ok, erro) { new TTFLoader().load(cfg.fonte, ok, undefined, erro); })
  ]);
  var fonte = new Font(fonteBin);
  /* o glTF traz UMA malha por zona (uma por material); aqui viram UMA geometria com um grupo por zona
     (o CSG e a troca de cor trabalham por grupo) */
  var { mergeGeometries } = await import('three/addons/utils/BufferGeometryUtils.js');
  var partes = [], zonaPorGrupo = [];
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse(function (o) {
    if (!o.isMesh) return;
    var g = o.geometry.clone().applyMatrix4(o.matrixWorld);
    Object.keys(g.attributes).forEach(function (a) { if (a !== 'position' && a !== 'normal') g.deleteAttribute(a); });
    if (!g.attributes.normal) g.computeVertexNormals();
    g.clearGroups();
    partes.push(g);
    zonaPorGrupo.push(zonaDoMaterial((o.material && o.material.name) || ''));
  });
  function zonaDoMaterial(nome) { return nome.indexOf('topo') >= 0 ? 'topo' : nome.indexOf('base') >= 0 ? 'base' : 'principal'; }
  var geo = mergeGeometries(partes, true);
  var ordemZonas = ['topo', 'principal', 'base'];
  var matsArray = ordemZonas.map(function (z) { return mats[z]; });
  geo.groups.forEach(function (g, i) { g.materialIndex = ordemZonas.indexOf(zonaPorGrupo[i]); });
  var corpoBrush = new CSG.Brush(geo, matsArray);
  corpoBrush.updateMatrixWorld();

  /* quadro: coordenadas LOCAIS do texto original (mm) -> mundo Blender (Z pra cima) -> mundo three (Y pra cima) */
  var M = new THREE.Matrix4();
  var q = quadro.matriz_mundo_zup;
  M.set(q[0][0], q[0][1], q[0][2], q[0][3], q[1][0], q[1][1], q[1][2], q[1][3],
        q[2][0], q[2][1], q[2][2], q[2][3], q[3][0], q[3][1], q[3][2], q[3][3]);
  var ZparaY = new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1);
  var quadroMundo = new THREE.Matrix4().multiplyMatrices(ZparaY, M);
  var bb = quadro.bbox_local_texto;                 // [[minx,miny,minz],[maxx,maxy,maxz]] do "Luke" original
  var centroX = (bb[0][0] + bb[1][0]) / 2, baseY = bb[0][1], altOrig = bb[1][1] - bb[0][1];
  var zFora = bb[1][2], zDentro = bb[0][2];

  /* escala da fonte: o nome ORIGINAL do arquivo, desenhado com a mesma fonte, tem que caber no mesmo retângulo */
  function geoTexto(txt, tamanho, prof) {
    var g = new TextGeometry(txt, { font: fonte, size: tamanho, depth: prof, curveSegments: 6, bevelEnabled: false });
    g.computeBoundingBox(); return g;
  }
  var ref = geoTexto(quadro.text_info.text || 'Luke', 10, 1);
  var k = altOrig / (ref.boundingBox.max.y - ref.boundingBox.min.y);
  var baseRef = ref.boundingBox.min.y;
  /* pra "achar a parede": a peça com BVH (raio rápido) e o eixo do comedouro (centro da caixa, na horizontal) */
  var BVH = await import('three-mesh-bvh');
  THREE.Mesh.prototype.raycast = BVH.acceleratedRaycast;
  THREE.BufferGeometry.prototype.computeBoundsTree = BVH.computeBoundsTree;
  var corpoRaio = new THREE.Mesh(geo.clone(), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  corpoRaio.geometry.computeBoundsTree();
  var caixaEixo = new THREE.Box3().setFromBufferAttribute(geo.attributes.position);
  var eixo = caixaEixo.getCenter(new THREE.Vector3());
  var raio = new THREE.Raycaster(); raio.firstHitOnly = true;
  var PROF = (parseFloat(quadro.text_info.thickness) || 1.5) / 1000;   // mm do arquivo -> metros
  /* quantos mm do mundo vale 1 unidade local do texto (o quadro já está em metros) */
  var quadroEscalaMm = new THREE.Vector3().setFromMatrixColumn(quadroMundo, 0).length() * 1000;
  var avaliador = new CSG.Evaluator();
  avaliador.useGroups = true;
  avaliador.attributes = ['position', 'normal'];
  var resultado = null;

  function gravar(nome) {
    nome = (nome || '').trim();
    var alvo;
    if (!nome) {
      alvo = corpoBrush;
    } else {
      /* ⚠️ o nome ACOMPANHA A PAREDE (v2 do protótipo): a parede é facetada e inclinada; um bloco de texto reto
         entrava fundo no meio e nem encostava nas pontas ("Cassiano" perdia o C). Cada ponto da letra desce até
         a parede de verdade (raio de fora pra dentro, na mesma altura e no mesmo ângulo) e a gravação fica com
         a profundidade do arquivo (thickness = 1,5 mm), igual em toda a palavra. */
      var t = geoTexto(nome, 10 * k, 1);            // z local: 0 = fundo da letra, 1 = frente
      var largura = t.boundingBox.max.x - t.boundingBox.min.x;
      t.translate(centroX - (t.boundingBox.min.x + largura / 2), baseY - baseRef * k, 0);
      t.deleteAttribute('uv');
      /* triângulos pequenos (<= 0,8 mm) pra letra dobrar junto com as facetas, sem cortar por cima delas */
      t = new TessellateModifier(0.8 / (quadroEscalaMm || 1), 8).modify(t.index ? t.toNonIndexed() : t);
      t = mergeVertices(t);
      var pos = t.attributes.position, v = new THREE.Vector3(), plano = new THREE.Vector3();
      var fora = new THREE.Vector3(), origem = new THREE.Vector3(), menos = new THREE.Vector3();
      for (var i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        var frente = v.z > 0.5;
        plano.set(v.x, v.y, 0).applyMatrix4(quadroMundo);          // ponto no plano do nome original
        fora.set(plano.x - eixo.x, 0, plano.z - eixo.z).normalize(); // pra fora, na horizontal
        origem.set(eixo.x, plano.y, eixo.z).addScaledVector(fora, 0.5);
        raio.set(origem, menos.copy(fora).negate());
        var hit = raio.intersectObject(corpoRaio, false)[0];
        var S = hit ? hit.point : plano;
        v.copy(S).addScaledVector(fora, frente ? 0.0015 : -PROF);
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      pos.needsUpdate = true;
      t.computeVertexNormals();
      t.clearGroups();
      if (/debug3d/.test(location.search)) { t.computeBoundingBox(); geo.computeBoundingBox(); console.log('texto', JSON.stringify(t.boundingBox), 'corpo', JSON.stringify(geo.boundingBox)); }
      var textoBrush = new CSG.Brush(t, matLetra);  // a parede da letra: cor da zona principal, na sombra
      textoBrush.updateMatrixWorld();
      try { alvo = avaliador.evaluate(corpoBrush, textoBrush, CSG.SUBTRACTION); }
      catch (e) { console.warn('gravação do nome falhou', e); alvo = corpoBrush; }
    }
    if (resultado) { cena.remove(resultado); if (resultado !== corpoBrush) resultado.geometry.dispose(); }
    resultado = alvo === corpoBrush ? new THREE.Mesh(geo, matsArray) : alvo;
    resultado.material = Array.isArray(resultado.material)
      ? resultado.material.map(function (m) { return matsArray.indexOf(m) >= 0 ? m : matLetra; })
      : resultado.material;
    cena.add(resultado);
  }

  /* câmera enquadrando a peça, de frente pro nome e um pouco de cima */
  var caixa = new THREE.Box3().setFromBufferAttribute(geo.attributes.position);
  var centro = caixa.getCenter(new THREE.Vector3()), tam = caixa.getSize(new THREE.Vector3());
  controles.target.copy(centro);
  var dist = Math.max(tam.x, tam.y, tam.z) * 2.6;
  camera.position.set(centro.x, centro.y + dist * 0.35, centro.z + dist);
  controles.update();

  var campoNomeForm = document.querySelector('[data-personalizar] [name="nome_pet"]');
  var campoNome = fundo.querySelector('[data-j3-nome]');
  campoNome.value = (campoNomeForm && campoNomeForm.value) || '';
  gravar(campoNome.value || (quadro.text_info.text || ''));
  fundo.querySelector('.janela3d-carregando').hidden = true;
  var espera = null;
  campoNome.addEventListener('input', function () {
    clearTimeout(espera);
    espera = setTimeout(function () { gravar(campoNome.value); }, 60);
  });

  /* ---------------- abas (Original | Fosco) e as três zonas */
  var abas = fundo.querySelector('.janela3d-abas');
  var zonas = fundo.querySelector('.janela3d-zonas');
  var ROTULO_ZONA = { topo: 'Topo', principal: 'Principal', base: 'Base' };
  var abaAtual = cfg.abas[0].id;
  function desenharAbas() {
    abas.innerHTML = cfg.abas.map(function (a) {
      return '<button type="button" role="tab" aria-selected="' + (a.id === abaAtual) + '" data-aba="' + a.id + '">' + a.rotulo + '</button>';
    }).join('');
    var aba = cfg.abas.filter(function (a) { return a.id === abaAtual; })[0];
    zonas.innerHTML = ordemZonas.map(function (z) {
      var cores = aba.id === 'original' ? [Object.assign({ site: cfg.original[z].site }, cfg.original[z])] : aba.cores;
      return '<div class="janela3d-zona"><span class="janela3d-rotulo">' + ROTULO_ZONA[z] + '</span><div class="janela3d-bolas">' +
        cores.map(function (c) {
          var ativo = mats[z].color.getHexString() === new THREE.Color(c.hex).getHexString() && mats[z].userData.acab === (c.acabamento || aba.id);
          return '<button type="button" class="janela3d-bola' + (ativo ? ' ativa' : '') + '" data-zona="' + z + '" data-hex="' + c.hex +
            '" data-acab="' + (c.acabamento || aba.id) + '" title="' + c.site + '" style="--c:' + c.hex + '"><span>' + c.site + '</span></button>';
        }).join('') + '</div></div>';
    }).join('');
  }
  desenharAbas();
  abas.addEventListener('click', function (e) { var b = e.target.closest('[data-aba]'); if (b) { abaAtual = b.getAttribute('data-aba'); desenharAbas(); } });
  zonas.addEventListener('click', function (e) {
    var b = e.target.closest('.janela3d-bola'); if (!b) return;
    var m = mats[b.getAttribute('data-zona')];
    m.color.set(b.getAttribute('data-hex'));
    var a = ACABAMENTO_MATERIAL[b.getAttribute('data-acab')] || ACABAMENTO_MATERIAL.fosco;
    m.roughness = a.roughness; m.metalness = a.metalness; m.userData.acab = b.getAttribute('data-acab');
    acertarLetra();
    desenharAbas();
  });

  /* ---------------- fechar: o nome digitado volta pro formulário */
  function fechar() {
    if (campoNomeForm && campoNome.value.trim()) {
      campoNomeForm.value = campoNome.value.trim();
      campoNomeForm.dispatchEvent(new Event('input', { bubbles: true }));
    }
    vivo = false;
    window.removeEventListener('resize', redimensionar);
    fundo.classList.remove('visivel');
    document.documentElement.classList.remove('janela3d-aberta');
    setTimeout(function () { renderer.dispose(); pmrem.dispose(); if (fundo.parentNode) fundo.parentNode.removeChild(fundo); }, 250);
    if (aoFechar) aoFechar();
  }
  fundo.querySelector('.janela3d-fechar').addEventListener('click', fechar);
  fundo.querySelector('.janela3d-pronto').addEventListener('click', fechar);
  fundo.addEventListener('click', function (e) { if (e.target === fundo) fechar(); });
  document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { document.removeEventListener('keydown', esc); fechar(); } });
  return { gravar: gravar, mats: mats };
}
