/* CATALOGO:
   nome: conta
   categoria: UTIL
   objetivo: A CONTA DE VERDADE na gaveta "Conta": entrar com o Google (e Facebook, se a loja ligar), login automático de quem já entrou neste aparelho, a ficha de cadastro (nome, WhatsApp, endereços com CEP que se preenche, pets), os pedidos em qualquer aparelho, "continue de onde parou", e os direitos da LGPD (baixar meus dados, excluir conta).
   entrada: window.ALEA.api_conta; servidor da conta (ZELES/Conta_Cliente/01_app/zeles_conta_v1.py)
   saida: gaveta Conta desenhada; pedido do carrinho registrado no servidor; window.aleaConta
   status: ativo (só carrega com api_conta preenchido — ver site.js, carregarConta)
   validado_em: 2026-09-22 (Playwright contra o servidor local com o provedor de teste)
*/
/* =============================================================================
   conta.js — a gaveta Conta ligada ao servidor
   =============================================================================
   O QUE O LOGIN ENTREGA E O QUE NÃO ENTREGA. O Google dá nome, e-mail e foto. WhatsApp,
   endereço e pet só a pessoa sabe — por isso a ficha existe mesmo com login. O login
   só tira a senha do caminho e faz a ficha seguir a pessoa de aparelho em aparelho.

   COMPRAR SEM CONTA CONTINUA POSSÍVEL. Nada aqui trava o carrinho. No estudo do Baymard
   Institute, 18% de quem abandonou uma compra disse que foi porque "o site quis que eu
   criasse uma conta". A conta é atalho, nunca pedágio.

   O SERVIDOR É QUEM MANDA. Nada do que está aqui decide quem a pessoa é: o botão do
   Google entrega um token assinado, e é o servidor que confere a assinatura.
   ========================================================================== */
(function () {
  'use strict';

  var C = window.ALEA || {};
  if (!C.api_conta) return;
  var API = String(C.api_conta).replace(/\/+$/, '');
  var K_CLIENTE = 'alea_cliente_v1';           // o mesmo que o carrinho.js já usa
  var K_ENTROU_GOOGLE = 'alea_entrou_google_v1'; // liga o login automático NESTE aparelho

  var cfg = null;       // /api/config
  var eu = null;        // /api/eu
  var lembranca = null; // /api/lembranca
  var erro = '';

  function ler(k) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function gravar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* aba anônima */ } }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function api(metodo, caminho, corpo) {
    return fetch(API + caminho, {
      method: metodo,
      credentials: 'include',
      headers: corpo !== undefined ? { 'Content-Type': 'application/json', 'X-Alea': '1' } : { 'X-Alea': '1' },
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) {
          var d = j && j.detail;
          var msg = Array.isArray(d) ? d.map(function (x) { return (x.msg || '').replace(/^Value error, /, ''); }).join(' · ')
                                     : (d || 'não deu certo agora, tente de novo');
          throw new Error(msg);
        }
        return j;
      });
    });
  }

  function carregarScript(src) {
    return new Promise(function (ok, falhou) {
      if (document.querySelector('script[src="' + src + '"]')) return ok();
      var s = document.createElement('script');
      s.src = src; s.async = true; s.onload = ok; s.onerror = falhou;
      document.head.appendChild(s);
    });
  }

  /* ----------------------------------------------------------------- estado */
  function aoEntrar(j) {
    eu = j;
    erro = '';
    /* o carrinho.js escreve "Meu nome: …" no pedido do WhatsApp a partir do aparelho;
       com a conta, é a ficha que preenche isso */
    var principal = (j.enderecos || [])[0];
    var local = ler(K_CLIENTE) || {};
    if (j.nome) local.nome = j.nome;
    if (principal) local.cidade = principal.cidade + '-' + principal.uf;
    gravar(K_CLIENTE, local);

    /* o aceite de "lembrar a visita": se a pessoa já decidiu na ficha, a ficha manda;
       se ainda não decidiu mas disse "pode" no aviso deste aparelho, isso vai pra ficha */
    var r = window.aleaRastro;
    if (r) {
      if (j.consent_personalizar_decidido) {
        if (r.aceitou() !== j.consent_personalizar) r.decidir(j.consent_personalizar, 'conta');
      } else if (r.aceitou()) {
        /* a ficha JA NASCE com o "pode" do aparelho marcado. Antes, ela era desenhada
           antes de o servidor responder, com a caixa desmarcada — e o "Salvar" seguinte
           desligava a memória sem a pessoa pedir (pego no e2e de 22/09/2026). */
        j.consent_personalizar = true;
        api('PUT', '/api/eu', { consent_personalizar: true })
          .then(function (k) { eu = k; repintar(); }).catch(function () {});
      }
    }
    buscarLembranca();
    repintar();
  }

  function entrar(provedor, credencial) {
    var r = window.aleaRastro;
    return api('POST', '/api/entrar', { provedor: provedor, credencial: credencial, visitante: r ? r.visitante() : null })
      .then(function (j) {
        if (provedor === 'google') gravar(K_ENTROU_GOOGLE, true);
        aoEntrar(j);
      })
      .catch(function (e) { erro = e.message; repintar(); });
  }

  function buscarLembranca() {
    var r = window.aleaRastro;
    var v = r && r.aceitou() ? r.visitante() : null;
    if (!(eu && eu.logado) && !v) { lembranca = null; return; }
    api('GET', '/api/lembranca' + (v ? '?v=' + encodeURIComponent(v) : ''))
      .then(function (j) { lembranca = j; repintar(); document.dispatchEvent(new CustomEvent('alea:lembranca', { detail: j })); })
      .catch(function () {});
  }

  /* ------------------------------------------------------------- Google */
  function prepararGoogle() {
    if (!cfg || !cfg.google_client_id) return Promise.resolve(false);
    return carregarScript('https://accounts.google.com/gsi/client').then(function () {
      if (!window.google || !google.accounts || !google.accounts.id) return false;
      if (!prepararGoogle.feito) {
        google.accounts.id.initialize({
          client_id: cfg.google_client_id,
          callback: function (resp) { entrar('google', resp.credential); },
          auto_select: !!C.login_automatico,
          cancel_on_tap_outside: true,
          itp_support: true,
          use_fedcm_for_prompt: true
        });
        prepararGoogle.feito = true;
      }
      return true;
    }).catch(function () { return false; });
  }

  function loginAutomatico() {
    /* só pra quem JÁ entrou com o Google neste aparelho: é a volta sem clique. Visitante
       novo não vê janela nenhuma aparecendo sozinha. */
    if (!C.login_automatico || !ler(K_ENTROU_GOOGLE)) return;
    prepararGoogle().then(function (ok) { if (ok) google.accounts.id.prompt(); });
  }

  /* ----------------------------------------------------------- Facebook */
  /* O SDK do Facebook carrega QUANDO O BOTÃO APARECE, e não no clique: a janela do login
     só abre se o FB.login rodar no mesmo toque do dedo. Carregar no clique faz o
     navegador tratar a janela como pop-up e bloquear. */
  function prepararFacebook() {
    if (!cfg || !cfg.facebook_app_id || prepararFacebook.feito) return;
    carregarScript('https://connect.facebook.net/pt_BR/sdk.js').then(function () {
      FB.init({ appId: cfg.facebook_app_id, version: 'v21.0', cookie: false, xfbml: false });
      prepararFacebook.feito = true;
    }).catch(function () { /* sem Facebook: o botão avisa no clique */ });
  }
  function entrarFacebook() {
    if (!prepararFacebook.feito || !window.FB) {
      erro = 'o Facebook ainda está abrindo; toque de novo em instantes';
      prepararFacebook(); repintar(); return;
    }
    FB.login(function (resp) {
      if (resp && resp.authResponse) entrar('facebook', resp.authResponse.accessToken);
    }, { scope: 'public_profile,email' });
  }

  /* ============================================================ a gaveta */
  function gavetaAberta() {
    var g = document.getElementById('gaveta-conta');
    return g && g.classList.contains('aberta') ? g : null;
  }
  function repintar() { var g = gavetaAberta(); if (g) pintar(g); }

  function blocoLembranca() {
    var ps = (lembranca && lembranca.produtos) || [];
    if (!ps.length) return '';
    var vitrine = window.VITRINE || [];
    var cartoes = ps.slice(0, 3).map(function (p) {
      var v = null;
      for (var i = 0; i < vitrine.length; i++) if (vitrine[i].pagina === p.slug) { v = vitrine[i]; break; }
      if (!v) return '';
      var foto = v.recorte ? 'img/produtos/' + v.fotos[0] + '_obj_m.webp' : 'img/produtos/' + v.fotos[0] + '_m.jpg';
      return '<a class="conta-lembra" href="produto-' + esc(p.slug) + '.html">' +
        '<img src="' + foto + '" alt="" decoding="async" onerror="this.onerror=null;this.src=&quot;img/produtos/' +
        esc(v.fotos[0]) + '_m.jpg&quot;"><span>' + esc(v.produto) + '</span>' +
        (p.ja_comprou ? '<small>você já tem</small>' : '') + '</a>';
    }).join('');
    return cartoes ? '<h3 class="conta-h3">Continue de onde parou</h3><div class="conta-lembrancas">' + cartoes + '</div>' : '';
  }

  function blocoEntrar() {
    return '<div class="conta-entrar">' +
      '<p><strong>Entre pra guardar seus dados.</strong> Endereço, pets e pedidos em qualquer aparelho — sem criar senha.</p>' +
      (cfg && cfg.google_client_id ? '<div class="conta-google" data-google-botao></div>' : '') +
      (cfg && cfg.facebook_app_id ? '<button type="button" class="botao contorno conta-fb" data-entrar-fb>Continuar com o Facebook</button>' : '') +
      (cfg && cfg.teste ? '<button type="button" class="botao contorno" data-entrar-teste>Entrar (modo teste)</button>' : '') +
      (erro ? '<p class="conta-erro" role="alert">' + esc(erro) + '</p>' : '') +
      '<p class="conta-miudo">Ao entrar você concorda com a <a href="privacidade.html">política de privacidade</a>. ' +
      'Comprar sem conta continua possível.</p></div>';
  }

  /* 5564999991234 -> (64) 99999-1234: o número volta pra tela do jeito que a pessoa escreve */
  function zapBonito(z) {
    var d = String(z || '').replace(/^55/, '');
    if (d.length === 11) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
    if (d.length === 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return d;
  }
  function opcoes(lista, atual) {
    return lista.map(function (o) {
      return '<option value="' + o[0] + '"' + (o[0] === atual ? ' selected' : '') + '>' + o[1] + '</option>';
    }).join('');
  }

  function secoesFicha() {
    var e = eu;
    var nomeProv = { google: 'Google', facebook: 'Facebook', teste: 'teste' };
    var provs = (e.provedores || []).map(function (p) { return nomeProv[p] || p; }).join(' e ');
    var ends = (e.enderecos || []).map(function (x) {
      return '<li><div><strong>' + esc(x.apelido) + (x.principal ? ' <small>principal</small>' : '') + '</strong>' +
        esc(x.logradouro) + ', ' + esc(x.numero) + (x.complemento ? ' — ' + esc(x.complemento) : '') + '<br>' +
        (x.bairro ? esc(x.bairro) + ' · ' : '') + esc(x.cidade) + '-' + esc(x.uf) + ' · CEP ' +
        esc(x.cep.slice(0, 5) + '-' + x.cep.slice(5)) + '</div>' +
        '<button type="button" class="tirar" data-tirar-endereco="' + x.id + '">tirar</button></li>';
    }).join('');
    var pets = (e.pets || []).map(function (p) {
      return '<li><div><strong>' + esc(p.nome) + '</strong>' +
        [p.especie === 'cao' ? 'cão' : p.especie, p.porte, p.raca].filter(Boolean).map(esc).join(' · ') + '</div>' +
        '<button type="button" class="tirar" data-tirar-pet="' + p.id + '">tirar</button></li>';
    }).join('');
    var pedidos = (e.pedidos || []).map(function (p) {
      var d = new Date(p.criado_em);
      var quando = ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
      return '<li><div><strong>' + esc(p.numero) + '</strong>' + quando + ' · ' + p.itens.length +
        (p.itens.length === 1 ? ' peça' : ' peças') + (p.total_pecas ? ' · ' + window.aleaDinheiro(p.total_pecas) : '') +
        '<br>' + p.itens.map(function (i) { return esc(i.nome); }).join(', ') + '</div></li>';
    }).join('');

    return [['topo', '<div class="conta-topo">' +
        (e.foto_url ? '<img src="' + esc(e.foto_url) + '" alt="" referrerpolicy="no-referrer">' : '<span class="conta-inicial">' + esc((e.nome || '?').charAt(0)) + '</span>') +
        '<div><strong>' + esc(e.nome || 'Sua conta') + '</strong><small>' + esc(e.email || '') +
        (provs ? ' · entrou com ' + esc(provs) : '') + '</small></div></div>' +
      (erro ? '<p class="conta-erro" role="alert">' + esc(erro) + '</p>' : '') +
      (e.ficha_completa ? '' : '<p class="conta-aviso">Complete nome, WhatsApp e um endereço pra fechar o próximo pedido sem digitar nada.</p>') +

      ''], ['ficha', '<form class="personalizar" data-ficha novalidate>' +
        '<label>Seu nome<input name="nome" autocomplete="name" maxlength="120" value="' + esc(e.nome || '') + '"></label>' +
        '<label>WhatsApp<input name="whatsapp" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="(64) 99999-9999" value="' +
          esc(zapBonito(e.whatsapp)) + '"></label>' +
        (e.email_verificado ? '' : '<label>E-mail<input name="email" type="email" autocomplete="email" value="' + esc(e.email || '') + '"></label>') +
        '<label><span>Seu aniversário <small>(opcional)</small></span><input name="nascimento" type="date" value="' + esc(e.nascimento || '') + '"></label>' +
        '<label class="conta-marca"><input type="checkbox" name="consent_personalizar"' + (e.consent_personalizar ? ' checked' : '') + '>' +
          '<span>Lembrar as peças que eu vi, pra me mostrar de novo quando eu voltar</span></label>' +
        '<label class="conta-marca"><input type="checkbox" name="consent_marketing"' + (e.consent_marketing ? ' checked' : '') + '>' +
          '<span>Quero receber novidades e ofertas da ālea</span></label>' +
        (cfg && cfg.politica_versao && !e.politica_em_dia
          ? '<label class="conta-marca"><input type="checkbox" name="aceite_politica"><span>Li e aceito a ' +
            '<a href="privacidade.html" target="_blank" rel="noopener">política de privacidade</a></span></label>' : '') +
        '<button class="botao" type="submit">Salvar</button>' +
      '</form>' +

      ''], ['enderecos', '<h3 class="conta-h3">Endereços de entrega</h3>' +
      (ends ? '<ul class="conta-lista">' + ends + '</ul>' : '<p class="vazio">Nenhum endereço ainda.</p>') +
      '<details class="conta-mais"' + (ends ? '' : ' open') + '><summary>Adicionar endereço</summary>' +
      '<form class="personalizar" data-endereco novalidate>' +
        '<label>CEP<input name="cep" inputmode="numeric" autocomplete="postal-code" maxlength="9" placeholder="75800-000" required></label>' +
        '<label>Rua<input name="logradouro" autocomplete="address-line1" required></label>' +
        '<div class="conta-dupla"><label>Número<input name="numero" required></label>' +
        '<label>Complemento<input name="complemento" autocomplete="address-line2"></label></div>' +
        '<label>Bairro<input name="bairro"></label>' +
        '<div class="conta-dupla"><label>Cidade<input name="cidade" autocomplete="address-level2" required></label>' +
        '<label>UF<input name="uf" maxlength="2" autocomplete="address-level1" required></label></div>' +
        '<label>Apelido<input name="apelido" value="casa" maxlength="30"></label>' +
        '<button class="botao contorno" type="submit">Guardar endereço</button>' +
      '</form></details>' +

      ''], ['pets', '<h3 class="conta-h3">Seus pets</h3>' +
      (pets ? '<ul class="conta-lista">' + pets + '</ul>' : '<p class="vazio">Conta pra gente quem vai usar a peça.</p>') +
      '<details class="conta-mais"' + (pets ? '' : ' open') + '><summary>Adicionar pet</summary>' +
      '<form class="personalizar" data-pet novalidate>' +
        '<label>Nome do pet<input name="nome" maxlength="40" required></label>' +
        '<div class="conta-dupla"><label>É um<select name="especie">' +
          opcoes([['', '—'], ['cao', 'cão'], ['gato', 'gato'], ['outro', 'outro']], '') + '</select></label>' +
        '<label>Porte<select name="porte">' +
          opcoes([['', '—'], ['mini', 'mini'], ['pequeno', 'pequeno'], ['medio', 'médio'], ['grande', 'grande'], ['gigante', 'gigante']], '') +
        '</select></label></div>' +
        '<label><span>Raça <small>(opcional)</small></span><input name="raca" maxlength="60"></label>' +
        '<button class="botao contorno" type="submit">Guardar pet</button>' +
      '</form></details>' +

      ''], ['lembranca', blocoLembranca() +

      ''], ['pedidos', '<h3 class="conta-h3">Seus pedidos</h3>' +
      (pedidos ? '<ul class="conta-lista">' + pedidos + '</ul>' : '<p class="vazio">Nenhum pedido pela sua conta ainda.</p>') +

      ''], ['rodape', '<div class="conta-rodape">' +
        '<button type="button" class="conta-link" data-conta-baixar>Baixar meus dados</button>' +
        '<button type="button" class="conta-link" data-conta-sair>Sair</button>' +
        '<button type="button" class="conta-link perigo" data-conta-excluir>Excluir minha conta</button>' +
      '</div>']];
  }

  function pintar(g) {
    var corpo = g.querySelector('[data-corpo]');
    if (!corpo || !eu) return;      // servidor fora do ar ou ainda respondendo: fica a gaveta do aparelho
    if (eu.logado) { pintarFicha(corpo); return; }
    /* sem conta: a gaveta do aparelho (a do carrinho.js) continua, e a entrada vai por cima.
       Se a ficha estava na tela (acabou de sair), o carrinho.js repinta a gaveta do aparelho
       primeiro — e este mesmo ouvinte volta aqui com a gaveta limpa. */
    if (corpo.querySelector('[data-secao]')) {
      document.dispatchEvent(new CustomEvent('alea:gaveta', { detail: { id: 'conta' } }));
      return;
    }
    if (!corpo.querySelector('.conta-entrar')) {
      var ultimo = corpo.lastElementChild;
      if (ultimo && /Login com senha/.test(ultimo.textContent)) ultimo.remove();   // o aviso de "entra depois" venceu
      corpo.insertAdjacentHTML('afterbegin', blocoEntrar());
      var lem = blocoLembranca();
      if (lem) corpo.querySelector('.conta-entrar').insertAdjacentHTML('afterend', lem);
    } else {
      corpo.querySelector('.conta-entrar').outerHTML = blocoEntrar();
    }
    if (corpo.querySelector('[data-entrar-fb]')) prepararFacebook();
    var alvo = corpo.querySelector('[data-google-botao]');
    if (alvo) {
      prepararGoogle().then(function (ok) {
        if (!ok || !alvo.isConnected) return;
        google.accounts.id.renderButton(alvo, { theme: 'outline', size: 'large', shape: 'pill',
          text: 'continue_with', locale: 'pt-BR', width: Math.min(360, alvo.clientWidth || 300) });
      });
    }
  }

  function dados(form) {
    var o = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      o[el.name] = el.type === 'checkbox' ? el.checked : el.value.trim();
    });
    return o;
  }

  function ocupado(form, sim) {
    Array.prototype.forEach.call(form.querySelectorAll('button'), function (b) { b.disabled = sim; });
  }

  /* A FICHA É DESENHADA EM SEÇÕES, e cada uma só é trocada quando o conteúdo dela mudou.
     E NUNCA enquanto a pessoa digita: formulário com algo digitado e não salvo fica como
     está. Sem isso, a lembrança ou a resposta do servidor que chega no meio da digitação
     redesenhava a gaveta e apagava o que ela estava escrevendo. */
  function pintarFicha(corpo) {
    var secs = secoesFicha();
    if (!corpo.querySelector('[data-secao]')) {
      corpo.innerHTML = secs.map(function (s) { return '<div data-secao="' + s[0] + '"></div>'; }).join('');
    }
    secs.forEach(function (s) {
      var el = corpo.querySelector('[data-secao="' + s[0] + '"]');
      if (!el || el._html === s[1]) return;
      if (el.querySelector('form[data-sujo]')) return;
      el.innerHTML = s[1];
      el._html = s[1];
      ligarSecao(el);
    });
  }

  function ligarSecao(el) {
    Array.prototype.forEach.call(el.querySelectorAll('form'), function (form) {
      form.addEventListener('input', function () { form.setAttribute('data-sujo', '1'); });
    });
    var ficha = el.querySelector('[data-ficha]');
    if (ficha) ligarFicha(ficha);
    var fe = el.querySelector('[data-endereco]');
    if (fe) ligarEndereco(fe);
    var fp = el.querySelector('[data-pet]');
    if (fp) ligarPet(fp);
  }

  function ligarFicha(ficha) {
    ficha.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var d = dados(ficha);
      var envio = { nome: d.nome, whatsapp: d.whatsapp, nascimento: d.nascimento,
                    consent_personalizar: d.consent_personalizar, consent_marketing: d.consent_marketing };
      if ('email' in d) envio.email = d.email;
      if (d.aceite_politica) envio.aceite_politica = true;
      ocupado(ficha, true);
      api('PUT', '/api/eu', envio).then(function (j) {
        ficha.removeAttribute('data-sujo');
        aoEntrar(j);          // e o aoEntrar alinha o aviso do aparelho com o que a ficha decidiu
        var ok = gavetaAberta() && gavetaAberta().querySelector('[data-ficha] .botao');
        if (ok) { ok.textContent = 'Salvo ✓'; setTimeout(function () { ok.textContent = 'Salvar'; }, 1800); }
      }).catch(function (e) { erro = e.message; ocupado(ficha, false); repintar(); });
    });

  }

  function ligarEndereco(fe) {
    var cep = fe.querySelector('[name="cep"]');
    cep.addEventListener('input', function () {
      var d = cep.value.replace(/\D/g, '');
      if (d.length !== 8 || cep.dataset.buscado === d) return;
      cep.dataset.buscado = d;
      api('GET', '/api/cep/' + d).then(function (j) {
        ['logradouro', 'bairro', 'cidade', 'uf'].forEach(function (k) {
          var el = fe.querySelector('[name="' + k + '"]');
          if (el && j[k] && !el.value) el.value = j[k];
        });
        var n = fe.querySelector('[name="numero"]');
        if (n) n.focus();
      }).catch(function () { /* CEP não achado: a pessoa preenche */ });
    });
    fe.addEventListener('submit', function (ev) {
      ev.preventDefault();
      ocupado(fe, true);
      api('POST', '/api/eu/endereco', dados(fe)).then(function (j) { fe.removeAttribute('data-sujo'); aoEntrar(j); })
        .catch(function (e) { erro = e.message; ocupado(fe, false); repintar(); });
    });

  }

  function ligarPet(fp) {
    fp.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var d = dados(fp);
      if (!d.especie) delete d.especie;
      if (!d.porte) delete d.porte;
      ocupado(fp, true);
      api('POST', '/api/eu/pet', d).then(function (j) { fp.removeAttribute('data-sujo'); aoEntrar(j); })
        .catch(function (e) { erro = e.message; ocupado(fp, false); repintar(); });
    });
  }

  /* ------------------------------------------------------------ cliques */
  document.addEventListener('click', function (e) {
    if (!e.target.closest('#gaveta-conta')) return;
    var t;
    if (e.target.closest('[data-entrar-fb]')) { entrarFacebook(); return; }
    if (e.target.closest('[data-entrar-teste]')) {
      var email = prompt('Modo teste — e-mail:', 'teste@exemplo.com');
      if (email) entrar('teste', 'teste:' + email + ':Pessoa Teste:' + email);
      return;
    }
    if ((t = e.target.closest('[data-tirar-endereco]'))) {
      api('POST', '/api/eu/endereco/' + t.getAttribute('data-tirar-endereco') + '/remover').then(aoEntrar)
        .catch(function (x) { erro = x.message; repintar(); });
      return;
    }
    if ((t = e.target.closest('[data-tirar-pet]'))) {
      api('POST', '/api/eu/pet/' + t.getAttribute('data-tirar-pet') + '/remover').then(aoEntrar)
        .catch(function (x) { erro = x.message; repintar(); });
      return;
    }
    if (e.target.closest('[data-conta-sair]')) {
      api('POST', '/api/sair').finally(function () {
        eu = { logado: false }; lembranca = null;
        try { localStorage.removeItem(K_ENTROU_GOOGLE); } catch (x) { /* nada */ }
        if (window.google && google.accounts && google.accounts.id) google.accounts.id.disableAutoSelect();
        buscarLembranca();
        repintar();
      });
      return;
    }
    if (e.target.closest('[data-conta-baixar]')) {
      api('GET', '/api/eu/exportar').then(function (j) {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([JSON.stringify(j, null, 2)], { type: 'application/json' }));
        a.download = 'meus-dados-alea.json';
        document.body.appendChild(a); a.click(); a.remove();
      }).catch(function (x) { erro = x.message; repintar(); });
      return;
    }
    if (e.target.closest('[data-conta-excluir]')) {
      if (!confirm('Excluir sua conta da ālea? Seus dados de cadastro e a memória da sua visita serão apagados. ' +
                   'Pedidos já feitos ficam só pelo tempo que a lei fiscal exige.')) return;
      api('POST', '/api/eu/excluir').then(function (j) {
        eu = { logado: false }; erro = j.mensagem || '';
        try { localStorage.removeItem(K_ENTROU_GOOGLE); } catch (x) { /* nada */ }
        if (window.aleaRastro) window.aleaRastro.decidir(false, 'excluiu');
        repintar();
      }).catch(function (x) { erro = x.message; repintar(); });
    }
  });

  /* ------------------------------------------------ o pedido que vai pro WhatsApp
     O carrinho.js abre o WhatsApp e limpa o carrinho. Aqui se copia o carrinho ANTES
     (fase de captura, que roda antes do ouvinte dele) e se registra no servidor com
     keepalive — a página pode estar indo pro WhatsApp nessa hora. */
  function registrarPedido() {
    var car = window.aleaCarrinho;
    if (!car || !car.quantos() || !window.aleaTemZap) return;
    var r = window.aleaRastro;
    var corpo = { itens: car.itens(), total: car.total(), visitante: r ? r.visitante() : null, consent: !!(r && r.aceitou()) };
    if (r) r.evento('pedido', null, { valor: car.total() });
    if (r) r.enviarAgora();
    try {
      fetch(API + '/api/pedido', { method: 'POST', credentials: 'include', keepalive: true,
        headers: { 'Content-Type': 'application/json', 'X-Alea': '1' }, body: JSON.stringify(corpo) })
        .then(function (x) { return x.json(); })
        .then(function () { if (eu && eu.logado) api('GET', '/api/eu').then(function (j) { if (j.logado) eu = j; }).catch(function () {}); })
        .catch(function () {});
    } catch (x) { /* o pedido do WhatsApp continua; só não fica no histórico */ }
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-fechar-pedido]')) registrarPedido();
  }, true);
  if (window.aleaCarrinho && window.aleaCarrinho.fecharPedido) {
    var fecharOriginal = window.aleaCarrinho.fecharPedido;
    window.aleaCarrinho.fecharPedido = function () { registrarPedido(); return fecharOriginal.apply(this, arguments); };
  }

  /* -------------------------------------------------------------- início */
  document.addEventListener('alea:gaveta', function (e) {
    if (e.detail.id !== 'conta') return;
    /* o carrinho.js pintou a gaveta do aparelho neste mesmo evento; esta pintura vem depois */
    var g = document.getElementById('gaveta-conta');
    if (g) pintar(g);
  });
  document.addEventListener('alea:memoria', function (e) {
    if (eu && eu.logado) {
      if (eu.consent_personalizar !== e.detail.personalizar) {
        api('PUT', '/api/eu', { consent_personalizar: e.detail.personalizar }).then(function (j) { eu = j; }).catch(function () {});
      }
    }
    buscarLembranca();
  });

  window.aleaConta = {
    eu: function () { return eu; },
    lembranca: function () { return lembranca; },
    entrar: entrar
  };

  Promise.all([api('GET', '/api/config'), api('GET', '/api/eu')]).then(function (res) {
    cfg = res[0];
    if (res[1] && res[1].logado) aoEntrar(res[1]);
    else { eu = { logado: false }; buscarLembranca(); loginAutomatico(); repintar(); }
  }).catch(function () {
    /* servidor fora do ar: a gaveta continua sendo a do aparelho, e o carrinho segue
       fechando pelo WhatsApp. É o modo degradado de propósito (parecer de 16/09/2026). */
    cfg = null; eu = null;
  });
})();
