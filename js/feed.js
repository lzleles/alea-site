/* CATALOGO:
   nome: feed
   categoria: UTIL
   objetivo: Desenha o feed por categoria e controla rolagem, fotos, contador, restauração de posição e cartão final.
   entrada: Catálogo global, configuração, DOM, gestos e sessionStorage
   saida: Feed de produtos, filtros visuais, navegação e posição persistida
   status: ativo (cabecalho proposto pelo Codex em 2026-09-20, confianca ALTA; conferir na proxima vez que o script rodar)
   validado_em: TBD
*/
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
      roubando o lugar central"                   -> era o `irPara()`; ver a 5ª rodada abaixo
     "tirar as fotos sempre sem fundo, somente o objeto"        -> `_obj.webp` no centro
     "deixando as fotos completas somente se arrastar pro lado" -> as fotos de cenário
     "somente no primeiro produto, mostrar alguma animação com setas"  -> `.dica-arrasto`
     "retirar as setas e colocar as bolinhas centralizadas, acima do título" -> `.pontos`
     "retirar a seta indicativa pra baixo do canto inferior direito"  -> o botão sumiu

   E O QUE SOBREVIVEU DA VERSÃO ANTERIOR, porque ele já tinha pedido e não mudou:
     · UM GESTO = UM PRODUTO, com trava enquanto a animação roda (15:17 de 14/09);
     · o produto SEMPRE volta pra primeira foto quando entra na tela (16:23);
     · voltar de uma página de produto reabre o feed no MESMO lugar (16:23).

   ⚠️ 5ª RODADA (17/09/2026) — A ROLAGEM VOLTOU A SER ROLAGEM DE VERDADE
   ---------------------------------------------------------------------
   Áudio dele das 17:27, com o site `laulau.xyz` de referência e um vídeo da tela:

     "o tempo de resposta dele para passar de um produto para o outro está muito
      demorado. Às vezes eu tenho que passar o dedo umas três vezes […] Eu queria que a
      tela fosse mais fluida, como se fosse o site do Laulau […] Pense que a gente está
      em uma tela da Globo.com, onde você vai passando a barra e a página vai deslizando.
      Ela não vai passando meio que página por página, produto por produto […] sempre
      quando chegar quase no final da página, ele já vai subindo outro produto junto,
      como se fosse uma emenda […] E se eu quiser rolar tudo de uma vez só também eu
      consigo. Eu não fico naquele meio que travado igual tá o meu site."

   O QUE CAIU, E POR QUE ISSO NÃO É "DESFAZER" O QUE ELE TINHA PEDIDO:
     · `irPara()`, `passo()`, a trava de 1250 ms e o sequestro da roda/do dedo SAÍRAM.
       Eram a resposta certa pro pedido de 14/09 ("um gesto = um produto", pra não passar
       dois de uma vez). Só que "um gesto = um produto" COM TRAVA vira o que ele está
       descrevendo agora: o gesto que chega durante a animação é jogado fora, e o dedo
       precisa vir três vezes. O pedido novo é o oposto do antigo, e quem manda é o novo.
     · O que ele pediu em 15/09 e CONTINUA VALENDO: um produto por tela (ninguém vê dois),
       a peça volta pra foto 1 ao entrar, arrastar pro lado troca a foto, e voltar de uma
       página de produto cai no mesmo lugar. Tudo isso sobrevive sem trava nenhuma.

   COMO É AGORA: a camada `.feed` é um CONTÊINER QUE ROLA (`overflow-y: auto`), e cada
   produto é um bloco de uma tela de altura, um embaixo do outro. Quem anima é o navegador,
   com a física dele — é isso que dá o "arrastar o dedo de uma vez e ir lá pra baixo".
   Sem `scroll-snap`: snap é exatamente o "página por página" que ele acabou de recusar.
   Quem está na tela é medido por `IntersectionObserver` — é ele que acende o efeito da
   peça, pinta o contador, guarda o lugar e devolve o item que saiu pra primeira foto.

   O que continua valendo: o feed NÃO é a página de destino do Google Ads. O destino é a
   página de PRODUTO, que tem texto, preço e rolagem própria.
   ========================================================================== */

(function () {
  'use strict';

  var POS = 'alea_feed_pos';

  var feed = document.getElementById('feed');
  var palco = document.getElementById('palco');
  var contador = document.getElementById('contador');
  if (!feed || !palco) return;

  var categoriaAtual = null;
  var itens = [];
  var indice = 0;
  var aberto = false;
  var olho = null;                 // o IntersectionObserver que diz quem está na tela
  var olhoRevela = null;           // o outro: revela o item quando ele entra de baixo

  var querMenosMovimento = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function moeda(v) {
    return (window.aleaDinheiro && window.aleaDinheiro(v)) || 'Sob consulta';
  }

  /* ⚠️ ETAPA 10 (22/09/2026): o nome "ālea" tem que sair IGUAL À LOGO — em Defante, MINÚSCULO, com
     o macron (ā). A legenda do produto está em CAIXA ALTA (`.produto-mini`), o que viraria "ĀLEA".
     Então o "ālea" (com ā) é embrulhado num span que NÃO sobe pra maiúscula (CSS `.marca-nome`).
     O resto do nome do produto continua na régua da legenda. */
  function comNomeMarca(txt) {
    return String(txt).replace(/[āa]lea/gi, '<span class="marca-nome">ālea</span>');
  }

  function nomeDaCategoria(id) {
    var c = (window.CATEGORIAS || []).filter(function (x) { return x.id === id; })[0];
    return c ? c.nome : String(id || '').toUpperCase();
  }

  /* A linha que explica a categoria, no topo do feed (pedido de 16/09/2026). Nasce aqui e
     não no index.html porque o feed inteiro é desenhado por este arquivo. Categoria sem
     descrição não ganha linha vazia: o elemento some. */
  /* ⚠️ ETAPA 3 (22/09/2026): antes das fotos vem o TÍTULO da categoria (o nome, maior) e,
     embaixo, a descrição — centralizados (pedido do Cassiano). O título aparece sempre que há
     categoria; a descrição some quando está vazia, sem deixar linha vazia. */
  function pintarDescricao(id) {
    var c = (window.CATEGORIAS || []).filter(function (x) { return x.id === id; })[0];
    var texto = c && c.descricao ? c.descricao : '';
    var el = document.getElementById('descricao-categoria');
    if (!el) {
      el = document.createElement('div');
      el.id = 'descricao-categoria';
      el.className = 'descricao-categoria';
      /* ETAPA 4 (22/09/2026): a intro entra NO FLUXO, ACIMA das fotos (antes do palco), pra a
         primeira foto descer e o texto ficar numa área limpa e legível. Some aos poucos ao rolar
         (o scroll lá embaixo mexe na opacidade) — não some de uma vez como antes. */
      feed.insertBefore(el, palco);
    }
    el.style.opacity = '1';         // categoria nova: a intro reaparece inteira
    el.innerHTML = '';
    var titulo = document.createElement('span');
    titulo.className = 'titulo-categoria';
    titulo.textContent = nomeDaCategoria(id);
    el.appendChild(titulo);
    if (texto) {
      var p = document.createElement('span');
      p.className = 'texto-categoria';
      p.textContent = texto;
      el.appendChild(p);
    }
    el.hidden = !id;
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
            '<span class="produto-mini">' + comNomeMarca(c.produto) + '</span>' +
            '<a class="ver" href="produto-' + c.pagina + '.html">ver produto →</a>' +
          '</span>' +
          (mostrarPreco ? '<span class="valor">' + (c.preco === null ? 'Sob consulta' : moeda(c.preco)) + '</span>' : '') +
        '</div>';
      palco.appendChild(art);
    });

    /* O CARTÃO DE FIM. Passar do último produto não pode dar em parede: aqui o feed
       fecha o assunto com a marca e devolve o caminho pro menu e pro orçamento.

       ⚠️ 5ª RODADA (17/09/2026, áudio das 17:28): "quando você chega no último produto […]
       aparece a parte preta embaixo. Então, para eu não ter que clicar em voltar, igual tem
       um botão lá 'voltar para as categorias', já coloque ali também TODAS AS CATEGORIAS,
       que evitam da pessoa ir na página principal para ela clicar em outra categoria."
       O menu aqui é o MESMO do rodapé e da abertura, montado pelo site.js (`aleaMenuCategorias`):
       assim a regra do "em breve" — categoria sem peça não vira link — vale aqui também, sem
       nenhuma cópia. Cada link é `#categoria` de verdade: quem troca o feed é o `hashchange`
       do abertura.js, então o botão de voltar do navegador continua funcionando. */
    var fim = document.createElement('article');
    fim.className = 'item';
    fim.setAttribute('data-i', String(lista.length));
    fim.innerHTML =
      '<div class="fim">' +
        /* ETAPA 4 (22/09/2026): o logo do fim virou a marca NOVA (Capivara Página Inicial),
           e o "ou veja outra categoria" saiu (pedido dele). */
        '<img src="img/marca/e_co/logo_claro.svg" alt="ālea & Co.">' +
        '<p data-assinatura>Onde cada impressão começa com um sonho!</p>' +
        '<a class="botao zap" data-assunto="orçamento de uma peça personalizada">Orçamentos e personalizados</a>' +
        '<nav class="menu-categorias" data-menu-categorias aria-label="Categorias"></nav>' +
        /* ⚠️ 8ª RODADA (18/09/2026, áudio das 23:02): "tem um botão lá embaixo que está
           escrito 'voltar para categorias'. Nós vamos só alterar a frase para 'voltar para
           a página inicial'. Aí, se a pessoa clicar, vai ter a animação, tudo de novo."
           O `data-voltar-inicio` é o que diz ao abertura.js pra TOCAR A ABERTURA — o botão
           do cabeçalho, que continua só fechando, não tem esse atributo. */
        '<button class="fechar-feed" type="button" data-fechar-feed data-voltar-inicio ' +
                'style="position:static">← voltar para a página inicial</button>' +
      '</div>';
    palco.appendChild(fim);

    itens = Array.prototype.slice.call(palco.querySelectorAll('.item'));
    categoriaAtual = catId;

    if (window.aleaLigarBotoes) window.aleaLigarBotoes(palco);
    /* o menu do cartão de fim nasce aqui, depois que o site.js já montou os outros */
    if (window.aleaMenuCategorias) window.aleaMenuCategorias();
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
  /* ⚠️ NÃO EXISTE MAIS "IR PRA" NEM TRAVA. Quem move a tela é o navegador, rolando o
     contêiner — é isso que dá a física que ele pediu ("arrastar o dedo de uma vez só e já
     vai lá pra baixo"). Daqui só sai um EMPURRÃO: levar a rolagem até o topo de um item.

     ⚠️ `behavior: 'smooth'` vai AQUI, na chamada, e nunca no CSS (`scroll-behavior`).
     No CSS ele contamina toda rolagem programática da página — foi o defeito medido em
     14/09/2026, quando cada quadro de uma animação virava outra rolagem suave. */
  function irParaItem(n, suave) {
    if (!itens.length) return;
    n = Math.max(0, Math.min(n, itens.length - 1));
    feed.scrollTo({ top: topoNoFeed(itens[n]), behavior: (suave && !querMenosMovimento) ? 'smooth' : 'auto' });
  }

  /* ⚠️ ETAPA 15 (22/09/2026, áudio das 19:16): `offsetTop` MENTIA desde a etapa 4. O `.palco` é
     `position: relative`, então o `offsetTop` de cada item conta a partir do PALCO — mas desde a
     etapa 4 a intro da categoria (título + texto) mora ACIMA do palco, dentro do feed. Toda conta
     de posição ficava deslocada pela altura da intro (~350 px no celular): o "item na vez" era o
     de BAIXO, e arrastar o dedo em cima da Cláudia trocava a foto do produto seguinte. A régua
     agora é a caixa real na tela (getBoundingClientRect), que não depende de quem é o pai. */
  function topoNoFeed(el) {
    return feed.scrollTop + el.getBoundingClientRect().top - feed.getBoundingClientRect().top;
  }

  function passo(dir) {
    if (!aberto) return;
    irParaItem(indice + dir, true);
  }

  /* =================================================== quem está na tela, de verdade
     Com rolagem nativa ninguém "manda" o item entrar: ele entra porque o dedo andou. Quem
     percebe é o IntersectionObserver, e é dele que saem as quatro consequências:
       · o contador;                     · guardar o lugar pra quem voltar de um produto;
       · acender o efeito da peça;       · devolver à foto 1 quem saiu da tela.

     ⚠️ 60% e não 50%: cada item tem uma tela de altura, então com 50% dois itens podem
     estar "na vez" ao mesmo tempo no meio do gesto e o contador pisca. Com 60% só existe
     um vencedor. ⚠️ E o observador só enxerga a partir do momento em que o feed é visível
     — `visibility: hidden` é invisível pra ele, então ligar antes de abrir não adianta. */
  /* ⚠️ A LINHA DA CATEGORIA SÓ VALE NO TOPO (5ª rodada). Ela é fixa na tela — tem que ser,
     senão sobe junto com o primeiro produto e some pra sempre. Só que fixa o tempo todo ela
     fica POR CIMA da legenda de cada produto que passa (visto no primeiro teste desta rodada).
     Então ela se apresenta e sai de cena: assim que a rolagem começa, apaga. */
  function ligarSumicoDaDescricao() {
    feed.addEventListener('scroll', function () {
      feed.classList.toggle('rolou', feed.scrollTop > 40);
      /* ETAPA 4 (22/09/2026): a intro some AOS POUCOS, junto com a rolagem — não de uma vez.
         A opacidade acompanha o quanto já se rolou dela: em 0 está inteira, e vai a zero
         quando quase toda a intro já subiu. "Como se estivesse passando de foto por foto." */
      var intro = document.getElementById('descricao-categoria');
      if (intro && !intro.hidden) {
        var faixa = (intro.offsetHeight || 300) * 0.9;
        intro.style.opacity = String(Math.max(0, Math.min(1, 1 - feed.scrollTop / faixa)));
      }
      reverQuemEstaNaVez();
    }, { passive: true });
  }

  /* ⚠️ A REVELAÇÃO (6ª rodada) — medida no laulau.xyz, não copiada de descrição: cada cartão
     de lá nasce com `opacity: 0` e `translateY(102.966px)` e volta ao lugar em 0,8 s com curva
     `ease`. Os números estão no CSS; aqui fica só o GATILHO.

     `rootMargin: '0px 0px -25% 0px'` encolhe o fundo da área de observação em um quarto: o item
     só conta como "entrou" depois de subir um pedaço da tela. Sem essa folga ele se revelaria
     encostando na borda de baixo, fora do campo de visão, e a pessoa nunca veria a entrada —
     que é exatamente a queixa dele ("as imagens estão todas estáticas").

     `unobserve` depois de revelar: revela UMA VEZ, como no laulau. Subir de volta não re-anima
     (e não deve: a animação vem de baixo, e vista de cima ficaria ao contrário). */
  function ligarRevelacao() {
    if (olhoRevela) olhoRevela.disconnect();
    olhoRevela = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('revelado');
        olhoRevela.unobserve(e.target);
      });
    }, { root: feed, rootMargin: '0px 0px -25% 0px', threshold: 0.01 });
    itens.forEach(function (it) { olhoRevela.observe(it); });
  }

  /* ⚠️ QUEM ESTÁ "NA VEZ" MUDOU DE RÉGUA NA 7ª RODADA.
     Enquanto cada item ocupava uma tela inteira, dava pra dizer "está na vez quem preenche 60%
     da tela". Com o espaçamento do laulau cabem QUASE DOIS produtos na tela ao mesmo tempo — e
     aí os dois preenchem 100% de si mesmos, os dois se dizem vencedores, e o contador fica
     piscando entre eles conforme a ordem em que o navegador avisa.

     A régua que não depende do tamanho do item: **está na vez quem tem o centro mais perto do
     centro da tela**. Uma conta só, no evento de rolagem, sem observador nenhum.

     ⚠️ ETAPA 15 (22/09/2026): a régua virou a DELE — "tem que mudar a foto que estiver em maior
     evidência na tela". Está na vez quem tem MAIS FOTO VISÍVEL (altura da `.area-objeto` dentro
     da janela do feed), medida na caixa real da tela. Empate (duas fotos inteiras) → a mais perto
     do centro. O cartão de fim, que não tem foto, é medido pela caixa dele. */
  function quemEstaNaVez() {
    if (!itens.length) return 0;
    var fr = feed.getBoundingClientRect();
    var meio = fr.top + fr.height / 2;
    var melhor = 0, maisVisivel = -1, menor = Infinity;
    for (var i = 0; i < itens.length; i++) {
      var alvo = itens[i].querySelector('.area-objeto') || itens[i].querySelector('.fim') || itens[i];
      var r = alvo.getBoundingClientRect();
      var visivel = Math.max(0, Math.min(r.bottom, fr.bottom) - Math.max(r.top, fr.top));
      var d = Math.abs((r.top + r.height / 2) - meio);
      if (visivel > maisVisivel + 1 || (Math.abs(visivel - maisVisivel) <= 1 && d < menor)) {
        maisVisivel = visivel; menor = d; melhor = i;
      }
    }
    return melhor;
  }

  function reverQuemEstaNaVez() {
    var n = quemEstaNaVez();
    if (n === indice) return;
    indice = n;
    pintarContador();
    guardarPosicao();
  }

  function ligarObservador() {
    if (olho) olho.disconnect();
    /* o observador agora cuida só do que é por-item e não depende de "estar na vez":
       acender o efeito de quem apareceu, e devolver à foto 1 quem saiu de cena. */
    olho = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) {
          if (window.aleaDistorcao) window.aleaDistorcao.montar(e.target.querySelector('.objeto'));
        } else {
          /* "sempre permanecer na primeira foto" (14/09/2026, 16:23): quem sai de cena
             volta pro começo, pra não reaparecer na foto 3. */
          voltarPraPrimeira(e.target);
        }
      });
    }, { root: feed, threshold: 0 });
    itens.forEach(function (it) { olho.observe(it); });
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

    indice = Math.max(0, Math.min(i, itens.length - 1));
    voltarPraPrimeira(itens[indice]);

    /* ⚠️ A ORDEM IMPORTA: visível PRIMEIRO, rolagem DEPOIS, observador por último.
       Com o feed ainda invisível o `offsetTop` até responde, mas o observador não enxerga
       nada e o primeiro item entraria sem efeito e sem contador. */
    feed.classList.add('aberto');
    feed.setAttribute('aria-hidden', 'false');
    document.body.classList.add('escuro', 'travado');
    document.body.classList.remove('na-abertura');
    aberto = true;

    irParaItem(indice, false);                   // a entrada não anima: já chega no lugar
    itens.forEach(function (it) { it.classList.remove('revelado'); });   // categoria nova, entrada nova
    ligarObservador();
    ligarRevelacao();
    if (!feed.dataset.sumicoLigado) { ligarSumicoDaDescricao(); feed.dataset.sumicoLigado = '1'; }
    feed.classList.toggle('rolou', feed.scrollTop > 40);
    reverQuemEstaNaVez();

    mostrarVoltar(true);
    pintarDescricao(catId);
    pintarContador();
    guardarPosicao();
    if (window.aleaDistorcao) window.aleaDistorcao.montar(itens[indice].querySelector('.objeto'));
  }

  function fechar() {
    if (!aberto) return;
    if (olho) { olho.disconnect(); olho = null; }   // fechado, ninguém precisa ser observado
    if (olhoRevela) { olhoRevela.disconnect(); olhoRevela = null; }
    feed.classList.remove('aberto');
    feed.setAttribute('aria-hidden', 'true');
    mostrarVoltar(false);
    document.body.classList.remove('escuro', 'travado');
    document.body.classList.add('na-abertura');
    aberto = false;
  }

  window.aleaFeed = { abrir: abrir, fechar: fechar, aberto: function () { return aberto; } };

  /* ==================================================================== os gestos */
  /* ⚠️ 5ª RODADA: A RODA E O DEDO NA VERTICAL NÃO SÃO MAIS NOSSOS.
     Saiu o `wheel` com `preventDefault` e saiu o `touchmove` que matava a inércia. Eram a
     resposta pro "passou dois de uma vez" de 14/09, e viraram o "tenho que passar o dedo
     três vezes" de hoje. Rolar é do navegador; aqui só sobra o que ele não sabe fazer:
     o arrasto HORIZONTAL, que troca a foto da peça.

     Como o horizontal é capturado sem `preventDefault`: o CSS declara `touch-action: pan-y`
     na peça, que diz ao navegador "nesta caixa só existe rolagem vertical". O gesto lateral
     sobra pra gente sem precisar cancelar nada — e, por não cancelar, a rolagem vertical
     nunca é engolida por engano. */
  function gavetaNaFrente() { return !!document.querySelector('.gaveta.aberta'); }

  /* ⚠️ ETAPA 16 (22/09/2026, áudios das 19:25): "melhorou, mas tem hora que dá certo, tem hora
     que não". A régua da etapa 15 (mais foto visível) é uma ADIVINHAÇÃO de qual peça ele quer —
     entre duas peças meio visíveis, ela chuta. A regra dele elimina o chute:
       · tocou numa peça → a tela rola até a FOTO dela ficar no CENTRO, e ela vira a peça EM FOCO;
       · arrastar pro lado troca a foto da peça onde o DEDO COMEÇOU o gesto; fora de qualquer peça,
         a que está em foco (se ainda aparece), e só na falta das duas a de mais evidência.
     E o toque NÃO pula mais pro próximo produto ("ele desregula e vai pra qualquer lugar"). */
  var emFoco = null;

  /* ⚠️ A posição sai da CADEIA de offsetTop até o feed, não do getBoundingClientRect: a peça
     que acabou de entrar ainda está na animação de revelação (translateY de ~103 px, ver o CSS),
     e a caixa da tela mente essa distância — medido no teste, a foto parava 103 px acima do centro. */
  function posNoFeed(el) {
    var y = 0;
    while (el && el !== feed) { y += el.offsetTop; el = el.offsetParent; }
    return y;
  }

  function centralizarPeca(item) {
    var alvo = item.querySelector('.area-objeto') || item;
    var topo = posNoFeed(alvo) + alvo.offsetHeight / 2 - feed.clientHeight / 2;
    feed.scrollTo({ top: Math.max(0, topo), behavior: querMenosMovimento ? 'auto' : 'smooth' });
  }

  function aindaNaTela(item) {
    if (!item) return false;
    var fr = feed.getBoundingClientRect(), r = item.getBoundingClientRect();
    return r.bottom > fr.top && r.top < fr.bottom;
  }

  var x0 = null, y0 = null, jaFoi = false, pecaDoDedo = null;
  palco.addEventListener('touchstart', function (e) {
    if (!aberto || gavetaNaFrente()) return;
    x0 = e.touches[0].clientX;
    y0 = e.touches[0].clientY;
    jaFoi = false;
    var it = e.target.closest && e.target.closest('#palco > .item');
    pecaDoDedo = (it && fotosDo(it).length) ? it : null;
  }, { passive: true });

  palco.addEventListener('touchmove', function (e) {
    if (!aberto || gavetaNaFrente() || x0 === null || jaFoi) return;
    var dx = x0 - e.touches[0].clientX;
    var dy = y0 - e.touches[0].clientY;
    /* só a horizontal é nossa, e só quando ela domina com folga: arrasto torto é rolagem */
    if (Math.abs(dx) < 34 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
    jaFoi = true;
    var item = pecaDoDedo || (aindaNaTela(emFoco) ? emFoco : null);
    if (!item) { reverQuemEstaNaVez(); item = itens[indice]; }   // ETAPA 15: o último recurso
    var fotos = fotosDo(item);
    var atual = fotos.findIndex(function (f) { return f.classList.contains('ativa'); });
    pedirFoto(item, (dx > 0 ? atual + 1 : atual - 1), dx > 0 ? 1 : -1);
  }, { passive: true });

  palco.addEventListener('touchend', function () { x0 = null; }, { passive: true });

  /* --- teclado ------------------------------------------------------------ */
  document.addEventListener('keydown', function (e) {
    if (!aberto) return;
    if (gavetaNaFrente()) return;                            // a gaveta tem a vez
    var item = itens[indice];
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); passo(1); }
    else if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); passo(-1); }
    else if (e.key === 'Home') { e.preventDefault(); irParaItem(0, true); }
    else if (e.key === 'End') { e.preventDefault(); irParaItem(itens.length - 1, true); }
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
      var item = bolinha.closest('.item') || itens[indice];   // ETAPA 15: a bolinha é DA peça dela
      var fotos = fotosDo(item);
      var atual = fotos.findIndex(function (f) { return f.classList.contains('ativa'); });
      pedirFoto(item, n, n > atual ? 1 : -1);
      return;
    }
    /* ETAPA 16: saiu o "um toque, próximo produto" (14/09) — pulava a tela quando ele só queria
       olhar a foto. Agora o toque CENTRALIZA a peça tocada e a põe em foco. Link e botão seguem
       o seu caminho; toque no vão entre peças não faz nada. */
    if (e.target.closest('a, button')) return;
    var peca = e.target.closest('#palco > .item');
    if (!peca || !fotosDo(peca).length) return;
    emFoco = peca;
    centralizarPeca(peca);
  });

  document.dispatchEvent(new CustomEvent('alea:feed-pronto'));
})();
