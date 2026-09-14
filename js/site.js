/* =============================================================================
   site.js — monta a vitrine e liga os botões de compra
   =============================================================================

   ORDEM QUE NÃO PODE INVERTER
   ---------------------------
   1) desenha as grades  →  2) SÓ ENTÃO liga os links de WhatsApp.
   Se inverter, os botões que nasceram no passo 1 ficam sem href e viram LINK MORTO.
   Foi exatamente esse o defeito pego no site da Negocie em 10/09/2026, e ele só
   apareceu conferindo o href NO AR — no disco o código parecia certo.

   A OUTRA TRAVA
   -------------
   Se `config.js` estiver com o whatsapp vazio, NADA vira link. Os botões saem
   desabilitados, com um aviso visível dizendo o que falta. Melhor um botão
   apagado e honesto do que um wa.me sem número, que abre o WhatsApp em branco
   e faz o visitante achar que o site está quebrado.
   ========================================================================== */

(function () {
  'use strict';

  var C = window.ALEA || {};
  var temZap = /^\d{12,13}$/.test(String(C.whatsapp || ''));

  function dinheiro(v) {
    if (v === null || v === undefined) return null;
    return 'R$ ' + v.toFixed(2).replace('.', ',');
  }

  function linkZap(assunto) {
    var texto = (C.mensagem || 'Oi! Vim pelo site.').replace('{produto}', assunto);
    return 'https://wa.me/' + C.whatsapp + '?text=' + encodeURIComponent(texto);
  }

  /* ---------------------------------------------------------------- vitrine */
  function desenharPersonalizacoes() {
    var alvo = document.getElementById('grade-personas');
    var lista = window.PERSONALIZACOES || [];
    if (!alvo) return;

    if (!lista.length) {
      alvo.outerHTML = '<p class="subtitulo">Estamos preparando a vitrine. ' +
        'Fale comigo que eu te mando as opções na hora.</p>';
      return;
    }

    lista.forEach(function (p) {
      var fig = document.createElement('figure');
      fig.className = 'persona';
      fig.style.margin = '0';
      fig.innerHTML =
        '<div class="quadro" data-distorcao data-forca="0.28" tabindex="0" ' +
             'role="img" aria-label="Comedouro ālea personalizado para ' + p.nome +
             ', estampa ' + p.estampa.toLowerCase() + '">' +
          '<img src="img/produtos/' + p.a + '_a_m.jpg" width="700" height="700" loading="lazy" ' +
               'decoding="async" alt="Comedouro ālea com o nome ' + p.nome + '">' +
          '<img src="img/produtos/' + p.b + '_b_m.jpg" width="700" height="700" loading="lazy" ' +
               'decoding="async" alt="O mesmo comedouro de ' + p.nome + ' em uso, com o cão">' +
          '<span class="dica-hover">passe o mouse</span>' +
        '</div>' +
        '<figcaption><span class="nome">' + p.nome + '</span>' +
        '<span class="estampa">' + p.estampa + '</span></figcaption>';
      alvo.appendChild(fig);
    });
  }

  /* ---------------------------------------------------------------- produtos */
  function desenharProdutos() {
    var alvo = document.getElementById('grade-produtos');
    var lista = window.PRODUTOS || [];
    if (!alvo || !lista.length) return;

    lista.forEach(function (p) {
      var preco = dinheiro(p.preco);
      var art = document.createElement('article');
      art.className = 'produto';
      art.id = p.id;
      art.innerHTML =
        '<img src="' + p.imagem + '" width="1200" height="900" loading="lazy" decoding="async" ' +
             'alt="' + p.alt + '">' +
        '<div class="corpo">' +
          '<span class="linha">' + p.linha + '</span>' +
          '<h3>' + p.nome + '</h3>' +
          '<p>' + p.resumo + '</p>' +
          '<p>' + p.detalhe + '</p>' +
          '<div class="preco">' +
            (preco ? preco + ' <small>+ frete</small>' : '<small>Sob consulta</small>') +
          '</div>' +
          '<a class="botao zap" data-assunto="' + p.nome +
            (preco ? ' (' + preco + ')' : '') + '">Pedir pelo WhatsApp</a>' +
        '</div>';
      alvo.appendChild(art);
    });
  }

  /* ------------------------------------------------------- liga (ou desliga) */
  function ligarBotoes(raiz) {
    var botoes = (raiz || document).querySelectorAll('.zap');
    Array.prototype.forEach.call(botoes, function (b) {
      var assunto = b.getAttribute('data-assunto') || 'os produtos da ālea';
      if (temZap) {
        b.setAttribute('href', linkZap(assunto));
        b.setAttribute('target', '_blank');
        b.setAttribute('rel', 'noopener');
        b.addEventListener('click', marcarConversao);
        return;
      }
      /* sem número: desabilita de verdade */
      b.removeAttribute('href');
      b.setAttribute('aria-disabled', 'true');
      b.setAttribute('title', 'WhatsApp ainda não configurado');
    });
    if (!temZap && botoes.length) avisarUmaVez(botoes.length);
  }

  /* O aviso aparece UMA vez, numa tarja no topo — não um por botão.
     Um aviso por botão era honesto e ficava feio: dobrava a altura de cada cartão
     e o cliente via o recado técnico antes de ver o produto. A tarja diz a mesma
     coisa, uma vez só, e some sozinha quando o número entrar no config. */
  function avisarUmaVez(quantos) {
    if (document.getElementById('tarja-config')) return;
    var t = document.createElement('div');
    t.id = 'tarja-config';
    t.className = 'tarja-config';
    t.innerHTML = '<strong>Site em configuração.</strong> Falta o WhatsApp comercial da ' +
      'ālea em <code>js/config.js</code> — por isso os ' + quantos + ' botões de compra ' +
      'estão desligados de propósito, em vez de virarem link morto.';
    document.body.insertBefore(t, document.body.firstChild);
    document.documentElement.classList.add('com-tarja');
  }

  /* Conversão do Google Ads. Só dispara se o id estiver preenchido — assim a página
     não carrega script de terceiro nenhum enquanto não houver campanha. */
  function marcarConversao() {
    if (!C.conversao_whatsapp || typeof window.gtag !== 'function') return;
    window.gtag('event', 'conversion', { send_to: C.conversao_whatsapp });
  }

  function preencherContato() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-campo]'), function (el) {
      var v = C[el.getAttribute('data-campo')];
      if (v) el.textContent = v;
    });
    var ig = document.querySelectorAll('[data-instagram]');
    Array.prototype.forEach.call(ig, function (el) {
      var conta = C[el.getAttribute('data-instagram')];
      if (conta) el.setAttribute('href', 'https://www.instagram.com/' + conta + '/');
    });
    var ano = document.getElementById('ano');
    if (ano) ano.textContent = new Date().getFullYear();
  }

  function iniciar() {
    desenharPersonalizacoes();
    desenharProdutos();
    ligarBotoes();          // <- depois de desenhar. Sempre.
    preencherContato();

    /* AVISA QUE A VITRINE EXISTE.
       O distorcao.js precisa saber a hora certa de procurar os cartões: os 6 cartões
       de personalização nascem AQUI, em JavaScript, e não no HTML. Sem este aviso ele
       procura cedo demais, acha só os 2 quadros fixos e o efeito — que é o pedido
       inteiro do cliente — não acontece na grade. Foi o defeito medido em 14/09/2026,
       e é o mesmo erro de ordem que já tinha mordido no site da Negocie. */
    window.__aleaVitrinePronta = true;
    document.dispatchEvent(new CustomEvent('alea:vitrine-pronta'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
