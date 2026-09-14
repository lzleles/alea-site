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
   próxima geração.
   ========================================================================== */

/* ---------------------------------------------------------------------------
   1) A VITRINE — uma cena por tela, na ordem em que aparecem.
   "Você nunca consegue ver duas imagens ao mesmo tempo" (Cassiano, 14/09/2026).
   `a` e `b` são as duas fotos da MESMA peça: é entre elas que a distorção acontece.
   --------------------------------------------------------------------------- */
window.VITRINE = [
  { produto: 'ālea Bowl Wave', nome: 'Luke',       preco: 179, pagina: 'bowl-wave',       a: 'luke_a',    b: 'luke_b' },
  { produto: 'ālea Bowl Wave', nome: 'Ayla',       preco: 179, pagina: 'bowl-wave',       a: 'ayla_a',    b: 'ayla_b' },
  { produto: 'ālea Bowl Wave', nome: 'Tina Preta', preco: 179, pagina: 'bowl-wave',       a: 'tina_a',    b: 'tina_b' },
  { produto: 'ālea Bowl Wave', nome: 'Chica',      preco: 179, pagina: 'bowl-wave',       a: 'chica_a',   b: 'chica_b' },
  { produto: 'ālea Bowl Wave', nome: 'Matteo',     preco: 179, pagina: 'bowl-wave',       a: 'matteo_a',  b: 'matteo_b' },
  { produto: 'ālea Bowl Wave', nome: 'Cláudia',    preco: 179, pagina: 'bowl-wave',       a: 'claudia_a', b: 'claudia_b' },
  { produto: 'ālea Poop Bag',  nome: 'Chica',      preco: 59,  pagina: 'poop-bag-holder', a: 'porta_saquinho', b: 'chica_b' },
  { produto: 'Kit ālea',       nome: 'Tina Preta', preco: null, pagina: 'kit',            a: 'kit',       b: 'tina_a' }
];

/* ---------------------------------------------------------------------------
   2) AS PÁGINAS DE PRODUTO — aqui mora TODO o texto que saiu da vitrine.
   "Quando ela clicar lá, que apareça as instruções" (Cassiano, áudio 3, 00:14).
   É esta página que vira a página de destino do Google Ads: é ela que tem conteúdo
   original suficiente pra política de destino, que a vitrine sozinha não teria.
   --------------------------------------------------------------------------- */
window.PRODUTOS = [

  {
    slug: 'bowl-wave',
    nome: 'ālea Bowl Wave',
    linha: 'Comedouro',
    preco: 179,
    capa: 'luke_a',
    resumo: 'Comedouro elevado com o nome do seu cão impresso no corpo da peça.',
    paragrafos: [
      'A onda que dá nome à peça vem do grafismo da marca — é o mesmo desenho que ' +
      'aparece na embalagem e na tag, aplicado na curva do comedouro.',
      'O nome não é adesivo colado. Ele é impresso junto com a peça, em outra cor de ' +
      'filamento, então não descasca, não desbota e não sai na lavagem. A tigela ' +
      'interna é de inox e sai pra lavar.',
      'A base elevada deixa o cão comer com o pescoço em posição mais natural, sem ' +
      'ter que abaixar a cabeça até o chão.'
    ],
    ficha: [
      ['Material', 'PLA de impressão 3D, tigela interna em inox'],
      ['Personalização', 'Nome do cão + estampa, inclusos no preço'],
      ['Produção', 'Sob encomenda, 5 a 10 dias úteis após a aprovação da prévia'],
      ['Cores', 'Combinação escolhida por você; variação de tom entre lotes é normal']
    ],
    galeria: ['ayla_a', 'tina_a', 'chica_a', 'matteo_a', 'claudia_a', 'luke_b']
  },

  {
    slug: 'poop-bag-holder',
    nome: 'ālea Poop Bag Holder',
    linha: 'Passeio',
    preco: 59,
    capa: 'porta_saquinho',
    resumo: 'Porta-saquinho que sai na mesma estampa do comedouro.',
    paragrafos: [
      'Prende na guia e leva o rolo de saquinhos. Sai combinando com a estampa ' +
      'escolhida no comedouro — é o mesmo desenho aplicado numa peça menor.',
      'Também aceita o nome do cão, pelo mesmo processo: impresso junto com a peça, ' +
      'em outra cor, sem adesivo.'
    ],
    ficha: [
      ['Material', 'PLA de impressão 3D'],
      ['Personalização', 'Nome e estampa, inclusos no preço'],
      ['Produção', 'Sob encomenda, 5 a 10 dias úteis após a aprovação da prévia'],
      ['Combina com', 'A mesma estampa do ālea Bowl Wave']
    ],
    galeria: ['chica_b', 'ayla_a', 'claudia_a']
  },

  {
    slug: 'kit',
    nome: 'Kit ālea',
    linha: 'Kit',
    /* ⚠️ TBD: o kit aparece nas fotos mas nunca teve preço publicado. Perguntar ao
       Cassiano. Enquanto for null o site diz "sob consulta", que é honesto — inventar
       valor aqui vira preço errado no anúncio, e o Google compara. */
    preco: null,
    capa: 'kit',
    resumo: 'Comedouro e porta-saquinho na mesma estampa, com o mesmo nome.',
    paragrafos: [
      'É como as fotos do Instagram foram feitas: as duas peças na mesma estampa, ' +
      'personalizadas com o mesmo nome, embaladas juntas com a tag da marca.',
      'O valor do kit sai por WhatsApp, junto com as opções de estampa.'
    ],
    ficha: [
      ['Contém', 'ālea Bowl Wave + ālea Poop Bag Holder'],
      ['Personalização', 'Nome e estampa iguais nas duas peças'],
      ['Produção', 'Sob encomenda, 5 a 10 dias úteis após a aprovação da prévia'],
      ['Embalagem', 'Caixa com a tag da marca — serve de presente']
    ],
    galeria: ['tina_a', 'luke_a', 'matteo_a']
  }

];
