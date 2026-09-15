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
  var telacheia = document.querySelector('[data-telacheia]');
  var caixaAceite = document.querySelector('[data-aceite-caixa]');
  var botaoComprar = document.querySelector('[data-comprar-agora]');
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

  /* =================================================================== tela cheia */
  var fotosGrandes = [];
  try { fotosGrandes = JSON.parse(colmeia && colmeia.getAttribute('data-grandes') || '[]'); }
  catch (e) { fotosGrandes = []; }
  var tcAtual = -1;

  function abrirTelaCheia(n) {
    if (!telacheia || !fotosGrandes.length) return;
    tcAtual = n;
    pintarTelaCheia();
    telacheia.classList.add('aberta');
    telacheia.setAttribute('aria-hidden', 'false');
    document.body.classList.add('travado');
  }

  function fecharTelaCheia() {
    if (!telacheia) return;
    telacheia.classList.remove('aberta');
    telacheia.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('travado');
  }

  function pintarTelaCheia() {
    var palco = telacheia.querySelector('[data-palco-tc]');
    var pontos = telacheia.querySelector('[data-pontos-tc]');
    var conta = telacheia.querySelector('[data-conta-tc]');
    palco.innerHTML = '<img src="' + fotosGrandes[tcAtual] + '" alt="Foto ' +
      (tcAtual + 1) + ' de ' + fotosGrandes.length + '">';
    pontos.innerHTML = fotosGrandes.map(function (_, k) {
      return '<i class="' + (k === tcAtual ? 'on' : '') + '"></i>';
    }).join('');
    conta.textContent = (tcAtual + 1) + ' / ' + fotosGrandes.length;
  }

  /* ⚠️ SEM VOLTA: passar do fim (ou do começo) FECHA em vez de dar a volta. É o pedido
     dele, e a razão é boa — carrossel que gira pra sempre não deixa o visitante saber
     que já viu tudo, e ele fica rodando achando que falta foto. */
  function andarTelaCheia(dir) {
    var n = tcAtual + dir;
    if (n < 0 || n >= fotosGrandes.length) { fecharTelaCheia(); return; }
    tcAtual = n;
    pintarTelaCheia();
  }

  if (telacheia) {
    telacheia.addEventListener('click', function (ev) {
      if (ev.target.closest('[data-fechar-tc]')) { fecharTelaCheia(); return; }
      /* clicar em qualquer lugar que não seja a foto fecha — ele pediu essa saída pra
         quem abriu a tela cheia sem querer */
      if (!ev.target.closest('img')) fecharTelaCheia();
    });

    var tx = null;
    telacheia.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    telacheia.addEventListener('touchmove', function (e) {
      if (tx === null) return;
      var dx = tx - e.touches[0].clientX;
      if (Math.abs(dx) < 40) return;
      tx = null;
      andarTelaCheia(dx > 0 ? 1 : -1);
    }, { passive: true });
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

  Array.prototype.forEach.call(document.querySelectorAll('[data-extra]'), function (rot) {
    var caixa = rot.querySelector('[data-extra-caixa]');
    var liberado = document.querySelector('[name="cor_nome"]');
    caixa.addEventListener('change', function () {
      rot.classList.toggle('marcado', caixa.checked);
      if (liberado) {
        liberado.disabled = !caixa.checked;
        if (!caixa.checked) liberado.value = '';
        else liberado.focus();
      }
      repintarPreco();
    });
  });

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
      material: botaoComprar.getAttribute('data-material'),
      personalizacao: { nome_pet: campo('nome_pet'), cor: campo('cor'), cor_nome: campo('cor_nome') },
      extras: extras,
      /* o ACEITE vai junto do item, com data e hora. É a prova de que a declaração foi
         marcada ANTES da compra — e é ela que sustenta a regra de não cancelamento que
         está escrita na mesma página. Aceite que não fica registrado não serve de nada. */
      aceite: { marcado: true, quando: new Date().toISOString() }
    };
  }

  function porNoCarrinho(eDepoisFechar) {
    if (!caixaAceite || !caixaAceite.checked) { reclamarDoAceite(); return; }
    if (!window.aleaCarrinho) return;
    var recado = document.querySelector('[data-recado-aceite]');
    if (recado) recado.hidden = true;
    window.aleaCarrinho.adicionar(montarItem());
    if (eDepoisFechar && window.aleaCarrinho.fecharPedido()) return;   // foi pro WhatsApp
    if (window.aleaGaveta) window.aleaGaveta.abrir('carrinho');
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
