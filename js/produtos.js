/* CATALOGO:
   nome: produtos
   categoria: UTIL
   objetivo: Define categorias, itens do feed e fichas de produto e valida referências e materiais do catálogo.
   entrada: Dados comerciais editados diretamente no arquivo
   saida: Objetos globais de categorias, vitrine e produtos, além de alertas no console
   status: ativo (cabecalho proposto pelo Codex em 2026-09-20, confianca ALTA; conferir na proxima vez que o script rodar)
   validado_em: TBD
*/
/* =============================================================================
   produtos.js — O CATÁLOGO. É o único arquivo que muda no dia a dia.
   =============================================================================

   COMO MEXER (vale para quem não programa)
   ----------------------------------------
   Cada item é um bloco entre chaves { }, separado por vírgula.
   Copie um bloco inteiro, cole embaixo e troque os valores.

   REGRAS QUE NÃO PODEM SER QUEBRADAS
   - Todo texto fica entre aspas simples:   'Comedouro ālea'
   - Número fica SEM aspas e SEM ponto:     179   (não 'R$ 179,00')
   - Preço que ainda não existe? escreva    null  (o site mostra "sob consulta")
   - A vírgula separa um bloco do outro; o ÚLTIMO bloco não leva vírgula no fim.

   ⚠️ O PREÇO DAQUI É O PREÇO DO ANÚNCIO. O Google reprova (e o CDC pune) anúncio que
   mostra um valor e página que mostra outro. Mudou o preço aqui, muda no anúncio.

   ⚠️ MEXEU AQUI? RODE `python 01_gerar_paginas_v1.py`. As páginas de produto são
   GERADAS a partir deste arquivo — editar o HTML delas à mão é trabalho perdido na
   próxima geração. E é o gerador que PERGUNTA o material (PLA ou PETG) de toda peça
   nova, do jeito que o Cassiano pediu em 15/09/2026: peça sem material não vai pro ar.
   ========================================================================== */


/* ---------------------------------------------------------------------------
   0) AS CATEGORIAS — o menu da abertura (Cassiano, 15/09/2026).
   ---------------------------------------------------------------------------
   A ORDEM DAQUI É A ORDEM DO MENU, e é a ordem alfabética que ele mandou.
   `id` é o que aparece no endereço (index.html#pet) e o que liga produto e categoria;
   não mexer nele depois que um link estiver circulando por aí.

   ⚠️ SÓ A "PET" TEM PEÇA HOJE. As outras seis nasceram do menu que ele mandou, e o
   que falta nelas é PRODUTO, não código: basta pôr `categoria: 'glow'` num bloco lá
   embaixo e a categoria acende sozinha. Enquanto vazia, ela aparece no menu marcada
   "em breve" e não abre feed nenhum — clique que não leva a nada é o defeito que o
   Google trata como experiência ruim, e é o que mais irrita visitante.

   ⚠️ A DESCRIÇÃO ESTÁ VAZIA DE PROPÓSITO. Ele mandou os NOMES, não o que cada um
   quer dizer, e o palpite de quem não vende a peça vira texto errado no ar. O que eu
   imaginaria está no comentário de cada linha — ele confirma ou corrige, aí entra.

   ⚠️ A DESCRIÇÃO APARECE NO TOPO DO FEED (16/09/2026, áudio das 13:11): "a partir da hora
   que ele clica em PET, aí ele já no topo já coloca ali (…) a nossa linha PET é voltada
   pra cachorro (…) um textinho pequeno explicativo, só pra ele ver: ah, não é isso que
   eu quero não, aí ele volta na página e clica no outro". A PET é a primeira com o
   significado dito por ele. UMA LINHA SÓ: no celular pequeno (360×640) o espaço entre o
   cabeçalho e a peça é de 47 px, medido. Frase maior que isso cai em cima da foto. */
window.CATEGORIAS = [
  { id: 'custom', nome: 'CUSTOM', descricao: '' },   // sugestão minha: peça sob projeto, do zero
  { id: 'fan',    nome: 'FAN',    descricao: '' },   // sugestão minha: cultura pop, coleção
  { id: 'glow',   nome: 'GLOW',   descricao: '' },   // sugestão minha: filamento que brilha no escuro
  { id: 'home',   nome: 'HOME',   descricao: '' },   // sugestão minha: casa e decoração
  /* ⚠️ TEXTO PROVISÓRIO (etapa 3, 22/09/2026): o Cassiano pediu um placeholder sobre golden
     retriever "só pra ver o espaçamento do título e da descrição antes das fotos" — ele escreve
     o texto de verdade depois. TROCAR quando ele mandar o definitivo. */
  /* 25/09/2026 10:26 (msg 1473, texto DELE, palavra por palavra) — antes era o texto do golden retriever. */
  { id: 'pet',    nome: 'PET',    descricao: 'Nossa linha PET foi criada para trazer mais alegria e personalidade à sua casa, criando um cantinho especial para quem, mesmo sem dizer uma palavra, transborda amor, alegria e companheirismo.' },
  { id: 'play',   nome: 'PLAY',   descricao: '' },   // sugestão minha: brinquedo e jogo
  { id: 'sense',  nome: 'SENSE',  descricao: '' }    // sugestão minha: sensorial, fidget
];


/* ---------------------------------------------------------------------------
   1) O FEED — uma peça por tela, na ordem em que aparecem.
   "Você nunca consegue ver duas imagens ao mesmo tempo" (Cassiano, 14/09/2026).
   ---------------------------------------------------------------------------
   `fotos` é a fila do arrasto horizontal. A PRIMEIRA é a foto-mãe: é dela que sai o
   OBJETO RECORTADO (sem fundo) que ocupa o centro do feed — o `_obj.webp` gerado pelo
   `_recortar_fundo_v1.py`. Da segunda em diante são as FOTOS INTEIRAS, com cenário,
   que só aparecem quando o visitante arrasta pro lado. É o pedido literal de 15/09:
   "tirar as fotos sempre sem fundo, somente o objeto […] deixando as fotos completas
   somente se arrastar pro lado".

   ⚠️ ETAPA 108 (25/09/2026, áudio 1637 do Cassiano): "toda foto que você tiver recortado, esquece, deixa só as fotos
  profissionais" — TODOS os itens passaram a `recorte: false` (os `_obj.webp` continuam no repositório, só não
  entram mais no feed) e a foto profissional, onde existe, é a primeira — no feed, a versão QUADRADA (pro_luke_1q, do\n  recorte do próprio Cassiano, msg 1645; pro_matteo_1q, janela da orelha ao comedouro): o feed desenha num quadrado e a\n  foto em pé saía ESTICADA (áudios 1643-1646: 'nunca cortar nem o cachorro nem o comedouro, ampliar o mínimo').
  `recorte: true` quer dizer que existe o arquivo `<primeira foto>_obj.webp`, o objeto
   sem fundo, gerado pelo `_recortar_fundo_v1.py`. `recorte: false` quer dizer que aquela
   peca ainda NAO tem foto com o objeto inteiro dentro do quadro -- ela aparece no feed
   com moldura, como antes, e e' honesto: melhor uma foto normal do que meia tigela
   flutuando. Assim que chegar uma foto da peca sozinha, vira `true`.

   `categoria` tem que ser um `id` da lista lá em cima. Errou o nome? A peça não
   aparece em feed nenhum — e a conferência do fim deste arquivo reclama no console
   em vez de deixar você descobrir pelo cliente. */
/* ⚠️ 25/09/2026 (lote das 20:01, msg 1884 do Cassiano): "Tira tudo o que está lá, e coloca somente os que te mandei!"
   A vitrine passa a ter SÓ os 4 produtos do lote, NA ORDEM em que ele mandou (áudio 1850: "o Luke é o 1º, o principal").
   Título = nome da pasta/zip dele, com o "ALEA" escrito como o ālea do site (áudio 1852). Preço: "sob consulta"
   (msg 1885) -> `preco: null`, que o site já mostra como "Sob consulta" no feed, na página e na sacola.
   A foto do feed é SÓ a capa quadrada (<prefixo>_capaq, feita pelo 06_fotos_profissionais_v2): o feed desenha num
   quadrado (WebGL) e foto que não é quadrada sai esticada; as outras fotos do lote não são quadradas, e fazê-las
   quadradas seria cortar cachorro ou comedouro (_REGRA_CAPA_DO_FEED.md). Todas as fotos estão na página do produto.
   ⚠ Matteo e Ayla: a Capa.JPG deles NÃO cabe na regra da capa ("essa foto não serve pra capa"): o capaq deles é a foto
   INTEIRA com faixas lisas dos lados, provisório até ele mandar outra capa. Ver 03_site/_LEIA_4_PRODUTOS_2026-09-25.md.
   O que estava aqui antes (Bowl Wave de Luke, Ayla, Tina Preta, Chica, Matteo, Cláudia; Poop Bag; Kit) SAIU da vitrine
   — as páginas e as fotos continuam no disco. A lista antiga, pra voltar num piscar, está no comentário logo abaixo. */
/* ⚠️ NOMES COLLAB (26/09/2026, decididos pelo Cassiano): "Pet Bowl" no lugar de "Dog Bowl", o pet vira "× Nome" no fim
   e a Cláudia leva acento. Antes: ālea Luke Bowl / ālea Matteo Texturized / ālea Ayla Pompom / ālea Cláudia Wave.
   O feed.js (v32) parte o nome no " × " e desenha o "× Nome" pequeno numa 2ª linha; sacola, resumo e WhatsApp usam o
   nome inteiro numa linha (vem do data-nome da página). Slug, página e fotos NÃO mudaram (links continuam valendo).
   Quem aplica a troca: 03_site/_nomes_collab_v1_2026-09-26.py (idempotente). */
window.VITRINE = [
  { produto: 'ālea Pet Bowl × Luke',                      nome: 'Luke',    categoria: 'pet', preco: null, pagina: 'luke-bowl',         recorte: false, fotos: ['lukebowl_capaq'] },
  { produto: 'ālea Elevated Pet Bowl × Matteo',           nome: 'Matteo',  categoria: 'pet', preco: null, pagina: 'matteo-texturized', recorte: false, fotos: ['matteotex_capaq'] },
  { produto: 'ālea Pet Bowl – Watermelon Edition × Ayla Pompom', nome: 'Ayla Pompom',    categoria: 'pet', preco: null, pagina: 'ayla-pompom',       recorte: false, fotos: ['aylapompom_capaq'] },
  { produto: 'ālea Pet Bowl Wave × Cláudia',              nome: 'Cláudia', categoria: 'pet', preco: null, pagina: 'claudia-wave',      recorte: false, fotos: ['claudiawave_anjoq'] }
];
/* A VITRINE ATÉ 25/09/2026 20:01 (fora do ar por ordem dele, msg 1884) — guardada, não apagada:
window.VITRINE = [
  { produto: 'ālea Bowl Wave', nome: 'Luke',       categoria: 'pet', preco: 179,  pagina: 'bowl-wave',       recorte: false,  fotos: ['pro_luke_1q','luke_1','luke_2','luke_3','luke_4'] },
  { produto: 'ālea Bowl Wave', nome: 'Ayla',       categoria: 'pet', preco: 179,  pagina: 'bowl-wave',       recorte: false, fotos: ['ayla_1','ayla_2','ayla_3','ayla_4'] },
  { produto: 'ālea Bowl Wave', nome: 'Tina Preta', categoria: 'pet', preco: 179,  pagina: 'bowl-wave',       recorte: false,  fotos: ['tina_1','tina_2','tina_3','tina_4'] },
  { produto: 'ālea Bowl Wave', nome: 'Chica',      categoria: 'pet', preco: 179,  pagina: 'bowl-wave',       recorte: false,  fotos: ['chica_1','chica_2','chica_3'] },
  { produto: 'ālea Bowl Wave', nome: 'Matteo',     categoria: 'pet', preco: 179,  pagina: 'bowl-wave',       recorte: false,  fotos: ['matteo_1','matteo_2','matteo_3'] },
  { produto: 'ālea Bowl Wave', nome: 'Cláudia',    categoria: 'pet', preco: 179,  pagina: 'bowl-wave',       recorte: false,  fotos: ['claudia_1','claudia_2','claudia_3','claudia_4'] },
  { produto: 'ālea Poop Bag',  nome: 'Chica',      categoria: 'pet', preco: 59,   pagina: 'poop-bag-holder', recorte: false,  fotos: ['saquinho_1','saquinho_2','saquinho_3'] },
  { produto: 'Kit ālea',       nome: 'Tina Preta', categoria: 'pet', preco: null, pagina: 'kit',             recorte: false,  fotos: ['kit_1','kit_2','kit_3'] }
];
*/


/* ---------------------------------------------------------------------------
   2) AS PÁGINAS DE PRODUTO — aqui mora TODO o texto que saiu do feed.
   "Quando ela clicar lá, que apareça as instruções" (Cassiano, áudio 3, 00:14).
   É esta página que vira a página de destino do Google Ads: é ela que tem conteúdo
   original suficiente pra política de destino, que o feed sozinho não teria.
   ---------------------------------------------------------------------------
   A FICHA (material, personalização, produção, cores) sai do `ficha_padrao` do
   config.js. Só escreva `personalizacao`, `producao` ou `cores` num produto quando
   AQUELA peça fugir do padrão — repetir o padrão em cada bloco é o caminho mais curto
   pra um dia eles divergirem entre si.

   `material` é o único obrigatório peça a peça: PLA e PETG não são a mesma coisa pro
   cliente (PETG aguenta calor e sol; PLA não), e o Cassiano pediu justamente para ser
   perguntado a cada peça nova. */
window.PRODUTOS = [

  /* ===================================================================================================
     OS 4 PRODUTOS DO LOTE DE 25/09/2026 20:01 (msgs 1847-1865 do Cassiano). Páginas geradas pelo
     01_gerar_paginas_v18_quatro_produtos_2026-09-25.py; fotos pelo 06_fotos_profissionais_v2_lote_4_produtos_2026-09-25.py.
     - DESCRIÇÃO VAZIA DE PROPÓSITO (resumo e paragrafos): ele vai mandar a de cada um (áudio 1856: "uma por uma").
       A página só mostra o "*Ps.: Acompanha tigela em inox." (regra dele de 22/09 pra TODO comedouro, gerador v10).
     - PREÇO null = "Sob consulta" (msg 1885).
     - MATERIAL 'PLA': lido do arquivo 3D DELE de cada peça (Metadata/project_settings.config do .3mf: filament_type =
       PLA em todos os filamentos), não suposto. O do Luke é o mesmo arquivo do antigo Bowl Wave.
     - `cores_peca`: as opções de "Cores da peça" daquela página (regra geral dele, áudio 1865: o MONOCROMÁTICO NUNCA
       sai da personalização). `personalizavel: false` = sem botão/formulário de personalização (Ayla, áudio 1864).
     - ÁLBUM só existe se houver foto daquela configuração (áudio 1865). Ordem: Tricolor · Bicolor · Monocromático.
     ⚠ ORDEM DOS CAMPOS: slug, nome, ... capa ANTES de configuracoes (o leitor por regex da v17 pega o 1º `nome:`/`capa:`).
     =================================================================================================== */

  {
    slug: 'luke-bowl',
    nome: 'ālea Pet Bowl × Luke',
    linha: 'Comedouro',
    categoria: 'pet',
    preco: null,
    material: 'PLA',
    /* ⚠ CAPA TROCÁVEL: ele autorizou MELHORAR a capa (áudio 1849: o comedouro é branco e o nome some), com aprovação
       dele antes. A versão nova entra pelo 06_fotos_profissionais_v2 (_capas_novas/luke-bowl.jpg) SEM mexer aqui. */
    capa: 'lukebowl_capa',
    /* medidas: as do antigo Bowl Wave, que SÃO do arquivo 3D do Luke (caixa do objeto, tamanho G) e o peso que ele
       mandou em 24/09 01:39 (198 g com a tigela; a ficha mostra +10%, regra dele). Mesma peça, mesmo número. */
    medidas: { peso_g: 198, altura_cm: 8.4, largura_cm: 21.3, comprimento_cm: 21.2 },
    cores_peca: ['tricolor', 'bicolor', 'monocromatico'],   // as mesmas do Bowl Wave de hoje (a janela 3D é a do Luke)
    /* SEM álbum bicolor: não há foto de bicolor do Luke (áudio 1848). */
    configuracoes: [
      { id: 'tricolor',      nome: 'Tricolor',      capa: 'lukebowl_capa', fotos: ['lukebowl_capa', 'lukebowl_0005', 'lukebowl_9148', 'lukebowl_9170', 'lukebowl_9185', 'lukebowl_9189', 'lukebowl_wa182751', 'lukebowl_wa182753', 'lukebowl_wa183050'] },
      { id: 'monocromatico', nome: 'Monocromático', capa: 'lukebowl_0241', fotos: ['lukebowl_0241', 'lukebowl_9291', 'lukebowl_9295', 'lukebowl_9304', 'lukebowl_9307', 'lukebowl_9312', 'lukebowl_9313', 'lukebowl_9318'] }
    ],
    resumo: '',
    paragrafos: [   // 27/09/2026: texto DELE aprovado no Telegram (msgs 2371-2427)
      "A ideia deste comedouro veio da vontade de criar algo com muita personalidade, um presente pro meu cachorro. Pra quem não sabe, eu tenho dois Goldens, e o meu primeiro se chama Luke, que é o lindão/gordão aí da capa! Haha’",
      "Eu queria uma peça bonita, leve, colorida e, CLARO, em low poly.",
      "Só que foram muitos desafios. Eu não sabia modelar, muito menos fazer low poly. Pedi ajuda à minha cunhada, que é arquiteta, e depois de muito trabalho e testes, a gente chegou nessa peça, que eu achei incrível.",
      "Então fique à vontade para usar e abusar da sua criatividade pra também deixar ela do jeitinho que seu pet merece!"
    ],
    galeria: ['lukebowl_0005', 'lukebowl_9148', 'lukebowl_9170', 'lukebowl_wa182751', 'lukebowl_wa182753', 'lukebowl_wa183050']
  },

  {
    slug: 'matteo-texturized',
    nome: 'ālea Elevated Pet Bowl × Matteo',
    linha: 'Comedouro',
    categoria: 'pet',
    preco: null,
    material: 'PLA',          // .3mf dele: Bambu PLA Lite + Bambu PLA Matte
    capa: 'matteotex_capa',
    cores_peca: ['bicolor', 'monocromatico'],               // áudio 1863: "NÃO existe tricolor"
    /* SEM álbuns (áudio 1863): não há foto monocromática dele, e ele não mandou mais fotos. */
    resumo: '',
    paragrafos: [   // 27/09/2026: texto DELE aprovado no Telegram (msgs 2371-2427)
      "Depois de criar o meu primeiro comedouro, bateu aquele sentimento de justiça de pai: tudo que se dá pra um filho, tem que dar pro outro! Haha’",
      "Se o Luke tinha ganhado o dele, o Matteo também tinha que ganhar. Só que não podia ser igual, tinha que ser diferente.",
      "Foi aí que surgiu a ideia de um comedouro elevado: o pote fica mais perto da altura do peito dele, e ele come sem precisar abaixar tanto o pescoço.",
      "E, pra não ficar igual mesmo, ele ganhou textura: na impressão, o bico faz pequenos movimentos aleatórios nas paredes, e a peça sai com um toque áspero, diferente do liso."
    ],
    galeria: ['matteotex_0094', 'matteotex_9202', 'matteotex_9220', 'matteotex_9240', 'matteotex_9255', 'matteotex_9262']
  },

  {
    slug: 'ayla-pompom',
    nome: 'ālea Pet Bowl – Watermelon Edition × Ayla Pompom',
    linha: 'Comedouro',
    categoria: 'pet',
    preco: null,
    material: 'PLA',          // .3mf dele: Bambu PLA Silk + PLA Matte + PLA Lite
    capa: 'aylapompom_capa',
    /* áudio 1864: melancia com as sementes, "único e exclusivo, SEM personalização" -> sem botão de personalização,
       sem álbuns; só as fotos e o comprar. A ficha mostra Personalização e Cores como "a informar" (escondidas no ar)
       até ele dizer o texto: o padrão ("Totalmente personalizável") seria falso nesta peça. */
    personalizavel: false,
    resumo: '',
    paragrafos: [   // 27/09/2026: texto DELE aprovado no Telegram (msgs 2371-2427)
      "O comedouro da Ayla veio de mais um sentimento de justiça. Eu já tinha criado um pra cada um dos meus filhos, e ainda faltava a minha irmã caçula, a filha preferida da minha mãe! Haha’",
      "A Ayla não é uma cachorra, é uma artista! Tem milhares de seguidores no Instagram (@aylapompom) e, acima de tudo, é muito fotogênica. Pra ela, tinha que ser algo jamais visto, surpreendente e muito chamativo.",
      "E como ela é muito comilona, na hora de criar lembrei da Magali, da Turma da Mônica, que também é associada à melancia, a fruta preferida dela. Pra mim, melancia tem uma combinação de cores linda, que sempre funciona em objeto, textura e desenho. Tinha tudo a ver com ela.",
      "Por isso, esse comedouro é uma edição especial, feita exclusivamente para ela."
    ],
    galeria: ['aylapompom_0145', 'aylapompom_9120', 'aylapompom_9737', 'aylapompom_9859', 'aylapompom_9931', 'aylapompom_9935']
  },

  {
    slug: 'claudia-wave',
    /* ⚠ TÍTULO A CONFIRMAR COM ELE: o zip diz "ALEA Cláudia Wave"; a transcrição do áudio 1856 ouviu "Cloud Wave". */
    nome: 'ālea Pet Bowl Wave × Cláudia',
    linha: 'Comedouro',
    categoria: 'pet',
    preco: null,
    material: 'PLA',          // .3mf dele: Bambu PLA Marble + PLA Silk + PLA Lite
    /* ⚠ CAPA TROCÁVEL: vai virar a versão com a homenagem (coroa com asas, áudio 1856), feita à parte. Entra pelo
       06_fotos_profissionais_v2 (_capas_novas/claudia-wave.jpg) SEM mexer aqui. */
    capa: 'claudiawave_anjo',   // 27/09/2026 msgs 2361-2363: a homenagem (anjinho)
    cores_peca: ['tricolor', 'bicolor', 'monocromatico'],   // áudio 1865: sem ÁLBUM mono, mas a personalização mono FICA
    configuracoes: [
      /* tricolor: 2 fotos, sem Capa.JPG -> a 1ª é a capa do álbum */
      { id: 'tricolor', nome: 'Tricolor', capa: 'claudiawave_0020', fotos: ['claudiawave_0020', 'claudiawave_0104'] },
      { id: 'bicolor',  nome: 'Bicolor',  capa: 'claudiawave_capa', fotos: ['claudiawave_capa', 'claudiawave_0166', 'claudiawave_0196', 'claudiawave_9528', 'claudiawave_9566', 'claudiawave_9569', 'claudiawave_9570', 'claudiawave_9572', 'claudiawave_9587', 'claudiawave_9590', 'claudiawave_9647', 'claudiawave_9648', 'claudiawave_9654', 'claudiawave_9674', 'claudiawave_9676', 'claudiawave_9695', 'claudiawave_9698'] }
    ],
    resumo: '',
    paragrafos: [   // 27/09/2026: texto DELE aprovado no Telegram (msgs 2371-2427)
      "O ālea Pet Bowl Wave foi criado pensando em dar mais cor a um comedouro elevado. O do Matteo a gente quis texturizado e com poucas cores. Já o Wave tem essas ondas na base e foi pensado desde o início pra três cores.",
      "Mas você pode personalizar do seu jeito, com três cores, com duas ou com uma só. Nele dá pra brincar com a imaginação!",
      "Foi nele também que experimentei, pela primeira vez, o filamento em tom de mármore. Ele não é áspero como o texturizado, mas lembra muito um mármore de verdade. Chama muita atenção e é muito bonito, como dá pra ver nas fotos dos álbuns.",
      "E vocês devem ter reparado no anjinho da foto de capa, né? Esse anjinho é a Cláudia.",
      "A Cláudia foi a nossa modelo na divulgação da coleção Pet Bowl Wave. Muito fotogênica, foi quem mais fez a equipe rir na hora das fotos, com seu jeito brincalhão e medroso.",
      "Infelizmente, um dia depois das fotos, ela foi atropelada e não resistiu. Por isso resolvi fazer essa collab com o nome dela, pra que a Cláudia siga com a gente em cada peça."
    ],
    galeria: ['claudiawave_0039', 'claudiawave_0196', 'claudiawave_9569', 'claudiawave_9590', 'claudiawave_9676', 'claudiawave_9698']
  },

  /* ===================================================================================================
     OS PRODUTOS ANTIGOS — fora da vitrine desde 25/09/2026 (msg 1884). As páginas continuam no disco e
     estes blocos ficam pra elas não quebrarem (e pra voltar, se ele quiser). Não aparecem no feed.
     =================================================================================================== */

  {
    slug: 'bowl-wave',
    /* peso: 198 g com a tigela de inox (Cassiano, 24/09/2026 01:39) — guardado COMO ELE MANDOU; a ficha mostra +10%
       (regra dele, 01:46: "todo peso que eu te passar, você coloca 10% a mais"), feita pelo gerador v14. Medidas: caixa do objeto no arquivo 3D do Luke,
       tamanho G (o do configurador 3D) — 211,9 × 212,9 × 83,7 mm. O tamanho M do mesmo arquivo: 186,4 × 187,3 × 73,6 mm. */
    medidas: { peso_g: 198, altura_cm: 8.4, largura_cm: 21.3, comprimento_cm: 21.2 },
    nome: 'ālea Bowl Wave',
    linha: 'Comedouro',
    categoria: 'pet',
    preco: 179,
    capa: 'luke_1',
    /* OS ÁLBUNS POR CONFIGURAÇÃO (Cassiano, áudios 25/09/2026 11:19-11:30, msgs 1493, 1517, 1518): a colmeia das 7
       fotos de cima NÃO muda ("são as sete capas, padrão pra todos os produtos"). Embaixo dela entram 3 favos menores,
       os ÁLBUNS, com o nome escrito em cima no estilo do rótulo "PET": tricolor, bicolor e monocromático. Clicou, abre
       uma tela quase cheia com as miniaturas daquele álbum; a foto expande dentro dela e clicar fora volta pras
       miniaturas. O Bowl Wave sai em 3 combinações de cor — monocromático (Matteo, verde), bicolor (Catrina, azul e
       branco) e tricolor (Luke: branco/laranja/cinza; Cacau: bege/dourado/marrom). Ele alimenta: "coloca essa daqui
       no álbum monocromático". Quem monta a página é o 01_gerar_paginas_v15_colmeia_configuracoes; a tela é do produto.js. */
    configuracoes: [
      { id: 'tricolor',      nome: 'Tricolor',      capa: 'pro_luke_1',    fotos: ['pro_luke_1', 'pro_cacau_1', 'luke_1', 'luke_2', 'luke_3', 'luke_4'] },
      { id: 'bicolor',       nome: 'Bicolor',       capa: 'pro_catrina_1', fotos: ['pro_catrina_1'] },
      { id: 'monocromatico', nome: 'Monocromático', capa: 'pro_matteo_1',  fotos: ['pro_matteo_1', 'matteo_1', 'matteo_2', 'matteo_3'] }
    ],
    material: 'PLA',          /* ⚠️ era o que o texto de 14/09 dizia. Se esta peça hoje
                                 sai em PETG, trocar aqui e regerar as páginas. */
    resumo: 'Comedouro elevado com o nome do seu cão impresso no corpo da peça.',
    paragrafos: [
      'A onda que dá nome à peça vem do grafismo da marca — é o mesmo desenho que ' +
      'aparece na embalagem e na tag, aplicado na curva do comedouro.',
      'O nome não é adesivo colado. Ele é impresso junto com a peça, em baixo relevo ' +
      'na cor do objeto, então não descasca, não desbota e não sai na lavagem. A ' +
      'tigela interna é de inox e sai pra lavar.',
      'A base elevada deixa o cão comer com o pescoço em posição mais natural, sem ' +
      'ter que abaixar a cabeça até o chão.'
    ],
    /* PESO E DIMENSÕES (24/09/2026, pedido do Cassiano): base do frete e da caixa padrão. Preencher com o que
       ELE mandar, nunca estimado — e rodar 01_gerar_paginas_v14_peso_e_dimensoes. Sem número = linha escondida no ar.
       medidas: { peso_g: 0, altura_cm: 0, largura_cm: 0, comprimento_cm: 0 }, */
    /* linhas EXTRA da ficha, além das quatro padrão */
    ficha_extra: [
      ['Acompanha', 'Tigela interna em inox, removível pra lavar']
    ],
    galeria: ['ayla_1', 'tina_1', 'chica_1', 'matteo_1', 'claudia_1', 'luke_2']
  },

  {
    slug: 'poop-bag-holder',
    /* ⚠ EXEMPLO pra ver o layout (pedido dele, 01:39: "inventa desses dois por enquanto") — NÃO É MEDIDA. Some no ar. */
    medidas_exemplo: { peso_g: 45, altura_cm: 10, largura_cm: 6, comprimento_cm: 7 },
    nome: 'ālea Poop Bag Holder',
    linha: 'Passeio',
    categoria: 'pet',
    preco: 59,
    capa: 'saquinho_1',
    material: 'PLA',
    resumo: 'Porta-saquinho que sai na mesma estampa do comedouro.',
    paragrafos: [
      'Prende na guia e leva o rolo de saquinhos. Sai combinando com a estampa ' +
      'escolhida no comedouro — é o mesmo desenho aplicado numa peça menor.',
      'Também aceita o nome do cão, pelo mesmo processo: em baixo relevo, na cor do ' +
      'objeto, impresso junto com a peça.'
    ],
    ficha_extra: [
      ['Combina com', 'A mesma estampa do ālea Bowl Wave']
    ],
    galeria: ['saquinho_2', 'saquinho_3', 'chica_2']
  },

  {
    slug: 'kit',
    /* ⚠ EXEMPLO pra ver o layout (pedido dele, 01:39: "inventa desses dois por enquanto") — NÃO É MEDIDA. Some no ar. */
    medidas_exemplo: { peso_g: 250, altura_cm: 10, largura_cm: 23, comprimento_cm: 23 },
    nome: 'Kit ālea',
    linha: 'Kit',
    categoria: 'pet',
    /* ⚠️ TBD: o kit aparece nas fotos mas nunca teve preço publicado. Perguntar ao
       Cassiano. Enquanto for null o site diz "sob consulta", que é honesto — inventar
       valor aqui vira preço errado no anúncio, e o Google compara. */
    preco: null,
    capa: 'kit_1',
    material: 'PLA',
    resumo: 'Comedouro e porta-saquinho na mesma estampa, com o mesmo nome.',
    paragrafos: [
      'É como as fotos do Instagram foram feitas: as duas peças na mesma estampa, ' +
      'personalizadas com o mesmo nome, embaladas juntas com a tag da marca.',
      'O valor do kit sai por WhatsApp, junto com as opções de estampa.'
    ],
    ficha_extra: [
      ['Contém', 'ālea Bowl Wave + ālea Poop Bag Holder'],
      ['Embalagem', 'Caixa com a tag da marca — serve de presente']
    ],
    galeria: ['kit_2', 'kit_3', 'tina_2']
  }

];


/* ---------------------------------------------------------------------------
   3) A CONFERÊNCIA DO CATÁLOGO — erra alto, não calado.
   ---------------------------------------------------------------------------
   Categoria escrita errada não levanta erro nenhum: a peça simplesmente some do site,
   e você só descobre quando o cliente reclama. Aqui ela grita no console do navegador.
   Custa 15 linhas e paga sozinho. */
(function conferirCatalogo() {
  var ids = (window.CATEGORIAS || []).map(function (c) { return c.id; });
  var reclamacoes = [];
  (window.VITRINE || []).forEach(function (c, i) {
    if (ids.indexOf(c.categoria) < 0) {
      reclamacoes.push('feed #' + (i + 1) + ' (' + c.produto + ' de ' + c.nome +
        '): categoria "' + c.categoria + '" nao existe em CATEGORIAS');
    }
  });
  (window.PRODUTOS || []).forEach(function (p) {
    if (ids.indexOf(p.categoria) < 0) {
      reclamacoes.push('produto "' + p.slug + '": categoria "' + p.categoria + '" nao existe');
    }
    if (!p.material) {
      reclamacoes.push('produto "' + p.slug + '": falta o material (PLA ou PETG)');
    }
  });
  if (reclamacoes.length) {
    console.error('[alea] CATALOGO COM PROBLEMA:\n- ' + reclamacoes.join('\n- '));
    window.__aleaCatalogoRuim = reclamacoes;
  }
})();
