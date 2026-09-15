/* =============================================================================
   abertura.js — a primeira tela: a marca que se monta, a frase e o menu
   =============================================================================
   Pedidos do Cassiano em 15/09/2026 (2ª rodada):

     1. "deixar o site todo somente com o fundo e a capivara no maior tamanho possível
         em evidência, onde ela demora 3s e vai devagar pro lugar dela revelando o site"
     2. "o nome ālea na frente da capivara ir se revelando aos poucos letra por letra,
         saindo da capivara, da esquerda pra direita, onde cada letra demora 1s pra
         percorrer o trajeto até ir pra sua posição"
     3. "somente depois disso, datilografar a frase que vai abaixo do logo"
     4. "subir toda a logo e menu, pois ficou um espaço bem grande vazio"

   e, da 1ª rodada, que continuam valendo:

     "deixar esse MENU, onde somente depois que clicar na categoria a tela ficará preta
      e apresentará o feed com os produtos"
     "quando der F5/atualizar página, voltar pro começo da página"

   QUEM FAZ O QUÊ
   --------------
   O DESENHO da animação é CSS (ver `estilo.css`, bloco ABERTURA). Aqui mora só o que
   precisa de decisão e de medida: **qual é o "maior tamanho possível"** da capivara
   nesta janela, onde fica o centro dela na tela, e a ordem dos tempos.

   ⚠️ A ANIMAÇÃO SÓ ROLA UMA VEZ POR SESSÃO. São seis segundos até a frase começar —
   bonito na primeira vez, pedágio na quinta. Quem volta de uma página de produto, ou dá
   F5 pra voltar ao começo, recebe o logo já montado.
   ========================================================================== */

(function () {
  'use strict';

  var VIU = 'alea_viu_abertura';
  var corpo = document.body;
  if (!corpo.classList.contains('home')) return;

  /* Os tempos, num lugar só. Têm que bater com os `animation-delay` do CSS. */
  var CAPIVARA_MS = 3000;          // ela leva 3s pra chegar no lugar
  var LETRA_MS = 1000;             // cada letra leva 1s pra sair da capivara
  var ENTRE_LETRAS_MS = 700;       // e a seguinte parte 0,7s depois da anterior
  var LETRAS = 4;
  var FIM_DAS_LETRAS = CAPIVARA_MS + ENTRE_LETRAS_MS * (LETRAS - 1) + LETRA_MS;   // 6,1s

  /* =======================================================================
     1) F5 VOLTA PRO COMEÇO — e por que isso não é automático
     =======================================================================
     O navegador GUARDA a rolagem e a posição ao recarregar; é o comportamento padrão
     e normalmente é o certo. Foi exatamente o que o Cassiano viu: deu F5 no meio do
     feed pra subir rápido e voltou pro mesmo lugar.

     `history.scrollRestoration = 'manual'` desliga essa memória do navegador, e a
     marca de posição do feed é apagada quando a navegação é do tipo `reload`. O tipo
     vem do próprio navegador (PerformanceNavigationTiming), não de chute nosso —
     assim "voltar da página de produto" continua restaurando o lugar, que é o que ele
     pediu em 14/09 ("isso me mata de raiva em qualquer site").
     ======================================================================= */
  function ehRecarga() {
    try {
      var n = performance.getEntriesByType('navigation')[0];
      if (n) return n.type === 'reload';
      return performance.navigation && performance.navigation.type === 1;
    } catch (e) { return false; }
  }

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  var recarregou = ehRecarga();
  if (recarregou) {
    try { sessionStorage.removeItem('alea_feed_pos'); } catch (e) { /* aba anônima */ }
    window.scrollTo(0, 0);
  }

  var jaViu = false;
  try { jaViu = sessionStorage.getItem(VIU) === '1'; } catch (e) { /* aba anônima */ }
  if (jaViu) corpo.classList.add('sem-abertura');
  try { sessionStorage.setItem(VIU, '1'); } catch (e) { /* aba anônima */ }

  var querMenosMovimento = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =======================================================================
     2) O MAIOR TAMANHO POSSÍVEL DA CAPIVARA
     =======================================================================
     Os quatro números abaixo são a caixa da capivara DENTRO do viewBox do logotipo,
     medidos no SVG do designer em 15/09/2026 — não são chute:

         x de   79 a 1234   (viewBox 3448,89 de largura)
         y de   62 a  736   (viewBox  748,01 de altura)

     Com eles dá pra saber, em qualquer tamanho de janela, onde a capivara está na tela
     e que escala faz ela ocupar o máximo sem encostar na borda. Por isso a conta é
     feita aqui e não escrita à mão no CSS: "o maior tamanho possível" muda com a
     janela, e um número fixo ficaria certo num aparelho e errado nos outros.
     ======================================================================= */
  var CX0 = 79, CX1 = 1234, LARG_VB = 3448.89;
  var CY0 = 62, CY1 = 736, ALT_VB = 748.01;
  var FOLGA_LARGURA = 0.92;        // quanto da janela a capivara pode ocupar
  var FOLGA_ALTURA = 0.80;

  var marca = document.querySelector('.marca-anim');

  function medirCapivara() {
    if (!marca) return;
    var r = marca.getBoundingClientRect();
    if (!r.width) return;

    var larguraDela = r.width * (CX1 - CX0) / LARG_VB;
    var alturaDela = r.height * (CY1 - CY0) / ALT_VB;
    var centroX = r.left + r.width * ((CX0 + CX1) / 2) / LARG_VB;
    var centroY = r.top + r.height * ((CY0 + CY1) / 2) / ALT_VB;

    var k = Math.min(
      (window.innerWidth * FOLGA_LARGURA) / larguraDela,
      (window.innerHeight * FOLGA_ALTURA) / alturaDela
    );
    if (!(k > 1)) k = 1;           // janela minúscula: não encolher a marca

    var raiz = document.documentElement.style;
    raiz.setProperty('--cap-k', k.toFixed(3));
    raiz.setProperty('--cap-dx', (window.innerWidth / 2 - centroX).toFixed(1) + 'px');
    raiz.setProperty('--cap-dy', (window.innerHeight / 2 - centroY).toFixed(1) + 'px');
  }

  /* ------------------------------------------------ 3) a frase, letra por letra
     O texto já está inteiro no HTML (Google e leitor de tela leem mesmo sem JS). Aqui
     ele é guardado, a tela é esvaziada e as letras voltam uma a uma. `aria-hidden` no
     pedaço animado e o texto completo em `aria-label` evitam que o leitor de tela leia
     a frase 40 vezes enquanto ela é escrita. */
  var alvoFrase = document.querySelector('[data-datilografar]');
  var fraseGuardada = '';

  /* ⚠️ A FRASE É ESVAZIADA JÁ, e não na hora de escrever.
     O site.js preenche `[data-datilografar]` com a assinatura do config assim que a
     página carrega — é ele que mantém o texto num lugar só. Se eu só limpasse na hora
     de datilografar, a frase inteira ficaria pronta na tela durante os seis segundos
     da marca, e a máquina de escrever apareceria apagando o que já estava escrito. */
  function guardarEEsvaziarFrase() {
    if (!alvoFrase) return;
    fraseGuardada = (window.ALEA && window.ALEA.assinatura) || alvoFrase.textContent.trim();
    alvoFrase.setAttribute('aria-label', fraseGuardada);
    alvoFrase.textContent = '';
  }

  function datilografar() {
    var alvo = alvoFrase;
    if (!alvo) return;
    var frase = fraseGuardada || (window.ALEA && window.ALEA.assinatura) || alvo.textContent.trim();
    alvo.setAttribute('aria-label', frase);
    corpo.classList.add('frase-revelada');

    if (querMenosMovimento) { alvo.textContent = frase; alvo.classList.add('pronta'); return; }

    alvo.textContent = '';
    var letras = document.createElement('span');
    letras.setAttribute('aria-hidden', 'true');
    var cursor = document.createElement('span');
    cursor.className = 'cursor';
    cursor.setAttribute('aria-hidden', 'true');
    alvo.appendChild(letras);
    alvo.appendChild(cursor);

    var i = 0;
    (function escrever() {
      letras.textContent = frase.slice(0, ++i);
      if (i < frase.length) {
        /* ritmo irregular de propósito: passo fixo soa a máquina, e o que ele pediu
           foi "como se estivesse digitando". A vírgula e o ponto seguram um pouco. */
        var c = frase.charAt(i - 1);
        var pausa = (c === ',' || c === '!' || c === '.') ? 260 : (38 + Math.random() * 46);
        setTimeout(escrever, pausa);
      } else {
        alvo.classList.add('pronta');
      }
    })();
  }

  /* ------------------------------------------------ 4) a ordem das coisas */
  function abrirSemAnimacao() {
    corpo.classList.add('marca-medida', 'site-revelado');
    datilografar();
  }

  function abrirComAnimacao() {
    guardarEEsvaziarFrase();
    medirCapivara();
    corpo.classList.add('marca-medida');
    /* dois quadros de espera: o primeiro aplica o estado de partida (capivara gigante),
       o segundo liga a animação. Ligar os dois no mesmo quadro é o jeito clássico de o
       navegador juntar as duas mudanças e não animar nada. */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        corpo.classList.add('marca-anima');
      });
    });
    /* o site "se revela" quando a capivara chega no lugar dela */
    setTimeout(function () { corpo.classList.add('site-revelado'); }, CAPIVARA_MS - 250);
    /* e a frase só começa DEPOIS da última letra — pedido literal dele */
    setTimeout(datilografar, FIM_DAS_LETRAS + 200);
  }

  if (jaViu || querMenosMovimento) {
    abrirSemAnimacao();
  } else if (document.readyState === 'complete') {
    abrirComAnimacao();
  } else {
    /* espera as imagens da marca decodificarem: começar antes faz a capivara aparecer
       no meio da animação, já encolhendo */
    window.addEventListener('load', abrirComAnimacao, { once: true });
  }

  /* girar o telefone muda "o maior tamanho possível". Depois que a animação acabou não
     há o que remedir — o estado final é `transform: none` e independe destes números. */
  window.addEventListener('resize', function () {
    if (!corpo.classList.contains('marca-anima')) medirCapivara();
  });

  /* =======================================================================
     5) O MENU ABRE O FEED — e o endereço acompanha
     =======================================================================
     Cada categoria é um link de verdade pra `index.html#pet`. Isso dá três coisas de
     graça: o botão de voltar do navegador fecha o feed, o link de uma categoria pode
     ser mandado no WhatsApp, e quem chega por esse link já cai no feed certo.
     ======================================================================= */
  function categoriaDoEndereco() {
    var id = (location.hash || '').replace('#', '').trim();
    if (!id) return null;
    var existe = (window.CATEGORIAS || []).some(function (c) { return c.id === id; });
    var tem = (window.VITRINE || []).some(function (i) { return i.categoria === id; });
    return (existe && tem) ? id : null;
  }

  function aplicarEndereco() {
    var id = categoriaDoEndereco();
    if (!window.aleaFeed) return;
    if (id) {
      /* na recarga o feed volta pro primeiro item — é o "começo da página" que ele
         pediu. Fora dela, o feed decide sozinho se restaura a posição guardada. */
      window.aleaFeed.abrir(id, recarregou ? 0 : null);
      recarregou = false;
    } else {
      window.aleaFeed.fechar();
    }
  }

  window.addEventListener('hashchange', aplicarEndereco);

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-fechar-feed]')) {
      e.preventDefault();
      /* tira o `#categoria` do endereço sem empilhar mais uma entrada no histórico */
      history.replaceState(null, '', location.pathname + location.search);
      window.aleaFeed.fechar();
    }
  });

  /* o feed.js avisa quando terminou de se preparar; só então o endereço é aplicado */
  if (window.aleaFeed) {
    aplicarEndereco();
  } else {
    document.addEventListener('alea:feed-pronto', aplicarEndereco);
  }
})();
