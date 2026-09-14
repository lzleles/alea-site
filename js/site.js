/* =============================================================================
   site.js — o que vale em TODA página (vitrine, produto, textos)
   =============================================================================
   Liga os botões de WhatsApp, preenche os campos vindos do config.js e, se o número
   não existir, desliga tudo e avisa uma vez só.

   A TRAVA QUE NÃO SE MEXE
   -----------------------
   Sem número no `config.js`, NADA vira link. Os botões saem desabilitados, com uma
   tarja no topo explicando. Melhor um botão apagado e honesto do que um `wa.me` sem
   número, que abre o WhatsApp em branco e faz o visitante achar que o site quebrou.

   E A ORDEM
   ---------
   Quem desenha conteúdo (a vitrine, as páginas geradas) avisa quando terminou, e só
   então os botões são ligados. Ligar antes deixa botão sem href — foi o defeito pego
   no site da Negocie em 10/09/2026, e ele só aparece conferindo o href NO AR.
   ========================================================================== */

(function () {
  'use strict';

  var C = window.ALEA || {};
  var temZap = /^\d{12,13}$/.test(String(C.whatsapp || ''));

  window.aleaDinheiro = function (v) {
    if (v === null || v === undefined) return null;
    return 'R$ ' + v.toFixed(2).replace('.', ',');
  };

  function linkZap(assunto) {
    var texto = (C.mensagem || 'Oi! Vim pelo site.').replace('{produto}', assunto);
    return 'https://wa.me/' + C.whatsapp + '?text=' + encodeURIComponent(texto);
  }

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

  function preencherContato() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-campo]'), function (el) {
      var v = C[el.getAttribute('data-campo')];
      if (v) el.textContent = v;
    });
    var ano = document.getElementById('ano');
    if (ano) ano.textContent = new Date().getFullYear();
  }

  function iniciar() {
    preencherContato();
    window.aleaLigarBotoes();     // as páginas de produto já nascem prontas no HTML
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
