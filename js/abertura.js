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

   8ª RODADA (18/09/2026) — três pedidos dele, todos sobre ESPERAR:

     1. "se eu clicar em qualquer lugar do site, ela já para a animação e vai tudo pra
         página inicial normal, como se não tivesse animação"   → `pularAbertura()`
     2. "eu não quero que tenha animação nenhuma na segunda página [no F5]"
                                                                → `abreDiretoNoFeed`
     3. "'voltar para categorias' vira 'voltar para a página inicial', e aí vai ter a
         animação, tudo de novo, normal"                        → `tocarAbertura()`

   ⚠️ QUEM VÊ A ABERTURA E QUEM NÃO VÊ — a régua mudou na 4ª rodada (17/09/2026, item 2):
   "quando clica em F5 ela faz a animação perfeita igual deve ser, mas quando clico no site
   da barra de pesquisa e dou enter, ele não faz a animação e permanece como está! Quero que
   faça a animação igual como se estivesse apertando F5."
   Ver `comoCheguei()` lá embaixo: a decisão saiu da marca de sessão e passou pro TIPO da
   navegação + de onde a pessoa veio.
   ========================================================================== */

(function () {
  'use strict';

  var corpo = document.body;
  if (!corpo.classList.contains('home')) return;

  /* Os tempos, num lugar só. Têm que bater com os `animation-delay` do CSS. */
  var PAUSA_CAPIVARA_MS = 1400;    // ela fica PARADA, gigante, antes de andar (3ª rodada)
  var CAPIVARA_MS = 3600;          // e leva 3,6s indo devagar pro lugar dela
  var LETRA_MS = 1000;             // cada letra leva 1s pra sair da capivara
  var ENTRE_LETRAS_MS = 700;       // e a seguinte parte 0,7s depois da anterior
  var LETRAS = 4;
  var FIM_DAS_LETRAS = PAUSA_CAPIVARA_MS + CAPIVARA_MS +
                       ENTRE_LETRAS_MS * (LETRAS - 1) + LETRA_MS;                 // 8,1s

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
  /* =======================================================================
     COMO EU CHEGUEI NESTA PÁGINA — e por que isso decide a abertura
     =======================================================================
     O navegador diz de que TIPO foi a navegação, e o documento diz DE ONDE a pessoa veio.
     Com os dois, dá pra separar as quatro chegadas possíveis sem chutar e sem guardar
     marca nenhuma:

       reload ........... F5. Gesto deliberado de quem quer ver de novo → ANIMA.
       navigate de fora . endereço digitado na barra, favorito, link do WhatsApp, Google,
                          Instagram. É a primeira vez de alguém no site → ANIMA.
                          ⚠️ ESTE É O ITEM 2 DA 4ª RODADA: antes ele caía na mesma marca de
                          sessão do F5 e chegava com o logo pronto. "Quero que faça a
                          animação igual como se estivesse apertando F5."
       navigate de dentro clicou num link do próprio site (ex.: o logo do cabeçalho, voltando
                          de uma página de produto) → NÃO ANIMA. É o pedido dele de 14/09:
                          seis segundos na quinta vez é pedágio.
       back_forward ..... botão de voltar do navegador → NÃO ANIMA, mesmo motivo.

     ⚠️ SAIU DAQUI a marca `sessionStorage['alea_viu_abertura']`. Ela não sabia distinguir
     "digitei o endereço" de "cliquei num link": as duas chegam como `navigate`, e a marca
     respondia a mesma coisa pras duas. Quem responde certo é o `document.referrer`. */
  function comoCheguei() {
    try {
      var n = performance.getEntriesByType('navigation')[0];
      if (n && n.type) return n.type;
      if (performance.navigation) {
        return ['navigate', 'reload', 'back_forward'][performance.navigation.type] || 'navigate';
      }
    } catch (e) { /* navegador velho */ }
    return 'navigate';
  }

  function veioDeDentroDoSite() {
    try {
      if (!document.referrer) return false;          // barra de endereço, favorito, app
      return new URL(document.referrer).origin === location.origin;
    } catch (e) { return false; }
  }

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  var chegada = comoCheguei();
  var recarregou = chegada === 'reload';
  if (recarregou) {
    try { sessionStorage.removeItem('alea_feed_pos'); } catch (e) { /* aba anônima */ }
    window.scrollTo(0, 0);
  }

  /* =======================================================================
     A QUINTA CHEGADA: JÁ CAIR NA SEGUNDA PÁGINA — 8ª rodada, 18/09/2026
     =======================================================================
     "quando eu clico na aba pet, que abre aquela página preta do feed, se eu dou F5
      naquela página, ele faz uma animação ali. Eu não quero que tenha animação nenhuma
      na segunda página. […] Ele faz como se fosse um flash, mostra o fundo da primeira
      página e volta pra aquela segunda, mas o 3D lá em cima faz a animação."

     Eram DOIS defeitos na mesma tela, e cada um tem uma cura:

       1. a ABERTURA rodava. O endereço tinha `#pet`, mas a régua de quem anima só olhava
          o tipo da navegação — e `reload` sempre animava. Agora, quem chega com uma
          categoria VÁLIDA no endereço não vê abertura nenhuma: o destino dele é o feed,
          não a primeira tela. Vale pro F5 e vale pro link de categoria mandado no
          WhatsApp, que é o mesmo caso: a pessoa pediu a segunda página, não a primeira.
       2. o FLASH. O `.feed` abre com `transition: opacity .5s` — meio segundo em que a
          primeira página aparece por baixo antes de o preto cobrir. Numa navegação
          normal esse meio segundo é o efeito; numa chegada direta ele é o flash que ele
          viu. `body.sem-transicao-feed` mata a transição e é retirada assim que o feed
          está pintado (ver `aplicarEndereco`), pra não estragar as trocas seguintes.

     ⚠️ A conta usa `categoriaDoEndereco()`, que confere a categoria contra o catálogo —
     hash inventado (ou o `#abertura` do link de pular) não entra nesta regra. */
  var abreDiretoNoFeed = !!categoriaDoEndereco();

  /* A conta das chegadas, escrita numa linha só (ver os dois blocos acima). */
  var jaViu = abreDiretoNoFeed ||
              chegada === 'back_forward' ||
              (chegada === 'navigate' && veioDeDentroDoSite());
  if (jaViu) corpo.classList.add('sem-abertura');
  if (abreDiretoNoFeed) corpo.classList.add('sem-transicao-feed');

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
  var logo3d = document.querySelector('.marca-3d img');
  var abertura = document.querySelector('.abertura');
  var miolo = document.querySelector('.abertura .miolo');

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

    /* -------------------------------------- 2b) "3x MENOR DO QUE DA CAPIVARA" (item 3)
       A capivara gigante tem `larguraDela * k` de largura na tela. A logo do canal cresce
       até um TERÇO disso, e o quanto ela precisa esticar pra chegar lá é o `--logo3d-k`.
       ⚠️ `offsetWidth`, e não `getBoundingClientRect().width`: a caixa medida já vem com o
       `scale` aplicado, então remedir no meio da animação (girar o telefone) multiplicaria
       a escala por ela mesma. `offsetWidth` é a largura de layout e ignora transformação. */
    if (logo3d && logo3d.offsetWidth) {
      var k3 = (larguraDela * k / 3) / logo3d.offsetWidth;
      if (!(k3 > 1)) k3 = 1;
      raiz.setProperty('--logo3d-k', k3.toFixed(3));
    }
  }

  /* =======================================================================
     2c) A CLAREIRA NA ESTAMPA (4ª rodada, item 8)
     =======================================================================
     "a estampa não aparecer aonde estiver a logo, tanto do nome, quanto da capivara,
     quanto do menu." O buraco é recortado na estampa por `mask` (ver o CSS); aqui só se
     mede ONDE ele fica, porque o miolo muda de tamanho com a janela e com a fonte.

     ⚠️ MEDIR DEPOIS DA FONTE, NÃO DEPOIS DO `load`. O menu de categorias nasce por JS e a
     fonte dos títulos pode não ter chegado ainda — foi assim que uma medida de referência
     saiu 23 px errada em 17/09/2026. Por isso a medida se repete: no load, quando a fonte
     responde, quando o menu acende e a cada resize. Medir de novo não custa nada. */
  function medirClareira() {
    if (!abertura || !miolo) return;
    var a = abertura.getBoundingClientRect();
    var m = miolo.getBoundingClientRect();
    if (!m.width || !m.height) return;
    var raiz = document.documentElement.style;
    raiz.setProperty('--clareira-x', (m.left + m.width / 2 - a.left).toFixed(1) + 'px');
    raiz.setProperty('--clareira-y', (m.top + m.height / 2 - a.top).toFixed(1) + 'px');
    /* o raio é o dobro da metade que se quer limpa: a máscara só começa a devolver a
       estampa na metade do raio (parada de 50% no CSS) e só a devolve inteira na borda. */
    raiz.setProperty('--clareira-rx', (m.width * 1.18).toFixed(1) + 'px');
    raiz.setProperty('--clareira-ry', (m.height * 1.30).toFixed(1) + 'px');
    corpo.classList.add('tem-clareira');
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

  function fraseInteira() {
    return fraseGuardada || (window.ALEA && window.ALEA.assinatura) ||
           (alvoFrase ? alvoFrase.textContent.trim() : '');
  }

  /* a frase pronta de uma vez: é o que o "pular" precisa, e é o mesmo caminho do
     `prefers-reduced-motion`. Sem o `<span>` do cursor, que só faz sentido escrevendo. */
  function escreverDeUmaVez() {
    if (!alvoFrase) return;
    var frase = fraseInteira();
    alvoFrase.setAttribute('aria-label', frase);
    alvoFrase.textContent = frase;
    alvoFrase.classList.add('pronta');
  }

  function datilografar() {
    var alvo = alvoFrase;
    if (!alvo) return;
    var frase = fraseInteira();
    alvo.setAttribute('aria-label', frase);
    corpo.classList.add('frase-revelada');

    if (querMenosMovimento) { escreverDeUmaVez(); return; }

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
      if (pulou) return;            /* clicou no meio da frase: quem termina é o pular */
      letras.textContent = frase.slice(0, ++i);
      if (i < frase.length) {
        /* ritmo irregular de propósito: passo fixo soa a máquina, e o que ele pediu
           foi "como se estivesse digitando". A vírgula e o ponto seguram um pouco. */
        var c = frase.charAt(i - 1);
        var pausa = (c === ',' || c === '!' || c === '.') ? 260 : (38 + Math.random() * 46);
        setTimeout(escrever, pausa);
      } else {
        alvo.classList.add('pronta');
        /* ⚠️ O MENU SÓ APARECE AQUI, depois da última letra da frase — pedido literal da
           3ª rodada. Antes ele acendia junto com a capivara, e a tela ficava pronta
           enquanto a frase ainda estava sendo escrita. */
        corpo.classList.add('site-revelado');
        medirClareira();          /* o menu acabou de entrar na conta do miolo */
      }
    })();
  }

  /* =======================================================================
     3b) PULAR A ABERTURA COM UM CLIQUE — 8ª rodada, 18/09/2026
     =======================================================================
     "pensando em pessoas ansiosas […] uma pessoa que já vai ter a habitualidade de entrar
      no meu site, ela não aguenta esperar […] então eu quero que tenha a opção de, quando
      a animação começar, se eu clicar em qualquer lugar do site, ela já para a animação e
      vai tudo pra página inicial normal, como se não tivesse animação. Toda vez com um F5
      faz a animação, mas se a pessoa quiser acabar com a animação é só clicar."

     O estado de chegada JÁ EXISTE e tem nome: é o `body.sem-abertura`, o mesmo que quem
     volta de uma página de produto recebe. Pular não é uma animação nova nem um
     "adiantar o relógio" — é entrar nesse estado agora. Por isso aqui não se mexe em
     tempo nenhum: tira-se `marca-anima` e põe-se `sem-abertura`, que zera transform e
     animação com `!important` no CSS.

     ⚠️ NÃO se cancela o evento (`preventDefault`): quem clicar no logo do canal ou no
     carrinho, lá em cima, continua indo pro link. O clique pula a abertura E faz o que
     ia fazer — é o que "clicar em qualquer lugar" quer dizer.

     ⚠️ O menu e a frase ficam com `pointer-events: none` enquanto a animação roda (CSS).
     Eles estão com `opacity: 0`, e camada invisível continua interceptando clique — foi
     o "fantasma clicável" medido em 15/09/2026. Sem isso, o clique que ele pediu pra
     pular podia cair numa categoria que ninguém está vendo. */
  var pulou = false;
  var esperaDaFrase = null;

  function pularAbertura() {
    if (pulou || !corpo.classList.contains('marca-anima')) return;
    pulou = true;
    if (esperaDaFrase) { clearTimeout(esperaDaFrase); esperaDaFrase = null; }
    corpo.classList.remove('marca-anima');
    corpo.classList.add('sem-abertura', 'marca-medida', 'site-revelado', 'frase-revelada');
    escreverDeUmaVez();
    medirClareira();
  }

  ['pointerdown', 'touchstart', 'keydown'].forEach(function (evento) {
    document.addEventListener(evento, pularAbertura, { capture: true, passive: true });
  });

  /* ------------------------------------------------ 4) a ordem das coisas */
  function abrirSemAnimacao() {
    corpo.classList.add('marca-medida', 'site-revelado');
    medirClareira();
    datilografar();
  }

  function abrirComAnimacao() {
    pulou = false;
    corpo.classList.remove('sem-abertura');
    guardarEEsvaziarFrase();
    medirCapivara();
    medirClareira();
    corpo.classList.add('marca-medida');
    /* dois quadros de espera: o primeiro aplica o estado de partida (capivara gigante),
       o segundo liga a animação. Ligar os dois no mesmo quadro é o jeito clássico de o
       navegador juntar as duas mudanças e não animar nada. */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        corpo.classList.add('marca-anima');
      });
    });
    /* a frase só começa DEPOIS da última letra do logo, e o menu só depois da frase
       (quem acende o menu é o fim do datilógrafo, lá em cima). Guardado porque o
       "pular" precisa cancelar esta espera — senão a frase recomeçaria sozinha. */
    esperaDaFrase = setTimeout(datilografar, FIM_DAS_LETRAS + 200);
  }

  /* =======================================================================
     4b) TOCAR A ABERTURA DE NOVO — 8ª rodada, 18/09/2026
     =======================================================================
     "se a pessoa clicar 'voltar para a página inicial', vai ter a animação, tudo de novo,
      normal. Mas se ela quiser parar a animação, ela clica em qualquer lugar do site."

     Quem chama é o botão do fim do feed (ver o clique em `[data-voltar-inicio]` lá
     embaixo). Remover `marca-anima` e repô-la num quadro seguinte é o que faz o CSS
     recomeçar as animações do zero — a mesma dobradinha de dois quadros da primeira vez. */
  function tocarAbertura() {
    corpo.classList.remove('marca-anima', 'site-revelado', 'frase-revelada');
    window.scrollTo(0, 0);
    abrirComAnimacao();
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
    medirClareira();          /* o buraco na estampa acompanha o miolo em qualquer tamanho */
  });

  /* a fonte dos títulos muda a altura da frase e do menu — quando ela chega, remede.
     Pedida pelo NOME: `document.fonts.ready` resolve antes de a fonte sequer ser pedida. */
  try {
    if (document.fonts && document.fonts.load) {
      document.fonts.load('500 16px Outfit').then(medirClareira, function () {});
    }
  } catch (e) { /* navegador sem a API de fontes: as outras medidas dão conta */ }

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
      /* o preto já está pintado: devolve a transição pras próximas trocas de categoria,
         que continuam com o meio segundo de sempre (ver `sem-transicao-feed` lá em cima). */
      if (corpo.classList.contains('sem-transicao-feed')) {
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { corpo.classList.remove('sem-transicao-feed'); });
        });
      }
    } else {
      window.aleaFeed.fechar();
    }
  }

  window.addEventListener('hashchange', aplicarEndereco);

  document.addEventListener('click', function (e) {
    var botao = e.target.closest('[data-fechar-feed]');
    if (!botao) return;
    e.preventDefault();
    /* tira o `#categoria` do endereço sem empilhar mais uma entrada no histórico */
    history.replaceState(null, '', location.pathname + location.search);
    window.aleaFeed.fechar();

    /* ⚠️ DOIS BOTÕES, DUAS COISAS DIFERENTES — e é de propósito (8ª rodada, 18/09/2026).
       O do CABEÇALHO ("← categorias") é a saída rápida: fecha o feed e pronto. O do FIM
       da segunda página passou a se chamar "voltar para a página inicial" e é o que ele
       pediu que TOQUE A ABERTURA de novo: "vai ter a animação, tudo de novo, normal".
       Quem marca a diferença é o `data-voltar-inicio`, no HTML do cartão de fim.
       PARECER: ele não falou do botão do cabeçalho. Deixar os dois animando devolveria
       o pedágio que ele mandou tirar em 14/09 ("seis segundos na quinta vez"), e agora
       qualquer clique pula a animação — então o do fim é barato. Se ele quiser os dois
       iguais, é trocar o atributo. */
    if (botao.hasAttribute('data-voltar-inicio')) tocarAbertura();
  });

  /* o feed.js avisa quando terminou de se preparar; só então o endereço é aplicado */
  if (window.aleaFeed) {
    aplicarEndereco();
  } else {
    document.addEventListener('alea:feed-pronto', aplicarEndereco);
  }
})();
