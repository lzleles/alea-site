/* CATALOGO:
   nome: loja-compra
   categoria: UTIL
   objetivo: A página finalizar-compra.html no desenho da Tiffany — Sacola de Compras (itens, mensagem para presente, entrega, subtotal) e Finalizar Compra em 3 etapas (Dados Pessoais, Entrega com CEP que preenche, Pagamento) com o Resumo do Pedido.
   entrada: window.aleaCarrinho (carrinho.js); window.aleaLoja (loja-dados.js); window.aleaLojaUtil (loja-conta.js não é carregado aqui: as máscaras vivem em loja-util abaixo)
   saida: pedido registrado; até o pagamento do site existir, o pedido completo segue pelo WhatsApp da ālea
   status: prévia (23/09/2026) · etapa P1 do pagamento (25/09/2026): Pix + cartão dentro do site (js/loja-pagamento.js)
   validado_em: 2026-09-25 (Playwright 390 px na prévia /pagamento/, MP em modo TESTE)
*/
/* =============================================================================
   loja-compra.js — "some o fechar pedido pelo WhatsApp, aparece concluir compra" (Cassiano, 23/09/2026 20:44)
   =============================================================================
   O CAMINHO, IGUAL AO VÍDEO DELE NA TIFFANY:
     sacola (gaveta) → "Finalizar Compra" → SACOLA DE COMPRAS (página) → "Finalizar Compra"
     → FINALIZAR COMPRA: 1 Dados Pessoais → "Ir para a Entrega" → 2 Entrega → "Ir para Pagamento"
     → 3 Pagamento → "Finalizar Compra".

   ⚠️ O PAGAMENTO AINDA NÃO EXISTE NO SITE. Cartão e Pix quem integra é a ZELES, e por decisão da casa
   (23/09/2026) o site NUNCA terá campo de cartão: o pagamento vai por checkout do gateway (link ou
   redirecionamento). Até ele subir, o "Finalizar Compra" final manda o pedido COMPLETO — peças,
   dados, endereço e a forma de pagamento escolhida — pelo WhatsApp da ālea, que é como o Cassiano
   recebe hoje. Quando o gateway existir, muda SÓ a função `concluir()`.
   ⚠️ FRETE: não há tabela de frete ainda. A tela diz "a calcular" — nunca um valor inventado.

   ETAPA P1 (25/09/2026) — O PAGAMENTO ENTRA NO SITE. O Cassiano escolheu (23/09 23h51) Mercado Pago com Pix +
   cartão DENTRO do site (Payment Brick), e aprovou o visual em 24/09 22h37. A regra "o site nunca terá campo de
   cartão" continua de pé no que importa: os campos do cartão do Brick são do MERCADO PAGO (campo seguro, o número
   vira token no navegador) — a ālea & Co. não recebe nem guarda o número. Quando o servidor liga o pagamento
   (GET /api/config -> "pagamento"), a etapa 3 mostra o Brick e o botão dele ("Pagar") conclui; sem isso — ou com
   peça "sob consulta" na sacola — tudo segue como antes, pelo WhatsApp. O valor cobrado é o do SERVIDOR (recalcula
   pela tabela de preço); frete ainda não entra na cobrança (a calcular, decisão pendente).
   ========================================================================== */
(function () {
  'use strict';

  var L = window.aleaLoja;
  var raiz = document.querySelector('[data-loja-compra]');
  if (!L || !raiz) return;
  /* a faixa "isto é prévia" mora DENTRO da página (o topo do site é fixo e cobriria o que vem antes) */
  var PG = window.aleaPagamento;
  var pgCfg = null;                 // o "pagamento" do /api/config; null = pagamento pelo site desligado
  var pix = null;                   // o Pix gerado, esperando a transferência
  var espiaPix = null;
  function faixa() {
    if (!L.previa) return '';
    if (pgCfg && pgCfg.teste) return '<div class="loja-previa">Prévia: pagamento de TESTE do Mercado Pago — nada é cobrado de verdade. A conta fica só neste aparelho.</div>';
    return '<div class="loja-previa">Prévia: a conta e os dados ficam só neste aparelho. Nada vai pro servidor.</div>';
  }
  var CAR = function () { return window.aleaCarrinho; };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function dinheiro(v) { return window.aleaDinheiro ? window.aleaDinheiro(v) : 'R$ ' + Number(v).toFixed(2).replace('.', ','); }
  function mascaraTelefone(v) {
    var d = String(v || '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '').slice(0, 11);
    if (d.length <= 2) return d.length ? '(' + d : '';
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }
  function mascaraCpf(v) {
    var d = String(v || '').replace(/\D/g, '').slice(0, 11);
    return d.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1-$2');
  }
  function cpfValido(v) {
    var d = String(v || '').replace(/\D/g, '');
    if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
    for (var t = 9; t < 11; t++) {
      var s = 0;
      for (var i = 0; i < t; i++) s += +d[i] * (t + 1 - i);
      if (((s * 10) % 11) % 10 !== +d[t]) return false;
    }
    return true;
  }

  var ICONE = {
    pessoa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
    casa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>',
    casaCheia: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3l10 8h-3v9h-5v-6h-4v6H5v-9H2z"/></svg>',
    cartao: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="1"/><path d="M2.5 9.5h19"/></svg>',
    lapis: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 20l4-1 11-11-3-3L5 16z"/></svg>'
  };

  var eu = { logado: false };
  var st = L.compra.ler();          // { etapa, dados, entrega, pagamento, presente }
  st.etapa = st.etapa || 'dados';
  st.dados = st.dados || {};
  st.entrega = st.entrega || {};
  st.pagamento = st.pagamento || '';
  var erro = '';
  var concluido = null;

  function guardar() { L.compra.gravar(st); }
  function tela() { return (location.hash || '').indexOf('compra') >= 0 ? 'compra' : 'sacola'; }

  /* ------------------------------------------------------------ as peças */
  function itens() { return CAR() ? CAR().itens() : []; }
  function qtd(i) { return Math.max(1, parseInt(i.qtd, 10) || 1); }
  function foto(i) { return i.miniatura || ('img/produtos/' + i.capa + '_obj_m.webp'); }
  function fotoReserva(i) { return 'this.onerror=null;this.src=&quot;img/produtos/' + esc(i.capa) + '_m.jpg&quot;'; }
  function descrever(i) { return CAR() && CAR().descrever ? CAR().descrever(i) : ''; }
  function subtotal() { return CAR() ? CAR().total() : 0; }
  function sobConsulta() { return itens().some(function (i) { return !i.preco; }); }
  function online() { return !!(pgCfg && PG && !sobConsulta() && subtotal() > 0); }

  /* ETAPA 62 (22:08, Cassiano): "ninguém mais fica preocupado com quanto vai pagar de frete nessa página (...)
     vamos deixar essa página mais clean" — na SACOLA sai o bloco Entrega e a linha do frete; ele volta no fim. */
  function htmlTotais(semFrete) {
    return '<div class="loja-totais"><div><span>Subtotal</span><span>' + dinheiro(subtotal()) + '</span></div>' +
      (semFrete ? '' : '<div><span>Frete</span><span>a calcular</span></div>') +
      '<div class="total"><span>Total</span><span>' + dinheiro(subtotal()) + (sobConsulta() ? ' + itens sob consulta' : '') + '</span></div></div>';
  }

  /* ======================================================= SACOLA DE COMPRAS */
  function htmlSacola() {
    var l = itens();
    var h = '<h1 class="loja-titulo grande">Sacola de Compras</h1>';
    if (!l.length) {
      return h + '<p class="loja-vazio" style="margin:26px 0">Sua sacola está vazia.</p>' +
        '<a class="loja-bt largo" href="index.html">Escolher Produtos</a>';
    }
    h += l.map(function (i, n) {
      var det = descrever(i);
      return '<div class="loja-item" data-linha="' + n + '">' +
        '<img src="' + esc(foto(i)) + '" alt="" loading="lazy" onerror="' + fotoReserva(i) + '">' +
        '<div class="nome">' + esc(i.nome) + (det ? '<small>' + esc(det) + '</small>' : '') + '</div>' +
        '<button type="button" class="tirar" data-tirar-item="' + n + '" aria-label="Tirar ' + esc(i.nome) + ' da sacola">&times;</button>' +
        '<div class="linha-qtd"><span class="loja-passos">' +
          '<button type="button" data-passo="-1" data-item="' + n + '" aria-label="Diminuir">−</button><span>' + qtd(i) + '</span>' +
          '<button type="button" data-passo="1" data-item="' + n + '" aria-label="Aumentar">+</button></span>' +
          '<span class="valor">' + (i.preco ? dinheiro(i.preco * qtd(i)) : 'Sob consulta') + '</span></div></div>';
    }).join('');
    h += '<div class="loja-presente">' +
      '<label class="loja-marca"><input type="checkbox" data-presente' + (st.presente ? ' checked' : '') + '>' +
        '<span><strong style="font-weight:600">Mensagem para Presente</strong><br>' +
        '<span class="loja-miudo">Adicione uma mensagem personalizada que será impressa e enviada com seu presente.</span></span></label>' +
      '<textarea data-presente-texto maxlength="240" placeholder="Sua mensagem"' + (st.presente ? '' : ' hidden') + '>' +
        esc(st.presente_texto || '') + '</textarea></div>' +
      htmlTotais(true) +
      '<button type="button" class="loja-bt largo" data-ir-compra>Finalizar Compra</button>' +
      '<a class="loja-mais-produtos" href="index.html">Escolher mais Produtos</a>';
    return h;
  }

  /* ======================================================== FINALIZAR COMPRA */
  function nomeCompleto() { return [st.dados.nome, st.dados.sobrenome].filter(Boolean).join(' '); }

  function etapaDados() {
    var d = st.dados;
    if (st.etapa !== 'dados') {
      return '<section class="loja-etapa"><header>' + ICONE.pessoa + '<h2>Dados Pessoais</h2>' +
        '<button type="button" class="editar" data-etapa="dados" aria-label="Editar dados pessoais">' + ICONE.lapis + '</button></header>' +
        '<div class="feito">' + esc(d.email) + (eu.logado ? ' &nbsp;<button type="button" class="loja-link sublinha loja-miudo" data-sair>Não é você? Sair</button>' : '') +
        '<br>Nome: ' + esc(nomeCompleto()) + '<br>Telefone: ' + esc(mascaraTelefone(d.telefone)) + '</div></section>';
    }
    var trava = eu.logado ? ' readonly aria-readonly="true"' : '';
    return '<section class="loja-etapa"><header>' + ICONE.pessoa + '<h2>Dados Pessoais</h2></header>' +
      '<p class="intro">Com o intuito de lhe atender da melhor forma, solicitamos informações essenciais para finalizar sua compra.</p>' +
      (eu.logado ? '' : '<p class="loja-miudo" style="margin:-6px 0 14px">Já tem conta? <a href="conta.html?voltar=finalizar-compra.html%23%2Fcompra" style="color:var(--terracota)">Entrar</a></p>') +
      '<form data-form="dados" novalidate>' +
      '<label class="loja-campo"><span>E-mail</span><input name="email" type="email" autocomplete="email" inputmode="email" value="' + esc(d.email) + '"' + trava + '></label>' +
      '<label class="loja-campo"><span>Nome</span><input name="nome" autocomplete="given-name" maxlength="60" value="' + esc(d.nome) + '"></label>' +
      '<label class="loja-campo"><span>Sobrenome</span><input name="sobrenome" autocomplete="family-name" maxlength="80" value="' + esc(d.sobrenome) + '"></label>' +
      '<div class="loja-dupla">' +
        '<label class="loja-campo"><span>CPF</span><input name="cpf" inputmode="numeric" maxlength="14" placeholder="999.999.999-99" value="' + esc(mascaraCpf(d.cpf)) + '"></label>' +
        '<label class="loja-campo"><span>Telefone</span><input name="telefone" type="tel" inputmode="tel" autocomplete="tel-national" maxlength="15" placeholder="(64) 99999-9999" value="' + esc(mascaraTelefone(d.telefone)) + '"></label>' +
      '</div>' +
      '<p class="loja-miudo" style="margin:10px 0">Ao clicar em "Finalizar Compra", você confirma que leu, entendeu e aceita as condições de ' +
        '<a href="trocas-e-entrega.html" target="_blank" rel="noopener" style="color:var(--terracota)">Trocas, Devoluções e Entregas</a>.</p>' +
      (eu.logado && eu.politica_aceita ? '' :
        '<label class="loja-marca" data-politica><input type="checkbox" name="aceite_politica"' + (d.aceite_politica ? ' checked' : '') + '><span>Li e aceito a ' +
        '<a href="privacidade.html" target="_blank" rel="noopener">Política de Privacidade</a> da ālea & Co.</span></label>') +
      '<label class="loja-marca"><input type="checkbox" name="consent_marketing"' + (d.consent_marketing ? ' checked' : '') + '>' +
        '<span>Desejo receber as comunicações digitais da ālea & Co.<br><span class="loja-miudo">Ao se inscrever, você concorda em receber por e-mail ' +
        'e WhatsApp informações sobre produtos, serviços e novidades da ālea & Co., seguindo nossa Política de Privacidade.</span></span></label>' +
      (erro ? '<p class="loja-erro" role="alert">' + esc(erro) + '</p>' : '') +
      '<button type="submit" class="loja-bt largo" style="margin-top:14px">Ir para a Entrega</button></form></section>';
  }

  function etapaEntrega() {
    var e = st.entrega;
    if (st.etapa === 'dados') {
      return '<section class="loja-etapa apagada"><header>' + ICONE.casa + '<h2>Entrega</h2></header></section>';
    }
    if (st.etapa === 'pagamento') {
      return '<section class="loja-etapa"><header>' + ICONE.casa + '<h2>Entrega</h2>' +
        '<button type="button" class="editar" data-etapa="entrega" aria-label="Editar entrega">' + ICONE.lapis + '</button></header>' +
        '<div class="feito">' + esc(e.logradouro) + ' ' + esc(e.numero) + (e.complemento ? ' — ' + esc(e.complemento) : '') + '<br>' +
        esc(e.bairro) + ' - ' + esc(e.cidade) + ' - ' + esc(e.uf) + '<br>' + esc(String(e.cep).replace(/^(\d{5})(\d{3})$/, '$1-$2')) +
        '<br>Destinatário: ' + esc(e.destinatario) + '<br>Envio: prazo e frete confirmados com o pedido</div>' +
        '<p style="margin:14px 0 0"><button type="button" class="loja-bt contorno largo" data-etapa="entrega">Alterar Opções de Entrega</button></p></section>';
    }
    var temRua = !!(e.logradouro && e.cidade);
    var h = '<section class="loja-etapa"><header>' + ICONE.casa + '<h2>Entrega</h2></header>' +
      '<form data-form="entrega" novalidate>' +
      '<div class="loja-cep"><label class="loja-campo' + (e.cep && e.cep.length === 8 && temRua ? ' ok' : '') + '"><span>CEP</span>' +
        '<input name="cep" inputmode="numeric" autocomplete="postal-code" maxlength="9" placeholder="00000-000" value="' +
        esc(e.cep ? String(e.cep).replace(/^(\d{5})(\d{3})$/, '$1-$2') : '') + '"></label>' +
        '<a href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noopener">Não sei meu CEP</a></div>';
    if (temRua) {
      h += '<p class="loja-rotulo">Forma de Entrega</p>' +
        '<label class="loja-radio escolhido"><input type="radio" name="forma" value="padrao" checked>' +
          '<span class="txt">Entrega Padrão<small>Prazo de produção e envio confirmado com o pedido</small></span><span class="preco">a calcular</span></label>' +
        '<p class="loja-rotulo">Endereço de Entrega</p>' +
        '<div class="loja-endereco" data-endereco-caixa' + (e.editando ? ' hidden' : '') + '>' + ICONE.casaCheia + '<div>' + esc(e.logradouro) + '<br>' +
          (e.bairro ? esc(e.bairro) + ' - ' : '') + esc(e.cidade) + ' - ' + esc(e.uf) + ' - <button type="button" data-alterar-endereco>Alterar</button></div></div>' +
        '<div data-endereco-campos' + (e.editando ? '' : ' hidden') + '>' +
          '<label class="loja-campo"><span>Rua</span><input name="logradouro" value="' + esc(e.logradouro) + '"></label>' +
          '<label class="loja-campo"><span>Bairro</span><input name="bairro" value="' + esc(e.bairro) + '"></label>' +
          '<div class="loja-dupla"><label class="loja-campo"><span>Cidade</span><input name="cidade" value="' + esc(e.cidade) + '"></label>' +
          '<label class="loja-campo"><span>UF</span><input name="uf" maxlength="2" value="' + esc(e.uf) + '" style="text-transform:uppercase"></label></div></div>' +
        '<div class="loja-dupla">' +
          '<label class="loja-campo"><span>Número <small>(obrigatório)</small></span><input name="numero" value="' + esc(e.numero) + '"></label>' +
          '<label class="loja-campo"><span>Complemento <small>(opcional)</small></span><input name="complemento" placeholder="Opcional" value="' + esc(e.complemento) + '"></label></div>' +
        '<label class="loja-campo' + (e.destinatario || nomeCompleto() ? ' ok' : '') + '"><span>Destinatário <small>(obrigatório)</small></span>' +
          '<input name="destinatario" autocomplete="name" value="' + esc(e.destinatario || nomeCompleto()) + '"></label>' +
        (erro ? '<p class="loja-erro" role="alert">' + esc(erro) + '</p>' : '') +
        '<button type="submit" class="loja-bt largo" style="margin-top:14px">Ir para Pagamento</button>';
    } else {
      h += (erro ? '<p class="loja-erro" role="alert">' + esc(erro) + '</p>' : '');
    }
    return h + '</form></section>';
  }

  function etapaPagamento() {
    if (st.etapa !== 'pagamento') {
      return '<section class="loja-etapa apagada"><header>' + ICONE.cartao + '<h2>Pagamento</h2></header>' +
        '<p class="espera">Aguardando o preenchimento dos dados</p></section>';
    }
    if (online()) {
      /* ETAPA P1: o Brick do Mercado Pago (Pix + cartão) com o tema aprovado; o botão "Pagar" é dele */
      return '<section class="loja-etapa loja-etapa-pagar"><header>' + ICONE.cartao + '<h2>Pagamento</h2></header>' +
        (erro ? '<p class="loja-erro" role="alert">' + esc(erro) + '</p>' : '') +
        '<p class="loja-miudo loja-brick-carregando" data-brick-carregando>Carregando o pagamento seguro…</p>' +
        '<div class="loja-brick" id="alea-brick"></div>' +
        '<p class="loja-miudo loja-brick-nota">Frete: a calcular — prazo e valor confirmados com o pedido.</p></section>';
    }
    var p = st.pagamento;
    var caixa = '';
    if (p === 'pix') {
      caixa = '<div class="loja-pagar-caixa"><div class="logo-pix">pix</div><p>Para pagar, finalize sua compra abaixo.</p></div>';
    } else if (p === 'cartao') {
      caixa = '<div class="loja-pagar-caixa"><span class="loja-seguro">Ambiente Seguro</span>' +
        '<p>Você digita os dados do cartão na página segura do pagamento, logo depois de finalizar a compra. ' +
        'A ālea & Co. não recebe nem guarda o número do seu cartão.</p></div>';
    }
    return '<section class="loja-etapa"><header>' + ICONE.cartao + '<h2>Pagamento</h2></header>' +
      '<label class="loja-radio' + (p === 'cartao' ? ' escolhido' : '') + '"><input type="radio" name="pagamento" value="cartao"' + (p === 'cartao' ? ' checked' : '') + '>' +
        '<span class="txt">Cartão de crédito</span></label>' +
      '<label class="loja-radio' + (p === 'pix' ? ' escolhido' : '') + '"><input type="radio" name="pagamento" value="pix"' + (p === 'pix' ? ' checked' : '') + '>' +
        '<span class="txt">Pix</span></label>' + caixa +
      (erro ? '<p class="loja-erro" role="alert">' + esc(erro) + '</p>' : '') + '</section>';
  }

  function htmlResumo() {
    return '<div class="loja-resumo"><h2>Resumo do Pedido</h2>' + itens().map(function (i) {
      var det = descrever(i);
      return '<div class="linha"><img src="' + esc(foto(i)) + '" alt="" onerror="' + fotoReserva(i) + '">' +
        '<div>' + (qtd(i) > 1 ? qtd(i) + '× ' : '') + esc(i.nome) + (det ? '<small>' + esc(det) + '</small>' : '') + '</div>' +
        '<div>' + (i.preco ? dinheiro(i.preco * qtd(i)) : 'Sob consulta') + '</div></div>';
    }).join('') + '<a class="voltar-sacola" href="#/sacola">Voltar para a Sacola de Compras</a>' + htmlTotais() + '</div>';
  }

  function htmlCompra() {
    if (!itens().length) return htmlSacola();
    return '<h1 class="loja-titulo grande">Finalizar Compra</h1>' + etapaDados() + etapaEntrega() + etapaPagamento() +
      htmlResumo() +
      (st.etapa === 'pagamento' && !online() ? '<button type="button" class="loja-bt largo" data-concluir' + (st.pagamento ? '' : ' disabled') + '>Finalizar Compra</button>' +
        '<p class="loja-miudo" style="text-align:center;margin-top:10px">Enquanto o pagamento pelo site não liga, o pedido completo segue pelo WhatsApp da ālea & Co.</p>' : '');
  }

  /* ETAPA P1: o Pix gerado — QR, copia e cola, e a tela confere sozinha quando o banco confirmar */
  function htmlPix() {
    var validade = '';
    if (pix.expira_em) {
      var d = new Date(pix.expira_em);
      if (!isNaN(d)) validade = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    return '<div class="loja-concluido loja-pix"><h1>Pague com Pix</h1><p class="numero">' + esc(pix.numero) + '</p>' +
      '<p>Abra o app do seu banco, escolha <strong>Pix &gt; Ler QR code</strong> ou <strong>Pix Copia e Cola</strong>.</p>' +
      (pix.qr_base64 ? '<img class="loja-pix-qr" alt="QR code do Pix" src="data:image/png;base64,' + esc(pix.qr_base64) + '">' : '') +
      '<p class="loja-rotulo" style="margin-top:14px">Pix Copia e Cola</p>' +
      '<textarea class="loja-pix-codigo" readonly rows="3" data-pix-codigo>' + esc(pix.copia_e_cola) + '</textarea>' +
      '<p><button type="button" class="loja-bt largo" data-copiar-pix>Copiar código</button></p>' +
      '<p class="loja-miudo">Valor: ' + dinheiro(pix.total) + (validade ? ' · pague até as ' + esc(validade) : '') + '</p>' +
      '<p class="loja-pix-status" data-pix-status aria-live="polite">Aguardando o pagamento… esta tela confirma sozinha.</p>' +
      (pgCfg && pgCfg.teste ? '<p class="loja-miudo" style="color:var(--terracota)">Pix de TESTE: este código não é pago de verdade.</p>' : '') +
      '</div>';
  }

  function htmlConcluido() {
    if (concluido.pago) {
      return '<div class="loja-concluido"><h1>Pagamento aprovado</h1><p class="numero">' + esc(concluido.numero) + '</p>' +
        '<p>Obrigado, ' + esc(concluido.nome) + '! Recebemos o seu pedido e o pagamento' +
        (concluido.forma === 'pix' ? ' pelo Pix' : (concluido.parcelas > 1 ? ' em ' + concluido.parcelas + 'x no cartão' : ' no cartão')) + '. ' +
        'A produção começa agora e você recebe as novidades por e-mail.</p>' +
        (concluido.descritor ? '<p class="loja-miudo">Na fatura do cartão, a compra aparece com o nome <strong>' + esc(concluido.descritor) + '</strong>.</p>' : '') +
        '<p><a class="loja-bt" href="index.html">Continuar comprando</a></p></div>';
    }
    return '<div class="loja-concluido"><h1>Pedido recebido</h1><p class="numero">' + esc(concluido.numero) + '</p>' +
      '<p>Obrigado, ' + esc(concluido.nome) + '! Abrimos o WhatsApp da ālea & Co. com o seu pedido completo: é por lá que você recebe ' +
        'o valor do frete e o ' + (concluido.pagamento === 'pix' ? 'Pix' : 'link seguro do cartão') + ' para pagar.</p>' +
      '<p><a class="loja-bt" href="index.html">Continuar comprando</a></p>' +
      (concluido.zap ? '<p class="loja-miudo">O WhatsApp não abriu? <a href="' + esc(concluido.zap) + '" target="_blank" rel="noopener" style="color:var(--terracota)">Toque aqui</a>.</p>' : '') +
      '</div>';
  }

  /* ================================================================ desenhar */
  function pintar() {
    if (PG) PG.desmontar();
    raiz.innerHTML = faixa() + (concluido ? htmlConcluido() : pix ? htmlPix() : (tela() === 'compra' ? htmlCompra() : htmlSacola()));
    ligar();
    erro = '';
    if (!concluido && !pix && tela() === 'compra' && st.etapa === 'pagamento' && online()) montarBrick();
  }

  /* ------------------------------------------------------ ETAPA P1: o Brick
     O valor que o Brick mostra é o subtotal da sacola; o que vale é o que o servidor recalcula. Se os dois não
     baterem (preço mudou no site com a sacola aberta), o servidor recusa e a tela pede pra conferir. */
  function montarBrick() {
    var d = st.dados;
    PG.montar({
      alvoId: 'alea-brick', valor: subtotal(),
      pagador: { email: d.email, nome: d.nome, sobrenome: d.sobrenome, cpf: d.cpf },
      aoEnviar: pagarAgora,
      aoPronto: function () { var c = raiz.querySelector('[data-brick-carregando]'); if (c) c.remove(); },
      aoErro: function () { /* o Brick mostra o próprio aviso de campo */ }
    }).catch(function () {
      var alvo = raiz.querySelector('#alea-brick');
      var c = raiz.querySelector('[data-brick-carregando]'); if (c) c.remove();
      if (alvo) alvo.innerHTML = '<p class="loja-erro">O pagamento pelo site não carregou. Recarregue a página — ou finalize pelo WhatsApp.</p>';
    });
  }

  function pagarAgora(selecionado, fd) {
    var d = st.dados, e = st.entrega;
    var forma = selecionado === 'bank_transfer' || fd.payment_method_id === 'pix' ? 'pix' : 'cartao';
    var corpo = {
      forma: forma, total: subtotal(),
      itens: itens().map(function (i) { var c = JSON.parse(JSON.stringify(i)); delete c.miniatura; return c; }),
      comprador: { nome: d.nome, sobrenome: d.sobrenome, email: d.email, cpf: d.cpf, telefone: d.telefone },
      entrega: { cep: e.cep, logradouro: e.logradouro, numero: e.numero, complemento: e.complemento, bairro: e.bairro,
                 cidade: e.cidade, uf: e.uf, destinatario: e.destinatario },
      presente: st.presente ? (st.presente_texto || '') : null,
      consent_marketing: !!d.consent_marketing,
      visitante: window.aleaRastro ? window.aleaRastro.visitante() : null
    };
    if (forma === 'cartao') {
      corpo.cartao = { token: fd.token, payment_method_id: fd.payment_method_id, installments: +fd.installments || 1,
                       issuer_id: fd.issuer_id ? String(fd.issuer_id) : null };
    }
    return PG.pagar(corpo).then(function (r) {
      if (r.estado === 'aprovado') { fechar(r, forma); return; }
      if (r.estado === 'aguardando_pix' && r.pix) {
        pix = { numero: r.numero, chave: r.chave, total: r.total, nome: d.nome, copia_e_cola: r.pix.copia_e_cola,
                qr_base64: r.pix.qr_base64, expira_em: r.pix.expira_em };
        CAR().limpar(); L.compra.limpar();
        pintar(); window.scrollTo(0, 0); espiarPix();
        return;
      }
      erro = r.estado === 'recusado' ? PG.motivo(r.detalhe) :
        'O pagamento ficou em análise (pedido ' + r.numero + '). Você recebe a confirmação por e-mail.';
      pintar(); rolarPara('.loja-etapa-pagar');
    }).catch(function (x) {
      erro = x.message || 'Não foi possível concluir o pagamento. Nada foi cobrado.';
      pintar(); rolarPara('.loja-etapa-pagar');
    });
  }

  function fechar(r, forma) {
    if (espiaPix) { clearInterval(espiaPix); espiaPix = null; }
    concluido = { pago: true, numero: r.numero, nome: r.nome || st.dados.nome || '', forma: forma,
                  parcelas: r.parcelas, descritor: r.descritor };
    pix = null;
    if (CAR()) CAR().limpar(); L.compra.limpar();
    st = { etapa: 'dados', dados: {}, entrega: {}, pagamento: '' };
    pintar(); window.scrollTo(0, 0);
  }

  function espiarPix() {
    if (espiaPix) clearInterval(espiaPix);
    espiaPix = setInterval(function () {
      if (!pix) { clearInterval(espiaPix); espiaPix = null; return; }
      PG.consultar(pix.numero, pix.chave).then(function (s) {
        if (s.estado === 'aprovado') { fechar({ numero: pix.numero, nome: pix.nome }, 'pix'); }
        else if (s.estado === 'expirado' || s.estado === 'cancelado') {
          var el = raiz.querySelector('[data-pix-status]');
          if (el) el.textContent = 'Este Pix expirou. Faça o pedido de novo para gerar outro código.';
          clearInterval(espiaPix); espiaPix = null;
        }
      }).catch(function () { /* sem rede agora: tenta de novo no próximo giro */ });
    }, 5000);
  }

  function ligar() {
    Array.prototype.forEach.call(raiz.querySelectorAll('form'), function (f) { f.addEventListener('submit', enviar); });
    var tel = raiz.querySelector('[name="telefone"]');
    if (tel) tel.addEventListener('input', function () { tel.value = mascaraTelefone(tel.value); });
    var cpf = raiz.querySelector('[name="cpf"]');
    if (cpf) cpf.addEventListener('input', function () { cpf.value = mascaraCpf(cpf.value); });
    var cep = raiz.querySelector('form[data-form="entrega"] [name="cep"]');
    if (cep) cep.addEventListener('input', function () {
      var d = cep.value.replace(/\D/g, '').slice(0, 8);
      cep.value = d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d;
      if (d.length !== 8 || d === st.entrega.cep && st.entrega.logradouro) return;
      L.buscarCep(d).then(function (j) {
        st.entrega.cep = d; st.entrega.logradouro = j.logradouro; st.entrega.bairro = j.bairro;
        st.entrega.cidade = j.cidade; st.entrega.uf = j.uf; st.entrega.editando = !j.logradouro;
        guardar(); pintar();
        var n = raiz.querySelector(j.logradouro ? '[name="numero"]' : '[name="logradouro"]'); if (n) n.focus();
      }).catch(function () {
        st.entrega = { cep: d, editando: true, logradouro: ' ', cidade: ' ' }; guardar(); pintar();
      });
    });
    var cs = raiz.querySelector('[data-cep-sacola]');
    if (cs) cs.addEventListener('input', function () {
      var d = cs.value.replace(/\D/g, '').slice(0, 8);
      cs.value = d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d;
      var resp = raiz.querySelector('[data-cep-resposta]');
      if (d.length !== 8) { resp.textContent = ''; return; }
      resp.textContent = 'Procurando…';
      L.buscarCep(d).then(function (j) {
        st.entrega = { cep: d, logradouro: j.logradouro, bairro: j.bairro, cidade: j.cidade, uf: j.uf }; guardar();
        resp.textContent = 'Entrega para ' + j.cidade + ' - ' + j.uf + '. Prazo e frete confirmados com o pedido.';
      }).catch(function () { resp.textContent = 'Não achamos esse CEP. Confira os números.'; });
    });
  }

  /* ETAPA 66 (22:51, Cassiano): faltou algo obrigatório → a tela TREME (a tremida do site) e o cursor vai direto
     pro primeiro campo que falta, já ativo. Antes só mudava a cor — discreto demais. */
  function tremerEIr(el) {
    raiz.classList.remove('loja-tremendo'); void raiz.offsetWidth; raiz.classList.add('loja-tremendo');
    if (el) { try { el.focus({ preventScroll: true }); } catch (x) { el.focus(); } el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  }

  function marcaFalta(form, nome, ok, dica) {
    var el = form.querySelector('[name="' + nome + '"]');
    var lab = el && el.closest('.loja-campo, .loja-marca');
    if (!lab) return ok;
    lab.classList.toggle('faltou', !ok);
    var velha = lab.querySelector('.dica-erro'); if (velha) velha.remove();
    if (!ok && dica && lab.classList.contains('loja-campo')) lab.insertAdjacentHTML('beforeend', '<small class="dica-erro">' + dica + '</small>');
    return ok;
  }

  function enviar(ev) {
    ev.preventDefault();
    var f = ev.target;
    var v = function (n) { var el = f.querySelector('[name="' + n + '"]'); return el ? (el.type === 'checkbox' ? el.checked : el.value.trim()) : ''; };
    var tipo = f.getAttribute('data-form');

    if (tipo === 'dados') {
      var d = { email: v('email').toLowerCase(), nome: v('nome'), sobrenome: v('sobrenome'), cpf: v('cpf').replace(/\D/g, ''),
                telefone: v('telefone').replace(/\D/g, ''), consent_marketing: v('consent_marketing'),
                aceite_politica: f.querySelector('[name="aceite_politica"]') ? v('aceite_politica') : true };
      var ok = [marcaFalta(f, 'email', L.emailValido(d.email), 'Digite um e-mail válido'),
                marcaFalta(f, 'nome', !!d.nome, 'Preencha o nome'),
                marcaFalta(f, 'sobrenome', !!d.sobrenome, 'Preencha o sobrenome'),
                marcaFalta(f, 'cpf', cpfValido(d.cpf), d.cpf ? 'CPF inválido' : 'Preencha o CPF'),
                marcaFalta(f, 'telefone', d.telefone.length >= 10, 'Telefone com DDD'),
                marcaFalta(f, 'aceite_politica', !!d.aceite_politica)].every(Boolean);
      if (!ok) { tremerEIr(f.querySelector('.faltou input')); return; }
      st.dados = d; st.etapa = 'entrega';
      if (!st.entrega.destinatario) st.entrega.destinatario = nomeCompleto();
      guardar();
      /* logado: a ficha da conta aprende o que a pessoa digitou aqui — na próxima compra já vem pronta */
      if (eu.logado) {
        L.salvarFicha({ nome: d.nome, sobrenome: d.sobrenome, cpf: d.cpf, telefone: d.telefone,
          nascimento: eu.nascimento || '', consent_marketing: d.consent_marketing,
          consent_personalizar: !!eu.consent_personalizar, aceite_politica: d.aceite_politica })
          .then(function (j) { eu = j; }).catch(function () { /* a compra segue mesmo se a ficha não salvar */ });
      }
      pintar(); rolarPara('.loja-etapa:nth-of-type(2)');
      return;
    }
    if (tipo === 'entrega') {
      var e = st.entrega;
      ['logradouro', 'bairro', 'cidade', 'uf', 'numero', 'complemento', 'destinatario'].forEach(function (k) {
        if (f.querySelector('[name="' + k + '"]')) e[k] = k === 'uf' ? v(k).toUpperCase() : v(k);
      });
      var ok2 = [marcaFalta(f, 'numero', !!e.numero, 'Preencha o número (ou S/N)'),
                 marcaFalta(f, 'destinatario', !!e.destinatario, 'Quem vai receber?'),
                 marcaFalta(f, 'logradouro', !!e.logradouro.trim(), 'Preencha a rua'),
                 marcaFalta(f, 'cidade', !!e.cidade.trim(), 'Preencha a cidade'),
                 marcaFalta(f, 'uf', /^[A-Z]{2}$/.test(e.uf || ''), 'UF')].every(Boolean);
      if (!ok2) {
        var campos = raiz.querySelector('[data-endereco-campos]');
        if (campos && campos.querySelector('.faltou')) { campos.hidden = false; raiz.querySelector('[data-endereco-caixa]').hidden = true; }
        tremerEIr(f.querySelector('.faltou input'));
        return;
      }
      e.editando = false; st.etapa = 'pagamento'; guardar();
      if (eu.logado && !(eu.enderecos || []).some(function (x) { return x.cep === e.cep && String(x.numero) === String(e.numero); })) {
        L.guardarEndereco({ cep: e.cep, logradouro: e.logradouro, numero: e.numero, complemento: e.complemento,
          bairro: e.bairro, cidade: e.cidade, uf: e.uf, apelido: 'casa' }).then(function (j) { eu = j; }).catch(function () {});
      }
      pintar(); rolarPara('.loja-etapa:nth-of-type(3)');
    }
  }

  function rolarPara(sel) {
    var el = raiz.querySelector(sel);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - 12, behavior: 'smooth' });
  }

  /* ------------------------------------------------------------- concluir
     Até o gateway existir: o pedido inteiro vai pelo WhatsApp (e fica registrado na conta). */
  function concluir() {
    var car = CAR();
    if (!car || !car.quantos()) return;
    var d = st.dados, e = st.entrega;
    var linhas = [
      '',
      'Dados: ' + nomeCompleto() + ' · CPF ' + mascaraCpf(d.cpf) + ' · ' + mascaraTelefone(d.telefone) + ' · ' + d.email,
      'Entrega: ' + e.logradouro + ', ' + e.numero + (e.complemento ? ' — ' + e.complemento : '') + ' · ' +
        (e.bairro ? e.bairro + ' · ' : '') + e.cidade + '-' + e.uf + ' · CEP ' + String(e.cep).replace(/^(\d{5})(\d{3})$/, '$1-$2'),
      'Destinatário: ' + e.destinatario,
      'Pagamento escolhido: ' + (st.pagamento === 'pix' ? 'Pix' : 'Cartão de crédito')
    ];
    if (st.presente && st.presente_texto) linhas.push('Mensagem para presente: "' + st.presente_texto + '"');
    var pedido = { itens: car.itens(), total: car.total(), dados: { nome: d.nome, sobrenome: d.sobrenome, email: d.email, telefone: d.telefone, cpf: d.cpf },
                   entrega: e, pagamento: st.pagamento, presente: st.presente ? (st.presente_texto || '') : null,
                   consent_marketing: !!d.consent_marketing, visitante: window.aleaRastro ? window.aleaRastro.visitante() : null };
    var botao = raiz.querySelector('[data-concluir]'); if (botao) botao.disabled = true;
    var zap = null;
    /* 21:46: "deixa [o WhatsApp] até você confirmar com ele" — vale na prévia também */
    zap = car.abrirWhatsApp(linhas);                         // abre JÁ, no mesmo toque (senão o navegador bloqueia)
    L.registrarPedido(pedido).catch(function () { return {}; }).then(function (r) {
      concluido = { numero: (r && r.numero) || '', nome: d.nome, previa: L.previa, pagamento: st.pagamento, zap: zap };
      car.limpar(); L.compra.limpar();
      st = { etapa: 'dados', dados: {}, entrega: {}, pagamento: '' };
      pintar(); window.scrollTo(0, 0);
    });
  }

  raiz.addEventListener('click', function (ev) {
    var t;
    if ((t = ev.target.closest('[data-tirar-item]'))) {
      if (confirm('Tem certeza de que deseja remover este item da sua sacola?')) CAR().remover(+t.getAttribute('data-tirar-item'));
      return;
    }
    if ((t = ev.target.closest('[data-passo]'))) { CAR().mudarQuantidade(+t.getAttribute('data-item'), +t.getAttribute('data-passo')); return; }
    if (ev.target.closest('[data-ver-entrega]')) {
      var box = raiz.querySelector('[data-entrega-previa]'); box.hidden = false;
      ev.target.closest('[data-ver-entrega]').hidden = true; box.querySelector('input').focus(); return;
    }
    /* ETAPA 63 (22:15, Cassiano): "clicou em finalizar compra, vai pra tela do login". Quem já entrou segue direto;
       quem não entrou vê a tela de entrar, com "continuar sem cadastro" na linha do Cadastre-se. */
    if (ev.target.closest('[data-ir-compra]')) {
      if (eu.logado) { location.hash = '#/compra'; return; }
      location.href = 'conta.html?compra=1&voltar=' + encodeURIComponent('finalizar-compra.html#/compra');
      return;
    }
    if ((t = ev.target.closest('[data-etapa]'))) { st.etapa = t.getAttribute('data-etapa'); guardar(); pintar(); return; }
    if (ev.target.closest('[data-alterar-endereco]')) {
      raiz.querySelector('[data-endereco-campos]').hidden = false; raiz.querySelector('[data-endereco-caixa]').hidden = true; return;
    }
    if (ev.target.closest('[data-sair]')) { L.sair().then(function () { eu = { logado: false }; st.dados = {}; st.etapa = 'dados'; guardar(); pintar(); }); return; }
    if (ev.target.closest('[data-concluir]')) { concluir(); }
    if (ev.target.closest('[data-copiar-pix]')) {
      var cx = raiz.querySelector('[data-pix-codigo]');
      var bt = ev.target.closest('[data-copiar-pix]');
      var ok = function () { bt.textContent = 'Código copiado'; };
      if (navigator.clipboard) navigator.clipboard.writeText(cx.value).then(ok, function () { cx.select(); document.execCommand('copy'); ok(); });
      else { cx.select(); document.execCommand('copy'); ok(); }
    }
  });
  raiz.addEventListener('change', function (ev) {
    var t = ev.target;
    if (t.matches('[data-presente]')) {
      st.presente = t.checked; guardar();
      raiz.querySelector('[data-presente-texto]').hidden = !t.checked;
      if (t.checked) raiz.querySelector('[data-presente-texto]').focus();
    }
    if (t.matches('[name="pagamento"]')) { st.pagamento = t.value; guardar(); pintar(); }
  });
  raiz.addEventListener('input', function (ev) {
    if (ev.target.matches('[data-presente-texto]')) { st.presente_texto = ev.target.value; guardar(); }
  });

  document.addEventListener('alea:carrinho', function () { if (!concluido) pintar(); });
  window.addEventListener('hashchange', function () { pintar(); window.scrollTo(0, 0); });

  function comecar() {
    L.eu().then(function (j) {
      eu = j || { logado: false };
      if (eu.logado) {
        /* logado: os dados pessoais já vêm da ficha (o que ele digitou nesta compra vence) */
        var dd = st.dados;
        ['nome', 'sobrenome', 'cpf', 'telefone'].forEach(function (k) { if (!dd[k] && eu[k]) dd[k] = eu[k]; });
        dd.email = eu.email;
        var pr = (eu.enderecos || []).filter(function (x) { return x.principal; })[0];
        if (pr && !st.entrega.cep) {
          st.entrega = { cep: pr.cep, logradouro: pr.logradouro, bairro: pr.bairro, cidade: pr.cidade, uf: pr.uf,
                         numero: pr.numero, complemento: pr.complemento, destinatario: '' };
        }
        guardar();
      }
    }).catch(function () { eu = { logado: false }; }).then(function () {
      /* ETAPA P1: pergunta ao servidor se o pagamento pelo site está ligado (desligado = tudo como antes) */
      return PG ? PG.disponivel().then(function (c) { pgCfg = c; }) : null;
    }).then(pintar);
  }
  if (window.aleaCarrinho) comecar(); else document.addEventListener('DOMContentLoaded', comecar);
})();
