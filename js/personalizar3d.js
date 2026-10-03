/* CATALOGO:
   nome: personalizar3d
   categoria: UTIL
   objetivo: Janela "Personalize aqui" da página de produto: a peça em 3D (do arquivo do Cassiano), com o nome do
             pet GRAVADO ao vivo e as cores da peça e do nome trocando na hora, conforme o formulário.
   entrada: ALEA.modelos3d[slug] e ALEA.filamentos (config.js); o formulário [data-personalizar] da página
   saida: a janela (modal); o formulário de verdade MORA dentro dela enquanto está aberta
   status: v13 (03/10/2026, peça SEM nome gravado — `semNome`, a saboneteira)
   validado_em: 03/10/2026 (Playwright 1440 px e 390 px: 03_site/_testar_saboneteira_3d_v1_2026-10-03.py)
*/
/* =============================================================================
   HISTÓRICO (a v1 da etapa 53 está em 03_site/_versoes_anteriores/js_2026-09-23/)
   -----------------------------------------------------------------------------
   v1 (etapa 53, 14:27): janela com a peça 3D, nome ao vivo, abas Original/Fosco próprias.
   v2 (etapa 55, 15:12-15:23, "executar" das 15:23) — pedidos dele:
     1. "Essa parte a gente não vai mais precisar (...) ela vai estar inteira no Personalize aqui": o formulário
        (nome, adicional + cor do nome, cores da peça) SAI da página e passa a morar só na janela. Aqui ele é
        MOVIDO pra dentro da janela ao abrir e volta (escondido) ao fechar — é o MESMO formulário, então a trava
        de compra, o carrinho e o "editar" seguem funcionando sem cópia. As abas próprias da v1 saíram.
     2. "Não estou gostando daquele fundo preto (...) muito carregado": fundo de ESTÚDIO em degradê bege-acinzentado
        de tom médio, com sombra macia sob a peça, que CLAREIA ou ESCURECE sozinho conforme as cores escolhidas
        ("conforme vai mudando as cores, você muda o fundo também pra ficar em destaque o objeto").
     3. "A peça está com muita iluminação (...) dependendo do jeito que eu giro, não vejo o nome": a luz agora anda
        COM a câmera (vem sempre de onde você olha, um pouco de cima), então nenhum lado fica estourado ou apagado
        e o nome aparece em qualquer ângulo.
   v3 (etapa 56, 15:33-15:43, "executar" das 15:43):
     1. "Quando eu clicar em Nome do pet, a tela fica nessa posição (...) e você vira a peça pra frente e ela fica
        parada pra ele ver o nome sendo transformado na hora": no celular a janela acompanha a parte VISÍVEL da tela
        (visualViewport) — com o teclado aberto, o campo fica logo acima dele e a peça continua inteira em cima; e
        tocar no nome para o giro e traz o nome de frente.
     2. "A tela de trás está mexendo (...) a de trás não pode nunca mexer": a página fica TRAVADA (body fixo no
        lugar) enquanto a janela está aberta — o mesmo remédio da sacola (etapa 40).
     4. "Tive uma ideia melhor (...) totalmente estática": UM PASSO POR VEZ — 1 Nome do pet [Próximo];
        2 "Um detalhe que transforma" + cor do nome [Voltar] [Pular] [Próximo]; 3 Cores da peça [Voltar] [Pronto].
        A janela tem só a altura do passo e não rola.
   v4 (etapa 58, "executar" das 16:25): sem o "Pular"; bicolor = topo (cor 1) + meio e base (cor 2); nome: abre com
      o ORIGINAL, apagar no passo 1 volta o original, sair do passo 1 em branco pergunta "Deseja mesmo não adicionar
      nome?" (Sim = peça sem nome); em peça escura a sombra da letra CLAREIA (sem contorno nem brilho — "o mais real
      possível"); toque na peça = de frente e parada; "editar" abre de frente e parado; a foto da peça montada vira
      a MINIATURA da sacola.
   v5 (etapa 59, 16:38-16:43): no passo 2, SEM NOME o "Um detalhe que transforma" fica inativo (não cobra cor de um
      nome que não existe) e tentar mexer treme e avisa "Por favor, volte e coloque o nome do seu pet."; COM nome,
      tocar no acabamento antes de marcar o detalhe treme e avisa "Marque a opção acima para personalizar.".
   v6 (etapa 60, 16:51-16:53): no iPhone o toque em opção DESATIVADA não chega em lugar nenhum (o Safari engole) —
      o recado nunca aparecia. Agora uma PELÍCULA invisível cobre as bolinhas e a janela da cor do nome enquanto
      estão travadas e é ela que pega o toque. E, sem nome, o quadradinho do detalhe fica apagado como as bolinhas.
   v7 (26/09/2026, pedido do Cassiano: "o Matteo e a Cláudia iguais ao Luke"; a v6 está em
      03_site/_versoes_anteriores/personalizar_matteo_claudia_antes_2026-09-26/js/): a janela deixou de supor o Luke.
      Quatro coisas passam a vir do config.js de cada peça (sem nada disso, tudo fica como no Luke):
      1. `zonaNome` — em que zona o nome está gravado. No Luke é a parede do meio ('principal'); no Matteo é o
         TOPO (a parte preta). A letra sem cor segue a cor DESSA zona; antes seguia sempre a do meio, e no Matteo
         o nome sairia da cor da base.
      2. `bicolor` — qual das 2 cores vai em cada zona. Luke: topo = cor 1, meio e base = cor 2. Cláudia: topo e
         meio = cor 1, a onda de baixo = cor 2 (é como a peça dele é impressa; foto claudiawave_capa).
      3. `fonteInvertida` — a Defante (.otf, curvas CFF) precisa desenhar os contornos ao contrário; a Arimo
         (.ttf, a mesma medida da Arial que o arquivo do Matteo usa) não.
      4. `nomeInicial` — o nome que a peça mostra ao abrir, quando o arquivo traz outro (a Cláudia vem com "Chica").
   v8 (26/09/2026, vídeos do Cassiano msgs 2067-2070: "sempre que você pegar um projeto, você fatia a mesa dele (...) o
      do Matteo é texturizado"; "o mármore (...) tem que ter essa pigmentação (...) não pode ficar liso"; a v7 está em
      03_site/_versoes_anteriores/textura_3d_antes_2026-09-26/js/):
      1. PELE FELPUDA (`cfg.pele`, config.js): a peça sai do fatiador com a parede toda granulada (fuzzy skin do .3mf:
         ruído billow, 4 oitavas, persistência 0,5, escala 1 mm, espessura 0,2 mm). A malha continua a lisa do arquivo
         (leve pro celular); o relevo é desenhado NA LUZ, ponto a ponto, com o mesmo ruído e os mesmos números do
         arquivo, só nas paredes (topo e fundo planos ficam lisos, como no fatiador). O grão mais fino que um pixel
         some sozinho (senão tremeria ao girar).
      2. TEXTURA POR COR (`textura` na cor, em ALEA.filamentos, escrita pelo gerador v4): filamento com efeito
         (Mármore = branco com pintas cinza, tirado da foto IMG_0039 da Chica) pinta a zona com hex × o desenho da
         foto, projetado pelos 3 eixos (sem emenda). A cor sem `textura` continua lisa — Sakura Pink e Light Cyan não
         mudaram (áudio 2078: "estão perfeitas").
      3. `rugosidade`/`metal` na cor (opcional) sobrescrevem o brilho do acabamento só naquela cor.
   v9 (26/09/2026, áudios 2178/2180 e textos 2179/2181 do Cassiano; a v8 está em
      03_site/_versoes_anteriores/setas_e_modal_antes_2026-09-26/js/): ao ABRIR a janela, antes de personalizar, abre
      por cima uma janelinha com o AVISO DE VARIAÇÃO DE COR (texto dele, exato) e um quadradinho "Estou ciente…". O
      "Continuar" só acende com o quadradinho marcado; marcado + Continuar libera a personalização. Fechar a janelinha
      sem marcar (X, Esc ou clique fora) fecha a personalização junto: não se personaliza sem aceitar. Aceito uma vez,
      vale pra VISITA inteira (sessionStorage `alea_ciente_cor`), em qualquer produto. O pedido que chega pro Cassiano
      leva "Cliente ciente da variação de cor da tela" (carrinho.js). Vale no COMPUTADOR e no CELULAR.
      O tamanho 2× da janela no computador (vídeo 2176) é só CSS (estilo.css, bloco v31): aqui nada mudou pra isso.
   v10 (27/09/2026, áudio 2259): o aviso de cor aparece TODA VEZ que a janela abre (ver o bloco do aviso, lá embaixo).
   v11 (27/09/2026, áudios 2319-2322 do Cassiano; a v10 está em 03_site/_versoes_anteriores/sem_nome_quadradinho_antes_2026-09-27/js/):
      "vamos TIRAR aquela mensagem de 'não adicionar nome'" — a pergunta "Deseja mesmo não adicionar nome?" (v4, etapa 58)
      NÃO é mais chamada (o código dela fica comentado, logo abaixo do Próximo). No lugar, o quadradinho "Sem nome" ao lado
      do título Nome do pet (quem o cria é o produto.js v34; aqui ele entra no passo 1 junto do campo). No Próximo do
      passo 1: nome vazio e quadradinho desmarcado = a trava de sempre (treme, cor de falta, "Por favor, digite o nome do
      pet.", cursor no campo) — nenhuma frase nova; marcado = segue pro passo 2, sem nome. Marcar tira a letra da peça na
      hora (antes, no passo 1 vazio, a peça mostrava o nome original da foto).
   v12 (28/09/2026, áudios 3030/3031 + vídeo 3029 do Cassiano; a v11 está em
      03_site/_versoes_anteriores/pronto_sem_cor_antes_2026-09-28/js/): "se a pessoa não escolher as cores, é porque ela
      escolheu a cor do Luke (...) aí é só colocar na sacola". O "Pronto" do último passo chama window.aleaAssumirCorDaCapa
      (produto.js v37) ANTES de fechar: sem Tricolor/Bicolor/Monocromático marcado, o formulário recebe as cores da capa
      (config.js `capa`) e a compra passa. X, Esc e clique fora continuam fechando sem mexer em nada.
   v13 (03/10/2026, áudios 5800/5801 do Cassiano; a v12 está em 03_site/_versoes_anteriores/saboneteira_3d_antes_2026-10-03/js/):
      "aquela animação igual dos comedouros (...) a peça lá em 3D do arquivo que eu mandei, conforme a pessoa escolhe a cor
      vai mudando" — a ālea Soap Dish entra na janela, e ela NÃO tem nome gravado (regra dele, msg 5771). Com
      `semNome: true` no config.js, a janela não baixa o _nome.json nem a fonte, não monta o quadro do nome e a peça fica
      sempre lisa (só a logo negativa do arquivo, que já vem no .glb). O resto é o mesmo código: o passo único é "Cores da
      peça" e o Monocromático pinta todas as zonas. Peça sem `semNome` (os comedouros) = exatamente como na v12.
      `folgaEnquadrar` (opcional, padrão 0,82 = o de sempre): a saboneteira é larga e baixa e saía cortada dos lados no
      enquadramento feito pro comedouro (visto no print de 390 e 1440 px); ela usa 1,1.
   ============================================================================= */

/* ⚠️ OS TEXTOS DO AVISO DE COR — trocar AQUI, e só aqui. Os dois são do Cassiano, palavra por palavra (26/09/2026).
   A frase do quadradinho foi encurtada por ele; a longa fica guardada logo abaixo, caso ele queira voltar. */
var AVISO_COR_TEXTO = 'Buscamos representar as cores com a maior fidelidade possível. Ainda assim, pequenas variações de tonalidade podem ocorrer entre a visualização na tela e o produto real, devido às diferentes configurações de brilho, contraste e cor de cada dispositivo.';
var AVISO_COR_CAIXA = 'Estou ciente da possível variação de cor.';
/* a frase longa (msg 2181), se ele pedir de volta:
var AVISO_COR_CAIXA = 'Estou ciente de que as cores exibidas na tela podem apresentar pequenas variações em relação ao produto real.'; */
var AVISO_COR_BOTAO = 'Continuar';
var AVISO_COR_CHAVE = 'alea_ciente_cor';     // sessionStorage: marca que aceitou (vai no pedido); v10: NÃO pula mais o aviso

function cienteDaCor() {
  if (window.aleaCienteCor) return true;
  try { return !!sessionStorage.getItem(AVISO_COR_CHAVE); } catch (e) { return false; }
}
function gravarCienteDaCor() {
  window.aleaCienteCor = true;
  try { sessionStorage.setItem(AVISO_COR_CHAVE, new Date().toISOString()); } catch (e) { /* aba anônima: vale até sair da página */ }
}
function escaparHtml(t) {
  return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
}

var ACABAMENTO_MATERIAL = {           // como cada acabamento reflete a luz
  fosco:      { roughness: 0.9,  metalness: 0.0 },
  basico:     { roughness: 0.55, metalness: 0.0 },
  perolizado: { roughness: 0.32, metalness: 0.3 }
};

export async function abrirJanela3D(cfg, aoFechar, aoMontar, opcoes) {
  opcoes = opcoes || {};
  /* ---------------- a janela (monta ANTES de baixar o 3D: o formulário já fica usável) */
  var form = document.querySelector('[data-personalizar]');
  var lugarDoForm = document.createComment('lugar do formulário');
  var fundo = document.createElement('div');
  fundo.className = 'janela3d-fundo';
  fundo.innerHTML =
    '<div class="janela3d" role="dialog" aria-modal="true" aria-label="Personalize sua peça">' +
      '<button type="button" class="janela3d-fechar" aria-label="Fechar">&times;</button>' +
      '<div class="janela3d-palco"><canvas></canvas><p class="janela3d-dica">Arraste para girar</p>' +
        '<p class="janela3d-carregando">Carregando a peça…</p></div>' +
      '<div class="janela3d-lado">' +
        '<h2>Personalize <small class="janela3d-passo"></small></h2>' +
        '<div class="janela3d-form"></div>' +
        '<p class="janela3d-aviso">Simulação. A cor na tela pode variar um pouco da peça real.</p>' +
        '<button type="button" class="botao janela3d-pronto">Pronto</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(fundo);
  if (form) { form.parentNode.insertBefore(lugarDoForm, form); fundo.querySelector('.janela3d-form').appendChild(form); }
  document.documentElement.classList.add('janela3d-aberta');

  /* (2) o fundo NÃO mexe: a página fica presa no lugar enquanto a janela está aberta */
  var rolagemAntes = window.scrollY || 0;
  document.body.style.position = 'fixed';
  document.body.style.top = (-rolagemAntes) + 'px';
  document.body.style.left = '0'; document.body.style.right = '0';

  /* (1) a janela ocupa só a parte VISÍVEL da tela: com o teclado aberto ela encolhe por cima dele */
  var vv = window.visualViewport;
  function acompanharTela() {
    if (!vv) return;
    fundo.style.height = vv.height + 'px';
    fundo.style.top = vv.offsetTop + 'px';
  }
  if (vv) { vv.addEventListener('resize', acompanharTela); vv.addEventListener('scroll', acompanharTela); acompanharTela(); }

  /* (4) UM PASSO POR VEZ */
  var passos = [];
  if (form) {
    var nomeRot = (form.querySelector('[name="nome_pet"]') || {}).closest ? form.querySelector('[name="nome_pet"]').closest('label') : null;
    /* v11: o passo 1 é o bloco inteiro (rótulo Nome do pet + quadradinho Sem nome), quando o produto.js o montou */
    if (nomeRot && nomeRot.closest('[data-campo-nome]')) nomeRot = nomeRot.closest('[data-campo-nome]');
    var extraRot = form.querySelector('[data-extra]');
    var corNomeRot = form.querySelector('.campo-cor-nome') ? form.querySelector('.campo-cor-nome').closest('label') : null;
    var coresRot = form.querySelector('[data-cores-peca]');
    passos = [[nomeRot], [extraRot, corNomeRot], [coresRot]].map(function (els) { return els.filter(Boolean); })
      .filter(function (els) { return els.length; });
  }
  var recadoPasso = document.createElement('p');
  recadoPasso.className = 'janela3d-recado';
  recadoPasso.hidden = true;
  var nav = document.createElement('div');
  nav.className = 'janela3d-nav';
  var passoAtual = 0;
  var botaoPronto = fundo.querySelector('.janela3d-pronto');
  botaoPronto.parentNode.insertBefore(recadoPasso, botaoPronto);
  botaoPronto.parentNode.insertBefore(nav, botaoPronto);
  botaoPronto.style.display = 'none';   // o Pronto agora é o do último passo
  function avisarNoPasso(texto, alvos) {
    recadoPasso.textContent = texto; recadoPasso.hidden = false;
    (alvos || []).concat([recadoPasso]).forEach(function (el) {
      if (!el) return; el.classList.remove('treme-falta'); void el.offsetWidth; el.classList.add('treme-falta');
    });
  }
  function semNomeConfirmado() {
    var cn = form && form.querySelector('[name="nome_pet"]');
    return !!(form && form.hasAttribute('data-sem-nome') && cn && !cn.value.trim());
  }
  function acertarDetalhe() {
    var ext = form && form.querySelector('[data-extra]');
    if (!ext) return;
    var inativo = semNomeConfirmado();
    ext.classList.toggle('inativo', inativo);
    var cx = ext.querySelector('[data-extra-caixa]');
    if (inativo && cx && cx.checked) { cx.checked = false; cx.dispatchEvent(new Event('change', { bubbles: true })); }
  }
  /* o toque "proibido" é pego ANTES de chegar no quadradinho / na bolinha (fase de captura) */
  if (form) form.addEventListener('click', function (e) {
    if (passoAtual !== 1) return;
    var ext = e.target.closest && e.target.closest('[data-extra]');
    var acab = e.target.closest && e.target.closest('.campo-cor-nome .acabamento');
    if (!ext && !acab) return;
    var blocoNome = form.querySelector('.campo-cor-nome');
    blocoNome = blocoNome && (blocoNome.closest('label') || blocoNome);
    if (semNomeConfirmado()) {
      e.preventDefault(); e.stopPropagation();
      avisarNoPasso('Por favor, volte e coloque o nome do seu pet.', [form.querySelector('[data-extra]'), blocoNome]);
      return;
    }
    var cx = form.querySelector('[data-extra-caixa]');
    if (acab && cx && !cx.checked) {
      e.preventDefault(); e.stopPropagation();
      avisarNoPasso('Marque a opção acima para personalizar.', [form.querySelector('[data-extra]'), blocoNome]);
    }
  }, true);

  /* a PELÍCULA: por cima do bloco da cor do nome enquanto ele está travado (sem nome, ou detalhe desmarcado) */
  var pelicula = null;
  function atualizarPelicula() {
    var bloco = form && form.querySelector('.campo-cor-nome');
    if (!bloco) return;
    if (!pelicula) {
      pelicula = document.createElement('div');
      pelicula.className = 'trava-toque';
      pelicula.setAttribute('aria-hidden', 'true');
      bloco.appendChild(pelicula);
      pelicula.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        var alvos = [form.querySelector('[data-extra]'), bloco.closest('label') || bloco];
        if (semNomeConfirmado()) avisarNoPasso('Por favor, volte e coloque o nome do seu pet.', alvos);
        else avisarNoPasso('Marque a opção acima para personalizar.', alvos);
      });
    }
    var cx = form.querySelector('[data-extra-caixa]');
    pelicula.hidden = !(semNomeConfirmado() || !(cx && cx.checked));
  }

  function mostrarPasso(i) {
    passoAtual = Math.max(0, Math.min(passos.length - 1, i));
    recadoPasso.hidden = true;
    acertarDetalhe();
    atualizarPelicula();
    passos.forEach(function (els, k) { els.forEach(function (el) { el.classList.toggle('passo-escondido', k !== passoAtual); }); });
    var ultimo = passoAtual === passos.length - 1;
    var html = '';
    if (passoAtual > 0) html += '<button type="button" class="botao-sec" data-nav="voltar">Voltar</button>';
    html += ultimo ? '<button type="button" class="botao" data-nav="pronto">Pronto</button>'
                   : '<button type="button" class="botao" data-nav="proximo">Próximo</button>';
    nav.innerHTML = html;
    nav.setAttribute('data-quantos', String(nav.children.length));
    fundo.querySelector('.janela3d-passo').textContent = (passoAtual + 1) + ' de ' + passos.length;
  }
  nav.addEventListener('click', function (e) {
    var b = e.target.closest('[data-nav]'); if (!b) return;
    var acao = b.getAttribute('data-nav');
    if (acao === 'voltar') { mostrarPasso(passoAtual - 1); if (window.aleaGravarNome) window.aleaGravarNome(); }
    else if (acao === 'proximo') {
      var cn = form && form.querySelector('[name="nome_pet"]');
      /* v11: sem nome e sem o quadradinho marcado = a trava de sempre (era: perguntarSemNome()) */
      if (passoAtual === 0 && cn && !cn.value.trim() && !form.hasAttribute('data-sem-nome')) { faltaONome(cn); return; }
      mostrarPasso(passoAtual + 1);
      if (window.aleaGravarNome) window.aleaGravarNome();
    }
    else if (acao === 'pular') {
      /* pular = sem o adicional de R$ 30: desmarca (o produto.js trava a cor do nome e tira do preço) */
      var cx = form && form.querySelector('[data-extra-caixa]');
      if (cx && cx.checked) { cx.checked = false; cx.dispatchEvent(new Event('change', { bubbles: true })); }
      mostrarPasso(passoAtual + 1);
    }
    /* v12 (áudios 3030/3031 do Cassiano, 28/09/2026): "Pronto" sem nenhuma cor escolhida = as cores da FOTO DE CAPA
       (produto.js v37, aleaAssumirCorDaCapa). Só o Pronto faz isso — o X, o Esc e o clique fora fecham sem mexer. */
    else if (acao === 'pronto') { if (window.aleaAssumirCorDaCapa) window.aleaAssumirCorDaCapa(); fechar(); }
  });
  /* v11: a trava do nome no passo 1 — a MESMA da compra: cor de falta no rótulo, treme, a frase de sempre, cursor no campo */
  function faltaONome(cn) {
    var rotN = cn.closest('label') || cn;
    rotN.classList.add('faltou');
    avisarNoPasso('Por favor, digite o nome do pet.', [rotN]);
    try { cn.focus({ preventScroll: true }); } catch (e) { cn.focus(); }
  }
  /* (8) "Deseja mesmo não adicionar nome?" — SAIU na v11 (áudios 2319-2322: "vamos tirar aquela mensagem"). Fica guardado
     aqui, comentado, caso ele peça de volta; ninguém mais chama. O código original, inteiro:
  function perguntarSemNome() {
    var velho = fundo.querySelector('.janela3d-pergunta'); if (velho) velho.remove();
    var q = document.createElement('div');
    q.className = 'janela3d-pergunta';
    q.innerHTML = '<p>Deseja mesmo não adicionar nome?</p><div class="janela3d-nav" data-quantos="2">' +
      '<button type="button" class="botao-sec" data-sn="nao">Não</button>' +
      '<button type="button" class="botao" data-sn="sim">Sim</button></div>';
    fundo.querySelector('.janela3d-lado').appendChild(q);
    q.addEventListener('click', function (e) {
      var b = e.target.closest('[data-sn]'); if (!b) return;
      q.remove();
      var cn = form.querySelector('[name="nome_pet"]');
      if (b.getAttribute('data-sn') === 'sim') {
        form.setAttribute('data-sem-nome', '');
        mostrarPasso(1);
        if (window.aleaGravarNome) window.aleaGravarNome();
      } else if (cn) { try { cn.focus({ preventScroll: true }); } catch (e2) { cn.focus(); } }
    });
  }
  (fim do código guardado da pergunta) */

  /* a trava de compra marca a falta com .faltou: a janela abre no passo da PRIMEIRA falta */
  window.aleaIrParaFalta = function () {
    var f = form && form.querySelector('.faltou');
    if (!f) return;
    for (var k = 0; k < passos.length; k++) {
      if (passos[k].some(function (el) { return el === f || el.contains(f); })) { mostrarPasso(k); return; }
    }
  };
  mostrarPasso(0);
  requestAnimationFrame(function () { fundo.classList.add('visivel'); });

  /* v9 — O AVISO DE VARIAÇÃO DE COR, por cima da janela, antes de personalizar (computador e celular) */
  /* v10 (27/09/2026, áudio 2259 do Cassiano): o aviso aparece TODA VEZ que a personalização abre (computador e celular),
     com o quadradinho DESMARCADO — saiu o "aceito uma vez vale pra visita" (antes: `if (cienteDaCor()) return;`).
     O `gravarCienteDaCor` continua: é ele que põe "Cliente ciente da variação de cor da tela" no pedido.
     A v9 está em 03_site/_versoes_anteriores/cor_da_capa_antes_2026-09-27/. */
  (function avisoDeCor() {
    var janela = fundo.querySelector('.janela3d');
    var debaixo = ['.janela3d-palco', '.janela3d-lado', '.janela3d-fechar'].map(function (q) { return fundo.querySelector(q); })
      .filter(Boolean);
    debaixo.forEach(function (el) { el.setAttribute('inert', ''); el.setAttribute('aria-hidden', 'true'); });
    var av = document.createElement('div');
    av.className = 'janela3d-ciente';
    av.innerHTML =
      '<div class="janela3d-ciente-caixa" role="alertdialog" aria-modal="true" aria-labelledby="janela3d-ciente-texto">' +
        '<button type="button" class="janela3d-ciente-fechar" aria-label="Fechar">&times;</button>' +
        '<p class="janela3d-ciente-texto" id="janela3d-ciente-texto">' + escaparHtml(AVISO_COR_TEXTO) + '</p>' +
        '<label class="janela3d-ciente-marca"><input type="checkbox" data-ciente-caixa> <span>' +
          escaparHtml(AVISO_COR_CAIXA) + '</span></label>' +
        '<button type="button" class="botao janela3d-ciente-seguir" disabled>' + escaparHtml(AVISO_COR_BOTAO) + '</button>' +
      '</div>';
    janela.appendChild(av);
    var caixa = av.querySelector('[data-ciente-caixa]');
    var seguir = av.querySelector('.janela3d-ciente-seguir');
    caixa.addEventListener('change', function () { seguir.disabled = !caixa.checked; });
    seguir.addEventListener('click', function () {
      if (!caixa.checked) return;
      gravarCienteDaCor();
      debaixo.forEach(function (el) { el.removeAttribute('inert'); el.removeAttribute('aria-hidden'); });
      if (av.parentNode) av.parentNode.removeChild(av);
    });
    /* fechar sem aceitar = fechar a personalização (o Esc e o clique fora já fecham a janela inteira) */
    av.querySelector('.janela3d-ciente-fechar').addEventListener('click', function () { fechar(); });
    try { caixa.focus({ preventScroll: true }); } catch (e) { /* nada */ }
  })();
  var palco = fundo.querySelector('.janela3d-palco');
  var canvas = fundo.querySelector('canvas');
  var vivo = true;
  var limpar = null;

  function fotografar() {
    /* (9) a MINIATURA da sacola: a peça como o cliente montou, de frente, fundo transparente, 240 px */
    try {
      if (!renderer || !frente) return;
      var antes = camera.position.clone();
      camera.position.copy(frente); camera.lookAt(controles.target); renderer.render(cena, camera);
      var c2 = document.createElement('canvas'); c2.width = c2.height = 240;
      var cv = renderer.domElement, lado = Math.min(cv.width, cv.height);
      c2.getContext('2d').drawImage(cv, (cv.width - lado) / 2, (cv.height - lado) / 2, lado, lado, 0, 0, 240, 240);
      window.aleaMiniatura3D = c2.toDataURL('image/webp', 0.85);
      camera.position.copy(antes);
    } catch (e) { /* sem miniatura, a sacola usa a capa */ }
  }
  function fechar() {
    if (!vivo) return;
    fotografar();
    vivo = false;
    passos.forEach(function (els) { els.forEach(function (el) { el.classList.remove('passo-escondido'); }); });
    var extI = form && form.querySelector('[data-extra]'); if (extI) extI.classList.remove('inativo');
    if (pelicula && pelicula.parentNode) pelicula.parentNode.removeChild(pelicula);
    document.body.style.position = ''; document.body.style.top = ''; document.body.style.left = ''; document.body.style.right = '';
    if (vv) { vv.removeEventListener('resize', acompanharTela); vv.removeEventListener('scroll', acompanharTela); }
    window.aleaIrParaFalta = null;
    if (form && lugarDoForm.parentNode) lugarDoForm.parentNode.insertBefore(form, lugarDoForm);
    if (lugarDoForm.parentNode) lugarDoForm.parentNode.removeChild(lugarDoForm);
    fundo.classList.remove('visivel');
    document.documentElement.classList.remove('janela3d-aberta');
    window.scrollTo(0, rolagemAntes);
    requestAnimationFrame(function () { window.scrollTo(0, rolagemAntes); });
    setTimeout(function () { if (limpar) limpar(); if (fundo.parentNode) fundo.parentNode.removeChild(fundo); }, 250);
    if (aoFechar) aoFechar();
  }
  fundo.querySelector('.janela3d-fechar').addEventListener('click', fechar);
  fundo.querySelector('.janela3d-pronto').addEventListener('click', fechar);
  fundo.addEventListener('click', function (e) { if (e.target === fundo) fechar(); });
  document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { document.removeEventListener('keydown', esc); fechar(); } });
  if (aoMontar) aoMontar();

  /* ---------------- 3D */
  var THREE = await import('three');
  var { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  var { TTFLoader } = await import('three/addons/loaders/TTFLoader.js');
  var { Font } = await import('three/addons/loaders/FontLoader.js');
  var { TextGeometry } = await import('three/addons/geometries/TextGeometry.js');
  var { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
  var { mergeVertices, mergeGeometries } = await import('three/addons/utils/BufferGeometryUtils.js');
  var { TessellateModifier } = await import('three/addons/modifiers/TessellateModifier.js');
  var CSG = await import('three-bvh-csg');
  var BVH = await import('three-mesh-bvh');
  if (!vivo) return;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.setClearColor(0x000000, 0);           // transparente: o fundo de estúdio é o CSS do palco
  var cena = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(28, 1, 0.01, 10);
  cena.add(camera);
  /* LUZ UNIFORME (item 3): luz ambiente de céu/chão + uma luz principal PRESA NA CÂMERA, um pouco acima e à
     esquerda de quem olha. Girando a peça, a luz vem sempre do mesmo lado da tela: nada estoura, nada apaga,
     e a sombrinha dentro das letras continua desenhando o nome. */
  cena.add(new THREE.HemisphereLight(0xffffff, 0xb9b2a6, 1.25));
  var luzCamera = new THREE.DirectionalLight(0xffffff, 1.35);
  luzCamera.position.set(-0.25, 0.35, 0.2);
  camera.add(luzCamera); camera.add(luzCamera.target); luzCamera.target.position.set(0, 0, -1);

  var controles = new OrbitControls(camera, canvas);
  controles.enableDamping = true; controles.enablePan = false;
  controles.autoRotate = !/debug3d/.test(location.search); controles.autoRotateSpeed = 1.2;
  controles.minDistance = 0.25; controles.maxDistance = 1.2;
  controles.maxPolarAngle = Math.PI * 0.62;
  controles.addEventListener('start', function () { controles.autoRotate = false; });
  function redimensionar() {
    var w = palco.clientWidth, h = palco.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    if (raioPeca && controles) {
      var d = camera.position.clone().sub(controles.target);
      camera.position.copy(controles.target).addScaledVector(d.normalize(), distanciaQueCabe());
      if (typeof frente !== 'undefined' && frente) frente.copy(controles.target).addScaledVector(direcao, distanciaQueCabe());
    }
  }
  window.addEventListener('resize', redimensionar);
  if (window.ResizeObserver) new ResizeObserver(redimensionar).observe(palco);
  redimensionar();
  (function laco() { if (!vivo) return; controles.update(); renderer.render(cena, camera); requestAnimationFrame(laco); })();

  /* ---------------- materiais */
  /* v8: a PELE FELPUDA (1) e a TEXTURA DA COR (2) entram no sombreador de cada material. Tudo é medido em mm no
     espaço da peça (a malha está em metros, sem transformação), então o grão tem o tamanho de verdade. */
  var PELE = cfg.pele || null;
  var branco1px = new THREE.DataTexture(new Uint8Array([128, 128, 128, 255]), 1, 1);
  branco1px.needsUpdate = true;
  var texturas = {};
  function texturaDe(url) {
    if (!texturas[url]) {
      var t = new THREE.TextureLoader().load(url);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.colorSpace = THREE.NoColorSpace;             // é desenho (razão de luz), não cor
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      texturas[url] = t;
    }
    return texturas[url];
  }
  var GLSL_RUIDO = [
    'varying vec3 vPosW;',
    'uniform vec4 uPele;',        // x liga, y espessura (mm), z frequência (1/mm), w persistência
    'uniform float uPeleOit;',
    'uniform float uUsaMapa;',
    'uniform sampler2D uMapa;',
    'uniform vec2 uMapaMm;',
    'uniform float uContraste;',
    /* ruído de gradiente 3D clássico (Perlin; Stefan Gustavson, domínio público) — o mesmo tipo do libnoise que o
       Bambu Studio usa no "billow" */
    'vec4 aP289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}',
    'vec4 aPerm(vec4 x){return aP289(((x*34.0)+10.0)*x);}',
    'vec4 aTaylor(vec4 r){return 1.79284291400159-0.85373472095314*r;}',
    'vec3 aFade(vec3 t){return t*t*t*(t*(t*6.0-15.0)+10.0);}',
    'float aCnoise(vec3 P){',
    ' vec3 Pi0=floor(P);vec3 Pi1=Pi0+vec3(1.0);Pi0=aP289(Pi0.xyzz).xyz;Pi1=aP289(Pi1.xyzz).xyz;',
    ' vec3 Pf0=fract(P);vec3 Pf1=Pf0-vec3(1.0);',
    ' vec4 ix=vec4(Pi0.x,Pi1.x,Pi0.x,Pi1.x);vec4 iy=vec4(Pi0.yy,Pi1.yy);vec4 iz0=Pi0.zzzz;vec4 iz1=Pi1.zzzz;',
    ' vec4 ixy=aPerm(aPerm(ix)+iy);vec4 ixy0=aPerm(ixy+iz0);vec4 ixy1=aPerm(ixy+iz1);',
    ' vec4 gx0=ixy0*(1.0/7.0);vec4 gy0=fract(floor(gx0)*(1.0/7.0))-0.5;gx0=fract(gx0);',
    ' vec4 gz0=vec4(0.5)-abs(gx0)-abs(gy0);vec4 sz0=step(gz0,vec4(0.0));gx0-=sz0*(step(0.0,gx0)-0.5);gy0-=sz0*(step(0.0,gy0)-0.5);',
    ' vec4 gx1=ixy1*(1.0/7.0);vec4 gy1=fract(floor(gx1)*(1.0/7.0))-0.5;gx1=fract(gx1);',
    ' vec4 gz1=vec4(0.5)-abs(gx1)-abs(gy1);vec4 sz1=step(gz1,vec4(0.0));gx1-=sz1*(step(0.0,gx1)-0.5);gy1-=sz1*(step(0.0,gy1)-0.5);',
    ' vec3 g000=vec3(gx0.x,gy0.x,gz0.x);vec3 g100=vec3(gx0.y,gy0.y,gz0.y);vec3 g010=vec3(gx0.z,gy0.z,gz0.z);vec3 g110=vec3(gx0.w,gy0.w,gz0.w);',
    ' vec3 g001=vec3(gx1.x,gy1.x,gz1.x);vec3 g101=vec3(gx1.y,gy1.y,gz1.y);vec3 g011=vec3(gx1.z,gy1.z,gz1.z);vec3 g111=vec3(gx1.w,gy1.w,gz1.w);',
    ' vec4 n0=aTaylor(vec4(dot(g000,g000),dot(g010,g010),dot(g100,g100),dot(g110,g110)));g000*=n0.x;g010*=n0.y;g100*=n0.z;g110*=n0.w;',
    ' vec4 n1=aTaylor(vec4(dot(g001,g001),dot(g011,g011),dot(g101,g101),dot(g111,g111)));g001*=n1.x;g011*=n1.y;g101*=n1.z;g111*=n1.w;',
    ' float n000=dot(g000,Pf0);float n100=dot(g100,vec3(Pf1.x,Pf0.yz));float n010=dot(g010,vec3(Pf0.x,Pf1.y,Pf0.z));',
    ' float n110=dot(g110,vec3(Pf1.xy,Pf0.z));float n001=dot(g001,vec3(Pf0.xy,Pf1.z));float n101=dot(g101,vec3(Pf1.x,Pf0.y,Pf1.z));',
    ' float n011=dot(g011,vec3(Pf0.x,Pf1.yz));float n111=dot(g111,Pf1);',
    ' vec3 f=aFade(Pf0);vec4 nz=mix(vec4(n000,n100,n010,n110),vec4(n001,n101,n011,n111),f.z);',
    ' vec2 nyz=mix(nz.xy,nz.zw,f.y);return 2.2*mix(nyz.x,nyz.y,f.x);}',
    /* billow (libnoise): soma das oitavas de (2|ruído|-1), cada uma com o dobro da frequência e "persistência" da
       força. A oitava mais fina que ~2 pixels na tela é apagada (senão o grão cintila ao girar). */
    'float aBillow(vec3 p, float px){',
    ' float s=0.0, a=1.0, f=uPele.z;',
    ' for(int i=0;i<8;i++){ if(float(i)>=uPeleOit) break;',
    '  float lamb=1.0/f; float some=clamp(lamb/max(px,1e-4)-1.0,0.0,1.0);',
    '  s+=a*some*(2.0*abs(aCnoise(p*f))-1.0); a*=uPele.w; f*=2.0; }',
    ' return s;}'
  ].join('\n');
  var GLSL_PELE = [
    '#include <normal_fragment_maps>',
    'if (uPele.x > 0.5) {',
    ' vec3 pW = vPosW * 1000.0;',
    ' vec3 nW = normalize(cross(dFdx(vPosW), dFdy(vPosW)));',
    /* só PAREDE: o fatiador enruga o contorno de cada camada; topo e fundo planos saem lisos */
    ' float parede = 1.0 - smoothstep(0.75, 0.95, abs(nW.y));',
    ' if (parede > 0.0) {',
    '  vec3 t1 = normalize(cross(vec3(0.0, 1.0, 0.0), nW)); vec3 t2 = cross(nW, t1);',
    '  float px = max(length(dFdx(pW)), length(dFdy(pW))); float e = 0.04;',
    '  float h0 = aBillow(pW, px), h1 = aBillow(pW + t1 * e, px), h2 = aBillow(pW + t2 * e, px);',
    '  vec3 np = normalize(nW - parede * uPele.y * ((h1 - h0) / e * t1 + (h2 - h0) / e * t2));',
    '  normal = normalize(mat3(viewMatrix) * np);',
    ' }',
    '}'
  ].join('\n');
  var GLSL_MAPA = [
    '#include <map_fragment>',
    'if (uUsaMapa > 0.5) {',
    ' vec3 pM = vPosW * 1000.0;',
    ' vec3 nM = normalize(cross(dFdx(vPosW), dFdy(vPosW)));',
    ' vec3 wM = pow(abs(nM), vec3(4.0)); wM /= (wM.x + wM.y + wM.z);',
    ' vec2 kM = 1.0 / uMapaMm;',
    ' float tM = texture(uMapa, pM.zy * kM).r * wM.x + texture(uMapa, pM.xz * kM).r * wM.y + texture(uMapa, pM.xy * kM).r * wM.z;',
    /* a textura guarda 0,5 + (razão - 1) × 2  (07_textura_de_filamento_v1): razão = 1 + (t - 0,5) × 0,5 */
    ' diffuseColor.rgb *= max(0.0, 1.0 + (tM - 0.5) * 0.5 * uContraste);',
    '}'
  ].join('\n');
  function vestir(m) {
    var u = {
      uPele: { value: PELE ? new THREE.Vector4(1, PELE.espessuraMm || 0.2, 1 / (PELE.escalaMm || 1), PELE.persistencia || 0.5)
                           : new THREE.Vector4(0, 0, 1, 0.5) },
      uPeleOit: { value: PELE ? (PELE.oitavas || 4) : 0 },
      uUsaMapa: { value: 0 }, uMapa: { value: branco1px },
      uMapaMm: { value: new THREE.Vector2(50, 50) }, uContraste: { value: 1 }
    };
    m._alea = u;
    m.onBeforeCompile = function (s) {
      Object.keys(u).forEach(function (k) { s.uniforms[k] = u[k]; });
      s.vertexShader = 'varying vec3 vPosW;\n' + s.vertexShader.replace('#include <project_vertex>',
        '#include <project_vertex>\nvPosW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      s.fragmentShader = GLSL_RUIDO + '\n' + s.fragmentShader
        .replace('#include <map_fragment>', GLSL_MAPA)
        .replace('#include <normal_fragment_maps>', GLSL_PELE);
    };
    m.customProgramCacheKey = function () { return 'alea-v8'; };
    return m;
  }
  function material(hex, acab, extra) {
    var m = vestir(new THREE.MeshStandardMaterial(Object.assign({ color: new THREE.Color(hex), flatShading: true, side: THREE.DoubleSide },
      ACABAMENTO_MATERIAL[acab] || ACABAMENTO_MATERIAL.fosco)));
    pintar(m, hex, acab, extra); return m;
  }
  function pintar(m, hex, acab, extra) {
    var a = ACABAMENTO_MATERIAL[acab] || ACABAMENTO_MATERIAL.fosco;
    extra = extra || {};
    m.color.set(hex);
    m.roughness = extra.rugosidade != null ? extra.rugosidade : a.roughness;
    m.metalness = extra.metal != null ? extra.metal : a.metalness;
    m.userData.acab = acab;
    var tx = extra.textura, u = m._alea;
    if (!u) return;
    u.uUsaMapa.value = tx ? 1 : 0;
    u.uMapa.value = tx ? texturaDe(tx.img) : branco1px;
    if (tx) { u.uMapaMm.value.set(tx.mm[0], tx.mm[1]); u.uContraste.value = tx.contraste != null ? tx.contraste : 1; }
  }
  /* a cor de um filamento pelo acabamento + nome do site (traz a textura e o brilho próprio, se tiver) */
  var FIL = (window.ALEA || {}).filamentos || {};
  function filamento(acab, cor) {
    return (FIL[acab] || []).filter(function (x) { return x.site === cor; })[0] || null;
  }
  var ordemZonas = ['topo', 'principal', 'base'];
  var mats = {};
  ordemZonas.forEach(function (z) {
    var o = cfg.original[z];
    mats[z] = material(o.hex, o.acabamento, filamento(o.acabamento, o.site));
  });
  var zonaNome = cfg.zonaNome || 'principal';                          // v7 (1)
  var BICOLOR = cfg.bicolor || { topo: 0, principal: 1, base: 1 };      // v7 (2)
  /* a letra: mesma pele felpuda (o fatiador enruga TODAS as paredes, inclusive as da gravação), sem textura própria */
  var matLetra = vestir(mats[zonaNome].clone());

  /* ---------------- a peça e o quadro do nome */
  var semNome = !!cfg.semNome;                                          // v13: peça sem nome gravado (saboneteira)
  var [gltf, quadro, fonteBin] = await Promise.all([
    new GLTFLoader().loadAsync(cfg.glb),
    semNome ? null : fetch(cfg.nome).then(function (r) { return r.json(); }),
    /* reversed: a Defante é .otf (curvas CFF) e desenha os contornos no sentido contrário — sem isso o miolo do
       "o" e do "a" saía cheio (visto no "Cassiano", etapa 55) */
    semNome ? null : new Promise(function (ok, erro) { var L = new TTFLoader(); L.reversed = cfg.fonteInvertida !== false; L.load(cfg.fonte, ok, undefined, erro); })
  ]);
  if (!vivo) return;
  var fonte = semNome ? null : new Font(fonteBin);
  function zonaDoMaterial(nome) { return nome.indexOf('topo') >= 0 ? 'topo' : nome.indexOf('base') >= 0 ? 'base' : 'principal'; }
  var partes = [], zonaPorGrupo = [];
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse(function (o) {
    if (!o.isMesh) return;
    var g = o.geometry.clone().applyMatrix4(o.matrixWorld);
    Object.keys(g.attributes).forEach(function (a) { if (a !== 'position' && a !== 'normal') g.deleteAttribute(a); });
    if (!g.attributes.normal) g.computeVertexNormals();
    g.clearGroups();
    partes.push(g);
    zonaPorGrupo.push(zonaDoMaterial((o.material && o.material.name) || ''));
  });
  var geo = mergeGeometries(partes, true);
  var matsArray = ordemZonas.map(function (z) { return mats[z]; });
  geo.groups.forEach(function (g, i) { g.materialIndex = ordemZonas.indexOf(zonaPorGrupo[i]); });
  var corpoBrush = new CSG.Brush(geo, matsArray);
  corpoBrush.updateMatrixWorld();

  /* v13: sem nome gravado não há quadro — nada do bloco abaixo (até o PROF) é montado, e gravar('') nunca o usa */
  if (!semNome) {
  var M = new THREE.Matrix4(), q = quadro.matriz_mundo_zup;
  M.set(q[0][0], q[0][1], q[0][2], q[0][3], q[1][0], q[1][1], q[1][2], q[1][3],
        q[2][0], q[2][1], q[2][2], q[2][3], q[3][0], q[3][1], q[3][2], q[3][3]);
  var quadroMundo = new THREE.Matrix4().multiplyMatrices(new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1), M);
  var bb = quadro.bbox_local_texto;
  var centroX = (bb[0][0] + bb[1][0]) / 2, baseY = bb[0][1], altOrig = bb[1][1] - bb[0][1];
  /* v13: `var ... = function` (e não `function geoTexto`) porque agora mora dentro do if — num módulo, a declaração de
     função fica presa ao bloco e o gravar() lá embaixo não a acharia (visto no Luke, 03/10/2026) */
  var geoTexto = function (txt, tamanho, prof) {
    var g = new TextGeometry(txt, { font: fonte, size: tamanho, depth: prof, curveSegments: 6, bevelEnabled: false });
    g.computeBoundingBox(); return g;
  };
  var ref = geoTexto(quadro.text_info.text || 'Luke', 10, 1);
  var k = altOrig / (ref.boundingBox.max.y - ref.boundingBox.min.y);
  var baseRef = ref.boundingBox.min.y;
  }

  THREE.Mesh.prototype.raycast = BVH.acceleratedRaycast;
  THREE.BufferGeometry.prototype.computeBoundsTree = BVH.computeBoundsTree;
  var corpoRaio = new THREE.Mesh(geo.clone(), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  corpoRaio.geometry.computeBoundsTree();
  var eixo = new THREE.Box3().setFromBufferAttribute(geo.attributes.position).getCenter(new THREE.Vector3());
  var raio = new THREE.Raycaster(); raio.firstHitOnly = true;
  var PROF = semNome ? 0 : (parseFloat(quadro.text_info.thickness) || 1.5) / 1000;
  var quadroEscalaMm = semNome ? 1 : new THREE.Vector3().setFromMatrixColumn(quadroMundo, 0).length() * 1000;
  var avaliador = new CSG.Evaluator();
  avaliador.useGroups = true;
  avaliador.attributes = ['position', 'normal'];
  var resultado = null, preenchida = null, nomeColorido = false, frente = null;

  function gravar(nome) {
    nome = (nome || '').trim();
    var alvo = corpoBrush;
    if (nome) {
      /* o nome acompanha a parede facetada: cada ponto desce até a parede de verdade e a gravação fica com a
         profundidade do arquivo (thickness), igual na palavra toda */
      var t = geoTexto(nome, 10 * k, 1);
      var largura = t.boundingBox.max.x - t.boundingBox.min.x;
      t.translate(centroX - (t.boundingBox.min.x + largura / 2), baseY - baseRef * k, 0);
      t.deleteAttribute('uv');
      t = new TessellateModifier(0.8 / (quadroEscalaMm || 1), 8).modify(t.index ? t.toNonIndexed() : t);
      t = mergeVertices(t);
      var pos = t.attributes.position, v = new THREE.Vector3(), plano = new THREE.Vector3(), posPreenchida = [];
      var fora = new THREE.Vector3(), origem = new THREE.Vector3(), menos = new THREE.Vector3();
      for (var i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        var frente = v.z > 0.5;
        plano.set(v.x, v.y, 0).applyMatrix4(quadroMundo);
        fora.set(plano.x - eixo.x, 0, plano.z - eixo.z).normalize();
        origem.set(eixo.x, plano.y, eixo.z).addScaledVector(fora, 0.5);
        raio.set(origem, menos.copy(fora).negate());
        var hit = raio.intersectObject(corpoRaio, false)[0];
        var S = hit ? hit.point : plano;
        var pi = S.clone().addScaledVector(fora, frente ? -0.00015 : -PROF);   // letra preenchida: rente, por dentro
        posPreenchida.push(pi.x, pi.y, pi.z);
        v.copy(S).addScaledVector(fora, frente ? 0.0015 : -PROF);
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      pos.needsUpdate = true;
      t.computeVertexNormals();
      t.clearGroups();
      /* a LETRA PREENCHIDA do nome colorido: o mesmo texto com a frente 0,15 mm pra dentro da parede. Aparece
         pelo buraco da gravação e garante a palavra inteira à vista mesmo onde o corte falha numa letra
         (visto no "Cassiano" em cor, etapa 55) */
      if (preenchida) { cena.remove(preenchida); preenchida.geometry.dispose(); }
      var gp = t.clone(); gp.setAttribute('position', new THREE.Float32BufferAttribute(posPreenchida, 3)); gp.computeVertexNormals();
      preenchida = new THREE.Mesh(gp, matLetra);
      preenchida.visible = nomeColorido;
      cena.add(preenchida);
      var textoBrush = new CSG.Brush(t, matLetra);
      textoBrush.updateMatrixWorld();
      try { alvo = avaliador.evaluate(corpoBrush, textoBrush, CSG.SUBTRACTION); }
      catch (e) { console.warn('gravação do nome falhou', e); alvo = corpoBrush; }
    }
    if (!nome && preenchida) { cena.remove(preenchida); preenchida.geometry.dispose(); preenchida = null; }
    if (resultado) { cena.remove(resultado); if (resultado.geometry !== geo) resultado.geometry.dispose(); }
    resultado = alvo === corpoBrush ? new THREE.Mesh(geo, matsArray) : alvo;
    if (Array.isArray(resultado.material)) {
      resultado.material = resultado.material.map(function (m) { return matsArray.indexOf(m) >= 0 ? m : matLetra; });
    }
    cena.add(resultado);
  }

  /* sombra macia sob a peça (um disco com degradê) — parte do "fundo de estúdio" */
  var caixa = new THREE.Box3().setFromBufferAttribute(geo.attributes.position);
  var centro = caixa.getCenter(new THREE.Vector3()), tam = caixa.getSize(new THREE.Vector3());
  (function sombra() {
    var c = document.createElement('canvas'); c.width = c.height = 128;
    var g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 8, 64, 64, 64);
    gr.addColorStop(0, 'rgba(40,32,24,.45)'); gr.addColorStop(1, 'rgba(40,32,24,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    var s = new THREE.Mesh(new THREE.PlaneGeometry(tam.x * 1.5, tam.z * 1.5),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
    s.rotation.x = -Math.PI / 2; s.position.set(centro.x, caixa.min.y - 0.0005, centro.z);
    cena.add(s);
  })();
  controles.target.copy(centro);
  /* enquadrar pela esfera da peça e pelo MENOR dos dois ângulos de visão: no celular o palco é alto e estreito,
     e medir só pela altura deixava a peça cortada dos lados (visto no teste de 390 px, etapa 56) */
  var raioPeca = caixa.getBoundingSphere(new THREE.Sphere()).radius;
  var direcao = new THREE.Vector3(0, 0.35, 1).normalize();
  function distanciaQueCabe() {
    var v = THREE.MathUtils.degToRad(camera.fov) / 2, h = Math.atan(Math.tan(v) * camera.aspect);
    return raioPeca * (cfg.folgaEnquadrar || 0.82) / Math.sin(Math.min(v, h));   // v13: peça larga e baixa pede mais folga
  }
  camera.position.copy(centro).addScaledVector(direcao, distanciaQueCabe());
  controles.maxDistance = distanciaQueCabe() * 1.8;
  controles.update();

  /* ---------------- o formulário manda na peça */
  function escolhaDoCampo(c) {
    if (!c) return null;
    var ac = c.querySelector('.acabamento input:checked'), sel = c.querySelector('select');
    if (!ac || !sel || !sel.value) return null;
    var f = filamento(ac.value, sel.value);                 // v8: a cor inteira (hex + textura + brilho próprio)
    return f && f.hex ? { hex: f.hex, acab: ac.value, fil: f } : null;
  }
  /* FUNDO QUE ACOMPANHA A PEÇA (item 2): tom médio; se a peça ficar clara, o estúdio escurece um pouco;
     se ficar escura, clareia — o contraste nunca some */
  function luminancia(hex) {
    var c = new THREE.Color(hex); return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  }
  function ajustarFundo(hexes) {
    var L = hexes.reduce(function (s, h) { return s + luminancia(h); }, 0) / hexes.length;
    var estudio = L > 0.62 ? ['#CFC6B8', '#9E9483'] : L < 0.22 ? ['#F1ECE3', '#D8D0C3'] : ['#E6DFD3', '#BFB5A5'];
    palco.style.setProperty('--estudio-centro', estudio[0]);
    palco.style.setProperty('--estudio-borda', estudio[1]);
  }
  function aplicarForm() {
    atualizarPelicula();
    var cxD = form && form.querySelector('[data-extra-caixa]'); if (cxD && cxD.checked) recadoPasso.hidden = true;
    if (!form) return;
    /* cores da peça: tricolor = topo/principal/base; bicolor = principal (+ topo) e base; mono = tudo igual */
    var modo = form.querySelector('input[name="cores_peca"]:checked');
    var campos = form.querySelectorAll('.cores-campos .campo-cor');
    var escolha = { topo: null, principal: null, base: null };
    if (modo) {
      var e = Array.prototype.map.call(campos, escolhaDoCampo);
      if (modo.value === 'tricolor') { escolha.topo = e[0]; escolha.principal = e[1]; escolha.base = e[2]; }
      else if (modo.value === 'bicolor') { ordemZonas.forEach(function (z) { escolha[z] = e[BICOLOR[z]]; }); }
      else if (modo.value === 'monocromatico') { escolha.topo = escolha.principal = escolha.base = e[0]; }
    }
    ordemZonas.forEach(function (z) {
      var o = cfg.original[z];
      var x = escolha[z] || { hex: o.hex, acab: o.acabamento, fil: filamento(o.acabamento, o.site) };
      pintar(mats[z], x.hex, x.acab, x.fil);
    });
    /* o nome: com "Um detalhe que transforma" + cor escolhida, a letra ganha a cor; sem isso, é a parede na sombra */
    var extra = form.querySelector('[data-extra-caixa]');
    var corNome = extra && extra.checked ? escolhaDoCampo(form.querySelector('.campo-cor-nome')) : null;
    nomeColorido = !!corNome;
    if (preenchida) preenchida.visible = nomeColorido;
    if (corNome) pintar(matLetra, corNome.hex, corNome.acab, corNome.fil);
    else {
      /* (6) a letra é a MESMA cor da peça; só a sombra de dentro muda de tom pra ler: peça escura -> um pouco mais
         clara; peça clara -> um pouco mais escura. Sem contorno, sem brilho (o cliente não pode achar que vem assim) */
      var mz = mats[zonaNome];
      var Lp = luminancia('#' + mz.color.getHexString());
      if (Lp < 0.18) matLetra.color.copy(mz.color).lerp(new THREE.Color(0xffffff), 0.12);
      else matLetra.color.copy(mz.color).multiplyScalar(0.72);
      matLetra.roughness = mz.roughness; matLetra.metalness = mz.metalness;
      /* v8: a gravação é o mesmo filamento da parede -> mesma textura (as pintas do mármore seguem dentro da letra) */
      ['uUsaMapa', 'uMapa', 'uContraste'].forEach(function (k) { matLetra._alea[k].value = mz._alea[k].value; });
      matLetra._alea.uMapaMm.value.copy(mz._alea.uMapaMm.value);
    }
    ajustarFundo(ordemZonas.map(function (z) { return '#' + mats[z].color.getHexString(); }));
  }
  var campoNome = form && form.querySelector('[name="nome_pet"]');
  /* (7) o NOME na peça: abre com o original da foto; digitou, muda; apagou no passo 1, volta o original; saiu do
     passo 1 em branco (confirmado), a peça fica lisa */
  function nomeParaMostrar() {
    if (semNome) return '';                                        // v13: a saboneteira é sempre lisa
    if (form && form.hasAttribute('data-sem-nome')) return '';   // v11: quadradinho Sem nome marcado = peça lisa
    var v = campoNome ? campoNome.value.trim() : '';
    if (v) return v;
    return passoAtual === 0 ? (cfg.nomeInicial || quadro.text_info.text || '') : '';
  }
  window.aleaGravarNome = function () { gravar(nomeParaMostrar()); };
  frente = camera.position.clone();
  function virarPraFrente() {
    controles.autoRotate = false;
    var de = camera.position.clone(), t0 = performance.now();
    (function passo() {
      var u = Math.min(1, (performance.now() - t0) / 600), e = 1 - Math.pow(1 - u, 3);
      camera.position.lerpVectors(de, frente, e);
      if (u < 1 && vivo) requestAnimationFrame(passo);
    })();
  }
  if (campoNome) campoNome.addEventListener('focus', virarPraFrente);
  /* (10) TOQUE (sem arrastar) na peça: vira de frente e para; só volta a mexer se arrastar */
  var toque = null;
  canvas.addEventListener('pointerdown', function (e) { toque = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  canvas.addEventListener('pointerup', function (e) {
    if (!toque) return;
    var mexeu = Math.hypot(e.clientX - toque.x, e.clientY - toque.y), tempo = performance.now() - toque.t;
    toque = null;
    if (mexeu < 8 && tempo < 350) virarPraFrente();
  });
  if (opcoes.parado) { controles.autoRotate = false; camera.position.copy(frente); controles.update(); }
  gravar(nomeParaMostrar());
  aplicarForm();
  fundo.querySelector('.janela3d-carregando').hidden = true;
  var espera = null;
  function aoMexer(ev) {
    if (ev.target === campoNome) {
      clearTimeout(espera);
      if (campoNome.value.trim() && form) form.removeAttribute('data-sem-nome');
      espera = setTimeout(function () { gravar(nomeParaMostrar()); }, 60);
      if (campoNome.value.trim()) recadoPasso.hidden = true;
    }
    /* v11: marcou/desmarcou o Sem nome -> a peça fica lisa / volta o nome na hora, e o recado de falta some */
    if (ev.target && ev.target.hasAttribute && ev.target.hasAttribute('data-sem-nome-caixa')) {
      clearTimeout(espera);
      if (ev.target.checked) recadoPasso.hidden = true;
      espera = setTimeout(function () { gravar(nomeParaMostrar()); }, 0);
    }
    setTimeout(aplicarForm, 0);   // depois que o produto.js redesenhar as janelas de cor
  }
  if (form) { form.addEventListener('input', aoMexer); form.addEventListener('change', aoMexer); }

  limpar = function () {
    if (form) { form.removeEventListener('input', aoMexer); form.removeEventListener('change', aoMexer); }
    if (campoNome) campoNome.removeEventListener('focus', virarPraFrente);
    window.removeEventListener('resize', redimensionar);
    renderer.dispose();
  };
  return { gravar: gravar, mats: mats };
}
