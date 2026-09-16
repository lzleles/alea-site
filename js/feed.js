/* =============================================================================
   feed.js — o feed: um objeto por tela, preto, deslizando pra cima
   =============================================================================
   (era `vitrine.js` até 15/09/2026; o Cassiano rebatizou a tela de FEED e o arquivo
   acompanhou — "voltar para o feed", não mais "voltar para a vitrine".)

   O QUE ELE PEDIU, E COMO VIROU CÓDIGO
   ------------------------------------
     "deixar esse MENU, onde somente depois que clicar na categoria a tela ficará preta
      e apresentará o feed"                       -> o feed é uma CAMADA, e só abre no clique
     "queria que deslizasse o objeto pra cima até sumir enquanto o outro estivesse
      roubando o lugar central"                   -> `irPara()`, com as classes do CSS
     "tirar as fotos sempre sem fundo, somente o objeto"        -> `_obj.webp` no centro
     "deixando as fotos completas somente se arrastar pro lado" -> as fotos de cenário
     "somente no primeiro produto, mostrar alguma animação com setas"  -> `.dica-arrasto`
     "retirar as setas e colocar as bolinhas centralizadas, acima do título" -> `.pontos`
     "retirar a seta indicativa pra baixo do canto inferior direito"  -> o botão sumiu

   E O QUE SOBREVIVEU DA VERSÃO ANTERIOR, porque ele já tinha pedido e não mudou:
     · UM GESTO = UM PRODUTO, com trava enquanto a animação roda (15:17 de 14/09);
     · o produto SEMPRE volta pra primeira foto quando entra na tela (16:23);
     · voltar de uma página de produto reabre o feed no MESMO lugar (16:23).

   POR QUE UMA CAMADA FIXA, E NÃO ROLAGEM DE VERDADE
   -------------------------------------------------
   Na v2 o feed era uma pilha de cenas grudadas, e a rolagem nativa fazia o trabalho.
   Isso morreu quando ele pediu que o OBJETO deslizasse: rolagem move a página inteira,
   e ele quer que a peça saia de cena enquanto a outra entra, sem nada mais se mexendo.
   Com camada fixa, o que anima é só o que ele quer ver animar.

   O que se perde com isso é a barra de rolagem nativa — e é por isso que o feed NÃO é
   a página de destino do Google Ads. O destino é a página de PRODUTO, que tem rolagem
   intacta. Já era assim desde 14/09; aqui isso só ficou mais literal.
   ========================================================================== */

(function () {
  'use strict';

  var POS = 'alea_feed_pos';
  /* ⚠️ 1250ms — ele pediu mais devagar na 2ª rodada de 15/09/2026 ("a transição dos
     produtos, quando pra cima e pra baixo, está rápida"). Tem que bater com a
     `transition` do `.feed.anima .item` no CSS: é este número que solta a trava do
     gesto, e se ele for menor que a transição a trava abre no meio da animação. */
  var DURACAO = 1250;

  var feed = document.getElementById('feed');
  var palco = document.getElementById('palco');
  var contador = document.getElementById('contador');
  if (!feed || !palco) return;

  var categoriaAtual = null;
  var itens = [];
  var indice = 0;
  var travado = false;
  var aberto = false;

  var querMenosMovimento = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function moeda(v) {
    return (window.aleaDinheiro && window.aleaDinheiro(v)) || 'Sob consulta';
  }

  function nomeDaCategoria(id) {
    var c = (window.CATEGORIAS || []).filter(function (x) { return x.id === id; })[0];
    return c ? c.nome : String(id || '').toUpperCase();
  }

  /* ======================================================================= desenho */
  function desenhar(catId) {
    var lista = (window.VITRINE || []).filter(function (c) { return c.categoria === catId; });
    var mostrarPreco = (window.ALEA || {}).mostrar_preco_no_feed !== false;
    palco.innerHTML = '';

    lista.forEach(function (c, i) {
      var fotos = c.fotos || [];
      var art = document.createElement('article');
      art.className = 'item';
      art.setAttribute('data-i', String(i));

      /* A PRIMEIRA IMAGEM É O OBJETO RECORTADO, quando ele existe. As demais são as
         fotos de cenário. Todas entram no HTML, não só a que está à mostra: é delas
         que sai o `alt` que o Google lê, e é nelas que o site se apoia sem WebGL. */
      var imgs = '';
      if (c.recorte) {
        imgs += '<img src="img/produtos/' + fotos[0] + '_obj.webp" class="recorte ativa" ' +
          (i === 0 ? 'fetchpriority="high"' : 'loading="lazy"') + ' decoding="async" ' +
          'alt="' + c.produto + ' de ' + c.nome + '">';
      }
      /* As FOTOS INTEIRAS vêm todas, inclusive a foto-mãe de onde o objeto foi
         recortado: o visitante tem direito de ver a peça em uso, e é isso que ele
         pediu — "deixando as fotos completas somente se arrastar pro lado". */
      fotos.forEach(function (f, k) {
        var primeira = (!c.recorte && k === 0);   // sem recorte, a foto 1 fica no centro
        imgs += '<img src="img/produtos/' + f + '.jpg" class="cenario' + (primeira ? ' ativa' : '') + '" ' +
          'width="1200" height="1200" loading="lazy" decoding="async" ' +
          'alt="' + c.produto + ' de ' + c.nome + ' — foto ' + (k + 1) + '">';
      });

      var quantas = fotos.length + (c.recorte ? 1 : 0);

      /* as bolinhas ficam DENTRO do quadrado da foto, no pé dele (2ª rodada de
         15/09/2026). Elas são botões de verdade: no computador não existe arrastar, e
         sem as setas — que ele mandou tirar — elas são o único caminho pra segunda foto. */
      var pontos = quantas > 1
        ? '<span class="pontos">' +
          Array.apply(null, Array(quantas)).map(function (_, k) {
            return '<button type="button" class="' + (k === 0 ? 'on' : '') +
              '" data-foto="' + k + '" aria-label="Foto ' + (k + 1) + ' de ' + quantas + '"></button>';
          }).join('') + '</span>'
        : '';

      /* a dica fica FORA do quadrado, logo abaixo dele: dentro, ela cobria as bolinhas
         (visto por ele na 3ª rodada de 15/09/2026). */
      var dica = (i === 0 && quantas > 1)
        ? '<span class="dica-arrasto" data-dica><span class="mao">›››</span>arraste pro lado</span>'
        : '';

      /* A LEGENDA, no formato que ele ditou na 2ª rodada:
             PET               (maior, caixa alta, negrito)      <- a categoria
             ĀLEA BOWL WAVE    (menor, caixa alta, sem negrito)  <- o produto
             ver produto →
         e o valor em destaque do outro lado. O nome do pet saiu daqui: ele é a
         personalização daquela foto, não o nome do produto, e continua no `alt` das
         imagens — que é o que o Google lê. */
      art.innerHTML =
        '<div class="area-objeto">' +
          '<div class="objeto' + (c.recorte ? '' : ' com-cenario') + '" data-distorcao data-forca="0.30" ' +
               'role="group" aria-label="' + c.produto + ' personalizado para ' + c.nome + '">' +
            imgs + pontos +
          '</div>' + dica +
        '</div>' +
        '<div class="legenda">' +
          '<span class="lado-esquerdo">' +
            '<span class="categoria">' + nomeDaCategoria(c.categoria) + '</span>' +
            '<span class="produto-mini">' + c.produto + '</span>' +
            '<a class="ver" href="produto-' + c.pagina + '.html">ver produto →</a>' +
          '</span>' +
          (mostrarPreco ? '<span class="valor">' + (c.preco === null ? 'Sob consulta' : moeda(c.preco)) + '</span>' : '') +
        '</div>';
      palco.appendChild(art);
    });

    /* O CARTÃO DE FIM. Passar do último produto não pode dar em parede: aqui o feed
       fecha o assunto com a marca e devolve o caminho pro menu e pro orçamento. */
    var fim = document.createElement('article');
    fim.className = 'item';
    fim.setAttribute('data-i', String(lista.length));
    fim.innerHTML =
      '<div class="fim">' +
        '<img src="img/marca/alea_logo_claro.svg" alt="ālea">' +
        '<p data-assinatura>Onde cada impressão começa com um sonho!</p>' +
        '<a class="botao zap" data-assunto="orçamento de uma peça personalizada">Orçamentos e personalizados</a>' +
        '<button class="fechar-feed" type="button" data-fechar-feed style="position:static">← voltar pras categorias</button>' +
      '</div>';
    palco.appendChild(fim);

    itens = Array.prototype.slice.call(palco.querySelectorAll('.item'));
    categoriaAtual = catId;

    if (window.aleaLigarBotoes) window.aleaLigarBotoes(palco);
    if (window.ALEA && window.ALEA.assinatura) {
      Array.prototype.forEach.call(palco.querySelectorAll('[data-assinatura]'), function (el) {
        el.textContent = window.ALEA.assinatura;
      });
    }

    /* o distorcao.js precisa saber a hora certa de procurar os objetos: eles nascem
       AQUI, em JavaScript, e não no HTML. Sem este aviso ele procura cedo demais, não
       acha nada, e o efeito — que é o pedido original — simplesmente não acontece.
       Foi o defeito medido em 14/09/2026, o mesmo erro de ordem da Negocie. */
    document.dispatchEvent(new CustomEvent('alea:feed-desenhado'));
  }

  /* ============================================================ as fotos de um item
     Eixo horizontal. Nada acontece sozinho: a foto só muda por gesto, clique na
     bolinha ou seta do teclado — e todo produto volta à foto 1 ao entrar na tela.
     ("sempre permanecer na primeira foto", Cassiano, 14/09/2026 16:23.) */
  function fotosDo(item) {
    return Array.prototype.slice.call(item.querySelectorAll('.objeto img'));
  }

  /* ⚠️ O DEFEITO QUE ELE VIU NA 2ª RODADA, E A CAUSA
     -----------------------------------------------
     "A transição pras laterais está confusa, não está colocando na ordem. Às vezes
      passo pra direita e a foto se repete, às vezes volto pra esquerda e não volta
      pra imagem anterior."

     Era dessincronia entre o DOM e a lona do WebGL. Quando a distorção estava no meio
     de uma troca, ela RECUSAVA o pedido e devolvia `false` — mas o código aqui ignorava
     a resposta e trocava as classes assim mesmo. Resultado: o site passava a achar que
     estava na foto 3 enquanto a tela ainda mostrava a 2. O próximo gesto partia do
     número errado, e daí vinha tanto a foto repetida quanto o "voltar que não volta".

     A cura é tratar a lona como dona da verdade: **se ela recusa, nada muda** — o gesto
     simplesmente não conta. E ela só recusa por alguns décimos de segundo, o tempo da
     própria animação. */
  function mostrarFoto(item, n, dir) {
    var fotos = fotosDo(item);
    var pontos = item.querySelectorAll('.pontos button');
    var atual = fotos.findIndex(function (f) { return f.classList.contains('ativa'); });
    if (atual < 0) atual = 0;
    if (n < 0 || n >= fotos.length || n === atual) return false;

    var objeto = item.querySelector('.objeto');
    /* com WebGL quem pinta é a lona; as <img> continuam no DOM só pro Google e pra
       degradação. Sem WebGL, é a troca de classe que faz o trabalho. */
    if (objeto && objeto.classList.contains('com-webgl') && window.aleaDistorcao) {
      if (!window.aleaDistorcao.trocar(objeto, n, dir)) return false;
    }
    fotos[atual].classList.remove('ativa');
    fotos[n].classList.add('ativa');
    if (pontos[atual]) pontos[atual].classList.remove('on');
    if (pontos[n]) pontos[n].classList.add('on');

    /* a moldura só existe quando o que está na tela é FOTO DE CENÁRIO. No recorte ela
       some, e é isso que dá o aspecto minimalista que ele pediu. */
    if (objeto) objeto.classList.toggle('com-cenario', !fotos[n].classList.contains('recorte'));

    var dica = item.querySelector('[data-dica]');
    if (dica) dica.classList.add('some');
    return true;
  }

  /* ⚠️ GESTO RECUSADO NÃO SE PERDE — ELE INSISTE.
     A lona é a dona da ordem das fotos e recusa enquanto está animando ou ainda
     montando o efeito. Descartar o gesto nessa hora dava um defeito pequeno e chato:
     o PRIMEIRO toque lateral de cada peça não fazia nada (o efeito ainda estava
     acendendo), e a pessoa tocava de novo achando que o site travou. Medido em
     15/09/2026, 2ª rodada.

     Aqui o pedido fica guardado e é retentado por até ~2s. Tocar em outra bolinha no
     meio disso simplesmente troca o alvo — quem manda é o último toque, que é o que a
     pessoa quer. */
  var alvoFoto = null, insistindo = false;

  function pedirFoto(item, n, dir) {
    alvoFoto = { item: item, n: n, dir: dir };
    if (insistindo) return;
    insistindo = true;
    (function tentar(resta) {
      if (!alvoFoto) { insistindo = false; return; }
      var p = alvoFoto;
      if (mostrarFoto(p.item, p.n, p.dir) || resta <= 0) {
        alvoFoto = null; insistindo = false; return;
      }
      setTimeout(function () { tentar(resta - 1); }, 160);
    })(12);
  }

  function voltarPraPrimeira(item) {
    var fotos = fotosDo(item);
    if (fotos.length < 2) return;
    var atual = fotos.findIndex(function (f) { return f.classList.contains('ativa'); });
    if (atual > 0) mostrarFoto(item, 0, -1);
    /* a moldura acompanha: no recorte não existe moldura; na foto de cenário, existe */
    var objeto = item.querySelector('.objeto');
    var ativa = item.querySelector('.objeto img.ativa');
    if (objeto && ativa) objeto.classList.toggle('com-cenario', !ativa.classList.contains('recorte'));
  }

  /* =========================================================== a troca de produto
     "que deslizasse o objeto pra cima até sumir enquanto o outro estivesse roubando o
     lugar central" — o que sai vai pra `acima`, o que entra chega de `abaixo`. */
  function irPara(novo, dir) {
    if (novo < 0 || novo >= itens.length || novo === indice) return;
    var sai = itens[indice];
    var entra = itens[novo];
    travado = true;

    entra.classList.add('visivel', dir > 0 ? 'abaixo' : 'acima');
    /* força o navegador a assumir a posição de partida ANTES de animar. Sem esta
       leitura, as duas mudanças de classe caem no mesmo quadro e o navegador não anima
       nada: o item aparece direto no lugar, sem transição. Não é superstição — é como
       o motor de layout junta mudanças. */
    void entra.offsetHeight;

    feed.classList.add('anima');
    sai.classList.remove('ativo');
    sai.classList.add(dir > 0 ? 'acima' : 'abaixo');
    entra.classList.remove('abaixo', 'acima');
    entra.classList.add('ativo');

    indice = novo;
    voltarPraPrimeira(entra);
    if (window.aleaDistorcao) window.aleaDistorcao.montar(entra.querySelector('.objeto'));
    pintarContador();
    guardarPosicao();

    var espera = querMenosMovimento ? 60 : DURACAO;
    setTimeout(function () {
      sai.classList.remove('visivel', 'acima', 'abaixo');
      /* respiro curto DEPOIS da animação: o trackpad continua mandando eventos por uns
         milissegundos depois que o dedo sai, e sem esta folga o último resquício do
         mesmo gesto viraria um segundo passo — o "passou dois de uma vez" de 14/09. */
      setTimeout(function () { travado = false; }, 90);
    }, espera);
  }

  function passo(dir) {
    if (travado || !aberto) return;
    irPara(indice + dir, dir);
  }

  function pintarContador() {
    if (!contador) return;
    var produtos = itens.length - 1;               // o cartão de fim não conta
    if (indice >= produtos) { contador.textContent = ''; return; }
    contador.textContent = String(indice + 1).padStart(2, '0') + ' / ' + String(produtos).padStart(2, '0');
  }

  function guardarPosicao() {
    try { sessionStorage.setItem(POS, JSON.stringify({ cat: categoriaAtual, i: indice })); }
    catch (e) { /* aba anônima */ }
  }

  function posicaoGuardada(catId) {
    try {
      var p = JSON.parse(sessionStorage.getItem(POS) || 'null');
      if (p && p.cat === catId && typeof p.i === 'number') return p.i;
    } catch (e) { /* nada */ }
    return null;
  }

  /* O botão "← categorias" mora no CABEÇALHO desde 15/09/2026 (2ª rodada): dentro do
     feed ele caía por cima da foto no celular. Aqui só se decide quando ele aparece. */
  function mostrarVoltar(ligado) {
    Array.prototype.forEach.call(document.querySelectorAll('.voltar-categorias'), function (b) {
      b.hidden = !ligado;
    });
  }

  /* ================================================================ abrir e fechar */
  function abrir(catId, forcarIndice) {
    if (!catId) return;
    if (catId !== categoriaAtual) desenhar(catId);
    if (!itens.length) return;

    /* ⚠️ "ISSO ME MATA DE RAIVA EM QUALQUER SITE" (Cassiano, 14/09/2026, 16:23): clicar
       em voltar e cair no começo depois de ter passado por 30 produtos. Só vale quando
       o visitante veio DE DENTRO do site — quem chega pela primeira vez, e quem deu F5
       pra subir rápido, começa do começo. Quem decide isso é o abertura.js. */
    var i = forcarIndice;
    if (i === null || i === undefined) {
      var salvo = posicaoGuardada(catId);
      i = (salvo !== null && salvo < itens.length) ? salvo : 0;
    }

    itens.forEach(function (it) { it.classList.remove('ativo', 'visivel', 'acima', 'abaixo'); });
    feed.classList.remove('anima');              // a entrada não anima: ela já chega pronta
    indice = Math.max(0, Math.min(i, itens.length - 1));
    itens[indice].classList.add('visivel', 'ativo');
    voltarPraPrimeira(itens[indice]);

    feed.classList.add('aberto');
    feed.setAttribute('aria-hidden', 'false');
    mostrarVoltar(true);
    document.body.classList.add('escuro', 'travado');
    document.body.classList.remove('na-abertura');
    aberto = true;
    travado = false;
    pintarContador();
    guardarPosicao();
    if (window.aleaDistorcao) window.aleaDistorcao.montar(itens[indice].querySelector('.objeto'));
  }

  function fechar() {
    if (!aberto) return;
    feed.classList.remove('aberto');
    feed.setAttribute('aria-hidden', 'true');
    mostrarVoltar(false);
    document.body.classList.remove('escuro', 'travado');
    document.body.classList.add('na-abertura');
    aberto = false;
  }

  window.aleaFeed = { abrir: abrir, fechar: fechar, aberto: function () { return aberto; } };

  /* ==================================================================== os gestos */
  /* --- roda do mouse e trackpad ------------------------------------------- */
  function gavetaNaFrente() { return !!document.querySelector('.gaveta.aberta'); }

  window.addEventListener('wheel', function (e) {
    if (!aberto || gavetaNaFrente()) return;
    if (Math.abs(e.deltaY) < 4) return;          // tremida de trackpad não conta
    e.preventDefault();
    passo(e.deltaY > 0 ? 1 : -1);
  }, { passive: false });

  /* --- dedo: vertical troca produto, horizontal troca foto ---------------- */
  var x0 = null, y0 = null, jaFoi = false;
  window.addEventListener('touchstart', function (e) {
    if (!aberto || gavetaNaFrente()) return;
    x0 = e.touches[0].clientX;
    y0 = e.touches[0].clientY;
    jaFoi = false;
  }, { passive: true });

  window.addEventListener('touchmove', function (e) {
    if (!aberto || gavetaNaFrente() || x0 === null || jaFoi) return;
    /* segurar o touchmove é o que mata a INÉRCIA. Sem isto o dedo solta e o navegador
       continua rolando sozinho por três painéis. */
    e.preventDefault();
    var dx = x0 - e.touches[0].clientX;
    var dy = y0 - e.touches[0].clientY;
    /* o EIXO DOMINANTE decide: andou mais na horizontal, é foto; na vertical, é
       produto. Sem essa decisão um arrasto torto faria as duas coisas. */
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) < 34) return;
      jaFoi = true;
      var item = itens[indice];
      var fotos = fotosDo(item);
      var atual = fotos.findIndex(function (f) { return f.classList.contains('ativa'); });
      pedirFoto(item, (dx > 0 ? atual + 1 : atual - 1), dx > 0 ? 1 : -1);
    } else {
      if (Math.abs(dy) < 28) return;
      jaFoi = true;                              // um arrasto = um passo, e só
      passo(dy > 0 ? 1 : -1);
    }
  }, { passive: false });

  window.addEventListener('touchend', function () { x0 = null; }, { passive: true });

  /* --- teclado ------------------------------------------------------------ */
  document.addEventListener('keydown', function (e) {
    if (!aberto) return;
    if (gavetaNaFrente()) return;                            // a gaveta tem a vez
    var item = itens[indice];
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); passo(1); }
    else if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); passo(-1); }
    else if (e.key === 'Home') { e.preventDefault(); if (indice) irPara(0, -1); }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      var fotos = fotosDo(item);
      if (fotos.length < 2) return;
      e.preventDefault();
      var atual = fotos.findIndex(function (f) { return f.classList.contains('ativa'); });
      var dir = e.key === 'ArrowRight' ? 1 : -1;
      pedirFoto(item, atual + dir, dir);
    }
  });

  /* --- clique: bolinha troca foto, o resto avança ------------------------- */
  palco.addEventListener('click', function (e) {
    var bolinha = e.target.closest('[data-foto]');
    if (bolinha) {
      var n = parseInt(bolinha.getAttribute('data-foto'), 10);
      var item = itens[indice];
      var fotos = fotosDo(item);
      var atual = fotos.findIndex(function (f) { return f.classList.contains('ativa'); });
      pedirFoto(item, n, n > atual ? 1 : -1);
      return;
    }
    /* "um toque, próximo produto" (14/09). Link e botão seguem o seu caminho. */
    if (e.target.closest('a, button')) return;
    passo(1);
  });

  document.dispatchEvent(new CustomEvent('alea:feed-pronto'));
})();
