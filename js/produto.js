/* CATALOGO:
   nome: produto
   categoria: UTIL
   objetivo: Controla galeria, tela cheia, personalização, preço, aceite e inclusão de produtos no carrinho.
   entrada: DOM da página, configuração comercial e dados do produto
   saida: Galeria interativa, item personalizado e comandos para o carrinho
   status: ativo (cabecalho proposto pelo Codex em 2026-09-20, confianca ALTA; conferir na proxima vez que o script rodar)
   validado_em: TBD
*/
/* =============================================================================
   produto.js — o que só a página de produto faz
   =============================================================================
   Tudo aqui saiu de pedido do Cassiano em 15/09/2026 (1ª e 2ª rodadas):

   1. A COLMEIA. "Todas as fotos em miniatura, espalhadas, onde você clica na miniatura
      e ela expande no lugar que ela está, fazendo com que as outras diminuem ao mesmo
      tempo." Quem cresce e encolhe é o CSS; aqui só mora quem está aberto.

   2. A TELA CHEIA (2ª rodada). "Toque novamente para tela cheia" — o segundo toque no
      favo já aberto abre a foto grande, com o fundo da página embaçado, e dá pra rolar
      pros lados. **Passar do fim FECHA, não dá a volta** — foi pedido literal: "quando
      chegar no final e rodar novamente, fechar a tela cheia e não fazer o loop, pro
      cliente ver que é a última foto".

   3. O ADICIONAL "Nome Colorido + R$ 30,00". O campo da cor do nome nasce desligado e
      só abre com o quadrado marcado; o valor entra no preço na hora e vai junto do item
      no carrinho.

   4. OS BOTÕES. "Comprar agora" e, ao lado, a sacola com um "+" — esse é o adicionar ao
      carrinho.

   5. A TRAVA DO ACEITE, agora sem recado fixo na tela: "somente quando clicar em comprar
      agora ou adicionar ao carrinho, tremer os botões e aparecer essa mensagem".

   ⚠️ A TRAVA É DE VERDADE, E NÃO SÓ VISUAL. A conferência acontece DENTRO do clique, e
   é ela que decide se o item entra. Trava que só pinta botão de cinza é trava que o
   primeiro visitante com teclado atravessa — e o que está do outro lado dela é uma
   declaração de consumo que vai junto do pedido.
   ========================================================================== */

(function () {
  'use strict';

  var colmeia = document.querySelector('[data-colmeia]');
  var telacheia = document.querySelector('[data-telacheia]');
  var caixaAceite = document.querySelector('[data-aceite-caixa]');
  var botaoComprar = document.querySelector('[data-comprar-agora]');
  var botaoSacola = document.querySelector('[data-add-carrinho]');
  if (!colmeia && !botaoComprar) return;

  function favos() {
    return colmeia ? Array.prototype.slice.call(colmeia.querySelectorAll('.favo')) : [];
  }
  function fecharFavos() {
    favos().forEach(function (f) {
      f.classList.remove('aberto');
      f.setAttribute('aria-expanded', 'false');
    });
    if (colmeia) colmeia.classList.remove('tem-aberto');
  }

  /* ===================================================================== colmeia */
  if (colmeia) {
    colmeia.addEventListener('click', function (ev) {
      var favo = ev.target.closest('[data-favo]');
      if (!favo) return;
      var n = parseInt(favo.getAttribute('data-favo'), 10);
      /* segundo toque no MESMO favo = tela cheia. Primeiro toque = só expande. */
      if (favo.classList.contains('aberto')) { abrirTelaCheia(n); return; }
      fecharFavos();
      favo.classList.add('aberto');
      favo.setAttribute('aria-expanded', 'true');
      colmeia.classList.add('tem-aberto');
    });
  }

  /* ⚠️ CLICAR EM QUALQUER LUGAR FECHA A MINIATURA AMPLIADA (3ª rodada de 15/09/2026).
     Ele notou a assimetria: na tela cheia, clicar fora fechava; na colmeia, a foto
     ampliada só voltava ao tamanho se clicasse nela de novo — e ninguém adivinha isso.
     O ouvinte é no documento, e sai de cena quando o clique foi DENTRO da colmeia (lá
     o primeiro clique expande e o segundo abre a tela cheia) ou na tela cheia. */
  document.addEventListener('click', function (ev) {
    if (!colmeia || !colmeia.classList.contains('tem-aberto')) return;
    if (ev.target.closest('[data-colmeia]')) return;
    if (ev.target.closest('[data-telacheia]')) return;
    fecharFavos();
  });

  /* =================================================================== tela cheia */
  var fotosGrandes = [];
  try { fotosGrandes = JSON.parse(colmeia && colmeia.getAttribute('data-grandes') || '[]'); }
  catch (e) { fotosGrandes = []; }
  var tcAtual = -1;

  function abrirTelaCheia(n) {
    if (!telacheia || !fotosGrandes.length) return;
    tcAtual = n;
    pintarTelaCheia();
    telacheia.classList.add('aberta');
    telacheia.setAttribute('aria-hidden', 'false');
    document.body.classList.add('travado');
  }

  function fecharTelaCheia() {
    if (!telacheia) return;
    telacheia.classList.remove('aberta');
    telacheia.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('travado');
  }

  function pintarTelaCheia() {
    var palco = telacheia.querySelector('[data-palco-tc]');
    var pontos = telacheia.querySelector('[data-pontos-tc]');
    var conta = telacheia.querySelector('[data-conta-tc]');
    palco.innerHTML = '<img src="' + fotosGrandes[tcAtual] + '" alt="Foto ' +
      (tcAtual + 1) + ' de ' + fotosGrandes.length + '">';
    pontos.innerHTML = fotosGrandes.map(function (_, k) {
      return '<i class="' + (k === tcAtual ? 'on' : '') + '"></i>';
    }).join('');
    conta.textContent = (tcAtual + 1) + ' / ' + fotosGrandes.length;
  }

  /* ⚠️ SEM VOLTA: passar do fim (ou do começo) FECHA em vez de dar a volta. É o pedido
     dele, e a razão é boa — carrossel que gira pra sempre não deixa o visitante saber
     que já viu tudo, e ele fica rodando achando que falta foto. */
  function andarTelaCheia(dir) {
    var n = tcAtual + dir;
    if (n < 0 || n >= fotosGrandes.length) { fecharTelaCheia(); return; }
    tcAtual = n;
    pintarTelaCheia();
  }

  if (telacheia) {
    telacheia.addEventListener('click', function (ev) {
      if (ev.target.closest('[data-fechar-tc]')) { fecharTelaCheia(); return; }
      /* clicar em qualquer lugar que não seja a foto fecha — ele pediu essa saída pra
         quem abriu a tela cheia sem querer */
      if (!ev.target.closest('img')) fecharTelaCheia();
    });

    var tx = null;
    telacheia.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    telacheia.addEventListener('touchmove', function (e) {
      if (tx === null) return;
      var dx = tx - e.touches[0].clientX;
      if (Math.abs(dx) < 40) return;
      tx = null;
      andarTelaCheia(dx > 0 ? 1 : -1);
    }, { passive: true });
    telacheia.addEventListener('touchend', function () { tx = null; }, { passive: true });

    telacheia.addEventListener('wheel', function (e) {
      if (!telacheia.classList.contains('aberta')) return;
      var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(d) < 8) return;
      e.preventDefault();
      andarTelaCheia(d > 0 ? 1 : -1);
    }, { passive: false });
  }

  document.addEventListener('keydown', function (ev) {
    if (telacheia && telacheia.classList.contains('aberta')) {
      if (ev.key === 'Escape') { ev.preventDefault(); fecharTelaCheia(); }
      else if (ev.key === 'ArrowRight') { ev.preventDefault(); andarTelaCheia(1); }
      else if (ev.key === 'ArrowLeft') { ev.preventDefault(); andarTelaCheia(-1); }
      return;
    }
    /* fechar a foto aberta da colmeia com Esc é o reflexo de todo mundo */
    if (ev.key === 'Escape' && colmeia && colmeia.classList.contains('tem-aberto')) fecharFavos();
  });

  /* ============================================== o adicional e o preço que muda */
  var alvoValor = document.querySelector('[data-valor]');
  var precoBase = alvoValor && alvoValor.getAttribute('data-preco-base');
  precoBase = (precoBase === null || precoBase === '') ? null : parseFloat(precoBase);

  function extrasMarcados() {
    return Array.prototype.slice.call(document.querySelectorAll('[data-extra]'))
      .filter(function (l) { return l.querySelector('[data-extra-caixa]').checked; })
      .map(function (l) {
        return {
          id: l.getAttribute('data-extra-id'),
          rotulo: l.querySelector('.titulo-extra').firstChild.nodeValue.trim().replace(/\s*\+\s*R\$.*$/, ''),
          preco: parseFloat(l.getAttribute('data-extra-preco')) || 0
        };
      });
  }

  function precoTotal() {
    if (precoBase === null) return null;
    return extrasMarcados().reduce(function (s, x) { return s + x.preco; }, precoBase);
  }

  function repintarPreco() {
    if (!alvoValor) return;
    var t = precoTotal();
    alvoValor.innerHTML = (t === null) ? '<small>Sob consulta</small>' : window.aleaDinheiro(t);
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-extra]'), function (rot) {
    var caixa = rot.querySelector('[data-extra-caixa]');
    var liberado = document.querySelector('[name="cor_nome"]');
    caixa.addEventListener('change', function () {
      rot.classList.toggle('marcado', caixa.checked);
      if (liberado) {
        liberado.disabled = !caixa.checked;
        if (!caixa.checked) liberado.value = '';
        else liberado.focus();
      }
      repintarPreco();
    });
  });

  /* ==================================================== as cores da peça
     "Apagar o quadrado de escrita e colocar as bolinhas igual do Declaro; quando o
     cliente clicar na bolinha, aparece a quantidade de quadrado correspondente à cor
     que ele escolheu" (Cassiano, 15/09/2026, 3ª rodada).

     O Degradê é o caso especial: não abre campo nenhum e mostra o aviso que ele ditou —
     filamento sazonal não se promete antes de existir. */
  var caixaCores = document.querySelector('[data-cores-peca]');
  var camposCores = document.querySelector('[data-cores-campos]');

  /* ⚠️ ETAPA 28 (22/09/2026, 21:19): o SORTEIO saiu — "algumas não têm tantas opções por se tratar
     de filamento". Agora é UMA cor por caixa, FIXA, na ordem que ele ditou, de cima pra baixo:
     1ª caixa "Ex.: Azul Fosco…", 2ª "Ex.: Verde…", 3ª "Ex.: Branco Perolizado…" (a ordem das 21:23,
     que substitui a das 21:19; o "Verde" sem acabamento é literal dele). No bicolor valem as duas
     primeiras; no monocromático, a primeira. */
  /* ETAPA 29 (21:25): no BICOLOR, "por se tratar de somente 2 janelas, iremos colocar mais de uma":
     Cor principal "Ex.: Vermelho, Laranja Fosco…" e Cor da base "Ex.: Amarelo Perolizado, Prata…".
     O tricolor segue a lista de cima; o monocromático, a primeira dela (até ele dizer outra). */
  var EXEMPLO_POR_CAIXA = ['Ex.: Azul Fosco…', 'Ex.: Verde…', 'Ex.: Branco Perolizado…'];
  var EXEMPLO_BICOLOR = ['Ex.: Vermelho, Laranja Fosco…', 'Ex.: Amarelo Perolizado, Prata…'];
  /* ETAPA 30 (21:28): o MONOCROMÁTICO ganhou o dele — "Ex.: Roxo Perolizado, Rosa Fosco, Dourado…" */
  var EXEMPLO_MONO = ['Ex.: Roxo Perolizado, Rosa Fosco, Dourado…'];
  function exemploDeCor(k, quantos) {
    var lista = quantos === 2 ? EXEMPLO_BICOLOR : quantos === 1 ? EXEMPLO_MONO : EXEMPLO_POR_CAIXA;
    return lista[k - 1] || lista[0];
  }

  function desenharCamposDeCor(radio) {
    if (!camposCores) return;
    camposCores.innerHTML = '';
    var aviso = radio.getAttribute('data-aviso');
    if (aviso) {
      var p = document.createElement('p');
      p.className = 'aviso-degrade';
      p.textContent = aviso;
      camposCores.appendChild(p);
      return;
    }
    var quantos = parseInt(radio.getAttribute('data-campos'), 10) || 0;
    /* ⚠️ ETAPA 26 (22/09/2026, 21:04-21:08): "cor 1, cor 2, cor 3 fica muito feio pro cliente". O
       quadradinho da esquerda deixa de ser número e diz ONDE vai a cor — tricolor: Topo, Principal,
       Base; bicolor: Principal, Base (palavras dele); monocromático: Principal (a peça inteira é a
       cor principal — dedução minha, avisada a ele). E cada caixa ganha um exemplo como o da cor
       do nome, com cores SORTEADAS: "Ex.: <cor> Sólido, <cor> Fosco, <cor> Perolizado…". */
    var PARTES = { 3: ['Topo', 'Principal', 'Base'], 2: ['Principal', 'Base'], 1: ['Principal'] };
    var partes = PARTES[quantos] || [];
    /* ETAPA 27 (21:09, "aliás, melhor"): o quadradinho da esquerda SAI de vez; a caixa branca fica
       onde está (mesmo recuo), e o nome vai EM CIMA dela, como os outros rótulos do formulário:
       "Cor do topo", "Cor principal", "Cor da base". É um <label> de verdade (clicar no nome põe o
       cursor na caixa) e herda o estilo do `.personalizar label`. */
    var NOME_DA_PARTE = { Topo: 'Cor do topo', Principal: 'Cor principal', Base: 'Cor da base' };
    for (var k = 1; k <= quantos; k++) {
      var parte = partes[k - 1] || ('Cor ' + k);
      var titulo = NOME_DA_PARTE[parte] || parte;
      var linha = document.createElement('label');
      linha.className = 'campo-cor';
      linha.innerHTML = '<span class="nome-parte">' + titulo + '</span>' +
        '<input type="text" name="cor_' + k + '" maxlength="40" data-parte="' + parte.toLowerCase() + '" ' +
        'placeholder="' + exemploDeCor(k, quantos) + '">';
      camposCores.appendChild(linha);
    }
    var primeiro = camposCores.querySelector('input');
    if (primeiro) primeiro.focus();
  }

  if (caixaCores) {
    caixaCores.addEventListener('change', function (ev) {
      var r = ev.target.closest('input[name="cores_peca"]');
      if (r) desenharCamposDeCor(r);
    });
  }

  function coresEscolhidas() {
    if (!caixaCores) return null;
    var r = caixaCores.querySelector('input[name="cores_peca"]:checked');
    if (!r) return null;
    var lista = Array.prototype.map.call(
      camposCores.querySelectorAll('input'), function (i) { return i.value.trim(); }
    ).filter(function (v) { return v; });
    return {
      modo: r.parentNode.textContent.trim(),
      cores: lista,
      a_combinar: !!r.getAttribute('data-aviso')
    };
  }

  /* ==================================================== o aceite, os dois botões */
  function campo(nome) {
    var el = document.querySelector('[data-personalizar] [name="' + nome + '"]');
    return el ? el.value.trim() : '';
  }

  function reclamarDoAceite() {
    var recado = document.querySelector('[data-recado-aceite]');
    var botoes = document.querySelector('[data-botoes]');
    var rotulo = document.querySelector('[data-aceite]');
    if (recado) recado.hidden = false;
    if (rotulo) rotulo.classList.add('faltou');
    if (botoes) {
      botoes.classList.remove('tremendo');
      void botoes.offsetWidth;        // reinicia a animação se ele clicar duas vezes
      botoes.classList.add('tremendo');
    }
  }

  function montarItem() {
    var extras = extrasMarcados();
    return {
      slug: botaoComprar.getAttribute('data-slug'),
      nome: botaoComprar.getAttribute('data-nome'),
      preco: precoTotal(),
      capa: botaoComprar.getAttribute('data-capa'),
      material: botaoComprar.getAttribute('data-material'),
      personalizacao: {
        nome_pet: campo('nome_pet'),
        cor_nome: campo('cor_nome'),
        cores: coresEscolhidas()
      },
      extras: extras,
      /* o ACEITE vai junto do item, com data e hora. É a prova de que a declaração foi
         marcada ANTES da compra — e é ela que sustenta a regra de não cancelamento que
         está escrita na mesma página. Aceite que não fica registrado não serve de nada. */
      aceite: { marcado: true, quando: new Date().toISOString() }
    };
  }

  /* ⚠️ ETAPA 19 (22/09/2026, parte 3, áudios das 20:29-20:30): a trava não é mais só do aceite.
     "Não pode ficar nunca sem colocar o nome do pet, sem a escolha das cores da peça e sem marcar a
     declaração. Toda vez que clicar em comprar agora e tiver alguma dessas faltando, essa opção vai
     mudar a cor e vai fazer aquela animação igual você fez com a declaração." E, no seguinte: se
     escolheu tricolor/bicolor/monocromático e não digitou as cores, o mesmo.
     Cada falta ganha a classe `faltou` (a cor), os botões tremem (a animação da declaração), o
     recado diz O QUE falta, e a tela rola até a primeira falta — no celular ela pode estar acima
     da dobra, e cor mudando fora da tela ninguém vê. Degradê não pede cor (a cor é combinada).
     A cor do NOME só é cobrada quando o adicional "nome colorido" está marcado (o campo só abre
     com ele) — mesmo raciocínio das cores da peça: escolheu a opção, tem que dizer a cor. */
  function oQueFalta() {
    var faltas = [];
    var nome = document.querySelector('[data-personalizar] [name="nome_pet"]');
    if (nome && !nome.value.trim()) faltas.push({ el: nome.closest('label') || nome, texto: 'Por favor, digite o nome do pet.' });
    var corNome = document.querySelector('[data-personalizar] [name="cor_nome"]');
    if (corNome && !corNome.disabled && !corNome.value.trim()) {
      faltas.push({ el: corNome.closest('label') || corNome, texto: 'Por favor, digite a cor do nome.' });
    }
    if (caixaCores) {
      var r = caixaCores.querySelector('input[name="cores_peca"]:checked');
      if (!r) {
        /* ETAPA 24: treme e muda de cor o rótulo E cada opção (tricolor, bicolor, monocromático,
           degradê) — "e todos os nomes que tiverem ali" */
        faltas.push({ el: caixaCores.querySelector('.rotulo-grupo') || caixaCores, texto: 'Por favor, selecione a cor da peça.' });
        Array.prototype.forEach.call(caixaCores.querySelectorAll('.cores-opcoes label'), function (l) {
          faltas.push({ el: l, texto: null });
        });
      } else {
        var vazios = Array.prototype.filter.call(
          camposCores ? camposCores.querySelectorAll('input') : [], function (i) { return !i.value.trim(); });
        vazios.forEach(function (i) {
          var parte = i.getAttribute('data-parte');
          var qual = parte === 'topo' ? 'a cor do topo' : parte === 'base' ? 'a cor da base'
                   : parte === 'principal' ? 'a cor principal'
                   : 'a cor ' + (i.getAttribute('name') || '').replace('cor_', '') + ' da peça';
          faltas.push({ el: i.closest('.campo-cor') || i, texto: 'Por favor, digite ' + qual + '.' });
        });
      }
    }
    if (!caixaAceite || !caixaAceite.checked) {
      faltas.push({ el: document.querySelector('[data-aceite]'), texto: 'Por favor, aceite os termos da declaração.' });   // ETAPA 32 (21:38): frase dele
    }
    return faltas;
  }

  function reclamarDoQueFalta(faltas) {
    Array.prototype.forEach.call(document.querySelectorAll('.faltou'), function (x) { x.classList.remove('faltou'); });
    faltas.forEach(function (f) { if (f.el) f.el.classList.add('faltou'); });
    /* ETAPA 23 (22/09/2026, 20:44): "quero que trema TUDO o que está faltando na tela", não só os
       botões. Cada falta treme junto (mesma animação), reiniciada a cada clique. */
    Array.prototype.forEach.call(document.querySelectorAll('.treme-falta'), function (x) { x.classList.remove('treme-falta'); });
    faltas.forEach(function (f) { if (f.el) { void f.el.offsetWidth; f.el.classList.add('treme-falta'); } });
    var recado = document.querySelector('[data-recado-aceite]');
    if (recado) {
      var itens = faltas.map(function (f) { return f.texto; }).filter(Boolean);
      /* ETAPA 24 (22/09/2026, 20:45): a frase é SÓ a da PRIMEIRA falta, de cima pra baixo ("será
         sempre o primeiro item que está faltando") — a lista `faltas` já nasce na ordem da página.
         As outras faltas não somem: continuam com a cor e tremendo. Era "Complete antes de
         continuar: nome do pet, cores da peça e declaração." */
      recado.textContent = itens[0];
      recado.hidden = false;
    }
    var botoes = document.querySelector('[data-botoes]');
    if (botoes) {
      botoes.classList.remove('tremendo');
      void botoes.offsetWidth;        // reinicia a animação se ele clicar duas vezes
      botoes.classList.add('tremendo');
    }
    var primeira = faltas.filter(function (f) { return f.el; })[0];
    if (primeira && primeira.el.scrollIntoView) {
      /* ETAPA 22 (22/09/2026, 20:43): "a tela subiu pro nome do pet, mas o cursor não foi pra
         janela — coloque o cursor direto nela". O foco vai pro CAMPO da primeira falta (no
         celular isso já abre o teclado). Tem que ser AQUI, dentro do clique: o iPhone só aceita
         foco programático durante o gesto. `preventScroll` pra o foco não dar um pulo seco por
         cima da rolagem suave, que é quem centraliza. */
      var alvo = primeira.el.matches && primeira.el.matches('input') ? primeira.el
               : primeira.el.querySelector ? primeira.el.querySelector('input') : null;
      if (!alvo && caixaCores && primeira.el.classList.contains('rotulo-grupo')) {
        alvo = caixaCores.querySelector('input[name="cores_peca"]');
      }
      if (alvo && alvo.focus) { try { alvo.focus({ preventScroll: true }); } catch (e) { alvo.focus(); } }
      /* ⚠️ ETAPA 25 (22/09/2026, 20:53, com vídeo): centralizar NÃO basta no celular — o teclado
         sobe, e a barrinha de "completar automaticamente" do iPhone fica POR CIMA do campo. Ele pediu
         o alinhamento que ele mesmo fez no vídeo: a falta logo ABAIXO do cabeçalho, sobrando a tela
         de baixo pro teclado e pra barrinha. E SEMPRE, a cada clique — não só quando está fora da
         tela. O cabeçalho é medido na hora (a altura muda com a tarja e com o tamanho da tela). */
      var topo = document.querySelector('.topo');
      var folga = (topo ? Math.max(0, topo.getBoundingClientRect().bottom) : 0) + 18;
      var y = window.scrollY + primeira.el.getBoundingClientRect().top - folga;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  }

  /* quem corrige a falta perde a cor na hora — não precisa clicar de novo pra ver sumir */
  document.addEventListener('input', function (ev) {
    var dono = ev.target.closest && ev.target.closest('.faltou');
    if (dono && ev.target.value && ev.target.value.trim()) dono.classList.remove('faltou');
  });
  document.addEventListener('change', function (ev) {
    if (ev.target.name === 'cores_peca' && caixaCores) {
      Array.prototype.forEach.call(caixaCores.querySelectorAll('.rotulo-grupo, .cores-opcoes label'),
        function (x) { x.classList.remove('faltou'); });
    }
  });

  /* ⚠️ ETAPA 43 (22/09/2026, 22:34, print de referência): ao adicionar pela sacola, aparece uma
     JANELINHA logo abaixo do cabeçalho — a miniatura da peça à esquerda e a frase "Você adicionou
     esta criação à sua Sacola de Compras." ("fazer somente a primeira frase"), com × pra fechar. Some
     sozinha em 5 s. Cores e fonte são as da ālea; só a posição e o desenho seguem o modelo. */
  var avisoTimer = null;
  function avisarQueEntrou(capa) {
    var velho = document.querySelector('.aviso-sacola');
    if (velho) velho.parentNode.removeChild(velho);
    var a = document.createElement('div');
    a.className = 'aviso-sacola';
    a.setAttribute('role', 'status');
    a.innerHTML =
      '<div class="miniatura"><img alt="" src="img/produtos/' + capa + '_obj_m.webp" ' +
      'onerror="this.onerror=null;this.src=&quot;img/produtos/' + capa + '_m.jpg&quot;"></div>' +
      '<p>Você adicionou esta criação à sua sacola de compras.</p>' +   // 22:36 minúsculo; 22:38 sem negrito
      '<button type="button" class="fechar-aviso" aria-label="Fechar aviso">&times;</button>';
    var topo = document.querySelector('.topo');
    a.style.top = ((topo ? Math.max(0, topo.getBoundingClientRect().bottom) : 0) + 8) + 'px';
    document.body.appendChild(a);
    requestAnimationFrame(function () { a.classList.add('visivel'); });
    function tirar() {
      a.classList.remove('visivel');
      setTimeout(function () { if (a.parentNode) a.parentNode.removeChild(a); }, 300);
    }
    a.querySelector('.fechar-aviso').addEventListener('click', tirar);
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(tirar, 5000);
  }

  /* ⚠️ ETAPA 45 (22:38): o "editar" da sacola traz a pessoa de volta a esta página com TUDO que ela
     tinha escolhido já preenchido ("pra não precisar fazer tudo novamente"). O endereço chega com
     `?editar=<id da linha>`; aqui se preenche nome, adicional, cor do nome, cores da peça e cada cor.
     Ao adicionar/comprar de novo, a linha antiga é SUBSTITUÍDA (mantém a quantidade), não duplicada.
     ⚠ A DECLARAÇÃO volta DESMARCADA de propósito: ela diz "revisei nome, grafia e cores", e depois de
     mexer na personalização o aceite antigo não cobre o que mudou. */
  var editando = null;
  (function prepararEdicao() {
    var m = /[?&]editar=([^&]+)/.exec(location.search);
    if (!m || !window.aleaCarrinho || !botaoComprar) return;
    var id = decodeURIComponent(m[1]);
    var item = window.aleaCarrinho.itens().filter(function (i) { return i.quando === id; })[0];
    if (!item || item.slug !== botaoComprar.getAttribute('data-slug')) return;
    editando = id;
    var p = item.personalizacao || {};
    var nome = document.querySelector('[data-personalizar] [name="nome_pet"]');
    if (nome) nome.value = p.nome_pet || '';
    (item.extras || []).forEach(function (x) {
      var rot = document.querySelector('[data-extra][data-extra-id="' + x.id + '"]');
      var cx = rot && rot.querySelector('[data-extra-caixa]');
      if (cx && !cx.checked) { cx.checked = true; cx.dispatchEvent(new Event('change', { bubbles: true })); }
    });
    var corNome = document.querySelector('[data-personalizar] [name="cor_nome"]');
    if (corNome && p.cor_nome) corNome.value = p.cor_nome;
    if (caixaCores && p.cores && p.cores.modo) {
      var r = Array.prototype.filter.call(caixaCores.querySelectorAll('input[name="cores_peca"]'),
        function (x) { return x.parentNode.textContent.trim() === p.cores.modo; })[0];
      if (r) {
        r.checked = true;
        desenharCamposDeCor(r);
        Array.prototype.forEach.call(camposCores.querySelectorAll('input'), function (inp, k) {
          inp.value = (p.cores.cores || [])[k] || '';
        });
      }
    }
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    repintarPreco();
    /* ETAPA 47 (22:51): "o cliente não quer saber do topo, ele só quer editar — tem que cair direto no
       NOME DO PET". A tela para com o rótulo "Nome do pet" logo abaixo do cabeçalho (a mesma régua da
       trava de compra). Reaplica no `load`: as fotos da colmeia, carregando, empurram o formulário. */
    function cairNoNome() {
      var alvo = nome && (nome.closest('label') || nome);
      if (!alvo) return;
      var topo = document.querySelector('.topo');
      var folga = (topo ? Math.max(0, topo.getBoundingClientRect().bottom) : 0) + 18;
      window.scrollTo(0, Math.max(0, window.scrollY + alvo.getBoundingClientRect().top - folga));
    }
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    requestAnimationFrame(cairNoNome);
    if (document.readyState !== 'complete') window.addEventListener('load', cairNoNome, { once: true });
    setTimeout(cairNoNome, 400);
  })();

  function porNoCarrinho(eDepoisFechar) {
    var faltas = oQueFalta();
    if (faltas.length) { reclamarDoQueFalta(faltas); return; }
    if (!window.aleaCarrinho) return;
    var recado = document.querySelector('[data-recado-aceite]');
    if (recado) recado.hidden = true;
    if (editando && window.aleaCarrinho.substituir(editando, montarItem())) {
      editando = null;
      if (history.replaceState) history.replaceState(null, '', location.pathname);
      if (window.aleaGaveta) window.aleaGaveta.abrir('carrinho');   // editou: mostra a sacola já corrigida
      return;
    }
    window.aleaCarrinho.adicionar(montarItem());
    /* ⚠️ ETAPA 37 (22/09/2026, 22:09): os dois botões passam a fazer coisas DIFERENTES.
       · a SACOLA ao lado só adiciona — "não vai abrir a sacola, pra ele continuar no site e
         continuar comprando". O aviso de que entrou é a sacola do topo, que já fica cor de kraft
         e ganha o número, e agora dá um pulinho (ver `.sacola-pulou` no CSS);
       · o COMPRAR AGORA adiciona e ABRE a sacola, em tela cheia (era: ia direto pro WhatsApp). O
         WhatsApp continua sendo o botão de fechar pedido DENTRO da sacola. */
    if (eDepoisFechar) {
      if (window.aleaGaveta) window.aleaGaveta.abrir('carrinho');
      return;
    }
    avisarQueEntrou(botaoComprar.getAttribute('data-capa'));
    Array.prototype.forEach.call(document.querySelectorAll('.topo [data-abrir="carrinho"], [data-add-carrinho]'), function (b) {
      b.classList.remove('sacola-pulou');
      void b.offsetWidth;
      b.classList.add('sacola-pulou');
    });
  }

  if (caixaAceite) {
    caixaAceite.addEventListener('change', function () {
      if (!caixaAceite.checked) return;
      var recado = document.querySelector('[data-recado-aceite]');
      var rotulo = document.querySelector('[data-aceite]');
      if (recado) recado.hidden = true;
      if (rotulo) rotulo.classList.remove('faltou');
    });
  }

  /* "Comprar agora" põe no carrinho e já leva ao fechamento do pedido. Sem WhatsApp
     configurado, o fechamento não acontece e a gaveta abre com o aviso — em vez de um
     botão que parece funcionar e não vai a lugar nenhum. */
  if (botaoComprar) botaoComprar.addEventListener('click', function () { porNoCarrinho(true); });
  if (botaoSacola) botaoSacola.addEventListener('click', function () { porNoCarrinho(false); });

  repintarPreco();
})();
