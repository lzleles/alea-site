/* =============================================================================
   carrinho.js — o carrinho e a conta, os dois botões que ele pediu no canto
   =============================================================================
   Pedido do Cassiano, 15/09/2026: "no canto superior direito, onde está escrito pedir,
   retirar esse botão e colocar 2 botões de Conta e Carrinho".

   ⚠️ PARECER ANTES DE CONSTRUIR — LEIA ANTES DE MEXER
   ---------------------------------------------------
   Um carrinho de verdade termina em PAGAMENTO, e pagamento precisa de servidor: o
   valor da cobrança tem que nascer fora do navegador, senão o cliente troca R$ 179 por
   R$ 1,79 antes de pagar. Este site é estático (GitHub Pages) e não tem esse servidor
   — ainda. O caminho inteiro, com custo e três rotas, está em
   `PARECER_PAGAMENTO_E_FRETE_2026-09-14.md`.

   Então o que existe aqui é o carrinho COMPLETO até a borda do pagamento:

     · o visitante escolhe a peça, escreve o nome do pet, a cor e aceita as condições;
     · o item fica guardado NO APARELHO DELE (localStorage), e sobrevive a fechar a aba;
     · "fechar pedido" monta o pedido inteiro — peça, personalização, valor, aceite com
       data e hora — e manda pro WhatsApp da ālea, que é como o Cassiano fecha hoje.

   Quando o checkout subir, o que muda é SÓ o botão "fechar pedido": em vez de abrir o
   WhatsApp, ele manda o mesmo objeto pro servidor. O carrinho, a personalização e o
   aceite já estão no formato certo pra isso. Nada aqui vira lixo.

   ⚠️ O QUE FICA NO APARELHO NUNCA SAI DELE SOZINHO. Nenhum dado daqui é enviado pra
   lugar nenhum sem o visitante clicar. Está escrito na política de privacidade, e é
   por isso que o site continua sem precisar de banner de cookie.
   ========================================================================== */

(function () {
  'use strict';

  var CHAVE_CARRINHO = 'alea_carrinho_v1';
  var CHAVE_PEDIDOS = 'alea_pedidos_v1';
  var CHAVE_CLIENTE = 'alea_cliente_v1';

  /* Todo acesso a localStorage é protegido: em aba anônima, com cookies de site
     bloqueados, ou dentro de uma prévia, o acessador ESTOURA em vez de devolver vazio.
     Um carrinho que derruba a página inteira é pior do que um carrinho que esquece. */
  function ler(chave, padrao) {
    try {
      var cru = localStorage.getItem(chave);
      return cru ? JSON.parse(cru) : padrao;
    } catch (e) { return padrao; }
  }
  function gravar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); return true; }
    catch (e) { return false; }
  }

  var itens = ler(CHAVE_CARRINHO, []) || [];

  function salvar() {
    gravar(CHAVE_CARRINHO, itens);
    document.dispatchEvent(new CustomEvent('alea:carrinho'));
  }

  function total() {
    return itens.reduce(function (s, i) { return s + (i.preco || 0); }, 0);
  }
  function temSobConsulta() {
    return itens.some(function (i) { return !i.preco; });
  }

  window.aleaCarrinho = {
    /* o "Comprar agora" da página de produto chama isto de fora: ele põe no carrinho e
       já quer fechar. Devolve `false` quando não deu (sem WhatsApp, carrinho vazio) —
       e aí quem chamou abre a gaveta, que explica o que falta. */
    fecharPedido: function () { return fecharPedido(); },
    itens: function () { return itens.slice(); },
    quantos: function () { return itens.length; },
    total: total,
    adicionar: function (item) {
      item.quando = new Date().toISOString();
      itens.push(item);
      salvar();
    },
    remover: function (i) { itens.splice(i, 1); salvar(); },
    limpar: function () { itens = []; salvar(); }
  };

  /* ------------------------------------------------------------- o contador */
  function pintarContador() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-abrir="carrinho"]'), function (b) {
      var n = itens.length;
      b.classList.toggle('tem-item', n > 0);
      var bolinha = b.querySelector('[data-quantos]');
      if (bolinha) bolinha.textContent = String(n);
      b.setAttribute('aria-label', n ? ('Carrinho com ' + n + (n === 1 ? ' item' : ' itens')) : 'Carrinho vazio');
    });
  }

  /* -------------------------------------------------------- a gaveta do carrinho */
  function descreverItem(i) {
    var p = i.personalizacao || {};
    var partes = [];
    if (p.nome_pet) partes.push('nome: ' + p.nome_pet);
    if (p.cor) partes.push('cores da peça: ' + p.cor);
    if (p.cor_nome) partes.push('cor do nome: ' + p.cor_nome);
    (i.extras || []).forEach(function (x) {
      partes.push(x.rotulo + ' (+' + window.aleaDinheiro(x.preco) + ')');
    });
    if (i.material) partes.push(i.material);
    return partes.join(' · ');
  }

  function pintarGaveta() {
    var g = document.getElementById('gaveta-carrinho');
    if (!g) return;
    var corpo = g.querySelector('[data-corpo]');
    var alvoTotal = g.querySelector('[data-total]');
    var botao = g.querySelector('[data-fechar-pedido]');

    if (!itens.length) {
      corpo.innerHTML = '<p class="vazio">Seu carrinho está vazio.</p>';
      if (alvoTotal) alvoTotal.textContent = '—';
      if (botao) botao.disabled = true;
      return;
    }

    corpo.innerHTML = itens.map(function (i, n) {
      var valor = i.preco ? window.aleaDinheiro(i.preco) : 'Sob consulta';
      return '<div class="linha-carrinho">' +
        /* miniatura: o recorte quando existe, a foto normal quando nao. Nem toda peca
           tem recorte (ver `recorte` no produtos.js), e imagem quebrada no carrinho e'
           a ultima coisa que alguem quer ver antes de fechar um pedido. */
        '<img src="img/produtos/' + i.capa + '_obj_m.webp" alt="" loading="lazy" ' +
        'onerror="this.onerror=null;this.src=&quot;img/produtos/' + i.capa + '_m.jpg&quot;">' +
        '<div><div class="titulo">' + i.nome + '</div>' +
        '<div class="detalhe">' + (descreverItem(i) || 'sem personalização') + '</div>' +
        '<button class="tirar" type="button" data-tirar="' + n + '">tirar</button></div>' +
        '<div>' + valor + '</div></div>';
    }).join('');

    if (alvoTotal) {
      alvoTotal.textContent = window.aleaDinheiro(total()) +
        (temSobConsulta() ? ' + itens sob consulta' : '');
    }
    if (botao) {
      botao.disabled = !window.aleaTemZap;
      botao.textContent = window.aleaTemZap ? 'Fechar pedido pelo WhatsApp' : 'WhatsApp ainda não configurado';
    }
  }

  /* ---------------------------------------------------------- fechar o pedido */
  function textoDoPedido() {
    var linhas = ['Olá! Quero fechar este pedido pelo site da ālea:', ''];
    itens.forEach(function (i, n) {
      linhas.push((n + 1) + ') ' + i.nome + (i.preco ? ' — ' + window.aleaDinheiro(i.preco) : ' — sob consulta'));
      var d = descreverItem(i);
      if (d) linhas.push('   ' + d);
    });
    linhas.push('');
    linhas.push('Total das peças: ' + window.aleaDinheiro(total()) +
      (temSobConsulta() ? ' (fora os itens sob consulta)' : ''));
    linhas.push('Frete: a combinar pelo CEP.');
    linhas.push('');
    linhas.push('Declarei no site que revisei a personalização e que estou ciente das ' +
      'condições de produtos personalizados.');
    var cliente = ler(CHAVE_CLIENTE, null);
    if (cliente && cliente.nome) linhas.push('Meu nome: ' + cliente.nome);
    return linhas.join('\n');
  }

  function fecharPedido() {
    if (!itens.length || !window.aleaTemZap) return false;
    /* O pedido vira histórico ANTES de abrir o WhatsApp: se a conversa não abrir (app
       fora do ar, janela bloqueada), o visitante não perde o que montou. */
    var pedidos = ler(CHAVE_PEDIDOS, []) || [];
    pedidos.unshift({ quando: new Date().toISOString(), itens: itens.slice(), total: total() });
    gravar(CHAVE_PEDIDOS, pedidos.slice(0, 20));

    var url = 'https://wa.me/' + (window.ALEA || {}).whatsapp +
      '?text=' + encodeURIComponent(textoDoPedido());
    window.open(url, '_blank', 'noopener');

    window.aleaCarrinho.limpar();
    if (window.aleaGaveta) window.aleaGaveta.fechar();
    return true;
  }

  /* ------------------------------------------------------------ a gaveta da conta */
  function pintarConta() {
    var g = document.getElementById('gaveta-conta');
    if (!g) return;
    var corpo = g.querySelector('[data-corpo]');
    var cliente = ler(CHAVE_CLIENTE, {}) || {};
    var pedidos = ler(CHAVE_PEDIDOS, []) || [];

    var historico = pedidos.length
      ? '<ul style="list-style:none;padding:0;margin:0;display:grid;gap:10px">' +
        pedidos.map(function (p) {
          var d = new Date(p.quando);
          var quando = ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) +
            '/' + d.getFullYear();
          return '<li style="border-top:1px solid var(--borda);padding-top:8px">' +
            '<strong>' + quando + '</strong> — ' + p.itens.length +
            (p.itens.length === 1 ? ' peça' : ' peças') + ' · ' + window.aleaDinheiro(p.total) +
            '<div class="detalhe" style="font-size:13px;color:var(--tinta-fraca)">' +
            p.itens.map(function (i) { return i.nome; }).join(', ') + '</div></li>';
        }).join('') + '</ul>'
      : '<p class="vazio">Nenhum pedido feito neste aparelho ainda.</p>';

    corpo.innerHTML =
      '<p style="margin-top:0;font-size:14.5px;color:var(--tinta-fraca)">' +
      'Seus dados ficam <strong>neste aparelho</strong> e servem pra não precisar ' +
      'digitar tudo de novo no próximo pedido. Nada é enviado sem você clicar.</p>' +
      '<div class="personalizar">' +
      '<label>Seu nome<input type="text" data-cliente="nome" value="' +
      (cliente.nome || '').replace(/"/g, '&quot;') + '" placeholder="como você quer ser chamado"></label>' +
      '<label>Sua cidade<input type="text" data-cliente="cidade" value="' +
      (cliente.cidade || '').replace(/"/g, '&quot;') + '" placeholder="pra gente já calcular o frete"></label>' +
      '</div>' +
      '<h3 style="font-family:var(--fonte-titulo);font-weight:500;font-size:1.05rem;margin:22px 0 8px">Seus pedidos</h3>' +
      historico +
      '<p style="font-size:12.5px;color:var(--tinta-fraca);margin-top:22px">' +
      'Login com senha e histórico que segue você de aparelho em aparelho entram ' +
      'quando o pagamento pelo site subir. Até lá, o acompanhamento do seu pedido é ' +
      'pelo WhatsApp, com a pessoa que faz a peça.</p>';

    Array.prototype.forEach.call(corpo.querySelectorAll('[data-cliente]'), function (campo) {
      campo.addEventListener('change', function () {
        var atual = ler(CHAVE_CLIENTE, {}) || {};
        atual[campo.getAttribute('data-cliente')] = campo.value.trim();
        gravar(CHAVE_CLIENTE, atual);
      });
    });
  }

  /* ---------------------------------------------------------------- ligações */
  function ligar() {
    pintarContador();
    pintarGaveta();

    document.addEventListener('click', function (e) {
      var tirar = e.target.closest('[data-tirar]');
      if (tirar) { window.aleaCarrinho.remover(parseInt(tirar.getAttribute('data-tirar'), 10)); return; }
      if (e.target.closest('[data-fechar-pedido]')) fecharPedido();
    });

    document.addEventListener('alea:carrinho', function () {
      pintarContador();
      pintarGaveta();
    });
    document.addEventListener('alea:gaveta', function (e) {
      if (e.detail.id === 'conta') pintarConta();
      if (e.detail.id === 'carrinho') pintarGaveta();
    });
  }

  /* o site.js constrói as gavetas no DOMContentLoaded; este arquivo carrega depois
     dele, então este ouvinte roda logo em seguida — nunca antes. */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ligar);
  } else {
    ligar();
  }
})();
