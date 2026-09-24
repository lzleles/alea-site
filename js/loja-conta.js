/* CATALOGO:
   nome: loja-conta
   categoria: UTIL
   objetivo: A página conta.html no desenho da Tiffany — "Escolha uma opção para entrar" (e-mail e senha, código de acesso por e-mail, Google), o código de 6 dígitos, e a Minha Conta (Olá!, Dados pessoais, Endereços, Pedidos, Autenticação, Lista de Desejos, Sair).
   entrada: window.aleaLoja (loja-dados.js); window.PRODUTOS (produtos.js)
   saida: conta.html desenhada; volta pra ?voltar= depois de entrar
   status: prévia (23/09/2026)
   validado_em: 2026-09-23 (Playwright 390 px, motor prévia)
*/
/* =============================================================================
   loja-conta.js — a conta "igual à da Tiffany" (áudios do Cassiano, 23/09/2026 20:36-20:47)
   =============================================================================
   O QUE ELE PEDIU, NA ORDEM DELE:
     · entrar com o Google continua; "a primeira opção vai ser igual o site da Tiffany";
     · "receber código de acesso por e-mail": o e-mail chega com o código, a pessoa digita e entra;
     · a página "Minha Conta" do vídeo (Olá!, Dados pessoais, Endereços, Pedidos…);
     · a ficha segue a da Tiffany (21:46: "no site da Tiffany não tem isso [aniversário], então esse
       item pode excluir") — sai a data de nascimento. "Lembrar as peças que vi" fica: é o controle
       da memória da visita (LGPD). "Novidades" nunca vem marcada; a política, quem não aceitou, marca.
   O QUE FICOU DE FORA DE PROPÓSITO (espera o Lázaro, 23/09/2026): "Cartões" (cartão salvo) e o
   RG / órgão emissor. "Dicas enviadas" é um recurso da Tiffany (mandar a lista de desejos pra
   alguém dar de presente) que a ālea não tem.
   ========================================================================== */
(function () {
  'use strict';

  var L = window.aleaLoja;
  var raiz = document.querySelector('[data-loja-conta]');
  if (!L || !raiz) return;
  /* a faixa "isto é prévia" mora DENTRO da página (o topo do site é fixo e cobriria o que vem antes) */
  var FAIXA = L.previa ? '<div class="loja-previa">Prévia: a conta e os dados ficam só neste aparelho. Nada vai pro servidor.</div>' : '';

  var eu = null;
  var modoEntrar = 'senha';        // 'senha' | 'codigo'  — o que está ABERTO embaixo do título
  var codigoPara = null;           // e-mail que recebeu o código (tela "Digite o código…")
  var erro = '';
  var aviso = '';

  var params = new URLSearchParams(location.search);
  var voltar = params.get('voltar');
  if (voltar && !/^[a-z0-9\-]+\.html(#[\w\/\-]*)?$/i.test(voltar)) voltar = null;   // só página do próprio site

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function dinheiro(v) { return window.aleaDinheiro ? window.aleaDinheiro(v) : 'R$ ' + Number(v).toFixed(2).replace('.', ','); }
  function secao() { return (location.hash || '').replace(/^#\/?/, '') || ''; }
  function ir(s) { if (secao() === s) pintar(); else location.hash = '#/' + s; }

  var OLHO = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 5c-5 0-9 4.5-10 7 1 2.5 5 7 10 7s9-4.5 10-7c-1-2.5-5-7-10-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0-2.2a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6z"/></svg>';
  var G = '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';

  /* ================================================================== ENTRAR */
  function htmlEntrar() {
    var h = '<h1 class="loja-titulo">Escolha uma opção para entrar</h1>';
    if (codigoPara) {
      /* a tela do vídeo depois de pedir o código: as duas opções viram botões em cima, e embaixo
         "Digite o código enviado para seu e-mail" com Voltar e Entrar */
      h += '<div class="loja-opcoes">' +
        '<button type="button" class="loja-bt opcao cheia" data-modo="senha">Entrar com e-mail e senha</button>' +
        '<button type="button" class="loja-bt opcao" data-modo="codigo">Receber código por e-mail</button></div>' +
        '<h2 class="loja-sub">Digite o código enviado para seu e-mail</h2>' +
        (L.previa ? '<p class="loja-aviso">Prévia: o e-mail de verdade ainda não sai. O código aqui é <strong>' + L.codigoPrevia + '</strong>.</p>' : '') +
        '<form data-form="codigo-digitar" novalidate>' +
        '<label class="loja-campo loja-codigo"><input name="codigo" inputmode="numeric" autocomplete="one-time-code" maxlength="6" ' +
          'placeholder="Adicione seu código de acesso" aria-label="Código de acesso"></label>' +
        (erro ? '<p class="loja-erro" role="alert">' + esc(erro) + '</p>' : '') +
        '<div class="loja-par"><button type="button" class="loja-bt contorno pequeno" data-codigo-voltar>Voltar</button>' +
        '<button type="submit" class="loja-bt entrar">Entrar</button></div></form>';
      return h + htmlGoogle();
    }
    if (modoEntrar === 'codigo') {
      h += '<button type="button" class="loja-bt opcao cheia" data-modo="senha">Entrar com e-mail e senha</button>' +
        '<h2 class="loja-sub">Receber código de acesso por e-mail</h2>' +
        '<form data-form="codigo-pedir" novalidate>' +
        '<label class="loja-campo"><span>E-mail</span><input name="email" type="email" autocomplete="email" inputmode="email" ' +
          'placeholder="Ex.: exemplo@mail.com"></label>' +
        (erro ? '<p class="loja-erro" role="alert">' + esc(erro) + '</p>' : '') +
        '<button type="submit" class="loja-bt entrar">Entrar</button></form>';
    } else {
      h += '<button type="button" class="loja-bt opcao" data-modo="codigo">Receber código por e-mail</button>' +
        '<h2 class="loja-sub">Entrar com e-mail e senha</h2>' +
        '<form data-form="senha" novalidate>' +
        '<label class="loja-campo"><span>E-mail</span><input name="email" type="email" autocomplete="email" inputmode="email" ' +
          'placeholder="Ex.: exemplo@mail.com"></label>' +
        '<label class="loja-campo loja-senha"><span>Senha</span><input name="senha" type="password" autocomplete="current-password" ' +
          'placeholder="Adicione sua senha"><button type="button" data-olho aria-label="Mostrar senha">' + OLHO + '</button></label>' +
        (erro ? '<p class="loja-erro" role="alert">' + esc(erro) + '</p>' : '') +
        '<p style="margin:22px 0 10px"><button type="button" class="loja-link seta" data-modo="codigo" data-esqueci>Esqueci minha senha</button></p>' +
        '<button type="submit" class="loja-bt entrar">Entrar</button>' +
        '<p style="margin:22px 0 0"><button type="button" class="loja-link" data-modo="codigo">Não tem uma conta? <span class="loja-link sublinha">Cadastre-se</span></button></p>' +
        '</form>';
    }
    return h + htmlGoogle();
  }
  function htmlGoogle() {
    return '<p class="loja-miudo" style="text-align:center;margin:34px 0 12px">ou</p>' +
      '<div data-google-botao></div>' +
      '<button type="button" class="loja-bt opcao google" data-entrar-google' + (L.previa ? '' : ' hidden') + '>' + G +
        '<span>Continuar com o Google</span></button>' +
      '<p class="loja-miudo" style="text-align:center;margin:18px 0 0">Ao entrar você concorda com a ' +
        '<a href="privacidade.html">Política de Privacidade</a> da ālea.</p>';
  }

  /* O botão OFICIAL do Google só funciona no endereço cadastrado no Google (o site do ar). Na prévia
     aparece o botão de mentira, que entra como uma pessoa de teste. */
  function prepararGoogle() {
    if (L.previa) return;
    var alvo = raiz.querySelector('[data-google-botao]');
    if (!alvo) return;
    L.config().then(function (cfg) {
      if (!cfg || !cfg.google_client_id) return;
      var s = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      var pronto = function () {
        if (!window.google || !google.accounts || !alvo.isConnected) return;
        google.accounts.id.initialize({ client_id: cfg.google_client_id, itp_support: true, use_fedcm_for_prompt: true,
          callback: function (resp) { L.entrarGoogle(resp.credential).then(entrou).catch(falhou); } });
        google.accounts.id.renderButton(alvo, { theme: 'outline', size: 'large', shape: 'rectangular', text: 'continue_with',
          locale: 'pt-BR', width: Math.min(400, alvo.clientWidth || 327) });
      };
      if (s && window.google) return pronto();
      s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = pronto;
      document.head.appendChild(s);
    }).catch(function () { /* sem servidor: sem Google */ });
  }

  function entrou(j) {
    eu = j; erro = ''; codigoPara = null;
    try { localStorage.setItem('alea_entrou_v1', '1'); } catch (e) { /* nada */ }
    if (voltar) { location.href = voltar; return; }
    ir('');
  }
  function falhou(e) { erro = e.message || 'Não deu certo agora. Tente de novo.'; pintar(); }

  /* ============================================================= MINHA CONTA */
  var MENU = [['dados', 'Dados pessoais'], ['enderecos', 'Endereços'], ['pedidos', 'Pedidos'],
              ['autenticacao', 'Autenticação'], ['desejos', 'Lista de Desejos']];

  function htmlMenu() {
    return '<p class="loja-ola">Olá' + (eu.nome ? ', ' + esc(eu.nome) : '') + '!</p>' +
      '<ul class="loja-menu">' + MENU.map(function (m) {
        return '<li><a href="#/' + m[0] + '">' + m[1] + '</a></li>';
      }).join('') + '<li><button type="button" data-sair>Sair</button></li></ul>';
  }
  function cabecaSecao(t) {
    return '<a class="loja-voltar-menu" href="#/">‹ Minha Conta</a><h1 class="loja-secao-titulo">' + t + '</h1>';
  }

  /* ---- Dados pessoais */
  function mascaraTelefone(v) {
    var d = String(v || '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '').slice(0, 11);
    if (d.length <= 2) return d.length ? '(' + d : '';
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }
  function mascaraCpf(v) {
    var d = String(v || '').replace(/\D/g, '').slice(0, 11);
    return d.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1-$2');
  }
  function cpfValido(v) {
    var d = String(v || '').replace(/\D/g, '');
    if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
    for (var t = 9; t < 11; t++) {
      var s = 0;
      for (var i = 0; i < t; i++) s += +d[i] * (t + 1 - i);
      if (((s * 10) % 11) % 10 !== +d[t]) return false;
    }
    return true;
  }
  function nascimentoValido(v) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v || '')) return false;
    var d = new Date(v + 'T12:00:00'); var hoje = new Date();
    var anos = (hoje - d) / (365.25 * 864e5);
    return anos >= 12 && anos <= 110;
  }
  window.aleaLojaUtil = { mascaraTelefone: mascaraTelefone, mascaraCpf: mascaraCpf, cpfValido: cpfValido,
                          nascimentoValido: nascimentoValido, esc: esc, dinheiro: dinheiro };

  function htmlDados() {
    var e = eu;
    return cabecaSecao('Dados pessoais') +
      '<form data-form="dados" novalidate>' +
      '<label class="loja-campo"><span>E-mail</span><input value="' + esc(e.email) + '" readonly aria-readonly="true"></label>' +
      '<label class="loja-campo"><span>Primeiro nome</span><input name="nome" autocomplete="given-name" maxlength="60" value="' + esc(e.nome) + '"></label>' +
      '<label class="loja-campo"><span>Último nome</span><input name="sobrenome" autocomplete="family-name" maxlength="80" value="' + esc(e.sobrenome) + '"></label>' +
      '<div class="loja-dupla">' +
        '<label class="loja-campo"><span>CPF</span><input name="cpf" inputmode="numeric" maxlength="14" placeholder="999.999.999-99" value="' + esc(mascaraCpf(e.cpf)) + '"></label>' +
        '<label class="loja-campo"><span>Telefone</span><input name="telefone" type="tel" inputmode="tel" autocomplete="tel-national" maxlength="15" placeholder="(64) 99999-9999" value="' + esc(mascaraTelefone(e.telefone)) + '"></label>' +
      '</div>' +
      '<label class="loja-marca"><input type="checkbox" name="consent_personalizar"' + (e.consent_personalizar ? ' checked' : '') + '>' +
        '<span>Lembrar as peças que eu vi, pra me mostrar de novo quando eu voltar</span></label>' +
      '<label class="loja-marca"><input type="checkbox" name="consent_marketing"' + (e.consent_marketing ? ' checked' : '') + '>' +
        '<span>Quero receber novidades e ofertas da ālea</span></label>' +
      (e.politica_aceita ? '' :
        '<label class="loja-marca" data-politica><input type="checkbox" name="aceite_politica"><span>Li e aceito a ' +
        '<a href="privacidade.html" target="_blank" rel="noopener">Política de Privacidade</a></span></label>') +
      (erro ? '<p class="loja-erro" role="alert">' + esc(erro) + '</p>' : '') +
      (aviso ? '<p class="loja-aviso" role="status">' + esc(aviso) + '</p>' : '') +
      '<button type="submit" class="loja-bt largo" style="margin-top:18px">Salvar</button>' +
      '</form>' +
      '<p class="loja-miudo" style="margin-top:30px">Seus direitos (LGPD): ' +
        '<button type="button" class="loja-link sublinha loja-miudo" data-baixar>baixar meus dados</button> · ' +
        '<button type="button" class="loja-link sublinha loja-miudo" data-excluir>excluir minha conta</button></p>';
  }

  function validarDados(form) {
    var faltas = [];
    function marca(nome, ok, dica) {
      var el = form.querySelector('[name="' + nome + '"]');
      var lab = el && el.closest('.loja-campo, .loja-marca');
      if (!lab) return;
      lab.classList.toggle('faltou', !ok);
      var velha = lab.querySelector('.dica-erro'); if (velha) velha.remove();
      if (!ok) { faltas.push(nome); if (dica && lab.classList.contains('loja-campo')) lab.insertAdjacentHTML('beforeend', '<small class="dica-erro">' + dica + '</small>'); }
    }
    var v = function (n) { var el = form.querySelector('[name="' + n + '"]'); return el ? (el.type === 'checkbox' ? el.checked : el.value.trim()) : ''; };
    marca('nome', !!v('nome'), 'Preencha o primeiro nome');
    marca('sobrenome', !!v('sobrenome'), 'Preencha o último nome');
    marca('cpf', cpfValido(v('cpf')), v('cpf') ? 'CPF inválido' : 'Preencha o CPF');
    marca('telefone', v('telefone').replace(/\D/g, '').length >= 10, 'Telefone com DDD');
    if (form.querySelector('[name="aceite_politica"]')) marca('aceite_politica', v('aceite_politica'));
    return faltas;
  }

  /* ---- Endereços */
  function linhaEndereco(x) {
    return esc(x.logradouro) + ', ' + esc(x.numero) + (x.complemento ? ' — ' + esc(x.complemento) : '') + '<br>' +
      (x.bairro ? esc(x.bairro) + ' - ' : '') + esc(x.cidade) + ' - ' + esc(x.uf) + '<br>CEP ' + esc(String(x.cep).replace(/^(\d{5})(\d{3})$/, '$1-$2'));
  }
  function formEndereco(atributo) {
    return '<form ' + atributo + ' novalidate>' +
      '<label class="loja-campo"><span>CEP</span><input name="cep" inputmode="numeric" autocomplete="postal-code" maxlength="9" placeholder="00000-000"></label>' +
      '<label class="loja-campo"><span>Rua</span><input name="logradouro" autocomplete="address-line1"></label>' +
      '<div class="loja-dupla"><label class="loja-campo"><span>Número <small>(obrigatório)</small></span><input name="numero"></label>' +
      '<label class="loja-campo"><span>Complemento <small>(opcional)</small></span><input name="complemento" autocomplete="address-line2"></label></div>' +
      '<label class="loja-campo"><span>Bairro</span><input name="bairro"></label>' +
      '<div class="loja-dupla"><label class="loja-campo"><span>Cidade</span><input name="cidade" autocomplete="address-level2"></label>' +
      '<label class="loja-campo"><span>UF</span><input name="uf" maxlength="2" autocomplete="address-level1" style="text-transform:uppercase"></label></div>' +
      '<button type="submit" class="loja-bt largo" style="margin-top:8px">Salvar endereço</button></form>';
  }
  function htmlEnderecos() {
    var ends = eu.enderecos || [];
    return cabecaSecao('Endereços') +
      (ends.length ? '<ul class="loja-lista">' + ends.map(function (x) {
        return '<li><div>' + (x.principal ? '<strong>Principal</strong><br>' : '') + linhaEndereco(x) + '</div>' +
          '<div class="acoes">' + (x.principal ? '' : '<button type="button" data-principal="' + esc(x.id) + '">tornar principal</button>') +
          '<button type="button" data-tirar-end="' + esc(x.id) + '">remover</button></div></li>';
      }).join('') + '</ul>' : '<p class="loja-vazio">Você ainda não tem endereço cadastrado.</p>') +
      (erro ? '<p class="loja-erro" role="alert">' + esc(erro) + '</p>' : '') +
      '<h2 class="loja-rotulo">Adicionar endereço</h2>' + formEndereco('data-form="endereco"');
  }
  function ligarCep(form) {
    var cep = form.querySelector('[name="cep"]');
    if (!cep) return;
    cep.addEventListener('input', function () {
      var d = cep.value.replace(/\D/g, '').slice(0, 8);
      cep.value = d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d;
      if (d.length !== 8 || cep.dataset.buscado === d) return;
      cep.dataset.buscado = d;
      L.buscarCep(d).then(function (j) {
        ['logradouro', 'bairro', 'cidade', 'uf'].forEach(function (k) {
          var el = form.querySelector('[name="' + k + '"]'); if (el && j[k]) el.value = j[k];
        });
        var n = form.querySelector('[name="numero"]'); if (n) n.focus();
      }).catch(function () { /* não achou: a pessoa preenche */ });
    });
  }
  window.aleaLojaUtil.ligarCep = ligarCep;
  window.aleaLojaUtil.linhaEndereco = linhaEndereco;

  /* ---- Pedidos */
  function htmlPedidos() {
    var ps = eu.pedidos || [];
    return cabecaSecao('Pedidos') + (ps.length ? '<ul class="loja-lista">' + ps.map(function (p) {
      var d = new Date(p.criado_em);
      var quando = ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
      var itens = p.itens || [];
      return '<li><div><strong>Pedido ' + esc(p.numero) + '</strong><br>' + quando + ' · ' + itens.length + (itens.length === 1 ? ' peça' : ' peças') +
        '<br>' + itens.map(function (i) { return esc(i.nome); }).join(', ') + '</div>' +
        '<div>' + ((p.total_pecas || p.total) ? dinheiro(p.total_pecas || p.total) : '') + '</div></li>';
    }).join('') + '</ul>' : '<p class="loja-vazio">Você ainda não fez nenhum pedido.</p>');
  }

  /* ---- Autenticação */
  function htmlAutenticacao() {
    var nomes = { google: 'Google', facebook: 'Facebook', codigo: 'código por e-mail', senha: 'e-mail e senha', teste: 'teste' };
    var provs = (eu.provedores || []).map(function (p) { return nomes[p] || p; });
    return cabecaSecao('Autenticação') +
      '<p style="font-size:13px;line-height:1.55;margin:0 0 20px">E-mail da conta: <strong>' + esc(eu.email) + '</strong>' +
        (provs.length ? '<br>Você já entrou por: ' + esc(provs.join(', ')) : '') + '</p>' +
      '<h2 class="loja-rotulo">' + (eu.tem_senha ? 'Trocar a senha' : 'Criar uma senha') + '</h2>' +
      '<p class="loja-miudo" style="margin:0 0 14px">Com a senha você entra direto, sem esperar o código no e-mail. Mínimo de 8 caracteres.</p>' +
      '<form data-form="senha-nova" novalidate>' +
      '<label class="loja-campo loja-senha"><span>Nova senha</span><input name="senha" type="password" autocomplete="new-password" minlength="8">' +
        '<button type="button" data-olho aria-label="Mostrar senha">' + OLHO + '</button></label>' +
      '<label class="loja-campo"><span>Confirme a nova senha</span><input name="senha2" type="password" autocomplete="new-password" minlength="8"></label>' +
      (erro ? '<p class="loja-erro" role="alert">' + esc(erro) + '</p>' : '') +
      (aviso ? '<p class="loja-aviso" role="status">' + esc(aviso) + '</p>' : '') +
      '<button type="submit" class="loja-bt largo" style="margin-top:8px">Salvar senha</button></form>';
  }

  /* ---- Lista de Desejos */
  function htmlDesejos() {
    var ps = window.PRODUTOS || [];
    var l = L.desejos.lista().map(function (slug) {
      for (var i = 0; i < ps.length; i++) if (ps[i].slug === slug) return ps[i];
      return null;
    }).filter(Boolean);
    return cabecaSecao('Lista de Desejos') + (l.length ? '<div class="loja-desejos">' + l.map(function (p) {
      return '<div><a href="produto-' + esc(p.slug) + '.html"><img src="img/produtos/' + esc(p.capa) + '_obj_m.webp" alt="" loading="lazy" ' +
        'onerror="this.onerror=null;this.src=&quot;img/produtos/' + esc(p.capa) + '_m.jpg&quot;">' + esc(p.nome) + '<br>' +
        (p.preco ? dinheiro(p.preco) : 'Sob consulta') + '</a><br><button type="button" class="tirar" data-tirar-desejo="' + esc(p.slug) + '">remover</button></div>';
    }).join('') + '</div>' : '<p class="loja-vazio">Sua lista está vazia. Toque no coração na página de uma peça para guardá-la aqui.</p>');
  }

  /* ================================================================ desenhar */
  function pintar() {
    if (!eu) return;
    var s = secao();
    var corpo;
    if (!eu.logado) {
      corpo = htmlEntrar();
      raiz.innerHTML = FAIXA + corpo;
      prepararGoogle();
    } else {
      var mapa = { dados: htmlDados, enderecos: htmlEnderecos, pedidos: htmlPedidos, autenticacao: htmlAutenticacao, desejos: htmlDesejos };
      var titulo = (MENU.filter(function (m) { return m[0] === s; })[0] || [])[1];
      raiz.innerHTML = FAIXA + '<nav class="loja-migalha" aria-label="Você está em"><a href="index.html">Início</a> / ' +
        (titulo ? '<a href="#/">Minha Conta</a> / ' + titulo : 'Minha Conta') + '</nav>' +
        (mapa[s] ? mapa[s]() : htmlMenu());
    }
    ligar();
    erro = ''; aviso = '';
  }

  function ligar() {
    Array.prototype.forEach.call(raiz.querySelectorAll('form'), function (f) {
      f.addEventListener('submit', enviar);
      if (f.matches('[data-form="endereco"]')) ligarCep(f);
    });
    var tel = raiz.querySelector('[name="telefone"]');
    if (tel) tel.addEventListener('input', function () { tel.value = mascaraTelefone(tel.value); });
    var cpf = raiz.querySelector('[name="cpf"]');
    if (cpf) cpf.addEventListener('input', function () { cpf.value = mascaraCpf(cpf.value); });
    var cod = raiz.querySelector('[name="codigo"]');
    if (cod) {
      cod.focus();
      cod.addEventListener('input', function () {
        cod.value = cod.value.replace(/\D/g, '').slice(0, 6);
        if (cod.value.length === 6) cod.form.requestSubmit ? cod.form.requestSubmit() : cod.form.dispatchEvent(new Event('submit', { cancelable: true }));
      });
    }
  }

  function ocupado(form, sim) { Array.prototype.forEach.call(form.querySelectorAll('button'), function (b) { b.disabled = sim; }); }

  function enviar(ev) {
    ev.preventDefault();
    var f = ev.target;
    var tipo = f.getAttribute('data-form');
    var v = function (n) { var el = f.querySelector('[name="' + n + '"]'); return el ? (el.type === 'checkbox' ? el.checked : el.value.trim()) : ''; };
    var pronto = function (p) { ocupado(f, true); return p.catch(function (e) { ocupado(f, false); falhou(e); }); };

    if (tipo === 'senha') {
      if (!L.emailValido(v('email'))) return falhou(new Error('Digite um e-mail válido.'));
      if (!v('senha')) return falhou(new Error('Digite sua senha.'));
      return pronto(L.entrarSenha(v('email').toLowerCase(), v('senha')).then(entrou));
    }
    if (tipo === 'codigo-pedir') {
      var email = v('email').toLowerCase();
      if (!L.emailValido(email)) return falhou(new Error('Digite um e-mail válido.'));
      return pronto(L.enviarCodigo(email).then(function () { codigoPara = email; pintar(); }));
    }
    if (tipo === 'codigo-digitar') {
      if (v('codigo').length !== 6) return falhou(new Error('O código tem 6 números.'));
      return pronto(L.entrarCodigo(codigoPara, v('codigo')).then(entrou));
    }
    if (tipo === 'dados') {
      var faltas = validarDados(f);
      if (faltas.length) {
        var primeiro = f.querySelector('.faltou input, .faltou'); if (primeiro && primeiro.focus) primeiro.focus();
        return;
      }
      return pronto(L.salvarFicha({ nome: v('nome'), sobrenome: v('sobrenome'), cpf: v('cpf').replace(/\D/g, ''),
        telefone: v('telefone').replace(/\D/g, ''),
        consent_personalizar: v('consent_personalizar'), consent_marketing: v('consent_marketing'),
        aceite_politica: v('aceite_politica') }).then(function (j) {
          eu = j; aviso = 'Dados salvos.';
          if (window.aleaRastro && window.aleaRastro.aceitou() !== !!j.consent_personalizar) window.aleaRastro.decidir(!!j.consent_personalizar, 'conta');
          pintar();
        }));
    }
    if (tipo === 'endereco') {
      var d = { cep: v('cep').replace(/\D/g, ''), logradouro: v('logradouro'), numero: v('numero'), complemento: v('complemento'),
                bairro: v('bairro'), cidade: v('cidade'), uf: v('uf').toUpperCase(), apelido: 'casa' };
      if (d.cep.length !== 8 || !d.logradouro || !d.numero || !d.cidade || d.uf.length !== 2) {
        return falhou(new Error('Preencha CEP, rua, número, cidade e UF.'));
      }
      return pronto(L.guardarEndereco(d).then(function (j) { eu = j; pintar(); }));
    }
    if (tipo === 'senha-nova') {
      if (v('senha').length < 8) return falhou(new Error('A senha precisa de pelo menos 8 caracteres.'));
      if (v('senha') !== v('senha2')) return falhou(new Error('As duas senhas não são iguais.'));
      return pronto(L.definirSenha(v('senha')).then(function (j) { eu = j; aviso = 'Senha salva.'; pintar(); }));
    }
  }

  raiz.addEventListener('click', function (e) {
    var t;
    if ((t = e.target.closest('[data-modo]'))) { modoEntrar = t.getAttribute('data-modo'); codigoPara = null; erro = ''; pintar(); return; }
    if (e.target.closest('[data-codigo-voltar]')) { codigoPara = null; modoEntrar = 'codigo'; pintar(); return; }
    if ((t = e.target.closest('[data-olho]'))) {
      var inp = t.parentNode.querySelector('input');
      inp.type = inp.type === 'password' ? 'text' : 'password';
      t.setAttribute('aria-label', inp.type === 'password' ? 'Mostrar senha' : 'Esconder senha');
      return;
    }
    if (e.target.closest('[data-entrar-google]')) { L.entrarGoogle().then(entrou).catch(falhou); return; }
    if (e.target.closest('[data-sair]')) {
      L.sair().then(function (j) {
        eu = j; modoEntrar = 'senha';
        try { localStorage.removeItem('alea_entrou_google_v1'); } catch (x) { /* nada */ }
        if (window.google && google.accounts && google.accounts.id) google.accounts.id.disableAutoSelect();
        history.replaceState(null, '', location.pathname); pintar();
      });
      return;
    }
    if ((t = e.target.closest('[data-tirar-end]'))) { L.tirarEndereco(t.getAttribute('data-tirar-end')).then(function (j) { eu = j; pintar(); }).catch(falhou); return; }
    if ((t = e.target.closest('[data-principal]'))) { L.principalEndereco(t.getAttribute('data-principal')).then(function (j) { eu = j; pintar(); }).catch(falhou); return; }
    if ((t = e.target.closest('[data-tirar-desejo]'))) { L.desejos.alternar(t.getAttribute('data-tirar-desejo')); pintar(); return; }
    if (e.target.closest('[data-baixar]')) {
      L.exportar().then(function (j) {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([JSON.stringify(j, null, 2)], { type: 'application/json' }));
        a.download = 'meus-dados-alea.json'; document.body.appendChild(a); a.click(); a.remove();
      }).catch(falhou);
      return;
    }
    if (e.target.closest('[data-excluir]')) {
      if (!confirm('Excluir sua conta da ālea? Seus dados de cadastro e a memória da sua visita serão apagados. ' +
                   'Pedidos já feitos ficam só pelo tempo que a lei fiscal exige.')) return;
      L.excluir().then(function (j) {
        eu = { logado: false }; erro = (j && j.mensagem) || '';
        if (window.aleaRastro) window.aleaRastro.decidir(false, 'excluiu');
        history.replaceState(null, '', location.pathname); pintar();
      }).catch(falhou);
    }
  });

  window.addEventListener('hashchange', function () { erro = ''; pintar(); window.scrollTo(0, 0); });

  L.eu().then(function (j) { eu = j || { logado: false }; pintar(); })
    .catch(function () { eu = { logado: false }; erro = 'O servidor da conta não respondeu. Tente de novo em instantes.'; pintar(); });
})();
