/* CATALOGO:
   nome: loja-pagamento
   categoria: UTIL
   objetivo: O PAGAMENTO DENTRO DO SITE (Mercado Pago, Pix + cartão de crédito pelo Payment Brick) na etapa 3 do Finalizar Compra, vestido com o tema "alea_fundo" que o Cassiano aprovou em 24/09/2026 22h37.
   entrada: window.ALEA (api_conta; api_pagamento_previa só na prévia); GET <api>/api/config -> "pagamento" (public key); o SDK do MP (sdk.mercadopago.com/js/v2)
   saida: window.aleaPagamento { disponivel(), montar(), desmontar(), pagar(), consultar() }; quem desenha a tela é o loja-compra.js
   status: prévia (25/09/2026) — no ar só liga quando o servidor da conta devolver "pagamento" no /api/config
   validado_em: 2026-09-25 (prévia /pagamento/, MP em modo TESTE: cartão aprovado, recusado e Pix com QR)
*/
/* =============================================================================
   loja-pagamento.js — "Pix + cartão dentro do site, com a marca do MP escondida" (Cassiano, 23/09/2026 23h51)
   =============================================================================
   COMO FUNCIONA (e por que o número do cartão nunca passa pela ālea):
     1. O Brick é um formulário do Mercado Pago desenhado DENTRO da página, com as cores da ālea. Os campos
        do cartão são "campos seguros" do MP: o número vira um TOKEN de uso único no próprio navegador.
     2. O site manda pro servidor da ālea só o token + as peças + os dados da compra.
     3. O servidor RECALCULA o valor pela tabela de preço (o preço que o navegador manda não vale) e cria o
        pagamento com a chave secreta, que nunca sai de lá.
   ONDE ELE LIGA:
     - no AR: só quando o servidor da conta (api_conta) devolver "pagamento" no /api/config. Hoje o ar roda a
       conta v1, que não devolve — então o ar continua EXATAMENTE como está (pedido pelo WhatsApp).
     - na PRÉVIA (github.io): usa `api_pagamento_previa` do config.js, a instância de TESTE do servidor
       (chaves de teste do MP: nada é cobrado de verdade).
   ========================================================================== */
(function () {
  'use strict';

  var C = window.ALEA || {};
  var host = location.hostname;
  var NA_PREVIA = /github\.io$/.test(host) || host === 'localhost' || host === '127.0.0.1' || host === '';
  var API = String((NA_PREVIA ? C.api_pagamento_previa : C.api_conta) || '').replace(/\/+$/, '');

  /* O TEMA APROVADO ("alea_fundo", 24/09/2026 22h37 — brick_alea.py em …\03_site\_mercado_pago_layout_2026-09-24\).
     Mudou aqui = mudou o que ele aprovou: mexer só com o "pode" dele. */
  var TEMA = {
    baseColor: '#924429', baseColorFirstVariant: '#7A3822', baseColorSecondVariant: '#B0583A',
    textPrimaryColor: '#2B2118', textSecondaryColor: '#8A7D70', formBackgroundColor: 'rgba(0,0,0,0)',
    inputBackgroundColor: '#FFFFFF', outlinePrimaryColor: '#CFC5B6', outlineSecondaryColor: '#E3DBCF',
    buttonTextColor: '#F6F3EE', borderRadiusSmall: '4px', borderRadiusMedium: '6px', borderRadiusLarge: '8px'
  };

  var cfgPromessa = null;
  var sdkPromessa = null;
  var mp = null;
  var controle = null;

  function disponivel() {
    if (!API) return Promise.resolve(null);
    if (!cfgPromessa) {
      cfgPromessa = fetch(API + '/api/config', { credentials: 'omit' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) { return j && j.pagamento && j.pagamento.mp_public_key ? j.pagamento : null; })
        .catch(function () { return null; });
    }
    return cfgPromessa;
  }

  function carregarSdk() {
    if (window.MercadoPago) return Promise.resolve();
    if (!sdkPromessa) {
      sdkPromessa = new Promise(function (ok, falha) {
        var s = document.createElement('script');
        s.src = 'https://sdk.mercadopago.com/js/v2';
        s.onload = ok; s.onerror = function () { sdkPromessa = null; falha(new Error('sdk')); };
        document.head.appendChild(s);
      });
    }
    return sdkPromessa;
  }

  function desmontar() {
    if (controle) { try { controle.unmount(); } catch (e) { /* já saiu */ } }
    controle = null;
  }

  /* opcoes: { alvoId, valor, pagador:{email,nome,sobrenome,cpf}, aoEnviar(selecionado, formData) -> Promise, aoPronto, aoErro } */
  function montar(opcoes) {
    desmontar();
    return disponivel().then(function (cfg) {
      if (!cfg) throw new Error('desligado');
      return carregarSdk().then(function () {
        if (!mp) mp = new window.MercadoPago(cfg.mp_public_key, { locale: 'pt-BR' });
        var p = opcoes.pagador || {};
        return mp.bricks().create('payment', opcoes.alvoId, {
          initialization: {
            amount: opcoes.valor,
            payer: { email: p.email || '', firstName: p.nome || '', lastName: p.sobrenome || '',
                     identification: p.cpf ? { type: 'CPF', number: String(p.cpf).replace(/\D/g, '') } : undefined }
          },
          customization: {
            paymentMethods: { creditCard: 'all', bankTransfer: ['pix'], maxInstallments: cfg.parcelas_max || 12 },
            visual: { style: { customVariables: TEMA } }
          },
          callbacks: {
            onReady: function () { if (opcoes.aoPronto) opcoes.aoPronto(); },
            onSubmit: function (sel) { return opcoes.aoEnviar(sel.selectedPaymentMethod, sel.formData || {}); },
            onError: function (e) { if (opcoes.aoErro) opcoes.aoErro(e); }
          }
        }).then(function (c) { controle = c; return c; });
      });
    });
  }

  function chamar(metodo, caminho, corpo) {
    return fetch(API + caminho, {
      method: metodo,
      credentials: NA_PREVIA ? 'omit' : 'include',          // no ar, o pedido de quem está logado vai pra conta dele
      headers: corpo ? { 'Content-Type': 'application/json', 'X-Alea': '1' } : { 'X-Alea': '1' },
      body: corpo ? JSON.stringify(corpo) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) { var e = new Error(j.detail && typeof j.detail === 'string' ? j.detail : 'Não foi possível concluir o pagamento.'); e.status = r.status; throw e; }
        return j;
      });
    });
  }

  function pagar(corpo) { return chamar('POST', '/api/pagamento', corpo); }
  function consultar(numero, chave) {
    return chamar('GET', '/api/pagamento/' + encodeURIComponent(numero) + '?chave=' + encodeURIComponent(chave));
  }

  /* o que o banco respondeu, em português de gente (o código cru fica no pedido do servidor) */
  var RECUSA = {
    rejected_by_issuer: 'O banco do cartão recusou o pagamento. Tente outro cartão ou pague com Pix.',
    cc_rejected_insufficient_amount: 'O cartão não tem limite para este valor. Tente outro cartão ou pague com Pix.',
    cc_rejected_bad_filled_security_code: 'O código de segurança não confere. Confira e tente de novo.',
    cc_rejected_bad_filled_date: 'A data de vencimento não confere. Confira e tente de novo.',
    cc_rejected_call_for_authorize: 'O banco pede que você autorize este pagamento com ele antes. Depois, tente de novo.'
  };
  function motivo(detalhe) {
    return RECUSA[detalhe] || 'O pagamento não foi aprovado. Confira os dados, tente outro cartão ou pague com Pix.';
  }

  window.aleaPagamento = {
    naPrevia: NA_PREVIA, disponivel: disponivel, montar: montar, desmontar: desmontar,
    pagar: pagar, consultar: consultar, motivo: motivo
  };
})();
