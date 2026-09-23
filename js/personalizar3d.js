/* CATALOGO:
   nome: personalizar3d
   categoria: UTIL
   objetivo: Janela "Personalize aqui" da página de produto: a peça em 3D (do arquivo do Cassiano), com o nome do
             pet GRAVADO ao vivo e as cores da peça e do nome trocando na hora, conforme o formulário.
   entrada: ALEA.modelos3d[slug] e ALEA.filamentos (config.js); o formulário [data-personalizar] da página
   saida: a janela (modal); o formulário de verdade MORA dentro dela enquanto está aberta
   status: protótipo v3 (23/09/2026, etapa 56)
   validado_em: 23/09/2026 (teste headless desktop e 390 px)
*/
/* =============================================================================
   HISTÓRICO (a v1 da etapa 53 está em 03_site/_versoes_anteriores/js_2026-09-23/)
   -----------------------------------------------------------------------------
   v1 (etapa 53, 14:27): janela com a peça 3D, nome ao vivo, abas Original/Fosco próprias.
   v2 (etapa 55, 15:12-15:23, "executar" das 15:23) — pedidos dele:
     1. "Essa parte a gente não vai mais precisar (...) ela vai estar inteira no Personalize aqui": o formulário
        (nome, adicional + cor do nome, cores da peça) SAI da página e passa a morar só na janela. Aqui ele é
        MOVIDO pra dentro da janela ao abrir e volta (escondido) ao fechar — é o MESMO formulário, então a trava
        de compra, o carrinho e o "editar" seguem funcionando sem cópia. As abas próprias da v1 saíram.
     2. "Não estou gostando daquele fundo preto (...) muito carregado": fundo de ESTÚDIO em degradê bege-acinzentado
        de tom médio, com sombra macia sob a peça, que CLAREIA ou ESCURECE sozinho conforme as cores escolhidas
        ("conforme vai mudando as cores, você muda o fundo também pra ficar em destaque o objeto").
     3. "A peça está com muita iluminação (...) dependendo do jeito que eu giro, não vejo o nome": a luz agora anda
        COM a câmera (vem sempre de onde você olha, um pouco de cima), então nenhum lado fica estourado ou apagado
        e o nome aparece em qualquer ângulo.
   v3 (etapa 56, 15:33-15:43, "executar" das 15:43):
     1. "Quando eu clicar em Nome do pet, a tela fica nessa posição (...) e você vira a peça pra frente e ela fica
        parada pra ele ver o nome sendo transformado na hora": no celular a janela acompanha a parte VISÍVEL da tela
        (visualViewport) — com o teclado aberto, o campo fica logo acima dele e a peça continua inteira em cima; e
        tocar no nome para o giro e traz o nome de frente.
     2. "A tela de trás está mexendo (...) a de trás não pode nunca mexer": a página fica TRAVADA (body fixo no
        lugar) enquanto a janela está aberta — o mesmo remédio da sacola (etapa 40).
     4. "Tive uma ideia melhor (...) totalmente estática": UM PASSO POR VEZ — 1 Nome do pet [Próximo];
        2 "Um detalhe que transforma" + cor do nome [Voltar] [Pular] [Próximo]; 3 Cores da peça [Voltar] [Pronto].
        A janela tem só a altura do passo e não rola.
   ============================================================================= */

var ACABAMENTO_MATERIAL = {           // como cada acabamento reflete a luz
  fosco:      { roughness: 0.9,  metalness: 0.0 },
  basico:     { roughness: 0.55, metalness: 0.0 },
  perolizado: { roughness: 0.32, metalness: 0.3 }
};

export async function abrirJanela3D(cfg, aoFechar, aoMontar) {
  /* ---------------- a janela (monta ANTES de baixar o 3D: o formulário já fica usável) */
  var form = document.querySelector('[data-personalizar]');
  var lugarDoForm = document.createComment('lugar do formulário');
  var fundo = document.createElement('div');
  fundo.className = 'janela3d-fundo';
  fundo.innerHTML =
    '<div class="janela3d" role="dialog" aria-modal="true" aria-label="Personalize sua peça">' +
      '<button type="button" class="janela3d-fechar" aria-label="Fechar">&times;</button>' +
      '<div class="janela3d-palco"><canvas></canvas><p class="janela3d-dica">Arraste para girar</p>' +
        '<p class="janela3d-carregando">Carregando a peça…</p></div>' +
      '<div class="janela3d-lado">' +
        '<h2>Personalize <small class="janela3d-passo"></small></h2>' +
        '<div class="janela3d-form"></div>' +
        '<p class="janela3d-aviso">Simulação. A cor na tela pode variar um pouco da peça real.</p>' +
        '<button type="button" class="botao janela3d-pronto">Pronto</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(fundo);
  if (form) { form.parentNode.insertBefore(lugarDoForm, form); fundo.querySelector('.janela3d-form').appendChild(form); }
  document.documentElement.classList.add('janela3d-aberta');

  /* (2) o fundo NÃO mexe: a página fica presa no lugar enquanto a janela está aberta */
  var rolagemAntes = window.scrollY || 0;
  document.body.style.position = 'fixed';
  document.body.style.top = (-rolagemAntes) + 'px';
  document.body.style.left = '0'; document.body.style.right = '0';

  /* (1) a janela ocupa só a parte VISÍVEL da tela: com o teclado aberto ela encolhe por cima dele */
  var vv = window.visualViewport;
  function acompanharTela() {
    if (!vv) return;
    fundo.style.height = vv.height + 'px';
    fundo.style.top = vv.offsetTop + 'px';
  }
  if (vv) { vv.addEventListener('resize', acompanharTela); vv.addEventListener('scroll', acompanharTela); acompanharTela(); }

  /* (4) UM PASSO POR VEZ */
  var passos = [];
  if (form) {
    var nomeRot = (form.querySelector('[name="nome_pet"]') || {}).closest ? form.querySelector('[name="nome_pet"]').closest('label') : null;
    var extraRot = form.querySelector('[data-extra]');
    var corNomeRot = form.querySelector('.campo-cor-nome') ? form.querySelector('.campo-cor-nome').closest('label') : null;
    var coresRot = form.querySelector('[data-cores-peca]');
    passos = [[nomeRot], [extraRot, corNomeRot], [coresRot]].map(function (els) { return els.filter(Boolean); })
      .filter(function (els) { return els.length; });
  }
  var nav = document.createElement('div');
  nav.className = 'janela3d-nav';
  var passoAtual = 0;
  var botaoPronto = fundo.querySelector('.janela3d-pronto');
  botaoPronto.parentNode.insertBefore(nav, botaoPronto);
  botaoPronto.style.display = 'none';   // o Pronto agora é o do último passo
  function mostrarPasso(i) {
    passoAtual = Math.max(0, Math.min(passos.length - 1, i));
    passos.forEach(function (els, k) { els.forEach(function (el) { el.classList.toggle('passo-escondido', k !== passoAtual); }); });
    var ultimo = passoAtual === passos.length - 1;
    var html = '';
    if (passoAtual > 0) html += '<button type="button" class="botao-sec" data-nav="voltar">Voltar</button>';
    if (passoAtual === 1) html += '<button type="button" class="botao-sec" data-nav="pular">Pular</button>';
    html += ultimo ? '<button type="button" class="botao" data-nav="pronto">Pronto</button>'
                   : '<button type="button" class="botao" data-nav="proximo">Próximo</button>';
    nav.innerHTML = html;
    nav.setAttribute('data-quantos', String(nav.children.length));
    fundo.querySelector('.janela3d-passo').textContent = (passoAtual + 1) + ' de ' + passos.length;
  }
  nav.addEventListener('click', function (e) {
    var b = e.target.closest('[data-nav]'); if (!b) return;
    var acao = b.getAttribute('data-nav');
    if (acao === 'voltar') mostrarPasso(passoAtual - 1);
    else if (acao === 'proximo') mostrarPasso(passoAtual + 1);
    else if (acao === 'pular') {
      /* pular = sem o adicional de R$ 30: desmarca (o produto.js trava a cor do nome e tira do preço) */
      var cx = form && form.querySelector('[data-extra-caixa]');
      if (cx && cx.checked) { cx.checked = false; cx.dispatchEvent(new Event('change', { bubbles: true })); }
      mostrarPasso(passoAtual + 1);
    }
    else if (acao === 'pronto') fechar();
  });
  /* a trava de compra marca a falta com .faltou: a janela abre no passo da PRIMEIRA falta */
  window.aleaIrParaFalta = function () {
    var f = form && form.querySelector('.faltou');
    if (!f) return;
    for (var k = 0; k < passos.length; k++) {
      if (passos[k].some(function (el) { return el === f || el.contains(f); })) { mostrarPasso(k); return; }
    }
  };
  mostrarPasso(0);
  requestAnimationFrame(function () { fundo.classList.add('visivel'); });
  var palco = fundo.querySelector('.janela3d-palco');
  var canvas = fundo.querySelector('canvas');
  var vivo = true;
  var limpar = null;

  function fechar() {
    if (!vivo) return;
    vivo = false;
    passos.forEach(function (els) { els.forEach(function (el) { el.classList.remove('passo-escondido'); }); });
    document.body.style.position = ''; document.body.style.top = ''; document.body.style.left = ''; document.body.style.right = '';
    if (vv) { vv.removeEventListener('resize', acompanharTela); vv.removeEventListener('scroll', acompanharTela); }
    window.aleaIrParaFalta = null;
    if (form && lugarDoForm.parentNode) lugarDoForm.parentNode.insertBefore(form, lugarDoForm);
    if (lugarDoForm.parentNode) lugarDoForm.parentNode.removeChild(lugarDoForm);
    fundo.classList.remove('visivel');
    document.documentElement.classList.remove('janela3d-aberta');
    window.scrollTo(0, rolagemAntes);
    requestAnimationFrame(function () { window.scrollTo(0, rolagemAntes); });
    setTimeout(function () { if (limpar) limpar(); if (fundo.parentNode) fundo.parentNode.removeChild(fundo); }, 250);
    if (aoFechar) aoFechar();
  }
  fundo.querySelector('.janela3d-fechar').addEventListener('click', fechar);
  fundo.querySelector('.janela3d-pronto').addEventListener('click', fechar);
  fundo.addEventListener('click', function (e) { if (e.target === fundo) fechar(); });
  document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { document.removeEventListener('keydown', esc); fechar(); } });
  if (aoMontar) aoMontar();

  /* ---------------- 3D */
  var THREE = await import('three');
  var { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  var { TTFLoader } = await import('three/addons/loaders/TTFLoader.js');
  var { Font } = await import('three/addons/loaders/FontLoader.js');
  var { TextGeometry } = await import('three/addons/geometries/TextGeometry.js');
  var { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
  var { mergeVertices, mergeGeometries } = await import('three/addons/utils/BufferGeometryUtils.js');
  var { TessellateModifier } = await import('three/addons/modifiers/TessellateModifier.js');
  var CSG = await import('three-bvh-csg');
  var BVH = await import('three-mesh-bvh');
  if (!vivo) return;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.setClearColor(0x000000, 0);           // transparente: o fundo de estúdio é o CSS do palco
  var cena = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(28, 1, 0.01, 10);
  cena.add(camera);
  /* LUZ UNIFORME (item 3): luz ambiente de céu/chão + uma luz principal PRESA NA CÂMERA, um pouco acima e à
     esquerda de quem olha. Girando a peça, a luz vem sempre do mesmo lado da tela: nada estoura, nada apaga,
     e a sombrinha dentro das letras continua desenhando o nome. */
  cena.add(new THREE.HemisphereLight(0xffffff, 0xb9b2a6, 1.25));
  var luzCamera = new THREE.DirectionalLight(0xffffff, 1.35);
  luzCamera.position.set(-0.25, 0.35, 0.2);
  camera.add(luzCamera); camera.add(luzCamera.target); luzCamera.target.position.set(0, 0, -1);

  var controles = new OrbitControls(camera, canvas);
  controles.enableDamping = true; controles.enablePan = false;
  controles.autoRotate = !/debug3d/.test(location.search); controles.autoRotateSpeed = 1.2;
  controles.minDistance = 0.25; controles.maxDistance = 1.2;
  controles.maxPolarAngle = Math.PI * 0.62;
  controles.addEventListener('start', function () { controles.autoRotate = false; });
  function redimensionar() {
    var w = palco.clientWidth, h = palco.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    if (raioPeca && controles) {
      var d = camera.position.clone().sub(controles.target);
      camera.position.copy(controles.target).addScaledVector(d.normalize(), distanciaQueCabe());
      if (typeof frente !== 'undefined' && frente) frente.copy(controles.target).addScaledVector(direcao, distanciaQueCabe());
    }
  }
  window.addEventListener('resize', redimensionar);
  if (window.ResizeObserver) new ResizeObserver(redimensionar).observe(palco);
  redimensionar();
  (function laco() { if (!vivo) return; controles.update(); renderer.render(cena, camera); requestAnimationFrame(laco); })();

  /* ---------------- materiais */
  function material(hex, acab) {
    var m = new THREE.MeshStandardMaterial(Object.assign({ color: new THREE.Color(hex), flatShading: true, side: THREE.DoubleSide },
      ACABAMENTO_MATERIAL[acab] || ACABAMENTO_MATERIAL.fosco));
    m.userData.acab = acab; return m;
  }
  function pintar(m, hex, acab) {
    var a = ACABAMENTO_MATERIAL[acab] || ACABAMENTO_MATERIAL.fosco;
    m.color.set(hex); m.roughness = a.roughness; m.metalness = a.metalness; m.userData.acab = acab;
  }
  var ordemZonas = ['topo', 'principal', 'base'];
  var mats = {};
  ordemZonas.forEach(function (z) { mats[z] = material(cfg.original[z].hex, cfg.original[z].acabamento); });
  var matLetra = mats.principal.clone();

  /* ---------------- a peça e o quadro do nome */
  var [gltf, quadro, fonteBin] = await Promise.all([
    new GLTFLoader().loadAsync(cfg.glb),
    fetch(cfg.nome).then(function (r) { return r.json(); }),
    /* reversed: a Defante é .otf (curvas CFF) e desenha os contornos no sentido contrário — sem isso o miolo do
       "o" e do "a" saía cheio (visto no "Cassiano", etapa 55) */
    new Promise(function (ok, erro) { var L = new TTFLoader(); L.reversed = true; L.load(cfg.fonte, ok, undefined, erro); })
  ]);
  if (!vivo) return;
  var fonte = new Font(fonteBin);
  function zonaDoMaterial(nome) { return nome.indexOf('topo') >= 0 ? 'topo' : nome.indexOf('base') >= 0 ? 'base' : 'principal'; }
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
  var geo = mergeGeometries(partes, true);
  var matsArray = ordemZonas.map(function (z) { return mats[z]; });
  geo.groups.forEach(function (g, i) { g.materialIndex = ordemZonas.indexOf(zonaPorGrupo[i]); });
  var corpoBrush = new CSG.Brush(geo, matsArray);
  corpoBrush.updateMatrixWorld();

  var M = new THREE.Matrix4(), q = quadro.matriz_mundo_zup;
  M.set(q[0][0], q[0][1], q[0][2], q[0][3], q[1][0], q[1][1], q[1][2], q[1][3],
        q[2][0], q[2][1], q[2][2], q[2][3], q[3][0], q[3][1], q[3][2], q[3][3]);
  var quadroMundo = new THREE.Matrix4().multiplyMatrices(new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1), M);
  var bb = quadro.bbox_local_texto;
  var centroX = (bb[0][0] + bb[1][0]) / 2, baseY = bb[0][1], altOrig = bb[1][1] - bb[0][1];
  function geoTexto(txt, tamanho, prof) {
    var g = new TextGeometry(txt, { font: fonte, size: tamanho, depth: prof, curveSegments: 6, bevelEnabled: false });
    g.computeBoundingBox(); return g;
  }
  var ref = geoTexto(quadro.text_info.text || 'Luke', 10, 1);
  var k = altOrig / (ref.boundingBox.max.y - ref.boundingBox.min.y);
  var baseRef = ref.boundingBox.min.y;

  THREE.Mesh.prototype.raycast = BVH.acceleratedRaycast;
  THREE.BufferGeometry.prototype.computeBoundsTree = BVH.computeBoundsTree;
  var corpoRaio = new THREE.Mesh(geo.clone(), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  corpoRaio.geometry.computeBoundsTree();
  var eixo = new THREE.Box3().setFromBufferAttribute(geo.attributes.position).getCenter(new THREE.Vector3());
  var raio = new THREE.Raycaster(); raio.firstHitOnly = true;
  var PROF = (parseFloat(quadro.text_info.thickness) || 1.5) / 1000;
  var quadroEscalaMm = new THREE.Vector3().setFromMatrixColumn(quadroMundo, 0).length() * 1000;
  var avaliador = new CSG.Evaluator();
  avaliador.useGroups = true;
  avaliador.attributes = ['position', 'normal'];
  var resultado = null, preenchida = null, nomeColorido = false, frente = null;

  function gravar(nome) {
    nome = (nome || '').trim();
    var alvo = corpoBrush;
    if (nome) {
      /* o nome acompanha a parede facetada: cada ponto desce até a parede de verdade e a gravação fica com a
         profundidade do arquivo (thickness), igual na palavra toda */
      var t = geoTexto(nome, 10 * k, 1);
      var largura = t.boundingBox.max.x - t.boundingBox.min.x;
      t.translate(centroX - (t.boundingBox.min.x + largura / 2), baseY - baseRef * k, 0);
      t.deleteAttribute('uv');
      t = new TessellateModifier(0.8 / (quadroEscalaMm || 1), 8).modify(t.index ? t.toNonIndexed() : t);
      t = mergeVertices(t);
      var pos = t.attributes.position, v = new THREE.Vector3(), plano = new THREE.Vector3(), posPreenchida = [];
      var fora = new THREE.Vector3(), origem = new THREE.Vector3(), menos = new THREE.Vector3();
      for (var i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        var frente = v.z > 0.5;
        plano.set(v.x, v.y, 0).applyMatrix4(quadroMundo);
        fora.set(plano.x - eixo.x, 0, plano.z - eixo.z).normalize();
        origem.set(eixo.x, plano.y, eixo.z).addScaledVector(fora, 0.5);
        raio.set(origem, menos.copy(fora).negate());
        var hit = raio.intersectObject(corpoRaio, false)[0];
        var S = hit ? hit.point : plano;
        var pi = S.clone().addScaledVector(fora, frente ? -0.00015 : -PROF);   // letra preenchida: rente, por dentro
        posPreenchida.push(pi.x, pi.y, pi.z);
        v.copy(S).addScaledVector(fora, frente ? 0.0015 : -PROF);
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      pos.needsUpdate = true;
      t.computeVertexNormals();
      t.clearGroups();
      /* a LETRA PREENCHIDA do nome colorido: o mesmo texto com a frente 0,15 mm pra dentro da parede. Aparece
         pelo buraco da gravação e garante a palavra inteira à vista mesmo onde o corte falha numa letra
         (visto no "Cassiano" em cor, etapa 55) */
      if (preenchida) { cena.remove(preenchida); preenchida.geometry.dispose(); }
      var gp = t.clone(); gp.setAttribute('position', new THREE.Float32BufferAttribute(posPreenchida, 3)); gp.computeVertexNormals();
      preenchida = new THREE.Mesh(gp, matLetra);
      preenchida.visible = nomeColorido;
      cena.add(preenchida);
      var textoBrush = new CSG.Brush(t, matLetra);
      textoBrush.updateMatrixWorld();
      try { alvo = avaliador.evaluate(corpoBrush, textoBrush, CSG.SUBTRACTION); }
      catch (e) { console.warn('gravação do nome falhou', e); alvo = corpoBrush; }
    }
    if (!nome && preenchida) { cena.remove(preenchida); preenchida.geometry.dispose(); preenchida = null; }
    if (resultado) { cena.remove(resultado); if (resultado.geometry !== geo) resultado.geometry.dispose(); }
    resultado = alvo === corpoBrush ? new THREE.Mesh(geo, matsArray) : alvo;
    if (Array.isArray(resultado.material)) {
      resultado.material = resultado.material.map(function (m) { return matsArray.indexOf(m) >= 0 ? m : matLetra; });
    }
    cena.add(resultado);
  }

  /* sombra macia sob a peça (um disco com degradê) — parte do "fundo de estúdio" */
  var caixa = new THREE.Box3().setFromBufferAttribute(geo.attributes.position);
  var centro = caixa.getCenter(new THREE.Vector3()), tam = caixa.getSize(new THREE.Vector3());
  (function sombra() {
    var c = document.createElement('canvas'); c.width = c.height = 128;
    var g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 8, 64, 64, 64);
    gr.addColorStop(0, 'rgba(40,32,24,.45)'); gr.addColorStop(1, 'rgba(40,32,24,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    var s = new THREE.Mesh(new THREE.PlaneGeometry(tam.x * 1.5, tam.z * 1.5),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
    s.rotation.x = -Math.PI / 2; s.position.set(centro.x, caixa.min.y - 0.0005, centro.z);
    cena.add(s);
  })();
  controles.target.copy(centro);
  /* enquadrar pela esfera da peça e pelo MENOR dos dois ângulos de visão: no celular o palco é alto e estreito,
     e medir só pela altura deixava a peça cortada dos lados (visto no teste de 390 px, etapa 56) */
  var raioPeca = caixa.getBoundingSphere(new THREE.Sphere()).radius;
  var direcao = new THREE.Vector3(0, 0.35, 1).normalize();
  function distanciaQueCabe() {
    var v = THREE.MathUtils.degToRad(camera.fov) / 2, h = Math.atan(Math.tan(v) * camera.aspect);
    return raioPeca * 0.82 / Math.sin(Math.min(v, h));
  }
  camera.position.copy(centro).addScaledVector(direcao, distanciaQueCabe());
  controles.maxDistance = distanciaQueCabe() * 1.8;
  controles.update();

  /* ---------------- o formulário manda na peça */
  var FIL = (window.ALEA || {}).filamentos || {};
  function hexDe(acab, cor) {
    var f = (FIL[acab] || []).filter(function (x) { return x.site === cor; })[0];
    return f && f.hex;
  }
  function escolhaDoCampo(c) {
    if (!c) return null;
    var ac = c.querySelector('.acabamento input:checked'), sel = c.querySelector('select');
    if (!ac || !sel || !sel.value) return null;
    var hex = hexDe(ac.value, sel.value);
    return hex ? { hex: hex, acab: ac.value } : null;
  }
  /* FUNDO QUE ACOMPANHA A PEÇA (item 2): tom médio; se a peça ficar clara, o estúdio escurece um pouco;
     se ficar escura, clareia — o contraste nunca some */
  function luminancia(hex) {
    var c = new THREE.Color(hex); return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  }
  function ajustarFundo(hexes) {
    var L = hexes.reduce(function (s, h) { return s + luminancia(h); }, 0) / hexes.length;
    var estudio = L > 0.62 ? ['#CFC6B8', '#9E9483'] : L < 0.22 ? ['#F1ECE3', '#D8D0C3'] : ['#E6DFD3', '#BFB5A5'];
    palco.style.setProperty('--estudio-centro', estudio[0]);
    palco.style.setProperty('--estudio-borda', estudio[1]);
  }
  function aplicarForm() {
    if (!form) return;
    /* cores da peça: tricolor = topo/principal/base; bicolor = principal (+ topo) e base; mono = tudo igual */
    var modo = form.querySelector('input[name="cores_peca"]:checked');
    var campos = form.querySelectorAll('.cores-campos .campo-cor');
    var escolha = { topo: null, principal: null, base: null };
    if (modo) {
      var e = Array.prototype.map.call(campos, escolhaDoCampo);
      if (modo.value === 'tricolor') { escolha.topo = e[0]; escolha.principal = e[1]; escolha.base = e[2]; }
      else if (modo.value === 'bicolor') { escolha.topo = e[0]; escolha.principal = e[0]; escolha.base = e[1]; }
      else if (modo.value === 'monocromatico') { escolha.topo = escolha.principal = escolha.base = e[0]; }
    }
    ordemZonas.forEach(function (z) {
      var x = escolha[z] || { hex: cfg.original[z].hex, acab: cfg.original[z].acabamento };
      pintar(mats[z], x.hex, x.acab);
    });
    /* o nome: com "Um detalhe que transforma" + cor escolhida, a letra ganha a cor; sem isso, é a parede na sombra */
    var extra = form.querySelector('[data-extra-caixa]');
    var corNome = extra && extra.checked ? escolhaDoCampo(form.querySelector('.campo-cor-nome')) : null;
    nomeColorido = !!corNome;
    if (preenchida) preenchida.visible = nomeColorido;
    if (corNome) pintar(matLetra, corNome.hex, corNome.acab);
    else { matLetra.color.copy(mats.principal.color).multiplyScalar(0.72); matLetra.roughness = mats.principal.roughness; matLetra.metalness = mats.principal.metalness; }
    ajustarFundo(ordemZonas.map(function (z) { return '#' + mats[z].color.getHexString(); }));
  }
  var campoNome = form && form.querySelector('[name="nome_pet"]');
  frente = camera.position.clone();
  function virarPraFrente() {
    controles.autoRotate = false;
    var de = camera.position.clone(), t0 = performance.now();
    (function passo() {
      var u = Math.min(1, (performance.now() - t0) / 600), e = 1 - Math.pow(1 - u, 3);
      camera.position.lerpVectors(de, frente, e);
      if (u < 1 && vivo) requestAnimationFrame(passo);
    })();
  }
  if (campoNome) campoNome.addEventListener('focus', virarPraFrente);
  gravar((campoNome && campoNome.value) || quadro.text_info.text || '');
  aplicarForm();
  fundo.querySelector('.janela3d-carregando').hidden = true;
  var espera = null;
  function aoMexer(ev) {
    if (ev.target === campoNome) {
      clearTimeout(espera);
      espera = setTimeout(function () { gravar(campoNome.value || quadro.text_info.text || ''); }, 60);
    }
    setTimeout(aplicarForm, 0);   // depois que o produto.js redesenhar as janelas de cor
  }
  if (form) { form.addEventListener('input', aoMexer); form.addEventListener('change', aoMexer); }

  limpar = function () {
    if (form) { form.removeEventListener('input', aoMexer); form.removeEventListener('change', aoMexer); }
    if (campoNome) campoNome.removeEventListener('focus', virarPraFrente);
    window.removeEventListener('resize', redimensionar);
    renderer.dispose();
  };
  return { gravar: gravar, mats: mats };
}
