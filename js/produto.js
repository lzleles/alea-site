/* CATALOGO:
   nome: produto
   categoria: UTIL
   objetivo: Controla galeria, tela cheia, personalização, preço, aceite e inclusão de produtos no carrinho.
   entrada: DOM da página, configuração comercial e dados do produto
   saida: Galeria interativa, item personalizado e comandos para o carrinho
   status: ativo (cabecalho proposto pelo Codex em 2026-09-20, confianca ALTA; conferir na proxima vez que o script rodar)
   validado_em: TBD
*/
/* =============================================================================
   produto.js — o que só a página de produto faz
   =============================================================================
   Tudo aqui saiu de pedido do Cassiano em 15/09/2026 (1ª e 2ª rodadas):

   1. A COLMEIA. "Todas as fotos em miniatura, espalhadas, onde você clica na miniatura
      e ela expande no lugar que ela está, fazendo com que as outras diminuem ao mesmo
      tempo." Quem cresce e encolhe é o CSS; aqui só mora quem está aberto.

   2. A TELA CHEIA (2ª rodada). "Toque novamente para tela cheia" — o segundo toque no
      favo já aberto abre a foto grande, com o fundo da página embaçado, e dá pra rolar
      pros lados. **Passar do fim FECHA, não dá a volta** — foi pedido literal: "quando
      chegar no final e rodar novamente, fechar a tela cheia e não fazer o loop, pro
      cliente ver que é a última foto".

   3. O ADICIONAL "Nome Colorido + R$ 30,00". O campo da cor do nome nasce desligado e
      só abre com o quadrado marcado; o valor entra no preço na hora e vai junto do item
      no carrinho.

   4. OS BOTÕES. "Comprar agora" e, ao lado, a sacola com um "+" — esse é o adicionar ao
      carrinho.

   5. A TRAVA DO ACEITE, agora sem recado fixo na tela: "somente quando clicar em comprar
      agora ou adicionar ao carrinho, tremer os botões e aparecer essa mensagem".

   ⚠️ A TRAVA É DE VERDADE, E NÃO SÓ VISUAL. A conferência acontece DENTRO do clique, e
   é ela que decide se o item entra. Trava que só pinta botão de cinza é trava que o
   primeiro visitante com teclado atravessa — e o que está do outro lado dela é uma
   declaração de consumo que vai junto do pedido.
   ========================================================================== */

(function () {
  'use strict';

  var colmeia = document.querySelector('[data-colmeia]');

  /* ⚠️ ETAPA 59 (3) (23/09/2026, vídeo das 16:40): "o cabeçalho continua mexendo". A 57 resolveu o arrastar pros
     LADOS; o que sobrou é o QUIQUE vertical do Safari no começo e no fim da página (a página passa do limite e volta,
     e o cabeçalho vai junto). O `overscroll-behavior: none` não segurou no iPhone dele, então aqui o gesto é
     cancelado na origem: no começo da página puxando pra baixo, ou no fim puxando pra cima, o toque não rola.
     Dentro do que rola sozinho (sacola, conta, janela de personalizar) nada muda. Só na página de produto. */
  (function semQuique() {
    var y0 = 0;
    document.addEventListener('touchstart', function (e) { if (e.touches.length === 1) y0 = e.touches[0].clientY; }, { passive: true });
    document.addEventListener('touchmove', function (e) {
      if (e.touches.length !== 1) return;
      for (var el = e.target; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
        var cs = getComputedStyle(el);
        if ((cs.overflowY === 'auto' || cs.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 1) return;
        if (el.tagName === 'CANVAS') return;           // a peça 3D gira pelo dedo
      }
      var se = document.scrollingElement || document.documentElement;
      var dy = e.touches[0].clientY - y0;
      var noTopo = se.scrollTop <= 0, noFim = se.scrollTop + window.innerHeight >= se.scrollHeight - 1;
      if ((noTopo && dy > 0) || (noFim && dy < 0)) e.preventDefault();
    }, { passive: false });
  })();

  /* ⚠️ ETAPA 58 (1) (23/09/2026, 16:08): "sempre que abrir qualquer produto, a foto do MEIO é a da capa; o resto
     pode ser em qualquer ordem". Qual favo fica no meio depende da largura (quantos cabem por linha), então é
     MEDIDO: acha o favo mais perto do centro da colmeia e põe a capa (data-favo=0) naquela posição. Cada favo
     leva o próprio data-favo, então a tela cheia continua abrindo a foto certa. */
  function capaNoMeio() {
    if (!colmeia) return;
    /* 25/09/2026: os favos-BOTÃO das configurações (.config) não entram na troca — eles são a linha de cima */
    var favos = Array.prototype.slice.call(colmeia.querySelectorAll('.favo:not(.config):not(.voltar)'));
    var capa = colmeia.querySelector('.favo[data-favo="0"]');
    if (!capa || favos.length < 3) return;
    var cx = colmeia.getBoundingClientRect(), mx = cx.left + cx.width / 2, my = cx.top + cx.height / 2;
    var melhor = 0, dist = Infinity;
    favos.forEach(function (f, k) {
      var r = f.getBoundingClientRect(), d = Math.hypot(r.left + r.width / 2 - mx, r.top + r.height / 2 - my);
      if (d < dist) { dist = d; melhor = k; }
    });
    var alvo = favos[melhor];
    if (alvo === capa) return;
    var depoisCapa = capa.nextSibling, depoisAlvo = alvo.nextSibling;
    colmeia.insertBefore(capa, depoisAlvo === capa ? alvo : depoisAlvo);
    colmeia.insertBefore(alvo, depoisCapa);
  }
  capaNoMeio();
  var capaEspera = null;
  window.addEventListener('resize', function () { clearTimeout(capaEspera); capaEspera = setTimeout(capaNoMeio, 200); });
  var telacheia = document.querySelector('[data-telacheia]');
  var caixaAceite = document.querySelector('[data-aceite-caixa]');
  var botaoComprar = document.querySelector('[data-comprar-agora]');

  /* ⚠️ ETAPA 53 (23/09/2026, 14:27, protótipo): botão "Personalize aqui" -> janela com a peça em 3D, nome
     gravado ao vivo e cores trocando na hora (js/personalizar3d.js). Só aparece no produto que tem modelo 3D
     no config.js; o three.js só é baixado no clique. */
  (function botaoPersonalizar3D() {
    var slug = botaoComprar && botaoComprar.getAttribute('data-slug');
    var cfg3d = slug && ((window.ALEA || {}).modelos3d || {})[slug];
    var form = document.querySelector('[data-personalizar]');
    if (!cfg3d || !form) return;
    var im = document.createElement('script');
    im.type = 'importmap';
    im.setAttribute('data-alea', '');
    im.textContent = JSON.stringify({ imports: {
      'three': 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js',
      'three/addons/': 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/',
      'three-mesh-bvh': 'https://cdn.jsdelivr.net/npm/three-mesh-bvh@0.8.3/build/index.module.js',
      'three-bvh-csg': 'https://cdn.jsdelivr.net/npm/three-bvh-csg@0.0.17/build/index.module.js' } });
    document.head.appendChild(im);
    /* ETAPA 55 (15:12, "essa parte a gente não vai mais precisar (...) vai estar inteira no Personalize aqui"):
       o formulário some da página e só aparece DENTRO da janela (o personalizar3d.js o move pra lá). O botão fica
       FORA do formulário, no lugar onde o formulário estava. */
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'botao personalizar-3d';
    b.textContent = 'Personalize aqui';
    form.parentNode.insertBefore(b, form);
    form.classList.add('mora-na-janela');
    var aberto = false;
    function abrir(depoisDeMontar, opcoes) {
      if (aberto) { if (depoisDeMontar) depoisDeMontar(); return; }
      aberto = true;
      b.classList.add('carregando');
      import('./personalizar3d.js').then(function (m) {
        return m.abrirJanela3D(cfg3d, function () { aberto = false; }, depoisDeMontar, opcoes || {});
      }).catch(function (e) { aberto = false; console.warn('janela 3D', e); })
        .then(function () { b.classList.remove('carregando'); });
    }
    b.addEventListener('click', function () { abrir(); });
    window.aleaAbrirPersonalizar = abrir;
  })();
  var botaoSacola = document.querySelector('[data-add-carrinho]');
  if (!colmeia && !botaoComprar) return;

  function favos() {
    return colmeia ? Array.prototype.slice.call(colmeia.querySelectorAll('.favo')) : [];
  }
  function fecharFavos() {
    favos().forEach(function (f) {
      f.classList.remove('aberto');
      f.setAttribute('aria-expanded', 'false');
    });
    if (colmeia) colmeia.classList.remove('tem-aberto');
  }

  /* ===================================================================== colmeia */
  /* ⚠️ OS ÁLBUNS (Cassiano, áudios 25/09/2026 11:19, 11:30 e 11:31 — msgs 1493, 1517, 1518). A colmeia das 7 fica
     como está ("tá muito lindo, não quero que mexa nelas"). Embaixo dela, 3 favos menores são os álbuns —
     tricolor, bicolor e monocromático — com o nome escrito em cima. "Se ele clicar em qualquer um dos álbuns, a
     gente abre outra tela pra ele, não tela cheia, mas quase cheia, só pra ele ver que tem muitas fotos e ali é um
     álbum. Se ele clicar na foto, ela expande num tamanho legal, mas com ele podendo clicar em qualquer lugar da
     tela ali fora pra voltar pras miniaturas." Não usa a tela cheia de carrossel. Os conjuntos vêm do
     `data-albuns` que o gerador v15 escreve a partir do produtos.js. */
  function topo(q, c) { if (window.aleaCorDoTopo) window.aleaCorDoTopo(q, c); }
  (function albuns() {
    var caixaAlbuns = document.querySelector('[data-albuns]');
    var tela = document.querySelector('[data-album-tela]');
    if (!caixaAlbuns || !tela) return;
    var albuns = {};
    try { albuns = JSON.parse(caixaAlbuns.getAttribute('data-albuns') || '{}'); } catch (e) { albuns = {}; }
    var grade = tela.querySelector('[data-album-grade]');
    var grande = tela.querySelector('[data-album-grande]');
    var nome = tela.querySelector('[data-album-nome]');
    var conta = tela.querySelector('[data-album-conta]');
    var h1 = document.querySelector('.produto-topo h1');
    var peca = h1 ? h1.textContent.trim() : 'a peça';
    var aberto = null, gAtual = -1, gOrdem = [], carregadas = {};
    /* v17: o contador "2 / 6" da foto ampliada (criado aqui pra não mexer no HTML gerado) */
    var contaG = document.createElement('span');
    contaG.className = 'album-conta-grande';
    grande.appendChild(contaG);
    /* v18 (áudios 1623-1624 do Cassiano, vídeo 1622): a foto ampliada vira TELA CHEIA DE VERDADE — sai de dentro da caixa
       do álbum e mora direto no <body>, fixa na tela, com fundo liso que não mexe. Sem X e sem texto: só o "3 / 6"
       suave embaixo. Sai ARRASTANDO pra baixo ou pra cima, "igual o iPhone, o Android"; passa DESLIZANDO pro lado. */
    document.body.appendChild(grande);
    var gImg = grande.querySelector('img');
    /* v20 (áudios 1671/1673): um X bem discreto, só o traço, branco fraco — o arrastar pra cima/baixo continua fechando */
    var gX = document.createElement('button');
    gX.type = 'button'; gX.className = 'x-discreto album-grande-x'; gX.setAttribute('aria-label', 'Fechar a foto');
    gX.textContent = '\u00d7';
    gX.addEventListener('click', function (e) { e.stopPropagation(); fecharGrande(); });
    grande.appendChild(gX);
    var mouse = !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);

    function abrirAlbum(id) {
      var a = albuns[id];
      if (!a || !a.fotos || !a.fotos.length) return;
      aberto = a;
      nome.textContent = a.nome;
      conta.textContent = a.fotos.length + (a.fotos.length === 1 ? ' foto' : ' fotos');
      grade.classList.remove('tem-aberto');
      grade.innerHTML = a.fotos.map(function (f, n) {
        return '<button class="favo" type="button" data-album-foto="' + n + '" aria-label="Ampliar foto ' + (n + 1) + ' do álbum ' + a.nome + '">' +
          '<img src="img/produtos/' + f + '_m.jpg" width="700" height="700" loading="lazy" decoding="async" alt="' + peca + ' ' + a.nome + ' — foto ' + (n + 1) + '"></button>';
      }).join('');
      fecharGrande();
      tela.classList.add('aberta');
      tela.setAttribute('aria-hidden', 'false');
      document.body.classList.add('travado');
      /* v21 (áudios 1685/1689/1691): janela NÃO troca a cor do topo — "prevalece esse sombreamento bonito"; só a tela cheia emenda */
    }
    function fecharAlbum() {
      tela.classList.remove('aberta');
      tela.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('travado');
      aberto = null;
    }
    /* v19 (áudios 1632-1634): "qualquer foto que ele clicar vai ser a número 1; depois segue a ordem normal, da
       esquerda pra direita, de cima pra baixo" — pra quem toca na 7ª não chegar no fim logo e achar que fechou. */
    function comecarEm(n) {
      gOrdem = [n];
      for (var k = 0; k < aberto.fotos.length; k++) if (k !== n) gOrdem.push(k);
      if (window.aleaAbrirTelaCheia) {
        var lista = aberto.fotos.map(function (f) { return 'img/produtos/' + f + '.jpg'; });
        window.aleaAbrirTelaCheia(n, lista, gOrdem);
        return;
      }
      mostrarGrande(0);
    }
    function preparar(f) {
      if (carregadas[f]) return;
      var i = new Image();
      i.onload = function () { carregadas[f] = true; };
      i.src = 'img/produtos/' + f + '.jpg';
    }
    function mostrarGrande(pos) {
      if (!aberto) return;
      gAtual = pos;
      var n = gOrdem[pos];
      contaG.textContent = aberto.fotos.length > 1 ? (pos + 1) + ' / ' + aberto.fotos.length : '';
      /* v19: foto já baixada entra direto (sem piscar a miniatura); as vizinhas ficam baixando por trás */
      if (gOrdem[pos + 1] !== undefined) preparar(aberto.fotos[gOrdem[pos + 1]]);
      if (gOrdem[pos - 1] !== undefined) preparar(aberto.fotos[gOrdem[pos - 1]]);
      if (carregadas[aberto.fotos[n]]) { gImg.setAttribute('data-foto', aberto.fotos[n]); gImg.src = 'img/produtos/' + aberto.fotos[n] + '.jpg'; mostrarCamada(); return; }
      /* v16: a miniatura (_m, já carregada) aparece NA HORA e a foto inteira entra por cima quando chegar —
         no 4G a tela ficava só esmaecida por um instante e parecia que o clique não pegou */
      var img = gImg, f = aberto.fotos[n], cheia = new Image();
      img.setAttribute('data-foto', f);
      img.src = 'img/produtos/' + f + '_m.jpg';
      cheia.onload = function () { carregadas[f] = true; if (img.getAttribute('data-foto') === f) img.src = cheia.src; };
      cheia.src = 'img/produtos/' + f + '.jpg';
      mostrarCamada();
    }
    /* v19 (áudio 1628, "gostei mais dessa primeira transição, mais suave, mais elegante"): a camada entra e sai
       esmaecendo em .28s, igual à tela cheia da colmeia */
    var saida = null;
    function mostrarCamada() {
      clearTimeout(saida);
      grande.classList.remove('saindo');
      if (grande.hidden) { grande.hidden = false; tela.classList.add('com-grande'); topo('foto', '#F4F0EB'); }
    }
    function fecharGrande() {
      if (grande.hidden) return;
      gAtual = -1;
      topo('foto', null);
      grande.classList.add('saindo');
      clearTimeout(saida);
      saida = setTimeout(function () { grande.hidden = true; grande.classList.remove('saindo'); tela.classList.remove('com-grande'); }, 280);
    }
    /* v17 (áudios 1613-1614 do Cassiano): a foto ampliada do álbum PASSA pro lado, e "chegou na última foto, o cliente
       apertou de novo pra rolar ou clicou pra passar, aí fecha" — SEM VOLTA, o mesmo esquema da tela cheia da colmeia.
       Fechar aqui é voltar pras miniaturas do álbum, não sair do álbum. */
    function andarGrande(dir) {
      if (!aberto || gAtual < 0) return;
      var pos = gAtual + dir;
      if (pos < 0 || pos >= gOrdem.length) { fecharGrande(); return; }
      mostrarGrande(pos);
    }
    var toque = null;
    function soltar() {
      gImg.style.transition = ''; gImg.style.transform = ''; grande.style.backgroundColor = '';
    }
    grande.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) { toque = null; return; }
      toque = { x: e.touches[0].clientX, y: e.touches[0].clientY, dx: 0, dy: 0, eixo: null };
      gImg.style.transition = 'none';
    }, { passive: true });
    /* passive:false + preventDefault: é isto que segura a página de trás parada enquanto o dedo mexe na foto */
    grande.addEventListener('touchmove', function (e) {
      e.preventDefault();
      if (!toque) return;
      var t = e.touches[0];
      toque.dx = t.clientX - toque.x; toque.dy = t.clientY - toque.y;
      if (!toque.eixo && (Math.abs(toque.dx) > 8 || Math.abs(toque.dy) > 8)) toque.eixo = Math.abs(toque.dx) > Math.abs(toque.dy) ? 'x' : 'y';
      if (toque.eixo === 'y') {
        var k = Math.min(Math.abs(toque.dy) / 400, 1);
        gImg.style.transform = 'translateY(' + toque.dy + 'px) scale(' + (1 - k * .15) + ')';
        grande.style.backgroundColor = 'rgba(246, 243, 238, ' + (1 - k * .6) + ')';
      } else if (toque.eixo === 'x' && Math.abs(toque.dx) >= 40) {
        var dir = toque.dx < 0 ? 1 : -1;
        toque = null; soltar();
        andarGrande(dir);
      }
    }, { passive: false });
    grande.addEventListener('touchend', function () {
      if (!toque) return;
      var t = toque; toque = null;
      soltar();
      if (t.eixo === 'y' && Math.abs(t.dy) > 90) fecharGrande();
    }, { passive: true });
    grande.addEventListener('touchcancel', function () { toque = null; soltar(); }, { passive: true });
    /* no computador não há arrastar: clique na foto ou Esc volta pras miniaturas; rodinha e setas passam */
    grande.addEventListener('click', function () { if (mouse) fecharGrande(); });
    grande.addEventListener('wheel', function (e) {
      if (grande.hidden) return;
      var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(d) < 8) return;
      e.preventDefault();
      andarGrande(d > 0 ? 1 : -1);
    }, { passive: false });

    /* v20 (áudios 1668-1669): "a tela de trás nunca pode rolar"; "toda janela que só envolva foto, se eu arrastar pra
       cima ou pra baixo, fecha". Nas MINIATURAS do álbum: se a caixa não precisa rolar, o dedo não rola nada e o
       arrasto vertical fecha o álbum; se precisa (álbum grande), ela rola por dentro e só o excesso é segurado. */
    var tt = null;
    var caixa = tela.querySelector('.album-caixa');
    tela.addEventListener('touchstart', function (e) {
      tt = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
    }, { passive: true });
    tela.addEventListener('touchmove', function (e) {
      var rola = caixa && caixa.scrollHeight > caixa.clientHeight + 1 && caixa.contains(e.target);
      if (!rola) e.preventDefault();
      /* v21 (áudio 1687): "em janela que não seja tela cheia, não vai poder fechar rolando; vai prevalecer o X" — o
         álbum vai ter muitas fotos e a pessoa vai rolar pra ver. O arrasto só rola a caixa; a página de trás nunca. */
    }, { passive: false });
    tela.addEventListener('touchend', function () { tt = null; }, { passive: true });

    caixaAlbuns.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-album]');
      if (b) abrirAlbum(b.getAttribute('data-album'));
    });
    tela.addEventListener('click', function (ev) {
      if (ev.target.closest('[data-fechar-album]')) { if (!grande.hidden) fecharGrande(); else fecharAlbum(); return; }
      /* v21 (áudios 1683-1684): "clicar uma vez amplia a foto um pouco, do mesmo tamanho das colmeias da outra página;
         clicar de novo vai pra tela cheia". E com uma ampliada, o próximo toque só devolve ela pro lugar. */
      var ampliada = grade.querySelector('.favo.aberto');
      var f = ev.target.closest('[data-album-foto]');
      if (ampliada) {
        if (f === ampliada) { comecarEm(parseInt(f.getAttribute('data-album-foto'), 10)); return; }
        ampliada.classList.remove('aberto');
        /* v22 (áudio 1699): outra foto do álbum = a ampliação troca direto pra ela; fora das fotos = só devolve */
        if (f) { f.classList.add('aberto'); return; }
        grade.classList.remove('tem-aberto');
        return;
      }
      if (f) { f.classList.add('aberto'); grade.classList.add('tem-aberto'); return; }
      /* clicar fora da caixa (no escuro) fecha o álbum */
      if (!ev.target.closest('.album-caixa')) fecharAlbum();
    });
    document.addEventListener('keydown', function (ev) {
      if (!tela.classList.contains('aberta')) return;
      var tc = document.querySelector('[data-telacheia]');
      if (tc && tc.classList.contains('aberta')) return;
      if (!grande.hidden && (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft')) { ev.preventDefault(); andarGrande(ev.key === 'ArrowRight' ? 1 : -1); return; }
      if (ev.key !== 'Escape') return;
      ev.preventDefault();
      if (!grande.hidden) fecharGrande(); else fecharAlbum();
    });
  })();

  if (colmeia) {
    colmeia.addEventListener('click', function (ev) {
      var favo = ev.target.closest('[data-favo]');
      if (!favo) return;
      var n = parseInt(favo.getAttribute('data-favo'), 10);
      /* segundo toque no MESMO favo = tela cheia. Primeiro toque = só expande. */
      if (favo.classList.contains('aberto')) { abrirTelaCheia(n); return; }
      fecharFavos();
      favo.classList.add('aberto');
      favo.setAttribute('aria-expanded', 'true');
      colmeia.classList.add('tem-aberto');
    });
  }

  /* ⚠️ CLICAR EM QUALQUER LUGAR FECHA A MINIATURA AMPLIADA (3ª rodada de 15/09/2026).
     Ele notou a assimetria: na tela cheia, clicar fora fechava; na colmeia, a foto
     ampliada só voltava ao tamanho se clicasse nela de novo — e ninguém adivinha isso.
     O ouvinte é no documento, e sai de cena quando o clique foi DENTRO da colmeia (lá
     o primeiro clique expande e o segundo abre a tela cheia) ou na tela cheia. */
  /* v19 (vídeo 1630 + áudio 1631, 25/09/2026): "sempre que tiver uma imagem na ampliação 1, você só vai conseguir
     acessar outras coisas depois que ela voltar pro lugar dela". Ouvinte em CAPTURA: o toque fora do favo aberto
     (inclusive no espaço vazio da colmeia, no canto de baixo, num álbum ou num botão) é ENGOLIDO e só fecha a
     ampliação; o próximo toque é que faz a coisa. Tocar no próprio favo aberto continua abrindo a tela cheia. */
  document.addEventListener('click', function (ev) {
    if (!colmeia || !colmeia.classList.contains('tem-aberto')) return;
    if (ev.target.closest('[data-telacheia]')) return;
    var ab = colmeia.querySelector('.favo.aberto');
    if (ab && ab.contains(ev.target)) return;
    /* v22 (áudio 1699): tocar em OUTRA foto da colmeia troca a ampliação direto pra ela (o clique segue pro ouvinte
       da colmeia, que fecha a antiga e amplia a nova); só o toque FORA das fotos é engolido e apenas devolve. */
    if (ev.target.closest('[data-colmeia] [data-favo]')) return;
    ev.preventDefault();
    ev.stopPropagation();
    fecharFavos();
  }, true);

  /* =================================================================== tela cheia */
  var fotosGrandes = [];
  try { fotosGrandes = JSON.parse(colmeia && colmeia.getAttribute('data-grandes') || '[]'); }
  catch (e) { fotosGrandes = []; }
  var tcAtual = -1, tcOrdem = [], tcLista = fotosGrandes;
  /* v19 (áudios 1632-1634): a foto tocada é a nº 1; depois vem a ordem de leitura da colmeia (a ordem dos favos na
     página — esquerda pra direita, de cima pra baixo), pulando a que já foi. */
  function ordemDaColmeia(n) {
    var seq = [n];
    favos().forEach(function (f) {
      var k = parseInt(f.getAttribute('data-favo'), 10);
      if (!isNaN(k) && k !== n && k < fotosGrandes.length) seq.push(k);
    });
    for (var k = 0; k < fotosGrandes.length; k++) if (seq.indexOf(k) < 0) seq.push(k);
    return seq;
  }

  /* v23 (vídeo 1714 + áudio 1713): as fotos do ÁLBUM abrem NESTA tela cheia (a da colmeia, a que emendou o topo e o
     rodapé no iPhone dele) — com a lista e a ordem do álbum. `lista`/`ordem` vazios = a colmeia, como antes. */
  function abrirTelaCheia(n, lista, ordem) {
    tcLista = lista || fotosGrandes;
    telacheia && telacheia.classList.toggle('sobre-album', !!lista);
    if (!telacheia || !tcLista.length) return;
    tcOrdem = ordem || ordemDaColmeia(n);
    tcAtual = 0;
    pintarTelaCheia();
    telacheia.classList.add('aberta');
    telacheia.setAttribute('aria-hidden', 'false');
    document.body.classList.add('travado');
    topo('telacheia', '#F4F0EB');        /* papel a 82% sobre o bege: a cor que o fundo embaçado mostra */
  }

  function fecharTelaCheia() {
    if (!telacheia) return;
    telacheia.classList.remove('aberta');
    telacheia.setAttribute('aria-hidden', 'true');
    topo('telacheia', null);
    /* v23: se veio de um álbum, o álbum continua aberto — a página de trás continua travada */
    var alb = document.querySelector('[data-album-tela]');
    if (!(alb && alb.classList.contains('aberta'))) document.body.classList.remove('travado');
  }

  function pintarTelaCheia() {
    var palco = telacheia.querySelector('[data-palco-tc]');
    var pontos = telacheia.querySelector('[data-pontos-tc]');
    var conta = telacheia.querySelector('[data-conta-tc]');
    palco.innerHTML = '<img src="' + tcLista[tcOrdem[tcAtual]] + '" alt="Foto ' +
      (tcAtual + 1) + ' de ' + tcLista.length + '">';
    pontos.innerHTML = tcLista.map(function (_, k) {
      return '<i class="' + (k === tcAtual ? 'on' : '') + '"></i>';
    }).join('');
    conta.textContent = (tcAtual + 1) + ' / ' + tcLista.length;
  }

  /* ⚠️ SEM VOLTA: passar do fim (ou do começo) FECHA em vez de dar a volta. É o pedido
     dele, e a razão é boa — carrossel que gira pra sempre não deixa o visitante saber
     que já viu tudo, e ele fica rodando achando que falta foto. */
  function andarTelaCheia(dir) {
    var n = tcAtual + dir;
    if (n < 0 || n >= tcLista.length) { fecharTelaCheia(); return; }
    tcAtual = n;
    pintarTelaCheia();
  }

  window.aleaAbrirTelaCheia = abrirTelaCheia;
  if (telacheia) {
    telacheia.addEventListener('click', function (ev) {
      if (ev.target.closest('[data-fechar-tc]')) { fecharTelaCheia(); return; }
      /* clicar em qualquer lugar que não seja a foto fecha — ele pediu essa saída pra
         quem abriu a tela cheia sem querer */
      if (!ev.target.closest('img')) fecharTelaCheia();
    });

    /* v20 (áudios 1668-1669): passive:false + preventDefault = a página de trás NUNCA rola com a tela cheia aberta;
       arrastar pro lado passa (como antes); arrastar pra cima ou pra baixo FECHA. */
    var tx = null, ty = null;
    telacheia.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
    telacheia.addEventListener('touchmove', function (e) {
      e.preventDefault();
      if (tx === null) return;
      var dx = tx - e.touches[0].clientX, dy = e.touches[0].clientY - ty;
      if (Math.abs(dy) > 70 && Math.abs(dy) > Math.abs(dx)) { tx = null; fecharTelaCheia(); return; }
      if (Math.abs(dx) < 40) return;
      tx = null;
      andarTelaCheia(dx > 0 ? 1 : -1);
    }, { passive: false });
    telacheia.addEventListener('touchend', function () { tx = null; }, { passive: true });

    telacheia.addEventListener('wheel', function (e) {
      if (!telacheia.classList.contains('aberta')) return;
      var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(d) < 8) return;
      e.preventDefault();
      andarTelaCheia(d > 0 ? 1 : -1);
    }, { passive: false });
  }

  document.addEventListener('keydown', function (ev) {
    if (telacheia && telacheia.classList.contains('aberta')) {
      if (ev.key === 'Escape') { ev.preventDefault(); fecharTelaCheia(); }
      else if (ev.key === 'ArrowRight') { ev.preventDefault(); andarTelaCheia(1); }
      else if (ev.key === 'ArrowLeft') { ev.preventDefault(); andarTelaCheia(-1); }
      return;
    }
    /* fechar a foto aberta da colmeia com Esc é o reflexo de todo mundo */
    if (ev.key === 'Escape' && colmeia && colmeia.classList.contains('tem-aberto')) fecharFavos();
  });

  /* ============================================== o adicional e o preço que muda */
  var alvoValor = document.querySelector('[data-valor]');
  var precoBase = alvoValor && alvoValor.getAttribute('data-preco-base');
  precoBase = (precoBase === null || precoBase === '') ? null : parseFloat(precoBase);

  function extrasMarcados() {
    return Array.prototype.slice.call(document.querySelectorAll('[data-extra]'))
      .filter(function (l) { return l.querySelector('[data-extra-caixa]').checked; })
      .map(function (l) {
        return {
          id: l.getAttribute('data-extra-id'),
          rotulo: l.querySelector('.titulo-extra').firstChild.nodeValue.trim().replace(/\s*\+\s*R\$.*$/, ''),
          preco: parseFloat(l.getAttribute('data-extra-preco')) || 0
        };
      });
  }

  function precoTotal() {
    if (precoBase === null) return null;
    return extrasMarcados().reduce(function (s, x) { return s + x.preco; }, precoBase);
  }

  function repintarPreco() {
    if (!alvoValor) return;
    var t = precoTotal();
    alvoValor.innerHTML = (t === null) ? '<small>Sob consulta</small>' : window.aleaDinheiro(t);
  }

  /* ⚠️ ETAPA 52 (23/09/2026, 14:03, áudio dele): a COR DO NOME ganha a mesma janelinha das cores da
     peça — Básico · Fosco · Perolizado e, depois, a lista de cores daquele acabamento. O campo de texto
     que o gerador escreve é TROCADO aqui (o gerador segue igual; a troca vive no JS, num lugar só). */
  var FIL_ = (window.ALEA || {}).filamentos || {};
  var ACAB_ = (window.ALEA || {}).acabamentos || [];
  var corNomeBox = null;
  (function trocarCorDoNome() {
    var velho = document.querySelector('[data-personalizar] input[name="cor_nome"]');
    if (!velho) return;
    var caixa = document.createElement('div');
    caixa.className = 'campo-cor campo-cor-nome';
    caixa.setAttribute('data-parte', 'nome');
    caixa.innerHTML = '<div class="acabamentos">' + ACAB_.map(function (ac) {
        return '<label class="acabamento"><input type="radio" name="acab_nome" value="' + ac.id + '" disabled> ' +
          ac.rotulo + '</label>';
      }).join('') + '</div>' +
      '<select name="cor_nome" disabled aria-label="Cor do nome"><option value=""></option></select>';   /* ETAPA 59: travada = sem frase */
    velho.parentNode.replaceChild(caixa, velho);
    corNomeBox = caixa;
    caixa.addEventListener('change', function (ev) {
      var rad = ev.target.closest && ev.target.closest('.acabamento input');
      if (!rad) return;
      var sel = caixa.querySelector('select');
      sel.innerHTML = '<option value="">Escolha a cor</option>' + (FIL_[rad.value] || []).map(function (f) {
        return '<option value="' + f.site + '">' + f.site + '</option>'; }).join('');
      sel.disabled = false;
      var rot = caixa.closest('label'); if (rot) rot.classList.remove('faltou');
      try { sel.focus({ preventScroll: true }); } catch (e) { sel.focus(); }
    });
  })();

  function travarCorDoNome(liberar) {
    if (!corNomeBox) return;
    var sel = corNomeBox.querySelector('select');
    Array.prototype.forEach.call(corNomeBox.querySelectorAll('.acabamento input'), function (r) {
      r.disabled = !liberar; if (!liberar) r.checked = false;
    });
    sel.disabled = true;
    sel.innerHTML = '<option value="">' + (liberar ? 'Escolha o acabamento acima' : '') + '</option>';
  }

  function corDoNomeEscolhida() {
    if (!corNomeBox) return { texto: '', original: '', escolha: null };
    var ac = corNomeBox.querySelector('.acabamento input:checked');
    var sel = corNomeBox.querySelector('select');
    if (!ac || !sel.value) return { texto: '', original: '', escolha: null };
    var def = ACAB_.filter(function (x) { return x.id === ac.value; })[0] || { sufixo: '' };
    var fil = (FIL_[ac.value] || []).filter(function (f) { return f.site === sel.value; })[0];
    return { texto: sel.value + def.sufixo, original: fil ? fil.original : sel.value + def.sufixo,
             escolha: { acabamento: ac.value, cor: sel.value } };
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-extra]'), function (rot) {
    var caixa = rot.querySelector('[data-extra-caixa]');
    caixa.addEventListener('change', function () {
      rot.classList.toggle('marcado', caixa.checked);
      travarCorDoNome(caixa.checked);
      repintarPreco();
    });
  });

  /* ==================================================== as cores da peça
     "Apagar o quadrado de escrita e colocar as bolinhas igual do Declaro; quando o
     cliente clicar na bolinha, aparece a quantidade de quadrado correspondente à cor
     que ele escolheu" (Cassiano, 15/09/2026, 3ª rodada).

     O Degradê é o caso especial: não abre campo nenhum e mostra o aviso que ele ditou —
     filamento sazonal não se promete antes de existir. */
  var caixaCores = document.querySelector('[data-cores-peca]');
  var camposCores = document.querySelector('[data-cores-campos]');

  /* ⚠️ ETAPA 28 (22/09/2026, 21:19): o SORTEIO saiu — "algumas não têm tantas opções por se tratar
     de filamento". Agora é UMA cor por caixa, FIXA, na ordem que ele ditou, de cima pra baixo:
     1ª caixa "Ex.: Azul Fosco…", 2ª "Ex.: Verde…", 3ª "Ex.: Branco Perolizado…" (a ordem das 21:23,
     que substitui a das 21:19; o "Verde" sem acabamento é literal dele). No bicolor valem as duas
     primeiras; no monocromático, a primeira. */
  /* ETAPA 29 (21:25): no BICOLOR, "por se tratar de somente 2 janelas, iremos colocar mais de uma":
     Cor principal "Ex.: Vermelho, Laranja Fosco…" e Cor da base "Ex.: Amarelo Perolizado, Prata…".
     O tricolor segue a lista de cima; o monocromático, a primeira dela (até ele dizer outra). */
  var EXEMPLO_POR_CAIXA = ['Ex.: Azul Fosco…', 'Ex.: Verde…', 'Ex.: Branco Perolizado…'];
  var EXEMPLO_BICOLOR = ['Ex.: Vermelho, Laranja Fosco…', 'Ex.: Amarelo Perolizado, Prata…'];
  /* ETAPA 30 (21:28): o MONOCROMÁTICO ganhou o dele — "Ex.: Roxo Perolizado, Rosa Fosco, Dourado…" */
  var EXEMPLO_MONO = ['Ex.: Roxo Perolizado, Rosa Fosco, Dourado…'];
  function exemploDeCor(k, quantos) {
    var lista = quantos === 2 ? EXEMPLO_BICOLOR : quantos === 1 ? EXEMPLO_MONO : EXEMPLO_POR_CAIXA;
    return lista[k - 1] || lista[0];
  }

  function desenharCamposDeCor(radio) {
    if (!camposCores) return;
    camposCores.innerHTML = '';
    var aviso = radio.getAttribute('data-aviso');
    if (aviso) {
      var p = document.createElement('p');
      p.className = 'aviso-degrade';
      p.textContent = aviso;
      camposCores.appendChild(p);
      return;
    }
    var quantos = parseInt(radio.getAttribute('data-campos'), 10) || 0;
    /* ⚠️ ETAPA 26 (22/09/2026, 21:04-21:08): "cor 1, cor 2, cor 3 fica muito feio pro cliente". O
       quadradinho da esquerda deixa de ser número e diz ONDE vai a cor — tricolor: Topo, Principal,
       Base; bicolor: Principal, Base (palavras dele); monocromático: Principal (a peça inteira é a
       cor principal — dedução minha, avisada a ele). E cada caixa ganha um exemplo como o da cor
       do nome, com cores SORTEADAS: "Ex.: <cor> Sólido, <cor> Fosco, <cor> Perolizado…". */
    /* ETAPA 58 (3) (16:11): no BICOLOR "a primeira cor é a do topo, a segunda serve pro meio e a base" */
    var PARTES = { 3: ['Topo', 'Principal', 'Base'], 2: ['Topo', 'Principal'], 1: ['Principal'] };
    var partes = PARTES[quantos] || [];
    /* ETAPA 27 (21:09, "aliás, melhor"): o quadradinho da esquerda SAI de vez; a caixa branca fica
       onde está (mesmo recuo), e o nome vai EM CIMA dela, como os outros rótulos do formulário:
       "Cor do topo", "Cor principal", "Cor da base". É um <label> de verdade (clicar no nome põe o
       cursor na caixa) e herda o estilo do `.personalizar label`. */
    var NOME_DA_PARTE = { Topo: 'Cor do topo', Principal: 'Cor principal', Base: 'Cor da base' };
    /* ⚠️ ETAPA 51 (23/09/2026, 13:19, pedido dele): a cor sai de uma LISTA, não mais digitada. "No lugar
       do Cor Principal, com a mesma letra, tamanho e cor, só vai mudar pra Básico, Fosco e Perolizado,
       com a mesma bolinha do Monocromático; só quando a pessoa clicar em alguma dessas, deixa clicar na
       janela pra escolher a cor correspondente ao acabamento." A lista vem de ALEA.filamentos (config.js).
       No tricolor/bicolor o nome da parte ("Cor do topo"...) passa pra DENTRO da janela, como a primeira
       linha dela — sem isso o cliente não saberia qual janela é o topo e qual é a base. */
    var FIL = (window.ALEA || {}).filamentos || {};
    var ACAB = (window.ALEA || {}).acabamentos || [];
    for (var k = 1; k <= quantos; k++) {
      var parte = partes[k - 1] || ('Cor ' + k);
      var titulo = NOME_DA_PARTE[parte] || parte;
      var linha = document.createElement('div');
      linha.className = 'campo-cor';
      linha.setAttribute('data-parte', parte.toLowerCase());
      linha.setAttribute('data-titulo', titulo);
      var bolinhas = ACAB.map(function (ac) {
        return '<label class="acabamento"><input type="radio" name="acab_' + k + '" value="' + ac.id + '"> ' +
          ac.rotulo + '</label>';
      }).join('');
      linha.innerHTML = '<div class="acabamentos">' + bolinhas + '</div>' +
        '<select name="cor_' + k + '" data-parte="' + parte.toLowerCase() + '" disabled ' +
        'aria-label="' + titulo + '"><option value="">' + (quantos > 1 ? titulo :
        'Escolha o acabamento acima') + '</option></select>';
      camposCores.appendChild(linha);
    }
    camposCores.onchange = function (ev) {
      var rad = ev.target.closest && ev.target.closest('.acabamento input');
      if (!rad) return;
      var dono = rad.closest('.campo-cor');
      var sel = dono.querySelector('select');
      var tit = dono.getAttribute('data-titulo') || 'Cor';
      var lista = FIL[rad.value] || [];
      sel.innerHTML = '<option value="">' + (quantos > 1 ? tit + ': escolha a cor' : 'Escolha a cor') + '</option>' +
        lista.map(function (f) { return '<option value="' + f.site + '">' + f.site + '</option>'; }).join('');
      sel.disabled = false;
      dono.classList.remove('faltou');
      try { sel.focus({ preventScroll: true }); } catch (e) { sel.focus(); }
    };
    return;
    var primeiro = camposCores.querySelector('input');
    if (primeiro) primeiro.focus();
  }

  if (caixaCores) {
    caixaCores.addEventListener('change', function (ev) {
      var r = ev.target.closest('input[name="cores_peca"]');
      if (r) desenharCamposDeCor(r);
    });
  }

  function coresEscolhidas() {
    if (!caixaCores) return null;
    var r = caixaCores.querySelector('input[name="cores_peca"]:checked');
    if (!r) return null;
    /* ETAPA 51: cada janela devolve acabamento + cor. `cores` é o que o cliente lê ("Azul Fosco");
       `originais` é o nome EXATO do filamento, que vai só no pedido pro Cassiano; `escolhas` serve pro
       "editar" da sacola remontar as janelas. */
    var FIL = (window.ALEA || {}).filamentos || {};
    var ACAB = (window.ALEA || {}).acabamentos || [];
    var escolhas = [], lista = [], originais = [];
    Array.prototype.forEach.call(camposCores.querySelectorAll('.campo-cor'), function (c) {
      var ac = c.querySelector('.acabamento input:checked');
      var sel = c.querySelector('select');
      if (!ac || !sel || !sel.value) return;
      var def = ACAB.filter(function (x) { return x.id === ac.value; })[0] || { sufixo: '' };
      var fil = (FIL[ac.value] || []).filter(function (f) { return f.site === sel.value; })[0];
      escolhas.push({ acabamento: ac.value, cor: sel.value });
      lista.push(sel.value + def.sufixo);
      originais.push(fil ? fil.original : sel.value + def.sufixo);
    });
    return {
      modo: r.parentNode.textContent.trim(),
      cores: lista,
      originais: originais,
      escolhas: escolhas,
      a_combinar: !!r.getAttribute('data-aviso')
    };
  }

  /* ==================================================== o aceite, os dois botões */
  function campo(nome) {
    var el = document.querySelector('[data-personalizar] [name="' + nome + '"]');
    return el ? el.value.trim() : '';
  }

  function reclamarDoAceite() {
    var recado = document.querySelector('[data-recado-aceite]');
    var botoes = document.querySelector('[data-botoes]');
    var rotulo = document.querySelector('[data-aceite]');
    if (recado) recado.hidden = false;
    if (rotulo) rotulo.classList.add('faltou');
    if (botoes) {
      botoes.classList.remove('tremendo');
      void botoes.offsetWidth;        // reinicia a animação se ele clicar duas vezes
      botoes.classList.add('tremendo');
    }
  }

  function montarItem() {
    var extras = extrasMarcados();
    return {
      slug: botaoComprar.getAttribute('data-slug'),
      nome: botaoComprar.getAttribute('data-nome'),
      preco: precoTotal(),
      capa: botaoComprar.getAttribute('data-capa'),
      /* ETAPA 58 (9): a miniatura é a PEÇA COMO O CLIENTE MONTOU (foto da janela 3D); sem ela, a capa */
      miniatura: window.aleaMiniatura3D || null,
      material: botaoComprar.getAttribute('data-material'),
      personalizacao: {
        nome_pet: campo('nome_pet'),
        sem_nome: !campo('nome_pet') && !!(document.querySelector('[data-personalizar]') || { hasAttribute: function () { return false; } }).hasAttribute('data-sem-nome'),
        cor_nome: corDoNomeEscolhida().texto,
        cor_nome_original: corDoNomeEscolhida().original,
        cor_nome_escolha: corDoNomeEscolhida().escolha,
        cores: coresEscolhidas()
      },
      extras: extras,
      /* o ACEITE vai junto do item, com data e hora. É a prova de que a declaração foi
         marcada ANTES da compra — e é ela que sustenta a regra de não cancelamento que
         está escrita na mesma página. Aceite que não fica registrado não serve de nada. */
      aceite: { marcado: true, quando: new Date().toISOString() }
    };
  }

  /* ⚠️ ETAPA 19 (22/09/2026, parte 3, áudios das 20:29-20:30): a trava não é mais só do aceite.
     "Não pode ficar nunca sem colocar o nome do pet, sem a escolha das cores da peça e sem marcar a
     declaração. Toda vez que clicar em comprar agora e tiver alguma dessas faltando, essa opção vai
     mudar a cor e vai fazer aquela animação igual você fez com a declaração." E, no seguinte: se
     escolheu tricolor/bicolor/monocromático e não digitou as cores, o mesmo.
     Cada falta ganha a classe `faltou` (a cor), os botões tremem (a animação da declaração), o
     recado diz O QUE falta, e a tela rola até a primeira falta — no celular ela pode estar acima
     da dobra, e cor mudando fora da tela ninguém vê. Degradê não pede cor (a cor é combinada).
     A cor do NOME só é cobrada quando o adicional "nome colorido" está marcado (o campo só abre
     com ele) — mesmo raciocínio das cores da peça: escolheu a opção, tem que dizer a cor. */
  function oQueFalta() {
    var faltas = [];
    var nome = document.querySelector('[data-personalizar] [name="nome_pet"]');
    /* ETAPA 58 (8): "Deseja mesmo não adicionar nome?" -> Sim marca o formulário (data-sem-nome) e o nome não é cobrado */
    var formSN = document.querySelector('[data-personalizar]');
    var semNome = formSN && formSN.hasAttribute('data-sem-nome');
    if (nome && !nome.value.trim() && !semNome) faltas.push({ el: nome.closest('label') || nome, texto: 'Por favor, digite o nome do pet.' });
    /* ETAPA 52: com o detalhe marcado, cobra o acabamento e depois a cor do nome */
    if (corNomeBox && !corNomeBox.querySelector('.acabamento input').disabled) {
      var rotNome = corNomeBox.closest('label') || corNomeBox;
      if (!corNomeBox.querySelector('.acabamento input:checked')) {
        faltas.push({ el: rotNome, texto: 'Por favor, escolha o acabamento da cor do nome.' });
      } else if (!corNomeBox.querySelector('select').value) {
        faltas.push({ el: rotNome, texto: 'Por favor, escolha a cor do nome.' });
      }
    }
    if (caixaCores) {
      var r = caixaCores.querySelector('input[name="cores_peca"]:checked');
      if (!r) {
        /* ETAPA 24: treme e muda de cor o rótulo E cada opção (tricolor, bicolor, monocromático,
           degradê) — "e todos os nomes que tiverem ali" */
        faltas.push({ el: caixaCores.querySelector('.rotulo-grupo') || caixaCores, texto: 'Por favor, selecione a cor da peça.' });
        Array.prototype.forEach.call(caixaCores.querySelectorAll('.cores-opcoes label'), function (l) {
          faltas.push({ el: l, texto: null });
        });
      } else {
        /* ETAPA 51: cada janela cobra primeiro o ACABAMENTO e depois a COR */
        Array.prototype.forEach.call(camposCores ? camposCores.querySelectorAll('.campo-cor') : [], function (c) {
          var parte = c.getAttribute('data-parte');
          var qual = parte === 'topo' ? 'da cor do topo' : parte === 'base' ? 'da cor da base' : 'da cor principal';
          var qual2 = parte === 'topo' ? 'a cor do topo' : parte === 'base' ? 'a cor da base' : 'a cor principal';
          if (!c.querySelector('.acabamento input:checked')) {
            faltas.push({ el: c, texto: 'Por favor, escolha o acabamento ' + qual + '.' });
          } else if (!c.querySelector('select').value) {
            faltas.push({ el: c, texto: 'Por favor, escolha ' + qual2 + '.' });
          }
        });
      }
    }
    if (!caixaAceite || !caixaAceite.checked) {
      faltas.push({ el: document.querySelector('[data-aceite]'), texto: 'Por favor, aceite os termos da declaração.' });   // ETAPA 32 (21:38): frase dele
    }
    return faltas;
  }

  /* a posição do print do Cassiano (msg 629/654): o pé dos botões encostado no pé da parte VISÍVEL da tela */
  function irParaOsBotoes(suave) {
    var botoes = document.querySelector('[data-botoes]');
    if (!botoes) return;
    var altura = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    var y = window.scrollY + botoes.getBoundingClientRect().bottom - altura + 16;
    window.scrollTo({ top: Math.max(0, y), behavior: suave ? 'smooth' : 'auto' });
  }
  window.aleaIrParaOsBotoes = irParaOsBotoes;

  function reclamarDoQueFalta(faltas) {
    Array.prototype.forEach.call(document.querySelectorAll('.faltou'), function (x) { x.classList.remove('faltou'); });
    faltas.forEach(function (f) { if (f.el) f.el.classList.add('faltou'); });
    /* ETAPA 23 (22/09/2026, 20:44): "quero que trema TUDO o que está faltando na tela", não só os
       botões. Cada falta treme junto (mesma animação), reiniciada a cada clique. */
    Array.prototype.forEach.call(document.querySelectorAll('.treme-falta'), function (x) { x.classList.remove('treme-falta'); });
    faltas.forEach(function (f) { if (f.el) { void f.el.offsetWidth; f.el.classList.add('treme-falta'); } });
    var recado = document.querySelector('[data-recado-aceite]');
    if (recado) {
      var itens = faltas.map(function (f) { return f.texto; }).filter(Boolean);
      /* ETAPA 24 (22/09/2026, 20:45): a frase é SÓ a da PRIMEIRA falta, de cima pra baixo ("será
         sempre o primeiro item que está faltando") — a lista `faltas` já nasce na ordem da página.
         As outras faltas não somem: continuam com a cor e tremendo. Era "Complete antes de
         continuar: nome do pet, cores da peça e declaração." */
      recado.textContent = itens[0];
      recado.hidden = false;
    }
    var botoes = document.querySelector('[data-botoes]');
    if (botoes) {
      botoes.classList.remove('tremendo');
      void botoes.offsetWidth;        // reinicia a animação se ele clicar duas vezes
      botoes.classList.add('tremendo');
    }
    var primeira = faltas.filter(function (f) { return f.el; })[0];
    if (primeira && primeira.el.scrollIntoView) {
      /* ETAPA 22 (22/09/2026, 20:43): "a tela subiu pro nome do pet, mas o cursor não foi pra
         janela — coloque o cursor direto nela". O foco vai pro CAMPO da primeira falta (no
         celular isso já abre o teclado). Tem que ser AQUI, dentro do clique: o iPhone só aceita
         foco programático durante o gesto. `preventScroll` pra o foco não dar um pulo seco por
         cima da rolagem suave, que é quem centraliza. */
      var alvo = primeira.el.matches && primeira.el.matches('input, select') ? primeira.el
               : primeira.el.querySelector ? (primeira.el.querySelector('select:not([disabled])') ||
                 primeira.el.querySelector('input')) : null;
      if (!alvo && caixaCores && primeira.el.classList.contains('rotulo-grupo')) {
        alvo = caixaCores.querySelector('input[name="cores_peca"]');
      }
      if (alvo && alvo.focus) { try { alvo.focus({ preventScroll: true }); } catch (e) { alvo.focus(); } }
      /* ⚠️ ETAPA 25 (22/09/2026, 20:53, com vídeo): centralizar NÃO basta no celular — o teclado
         sobe, e a barrinha de "completar automaticamente" do iPhone fica POR CIMA do campo. Ele pediu
         o alinhamento que ele mesmo fez no vídeo: a falta logo ABAIXO do cabeçalho, sobrando a tela
         de baixo pro teclado e pra barrinha. E SEMPRE, a cada clique — não só quando está fora da
         tela. O cabeçalho é medido na hora (a altura muda com a tarja e com o tamanho da tela). */
      if (primeira.el.closest && primeira.el.closest('.janela3d')) { /* dentro da janela: quem posiciona é ela */ }
      else if (primeira.el.closest && primeira.el.closest('[data-aceite]')) {
        /* ⚠️ ETAPA 58 (4) (16:13, com print): faltando SÓ a declaração, a tela para com a declaração, a frase e os
           botões no PÉ da parte visível (logo acima da barra do Safari) — sem rolar até a parte preta — e treme ali */
        irParaOsBotoes(true);
      } else {
        var topo = document.querySelector('.topo');
        var folga = (topo ? Math.max(0, topo.getBoundingClientRect().bottom) : 0) + 18;
        var y = window.scrollY + primeira.el.getBoundingClientRect().top - folga;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    }
  }

  /* quem corrige a falta perde a cor na hora — não precisa clicar de novo pra ver sumir */
  document.addEventListener('input', function (ev) {
    var dono = ev.target.closest && ev.target.closest('.faltou');
    if (dono && ev.target.value && ev.target.value.trim()) dono.classList.remove('faltou');
  });
  document.addEventListener('change', function (ev) {
    if (ev.target.matches && ev.target.matches('.campo-cor select') && ev.target.value) {
      var dono = ev.target.closest('.faltou'); if (dono) dono.classList.remove('faltou');
    }
    if (ev.target.name === 'cores_peca' && caixaCores) {
      Array.prototype.forEach.call(caixaCores.querySelectorAll('.rotulo-grupo, .cores-opcoes label'),
        function (x) { x.classList.remove('faltou'); });
    }
  });

  /* ⚠️ ETAPA 43 (22/09/2026, 22:34, print de referência): ao adicionar pela sacola, aparece uma
     JANELINHA logo abaixo do cabeçalho — a miniatura da peça à esquerda e a frase "Você adicionou
     esta criação à sua Sacola de Compras." ("fazer somente a primeira frase"), com × pra fechar. Some
     sozinha em 5 s. Cores e fonte são as da ālea; só a posição e o desenho seguem o modelo. */
  var avisoTimer = null;
  function avisarQueEntrou(capa, miniatura) {
    var velho = document.querySelector('.aviso-sacola');
    if (velho) velho.parentNode.removeChild(velho);
    var a = document.createElement('div');
    a.className = 'aviso-sacola';
    a.setAttribute('role', 'status');
    a.innerHTML =
      '<div class="miniatura"><img alt="" src="' + (miniatura || ('img/produtos/' + capa + '_obj_m.webp')) + '" ' +
      'onerror="this.onerror=null;this.src=&quot;img/produtos/' + capa + '_m.jpg&quot;"></div>' +
      '<p>Você adicionou esta criação à sua sacola de compras.</p>' +   // 22:36 minúsculo; 22:38 sem negrito
      '<button type="button" class="fechar-aviso" aria-label="Fechar aviso">&times;</button>';
    var topo = document.querySelector('.topo');
    a.style.top = ((topo ? Math.max(0, topo.getBoundingClientRect().bottom) : 0) + 8) + 'px';
    document.body.appendChild(a);
    requestAnimationFrame(function () { a.classList.add('visivel'); });
    function tirar() {
      a.classList.remove('visivel');
      setTimeout(function () { if (a.parentNode) a.parentNode.removeChild(a); }, 300);
    }
    a.querySelector('.fechar-aviso').addEventListener('click', tirar);
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(tirar, 3000);   // ETAPA 48 (22:55): 3 s, pedido dele (era 5)
  }

  /* ⚠️ ETAPA 45 (22:38): o "editar" da sacola traz a pessoa de volta a esta página com TUDO que ela
     tinha escolhido já preenchido ("pra não precisar fazer tudo novamente"). O endereço chega com
     `?editar=<id da linha>`; aqui se preenche nome, adicional, cor do nome, cores da peça e cada cor.
     Ao adicionar/comprar de novo, a linha antiga é SUBSTITUÍDA (mantém a quantidade), não duplicada.
     ⚠ A DECLARAÇÃO volta DESMARCADA de propósito: ela diz "revisei nome, grafia e cores", e depois de
     mexer na personalização o aceite antigo não cobre o que mudou. */
  var editando = null;
  (function prepararEdicao() {
    var m = /[?&]editar=([^&]+)/.exec(location.search);
    if (!m || !window.aleaCarrinho || !botaoComprar) return;
    var id = decodeURIComponent(m[1]);
    var item = window.aleaCarrinho.itens().filter(function (i) { return i.quando === id; })[0];
    if (!item || item.slug !== botaoComprar.getAttribute('data-slug')) return;
    editando = id;
    var p = item.personalizacao || {};
    var nome = document.querySelector('[data-personalizar] [name="nome_pet"]');
    if (nome) nome.value = p.nome_pet || '';
    (item.extras || []).forEach(function (x) {
      var rot = document.querySelector('[data-extra][data-extra-id="' + x.id + '"]');
      var cx = rot && rot.querySelector('[data-extra-caixa]');
      if (cx && !cx.checked) { cx.checked = true; cx.dispatchEvent(new Event('change', { bubbles: true })); }
    });
    /* ETAPA 52: a cor do nome volta com acabamento e cor (os pedidos antigos, em texto, não voltam) */
    if (corNomeBox && p.cor_nome_escolha) {
      var rn = corNomeBox.querySelector('.acabamento input[value="' + p.cor_nome_escolha.acabamento + '"]');
      if (rn) {
        rn.checked = true; rn.dispatchEvent(new Event('change', { bubbles: true }));
        corNomeBox.querySelector('select').value = p.cor_nome_escolha.cor;
      }
    }
    if (caixaCores && p.cores && p.cores.modo) {
      var r = Array.prototype.filter.call(caixaCores.querySelectorAll('input[name="cores_peca"]'),
        function (x) { return x.parentNode.textContent.trim() === p.cores.modo; })[0];
      if (r) {
        r.checked = true;
        desenharCamposDeCor(r);
        /* ETAPA 51: remonta acabamento (bolinha) e cor (lista) de cada janela */
        Array.prototype.forEach.call(camposCores.querySelectorAll('.campo-cor'), function (c, k) {
          var e = (p.cores.escolhas || [])[k];
          if (!e) return;
          var rad = c.querySelector('.acabamento input[value="' + e.acabamento + '"]');
          if (!rad) return;
          rad.checked = true;
          rad.dispatchEvent(new Event('change', { bubbles: true }));
          c.querySelector('select').value = e.cor;
        });
      }
    }
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    repintarPreco();
    /* ETAPA 47 (22:51): "o cliente não quer saber do topo, ele só quer editar — tem que cair direto no
       NOME DO PET". A tela para com o rótulo "Nome do pet" logo abaixo do cabeçalho (a mesma régua da
       trava de compra). Reaplica no `load`: as fotos da colmeia, carregando, empurram o formulário. */
    /* ⚠️ ETAPA 58 (11) (16:24, com 2 prints — substitui a ETAPA 47): "editar" volta pra esta página PARADA na
       posição dos botões (Personalize aqui, declaração, Comprar à vista) e JÁ com a janela de personalizar aberta,
       tudo preenchido, a peça de frente, centralizada e parada. */
    if (p.sem_nome) { var fsn = document.querySelector('[data-personalizar]'); if (fsn) fsn.setAttribute('data-sem-nome', ''); }
    if (p.cores && p.cores.escolhas) window.aleaMiniatura3D = item.miniatura || null;
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    function abrirEditando() {
      irParaOsBotoes(false);
      if (window.aleaAbrirPersonalizar) window.aleaAbrirPersonalizar(null, { parado: true });
    }
    if (document.readyState === 'complete') setTimeout(abrirEditando, 50);
    else window.addEventListener('load', function () { setTimeout(abrirEditando, 50); }, { once: true });
  })();

  function porNoCarrinho(eDepoisFechar) {
    var faltas = oQueFalta();
    if (faltas.length) {
      /* ETAPA 55: o formulário mora na janela — faltou algo, a janela abre e a falta treme lá dentro */
      /* ETAPA 57 (15:54): "só é pra abrir a parte de personalizar se ele esqueceu de personalizar alguma coisa
         obrigatória" — faltando SÓ a declaração (que fica na página), treme a página, como antes */
      var formP = document.querySelector('[data-personalizar]');
      var faltaDentro = formP && faltas.some(function (f) { return f.el && formP.contains(f.el); });
      if (window.aleaAbrirPersonalizar && faltaDentro) {
        window.aleaAbrirPersonalizar(function () { setTimeout(function () { reclamarDoQueFalta(oQueFalta()); if (window.aleaIrParaFalta) window.aleaIrParaFalta(); }, 60); });
      } else { reclamarDoQueFalta(faltas); }
      return;
    }
    if (!window.aleaCarrinho) return;
    var recado = document.querySelector('[data-recado-aceite]');
    if (recado) recado.hidden = true;
    if (editando && window.aleaCarrinho.substituir(editando, montarItem())) {
      editando = null;
      if (history.replaceState) history.replaceState(null, '', location.pathname);
      if (window.aleaGaveta) window.aleaGaveta.abrir('carrinho');   // editou: mostra a sacola já corrigida
      return;
    }
    window.aleaCarrinho.adicionar(montarItem());
    /* ⚠️ ETAPA 37 (22/09/2026, 22:09): os dois botões passam a fazer coisas DIFERENTES.
       · a SACOLA ao lado só adiciona — "não vai abrir a sacola, pra ele continuar no site e
         continuar comprando". O aviso de que entrou é a sacola do topo, que já fica cor de kraft
         e ganha o número, e agora dá um pulinho (ver `.sacola-pulou` no CSS);
       · o COMPRAR AGORA adiciona e ABRE a sacola, em tela cheia (era: ia direto pro WhatsApp). O
         WhatsApp continua sendo o botão de fechar pedido DENTRO da sacola. */
    if (eDepoisFechar) {
      if (window.aleaGaveta) window.aleaGaveta.abrir('carrinho');
      return;
    }
    avisarQueEntrou(botaoComprar.getAttribute('data-capa'), window.aleaMiniatura3D);
    Array.prototype.forEach.call(document.querySelectorAll('.topo [data-abrir="carrinho"], [data-add-carrinho]'), function (b) {
      b.classList.remove('sacola-pulou');
      void b.offsetWidth;
      b.classList.add('sacola-pulou');
    });
  }

  if (caixaAceite) {
    caixaAceite.addEventListener('change', function () {
      if (!caixaAceite.checked) return;
      var recado = document.querySelector('[data-recado-aceite]');
      var rotulo = document.querySelector('[data-aceite]');
      if (recado) recado.hidden = true;
      if (rotulo) rotulo.classList.remove('faltou');
    });
  }

  /* "Comprar agora" põe no carrinho e já leva ao fechamento do pedido. Sem WhatsApp
     configurado, o fechamento não acontece e a gaveta abre com o aviso — em vez de um
     botão que parece funcionar e não vai a lugar nenhum. */
  if (botaoComprar) botaoComprar.addEventListener('click', function () { porNoCarrinho(true); });
  if (botaoSacola) botaoSacola.addEventListener('click', function () { porNoCarrinho(false); });

  repintarPreco();
})();
