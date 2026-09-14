/* =============================================================================
   vitrine.js — a home: uma peça por tela, fundo que vira preto, toque que avança
   =============================================================================
   Desenhado a partir do que o Cassiano pediu em 14/09/2026 (áudios de 14:14 a 14:15):

     "a tela tem que ser branca mesmo pra combinar com a paleta […] mas a partir da
      hora que o cara rola a tela aí ela fica preta […] mais destaque pra foto"
     "você nunca consegue ver duas imagens ao mesmo tempo"
     "um toque, próximo produto"
     "só o produto e nome"

   COMO O EMPILHAMENTO FUNCIONA (e por que não é scroll sequestrado)
   ----------------------------------------------------------------
   Cada cena é `position: sticky; top: 0` com a altura da janela. Elas ficam na ordem
   natural do documento, então a rolagem é a rolagem de verdade do navegador: a cena
   seguinte sobe por cima e cobre a anterior inteira. Ninguém intercepta a roda do
   mouse nem o dedo.

   Isso importa por dois motivos. O visitante mantém a barra de rolagem, o Ctrl+F e a
   inércia do celular — e o Google trata navegação frustrante como Experiência de
   Destino ruim, o que encarece o clique. O efeito que ele quer sai de graça do
   comportamento nativo.

   O TOQUE
   -------
   No celular, tocar em qualquer lugar da cena leva pra próxima. A ETIQUETA (nome e
   preço) é um link e abre a página do produto — por isso ela cancela o avanço.
   ========================================================================== */

(function () {
  'use strict';

  function moeda(v) {
    return (window.aleaDinheiro && window.aleaDinheiro(v)) || 'Sob consulta';
  }

  function desenhar() {
    var palco = document.getElementById('palco');
    var lista = window.VITRINE || [];
    if (!palco || !lista.length) return 0;

    var mostrarPreco = (window.ALEA || {}).mostrar_preco_na_vitrine !== false;

    lista.forEach(function (c, i) {
      var fotos = c.fotos || [];
      var sec = document.createElement('section');
      sec.className = 'cena';
      sec.setAttribute('data-cena', String(i + 1));
      var preco = c.preco === null ? 'Sob consulta' : moeda(c.preco);

      /* TODAS as fotos entram no HTML, não só a primeira. Duas razões: é delas que sai
         o `alt` que o Google lê, e é nelas que o site se apoia quando não há WebGL. */
      var imgs = fotos.map(function (f, k) {
        return '<img src="img/produtos/' + f + '.jpg" width="1200" height="1200" ' +
          (i === 0 && k === 0 ? 'fetchpriority="high"' : 'loading="lazy"') +
          ' decoding="async" class="foto' + (k === 0 ? ' ativa' : '') + '" ' +
          'alt="' + c.produto + ' de ' + c.nome + (k ? ' — foto ' + (k + 1) : '') + '">';
      }).join('');

      /* bolinhas: o visitante precisa VER que existe mais foto, senão nunca arrasta */
      var pontos = fotos.length > 1
        ? '<span class="pontos" aria-hidden="true">' +
          fotos.map(function (_, k) { return '<i' + (k === 0 ? ' class="on"' : '') + '></i>'; }).join('') +
          '</span>'
        : '';

      var setas = fotos.length > 1
        ? '<button class="seta esq" type="button" aria-label="Foto anterior de ' + c.nome + '">‹</button>' +
          '<button class="seta dir" type="button" aria-label="Próxima foto de ' + c.nome + '">›</button>'
        : '';

      sec.innerHTML =
        '<div class="moldura" data-distorcao data-forca="0.30" data-fotos="' + fotos.length + '" ' +
             'tabindex="0" role="group" aria-label="' + c.produto + ' personalizado para ' + c.nome + '">' +
          imgs + setas + pontos +
          '<a class="etiqueta" href="produto-' + c.pagina + '.html">' +
            '<span>' +
              '<span class="produto-mini">' + c.produto + '</span><br>' +
              '<span class="nome">' + c.nome + '</span>' +
              '<span class="ver">ver produto →</span>' +
            '</span>' +
            (mostrarPreco ? '<span class="valor">' + preco + '</span>' : '') +
          '</a>' +
        '</div>';
      palco.appendChild(sec);
    });
    return lista.length;
  }

  /* =======================================================================
     AS FOTOS DE UM PRODUTO — o eixo horizontal
     =======================================================================
     "Se eu girar ou clicar para baixo e para cima, ele muda o produto. Se eu clicar
      ou girar para a esquerda e para a direita, ele muda as fotos" — Cassiano,
      14/09/2026, 16:22. E, no áudio seguinte: "sempre permanecer na primeira foto".

     Por isso nada acontece sozinho. A foto só muda por gesto horizontal, e todo
     produto volta à foto 1 quando entra na tela.
     ======================================================================= */
  function ligarFotos(cenas) {
    cenas.forEach(function (cena) {
      var moldura = cena.querySelector('.moldura');
      if (!moldura) return;
      var fotos = moldura.querySelectorAll('.foto');
      var pontos = moldura.querySelectorAll('.pontos i');
      if (fotos.length < 2) return;
      var atual = 0;

      function mostrar(n, dir) {
        if (n < 0 || n >= fotos.length || n === atual) return;
        /* com WebGL quem pinta é a lona; as <img> continuam no DOM só pro Google e
           pra degradação. Sem WebGL, é a troca de classe que faz o trabalho. */
        var usouWebgl = window.aleaTrocarFoto && window.aleaTrocarFoto(moldura, n, dir);
        fotos[atual].classList.remove('ativa');
        fotos[n].classList.add('ativa');
        if (pontos.length) {
          if (pontos[atual]) pontos[atual].classList.remove('on');
          if (pontos[n]) pontos[n].classList.add('on');
        }
        atual = n;
        return usouWebgl;
      }
      function proxima() { mostrar(atual + 1, 1); }
      function anterior() { mostrar(atual - 1, -1); }

      /* "sempre permanecer na primeira foto": ao voltar pro produto, ele reseta. */
      moldura.__voltarPraPrimeira = function () {
        if (atual !== 0) mostrar(0, -1);
      };

      var e = moldura.querySelector('.seta.esq');
      var d = moldura.querySelector('.seta.dir');
      if (e) e.addEventListener('click', function (ev) { ev.stopPropagation(); anterior(); });
      if (d) d.addEventListener('click', function (ev) { ev.stopPropagation(); proxima(); });

      moldura.addEventListener('keydown', function (ev) {
        if (ev.key === 'ArrowRight') { ev.preventDefault(); ev.stopPropagation(); proxima(); }
        if (ev.key === 'ArrowLeft') { ev.preventDefault(); ev.stopPropagation(); anterior(); }
      });

      /* arrasto horizontal. O vitrine decide pelo EIXO DOMINANTE: se o dedo andou mais
         na horizontal, é foto; se andou mais na vertical, é produto. Sem essa decisão
         um arrasto torto faria as duas coisas. */
      var x0 = null, y0 = null, jaFoi = false;
      moldura.addEventListener('touchstart', function (ev) {
        x0 = ev.touches[0].clientX; y0 = ev.touches[0].clientY; jaFoi = false;
      }, { passive: true });
      moldura.addEventListener('touchmove', function (ev) {
        if (x0 === null || jaFoi) return;
        var dx = x0 - ev.touches[0].clientX;
        var dy = y0 - ev.touches[0].clientY;
        if (Math.abs(dx) < 34 || Math.abs(dx) < Math.abs(dy)) return;
        jaFoi = true;
        ev.stopPropagation();
        if (dx > 0) proxima(); else anterior();
      }, { passive: true });
      moldura.addEventListener('touchend', function () { x0 = null; }, { passive: true });
    });
  }


  function ligarComportamento(quantasCenas) {
    var cenas = Array.prototype.slice.call(document.querySelectorAll('.cena'));
    var capa = document.querySelector('.cena.capa');
    var role = document.querySelector('.role');
    var contador = document.getElementById('contador');
    var botao = document.getElementById('avancar');
    var total = cenas.length;

    /* 1) O FUNDO VIRA PRETO. A conta é a posição da rolagem contra a altura da capa:
          enquanto a capa ocupa a tela, claro; passou dela, escuro. Uma classe só, e a
          transição de cor mora no CSS — JS não anima cor aqui. */
    var alturaCapa = capa ? capa.offsetHeight : window.innerHeight;
    var escuro = false;
    function conferirFundo() {
      var deveEscurecer = window.scrollY > alturaCapa * 0.55;
      if (deveEscurecer !== escuro) {
        escuro = deveEscurecer;
        document.body.classList.toggle('escuro', escuro);
      }
      if (role) role.classList.toggle('some', window.scrollY > 40);
    }

    /* 2) O CONTADOR. Qual cena está ocupando a tela agora. */
    var atual = 1;
    if (contador && total) {
      var obs = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          var n = parseInt(e.target.getAttribute('data-cena') || '0', 10);
          if (!n) return;
          atual = n;
          contador.textContent = String(n).padStart(2, '0') + ' / ' + String(quantasCenas).padStart(2, '0');
        });
      }, { threshold: 0.55 });
      cenas.forEach(function (c) { if (c.hasAttribute('data-cena')) obs.observe(c); });
    }

    /* =====================================================================
       3) UM GESTO = UM PRODUTO. E NADA MAIS.
       =====================================================================
       Pedido do Cassiano em 14/09/2026, 15:17, olhando a v2 no celular:

         "se eu rolo o dedo um pouco rápido, ele passa dois de uma vez só […]
          se eu rolo a tela uma vez só, ele só mostra a primeira imagem e JÁ
          TRAVA ELA. A segunda não aparece enquanto eu não arrastar o dedo de
          novo ou clicar de novo."

       O `scroll-snap` sozinho não faz isso: ele escolhe onde PARAR, mas deixa a
       inércia do dedo correr — e um peteleco rápido atravessa três painéis antes
       de encaixar. Para um gesto valer exatamente um passo, a navegação precisa
       ser nossa: aqui a rolagem dentro da vitrine é interceptada e traduzida em
       um único passo, com uma trava enquanto a animação acontece.

       POR QUE AGORA SIM, SE ANTES EU TINHA DESCARTADO
       -----------------------------------------------
       Na v2 eu evitei interceptar a rolagem porque navegação frustrante piora a
       Experiência na Página de Destino do Google Ads. Isso mudou de peso quando
       a arquitetura mudou: a página de destino do anúncio passou a ser a de
       PRODUTO, que tem rolagem nativa e intacta. A vitrine é a porta da marca,
       não o destino do clique pago.

       AS TRÊS SAÍDAS DE EMERGÊNCIA (pra não virar armadilha)
       ------------------------------------------------------
       1. A trava só vale DENTRO da vitrine. No rodapé e nas outras páginas a
          rolagem é a do navegador, sem interferência nenhuma.
       2. Passar da última cena solta a trava e entrega o rodapé.
       3. Teclado continua funcionando (setas, PageUp/Down, Home/End), e quem
          pediu "menos movimento" no sistema recebe salto seco em vez de animação.
       ===================================================================== */
    var travado = false;
    var indiceAtual = 0;
    var rodape = document.querySelector('.rodape');
    var querMenosMovimento = window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ⚠️ NUNCA PERGUNTE `offsetTop` A UM ELEMENTO `sticky` — ELE MENTE.
       Custou a tarde de 14/09/2026. Em Blink, `offsetTop` de um elemento grudado
       devolve a posição ONDE ELE ESTÁ AGORA, não a de origem no fluxo. Com as cenas
       empilhadas, TODAS as que já grudaram passam a responder o mesmo número: a sonda
       mostrou `2891,2891,2891,2891,3841,4791,...`. Consequência: descer funcionava (as
       cenas de baixo ainda não grudaram e respondem a verdade) e SUBIR era um pedido
       pra ir exatamente onde já se está — ou seja, nada acontecia, sem erro nenhum.

       A posição verdadeira se calcula: o palco não é sticky, então o `offsetTop` DELE é
       confiável, e toda cena tem a mesma altura. */
    var palcoEl = document.getElementById('palco');
    function alturaDaCena() {
      return cenas.length ? cenas[0].getBoundingClientRect().height : window.innerHeight;
    }
    function topoDe(i) {
      return Math.round((palcoEl ? palcoEl.offsetTop : 0) + i * alturaDaCena());
    }
    function ondeEstou() {
      var h = alturaDaCena();
      if (!h) return 0;
      var i = Math.round((window.scrollY - (palcoEl ? palcoEl.offsetTop : 0)) / h);
      if (i < 0) i = 0;
      if (i > cenas.length - 1) i = cenas.length - 1;
      return i;
    }

    /* A ANIMAÇÃO É NOSSA, E NÃO O `behavior: smooth` DO NAVEGADOR.
       Medido em 14/09/2026: descer funcionava, SUBIR não saía do lugar. O `scrollTo`
       nu funciona perfeitamente (testado de fora, em todas as posições) — o que não
       funciona é pedir rolagem suave DE DENTRO do tratador de `wheel`: o Chrome trata
       a entrada de rolagem do usuário como cancelamento de rolagem suave em curso, e
       o pedido morre calado. Nenhum erro, nenhum aviso; só a tela parada.
       Animando quadro a quadro com `scrollTo` instantâneo, nada há o que cancelar. */
    /* 520ms parecia bom no desktop e ficou "esquisito" no telefone dele (14/09, 16:03:
       "eu queria ele mais devagar [...] a gente tá clicando e já aparece de uma vez, aí
       dá aquele negócio desfigurado"). O problema não era só a velocidade: a peça
       trocava de personalização NO MEIO da rolagem, duas animações ao mesmo tempo.
       Aqui a rolagem desacelera; o `atraso` da troca de foto está no distorcao.js. */
    var DURACAO = 820;

    /* ⚠️ `behavior: 'instant'` NÃO É ENFEITE — foi a causa do defeito de 15/09h.
       O CSS desta casa tem `html { scroll-behavior: smooth }`, e isso muda o PADRÃO de
       todo `scrollTo`: cada quadro da animação abaixo virava, ele mesmo, uma rolagem
       suave do navegador. Sessenta animações por segundo brigando entre si — descer
       chegava perto por sorte (parava a 6px do alvo), e SUBIR simplesmente empacava.
       Nenhum erro no console; a tela só não obedecia.
       `instant` diz explicitamente "salte", e aí a animação volta a ser só nossa. */
    function pular(y) {
      window.scrollTo({ top: y, behavior: 'instant' });
    }
    function animarAte(destino, aoTerminar) {
      var inicio = window.scrollY;
      var distancia = destino - inicio;
      if (querMenosMovimento || Math.abs(distancia) < 2) {
        pular(destino);
        if (aoTerminar) aoTerminar();
        return;
      }
      var t0 = performance.now();
      (function quadro(agora) {
        var t = Math.min(1, (agora - t0) / DURACAO);
        /* easeInOutCubic: sai devagar, corre no meio, encosta devagar. É o que faz a
           peça parecer que "cai" em vez de pular. */
        var e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        pular(Math.round(inicio + distancia * e));
        if (t < 1) { requestAnimationFrame(quadro); }
        else if (aoTerminar) { aoTerminar(); }
      })(t0);
    }

    /* Sempre que o produto muda, ele reaparece na FOTO 1 — e a posição fica guardada
       pra quem for ver o produto e voltar. */
    function aoChegarNaCena(i) {
      var m = cenas[i] && cenas[i].querySelector('.moldura');
      if (m && m.__voltarPraPrimeira) m.__voltarPraPrimeira();
      try { sessionStorage.setItem('alea_cena', String(i)); } catch (e) { /* aba anônima */ }
    }

    function irPara(i) {
      if (i < 0) i = 0;
      if (i > cenas.length - 1) {          // passou da última: solta e entrega o rodapé
        if (!rodape) return;
        travado = true;
        animarAte(rodape.offsetTop, function () { travado = false; });
        return;
      }
      indiceAtual = i;
      aoChegarNaCena(i);
      /* a trava segura o TEMPO DA ANIMAÇÃO. Sem ela, a inércia do dedo entrega mais
         eventos no meio do caminho e cada um vira outro passo — que é exatamente o
         "passou dois de uma vez só" que ele viu. */
      travado = true;
      animarAte(topoDe(i), function () {
        /* respiro curto DEPOIS da animação: o trackpad continua mandando eventos por
           uns milissegundos depois que o dedo sai, e sem esta folga o último resquício
           do mesmo gesto viraria um segundo passo. */
        setTimeout(function () { travado = false; }, 90);
      });
    }

    function passo(direcao) {
      if (travado) return;
      irPara(ondeEstou() + direcao);
    }
    function proxima() { passo(1); }

    /* A vitrine termina onde o rodapé começa. Fora dessa faixa não mexemos em nada. */
    function dentroDaVitrine() {
      return !rodape || window.scrollY < rodape.offsetTop - 40;
    }

    /* --- roda do mouse e trackpad ------------------------------------- */
    window.addEventListener('wheel', function (e) {
      if (!dentroDaVitrine()) return;
      if (Math.abs(e.deltaY) < 4) return;          // tremida de trackpad não conta
      e.preventDefault();
      passo(e.deltaY > 0 ? 1 : -1);
    }, { passive: false });

    /* --- dedo ---------------------------------------------------------- */
    var toqueY = null, arrastou = false;
    window.addEventListener('touchstart', function (e) {
      toqueY = e.touches[0].clientY;
      arrastou = false;
    }, { passive: true });

    window.addEventListener('touchmove', function (e) {
      if (!dentroDaVitrine() || toqueY === null) return;
      /* segurar o touchmove é o que mata a INÉRCIA. Sem isto o dedo solta e o
         navegador continua rolando sozinho por três painéis. */
      e.preventDefault();
      var dy = toqueY - e.touches[0].clientY;
      if (!arrastou && Math.abs(dy) > 28) {
        arrastou = true;                            // um arrasto = um passo, e só
        passo(dy > 0 ? 1 : -1);
      }
    }, { passive: false });

    window.addEventListener('touchend', function () { toqueY = null; }, { passive: true });

    if (botao) botao.addEventListener('click', proxima);

    /* "um toque, próximo produto". A etiqueta e os botões seguem o seu caminho —
       é lá que mora o link pra página do produto. */
    document.querySelectorAll('.cena').forEach(function (c) {
      c.addEventListener('click', function (e) {
        /* a etiqueta abre o produto; as setas trocam a foto. Só o resto avança. */
        if (e.target.closest('a, button')) return;
        proxima();
      });
    });

    document.addEventListener('keydown', function (e) {
      if (!dentroDaVitrine()) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault(); passo(1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault(); passo(-1);
      } else if (e.key === 'Home') {
        e.preventDefault(); irPara(0);
      }
    });

    /* O snap nativo sai de cena: com a navegação por passo, os dois brigariam pelo
       mesmo pixel e o resultado é tremor no fim de cada transição. */
    var palco = document.getElementById('palco');
    if (palco) palco.style.scrollSnapType = 'none';

    window.addEventListener('scroll', conferirFundo, { passive: true });
    window.addEventListener('resize', function () {
      alturaCapa = capa ? capa.offsetHeight : window.innerHeight;
      conferirFundo();
    });
    conferirFundo();
  }

  /* ⚠️ "ISSO ME MATA DE RAIVA EM QUALQUER SITE" (Cassiano, 14/09/2026, 16:23):
     clicar em voltar e cair no começo depois de ter passado por 30 produtos. A posição
     é gravada a cada troca de produto; ao voltar de uma página interna, a vitrine
     reabre exatamente ali. Só vale quando o visitante veio DE DENTRO do site — quem
     chega pela primeira vez merece começar pela capa. */
  function restaurarPosicao(cenas) {
    var veioDeDentro = document.referrer && document.referrer.indexOf(location.host) > -1;
    if (!veioDeDentro) return;
    var salvo;
    try { salvo = sessionStorage.getItem('alea_cena'); } catch (e) { return; }
    var i = parseInt(salvo, 10);
    if (!i || i < 1 || i >= cenas.length) return;
    var palco = document.getElementById('palco');
    var h = cenas[0].getBoundingClientRect().height;
    /* salto seco, sem animação: o visitante não pediu passeio, pediu o lugar dele. */
    window.scrollTo({ top: Math.round((palco ? palco.offsetTop : 0) + i * h), behavior: 'instant' });
  }

  function iniciar() {
    var quantas = desenhar();
    var todasCenas = Array.prototype.slice.call(document.querySelectorAll('.cena'));
    ligarFotos(todasCenas);
    restaurarPosicao(todasCenas);
    ligarComportamento(quantas);
    if (window.aleaLigarBotoes) window.aleaLigarBotoes();

    /* AVISA QUE A VITRINE EXISTE.
       O distorcao.js precisa saber a hora certa de procurar as molduras: elas nascem
       AQUI, em JavaScript, e não no HTML. Sem este aviso ele procura cedo demais, não
       acha nada, e o efeito — que é o pedido original — simplesmente não acontece.
       Foi o defeito medido em 14/09/2026, o mesmo erro de ordem da Negocie. */
    window.__aleaVitrinePronta = true;
    document.dispatchEvent(new CustomEvent('alea:vitrine-pronta'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
