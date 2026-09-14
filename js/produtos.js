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
   ========================================================================== */

/* ---------------------------------------------------------------------------
   1) A LINHA — os produtos de verdade, com preço.
   Preços conferidos nas legendas do Instagram @alea.decor3d de 30/05 e 06/06/2026.
   --------------------------------------------------------------------------- */
window.PRODUTOS = [

  {
    id: 'bowl-wave',
    nome: 'ālea Bowl Wave',
    linha: 'Comedouro',
    preco: 179,
    resumo: 'Comedouro elevado com o nome do seu cão impresso no corpo da peça.',
    detalhe: 'A onda que dá nome à peça nasce do grafismo da marca. O nome não é adesivo: ' +
             'é impresso junto com a peça, em outra cor, e não sai na lavagem. ' +
             'Tigela interna em inox removível.',
    imagem: 'img/produtos/luke_a.jpg',
    alt: 'Comedouro ālea Bowl Wave branco e laranja com o nome Luke impresso'
  },

  {
    id: 'poop-bag-holder',
    nome: 'ālea Poop Bag Holder',
    linha: 'Passeio',
    preco: 59,
    resumo: 'Porta-saquinho que sai na mesma estampa do comedouro.',
    detalhe: 'Prende na guia. Sai combinando com a estampa escolhida no comedouro — ' +
             'é o mesmo desenho aplicado numa peça menor.',
    imagem: 'img/produtos/porta_saquinho.jpg',
    alt: 'Porta-saquinho ālea em estampa xadrez rosa e azul, ao lado do comedouro combinando'
  },

  {
    id: 'kit-nome',
    nome: 'Kit ālea — comedouro + porta-saquinho',
    linha: 'Kit',
    preco: null,   /* ⚠️ TBD: o kit aparece nas fotos mas nunca teve preço publicado.
                      Perguntar ao Cassiano. Enquanto for null o site diz "sob consulta",
                      que é honesto — inventar valor aqui vira preço errado no anúncio. */
    resumo: 'As duas peças na mesma estampa, com o nome do cão.',
    detalhe: 'É como as fotos do Instagram foram feitas: comedouro e porta-saquinho ' +
             'na mesma estampa, personalizados com o mesmo nome.',
    imagem: 'img/produtos/kit.jpg',
    alt: 'Kit ālea: comedouro vermelho personalizado e canetas de arte sobre a mesa'
  }

];

/* ---------------------------------------------------------------------------
   2) AS PERSONALIZAÇÕES — a vitrine que se transforma no hover.
   Cada item tem DUAS fotos do MESMO comedouro: "repouso" e "hover".
   É o argumento de venda inteiro numa interação: a peça muda porque é feita
   pra um cão só.

   ⚠️ São clientes reais e cães reais, fotografados pelo próprio Cassiano e já
   publicados por ele no Instagram. Antes de a página ir ao ar, ele precisa
   confirmar que pode usar cada foto aqui.
   --------------------------------------------------------------------------- */
window.PERSONALIZACOES = [
  { nome: 'Luke',       estampa: 'Branco e laranja',      a: 'luke',    b: 'luke' },
  { nome: 'Ayla',       estampa: 'Melancia',              a: 'ayla',    b: 'ayla' },
  { nome: 'Tina Preta', estampa: 'Vermelho e grafite',    a: 'tina',    b: 'tina' },
  { nome: 'Chica',      estampa: 'Xadrez rosa e azul',    a: 'chica',   b: 'chica' },
  { nome: 'Matteo',     estampa: 'Areia e grafite',       a: 'matteo',  b: 'matteo' },
  { nome: 'Cláudia',    estampa: 'Turquesa e branco',     a: 'claudia', b: 'claudia' }
];
