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
   imaginaria está no comentário de cada linha — ele confirma ou corrige, aí entra. */
window.CATEGORIAS = [
  { id: 'custom', nome: 'CUSTOM', descricao: '' },   // sugestão minha: peça sob projeto, do zero
  { id: 'fan',    nome: 'FAN',    descricao: '' },   // sugestão minha: cultura pop, coleção
  { id: 'glow',   nome: 'GLOW',   descricao: '' },   // sugestão minha: filamento que brilha no escuro
  { id: 'home',   nome: 'HOME',   descricao: '' },   // sugestão minha: casa e decoração
  { id: 'pet',    nome: 'PET',    descricao: '' },   // a única com peça hoje
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

   `recorte: true` quer dizer que existe o arquivo `<primeira foto>_obj.webp`, o objeto
   sem fundo, gerado pelo `_recortar_fundo_v1.py`. `recorte: false` quer dizer que aquela
   peca ainda NAO tem foto com o objeto inteiro dentro do quadro -- ela aparece no feed
   com moldura, como antes, e e' honesto: melhor uma foto normal do que meia tigela
   flutuando. Assim que chegar uma foto da peca sozinha, vira `true`.

   `categoria` tem que ser um `id` da lista lá em cima. Errou o nome? A peça não
   aparece em feed nenhum — e a conferência do fim deste arquivo reclama no console
   em vez de deixar você descobrir pelo cliente. */
window.VITRINE = [
  { produto: 'ālea Bowl Wave', nome: 'Luke',       categoria: 'pet', preco: 179,  pagina: 'bowl-wave',       recorte: true,  fotos: ['luke_1','luke_2','luke_3','luke_4'] },
  { produto: 'ālea Bowl Wave', nome: 'Ayla',       categoria: 'pet', preco: 179,  pagina: 'bowl-wave',       recorte: false, fotos: ['ayla_1','ayla_2','ayla_3','ayla_4'] },
  { produto: 'ālea Bowl Wave', nome: 'Tina Preta', categoria: 'pet', preco: 179,  pagina: 'bowl-wave',       recorte: true,  fotos: ['tina_1','tina_2','tina_3','tina_4'] },
  { produto: 'ālea Bowl Wave', nome: 'Chica',      categoria: 'pet', preco: 179,  pagina: 'bowl-wave',       recorte: true,  fotos: ['chica_1','chica_2','chica_3'] },
  { produto: 'ālea Bowl Wave', nome: 'Matteo',     categoria: 'pet', preco: 179,  pagina: 'bowl-wave',       recorte: true,  fotos: ['matteo_1','matteo_2','matteo_3'] },
  { produto: 'ālea Bowl Wave', nome: 'Cláudia',    categoria: 'pet', preco: 179,  pagina: 'bowl-wave',       recorte: true,  fotos: ['claudia_1','claudia_2','claudia_3','claudia_4'] },
  { produto: 'ālea Poop Bag',  nome: 'Chica',      categoria: 'pet', preco: 59,   pagina: 'poop-bag-holder', recorte: true,  fotos: ['saquinho_1','saquinho_2','saquinho_3'] },
  { produto: 'Kit ālea',       nome: 'Tina Preta', categoria: 'pet', preco: null, pagina: 'kit',             recorte: false,  fotos: ['kit_1','kit_2','kit_3'] }
];


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

  {
    slug: 'bowl-wave',
    nome: 'ālea Bowl Wave',
    linha: 'Comedouro',
    categoria: 'pet',
    preco: 179,
    capa: 'luke_1',
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
    /* linhas EXTRA da ficha, além das quatro padrão */
    ficha_extra: [
      ['Acompanha', 'Tigela interna em inox, removível pra lavar']
    ],
    galeria: ['ayla_1', 'tina_1', 'chica_1', 'matteo_1', 'claudia_1', 'luke_2']
  },

  {
    slug: 'poop-bag-holder',
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
