/* =============================================================================
   config.js — os 8 valores que mudam. Mexe aqui, não no resto do site.
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

  /* A VITRINE MOSTRA PRECO?
     O Cassiano pediu "so o produto e nome". Deixei o preco porque preco na vitrine
     tira duvida antes do clique e porque o Google compara o valor do anuncio com o da
     pagina. Se ele quiser a vitrine 100% limpa, troque para false: sai so da vitrine,
     a pagina de produto continua mostrando. */
  mostrar_preco_na_vitrine: true,

  /* Identificação do negócio — o Google exige isto visível na página de destino. */
  marca: 'ālea',
  responsavel: 'Cassiano Rosado',
  cidade: 'Jataí',
  uf: 'GO',
  email: '',                  // ⚠️ e-mail comercial da ālea — ainda não informado
  instagram: 'alea.decor3d',
  instagram_canal: 'eaibora.3d',

  /* Prazo de produção informado ao cliente. Peça personalizada é feita sob encomenda —
     o prazo tem que estar escrito ANTES da compra, não depois (CDC, art. 30). */
  prazo_producao: '5 a 10 dias úteis',

  /* Onde entrega. "combinar" faz o site dizer "consulte o frete no WhatsApp" em vez
     de prometer entrega que não existe. */
  entrega: 'Jataí-GO com entrega local; demais cidades por transportadora, frete a combinar'
};
