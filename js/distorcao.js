/* =============================================================================
   distorcao.js — o efeito de distorção no hover da ālea
   =============================================================================

   O QUE FAZ
   ---------
   Cada cartão de produto tem DUAS fotos do mesmo comedouro em personalizações
   diferentes. Quando o mouse entra, a primeira escorre e vira a segunda, passando
   por uma distorção. Quando sai, volta. No celular (sem mouse) a troca acontece
   quando o cartão entra na tela.

   POR QUE A DISTORÇÃO TEM ESSA FORMA
   ----------------------------------
   O mapa de deslocamento não é um ruído qualquer de tutorial: é o GRAFISMO FACETADO
   da própria ālea, em tons de cinza e desfocado (gerado por `_preparar_imagens_v1.py`).
   Cada tom de cinza empurra o pixel numa direção diferente — então a foto se dissolve
   seguindo a geometria da marca. É a identidade virando movimento, não enfeite.

   POR QUE WEBGL NA MÃO, SEM BIBLIOTECA
   ------------------------------------
   As bibliotecas prontas (three.js, curtains.js) pesam de 120 a 600 KB. Isto aqui tem
   ~7 KB. Numa página que vai receber clique PAGO do Google Ads, cada 100 KB no caminho
   crítico é dinheiro: página lenta piora a Experiência na Página de Destino, que é um
   dos componentes do Índice de Qualidade — lance mais caro pelo mesmo clique.

   O QUE ACONTECE QUANDO NÃO DÁ PRA RODAR
   --------------------------------------
   Navegador sem WebGL, GPU bloqueada, ou o visitante pediu "menos movimento" no
   sistema (prefers-reduced-motion): o canvas nem nasce e as duas imagens de verdade
   fazem uma transição simples por CSS. A página NUNCA depende do efeito pra mostrar
   o produto — as tags img estão no HTML, com alt, e o Google as enxerga.
   ========================================================================== */

(function () {
  'use strict';

  var VERT = [
    'attribute vec2 p;',
    'varying vec2 uv;',
    'void main(){ uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }'
  ].join('\n');

  /* O shader: desloca as UVs das duas texturas em sentidos OPOSTOS, proporcional ao
     cinza do mapa, e mistura as duas pelo progresso. Sentidos opostos é o que faz a
     troca parecer que a matéria escorreu, e não que uma foto apagou em cima da outra. */
  var FRAG = [
    'precision mediump float;',
    'varying vec2 uv;',
    'uniform sampler2D texA;',
    'uniform sampler2D texB;',
    'uniform sampler2D mapa;',
    'uniform float progresso;',
    'uniform float forca;',
    'uniform vec2 mouse;',
    'void main(){',
    '  float d = texture2D(mapa, uv).r;',
    '  vec2 sopro = (mouse - 0.5) * 0.06 * progresso;',
    '  vec2 uvA = vec2(uv.x + progresso * (d * forca) + sopro.x,',
    '                  uv.y + progresso * (d * forca) + sopro.y);',
    '  vec2 uvB = vec2(uv.x - (1.0 - progresso) * (d * forca) + sopro.x,',
    '                  uv.y - (1.0 - progresso) * (d * forca) + sopro.y);',
    '  vec4 a = texture2D(texA, clamp(uvA, 0.0, 1.0));',
    '  vec4 b = texture2D(texB, clamp(uvB, 0.0, 1.0));',
    '  gl_FragColor = mix(a, b, progresso);',
    '}'
  ].join('\n');

  function compilar(gl, tipo, fonte) {
    var s = gl.createShader(tipo);
    gl.shaderSource(s, fonte);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('[alea] shader nao compilou:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  function textura(gl, img) {
    var t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    /* CLAMP_TO_EDGE + LINEAR sem mipmap: as fotos sao quadradas mas nao sao potencia
       de 2, e o WebGL 1 recusa mipmap nesse caso — sem isto a textura sai PRETA. */
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    return t;
  }

  function carregar(src) {
    return new Promise(function (ok, erro) {
      var i = new Image();
      i.onload = function () { ok(i); };
      i.onerror = function () { erro(new Error('nao carregou ' + src)); };
      i.src = src;
    });
  }

  function Peca(caixa, mapaImg) {
    this.caixa = caixa;
    this.forca = parseFloat(caixa.getAttribute('data-forca') || '0.30');
    this.alvo = 0;
    this.progresso = 0;
    this.mouse = [0.5, 0.5];
    this.rodando = false;
    this.mapaImg = mapaImg;
  }

  Peca.prototype.montar = function () {
    var self = this;
    var imgs = this.caixa.querySelectorAll('img');
    if (imgs.length < 2) return Promise.resolve(false);

    var cv = document.createElement('canvas');
    cv.className = 'lona';
    cv.setAttribute('aria-hidden', 'true');
    var gl = cv.getContext('webgl', { alpha: false, antialias: false, depth: false })
          || cv.getContext('experimental-webgl', { alpha: false });
    if (!gl) return Promise.resolve(false);

    return Promise.all([carregar(imgs[0].src), carregar(imgs[1].src)]).then(function (par) {
      var vs = compilar(gl, gl.VERTEX_SHADER, VERT);
      var fs = compilar(gl, gl.FRAGMENT_SHADER, FRAG);
      if (!vs || !fs) return false;
      var prog = gl.createProgram();
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
      gl.useProgram(prog);

      var buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      var p = gl.getAttribLocation(prog, 'p');
      gl.enableVertexAttribArray(p);
      gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);

      gl.activeTexture(gl.TEXTURE0); textura(gl, par[0]);
      gl.activeTexture(gl.TEXTURE1); textura(gl, par[1]);
      gl.activeTexture(gl.TEXTURE2); textura(gl, self.mapaImg);
      gl.uniform1i(gl.getUniformLocation(prog, 'texA'), 0);
      gl.uniform1i(gl.getUniformLocation(prog, 'texB'), 1);
      gl.uniform1i(gl.getUniformLocation(prog, 'mapa'), 2);

      self.gl = gl;
      self.uProgresso = gl.getUniformLocation(prog, 'progresso');
      self.uForca = gl.getUniformLocation(prog, 'forca');
      self.uMouse = gl.getUniformLocation(prog, 'mouse');
      self.caixa.appendChild(cv);
      self.cv = cv;
      self.caixa.classList.add('com-webgl');
      self.redimensionar();
      self.ligarEventos();
      self.desenhar();
      self.ligarToque();
      return true;
    }).catch(function (e) {
      console.warn('[alea] efeito desligado neste cartao:', e.message);
      return false;
    });
  };

  Peca.prototype.redimensionar = function () {
    var r = this.caixa.getBoundingClientRect();
    /* teto de 2 no devicePixelRatio: num monitor 4K o custo por pixel cresce 4x e
       ninguem ve a diferenca num efeito que ja e borrado de proposito */
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var l = Math.max(1, Math.round(r.width * dpr));
    var a = Math.max(1, Math.round(r.height * dpr));
    if (this.cv.width !== l || this.cv.height !== a) {
      this.cv.width = l;
      this.cv.height = a;
      this.gl.viewport(0, 0, l, a);
    }
  };

  Peca.prototype.ligarEventos = function () {
    var self = this;
    var entrar = function () { self.alvo = 1; self.animar(); };
    var sair = function () { self.alvo = 0; self.animar(); };
    this.caixa.addEventListener('mouseenter', entrar);
    this.caixa.addEventListener('mouseleave', sair);
    /* teclado: quem navega por Tab tem que ver a mesma coisa que quem usa mouse */
    this.caixa.addEventListener('focusin', entrar);
    this.caixa.addEventListener('focusout', sair);
    this.caixa.addEventListener('mousemove', function (e) {
      var r = self.caixa.getBoundingClientRect();
      self.mouse = [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
      self.animar();
    });
    window.addEventListener('resize', function () {
      if (self.cv) { self.redimensionar(); self.desenhar(); }
    });
  };

  /* No celular nao existe hover. Sem isto o visitante de telefone — que e a maioria —
     nunca veria a segunda personalizacao, que e justamente o argumento de venda. */
  Peca.prototype.ligarToque = function () {
    var self = this;
    var temMouse = window.matchMedia && window.matchMedia('(hover: hover)').matches;
    if (temMouse) return;

    /* Tira o "passe o mouse" pela MESMA condição que decide trocar por rolagem.
       O CSS já faz isso com @media (hover: none), mas texto e comportamento não podem
       poder discordar: se um dia a media query e o matchMedia divergirem (e divergem,
       em emulador e em híbrido com tela sensível ao toque), quem manda é quem age. */
    var dica = this.caixa.querySelector('.dica-hover');
    if (dica) dica.remove();
    var espera = null;
    var obs = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        clearTimeout(espera);
        if (!e.isIntersecting) { self.alvo = 0; self.animar(); return; }
        /* ⚠️ ESPERA A CENA ASSENTAR ANTES DE TROCAR A FOTO.
           Sem este atraso, a troca de personalização começa NO MEIO da rolagem: duas
           animações ao mesmo tempo, e o resultado é o "negócio desfigurado" que ele
           viu no vídeo de 14/09 16:02. A rolagem leva 820ms; a foto só começa depois. */
        espera = setTimeout(function () { self.alvo = 1; self.animar(); }, 900);
      });
    }, { threshold: 0.6 });
    obs.observe(this.caixa);
  };

  Peca.prototype.desenhar = function () {
    var gl = this.gl;
    gl.uniform1f(this.uProgresso, this.progresso);
    gl.uniform1f(this.uForca, this.forca);
    gl.uniform2f(this.uMouse, this.mouse[0], this.mouse[1]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  Peca.prototype.animar = function () {
    if (this.rodando) return;
    this.rodando = true;
    var self = this;
    /* laco que PARA sozinho: sem isto cada cartao segura um requestAnimationFrame
       eterno e o notebook do visitante fica com a ventoinha ligada a toa */
    (function passo() {
      var falta = self.alvo - self.progresso;
      /* 0.09 por quadro dava ~0,7s e no telefone parecia um piscar defeituoso.
         0.045 estica pra ~1,4s: a foto ESCORRE em vez de trocar. */
      self.progresso += falta * 0.045;
      if (Math.abs(falta) < 0.002) {
        self.progresso = self.alvo;
        self.desenhar();
        self.rodando = false;
        return;
      }
      self.desenhar();
      requestAnimationFrame(passo);
    })();
  };

  var promessaDoMapa = null;

  function iniciar() {
    /* Idempotente de propósito: esta função é chamada mais de uma vez (quando a
       vitrine fica pronta E no load da janela). O atributo abaixo é o que garante
       que nenhum cartão monte dois contextos WebGL. */
    var caixas = document.querySelectorAll('[data-distorcao]:not([data-montado])');
    if (!caixas.length) return;

    var querMenosMovimento = window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (querMenosMovimento) {
      document.documentElement.classList.add('sem-distorcao');
      return;                       // as imgs + CSS resolvem, sem canvas nenhum
    }

    if (!promessaDoMapa) {
      var mapa = document.documentElement.getAttribute('data-mapa') || 'img/mapa_deslocamento.jpg';
      promessaDoMapa = carregar(mapa);
    }

    promessaDoMapa.then(function (mapaImg) {
      /* so monta o cartao quando ele chega perto da tela: a home tem 8 e nao faz
         sentido acender 8 contextos WebGL antes de o visitante rolar a pagina */
      var obs = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
          if (!e.isIntersecting) return;
          obs.unobserve(e.target);
          new Peca(e.target, mapaImg).montar();
        });
      }, { rootMargin: '200px' });
      Array.prototype.forEach.call(caixas, function (c) {
        c.setAttribute('data-montado', '1');
        obs.observe(c);
      });
    }).catch(function () {
      document.documentElement.classList.add('sem-distorcao');
    });
  }

  /* QUANDO COMEÇAR — e por que não é no DOMContentLoaded.
     Os 6 cartões da vitrine nascem em JavaScript, no site.js. Se este arquivo sair
     procurando cartão cedo demais, acha só os 2 quadros que estão escritos no HTML
     e o efeito não acontece onde ele mais importa. Então: espera o site.js avisar.
     O `load` no fim é rede de segurança — se o site.js quebrar por qualquer motivo,
     os quadros fixos ainda ganham o efeito. */
  if (window.__aleaVitrinePronta) {
    iniciar();
  } else {
    document.addEventListener('alea:vitrine-pronta', iniciar);
  }
  window.addEventListener('load', iniciar);
})();
