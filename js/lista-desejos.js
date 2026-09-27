/* CATALOGO:
   nome: lista-desejos
   categoria: UTIL
   objetivo: Desenha a página lista-de-desejos.html — as peças que a pessoa guardou no coração (foto, nome, preço ou
             "Sob consulta", link pra peça e "remover"), ou a frase curta de lista vazia. Não pede login.
   entrada: window.aleaLoja.desejos (loja-dados.js; a lista mora no aparelho, chave alea_desejos_v1) e window.PRODUTOS
   saida: o conteúdo de <main data-lista-desejos>
   status: prévia (27/09/2026)
   validado_em: 2026-09-27 (Playwright, 1440 e 390: vazia, com 2 peças, remover)
*/
/* =============================================================================
   lista-desejos.js — v1 (27/09/2026, áudio 2300 do Cassiano: o ícone da Lista de Desejos no topo)
   =============================================================================
   POR QUE UMA PÁGINA PRÓPRIA. A lista já existia, mas só DENTRO da Minha Conta (conta.html#/desejos), e lá ela só
   aparece pra quem está logado — quem não entrou via a tela de login. Só que a lista NÃO depende da conta: ela mora no
   aparelho (loja-dados.js, "a conta ainda não tem esse campo"). Então o coração do topo leva a esta página, que mostra a
   mesma lista pra qualquer pessoa, com a MESMA grade (.loja-desejos, loja.css) e o mesmo "remover" da Minha Conta.
   A seção da Minha Conta continua lá, igual. */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function dinheiro(v) { return window.aleaDinheiro ? window.aleaDinheiro(v) : 'R$ ' + Number(v).toFixed(2).replace('.', ','); }

  function pintar() {
    var raiz = document.querySelector('[data-lista-desejos]');
    if (!raiz || !window.aleaLoja) return;
    var ps = window.PRODUTOS || [];
    var l = window.aleaLoja.desejos.lista().map(function (slug) {
      for (var i = 0; i < ps.length; i++) if (ps[i].slug === slug) return ps[i];
      return null;
    }).filter(Boolean);
    raiz.innerHTML = '<h1 class="loja-titulo grande">Lista de Desejos</h1>' + (l.length
      ? '<div class="loja-desejos">' + l.map(function (p) {
          return '<div><a href="produto-' + esc(p.slug) + '.html"><img src="img/produtos/' + esc(p.capa) + '_obj_m.webp" alt="" loading="lazy" ' +
            'onerror="this.onerror=null;this.src=&quot;img/produtos/' + esc(p.capa) + '_m.jpg&quot;">' + esc(p.nome) + '<br>' +
            (p.preco ? dinheiro(p.preco) : 'Sob consulta') + '</a><br>' +
            '<button type="button" class="tirar" data-tirar-desejo="' + esc(p.slug) + '">remover</button></div>';
        }).join('') + '</div>'
      : '<p class="loja-vazio">Sua lista está vazia. Toque no coração na página de uma peça para guardá-la aqui.</p>' +
        '<p class="loja-vazio"><a href="index.html">Ver as peças</a></p>');
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-tirar-desejo]');
    if (!t || !window.aleaLoja) return;
    window.aleaLoja.desejos.alternar(t.getAttribute('data-tirar-desejo'));
    pintar();
  });
  /* outra aba mexeu na lista (coração marcado noutra página) → redesenha */
  window.addEventListener('storage', function (e) { if (e.key === 'alea_desejos_v1') pintar(); });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', pintar); else pintar();
})();
