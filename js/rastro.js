/* CATALOGO:
   nome: rastro
   categoria: UTIL
   objetivo: A MEMÓRIA DA VISITA. Pergunta uma vez se pode lembrar o que a pessoa viu; com o "pode", soma no aparelho quanto tempo cada peça ficou na tela, onde o mouse parou, que foto arrastou, o que foi pro carrinho, de onde veio (anúncio, termo pesquisado) — e manda em lotes pro servidor da conta.
   entrada: DOM do feed e das páginas de produto; window.ALEA.api_conta; parâmetros utm_* e gclid da URL
   saida: lotes em POST /api/rastro (text/plain, sendBeacon na saída); window.aleaRastro
   status: ativo (só carrega com api_conta preenchido — ver site.js, carregarConta)
   validado_em: 2026-09-22 (Playwright contra o servidor local, ZELES/Conta_Cliente/02_testes)
*/
/* =============================================================================
   rastro.js — a memória da visita
   =============================================================================
   A REGRA QUE NÃO SE MEXE: SEM "PODE", NADA SAI DO APARELHO.
   Antes do aceite, este arquivo só guarda NO APARELHO de onde a pessoa chegou (o
   anúncio e o termo pesquisado vêm na URL e somem na próxima página). Nenhum lote é
   montado, nenhum identificador é criado.

   O QUE SE GRAVA É JÁ SOMADO. Nada de coordenada de mouse nem de vídeo da tela: o que
   interessa pra "mostrar de novo quando ele voltar" e pra calibrar anúncio é QUAL peça
   prendeu a atenção e POR QUANTO TEMPO. É menos dado, e é o dado certo.

   NO CELULAR NÃO EXISTE MOUSE. 3 em cada 4 visitas vêm de celular (StatCounter, Brasil,
   agosto de 2026: Android 75,45%). Por isso o sinal principal é o TEMPO NA TELA (a peça
   visível em pelo menos 60%); o mouse parado é um sinal a mais, só no computador.

   O NOME DO PET QUE A PESSOA DIGITA NÃO ENTRA AQUI. Só o fato de ter personalizado.
   ========================================================================== */
(function () {
  'use strict';

  var C = window.ALEA || {};
  if (!C.api_conta) return;
  var API = String(C.api_conta).replace(/\/+$/, '');

  var K_CONSENT = 'alea_consent_v1';     // {personalizar: bool, em: iso}
  var K_VISITANTE = 'alea_visitante_v1'; // uuid, só nasce com o aceite
  var K_ORIGEM = 'alea_origem_v1';       // sessionStorage: de onde veio nesta visita

  function ler(area, k) { try { var v = area.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function gravar(area, k, v) { try { area.setItem(k, JSON.stringify(v)); } catch (e) { /* aba anônima */ } }

  /* ------------------------------------------------ de onde veio (fica no aparelho) */
  (function guardarOrigem() {
    if (ler(sessionStorage, K_ORIGEM)) return;
    var q = new URLSearchParams(location.search);
    var o = {
      source: q.get('utm_source'), medium: q.get('utm_medium'), campaign: q.get('utm_campaign'),
      /* O TERMO QUE ELE PESQUISOU NO GOOGLE. O Google não põe a busca na URL sozinho: é o
         anúncio que manda, com {keyword} no "sufixo do URL final" da campanha
         (utm_term={keyword}). Sem isso configurado no Ads, este campo chega vazio. */
      term: q.get('utm_term'),
      gclid: q.get('gclid') || q.get('gbraid') || q.get('wbraid'),
      referrer: (document.referrer && document.referrer.indexOf(location.host) === -1) ? document.referrer : null
    };
    gravar(sessionStorage, K_ORIGEM, o);
  })();

  function consent() { return ler(localStorage, K_CONSENT); }
  function aceitou() { var c = consent(); return !!(c && c.personalizar); }

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = new Uint8Array(16);
    crypto.getRandomValues(b);
    b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    var h = Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }
  function visitante() {
    if (!aceitou()) return null;
    var v = ler(localStorage, K_VISITANTE);
    if (!v) { v = uuid(); gravar(localStorage, K_VISITANTE, v); }
    return v;
  }

  /* ----------------------------------------------------------------- a fila */
  var fila = [];
  var somas = {};          // "tipo|alvo|pag" -> ms somados desde o último envio

  function evento(t, alvo, extra) {
    if (!aceitou()) return;
    var e = { t: t, alvo: alvo || null, pag: pagina() };
    if (extra) for (var k in extra) e[k] = extra[k];
    fila.push(e);
    if (fila.length >= 40) enviar(false);
  }
  function somar(t, alvo, ms, pag) {
    if (!aceitou() || !alvo || ms < 250) return;       // piscada de rolagem não conta
    var k = t + '|' + alvo + '|' + (pag || pagina());
    somas[k] = (somas[k] || 0) + ms;
  }
  function pagina() { return location.pathname.replace(/^.*\//, '') || 'index.html'; }

  function enviar(saindo) {
    if (!aceitou()) { fila = []; somas = {}; return; }
    Object.keys(somas).forEach(function (k) {
      var p = k.split('|');
      fila.push({ t: p[0], alvo: p[1], ms: Math.round(somas[k]), pag: p[2] });
    });
    somas = {};
    if (!fila.length) return;
    var lote = JSON.stringify({ v: visitante(), consent: true, eventos: fila.splice(0, 60),
                                origem: ler(sessionStorage, K_ORIGEM) || {} });
    var url = API + '/api/rastro';
    /* text/plain: é "pedido simples" pro navegador, sem pré-voo de CORS — é o único
       jeito de o sendBeacon da saída da página chegar. */
    if (saindo && navigator.sendBeacon) {
      try { navigator.sendBeacon(url, new Blob([lote], { type: 'text/plain' })); return; } catch (e) { /* cai pro fetch */ }
    }
    try {
      fetch(url, { method: 'POST', body: lote, credentials: 'include', keepalive: true,
                   headers: { 'Content-Type': 'text/plain' } }).catch(function () {});
    } catch (e) { /* sem rede: perde o lote, nunca quebra a página */ }
  }
  setInterval(function () { if (!document.hidden) enviar(false); }, 15000);
  document.addEventListener('visibilitychange', function () { if (document.hidden) { fecharRelogios(); enviar(true); } });
  window.addEventListener('pagehide', function () { fecharRelogios(); enviar(true); });

  /* ------------------------------------------------ relógios (tempo na tela / mouse) */
  var relogios = {};   // chave -> {t, alvo, pag, desde}
  function ligarRelogio(chave, tipo, alvo, pag) {
    if (relogios[chave] || document.hidden) return;
    relogios[chave] = { t: tipo, alvo: alvo, pag: pag, desde: performance.now() };
  }
  function pararRelogio(chave) {
    var r = relogios[chave];
    if (!r) return;
    somar(r.t, r.alvo, performance.now() - r.desde, r.pag);
    delete relogios[chave];
  }
  /* aba escondida (trocou de app, bloqueou a tela) PARA os relógios; quando volta, eles
     recomeçam do zero. Sem isso, o celular no bolso contaria como "olhando a peça". */
  var reabrir = [];
  function fecharRelogios() {
    Object.keys(relogios).forEach(function (k) {
      reabrir.push([k, relogios[k]]);
      pararRelogio(k);
    });
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) return;
    reabrir.splice(0).forEach(function (p) { ligarRelogio(p[0], p[1].t, p[1].alvo, p[1].pag); });
  });

  /* ------------------------------------------------------------- o feed da home */
  function slugDoItem(art) {
    var a = art.querySelector('a.ver');
    var m = a && /produto-([^.]+)\.html/.exec(a.getAttribute('href') || '');
    return m ? m[1] : null;
  }
  function vitrineDoItem(art) {
    var i = parseInt(art.getAttribute('data-i'), 10);
    var cat = (location.hash || '').replace('#', '');
    var lista = (window.VITRINE || []).filter(function (c) { return !cat || c.categoria === cat; });
    return lista[i] ? ('feed:' + lista[i].nome) : 'feed';
  }

  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entradas) {
    entradas.forEach(function (en) {
      var art = en.target, slug = slugDoItem(art);
      if (!slug) return;
      var chave = 'tela:' + slug + ':' + art.getAttribute('data-i');
      if (en.isIntersecting && en.intersectionRatio >= 0.6) ligarRelogio(chave, 'produto_tela', slug, vitrineDoItem(art));
      else pararRelogio(chave);
    });
  }, { threshold: [0, 0.6, 1] }) : null;

  var mouseFino = window.matchMedia && matchMedia('(pointer: fine)').matches;

  function observarFeed() {
    var palco = document.getElementById('feed');
    if (!palco) return;
    function ligarItens() {
      Array.prototype.forEach.call(palco.querySelectorAll('article.item:not([data-rastro])'), function (art) {
        art.setAttribute('data-rastro', '1');
        if (io) io.observe(art);
        var slug = slugDoItem(art);
        if (!slug) return;
        if (mouseFino) {
          var alvo = art.querySelector('.objeto') || art;
          var chave = 'mouse:' + slug + ':' + art.getAttribute('data-i');
          alvo.addEventListener('mouseenter', function () { ligarRelogio(chave, 'produto_mouse', slug, vitrineDoItem(art)); });
          alvo.addEventListener('mouseleave', function () { pararRelogio(chave); });
        }
      });
    }
    ligarItens();
    /* o feed é redesenhado a cada troca de categoria; e a foto em destaque troca de classe
       quando a pessoa arrasta — os dois aparecem aqui */
    new MutationObserver(function (muts) {
      var novos = false;
      muts.forEach(function (m) {
        if (m.type === 'childList') novos = true;
        if (m.type === 'attributes' && m.target.tagName === 'IMG' && m.target.classList.contains('ativa') &&
            m.oldValue && m.oldValue.indexOf('ativa') === -1) {
          var art = m.target.closest('article.item');
          var slug = art && slugDoItem(art);
          if (slug) {
            var imgs = art.querySelectorAll('.objeto img');
            evento('foto', slug, { valor: Array.prototype.indexOf.call(imgs, m.target) + 1 });
          }
        }
      });
      if (novos) ligarItens();
    }).observe(palco, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });
  }

  /* -------------------------------------------------------- a página de produto */
  function observarProduto() {
    var botao = document.querySelector('[data-slug]');
    if (!botao || document.getElementById('feed')) return;
    var slug = botao.getAttribute('data-slug');
    evento('produto_pagina', slug);
    ligarRelogio('pagina:' + slug, 'produto_tela', slug, 'pagina');
    var jaPersonalizou = false;
    document.addEventListener('change', function (e) {
      if (jaPersonalizou || !e.target.closest('[data-personalizar]')) return;
      jaPersonalizou = true;
      evento('personalizou', slug);        // o QUE foi digitado não sai daqui
    });
  }

  /* ----------------------------------------------------- carrinho, WhatsApp, rolagem */
  function observarCompra() {
    var car = window.aleaCarrinho;
    if (car && !car._rastro) {
      car._rastro = true;
      var adicionar = car.adicionar;
      car.adicionar = function (item) {
        evento('carrinho', item && item.slug, { valor: item && item.preco });
        return adicionar.apply(this, arguments);
      };
    }
    document.addEventListener('click', function (e) {
      var z = e.target.closest('.zap[href]');
      if (z) evento('whatsapp', z.getAttribute('data-assunto') || 'geral');
    }, true);
  }

  var rolagemMax = 0;
  window.addEventListener('scroll', function () {
    var alto = document.documentElement.scrollHeight - innerHeight;
    if (alto > 0) rolagemMax = Math.max(rolagemMax, Math.round(100 * scrollY / alto));
  }, { passive: true });
  window.addEventListener('pagehide', function () {
    if (rolagemMax) { evento('rolagem', null, { valor: rolagemMax }); rolagemMax = 0; }
  });
  window.addEventListener('hashchange', function () {
    var cat = (location.hash || '').replace('#', '');
    if (cat) evento('categoria', cat);
  });

  /* ------------------------------------------------------------- o aviso (uma vez) */
  function mostrarAviso() {
    if (consent() || document.getElementById('aviso-memoria')) return;
    var a = document.createElement('div');
    a.id = 'aviso-memoria';
    a.className = 'aviso-memoria';
    a.setAttribute('role', 'dialog');
    a.setAttribute('aria-label', 'Lembrar sua visita');
    a.innerHTML =
      '<p>Posso lembrar as peças que você viu, pra te mostrar de novo quando voltar? ' +
      '<a href="privacidade.html#memoria">Como funciona</a></p>' +
      '<div><button type="button" class="botao" data-memoria="1">Pode</button>' +
      '<button type="button" class="botao contorno" data-memoria="0">Agora não</button></div>';
    document.body.appendChild(a);
    a.addEventListener('click', function (e) {
      var b = e.target.closest('[data-memoria]');
      if (!b) return;
      decidir(b.getAttribute('data-memoria') === '1', 'aviso');
    });
    requestAnimationFrame(function () { a.classList.add('visivel'); });
  }

  function decidir(sim, deOnde) {
    gravar(localStorage, K_CONSENT, { personalizar: !!sim, em: new Date().toISOString(), de: deOnde });
    var a = document.getElementById('aviso-memoria');
    if (a) a.remove();
    if (sim) iniciarMemoria();
    else { fila = []; somas = {}; relogios = {}; }
    document.dispatchEvent(new CustomEvent('alea:memoria', { detail: { personalizar: !!sim } }));
  }

  var jaComecou = false;
  function iniciarMemoria() {
    if (jaComecou || !aceitou()) return;
    jaComecou = true;
    evento('pagina', pagina() + (location.hash || ''));
    observarFeed();
    observarProduto();
  }

  /* O aviso espera a pessoa MEXER no site: na home a abertura é uma animação, e um aviso
     por cima dela na primeira batida de olho seria a pior entrada possível. */
  function agendarAviso() {
    if (consent()) return;
    var feito = false;
    var abrir = function () {
      if (feito) return; feito = true;
      ['scroll', 'pointerdown', 'keydown'].forEach(function (ev) { removeEventListener(ev, abrir, true); });
      setTimeout(mostrarAviso, 2500);
    };
    ['scroll', 'pointerdown', 'keydown'].forEach(function (ev) { addEventListener(ev, abrir, { capture: true, passive: true }); });
  }

  window.aleaRastro = {
    aceitou: aceitou,
    visitante: visitante,
    decidir: decidir,
    enviarAgora: function () { enviar(false); },
    evento: evento,
    api: API
  };

  observarCompra();
  if (aceitou()) iniciarMemoria(); else agendarAviso();
})();
