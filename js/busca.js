/* CATALOGO:
   nome: busca
   categoria: UTIL
   objetivo: A BUSCA DO SITE. No celular abre puxando a tela pra baixo quando a página já está no topo (igual a busca do
             iPhone), com um aviso na primeira visita; no computador abre pela lupa "Buscar" do topo. A tela de busca é
             esfumaçada com o site atrás, traz palavras sugeridas e acha a peça por palavra parecida (cachorro, gato, pote...).
   entrada: window.VITRINE e window.PRODUTOS (produtos.js), window.CATEGORIAS; o que a pessoa digita
   saida: tela de busca por cima do site; clique leva à página da peça (produto-<slug>.html) ou à categoria (index.html#id)
   status: v4 (03/10/2026) - em prévia
   validado_em: 03/10/2026
   v1 (03/10/2026, Cassiano, áudios 5561/5562/5564/5567/5568 + vídeo 5566 da busca do iPhone):
      "se a pessoa pesquisar por cachorro, ou gato, ou comedouro, ou pote (...) ele cai no comedouro?" -> o site NÃO tinha
      busca. "Quando a gente rola a tela pra baixo e ela já está no topo (...) a gente consegue buscar (...) só se a pessoa
      estiver no topo da página, não tiver como mais subir (...) um pouco esfumaçado, com o fundo do site atrás (...) já
      com palavras-chave". "Isso aí só vale para o celular (...) no computador não tem como" e "quando a pessoa abrir,
      a gente já mostra um tutorial: arraste a tela para baixo para pesquisar produtos".
      No computador entra a lupa "Buscar" no topo, ao lado de Conta/Desejos/Sacola (a mesma tela de busca).
      Carregado pelo site.js (toda página que tem site.js ganha a busca; nenhuma página gerada precisou mudar).
   v2 (03/10/2026, vídeo 5572 + áudios 5573/5575 + foto 5574, na prévia v1): "ótimo, é isso aí", e mais dois:
      (1) o aviso some na 1ª interação (bom: não enche a tela), mas "se você vê que tá indo pro topo da página, faz a
          animação de novo, pra ele saber que tem a barra de pesquisa ali" -> no celular, quem desceu pelo menos uma tela
          e VOLTA ao topo vê o aviso de novo (some no próximo toque/rolagem). Ir e voltar um pouquinho não dispara.
      (2) "entre as categorias e o logo do Linktree, um campo igual esse de buscar, falando 'buscar item'; clicou, abre
          a tela da busca" -> campo no rodapé de toda página, antes das redes (celular e computador).
   v3 (03/10/2026, vídeo 5576 + áudio 5577): "a transição perfeita do buscar do iPhone (...) enquanto estou com o dedo
      apertado e abaixando, ele vai montando aos poucos a tela de buscar. Ele só monta ela a hora que eu solto o dedo".
      -> a tela da busca SEGUE O DEDO: o esfumaçado cresce, as sugestões descem e a barra sobe na medida do puxão; só
      ABRE de verdade (teclado) ao soltar passado o ponto; soltou antes ou voltou o dedo, ela se desmonta. Saiu a
      pílula "Buscar" que descia do topo (a própria tela é o retorno). O teclado abre no próprio soltar (o iPhone só
      deixa focar o campo dentro do toque).
   v4 (03/10/2026, Cassiano, vídeo 5583 + áudio 5584, vídeo 5586 + áudio 5587, vídeo 5590 + áudio 5591):
      (1) "nunca pôr o cursor sozinho": a tela abre SEM foco (sem teclado) em qualquer caminho - puxão, lupa, campo do
          rodapé, sugestão. O teclado só abre quando a pessoa toca na caixa "Buscar". (No iPhone o teclado empurrava a tela
          e mostrava o rodapé por baixo.) Exceção: a tecla "/" ou Ctrl+K no computador, que já é a pessoa querendo digitar.
      (2) "a transição está inconstante (...) tem hora que abre de uma vez. Ela SEMPRE tem que entrar embaçada, mesmo que
          eu arraste de uma vez, movimento brusco, ela tem que entrar DEVAGAR" -> o esfumaçado NÃO segue o dedo cru: um
          motor por quadro (requestAnimationFrame) persegue o dedo com velocidade máxima (0 a 1 em 600 ms, curva suave
          nas pontas). Puxão brusco = a tela vem no mesmo ritmo do puxão lento. Ao soltar passado o ponto ela termina de
          entrar devagar a partir de onde estava (nunca salta); soltou antes, volta devagar (380 ms). Abrir pela lupa ou
          pelo rodapé e fechar pelo Cancelar usam o mesmo motor - toda entrada e saída é igual.
*/
(function () {
  'use strict';
  if (window.__aleaBusca) return; window.__aleaBusca = true;

  var VITRINE = window.VITRINE || [], PRODUTOS = window.PRODUTOS || [], CATS = window.CATEGORIAS || [];
  var CELULAR = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  var CHAVE_DICA = 'alea_busca_dica_v1';
  var PUXAR = 80;                          // px puxando pra baixo no topo pra abrir
  var ENTRA_MS = 600, SAI_MS = 380;        // v4: tempo mínimo de 0 a 1 (entrar) e de 1 a 0 (sair), mesmo com puxão brusco

  /* palavra que a pessoa digita -> palavras que existem nas peças (sem acento, minúsculo) */
  var SINONIMOS = {
    cachorro: 'pet comedouro cao', cachorros: 'pet comedouro cao', cao: 'pet comedouro', caes: 'pet comedouro cao',
    cadela: 'pet comedouro', dog: 'pet comedouro', doguinho: 'pet comedouro', filhote: 'pet comedouro',
    gato: 'pet comedouro', gatos: 'pet comedouro', gata: 'pet comedouro', felino: 'pet comedouro', cat: 'pet comedouro',
    pote: 'comedouro', potinho: 'comedouro', tigela: 'comedouro', vasilha: 'comedouro', bowl: 'comedouro',
    comida: 'comedouro', racao: 'comedouro', agua: 'comedouro', bebedouro: 'comedouro', prato: 'comedouro',
    alto: 'elevado', elevada: 'elevado', melancia: 'watermelon', inox: 'comedouro', animal: 'pet', bicho: 'pet'
  };
  var SUGESTOES = ['Comedouro', 'Cachorro', 'Gato', 'Elevado', 'Melancia', 'PET'];

  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ā/g, 'a')
      .replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function catNome(id) { for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i].nome; return ''; }
  function prodDe(slug) { for (var i = 0; i < PRODUTOS.length; i++) if (PRODUTOS[i].slug === slug) return PRODUTOS[i]; return null; }

  /* o índice: SÓ o que está na vitrine (o que saiu da vitrine não aparece na busca) */
  var ITENS = VITRINE.map(function (v) {
    var p = prodDe(v.pagina) || {};
    var texto = [v.produto, v.nome, p.nome, p.linha, v.categoria, catNome(v.categoria), (p.paragrafos || []).join(' '), p.resumo].join(' ');
    return {
      titulo: v.produto, linha: p.linha || '', cat: catNome(v.categoria), url: 'produto-' + v.pagina + '.html',
      foto: 'img/produtos/' + (v.fotos && v.fotos[0] ? v.fotos[0] : p.capa) + '_m.jpg',
      forte: norm([v.produto, v.nome, p.linha, catNome(v.categoria)].join(' ')), fraco: norm(texto)
    };
  });

  function buscar(q) {
    var termos = norm(q).split(' ').filter(Boolean);
    if (!termos.length) return [];
    var res = [];
    ITENS.forEach(function (it) {
      var nota = 0, todos = true;
      termos.forEach(function (t) {
        var alvos = [t].concat((SINONIMOS[t] || '').split(' ').filter(Boolean));
        var achou = 0;
        alvos.forEach(function (a) {
          var re = new RegExp('(^| )' + a);
          if (re.test(it.forte)) achou = Math.max(achou, a === t ? 3 : 2);
          else if (t.length >= 3 && re.test(it.fraco)) achou = Math.max(achou, 1);
        });
        if (!achou) todos = false; nota += achou;
      });
      if (todos) res.push({ it: it, nota: nota });
    });
    return res.sort(function (a, b) { return b.nota - a.nota; }).map(function (r) { return r.it; });
  }

  /* ---------- a tela ---------- */
  var css = document.createElement('style');
  css.textContent = [
    '.busca-tela{position:fixed;inset:0;z-index:2000;display:flex;flex-direction:column;opacity:0;visibility:hidden;',
    ' transition:none;background:rgba(234,228,219,.42);',   /* v4: quem anima entrada e saída é o motor (--p); sem a sobra de .28s, que deixava a lista tocável depois de fechar */
    ' -webkit-backdrop-filter:blur(22px) saturate(1.5);backdrop-filter:blur(22px) saturate(1.5);font-family:var(--fonte-corpo)}',
    '.busca-tela.aberta{opacity:1;visibility:visible}',
    /* v3: enquanto o dedo puxa, a tela se monta na medida de --p (0 a 1), sem transição (segue o dedo) */
    '.busca-tela.arrastando{visibility:visible;opacity:1;transition:none;pointer-events:none;',
    ' background:rgba(234,228,219,calc(.42*var(--p)));-webkit-backdrop-filter:blur(calc(22px*var(--p))) saturate(calc(1 + .5*var(--p)));',
    ' backdrop-filter:blur(calc(22px*var(--p))) saturate(calc(1 + .5*var(--p)))}',
    '.busca-tela.arrastando .busca-corpo{opacity:var(--p);transform:translateY(calc(-48px*(1 - var(--p))))}',
    '.busca-tela.arrastando .busca-barra{opacity:var(--p);transform:translateY(calc(40px*(1 - var(--p))))}',
    '.busca-corpo,.busca-barra{transition:opacity .28s ease,transform .32s cubic-bezier(.2,.8,.2,1)}',
    '.busca-corpo{flex:1;overflow-y:auto;padding:calc(env(safe-area-inset-top) + 22px) var(--gutter,20px) 16px;',
    ' -webkit-overflow-scrolling:touch;overscroll-behavior:contain}',
    '.busca-rot{font-size:13px;font-weight:600;letter-spacing:.02em;color:var(--tinta-fraca,#6B5D50);margin:4px 2px 10px}',
    '.busca-chips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:22px}',
    '.busca-chips button{font:inherit;font-size:15px;padding:9px 16px;border-radius:999px;border:0;cursor:pointer;',
    ' color:var(--tinta,#2B2118);background:rgba(255,255,255,.55);box-shadow:0 1px 2px rgba(43,33,24,.08)}',
    '.busca-lista{display:flex;flex-direction:column;gap:10px;max-width:720px}',
    '.busca-item{display:flex;align-items:center;gap:14px;padding:10px;border-radius:18px;text-decoration:none;',
    ' color:var(--tinta,#2B2118);background:rgba(255,255,255,.55);box-shadow:0 1px 3px rgba(43,33,24,.08)}',
    '.busca-item img{width:62px;height:62px;border-radius:12px;object-fit:cover;flex:none;background:#ddd}',
    '.busca-item b{display:block;font-weight:600;font-size:15px;line-height:1.25}',
    '.busca-item small{display:block;font-size:13px;color:var(--tinta-fraca,#6B5D50);margin-top:3px}',
    '.busca-vazio{color:var(--tinta-fraca,#6B5D50);font-size:15px;padding:6px 2px}',
    '.busca-barra{display:flex;align-items:center;gap:10px;padding:10px var(--gutter,20px) calc(env(safe-area-inset-bottom) + 12px)}',
    '.busca-campo{flex:1;display:flex;align-items:center;gap:8px;height:46px;padding:0 14px;border-radius:999px;',
    ' background:rgba(255,255,255,.7);box-shadow:0 2px 10px rgba(43,33,24,.12)}',
    '.busca-campo svg{flex:none;color:var(--tinta-fraca,#6B5D50)}',
    '.busca-campo input{flex:1;border:0;background:transparent;font:inherit;font-size:16px;color:var(--tinta,#2B2118);outline:0;min-width:0}',
    '.busca-cancelar{font:inherit;font-size:16px;border:0;background:none;color:var(--terracota,#9D3E20);cursor:pointer;padding:8px 2px}',
    /* no computador a barra fica em cima */
    '@media (hover:hover) and (pointer:fine){.busca-tela{flex-direction:column-reverse}.busca-barra{padding-top:28px;max-width:760px;width:100%;margin:0 auto}',
    ' .busca-corpo{padding-top:8px;max-width:760px;width:100%;margin:0 auto}}',
    /* o aviso da primeira visita */
    '.busca-dica{position:fixed;left:50%;top:calc(env(safe-area-inset-top) + 86px);z-index:1998;transform:translate(-50%,-14px);',
    ' display:flex;align-items:center;gap:10px;padding:11px 18px;border-radius:999px;white-space:nowrap;opacity:0;',
    ' font:500 14px var(--fonte-corpo);color:var(--tinta,#2B2118);background:rgba(255,255,255,.62);',
    ' -webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:0 2px 12px rgba(43,33,24,.15);',
    ' transition:opacity .4s ease,transform .4s ease;pointer-events:none}',
    '.busca-dica.vis{opacity:1;transform:translate(-50%,0)}',
    '.busca-dica i{display:inline-block;font-style:normal;animation:busca-seta 1.1s ease-in-out infinite}',
    '@keyframes busca-seta{0%,100%{transform:translateY(-3px)}50%{transform:translateY(4px)}}',
    '@media (prefers-reduced-motion:reduce){.busca-dica i{animation:none}}'
  ].join('');
  document.head.appendChild(css);

  var LUPA = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>';
  var tela = document.createElement('div');
  tela.className = 'busca-tela'; tela.setAttribute('role', 'dialog'); tela.setAttribute('aria-label', 'Buscar produtos');
  tela.innerHTML =
    '<div class="busca-corpo"><div class="busca-rot" data-rot>Sugestões</div><div class="busca-chips" data-chips></div>' +
    '<div class="busca-lista" data-lista></div></div>' +
    '<div class="busca-barra"><label class="busca-campo">' + LUPA +
    '<input type="search" enterkeyhint="search" autocomplete="off" placeholder="Buscar" aria-label="Buscar produtos"></label>' +
    '<button type="button" class="busca-cancelar">Cancelar</button></div>';
  var campo = tela.querySelector('input'), lista = tela.querySelector('[data-lista]'), chips = tela.querySelector('[data-chips]');
  var rot = tela.querySelector('[data-rot]');

  SUGESTOES.forEach(function (s) {
    var b = document.createElement('button'); b.type = 'button'; b.textContent = s;
    b.addEventListener('click', function () { campo.value = s; pintar(); });   // v4: sem foco (sem teclado)
    chips.appendChild(b);
  });

  function itemHTML(it) {
    return '<a class="busca-item" href="' + it.url + '"><img src="' + it.foto + '" alt="" loading="lazy">' +
      '<span><b>' + it.titulo.replace(/</g, '&lt;') + '</b><small>' + [it.linha, it.cat].filter(Boolean).join(' · ') + '</small></span></a>';
  }
  function pintar() {
    var q = campo.value;
    if (!norm(q)) {
      rot.textContent = 'Sugestões'; chips.style.display = '';
      lista.innerHTML = ITENS.map(itemHTML).join('');
      return;
    }
    chips.style.display = 'none';
    var r = buscar(q);
    rot.textContent = r.length ? 'Produtos' : '';
    lista.innerHTML = r.length ? r.map(itemHTML).join('')
      : '<div class="busca-vazio">Ainda não temos peça com “' + q.replace(/</g, '&lt;') + '”. Fala com a gente: fazemos sob encomenda.</div>';
  }
  campo.addEventListener('input', pintar);
  campo.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { var a = lista.querySelector('a'); if (a) location.href = a.href; }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && aberta) fechar(); });
  tela.querySelector('.busca-cancelar').addEventListener('click', fechar);
  tela.addEventListener('click', function (e) { if (e.target === tela || e.target.classList.contains('busca-corpo')) fechar(); });

  /* ---------- v4: o motor da transição (o esfumaçado nunca anda mais rápido que ENTRA_MS/SAI_MS) ---------- */
  var atual = 0, alvo = 0, durMs = ENTRA_MS, raf = 0, ultimo = 0, aoChegar = null, montada = false;
  function suave(x) { return x * x * (3 - 2 * x); }                  // devagar no começo e no fim
  function montarTela() {
    if (montada) return; montada = true; atual = 0;
    campo.value = ''; pintar();
    tela.classList.remove('aberta'); tela.classList.add('arrastando'); tela.style.setProperty('--p', '0');
  }
  function levarA(p, ms, fim) {
    alvo = Math.max(0, Math.min(1, p)); durMs = ms; aoChegar = fim || null;
    if (!raf) { ultimo = 0; raf = requestAnimationFrame(passo); }
  }
  function passo(t) {
    var dt = ultimo ? Math.min(50, t - ultimo) : 16; ultimo = t;
    var d = alvo - atual, max = dt / durMs;
    atual = Math.abs(d) <= max ? alvo : atual + (d > 0 ? max : -max);
    tela.style.setProperty('--p', suave(atual).toFixed(3));
    if (atual === alvo) {
      raf = 0; var f = aoChegar; aoChegar = null; if (f) f();
    } else raf = requestAnimationFrame(passo);
  }
  function terminouDeAbrir() {
    tela.classList.remove('arrastando'); tela.classList.add('aberta'); tela.style.removeProperty('--p');
  }
  function terminouDeFechar() {
    montada = false; tela.classList.remove('arrastando', 'aberta'); tela.style.removeProperty('--p');
  }

  var aberta = false;
  function abrir(focar) {
    if (aberta) return; aberta = true;
    montarTela();                                                    // se o dedo já montou, segue de onde está
    document.documentElement.style.overflow = 'hidden';
    levarA(1, ENTRA_MS, terminouDeAbrir);
    if (focar === true) setTimeout(function () { campo.focus(); }, 60);   // só "/" ou Ctrl+K no computador
    esconderDica(true);
  }
  function fechar() {
    if (!aberta) return; aberta = false; campo.blur();
    document.documentElement.style.overflow = '';
    if (!montada) return;
    tela.classList.remove('aberta'); tela.classList.add('arrastando'); tela.style.setProperty('--p', suave(atual).toFixed(3));
    levarA(0, SAI_MS, terminouDeFechar);
  }
  window.aleaAbrirBusca = abrir;

  function montar() {
    document.body.appendChild(tela);
    campoDoRodape();
    if (CELULAR) ligarPuxar(); else ligarLupa();
  }

  /* ---------- v2: o campo "Buscar item" no rodapé, entre as categorias e as redes (foto 5574) ---------- */
  function campoDoRodape() {
    var css2 = document.createElement('style');
    css2.textContent = '.busca-rodape{display:flex;align-items:center;gap:8px;width:min(100%,240px);height:38px;margin:20px auto 16px;' +
      'padding:0 14px;border-radius:999px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);color:rgba(255,255,255,.72);' +
      'font:400 13px var(--fonte-corpo);cursor:pointer;text-align:left;-webkit-tap-highlight-color:transparent}' +
      '.busca-rodape:hover{background:rgba(255,255,255,.14);color:#fff}.busca-rodape svg{flex:none;width:15px;height:15px}';   // v3.1 (áudio 5581): menor
    document.head.appendChild(css2);
    document.querySelectorAll('footer.rodape').forEach(function (rod) {
      if (rod.querySelector('.busca-rodape')) return;
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'busca-rodape'; b.setAttribute('aria-label', 'Buscar item');
      b.innerHTML = LUPA + '<span>Buscar item</span>';
      b.addEventListener('click', function () { abrir(); });
      var antes = rod.querySelector('[data-redes]');
      if (antes) rod.insertBefore(b, antes); else rod.appendChild(b);
    });
  }

  /* ---------- computador: a lupa no topo ---------- */
  function ligarLupa() {
    var nav = document.querySelector('header.topo nav');
    if (!nav || nav.querySelector('[data-abrir="busca"]')) return;
    var b = document.createElement('button');
    b.className = 'botao-icone'; b.type = 'button'; b.setAttribute('data-abrir', 'busca'); b.setAttribute('aria-label', 'Buscar');
    b.innerHTML = LUPA + ' <span class="rotulo">Buscar</span>';
    b.addEventListener('click', function () { abrir(); });
    nav.insertBefore(b, nav.firstChild);
    document.addEventListener('keydown', function (e) {
      if ((e.key === '/' || (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey))) && !/INPUT|TEXTAREA/.test((e.target || {}).tagName || '')) {
        e.preventDefault(); abrir(true);
      }
    });
  }

  /* ---------- celular: puxar a tela pra baixo no topo ---------- */
  function ondeRola(el) {
    for (; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
      if (el.tagName === 'CANVAS' && el.closest('.janela3d-fundo, .telacheia')) return null; // a peça 3D gira pelo dedo (o canvas do feed não conta)
      var cs = getComputedStyle(el);
      if ((cs.overflowY === 'auto' || cs.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 1) return el;
    }
    return document.scrollingElement || document.documentElement;
  }
  function travada() {
    var b = document.body, home = b.classList.contains('home');
    if (home && !b.classList.contains('site-revelado') && !b.classList.contains('sem-abertura')) return true; // abertura rodando
    if (document.querySelector('.gaveta.aberta') || document.documentElement.classList.contains('janela3d-aberta')) return true; // sacola, conta ou personalizar aberta (o body.travado do feed NÃO conta)
    return !!document.querySelector('.telacheia.aberta, .janela3d-fundo.aberta, [role="dialog"].aberta:not(.busca-tela)');
  }
  function ligarPuxar() {
    var y0 = null, dy = 0;
    function pintarPuxao(p) {                                        // v4: o dedo só diz ATÉ ONDE; o motor diz a velocidade
      montarTela(); levarA(p, ENTRA_MS);
    }
    function desmontar() {
      if (!montada || aberta) return;
      levarA(0, SAI_MS, terminouDeFechar);
    }
    document.addEventListener('touchstart', function (e) {
      y0 = null; dy = 0;
      if (aberta || e.touches.length !== 1 || travada()) return;
      var sc = ondeRola(e.target);
      if (!sc || sc.scrollTop > 0) return;                            // só no topo, sem ter mais pra onde subir
      y0 = e.touches[0].clientY;
    }, { passive: true });
    document.addEventListener('touchmove', function (e) {
      if (y0 === null) return;
      dy = e.touches[0].clientY - y0;
      if (dy <= 6) { if (montada) pintarPuxao(0); return; }
      esconderDica();
      pintarPuxao(Math.min(1, dy / (PUXAR * 1.6)));                   // monta aos poucos, na medida do dedo
    }, { passive: true });
    function soltar() {
      if (y0 === null) return;
      var abre = dy >= PUXAR; y0 = null;
      if (abre) abrir(); else desmontar();                             // só abre de verdade ao soltar, sem teclado
    }
    document.addEventListener('touchend', soltar, { passive: true });
    document.addEventListener('touchcancel', function () { y0 = null; desmontar(); }, { passive: true });
    mostrarDica();
  }

  /* ---------- o aviso da primeira visita (só celular) ---------- */
  var dica = null, dicaTimer = null;
  function jaViuDica() { try { return localStorage.getItem(CHAVE_DICA) === '1'; } catch (e) { return false; } }
  function marcarDica() { try { localStorage.setItem(CHAVE_DICA, '1'); } catch (e) {} }
  function exibirDica() {
    if (dica || aberta) return;
    dica = document.createElement('div'); dica.className = 'busca-dica';
    dica.innerHTML = '<i aria-hidden="true">↓</i> Arraste a tela para baixo para pesquisar produtos';
    document.body.appendChild(dica);
    var d = dica;
    requestAnimationFrame(function () { requestAnimationFrame(function () { d.classList.add('vis'); }); });
    dicaTimer = setTimeout(function () { esconderDica(); }, 5000);
    /* some na primeira interação (toque ou rolagem), depois de um respiro pra não sumir com o próprio gesto que a trouxe */
    setTimeout(function () {
      if (dica !== d) return;
      function sai() { document.removeEventListener('touchstart', sai, true); document.removeEventListener('scroll', sai, true); if (dica === d) esconderDica(); }
      document.addEventListener('touchstart', sai, true); document.addEventListener('scroll', sai, true);
    }, 700);
  }
  function mostrarDica() {
    vigiarVoltaAoTopo();
    if (jaViuDica() && !/[?&]dica=1/.test(location.search)) return;
    var tenta = 0;
    (function esperar() {
      if (travada()) { if (++tenta < 60) setTimeout(esperar, 500); return; }
      marcarDica(); exibirDica();
    })();
  }
  /* v2: desceu pelo menos uma tela e voltou ao topo (sem mais pra onde subir) -> o aviso de novo */
  function vigiarVoltaAoTopo() {
    var desceu = false;
    document.addEventListener('scroll', function (e) {
      var el = (e.target === document || e.target === document.documentElement) ? (document.scrollingElement || document.documentElement) : e.target;
      if (!el || typeof el.scrollTop !== 'number' || el.scrollHeight <= el.clientHeight + 1) return;
      var alt = el.clientHeight || window.innerHeight;
      if (el.scrollTop > alt) desceu = true;
      else if (el.scrollTop <= 0 && desceu) { desceu = false; if (!travada()) exibirDica(); }
    }, true);
  }
  function esconderDica() {
    if (!dica) return;
    clearTimeout(dicaTimer); var d = dica; dica = null;
    d.classList.remove('vis'); setTimeout(function () { d.remove(); }, 450);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar); else montar();
})();
