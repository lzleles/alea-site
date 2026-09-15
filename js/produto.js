/* =============================================================================
   produto.js — o que só a página de produto faz
   =============================================================================
   Três coisas, todas pedidas pelo Cassiano em 15/09/2026:

   1. A COLMEIA. "Todas as fotos em miniatura, espalhadas, onde você clica na miniatura
      e ela expande no lugar que ela está, fazendo com que as outras diminuem ao mesmo
      tempo." Quem cresce e encolhe é o CSS; aqui só mora quem está aberto.

   2. A TRAVA DO ACEITE. "Colocar uma caixa para marcação onde só poderá adicionar o
      produto ao carrinho se marcar." O botão nasce desabilitado e só liga com a caixa
      marcada — e volta a desligar se ela for desmarcada.

   3. ADICIONAR AO CARRINHO com a personalização junto (nome do pet, cores, material).

   ⚠️ A TRAVA É DE VERDADE, E NÃO SÓ VISUAL. O botão fica `disabled` de fato, e a
   conferência é refeita no clique. Trava que só pinta o botão de cinza é trava que o
   primeiro visitante com o teclado atravessa — e aqui o que está do outro lado dela é
   uma declaração de consumo que vai junto do pedido.
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------ colmeia */
  var colmeia = document.querySelector('[data-colmeia]');
  if (colmeia) {
    colmeia.addEventListener('click', function (ev) {
      var favo = ev.target.closest('[data-favo]');
      if (!favo) return;
      var jaEstava = favo.classList.contains('aberto');
      Array.prototype.forEach.call(colmeia.querySelectorAll('.favo'), function (f) {
        f.classList.remove('aberto');
        f.setAttribute('aria-expanded', 'false');
      });
      if (jaEstava) {
        colmeia.classList.remove('tem-aberto');       // clicar de novo fecha
        return;
      }
      favo.classList.add('aberto');
      favo.setAttribute('aria-expanded', 'true');
      colmeia.classList.add('tem-aberto');
    });

    /* fechar com Esc é o reflexo de todo mundo; sem isso a foto aberta parece presa */
    document.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Escape' || !colmeia.classList.contains('tem-aberto')) return;
      colmeia.classList.remove('tem-aberto');
      Array.prototype.forEach.call(colmeia.querySelectorAll('.favo'), function (f) {
        f.classList.remove('aberto');
        f.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* --------------------------------------------------------- aceite e carrinho */
  var caixa = document.querySelector('[data-aceite-caixa]');
  var botao = document.querySelector('[data-add-carrinho]');
  var recado = document.querySelector('[data-recado-aceite]');
  var rotulo = document.querySelector('[data-aceite]');
  if (!caixa || !botao) return;

  function conferir() {
    botao.disabled = !caixa.checked;
    if (rotulo) rotulo.classList.toggle('faltou', !caixa.checked);
    if (recado) recado.hidden = caixa.checked;
  }
  caixa.addEventListener('change', conferir);
  conferir();

  botao.addEventListener('click', function () {
    if (!caixa.checked) { conferir(); return; }     // a conferência se repete no clique
    if (!window.aleaCarrinho) return;

    var form = document.querySelector('[data-personalizar]');
    var campo = function (nome) {
      var el = form && form.querySelector('[name="' + nome + '"]');
      return el ? el.value.trim() : '';
    };
    var cru = botao.getAttribute('data-preco');

    window.aleaCarrinho.adicionar({
      slug: botao.getAttribute('data-slug'),
      nome: botao.getAttribute('data-nome'),
      preco: cru === '' ? null : parseFloat(cru),
      capa: botao.getAttribute('data-capa'),
      material: botao.getAttribute('data-material'),
      personalizacao: { nome_pet: campo('nome_pet'), cor: campo('cor') },
      /* o ACEITE vai junto do item, com data e hora. É a prova de que a declaração foi
         marcada ANTES da compra — e é ela que sustenta a regra de não cancelamento que
         está escrita na mesma página. Aceite que não fica registrado não serve de nada. */
      aceite: { marcado: true, quando: new Date().toISOString() }
    });

    if (window.aleaGaveta) window.aleaGaveta.abrir('carrinho');
  });
})();
