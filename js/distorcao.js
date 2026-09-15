/* =============================================================================
   distorcao.js — a troca de foto com distorção, dentro de um produto
   =============================================================================

   O QUE ESTE EFEITO É (e por que ele não é enfeite)
   -------------------------------------------------
   O mapa de deslocamento é o GRAFISMO FACETADO da própria ālea, em cinza e desfocado
   (gerado por `_preparar_imagens_v1.py`). Cada tom empurra o pixel numa direção — a
   imagem se dissolve seguindo a geometria da marca, não um ruído de tutorial. Quem
   olha vê a peça virar outra peça pela forma da marca.

   O EIXO QUE ELE DEFINIU (14/09/2026, 16:22)
   ------------------------------------------
     · rolar pra cima/baixo  → troca de PRODUTO   (feed.js)
     · arrastar pros lados   → troca de FOTO      (aqui)
   Nada acontece sozinho: "sempre permanecer na primeira foto".

   ⚠️ O QUE MUDOU EM 15/09/2026: ALFA
   ----------------------------------
   A primeira imagem de cada peça agora é um OBJETO RECORTADO, com fundo transparente.
   WebGL não adivinha isso: o contexto nasce opaco e o upload de textura era `gl.RGB` —
   com isso o recorte apareceria com fundo PRETO CHAPADO numa moldura invisível, que é
   exatamente o oposto do pedido. Três coisas mudaram juntas, e nenhuma delas funciona
   sozinha:
     1. o contexto é criado com `alpha: true` e `premultipliedAlpha: true`;
     2. a textura sobe como `gl.RGBA` e com `UNPACK_PREMULTIPLY_ALPHA_WEBGL`;
     3. a mistura é `ONE, ONE_MINUS_SRC_ALPHA`, que é a conta certa pra cor já
        pré-multiplicada — com a conta errada a borda do recorte ganha um halo escuro.

   POR QUE WEBGL NA MÃO, SEM BIBLIOTECA
   ------------------------------------
   three.js pesa 600 KB, curtains.js 120 KB. Isto tem ~10 KB. Em página que vai receber
   clique pago, peso é dinheiro: página lenta piora a Experiência na Página de Destino
   e encarece o clique.

   QUANDO NÃO DÁ PRA RODAR
   -----------------------
   Sem WebGL, ou com "menos movimento" ligado no sistema: o canvas não nasce e as fotos
   de verdade trocam com transição de CSS. A página nunca depende do efeito — as tags
   img estão no HTML, com alt, e o Google as enxerga.
   ========================================================================== */

(function () {
  'use strict';

  var VERT = [
    'attribute vec2 p;',
    'varying vec2 uv;',
    'void main(){ uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }'
  ].join('\n');

  /* Desloca as UVs das duas texturas em sentidos OPOSTOS, proporcional ao cinza do
     mapa, e mistura pelo progresso. Sentidos opostos é o que faz parecer que a matéria
     escorreu, e não que uma foto apagou em cima da outra. O `sentido` inverte o empurrão
     conforme o visitante vai pra direita ou pra esquerda.
     A conta vale pra RGB E pra alfa: com cor pré-multiplicada, misturar os quatro
     canais junto é a conta correta — é isso que mantém o recorte recortado no meio
     da transição, em vez de virar um borrão retangular. */
  var FRAG = [
    'precision mediump float;',
    'varying vec2 uv;',
    'uniform sampler2D texA;',
    'uniform sampler2D texB;',
    'uniform sampler2D mapa;',
    'uniform float progresso;',
    'uniform float forca;',
    'uniform float sentido;',
    'void main(){',
    '  float d = texture2D(mapa, uv).r * sentido;',
    '  vec2 uvA = vec2(uv.x + progresso * (d * forca), uv.y + progresso * (d * forca) * 0.6);',
    '  vec2 uvB = vec2(uv.x - (1.0 - progresso) * (d * forca), uv.y - (1.0 - progresso) * (d * forca) * 0.6);',
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

  function novaTextura(gl, unidade) {
    gl.activeTexture(gl.TEXTURE0 + unidade);
    var t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    /* CLAMP_TO_EDGE + LINEAR sem mipmap: as fotos nao sao potencia de 2, e o WebGL 1
       recusa mipmap nesse caso — sem isto a textura sai PRETA. */
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return t;
  }

  function subir(gl, unidade, textura, img) {
    gl.activeTexture(gl.TEXTURE0 + unidade);
    gl.bindTexture(gl.TEXTURE_2D, textura);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
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
    this.imgs = Array.prototype.slice.call(caixa.querySelectorAll('img'));
    this.indice = 0;          // a foto que está na tela
    this.destino = 0;         // pra onde está indo
    this.sentido = 1;         // 1 = foi pra direita, -1 = voltou
    this.progresso = 0;
    this.rodando = false;
    this.mapaImg = mapaImg;
    this.cache = {};          // src -> Image já decodificada
  }

  Peca.prototype.montar = function () {
    var self = this;
    if (this.imgs.length < 2) return Promise.resolve(false);   // sem 2 fotos, sem troca

    var cv = document.createElement('canvas');
    cv.className = 'lona';
    cv.setAttribute('aria-hidden', 'true');
    /* alpha: true é o que deixa o recorte flutuar sobre o preto do feed em vez de
       ganhar um fundo preto chapado dentro de uma moldura invisível. */
    var gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false })
          || cv.getContext('experimental-webgl', { alpha: true, premultipliedAlpha: true });
    if (!gl) return Promise.resolve(false);

    return carregar(this.imgs[0].src).then(function (primeira) {
      var vs = compilar(gl, gl.VERTEX_SHADER, VERT);
      var fs = compilar(gl, gl.FRAGMENT_SHADER, FRAG);
      if (!vs || !fs) return false;
      var prog = gl.createProgram();
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
      gl.useProgram(prog);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);   // a conta certa pra pré-multiplicado
      gl.clearColor(0, 0, 0, 0);

      var buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      var p = gl.getAttribLocation(prog, 'p');
      gl.enableVertexAttribArray(p);
      gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);

      self.gl = gl;
      self.texA = novaTextura(gl, 0);
      self.texB = novaTextura(gl, 1);
      self.texMapa = novaTextura(gl, 2);
      subir(gl, 0, self.texA, primeira);
      subir(gl, 1, self.texB, primeira);
      subir(gl, 2, self.texMapa, self.mapaImg);
      gl.uniform1i(gl.getUniformLocation(prog, 'texA'), 0);
      gl.uniform1i(gl.getUniformLocation(prog, 'texB'), 1);
      gl.uniform1i(gl.getUniformLocation(prog, 'mapa'), 2);
      self.uProgresso = gl.getUniformLocation(prog, 'progresso');
      self.uForca = gl.getUniformLocation(prog, 'forca');
      self.uSentido = gl.getUniformLocation(prog, 'sentido');

      self.cache[self.imgs[0].src] = primeira;
      self.caixa.appendChild(cv);
      self.cv = cv;
      self.caixa.classList.add('com-webgl');
      self.redimensionar();
      window.addEventListener('resize', function () {
        if (self.cv) { self.redimensionar(); self.desenhar(); }
      });
      self.desenhar();
      return true;
    }).catch(function (e) {
      console.warn('[alea] efeito desligado neste objeto:', e.message);
      return false;
    });
  };

  Peca.prototype.redimensionar = function () {
    var r = this.caixa.getBoundingClientRect();
    /* teto de 2 no devicePixelRatio: num 4K o custo por pixel cresce 4x e ninguem ve
       diferenca num efeito que ja e' borrado de proposito */
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var l = Math.max(1, Math.round(r.width * dpr));
    var a = Math.max(1, Math.round(r.height * dpr));
    if (this.cv.width !== l || this.cv.height !== a) {
      this.cv.width = l;
      this.cv.height = a;
      this.gl.viewport(0, 0, l, a);
    }
  };

  Peca.prototype.desenhar = function () {
    var gl = this.gl;
    if (!gl) return;
    /* limpar antes de desenhar NÃO é ritual: sem isto, o que sobrou do quadro anterior
       aparece por baixo das partes transparentes do recorte. */
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(this.uProgresso, this.progresso);
    gl.uniform1f(this.uForca, this.forca);
    gl.uniform1f(this.uSentido, this.sentido);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  /* Troca pra foto `n`. `dir` só decide de que lado a matéria escorre. */
  Peca.prototype.irParaFoto = function (n, dir) {
    var self = this;
    if (!this.gl || this.rodando) return false;
    if (n < 0 || n >= this.imgs.length || n === this.indice) return false;

    var src = this.imgs[n].src;
    this.sentido = dir < 0 ? -1 : 1;

    var seguir = function (img) {
      self.cache[src] = img;
      subir(self.gl, 1, self.texB, img);
      self.destino = n;
      self.progresso = 0;
      self.animar();
    };
    if (this.cache[src]) { seguir(this.cache[src]); }
    else { carregar(src).then(seguir).catch(function () {}); }
    return true;
  };

  Peca.prototype.animar = function () {
    if (this.rodando) return;
    this.rodando = true;
    var self = this;
    /* laco que PARA sozinho: sem isto cada objeto segura um requestAnimationFrame
       eterno e a ventoinha do visitante fica ligada a toa */
    (function passo() {
      /* 0.045 por quadro ~ 1,4s. O Cassiano pediu mais devagar em 14/09 16:03:
         "a gente ta clicando e ja aparece de uma vez, ai da aquele negocio desfigurado". */
      self.progresso += (1 - self.progresso) * 0.045;
      if (self.progresso > 0.995) {
        self.progresso = 1;
        self.desenhar();
        /* a foto que chegou vira a foto de base, e o progresso volta a zero. Sem isto a
           proxima troca partiria do meio da anterior e a imagem "piscaria". */
        self.indice = self.destino;
        subir(self.gl, 0, self.texA, self.cache[self.imgs[self.indice].src]);
        self.progresso = 0;
        self.desenhar();
        self.rodando = false;
        self.caixa.dispatchEvent(new CustomEvent('alea:foto', { detail: { indice: self.indice } }));
        return;
      }
      self.desenhar();
      requestAnimationFrame(passo);
    })();
  };

  /* ------------------------------------------------------------------ montagem
     O feed manda montar o objeto que ENTROU na tela, e só ele. Antes isso era decidido
     por IntersectionObserver; não serve mais, porque no feed os itens fora da vez ficam
     com `visibility: hidden` — e elemento invisível nunca "intersecciona", então o
     efeito nunca acenderia. Quem sabe qual peça está na vez é o feed. */
  var promessaDoMapa = null;
  var desligado = false;

  function mapa() {
    if (!promessaDoMapa) {
      var src = document.documentElement.getAttribute('data-mapa') || 'img/mapa_deslocamento.jpg';
      promessaDoMapa = carregar(src);
    }
    return promessaDoMapa;
  }

  function montar(caixa) {
    if (desligado || !caixa || caixa.hasAttribute('data-montado')) return;
    caixa.setAttribute('data-montado', '1');
    mapa().then(function (mapaImg) {
      var pc = new Peca(caixa, mapaImg);
      return pc.montar().then(function (ok) { if (ok) caixa.__peca = pc; });
    }).catch(function () {
      desligado = true;
      document.documentElement.classList.add('sem-distorcao');
    });
  }

  function trocar(caixa, n, dir) {
    if (caixa && caixa.__peca) return caixa.__peca.irParaFoto(n, dir);
    return false;
  }

  var querMenosMovimento = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (querMenosMovimento) {
    desligado = true;
    document.documentElement.classList.add('sem-distorcao');   // as imgs + CSS resolvem
  }

  window.aleaDistorcao = { montar: montar, trocar: trocar };
})();
