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
  mensagem: 'Oi! Vim pelo site da ālea & Co. Queria saber sobre: {produto}',

  /* ⚠️ Sem "conversao_whatsapp" preenchido o Google Ads NÃO sabe quais cliques viraram
     conversa — e o lance inteligente fica sem nada pra aprender. A campanha vira
     aposta. Preencher ANTES de colocar dinheiro, não depois. */
  conversao_whatsapp: '',

  /* Medição. Vazio = nenhum script de terceiro carrega, e a página não precisa de
     banner de cookie. Preencher só quando a campanha começar. */
  google_ads_id: '',          // AW-000000000
  google_analytics: '',       // G-XXXXXXXXXX

  /* A CONTA DE VERDADE E A MEMÓRIA DA VISITA (22/09/2026).
     api_conta ......... endereço do servidor da conta da ālea (ex.: 'https://api.aleaco.art.br').
                         VAZIO = TUDO DESLIGADO: nenhum script a mais carrega, nenhum aviso
                         aparece, e a gaveta Conta continua sendo a do aparelho, como hoje.
                         Preenchido = a gaveta ganha "Entrar com o Google", a ficha de cadastro
                         (WhatsApp, endereço, pets) e os pedidos em qualquer aparelho; e o site
                         PERGUNTA, uma vez, se pode lembrar o que a pessoa viu.
     login_automatico .. quem já entrou com o Google NESTE aparelho volta logado sozinho, sem
                         clicar (o "One Tap" do Google). Quem nunca entrou não vê janela nenhuma.
     ⚠️ Só preencher DEPOIS de: servidor da ZELES no ar + app do Google NO NOME DO CASSIANO +
     política de privacidade nova publicada. Ordem em ZELES\Conta_Cliente\_INDICE_DA_PASTA.md. */
  api_conta: 'https://api.aleaco.art.br',   // ligado em 23/09/2026 (ordem do Lázaro): servidor da ZELES + app Google 'ālea' + política v2
  login_automatico: true,

  /* 25/09/2026 09:48 — ORDEM DO CASSIANO (áudio, msg 1460), contra o parecer da porta: a tela de conta mostra
     e-mail+senha, código por e-mail e "Cadastre-se" no ar MESMO antes do servidor fazer isso ("se der erro é normal,
     porque o site ainda não está pronto"). Enquanto o servidor não tiver as rotas, quem tentar recebe
     "Isso ainda não está ligado no servidor." Facebook fica de fora (ordem dele, mesmo áudio).
     ⚠️ Quando a casa ligar código/senha no /api/config ("metodos"), deixar esta lista VAZIA ([]) pra voltar a
     obedecer o servidor.
     25/09/2026 11:07 — a casa LIGOU (janela zeles-alea-servidor-conta): /api/config devolve
     "metodos":["google","codigo","senha"], medido. Lista esvaziada: o site volta a obedecer o servidor. */
  conta_metodos_forcados: [],

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
      { id: 'monocromatico', rotulo: 'Monocromático', campos: 1 }
      /* ETAPA 52 (23/09/2026, 14:03): Degradê DESCARTADO de todos os comedouros — "vai me dar muita dor de
         cabeça (...) às vezes eu não vou ter o filamento, ele vai ficar chateado". Era:
         { id: 'degrade', rotulo: 'Degradê', campos: 0, aviso: 'Por se tratar de filamentos específicos e sazonais...' } */
    ]
  },

  /* FILAMENTOS À VENDA — a lista que vira as opções de cor da peça (23/09/2026, pedido dele às 13:19).
     -------------------------------------------------------------------------------
     O cliente escolhe o ACABAMENTO (Básico, Fosco, Perolizado) e só então a janela da cor abre,
     com as cores DAQUELE acabamento. Ele vê o nome simples; o PEDIDO que chega pro Cassiano leva
     também o nome ORIGINAL do filamento (regra dele: "pra mim aparece o nome original").
       site ...... o que o cliente lê (português, sem Lite/Basic/Matte/Silk)
       original .. Marca · Tipo · Acabamento · Cor, EXATO como ele falou (nunca normalizar)
     25/09/2026: a LISTA REAL dele substituiu as de teste (ver o bloco `filamentos` abaixo). */
  filamentos: {
    /* LISTA REAL do Cassiano (25/09/2026, audios 1786-1815, tudo PLA; nomes do site trocados por ele na
       msg 1827; sem 4a aba - audio 1830; + Rosa Silk msg 1835). Gerado por 03_site/07_gerar_filamentos_config_v4_textura_por_cor_2026-09-26.py
       a partir de 03_site/_LISTA_FILAMENTOS_DELE_2026-09-25.json + _TEXTURAS_FILAMENTO.json - nao editar a mao.
       hex = cor OFICIAL do fabricante; eSUN Silk Lime = aproximado (medido na foto oficial da eSUN).
       v4 (26/09/2026): `textura` = filamento com efeito (Marmore: foto IMG_0039 da Chica), `hex_oficial` =
       o do catalogo quando o hex veio da foto dele, `rugosidade`/`metal` = brilho proprio da cor. */
    basico: [
      { site: 'Laranja', hex: '#FF671F', original: 'Bambu Lab · PLA · Lite · Orange (16301)' },
      { site: 'Vermelho', hex: '#C6001A', original: 'Bambu Lab · PLA · Lite · Red (16200)' },
      { site: 'Amarelo Girassol', hex: '#FFB549', original: 'Bambu Lab · PLA · Lite · Sunflower Yellow (16401)' },
      { site: 'Amarelo', hex: '#EFE255', original: 'Bambu Lab · PLA · Lite · Yellow (16400)' },
      { site: 'Azul Bebê', hex: '#4DAFDA', original: 'Bambu Lab · PLA · Lite · Cyan (16600)' },
      { site: 'Azul', hex: '#004EA8', original: 'Bambu Lab · PLA · Lite · Blue (16601)' },
      { site: 'Verde', hex: '#00BB31', original: 'Bambu Lab · PLA · Lite · Green (16501)' },
      { site: 'Verde Oliva', hex: '#1B1F11', original: 'eSUN · PLA · Basic · Olive Green' },
      { site: 'Preto', hex: '#272729', original: 'eSUN · PLA · PLA-Basic · Black' },
      { site: 'Roxo', hex: '#603BA0', original: 'Elegoo · PLA · PLA · Purple' },
      { site: 'Marrom', hex: '#5F3839', original: 'Multfila · PLA · Mult Speed · Marrom (PCI-PLA-046)' },
      { site: 'Mármore', hex: '#E4E4E4', original: 'SUNLU · PLA · High Speed Marble · Chestnut Brown Marble', textura: { img: 'img/texturas/marmore.png', mm: [78.2, 39.1], contraste: 1 } }
    ],
    fosco: [
      { site: 'Branco', hex: '#F6F6F6', original: 'Elegoo · PLA · Matte · Matte White' },
      { site: 'Amarelo', hex: '#F7D863', original: 'Elegoo · PLA · Matte · Sunshine Yellow' },
      { site: 'Laranja', hex: '#E88F13', original: 'Multfila · PLA · Mult Matte · Laranja (4225-PCI-PLM-060)' },
      { site: 'Rosa Claro', hex: '#F9C2D5', original: 'Elegoo · PLA · Matte · Sakura Pink' },
      { site: 'Bordô', hex: '#B32563', original: 'Multfila · PLA · Mult Matte · Bordô (4225-PCI-PLM-118)' },
      { site: 'Lilás', hex: '#9D85D1', original: 'Elegoo · PLA · Matte · Lavender Purple' },
      { site: 'Azul Bebê', hex: '#B3F3FD', original: 'Elegoo · PLA · Matte · Ice Blue' },
      { site: 'Azul Marinho', hex: '#2D3F6F', original: 'Elegoo · PLA · Matte · Navy Blue' },
      { site: 'Verde Menta', hex: '#DBEBBA', original: 'Elegoo · PLA · Matte · Mint Green' },
      { site: 'Cinza', hex: '#9B9EA0', original: 'Bambu Lab · PLA · Matte · Ash Gray (11102)' },
      { site: 'Cáqui', hex: '#E8DBB7', original: 'Bambu Lab · PLA · Matte · Desert Tan (11401)' },
      { site: 'Areia', hex: '#CBA881', original: 'Multfila · PLA · Mult Matte · Areia (4225-PCI-PLM-123)' },
      { site: 'Caramelo', hex: '#D3B7A7', original: 'Bambu Lab · PLA · Matte · Latte Brown (11800)' },
      { site: 'Terracota', hex: '#AC7362', original: 'Multfila · PLA · Mult Matte · Marrom Terracota (4225-PCI-PLM-124)' }
    ],
    perolizado: [
      { site: 'Branco', hex: '#FFFFFF', original: 'Elegoo · PLA · Silk · Silk White', rugosidade: 0.2, metal: 0.05 },
      { site: 'Prata', hex: '#B2C1DA', original: 'SUNLU · PLA · Silk PLA+ · Silk Silver' },
      { site: 'Dourado', hex: '#D09531', original: 'Multfila · PLA · Mult Silk · Ouro Envelhecido (4226-PCI-PLS-048)' },
      { site: 'Laranja', hex: '#F15505', original: 'Voolt3D · PLA · V-Silk · Laranja (PL-LJ-SK-1)' },
      { site: 'Vermelho', hex: '#DA342E', original: 'Multfila · PLA · Mult Silk · Vermelho Metalizado (4226-PCI-PLS-026)' },
      { site: 'Rosa', hex: '#FF7F6F', original: 'eSUN · PLA · PLA-Silk · Pink' },
      { site: 'Azul Aqua', hex: '#6BBFE3', original: 'eSUN · PLA · Silk · Aqua', rugosidade: 0.2, metal: 0.18 },
      { site: 'Azul', hex: '#358AE8', original: 'Multfila · PLA · Mult Silk · Azul Safira Metalizado (4226-PCI-PLS-025)' },
      { site: 'Azul Céu', hex: '#035EB7', original: 'Voolt3D · PLA · V-Silk · Azul Sky (PL-AZ-SY-SK-1)' },
      { site: 'Verde Limão', hex: '#A3E810', original: 'eSUN · PLA · PLA-Silk · Lime' },
      { site: 'Verde', hex: '#129856', original: 'Voolt3D · PLA · V-Silk · Verde (PL-VD-SK-1)' }
    ]
  },
  /* como cada acabamento aparece (a ordem é a da tela) e o que ele acrescenta ao nome da cor:
     Básico não acrescenta nada ("Azul"); Fosco e Perolizado sim ("Azul Fosco", "Azul Perolizado"). */
  acabamentos: [
    { id: 'basico',     rotulo: 'Básico',     sufixo: '' },
    { id: 'fosco',      rotulo: 'Fosco',      sufixo: ' Fosco' },
    { id: 'perolizado', rotulo: 'Perolizado', sufixo: ' Perolizado' }
  ],

  /* A JANELA 3D "Personalize aqui" (protótipo, 23/09/2026, áudios dele das 14:27 e 14:30).
     -------------------------------------------------------------------------------
     Por produto (slug): o .glb (a peça do arquivo dele, sem o nome), o _nome.json (onde o nome original estava
     gravado), a fonte da gravação e as cores. `original` é a peça como ele fotografou (nome OFICIAL + código);
     as abas trazem as cores pra trocar. Protótipo: só a aba Fosco, com as 5 que ele escolheu (todas Bambu Lab
     PLA Matte, cor = código oficial do Bambu Studio). Os nomes simples estão PROPOSTOS a ele (msg 547). */
  modelos3d: {
    'bowl-wave': {
      glb: 'modelos/luke_g.glb',
      nome: 'modelos/luke_g_nome.json',
      fonte: 'fonts/defante.otf',
      original: {
        topo:      { site: 'Laranja', hex: '#FF671F', acabamento: 'basico', oficial: 'Bambu Lab · PLA · Lite · Orange (16301)' },
        principal: { site: 'Branco',  hex: '#FFFFFF', acabamento: 'fosco',  oficial: 'Bambu Lab · PLA · Matte · Ivory White (11100)' },
        base:      { site: 'Cinza',   hex: '#9B9EA0', acabamento: 'fosco',  oficial: 'Bambu Lab · PLA · Matte · Ash Gray (11102)' }
      },
      abas: [
        { id: 'original', rotulo: 'Original' },
        { id: 'fosco', rotulo: 'Fosco', cores: [
          { site: 'Amarelo',     hex: '#F7D959', oficial: 'Bambu Lab · PLA · Matte · Lemon Yellow (11400)' },
          { site: 'Rosa',        hex: '#E8AFCF', oficial: 'Bambu Lab · PLA · Matte · Sakura Pink (11201)' },
          { site: 'Azul Claro',  hex: '#A3D8E1', oficial: 'Bambu Lab · PLA · Matte · Ice Blue (11601)' },
          { site: 'Azul Escuro', hex: '#042F56', oficial: 'Bambu Lab · PLA · Matte · Dark Blue (11602)' },
          { site: 'Terracota',   hex: '#B15533', oficial: 'Bambu Lab · PLA · Matte · Terracotta (11203)' }
        ] }
      ]
    }
  },

  /* Onde entrega. "a combinar" faz o site dizer "consulte o frete" em vez de prometer
     entrega que não existe.
     ⚠️ A palavra "frete" saiu de perto do preço por pedido dele (15/09/2026). Ela
     continua existindo AQUI e na página de trocas e entrega, porque o CDC exige que o
     custo do frete seja informado antes da compra — só não fica mais colada no valor. */
  entrega: 'Jataí-GO com entrega local; demais cidades por transportadora, frete a combinar'
};

/* 25/09/2026 (lote das 20:01, msgs 1847-1848): o "ālea Luke Bowl" é a peça do arquivo 3D do Luke — o MESMO
   luke_g.glb que a janela "Personalize aqui" do antigo Bowl Wave já usava (o Cassiano: "o do Luke eu já tenho, é o
   único que tenho"). A página nova (produto-luke-bowl.html) ganha a mesma janela 3D sem copiar a configuração:
   é a mesma peça, uma configuração só. Matteo, Ayla e Cláudia não têm .glb ainda -> formulário na própria página. */
/* FRASE DAS CORES DA PEÇA (msg 2268 do Cassiano, 27/09/2026, texto EXATO): vai bem pequena entre o título "Cores da
   peça" e as opções Tricolor/Bicolor/Monocromático, em todos os produtos (produto.js v31). Trocar AQUI. */
window.ALEA.fraseCoresDaPeca = 'Qualquer dúvida, nas fotos em tela cheia, você encontra os nomes e as tonalidades reais de cada cor.';
window.ALEA.modelos3d['luke-bowl'] = window.ALEA.modelos3d['bowl-wave'];
/* COR DA CAPA (áudio 2253 do Cassiano, 27/09/2026): cores da foto lukebowl_capa — tricolor: topo Laranja (Básico),
   corpo Branco (Fosco), base Cinza (Fosco). A peça 3D já abria nelas (`original`). Só registro: o formulário começa
   VAZIO (áudio 2263). */
window.ALEA.modelos3d['luke-bowl'].capa = { modo: 'tricolor', escolhas: [
  { acabamento: 'basico', cor: 'Laranja' }, { acabamento: 'fosco', cor: 'Branco' }, { acabamento: 'fosco', cor: 'Cinza' }] };

/* 26/09/2026 (pedido do Cassiano: "o Matteo e a Cláudia iguais ao Luke"): as duas ganham a janela 3D "Personalize aqui",
   cada uma com o SEU arquivo. A Ayla fica sem (áudio 1864: peça sem personalização).
   Os .glb saem do 07_render_capa/exportar_glb_configurador_v3_varias_partes_e_logo.py, SEM decimar (alvo 999999):
   decimado a 16-20 mil faces, a divisa das cores virava serrote e o Matteo perdia a forma (visto em 26/09).
   `original` = as cores que o PRÓPRIO arquivo 3D dele traz (project_settings do .3mf), com o nome oficial do filamento.
   Os campos novos (zonaNome, bicolor, fonteInvertida, nomeInicial) estão explicados no personalizar3d.js v7. */
window.ALEA.modelos3d['matteo-texturized'] = {
  /* 13_lote_2026-09-25_2001/02_ALEA Matteo Texturized_msg1851.zip -> "ALEA Elevated Dog Bowl Texturized.3mf",
     objeto 5 (placa "P"). Zonas: extrusora 1 = topo (a parte de cima, onde o nome está), 2 = base. */
  glb: 'modelos/matteo_g.glb',
  nome: 'modelos/matteo_g_nome.json',
  /* o arquivo grava o nome em Arial; no site vai a Arimo (licença livre SIL OFL 1.1, em fonts/arimo_LICENSE.txt; mesma medida de letra da Arial) */
  fonte: 'fonts/arimo.ttf',
  fonteInvertida: false,
  zonaNome: 'topo',
  /* 26/09/2026 (vídeos dele msgs 2067-2068: "o do Matteo é texturizado (...) lá na pré-visualização ele já tem que
     estar com essa textura"): a PELE FELPUDA que o fatiador aplica em TODAS as paredes. Não é forma do arquivo (a
     malha é lisa); é ajuste do projeto, copiado do .3mf (Metadata/project_settings.config): fuzzy_skin = allwalls,
     modo displacement, ruído billow, 4 oitavas, persistência 0,5, escala 1 mm, espessura 0,2 mm, pontos a cada 0,8 mm.
     Conferido no G-code fatiado (07_render_capa/textura_2026-09-26/fatiado): a parede externa foge da lisa até
     +0,35-0,37 mm, com um ponto a cada 0,85-0,88 mm. A janela 3D desenha o relevo na luz (sem peso de malha). */
  pele: { ruido: 'billow', oitavas: 4, persistencia: 0.5, escalaMm: 1, espessuraMm: 0.2 },
  /* COR DA CAPA (áudio 2253, 27/09/2026): cores da foto matteotex_capa — topo preto, base cáqui (as mesmas do `original`,
     que já batiam com a capa). Só registro: o formulário começa VAZIO (áudio 2263) e a peça abre no `original`. */
  capa: { modo: 'bicolor', escolhas: [{ acabamento: 'basico', cor: 'Preto' }, { acabamento: 'fosco', cor: 'Cáqui' }] },
  /* só bicolor e monocromático (áudio 1863). Bicolor: cor 1 = topo, cor 2 = base. */
  bicolor: { topo: 0, principal: 0, base: 1 },
  original: {
    topo:      { site: 'Preto', hex: '#000000', acabamento: 'basico', oficial: 'Bambu Lab · PLA · Lite · Black' },
    principal: { site: 'Preto', hex: '#000000', acabamento: 'basico', oficial: 'Bambu Lab · PLA · Lite · Black' },
    base:      { site: 'Cáqui', hex: '#E8DBB7', acabamento: 'fosco',  oficial: 'Bambu Lab · PLA · Matte · Desert Tan (11401)' }
  }
};
window.ALEA.modelos3d['claudia-wave'] = {
  /* 13_lote_2026-09-25_2001/04_ALEA Claudia Wave_separados/ALEA Cláudia Wave_msg1859.3mf, objeto 32 (placa "Wave - G").
     Zonas: extrusora 3 = topo (o aro), 1 = principal (o corpo, onde o nome está), 2 = base (a onda). */
  glb: 'modelos/claudia_g.glb',
  nome: 'modelos/claudia_g_nome.json',
  fonte: 'fonts/defante.otf',
  /* o arquivo traz "Chica" (a cachorrinha das fotos); a peça se chama Cláudia, e o mesmo arquivo tem "Cláudia" no objeto 20 */
  nomeInicial: 'Cláudia',
  /* bicolor como ele imprime (foto claudiawave_capa): cor 1 = aro e corpo, cor 2 = a onda de baixo */
  bicolor: { topo: 0, principal: 0, base: 1 },
  /* COR DA CAPA (áudio 2253 do Cassiano, 27/09/2026): "o comedouro tem que ficar na COR DA CAPA quando abre a
     personalização. A capa da Cláudia é bicolor: BRANCO PEROLIZADO com AQUA PEROLIZADO". A peça abre assim (aro e
     corpo = cor 1, a onda = cor 2, como na foto claudiawave_capa). O formulário começa VAZIO (áudio 2263); `capa` é só
     registro das cores da foto, ninguém lê.
     ANTES: as cores que o .3mf trazia — aro Vermelho (Bambu PLA Lite Red), corpo Mármore, onda Azul Silk. O aro
     vermelho parecia "solto" em cima da peça: medido no .glb, ele ENCOSTA no corpo (corpo até y 120,3 mm, aro de
     120,2 a 136,3 mm, os dois com raio 82-88 mm) — era só a cor diferente, que não existe na peça da capa. */
  original: {
    topo:      { site: 'Branco',    hex: '#FFFFFF', acabamento: 'perolizado', oficial: 'Elegoo · PLA · Silk · Silk White' },
    principal: { site: 'Branco',    hex: '#FFFFFF', acabamento: 'perolizado', oficial: 'Elegoo · PLA · Silk · Silk White' },
    base:      { site: 'Azul Aqua', hex: '#6BBFE3', acabamento: 'perolizado', oficial: 'eSUN · PLA · Silk · Aqua' }
  },
  capa: { modo: 'bicolor', escolhas: [{ acabamento: 'perolizado', cor: 'Branco' }, { acabamento: 'perolizado', cor: 'Azul Aqua' }] }
};

/* FILAMENTOS DE CADA FOTO — aparecem SÓ com a foto em TELA CHEIA, no canto de baixo à direita (produto.js v32, 27/09/2026).
   É PALPITE da casa, olhando as fotos: o Cassiano corrige a lista aqui (um filamento por linha, de CIMA pra BAIXO na
   peça, nome EXATO como na lista dele ou como ele confirmou, ex.: Ivory White, Silk Yellow Green, Charcoal). Foto sem
   linha ou com [] = nada aparece. A chave é o caminho da foto grande.
   Origem: 03_site/_FILAMENTOS_POR_FOTO_PALPITE_2026-09-27.json (com a confiança e o motivo de cada palpite). */
/* O QUE O CLIENTE LÊ na tela cheia (27/09/2026, áudio 2295 do Cassiano): "aqueles códigos, aquela nomenclatura é só entre
   eu e você. Entre o cliente e a foto vai ter que ser os nomes lá da personalização. Básico, fosco, perolizado e os nomes
   em português." A lista abaixo guarda o nome ORIGINAL (pra ele); o produto.js mostra o nome da personalização
   (cor + sufixo do acabamento, ex.: "Cinza Fosco"). Filamento que NÃO está à venda cai aqui, com o nome em português: */
window.ALEA.filamentosNomeCliente = {
  "Bambu Lab · PLA · Matte · Ivory White": "Branco Fosco",                          // À VENDA (é o Branco fosco, 11100 — áudio 2332); fica aqui só pra casar o nome sem código
  "Bambu Lab · PLA · Matte · Charcoal": "Preto Fosco",                              // ele: Charcoal = "Preto"
  "Fulljoy · PLA · Silk · Yellow Green": "Verde e Amarelo Perolizado",              // dual color verde+amarelo
  "Elegoo · PLA · Silk · Gold": "Dourado Perolizado",                               // áudio 2293
  "Multfila · PLA · Silk Dual Color · Dourado e Vermelho": "Dourado e Vermelho Perolizado", // áudio 2290
  "Elegoo · PLA · Silk Dual Color · Black Purple": "Preto e Roxo Perolizado"        // áudio 2292
};
window.ALEA.filamentosPorFoto = {
  "img/produtos/lukebowl_capa.jpg": ["Bambu Lab · PLA · Lite · Orange (16301)", "Bambu Lab · PLA · Matte · Ivory White", "Bambu Lab · PLA · Matte · Ash Gray (11102)"],
  "img/produtos/lukebowl_0005.jpg": ["Bambu Lab · PLA · Lite · Orange (16301)", "Bambu Lab · PLA · Matte · Ivory White", "Bambu Lab · PLA · Matte · Ash Gray (11102)"],
  "img/produtos/lukebowl_9148.jpg": ["Bambu Lab · PLA · Lite · Orange (16301)", "Bambu Lab · PLA · Matte · Ivory White", "Bambu Lab · PLA · Matte · Ash Gray (11102)"],
  "img/produtos/lukebowl_9170.jpg": ["Bambu Lab · PLA · Lite · Orange (16301)", "Bambu Lab · PLA · Matte · Ivory White", "Bambu Lab · PLA · Matte · Ash Gray (11102)"],
  "img/produtos/lukebowl_wa182751.jpg": ["Bambu Lab · PLA · Matte · Latte Brown (11800)", "SUNLU · PLA · High Speed Marble · Chestnut Brown Marble", "Multfila · PLA · Mult Speed · Marrom (PCI-PLA-046)"],
  "img/produtos/lukebowl_wa182753.jpg": ["Bambu Lab · PLA · Matte · Latte Brown (11800)", "SUNLU · PLA · High Speed Marble · Chestnut Brown Marble", "Multfila · PLA · Mult Speed · Marrom (PCI-PLA-046)"],
  "img/produtos/lukebowl_wa183050.jpg": ["Bambu Lab · PLA · Matte · Latte Brown (11800)", "SUNLU · PLA · High Speed Marble · Chestnut Brown Marble", "Multfila · PLA · Mult Speed · Marrom (PCI-PLA-046)"],
  "img/produtos/lukebowl_9185.jpg": ["Bambu Lab · PLA · Lite · Orange (16301)", "Bambu Lab · PLA · Matte · Ivory White", "Bambu Lab · PLA · Matte · Ash Gray (11102)"],
  "img/produtos/lukebowl_9189.jpg": ["Bambu Lab · PLA · Lite · Orange (16301)", "Bambu Lab · PLA · Matte · Ivory White", "Bambu Lab · PLA · Matte · Ash Gray (11102)"],
  "img/produtos/lukebowl_0241.jpg": ["Fulljoy · PLA · Silk · Yellow Green"],
  "img/produtos/lukebowl_9291.jpg": ["Fulljoy · PLA · Silk · Yellow Green"],
  "img/produtos/lukebowl_9295.jpg": ["Fulljoy · PLA · Silk · Yellow Green"],
  "img/produtos/lukebowl_9304.jpg": ["Fulljoy · PLA · Silk · Yellow Green"],
  "img/produtos/lukebowl_9307.jpg": ["Fulljoy · PLA · Silk · Yellow Green"],
  "img/produtos/lukebowl_9312.jpg": ["Fulljoy · PLA · Silk · Yellow Green"],
  "img/produtos/lukebowl_9313.jpg": ["Fulljoy · PLA · Silk · Yellow Green"],
  "img/produtos/lukebowl_9318.jpg": ["Fulljoy · PLA · Silk · Yellow Green"],
  "img/produtos/matteotex_capa.jpg": ["Bambu Lab · PLA · Matte · Charcoal", "Bambu Lab · PLA · Matte · Desert Tan (11401)"],
  "img/produtos/matteotex_0094.jpg": ["Bambu Lab · PLA · Matte · Charcoal", "Bambu Lab · PLA · Matte · Desert Tan (11401)"],
  "img/produtos/matteotex_9202.jpg": ["Bambu Lab · PLA · Matte · Charcoal", "Bambu Lab · PLA · Matte · Desert Tan (11401)"],
  "img/produtos/matteotex_9220.jpg": ["Bambu Lab · PLA · Matte · Charcoal", "Bambu Lab · PLA · Matte · Desert Tan (11401)"],
  "img/produtos/matteotex_9240.jpg": ["Bambu Lab · PLA · Matte · Charcoal", "Bambu Lab · PLA · Matte · Desert Tan (11401)"],
  "img/produtos/matteotex_9255.jpg": ["Bambu Lab · PLA · Matte · Charcoal", "Bambu Lab · PLA · Matte · Desert Tan (11401)"],
  "img/produtos/matteotex_9262.jpg": ["Bambu Lab · PLA · Matte · Charcoal", "Bambu Lab · PLA · Matte · Desert Tan (11401)"],
  "img/produtos/aylapompom_capa.jpg": ["Bambu Lab · PLA · Lite · Red (16200)", "eSUN · PLA · PLA-Basic · Black", "Elegoo · PLA · Matte · Matte White", "Voolt3D · PLA · V-Silk · Verde (PL-VD-SK-1)"],
  "img/produtos/aylapompom_0145.jpg": ["Bambu Lab · PLA · Lite · Red (16200)", "eSUN · PLA · PLA-Basic · Black", "Elegoo · PLA · Matte · Matte White", "Voolt3D · PLA · V-Silk · Verde (PL-VD-SK-1)"],
  "img/produtos/aylapompom_9120.jpg": ["Bambu Lab · PLA · Lite · Red (16200)", "eSUN · PLA · PLA-Basic · Black", "Elegoo · PLA · Matte · Matte White", "Voolt3D · PLA · V-Silk · Verde (PL-VD-SK-1)"],
  "img/produtos/aylapompom_9737.jpg": ["Bambu Lab · PLA · Lite · Red (16200)", "eSUN · PLA · PLA-Basic · Black", "Elegoo · PLA · Matte · Matte White", "Voolt3D · PLA · V-Silk · Verde (PL-VD-SK-1)"],
  "img/produtos/aylapompom_9859.jpg": ["Bambu Lab · PLA · Lite · Red (16200)", "eSUN · PLA · PLA-Basic · Black", "Elegoo · PLA · Matte · Matte White", "Voolt3D · PLA · V-Silk · Verde (PL-VD-SK-1)"],
  "img/produtos/aylapompom_9931.jpg": [],
  "img/produtos/aylapompom_9935.jpg": [],
  "img/produtos/claudiawave_capa.jpg": ["Elegoo · PLA · Silk · Silk White", "Elegoo · PLA · Silk · Gold", "eSUN · PLA · Silk · Aqua"],
  "img/produtos/claudiawave_0039.jpg": ["Elegoo · PLA · Matte · Sakura Pink", "SUNLU · PLA · High Speed Marble · Chestnut Brown Marble", "Bambu Lab · PLA · Lite · Cyan (16600)"],
  "img/produtos/claudiawave_0196.jpg": ["Multfila · PLA · Silk Dual Color · Dourado e Vermelho", "Elegoo · PLA · Silk Dual Color · Black Purple"],
  "img/produtos/claudiawave_9569.jpg": ["Elegoo · PLA · Silk · Silk White", "Elegoo · PLA · Silk · Gold", "eSUN · PLA · Silk · Aqua"],
  "img/produtos/claudiawave_9590.jpg": ["Elegoo · PLA · Silk · Silk White", "Elegoo · PLA · Silk · Gold", "eSUN · PLA · Silk · Aqua"],
  "img/produtos/claudiawave_9676.jpg": ["Multfila · PLA · Silk Dual Color · Dourado e Vermelho", "Elegoo · PLA · Silk Dual Color · Black Purple"],
  "img/produtos/claudiawave_9698.jpg": ["Multfila · PLA · Silk Dual Color · Dourado e Vermelho", "Elegoo · PLA · Silk Dual Color · Black Purple"],
  "img/produtos/claudiawave_0020.jpg": ["Elegoo · PLA · Matte · Sakura Pink", "SUNLU · PLA · High Speed Marble · Chestnut Brown Marble", "Bambu Lab · PLA · Lite · Cyan (16600)"],
  "img/produtos/claudiawave_0104.jpg": ["Elegoo · PLA · Matte · Sakura Pink", "SUNLU · PLA · High Speed Marble · Chestnut Brown Marble", "Bambu Lab · PLA · Lite · Cyan (16600)"],
  "img/produtos/claudiawave_0166.jpg": ["Multfila · PLA · Silk Dual Color · Dourado e Vermelho", "Elegoo · PLA · Silk Dual Color · Black Purple"],
  "img/produtos/claudiawave_9528.jpg": ["Elegoo · PLA · Silk · Silk White", "Elegoo · PLA · Silk · Gold", "eSUN · PLA · Silk · Aqua"],
  "img/produtos/claudiawave_9566.jpg": ["Elegoo · PLA · Silk · Silk White", "Elegoo · PLA · Silk · Gold", "eSUN · PLA · Silk · Aqua"],
  "img/produtos/claudiawave_9570.jpg": ["Elegoo · PLA · Silk · Silk White", "Elegoo · PLA · Silk · Gold", "eSUN · PLA · Silk · Aqua"],
  "img/produtos/claudiawave_9572.jpg": ["Elegoo · PLA · Silk · Silk White", "Elegoo · PLA · Silk · Gold", "eSUN · PLA · Silk · Aqua"],
  "img/produtos/claudiawave_9587.jpg": ["Elegoo · PLA · Silk · Silk White", "Elegoo · PLA · Silk · Gold", "eSUN · PLA · Silk · Aqua"],
  "img/produtos/claudiawave_9647.jpg": ["Multfila · PLA · Silk Dual Color · Dourado e Vermelho", "Elegoo · PLA · Silk Dual Color · Black Purple"],
  "img/produtos/claudiawave_9648.jpg": ["Multfila · PLA · Silk Dual Color · Dourado e Vermelho", "Elegoo · PLA · Silk Dual Color · Black Purple"],
  "img/produtos/claudiawave_9654.jpg": ["Multfila · PLA · Silk Dual Color · Dourado e Vermelho", "Elegoo · PLA · Silk Dual Color · Black Purple"],
  "img/produtos/claudiawave_9674.jpg": ["Multfila · PLA · Silk Dual Color · Dourado e Vermelho", "Elegoo · PLA · Silk Dual Color · Black Purple"],
  "img/produtos/claudiawave_9695.jpg": ["Multfila · PLA · Silk Dual Color · Dourado e Vermelho", "Elegoo · PLA · Silk Dual Color · Black Purple"],
  "img/produtos/lukebowl_capaq.jpg": ["Bambu Lab · PLA · Lite · Orange (16301)", "Bambu Lab · PLA · Matte · Ivory White", "Bambu Lab · PLA · Matte · Ash Gray (11102)"],
  "img/produtos/matteotex_capaq.jpg": ["Bambu Lab · PLA · Matte · Charcoal", "Bambu Lab · PLA · Matte · Desert Tan (11401)"],
  "img/produtos/aylapompom_capaq.jpg": ["Bambu Lab · PLA · Lite · Red (16200)", "eSUN · PLA · PLA-Basic · Black", "Elegoo · PLA · Matte · Matte White", "Voolt3D · PLA · V-Silk · Verde (PL-VD-SK-1)"],
  "img/produtos/claudiawave_capaq.jpg": ["Elegoo · PLA · Silk · Silk White", "Elegoo · PLA · Silk · Gold", "eSUN · PLA · Silk · Aqua"]
};
