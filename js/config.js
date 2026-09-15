/* =============================================================================
   config.js — os valores que mudam. Mexe aqui, não no resto do site.
   =============================================================================

   COMO MEXER (vale para quem não programa)
   ----------------------------------------
   Cada linha é  nome: 'valor',  — troque o que está entre aspas e salve.
   Não apague a vírgula do fim da linha nem as aspas.

   whatsapp ........... só números, com 55 na frente e DDD. Sem espaço, sem traço.
                        Exemplo: 5564999998888
   conversao_whatsapp . Google Ads > Metas > Conversões > nova conversão do tipo
                        "site" > copie o trecho AW-000000000/AbCdEfG e cole aqui.
   ========================================================================== */

window.ALEA = {

  /* ⚠️ VAZIO DE PROPÓSITO (14/09/2026) — NÃO INVENTE UM NÚMERO AQUI.
     O WhatsApp comercial da ālea ainda não foi informado pelo Cassiano. A bio do
     Instagram pessoal dele traz um fragmento ("+55 064 1991") que NÃO é um telefone
     válido, e chutar o número da casa é mandar cliente pago pra conversa errada.
     Enquanto isto estiver vazio, todo botão de compra do site aparece DESLIGADO,
     com o aviso na tela — em vez de virar link morto, que é o defeito que mais
     custou caro na rede (wa.me sem número abre o WhatsApp em branco). */
  whatsapp: '',

  /* Texto que já vai escrito na conversa. O {produto} é trocado pelo item clicado. */
  mensagem: 'Oi! Vim pelo site da ālea. Queria saber sobre: {produto}',

  /* ⚠️ Sem "conversao_whatsapp" preenchido o Google Ads NÃO sabe quais cliques viraram
     conversa — e o lance inteligente fica sem nada pra aprender. A campanha vira
     aposta. Preencher ANTES de colocar dinheiro, não depois. */
  conversao_whatsapp: '',

  /* Medição. Vazio = nenhum script de terceiro carrega, e a página não precisa de
     banner de cookie. Preencher só quando a campanha começar. */
  google_ads_id: '',          // AW-000000000
  google_analytics: '',       // G-XXXXXXXXXX

  /* A FRASE DA MARCA. Ela abre o site (escrita letra por letra) e fecha o rodapé.
     Um lugar só: mudou aqui, mudou nos dois. */
  assinatura: 'Onde cada impressão começa com um sonho!',

  /* O FEED MOSTRA PRECO?
     O Cassiano pediu "so o produto e nome". Deixei o preco porque preco no feed tira
     duvida antes do clique e porque o Google compara o valor do anuncio com o da
     pagina. Se ele quiser o feed 100% limpo, troque para false: sai so do feed,
     a pagina de produto continua mostrando. */
  mostrar_preco_no_feed: true,

  /* Categoria sem nenhum produto aparece no menu como "em breve" (false) ou some do
     menu (true). Enquanto só a PET tem peça, deixar false é honesto: mostra a régua
     de linhas que ele já registrou, sem prometer clique que não leva a nada. */
  esconder_categorias_vazias: false,

  /* Identificação do negócio — o Google exige isto visível na página de destino. */
  marca: 'ālea',
  responsavel: 'Cassiano Rosado',
  cidade: 'Jataí',
  uf: 'GO',
  email: '',                  // ⚠️ e-mail comercial da ālea — ainda não informado
  instagram: 'alea.decor3d',
  instagram_canal: 'eaibora.3d',

  /* AS REDES DO RODAPÉ. Endereço vazio = o ícone não aparece — nunca vira link morto.
     ⚠️ Faltam do Cassiano: Linktree, YouTube e Twitch. Assim que ele mandar, é colar. */
  redes: {
    linktree:  '',            // https://linktr.ee/...
    instagram: 'https://www.instagram.com/alea.decor3d/',
    youtube:   '',            // https://www.youtube.com/@...
    twitch:    ''             // https://www.twitch.tv/...
  },

  /* A FICHA PADRÃO DA PEÇA (ditada por ele em 15/09/2026).
     Vale pra todo produto que não escrever a sua própria no produtos.js.
     `material` fica de fora de propósito: ele é PERGUNTADO peça a peça pelo
     01_gerar_paginas_v1.py, porque muda de peça pra peça (PLA ou PETG). */
  ficha_padrao: {
    personalizacao: 'Nome do pet em baixo relevo na cor do objeto.',
    producao: 'Sob encomenda, 3 dias úteis após a confirmação de pagamento!',
    cores: 'Totalmente personalizável, podendo escolher entre filamentos básicos, ' +
           'foscos ou brilhosos.'
  },

  /* O TEXTO JURÍDICO DA PEÇA PERSONALIZADA, palavra por palavra como ele mandou.
     Fica aqui, e não espalhado nas páginas, porque ele aparece em DOIS lugares que
     não podem divergir: a aba do produto e a trava do carrinho. Texto de consumo que
     diverge entre a promessa e o aceite não vale nada — e o que o cliente marcou é
     exatamente isto. */
  personalizados: {
    titulo: 'PRODUTOS PERSONALIZADOS',
    texto: 'Por se tratar de um produto produzido sob encomenda e personalizado ' +
           'especialmente de acordo com as suas escolhas, pedidos personalizados não ' +
           'poderão ser cancelados ou devolvidos após a confirmação de pagamento se o ' +
           'produto já estiver sendo fabricado, ressalvados casos de defeito, vício ' +
           'ou erro de fabricação.',
    aceite: 'Declaro que revisei cuidadosamente todas as informações da ' +
            'personalização, incluindo nome, grafia e cores. Declaro, ainda, estar ' +
            'ciente e de acordo com as condições acima aplicáveis a produtos ' +
            'personalizados, inclusive quanto a cancelamentos e devoluções.'
  },

  /* Onde entrega. "a combinar" faz o site dizer "consulte o frete" em vez de prometer
     entrega que não existe.
     ⚠️ A palavra "frete" saiu de perto do preço por pedido dele (15/09/2026). Ela
     continua existindo AQUI e na página de trocas e entrega, porque o CDC exige que o
     custo do frete seja informado antes da compra — só não fica mais colada no valor. */
  entrega: 'Jataí-GO com entrega local; demais cidades por transportadora, frete a combinar'
};
