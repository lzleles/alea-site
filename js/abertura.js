/* =============================================================================
   abertura.js — a primeira tela: a marca, a frase e o menu que abre o feed
   =============================================================================
   Pedidos do Cassiano em 15/09/2026:

     "quando abrir, fazer uma animação da capivara gigante, depois ela diminuindo indo
      pro lado esquerdo e aparecendo o nome ALEA pro lado direito até formar a logo"
     "substituir a frase […] pra uma frase com animação de como se estivesse digitando,
      aparecendo letra por letra"
     "deixar esse MENU, onde somente depois que clicar na categoria a tela ficará preta
      e apresentará o feed com os produtos"
     "quando der F5/atualizar página, voltar pro começo da página"

   A ANIMAÇÃO DA MARCA É CSS PURO (ver estilo.css). Aqui só mora o que precisa de
   decisão: quando ela roda, quando a frase começa a ser escrita, e o que o menu faz.

   ⚠️ A ANIMAÇÃO SÓ ROLA UMA VEZ POR SESSÃO. Quem entra pela primeira vez vê a capivara
   crescer; quem volta de uma página de produto, ou dá F5 pra voltar ao começo, recebe
   o logo já montado. Abertura bonita que se repete a cada clique vira pedágio.
   ========================================================================== */

(function () {
  'use strict';

  var VIU = 'alea_viu_abertura';
  var corpo = document.body;
  if (!corpo.classList.contains('home')) return;

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
      /* navegador velho: o enum antigo ainda responde */
      return performance.navigation && performance.navigation.type === 1;
    } catch (e) { return false; }
  }

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  var recarregou = ehRecarga();
  if (recarregou) {
    try { sessionStorage.removeItem('alea_feed_pos'); } catch (e) { /* aba anônima */ }
    window.scrollTo(0, 0);
  }

  /* ------------------------------------------------ 2) a animação, uma vez só */
  var jaViu = false;
  try { jaViu = sessionStorage.getItem(VIU) === '1'; } catch (e) { /* aba anônima */ }
  if (jaViu) corpo.classList.add('sem-abertura');
  try { sessionStorage.setItem(VIU, '1'); } catch (e) { /* aba anônima */ }

  var querMenosMovimento = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------ 3) a frase, letra por letra
     O texto já está inteiro no HTML (Google e leitor de tela leem mesmo sem JS). Aqui
     ele é guardado, a tela é esvaziada e as letras voltam uma a uma. `aria-hidden` no
     pedaço animado e o texto completo em `aria-label` evitam que o leitor de tela leia
     a frase 40 vezes enquanto ela é escrita. */
  function datilografar() {
    var alvo = document.querySelector('[data-datilografar]');
    if (!alvo) return;
    var frase = (window.ALEA && window.ALEA.assinatura) || alvo.textContent.trim();
    alvo.setAttribute('aria-label', frase);

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

  /* a frase começa depois que a marca terminou de se montar — as duas ao mesmo tempo
     brigam pela atenção, e ele já reclamou uma vez de "duas animações juntas". */
  var esperaDaFrase = (jaViu || querMenosMovimento) ? 200 : 2600;
  setTimeout(datilografar, esperaDaFrase);

  /* =======================================================================
     4) O MENU ABRE O FEED — e o endereço acompanha
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
