/* =============================================================================
   vitrine.js — a home: uma peça por tela, fundo que vira preto, toque que avança
   =============================================================================
   Desenhado a partir do que o Cassiano pediu em 14/09/2026 (áudios de 14:14 a 14:15):

     "a tela tem que ser branca mesmo pra combinar com a paleta […] mas a partir da
      hora que o cara rola a tela aí ela fica preta […] mais destaque pra foto"
     "você nunca consegue ver duas imagens ao mesmo tempo"
     "um toque, próximo produto"
     "só o produto e nome"

   COMO O EMPILHAMENTO FUNCIONA (e por que não é scroll sequestrado)
   ----------------------------------------------------------------
   Cada cena é `position: sticky; top: 0` com a altura da janela. Elas ficam na ordem
   natural do documento, então a rolagem é a rolagem de verdade do navegador: a cena
   seguinte sobe por cima e cobre a anterior inteira. Ninguém intercepta a roda do
   mouse nem o dedo.

   Isso importa por dois motivos. O visitante mantém a barra de rolagem, o Ctrl+F e a
   inércia do celular — e o Google trata navegação frustrante como Experiência de
   Destino ruim, o que encarece o clique. O efeito que ele quer sai de graça do
   comportamento nativo.

   O TOQUE
   -------
   No celular, tocar em qualquer lugar da cena leva pra próxima. A ETIQUETA (nome e
   preço) é um link e abre a página do produto — por isso ela cancela o avanço.
   ========================================================================== */

(function () {
  'use strict';

  function moeda(v) {
    return (window.aleaDinheiro && window.aleaDinheiro(v)) || 'Sob consulta';
  }

  function desenhar() {
    var palco = document.getElementById('palco');
    var lista = window.VITRINE || [];
    if (!palco || !lista.length) return 0;

    var mostrarPreco = (window.ALEA || {}).mostrar_preco_na_vitrine !== false;

    lista.forEach(function (c, i) {
      var sec = document.createElement('section');
      sec.className = 'cena';
      sec.setAttribute('data-cena', String(i + 1));
      var preco = c.preco === null ? 'Sob consulta' : moeda(c.preco);
      sec.innerHTML =
        '<div class="moldura" data-distorcao data-forca="0.30" tabindex="0" role="img" ' +
             'aria-label="' + c.produto + ' personalizado para ' + c.nome + '">' +
          '<img src="img/produtos/' + c.a + '.jpg" width="1200" height="1200" ' +
               (i === 0 ? 'fetchpriority="high"' : 'loading="lazy"') + ' decoding="async" ' +
               'alt="' + c.produto + ' com o nome ' + c.nome + '">' +
          '<img src="img/produtos/' + c.b + '.jpg" width="1200" height="1200" loading="lazy" ' +
               'decoding="async" alt="A mesma peça de ' + c.nome + ', em outro ângulo">' +
          '<a class="etiqueta" href="produto-' + c.pagina + '.html">' +
            '<span>' +
              '<span class="produto-mini">' + c.produto + '</span><br>' +
              '<span class="nome">' + c.nome + '</span>' +
            '</span>' +
            (mostrarPreco ? '<span class="valor">' + preco + '</span>' : '') +
          '</a>' +
        '</div>';
      palco.appendChild(sec);
    });
    return lista.length;
  }

  function ligarComportamento(quantasCenas) {
    var cenas = Array.prototype.slice.call(document.querySelectorAll('.cena'));
    var capa = document.querySelector('.cena.capa');
    var role = document.querySelector('.role');
    var contador = document.getElementById('contador');
    var botao = document.getElementById('avancar');
    var total = cenas.length;

    /* 1) O FUNDO VIRA PRETO. A conta é a posição da rolagem contra a altura da capa:
          enquanto a capa ocupa a tela, claro; passou dela, escuro. Uma classe só, e a
          transição de cor mora no CSS — JS não anima cor aqui. */
    var alturaCapa = capa ? capa.offsetHeight : window.innerHeight;
    var escuro = false;
    function conferirFundo() {
      var deveEscurecer = window.scrollY > alturaCapa * 0.55;
      if (deveEscurecer !== escuro) {
        escuro = deveEscurecer;
        document.body.classList.toggle('escuro', escuro);
      }
      if (role) role.classList.toggle('some', window.scrollY > 40);
    }

    /* 2) O CONTADOR. Qual cena está ocupando a tela agora. */
    var atual = 1;
    if (contador && total) {
      var obs = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          var n = parseInt(e.target.getAttribute('data-cena') || '0', 10);
          if (!n) return;
          atual = n;
          contador.textContent = String(n).padStart(2, '0') + ' / ' + String(quantasCenas).padStart(2, '0');
        });
      }, { threshold: 0.55 });
      cenas.forEach(function (c) { if (c.hasAttribute('data-cena')) obs.observe(c); });
    }

    /* 3) AVANÇAR. O índice vem da POSIÇÃO REAL da rolagem, não de um contador que a
          gente incrementa: se o visitante rolar com o dedo e depois tocar, um contador
          próprio estaria dessincronizado e o toque pularia pra cena errada. */
    function proxima() {
      var y = window.scrollY;
      var alvo = cenas.find(function (c) { return c.offsetTop > y + 8; });
      if (alvo) {
        window.scrollTo({ top: alvo.offsetTop, behavior: 'smooth' });
      } else {
        var rodape = document.querySelector('.rodape');
        if (rodape) window.scrollTo({ top: rodape.offsetTop, behavior: 'smooth' });
      }
    }

    if (botao) botao.addEventListener('click', proxima);

    /* "um toque, próximo produto" — só onde não existe mouse. No desktop, clique em
       foto que avança a página é comportamento surpreendente, e surpresa aqui é atrito. */
    var temMouse = window.matchMedia && window.matchMedia('(hover: hover)').matches;
    if (!temMouse) {
      document.querySelectorAll('.cena').forEach(function (c) {
        c.addEventListener('click', function (e) {
          if (e.target.closest('a, button')) return;   // etiqueta e botões seguem o seu caminho
          proxima();
        });
      });
    }

    /* teclado: seta pra baixo / espaço já rolam sozinhos (é rolagem nativa); aqui só
       o atalho de pular cena inteira, que a rolagem nativa não dá. */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'PageDown') { e.preventDefault(); proxima(); }
    });

    window.addEventListener('scroll', conferirFundo, { passive: true });
    window.addEventListener('resize', function () {
      alturaCapa = capa ? capa.offsetHeight : window.innerHeight;
      conferirFundo();
    });
    conferirFundo();
  }

  function iniciar() {
    var quantas = desenhar();
    ligarComportamento(quantas);
    if (window.aleaLigarBotoes) window.aleaLigarBotoes();

    /* AVISA QUE A VITRINE EXISTE.
       O distorcao.js precisa saber a hora certa de procurar as molduras: elas nascem
       AQUI, em JavaScript, e não no HTML. Sem este aviso ele procura cedo demais, não
       acha nada, e o efeito — que é o pedido original — simplesmente não acontece.
       Foi o defeito medido em 14/09/2026, o mesmo erro de ordem da Negocie. */
    window.__aleaVitrinePronta = true;
    document.dispatchEvent(new CustomEvent('alea:vitrine-pronta'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
