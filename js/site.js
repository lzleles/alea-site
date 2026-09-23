/* CATALOGO:
   nome: site
   categoria: UTIL
   objetivo: Inicializa recursos comuns do site, incluindo compras, contatos, categorias, redes e gavetas de conta e carrinho.
   entrada: Configuração global, catálogos e DOM de cada página
   saida: Links, menus, redes, campos preenchidos e gavetas interativas
   status: ativo (cabecalho proposto pelo Codex em 2026-09-20, confianca ALTA; conferir na proxima vez que o script rodar)
   validado_em: TBD
*/
/* =============================================================================
   site.js — o que vale em TODA página (abertura, feed, produto, textos)
   =============================================================================
   Liga os botões de WhatsApp, preenche os campos vindos do config.js, monta o menu de
   categorias e as redes do rodapé, e abre/fecha as gavetas de CONTA e CARRINHO.

   A TRAVA QUE NÃO SE MEXE
   -----------------------
   Sem número no `config.js`, NADA vira link. Os botões saem desabilitados, com uma
   tarja no topo explicando. Melhor um botão apagado e honesto do que um `wa.me` sem
   número, que abre o WhatsApp em branco e faz o visitante achar que o site quebrou.
   A mesma régua vale pras redes: endereço vazio, ícone não aparece.

   E A ORDEM
   ---------
   Quem desenha conteúdo (o feed, as páginas geradas) avisa quando terminou, e só
   então os botões são ligados. Ligar antes deixa botão sem href — foi o defeito pego
   no site da Negocie em 10/09/2026, e ele só aparece conferindo o href NO AR.
   ========================================================================== */

(function () {
  'use strict';

  var C = window.ALEA || {};
  var temZap = /^\d{12,13}$/.test(String(C.whatsapp || ''));

  /* ------------------------------------------------------------------ dinheiro */
  window.aleaDinheiro = function (v) {
    if (v === null || v === undefined) return null;
    return 'R$ ' + v.toFixed(2).replace('.', ',');
  };

  /* ------------------------------------------------------------------ WhatsApp */
  function linkZap(assunto) {
    var texto = (C.mensagem || 'Oi! Vim pelo site.').replace('{produto}', assunto);
    return 'https://wa.me/' + C.whatsapp + '?text=' + encodeURIComponent(texto);
  }
  window.aleaLinkZap = function (assunto) { return temZap ? linkZap(assunto) : ''; };
  window.aleaTemZap = temZap;

  function marcarConversao() {
    if (!C.conversao_whatsapp || typeof window.gtag !== 'function') return;
    window.gtag('event', 'conversion', { send_to: C.conversao_whatsapp });
  }

  function avisarUmaVez(quantos) {
    if (document.getElementById('tarja-config')) return;
    var t = document.createElement('div');
    t.id = 'tarja-config';
    t.className = 'tarja-config';
    t.innerHTML = '<strong>Site em configuração.</strong> Falta o WhatsApp comercial da ' +
      'ālea em <code>js/config.js</code> — por isso ' +
      (quantos === 1 ? 'o botão de compra está desligado' : 'os ' + quantos + ' botões de compra estão desligados') +
      ' de propósito, em vez de virarem link morto.';
    document.body.insertBefore(t, document.body.firstChild);
    document.documentElement.classList.add('com-tarja');

    /* A ALTURA DELA VIRA UMA VARIAVEL DE CSS. A tarja é fixa no topo; sem isto o
       cabeçalho fica POR BAIXO dela e o logo da ālea some atrás do aviso — foi o que
       apareceu no primeiro teste de 15/09/2026. Medir em vez de chutar um número
       porque no celular o texto quebra em duas ou três linhas. */
    var medir = function () {
      document.documentElement.style.setProperty('--tarja', t.offsetHeight + 'px');
    };
    medir();
    window.addEventListener('resize', medir);
  }

  window.aleaLigarBotoes = function (raiz) {
    var botoes = (raiz || document).querySelectorAll('.zap:not([data-ligado])');
    Array.prototype.forEach.call(botoes, function (b) {
      b.setAttribute('data-ligado', '1');
      var assunto = b.getAttribute('data-assunto') || 'os produtos da ālea';
      if (temZap) {
        b.setAttribute('href', linkZap(assunto));
        b.setAttribute('target', '_blank');
        b.setAttribute('rel', 'noopener');
        b.addEventListener('click', marcarConversao);
        return;
      }
      b.removeAttribute('href');
      b.setAttribute('aria-disabled', 'true');
      b.setAttribute('title', 'WhatsApp ainda não configurado');
    });
    var total = document.querySelectorAll('.zap').length;
    if (!temZap && total) avisarUmaVez(total);
  };

  /* ------------------------------------------------- campos vindos do config.js */
  function preencherContato() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-campo]'), function (el) {
      var v = C[el.getAttribute('data-campo')];
      if (v) el.textContent = v;
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-assinatura], [data-datilografar]'), function (el) {
      if (C.assinatura) el.textContent = C.assinatura;
    });
    var ano = document.getElementById('ano');
    if (ano) ano.textContent = new Date().getFullYear();
  }

  /* ------------------------------------------------------ menu de categorias
     O mesmo menu aparece na abertura e no rodapé, e em toda página interna. Ele é
     montado a partir do produtos.js: categoria nova no catálogo entra no menu sozinha.

     Categoria SEM PEÇA não vira link. Ela aparece apagada, com "em breve" — porque
     link que abre uma tela vazia é pior do que não ter link, e o Google trata isso
     como experiência ruim na página de destino. */
  function montarMenuCategorias() {
    var caixas = document.querySelectorAll('[data-menu-categorias]');
    if (!caixas.length) return;
    var cats = window.CATEGORIAS || [];
    var feed = window.VITRINE || [];
    var naHome = !!document.getElementById('feed');

    Array.prototype.forEach.call(caixas, function (caixa) {
      caixa.innerHTML = '';
      var n = 0;
      cats.forEach(function (cat) {
        var quantos = feed.filter(function (i) { return i.categoria === cat.id; }).length;
        if (!quantos && C.esconder_categorias_vazias) return;
        var el;
        if (quantos) {
          el = document.createElement('a');
          el.href = (naHome ? '' : 'index.html') + '#' + cat.id;
          el.setAttribute('data-categoria', cat.id);
          el.textContent = cat.nome;
          if (cat.descricao) el.title = cat.descricao;
        } else {
          el = document.createElement('span');
          el.className = 'vazia';
          el.innerHTML = cat.nome + '<small>em breve</small>';
        }
        caixa.appendChild(el);
        n++;
        /* ⚠️ ETAPA 11 (22/09/2026): o Cassiano quer o menu SEMPRE 3 na primeira fileira e 4 na
           segunda (como na página inicial). A quebra natural do flex dependia da largura das
           letras — com a fonte nova (Defante) ela virou 3+3+1 / 4+2+1. Uma quebra explícita depois
           do 3º item (um elemento que ocupa a linha toda) garante o 3+4 em QUALQUER fonte. */
        if (n === 3) {
          var quebra = document.createElement('span');
          quebra.className = 'quebra-linha';
          quebra.setAttribute('aria-hidden', 'true');
          caixa.appendChild(quebra);
        }
      });
    });
  }

  /* ⚠️ EXPORTADO PRA QUEM NASCE DEPOIS (5ª rodada, 17/09/2026): o cartão de fim do feed
     também mostra todas as categorias, e ele é desenhado pelo feed.js muito depois desta
     montagem. Em vez de o feed.js repetir a regra do "em breve" (categoria sem peça não
     vira link), ele chama esta função no bloco novo. Uma regra, um lugar. */
  window.aleaMenuCategorias = montarMenuCategorias;

  /* ------------------------------------------------------------------- redes
     Ícone só existe se o endereço existir. Ver `redes` no config.js. */
  var ICONES = {
    linktree: '<path d="M7.2 2h9.6v4.6l3.3-3.3 2.4 2.4-3.6 3.5H24v3.4h-5.1l3.6 3.5-2.4 2.4-5.9-5.9H13v6.1h-2v-6.1H9.4l-5.9 5.9-2.4-2.4L4.7 12.6H0V9.2h5.1L1.5 5.7l2.4-2.4 3.3 3.3z" transform="scale(.85) translate(2 2)"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r="1.2" fill="currentColor" stroke="none"/>',
    youtube: '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="M10.5 9.2l5 2.8-5 2.8z" fill="currentColor" stroke="none"/>',
    twitch: '<path d="M4 3h16v11l-4 4h-3l-3 3H8v-3H4z"/><path d="M11 8v4M15 8v4"/>'
  };
  /* o segundo Instagram (o do canal "eaí, bora?") usa o mesmo desenho; quem diferencia os
     dois é o nome, que aparece no toque longo e é o que o leitor de tela fala */
  ICONES.instagram_canal = ICONES.instagram;
  var NOMES = { linktree: 'Linktree', instagram: 'Instagram @alea.co_',
                instagram_canal: 'Instagram @eaibora.3d', youtube: 'YouTube', twitch: 'Twitch' };

  /* ⚠️ O LINKTREE É UM SÍMBOLO CHEIO, não um contorno (4ª rodada, item 5).
     Todos os outros ícones daqui são desenhos de linha (`fill:none` + `stroke`), e a marca do
     Linktree desenhada assim vira um risco fino em volta da estrela — some num ícone de 20 px.
     Ele é o único que vai pintado por dentro. */
  var CHEIOS = { linktree: true };

  function montarRedes() {
    var caixas = document.querySelectorAll('[data-redes]');
    if (!caixas.length) return;
    var redes = C.redes || {};
    Array.prototype.forEach.call(caixas, function (caixa) {
      caixa.innerHTML = '';
      /* a ordem é a que ele pediu na 4ª rodada: o Linktree "do lado do logo do Instagram" */
      ['instagram', 'instagram_canal', 'linktree', 'youtube', 'twitch'].forEach(function (id) {
        var url = redes[id];
        if (!url) return;                     // vazio = não aparece, nunca link morto
        var a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.setAttribute('aria-label', NOMES[id]);
        a.title = NOMES[id];
        a.innerHTML = '<svg viewBox="0 0 24 24" ' +
          (CHEIOS[id] ? 'fill="currentColor" stroke="none" ' : 'fill="none" stroke="currentColor" ') +
          'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" ' +
          'aria-hidden="true">' + ICONES[id] + '</svg>';
        caixa.appendChild(a);
      });
    });
  }

  /* =======================================================================
     AS GAVETAS — conta e carrinho
     =======================================================================
     Construídas aqui, uma vez, e não copiadas na mão em cada página: gaveta repetida
     em seis arquivos é gaveta que diverge.

     ⚠️ SOBRE A "CONTA" (parecer de 15/09/2026, registrado no código porque é onde ele
     não some): conta de verdade — com login, senha e histórico de pedidos — exige
     SERVIDOR, e este site é estático no GitHub Pages. Página estática não guarda
     segredo nem sessão. Então a gaveta da Conta entrega o que dá pra entregar com
     honestidade: os pedidos feitos NESTE APARELHO e os dados de contato salvos aqui,
     que voltam preenchidos no próximo pedido. Nada de tela de login que não loga em
     lugar nenhum. Quando o checkout da Rota A subir (ver PARECER_PAGAMENTO_E_FRETE),
     é esta mesma gaveta que ganha o login — o botão e o lugar já existem. */
  function montarGavetas() {
    if (document.getElementById('cortina-alea')) return;

    var cortina = document.createElement('div');
    cortina.className = 'cortina';
    cortina.id = 'cortina-alea';
    document.body.appendChild(cortina);

    var molde = function (id, titulo, corpo, rodape) {
      var g = document.createElement('aside');
      g.className = 'gaveta';
      g.id = 'gaveta-' + id;
      g.setAttribute('role', 'dialog');
      g.setAttribute('aria-modal', 'true');
      g.setAttribute('aria-label', titulo);
      g.setAttribute('aria-hidden', 'true');
      g.innerHTML =
        '<header><h2>' + titulo + '</h2>' +
        '<button type="button" aria-label="Fechar" data-fechar-gaveta>&times;</button></header>' +
        '<div class="corpo" data-corpo>' + corpo + '</div>' +
        (rodape ? '<div class="rodape-gaveta" data-rodape-gaveta>' + rodape + '</div>' : '');
      /* ⚠️ ETAPA 57 (23/09/2026, vídeos do Cassiano 15:52-15:55): a página arrastava pros LADOS e o cabeçalho
         ia junto — também no site do ar, então a trava da etapa 46 (overflow-x) não segurava no Safari dele. Causa
         medida no WebKit (390 px): as gavetas FECHADAS moram fora da tela (x 390 a 780), e o Safari deixa arrastar
         até elas. Agora elas moram DENTRO de uma moldura fixa do tamanho exato da tela, que corta o que passa da
         borda: não sobra nada pra arrastar, e a animação de abrir continua a mesma. */
      var moldura = document.getElementById('moldura-gavetas');
      if (!moldura) {
        moldura = document.createElement('div');
        moldura.id = 'moldura-gavetas';
        moldura.className = 'moldura-gavetas';
        /* reserva pra Safari antigo sem `overflow: clip`: se a moldura rolar, volta pro zero */
        moldura.addEventListener('scroll', function () { moldura.scrollLeft = 0; moldura.scrollTop = 0; });
        document.body.appendChild(moldura);
      }
      moldura.appendChild(g);
      return g;
    };

    /* ETAPA 33 (22/09/2026, 21:42, com print de referência): o LAYOUT do carrinho segue o modelo
       que ele mandou — "mantenha minha fonte, cor, tudo, só quero o layout, design e posições" —
       e fica no rodapé: Subtotal centralizado, o botão largo, e "Continue comprando" sublinhado
       embaixo (fecha a gaveta). O aviso do frete continua, pequeno, por último. */
    molde('carrinho', 'Sua Sacola de Compras',          // 21:44: o título do modelo, pedido dele
      '<p class="vazio">Sua sacola está vazia.</p>',
      '<div class="total-carrinho"><span>Subtotal:</span> <strong data-total>—</strong></div>' +
      '<button class="botao" type="button" data-fechar-pedido disabled>Fechar pedido</button>' +
      /* ETAPA 42 (22:30): o × do topo FECHA e deixa a pessoa exatamente onde estava; o "Continue
         comprando" leva pra PÁGINA INICIAL. Por isso ele virou link de verdade, não mais fechar. */
      '<a class="continuar-comprando" href="index.html">Continue comprando</a>');
    /* ETAPA 41 (22:29): saiu da sacola, a pedido dele, o aviso "O frete é calculado no fechamento,
       pelo CEP. Peça personalizada só entra em produção depois da confirmação do pagamento." — o
       frete segue sendo dito na mensagem do WhatsApp ("Frete: a combinar pelo CEP") e a regra da
       produção está na página de Trocas e no texto de Produtos Personalizados. */

    /* ⚠️ ETAPA 40 (22:23, vídeo + 2 prints do modelo): "na página da sacola é pra deixar só a
       sacola" — a PRIMEIRA tela tem que caber inteira no telefone (título, produtos, Subtotal e o
       botão lá embaixo), e só ROLANDO aparece o "Continue comprando". E o site de baixo não pode
       rolar junto ("parece que está rodando a segunda tela"). Então a sacola vira UMA página que rola
       sozinha: a `.tela-sacola` ocupa exatamente a altura visível (100dvh) e o `.rodape-extra` mora
       depois dela, fora da primeira tela. Monta aqui, movendo os pedaços do molde. */
    (function () {
      var g = document.getElementById('gaveta-carrinho');
      if (!g) return;
      var rod = g.querySelector('[data-rodape-gaveta]');
      var tela = document.createElement('div');
      tela.className = 'tela-sacola';
      var principal = document.createElement('div');
      principal.className = 'rodape-principal';
      var extra = document.createElement('div');
      extra.className = 'rodape-extra';
      Array.prototype.slice.call(rod.children).forEach(function (el) {
        (el.matches('.total-carrinho, [data-fechar-pedido]') ? principal : extra).appendChild(el);
      });
      tela.appendChild(g.querySelector('header'));
      tela.appendChild(g.querySelector('[data-corpo]'));
      tela.appendChild(principal);
      g.insertBefore(tela, rod);
      g.insertBefore(extra, rod);
      g.removeChild(rod);
    })();

    molde('conta', 'Sua conta ālea',
      '<p class="vazio">Carregando…</p>', '');

    function fechar() {
      Array.prototype.forEach.call(document.querySelectorAll('.gaveta'), function (g) {
        g.classList.remove('aberta');
        g.setAttribute('aria-hidden', 'true');
      });
      cortina.classList.remove('aberta');
      document.body.classList.remove('travado');
    }
    function abrir(id) {
      var g = document.getElementById('gaveta-' + id);
      if (!g) return;
      fechar();
      g.classList.add('aberta');
      g.setAttribute('aria-hidden', 'false');
      cortina.classList.add('aberta');
      document.body.classList.add('travado');
      document.dispatchEvent(new CustomEvent('alea:gaveta', { detail: { id: id } }));
      var alvo = g.querySelector('button, a, input');
      if (alvo) alvo.focus();
    }
    window.aleaGaveta = { abrir: abrir, fechar: fechar };

    cortina.addEventListener('click', fechar);
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-abrir]');
      if (b) { e.preventDefault(); abrir(b.getAttribute('data-abrir')); return; }
      if (e.target.closest('[data-fechar-gaveta]')) fechar();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') fechar();
    });
  }

  /* ------------------------------------------- "voltar para o feed" (ETAPA 17)
     Parte 3, item 2 (22/09/2026): o botão levava pra `index.html` — a PRIMEIRA página. Tem que
     voltar pra categoria e pra tela exata de onde a pessoa saiu. O feed.js guardou essa tela em
     `alea_feed_exato` quando ela saiu; aqui o botão aponta pra `index.html#<categoria>` (que abre
     direto no feed, sem abertura) e deixa a marca `alea_voltar_exato` pedindo a restauração.
     Sem tela guardada (chegou no produto por link de fora), segue pra primeira página. */
  function ligarVoltarProFeed() {
    Array.prototype.forEach.call(document.querySelectorAll('a.voltar'), function (a) {
      var e = null;
      try { e = JSON.parse(sessionStorage.getItem('alea_feed_exato') || 'null'); } catch (err) { /* nada */ }
      if (!e || !e.cat) return;
      a.setAttribute('href', 'index.html#' + e.cat);
      a.addEventListener('click', function () {
        try { sessionStorage.setItem('alea_voltar_exato', e.cat); } catch (err) { /* aba anônima */ }
      });
    });
  }

  /* --------------------------------------------------- a conta no servidor (22/09/2026)
     Os arquivos da conta e da memória da visita só carregam quando `api_conta` está
     preenchido no config.js. Carregar DAQUI, e não com <script> em cada página, é de
     propósito: as páginas de produto são GERADAS, e uma tag escrita à mão nelas some na
     próxima geração. Assim nenhum HTML muda, e desligar é apagar uma linha. */
  function carregarConta() {
    if (!C.api_conta) return;
    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'css/conta.css';
    document.head.appendChild(css);
    ['js/rastro.js', 'js/conta.js'].forEach(function (src) {
      var s = document.createElement('script');
      s.src = src;
      s.async = false;              // rastro antes da conta: a conta usa o aparelho do rastro
      document.body.appendChild(s);
    });
  }

  /* -------------------------------------------------------------------- início */
  function iniciar() {
    ligarVoltarProFeed();
    preencherContato();
    montarMenuCategorias();
    montarRedes();
    montarGavetas();
    window.aleaLigarBotoes();     // as páginas de produto já nascem prontas no HTML
    carregarConta();
    document.dispatchEvent(new CustomEvent('alea:site-pronto'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
