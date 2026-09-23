/* CATALOGO:
   nome: carrinho
   categoria: UTIL
   objetivo: Mantém carrinho, dados locais e histórico de pedidos e prepara o fechamento da compra pelo WhatsApp.
   entrada: DOM, configuração global e dados do localStorage
   saida: Gavetas, contador, histórico local e mensagem de pedido no WhatsApp
   status: ativo (cabecalho proposto pelo Codex em 2026-09-20, confianca ALTA; conferir na proxima vez que o script rodar)
   validado_em: TBD
*/
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

  /* ETAPA 33: cada linha ganhou QUANTIDADE (o "− 1 +" do modelo dele). Item antigo, gravado
     antes disto no aparelho de alguém, não tem o campo: vale 1. */
  function qtd(i) { return Math.max(1, parseInt(i.qtd, 10) || 1); }
  function total() {
    return itens.reduce(function (s, i) { return s + (i.preco || 0) * qtd(i); }, 0);
  }
  function pecas() { return itens.reduce(function (s, i) { return s + qtd(i); }, 0); }
  function temSobConsulta() {
    return itens.some(function (i) { return !i.preco; });
  }

  window.aleaCarrinho = {
    /* o "Comprar agora" da página de produto chama isto de fora: ele põe no carrinho e
       já quer fechar. Devolve `false` quando não deu (sem WhatsApp, carrinho vazio) —
       e aí quem chamou abre a gaveta, que explica o que falta. */
    fecharPedido: function () { return fecharPedido(); },
    itens: function () { return itens.slice(); },
    quantos: function () { return pecas(); },
    total: total,
    adicionar: function (item) {
      item.quando = new Date().toISOString();
      itens.push(item);
      salvar();
    },
    remover: function (i) { itens.splice(i, 1); salvar(); },
    /* ETAPA 45: o "editar" troca a linha no MESMO lugar, com a mesma quantidade e o mesmo id */
    substituir: function (id, novo) {
      for (var k = 0; k < itens.length; k++) {
        if (itens[k].quando === id) {
          novo.quando = id; novo.qtd = qtd(itens[k]); itens[k] = novo; salvar(); return true;
        }
      }
      return false;
    },
    /* ⚠️ ETAPA 36 (22:06, "pensando melhor"): o − NUNCA tira da sacola — com 1 unidade ele não
       faz nada. "A pessoa pode clicar sem querer e tirar o produto que demorou pra personalizar."
       Quem tira é SÓ o × no canto da linha, como no modelo dele. (Era: − com 1 removia.) */
    mudarQuantidade: function (i, passo) {
      if (!itens[i]) return;
      var n = qtd(itens[i]) + passo;
      if (n < 1) return;
      itens[i].qtd = n;
      soALinha = i;          // ETAPA 39: repinta SÓ esta linha (ver `atualizarLinha`)
      salvar();
      soALinha = null;
    },
    limpar: function () { itens = []; salvar(); }
  };

  /* ------------------------------------------------------------- o contador */
  function pintarContador() {
    /* ETAPA 38 (22:10): a sacola ao lado do "Comprar agora" também fica cor de kraft quando há item
       — SEM número (o número só lá em cima). Uma classe no <html> serve as duas sacolas. */
    document.documentElement.classList.toggle('sacola-cheia', pecas() > 0);
    Array.prototype.forEach.call(document.querySelectorAll('[data-abrir="carrinho"]'), function (b) {
      var n = pecas();
      b.classList.toggle('tem-item', n > 0);
      var bolinha = b.querySelector('[data-quantos]');
      if (bolinha) bolinha.textContent = String(n);
      b.setAttribute('aria-label', n ? ('Carrinho com ' + n + (n === 1 ? ' item' : ' itens')) : 'Carrinho vazio');
    });
  }

  /* -------------------------------------------------------- a gaveta do carrinho */
  function descreverItem(i, comMaterial) {
    var p = i.personalizacao || {};
    var partes = [];
    if (p.nome_pet) partes.push('Nome: ' + p.nome_pet);    // ETAPA 44 (22:38): N maiúsculo
    if (p.cor) partes.push('cores da peça: ' + p.cor);      // formato antigo, ainda no aparelho de quem já comprou
    /* as cores viraram escolha (Tricolor, Bicolor, Monocromático, Degradê) em
       15/09/2026. O Degradê não traz cor nenhuma: traz a combinação a fazer depois. */
    if (p.cores && p.cores.modo) {
      partes.push(p.cores.a_combinar
        ? (p.cores.modo + ' (cores a combinar depois do pagamento)')
        : (p.cores.modo + (p.cores.cores && p.cores.cores.length
            ? ': ' + p.cores.cores.join(', ') : '')));
    }
    if (p.cor_nome) partes.push('cor do nome: ' + p.cor_nome);
    (i.extras || []).forEach(function (x) {
      partes.push(x.rotulo + ' (+' + window.aleaDinheiro(x.preco) + ')');
    });
    /* ETAPA 44: o material (PLA) SAI da sacola — "não faz sentido estar ali". Continua indo na
       mensagem do WhatsApp (é informação de produção pra quem faz a peça). */
    if (i.material && comMaterial) partes.push(i.material);
    return partes.join(' · ');
  }

  /* ⚠️ ETAPA 39 (22:16, com vídeo): "quando eu aumento um produto, treme os DOIS produtos". Causa:
     cada + ou − redesenhava a sacola INTEIRA (innerHTML), e as fotos de todas as linhas recarregavam
     — o pisca que ele viu como tremor. Agora a quantidade atualiza só o número, o preço da linha e
     o subtotal, no lugar; e a linha mexida ganha um brilho suave (`.mexeu`) pra mostrar que é ela. */
  var soALinha = null;
  function atualizarLinha(n) {
    var g = document.getElementById('gaveta-carrinho');
    var linha = g && g.querySelectorAll('.linha-carrinho')[n];
    var i = itens[n];
    if (!linha || !i) { pintarGaveta(); return; }
    linha.querySelector('.passos .n').textContent = qtd(i);
    linha.querySelector('.valor-linha').textContent = i.preco ? window.aleaDinheiro(i.preco * qtd(i)) : 'Sob consulta';
    var alvoTotal = g.querySelector('[data-total]');
    if (alvoTotal) {
      alvoTotal.textContent = window.aleaDinheiro(total()) + (temSobConsulta() ? ' + itens sob consulta' : '');
    }
    linha.classList.remove('mexeu');
    void linha.offsetWidth;
    linha.classList.add('mexeu');
  }

  function pintarGaveta() {
    var g = document.getElementById('gaveta-carrinho');
    if (!g) return;
    var corpo = g.querySelector('[data-corpo]');
    var alvoTotal = g.querySelector('[data-total]');
    var botao = g.querySelector('[data-fechar-pedido]');

    if (!itens.length) {
      corpo.innerHTML = '<p class="vazio">Sua sacola está vazia.</p>';
      if (alvoTotal) alvoTotal.textContent = '—';
      if (botao) botao.disabled = true;
      return;
    }

    corpo.innerHTML = itens.map(function (i, n) {
      var valor = i.preco ? window.aleaDinheiro(i.preco * qtd(i)) : 'Sob consulta';
      /* ETAPA 33: o layout do modelo — foto à esquerda; à direita o nome, o que foi escolhido,
         a linha "Quantidade  − 1 +" com o traço embaixo, e o preço por último. Saiu o "tirar":
         quem tira é o − com 1 unidade. */
      return '<div class="linha-carrinho">' +
        /* miniatura: o recorte quando existe, a foto normal quando nao. Nem toda peca
           tem recorte (ver `recorte` no produtos.js), e imagem quebrada no carrinho e'
           a ultima coisa que alguem quer ver antes de fechar um pedido. */
        '<img src="img/produtos/' + i.capa + '_obj_m.webp" alt="" loading="lazy" ' +
        'onerror="this.onerror=null;this.src=&quot;img/produtos/' + i.capa + '_m.jpg&quot;">' +
        '<div class="lado"><div class="cabeca-linha"><div class="titulo">' + i.nome + '</div>' +
        '<button class="tirar-x" type="button" data-tirar="' + n + '" aria-label="Tirar ' + i.nome +
        ' da sacola" title="Tirar da sacola">&times;</button></div>' +
        '<div class="detalhe">' + (descreverItem(i) || 'sem personalização') + '</div>' +
        /* ETAPA 45: o "editar" embaixo da personalização volta pra página da peça com tudo preenchido */
        (i.slug ? '<a class="editar-item" href="produto-' + i.slug + '.html?editar=' +
          encodeURIComponent(i.quando || '') + '">editar</a>' : '') +
        '<div class="quantidade"><span>Quantidade</span>' +
          '<span class="passos">' +
          '<button type="button" data-qtd="' + n + '" data-passo="-1" aria-label="Diminuir quantidade">−</button>' +
          '<span class="n" aria-live="polite">' + qtd(i) + '</span>' +
          '<button type="button" data-qtd="' + n + '" data-passo="1" aria-label="Aumentar quantidade">+</button>' +
          '</span></div>' +
        '<div class="valor-linha">' + valor + '</div></div></div>';
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
      var q = qtd(i);
      linhas.push((n + 1) + ') ' + (q > 1 ? q + 'x ' : '') + i.nome +
        (i.preco ? ' — ' + window.aleaDinheiro(i.preco * q) : ' — sob consulta'));
      var d = descreverItem(i, true);
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
      var passo = e.target.closest('[data-qtd]');
      if (passo) {
        window.aleaCarrinho.mudarQuantidade(parseInt(passo.getAttribute('data-qtd'), 10),
                                           parseInt(passo.getAttribute('data-passo'), 10));
        return;
      }
      if (e.target.closest('[data-fechar-pedido]')) fecharPedido();
    });

    document.addEventListener('alea:carrinho', function () {
      pintarContador();
      if (soALinha !== null) atualizarLinha(soALinha); else pintarGaveta();
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
