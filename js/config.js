/* CATALOGO:
   nome: config
   categoria: UTIL
   objetivo: Centraliza contatos, medição, redes, regras comerciais e opções de personalização usadas pelo site.
   entrada: Valores editados diretamente no arquivo
   saida: Objeto global window.ALEA
   status: ativo (cabecalho proposto pelo Codex em 2026-09-20, confianca ALTA; conferir na proxima vez que o script rodar)
   validado_em: TBD
*/
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

  /* O WhatsApp comercial da ālea. Informado pelo Cassiano em 15/09/2026.
     Formato: 55 (Brasil) + 64 (DDD de Jataí) + o número que ele mandou (999569994).
     Ele mandou assim:  64999569994
     Conferir sempre que mexer: tem que ter 12 ou 13 dígitos, só número, sem espaço e
     sem traço — é essa a régua que o site.js usa pra decidir se liga os botões. */
  whatsapp: '5564999569994',

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

  /* Identificação do negócio — o Google exige isto visível na página de destino.
     ⚠️ CNPJ informado pelo Cassiano em 15/09/2026. Ele fecha metade da exigência de
     "vendedor identificável" da política de destino do Google Ads; ainda faltam
     ENDEREÇO COMERCIAL e E-MAIL. Sem conferir: é o número que ele mandou, escrito
     como ele mandou. */
  cnpj: '61.338.171/0001-10',
  marca: 'ālea',
  responsavel: 'Cassiano Rosado',
  cidade: 'Jataí',
  uf: 'GO',
  email: '',                  // ⚠️ e-mail comercial da ālea — ainda não informado
  instagram: 'alea.co_',        // trocado em 16/09/2026: o @alea.decor3d deixou de existir; @alea.co_ conferido na API da Meta ("ālea & Co")
  instagram_canal: 'eaibora.3d',

  /* AS REDES DO RODAPÉ. Endereço vazio = o ícone não aparece — nunca vira link morto.
     ⚠️ Faltam do Cassiano: YouTube e Twitch. Assim que ele mandar, é colar.
     17/09/2026 (áudio de 16/09, 23:51): "eu tenho o segundo Instagram, que é do eaibora3d
     […] o link do Linktree". Os dois entraram: o Linktree é o dele (o mesmo da bio do
     @eaibora.3d, lido no retrato de 14/09) e o segundo Instagram ganha ícone próprio. */
  redes: {
    /* ⚠️ O ENDEREÇO DO LINKTREE É O QUE ELE MANDOU, COM TODAS AS LETRAS (4ª rodada, 17/09/2026,
       item 5: "colocar a logo também do linktr, onde quando eu clicar, vai cair nesse domínio").
       O rabicho depois do `?` é rastreamento de quem clicou no link da BIO do Instagram dele
       (utm_* e fbclid). `https://linktr.ee/eaibora.3d` sozinho abre a mesma página; mantive o dele
       porque quem escolhe o link é o dono da conta, e porque o Linktree conta essa visita como
       vinda do Instagram — se um dia ele quiser separar "veio do site", é aqui que se troca. */
    linktree:  'https://linktr.ee/eaibora.3d?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAdGRleAUYWSxwZG9mAmZkaWQWUOkM91TjGzxZsGlPaArH1voSo4_jjGV4dG4DYWVtAjExAHNydGMGYXBwX2lkDzEyNDAyNDU3NDI4NzQxNAABpzXaxi12EnfVzwcyuaOEvwRaWDu6O0_U-Sq64AjEdd39UlRlaIC5LxabGdrK_aem_oa-Nn97SXEFFzUbBcxxXdA',
    /* ⚠️ ETAPA 2 do Cassiano (22/09/2026): "dos 3 ícones abaixo das categorias, tira os 2 do
       Instagram, deixa só o Linktree". Vazio = o ícone não aparece (ver site.js). Os endereços
       ficam aqui guardados pra voltar num piscar se ele mudar de ideia:
         alea.co_        -> https://www.instagram.com/alea.co_/
         eaibora.3d      -> https://www.instagram.com/eaibora.3d/  (o do canal segue no topo, na logo do @eaibora.3d) */
    instagram: '',
    instagram_canal: '',
    youtube:   '',            // https://www.youtube.com/@...
    twitch:    ''             // https://www.twitch.tv/...
  },

  /* A FICHA PADRÃO DA PEÇA (ditada por ele em 15/09/2026).
     Vale pra todo produto que não escrever a sua própria no produtos.js.
     `material` fica de fora de propósito: ele é PERGUNTADO peça a peça pelo
     01_gerar_paginas_v1.py, porque muda de peça pra peça (PLA ou PETG).
     ETAPA 31 (22/09/2026, 21:33): CORES termina com "entre filamento básico, fosco ou perolizado."
     (palavras dele; era "entre filamentos básicos, foscos ou brilhosos." — "perolizado" é o nome
     que ele passou a usar pro acabamento, como no exemplo da cor do nome). */
  ficha_padrao: {
    personalizacao: 'Nome do pet em baixo relevo na cor do objeto.',
    producao: 'Sob encomenda, 3 dias úteis após a confirmação de pagamento!',
    cores: 'Totalmente personalizável, podendo escolher entre filamento básico, ' +
           'fosco ou perolizado.'
  },

  /* ADICIONAIS DE PERSONALIZACAO — o que soma no preco da peca.
     -------------------------------------------------------------------------------
     id ....... nao muda depois que um pedido ja foi feito com ele (o carrinho guarda)
     rotulo ... o que aparece no quadrado pra clicar
     preco .... soma ao valor da peca, na hora, no botao e no carrinho
     libera ... o campo que so pode ser respondido depois de marcar este adicional

     ⚠️ ORIGEM DO VALOR: R$ 30,00, decidido pelo Cassiano em 15/09/2026, 2a rodada de
     retorno do site ("colocar um quadrado pra clicar com o titulo Nome Colorido +
     R$ 30,00, onde a pessoa precisa clicar pra poder responder a cor do nome").
     Nao e' estimativa nossa. Mudou o preco aqui, muda no anuncio e no que o cliente ve. */
  /* ETAPA 20 (22/09/2026, 20:36): o título fica em maiúscula como está, SEM a exclamação; a
     descrição sai em letra normal (CSS .detalhe-extra) e com ponto final. Eram: 'Um detalhe que
     transforma!' e 'Deixe o nome do seu pet ainda mais especial adicionando cores!'. */
  adicionais: [
    { id: 'nome_colorido', rotulo: 'Um detalhe que transforma', preco: 30, libera: 'cor_nome',
      detalhe: 'Deixe o nome do seu pet ainda mais especial adicionando cores.' }
  ],

  /* O TEXTO JURÍDICO DA PEÇA PERSONALIZADA, palavra por palavra como ele mandou.
     Fica aqui, e não espalhado nas páginas, porque ele aparece em DOIS lugares que
     não podem divergir: a aba do produto e a trava do carrinho. Texto de consumo que
     diverge entre a promessa e o aceite não vale nada — e o que o cliente marcou é
     exatamente isto. */
  personalizados: {
    titulo: 'PRODUTOS PERSONALIZADOS',
    /* ETAPA 18 (22/09/2026, 20:27): texto NOVO dele, palavra por palavra ("apague tudo e coloque
       esse texto"). O anterior: "Por se tratar de um produto produzido sob encomenda e personalizado
       especialmente de acordo com as suas escolhas, pedidos personalizados não poderão ser
       cancelados ou devolvidos após a confirmação de pagamento se o produto já estiver sendo
       fabricado, ressalvados casos de defeito, vício ou erro de fabricação." */
    texto: 'Por serem feitos sob encomenda e personalizados conforme suas escolhas, os pedidos ' +
           'não poderão ser cancelados ou devolvidos após a confirmação do pagamento caso a ' +
           'produção já tenha começado, exceto em casos de defeito, vício ou erro de fabricação.',
    aceite: 'Declaro que revisei cuidadosamente todas as informações da ' +
            'personalização, incluindo nome, grafia e cores. Declaro, ainda, estar ' +
            'ciente e de acordo com as condições acima aplicáveis a produtos ' +
            'personalizados, inclusive quanto a cancelamentos e devoluções.'
  },

  /* AS CORES DA PEÇA — deixou de ser um campo de escrita livre (Cassiano, 15/09/2026,
     3ª rodada). Agora o cliente ESCOLHE quantas cores a peça leva, e o site abre um
     retângulo numerado para cada uma.

     `campos` é quantas cores aquela escolha pede. O Degradê pede ZERO e mostra um aviso:
     o filamento é sazonal, e prometer uma cor que pode não existir no dia da impressão é
     promessa que o CDC cobra depois.

     ⚠️ Ele escreveu "serão 3 opções" e listou QUATRO nomes. Deixei as quatro, porque as
     quatro estão escritas com todas as letras na mensagem dele e porque três delas é que
     pedem cor (o Degradê não pede). Se a intenção era outra, é uma linha aqui. */
  cores_da_peca: {
    titulo: 'Cores da peça',
    opcoes: [
      { id: 'tricolor',      rotulo: 'Tricolor',      campos: 3 },
      { id: 'bicolor',       rotulo: 'Bicolor',       campos: 2 },
      { id: 'monocromatico', rotulo: 'Monocromático', campos: 1 },
      { id: 'degrade',       rotulo: 'Degradê',       campos: 0,
        aviso: 'Por se tratar de filamentos específicos e sazonais, após a confirmação ' +
               'de pagamento entraremos em contato pra informar as cores disponíveis!' }
    ]
  },

  /* FILAMENTOS À VENDA — a lista que vira as opções de cor da peça (23/09/2026, pedido dele às 13:19).
     -------------------------------------------------------------------------------
     O cliente escolhe o ACABAMENTO (Básico, Fosco, Perolizado) e só então a janela da cor abre,
     com as cores DAQUELE acabamento. Ele vê o nome simples; o PEDIDO que chega pro Cassiano leva
     também o nome ORIGINAL do filamento (regra dele: "pra mim aparece o nome original").
       site ...... o que o cliente lê (português, sem Lite/Basic/Matte/Silk)
       original .. Marca · Tipo · Acabamento · Cor, EXATO como ele falou (nunca normalizar)
     ⚠ TESTE: Azul, Amarelo e Verde nos 3 acabamentos, pra ele ver o desenho. Os ORIGINAIS abaixo
     são provisórios ("a confirmar") — a lista real vem dele e substitui esta. */
  filamentos: {
    basico: [
      { site: 'Azul',     original: 'a confirmar · PLA · Basic · Azul' },
      { site: 'Amarelo',  original: 'a confirmar · PLA · Basic · Amarelo' },
      { site: 'Verde',    original: 'a confirmar · PLA · Basic · Verde' }
    ],
    fosco: [
      { site: 'Azul',     original: 'a confirmar · PLA · Matte · Azul' },
      { site: 'Amarelo',  original: 'a confirmar · PLA · Matte · Amarelo' },
      { site: 'Verde',    original: 'a confirmar · PLA · Matte · Verde' }
    ],
    perolizado: [
      { site: 'Azul',     original: 'a confirmar · PLA · Silk · Azul' },
      { site: 'Amarelo',  original: 'a confirmar · PLA · Silk · Amarelo' },
      { site: 'Verde',    original: 'a confirmar · PLA · Silk · Verde' }
    ]
  },
  /* como cada acabamento aparece (a ordem é a da tela) e o que ele acrescenta ao nome da cor:
     Básico não acrescenta nada ("Azul"); Fosco e Perolizado sim ("Azul Fosco", "Azul Perolizado"). */
  acabamentos: [
    { id: 'basico',     rotulo: 'Básico',     sufixo: '' },
    { id: 'fosco',      rotulo: 'Fosco',      sufixo: ' Fosco' },
    { id: 'perolizado', rotulo: 'Perolizado', sufixo: ' Perolizado' }
  ],

  /* Onde entrega. "a combinar" faz o site dizer "consulte o frete" em vez de prometer
     entrega que não existe.
     ⚠️ A palavra "frete" saiu de perto do preço por pedido dele (15/09/2026). Ela
     continua existindo AQUI e na página de trocas e entrega, porque o CDC exige que o
     custo do frete seja informado antes da compra — só não fica mais colada no valor. */
  entrega: 'Jataí-GO com entrega local; demais cidades por transportadora, frete a combinar'
};
