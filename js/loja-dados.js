/* CATALOGO:
   nome: loja-dados
   categoria: UTIL
   objetivo: A camada de DADOS da conta e da compra (quem está logado, ficha, endereços, pedidos, lista de desejos, código por e-mail, senha). Tem dois motores com a mesma cara: PRÉVIA (tudo no aparelho, para o Cassiano testar as telas) e SERVIDOR (a conta da ZELES, em api_conta).
   entrada: window.ALEA (api_conta, conta_previa); localStorage; servidor da conta
   saida: window.aleaLoja
   status: prévia (23/09/2026) — o motor SERVIDOR chama as rotas PROPOSTAS abaixo; o contrato final é da casa
   validado_em: 2026-09-23 (Playwright, motor prévia)
*/
/* =============================================================================
   loja-dados.js — de onde vêm e pra onde vão os dados da conta e da compra
   =============================================================================
   POR QUE DOIS MOTORES. As telas iguais às da Tiffany (pedido do Cassiano, 23/09/2026) precisam
   de coisas que o servidor da conta ainda NÃO faz: mandar o código por e-mail, entrar com senha,
   guardar sobrenome e CPF. Quem faz o servidor é a casa (ZELES/Conta_Cliente), e o Lázaro decide
   antes (e-mail pode custar; CPF é dado pessoal a mais). Pra ele poder VER e mexer nas telas hoje,
   a PRÉVIA roda num motor que guarda tudo no próprio aparelho — nada sai dele — e mostra na tela
   qual é o código ("na prévia o código é 123456").

   QUEM DECIDE O MOTOR: a prévia (lzleles.github.io), o arquivo aberto no computador e o
   `conta_previa: true` do config.js usam o motor PRÉVIA. O site do ar usa o SERVIDOR.

   ROTAS QUE O MOTOR SERVIDOR CHAMA (proposta mandada à casa em 23/09/2026 — ajustar quando o
   contrato sair; as que já existem estão marcadas com *):
     GET  /api/eu *                     quem está logado e a ficha
     PUT  /api/eu *                     salva a ficha
     POST /api/codigo                   { email }            -> manda o código de 6 dígitos
     POST /api/entrar *                 { provedor: 'codigo', email, codigo } | { provedor: 'senha', email, senha }
     PUT  /api/eu/senha                 { senha }            -> cria ou troca a senha
     POST /api/eu/endereco *  · POST /api/eu/endereco/<id>/remover *
     POST /api/pedido *                 o pedido fechado no Finalizar Compra
     POST /api/sair *
   ========================================================================== */
(function () {
  'use strict';

  var C = window.ALEA || {};
  var host = location.hostname;
  var PREVIA = C.conta_previa === true || !C.api_conta || /github\.io$/.test(host) ||
               host === '' || host === 'localhost' || host === '127.0.0.1';
  var API = String(C.api_conta || '').replace(/\/+$/, '');
  var CODIGO_PREVIA = '123456';

  function ler(k, padrao) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : padrao; } catch (e) { return padrao; } }
  function gravar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function tirar(k) { try { localStorage.removeItem(k); } catch (e) { /* nada */ } }
  function copia(o) { return JSON.parse(JSON.stringify(o)); }
  function emailValido(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || '').trim()); }

  /* ------------------------------------------------------------ motor PRÉVIA
     Uma "conta" por e-mail, guardada no aparelho. A senha NÃO é guardada em texto: guarda-se um
     resumo (SHA-256) — é prévia, mas nem aqui senha fica legível. */
  var K_CONTAS = 'alea_previa_contas_v1';
  var K_SESSAO = 'alea_previa_sessao_v1';
  var K_CODIGO = 'alea_previa_codigo_v1';

  function contas() { return ler(K_CONTAS, {}) || {}; }
  function salvarContas(c) { gravar(K_CONTAS, c); }
  function contaVazia(email) {
    return { email: email, nome: '', sobrenome: '', cpf: '', telefone: '', nascimento: '',
             consent_marketing: false, consent_personalizar: false, politica_aceita: false,
             enderecos: [], pedidos: [], senha: null, provedores: [] };
  }
  function resumoSenha(s) {
    if (!window.crypto || !crypto.subtle) return Promise.resolve('x' + String(s).length + btoa(unescape(encodeURIComponent(s))));
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode('alea-previa:' + s)).then(function (b) {
      return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    });
  }
  function euPrevia() {
    var email = ler(K_SESSAO, null);
    var c = email && contas()[email];
    if (!c) return { logado: false };
    var e = copia(c);
    e.logado = true;
    e.tem_senha = !!c.senha;
    delete e.senha;
    return e;
  }
  function entrarPrevia(email, provedor) {
    var cs = contas();
    if (!cs[email]) cs[email] = contaVazia(email);
    if (cs[email].provedores.indexOf(provedor) < 0) cs[email].provedores.push(provedor);
    salvarContas(cs);
    gravar(K_SESSAO, email);
    return euPrevia();
  }
  function mexer(fn) {
    var email = ler(K_SESSAO, null);
    var cs = contas();
    if (!email || !cs[email]) return Promise.reject(new Error('Sua sessão terminou. Entre de novo.'));
    fn(cs[email]);
    salvarContas(cs);
    return Promise.resolve(euPrevia());
  }

  var previa = {
    eu: function () { return Promise.resolve(euPrevia()); },
    enviarCodigo: function (email) {
      gravar(K_CODIGO, { email: email, codigo: CODIGO_PREVIA, ate: Date.now() + 10 * 60 * 1000 });
      return Promise.resolve({ ok: true, previa_codigo: CODIGO_PREVIA });
    },
    entrarCodigo: function (email, codigo) {
      var c = ler(K_CODIGO, null);
      if (!c || c.email !== email || Date.now() > c.ate) return Promise.reject(new Error('O código expirou. Peça um novo.'));
      if (String(codigo).replace(/\D/g, '') !== c.codigo) return Promise.reject(new Error('Código incorreto. Confira o e-mail e tente de novo.'));
      tirar(K_CODIGO);
      return Promise.resolve(entrarPrevia(email, 'codigo'));
    },
    entrarSenha: function (email, senha) {
      var c = contas()[email];
      if (!c || !c.senha) return Promise.reject(new Error('E-mail ou senha incorretos.'));
      return resumoSenha(senha).then(function (r) {
        if (r !== c.senha) throw new Error('E-mail ou senha incorretos.');
        return entrarPrevia(email, 'senha');
      });
    },
    entrarGoogle: function () {
      /* na prévia não existe o Google de verdade (o botão oficial só funciona no endereço
         cadastrado no Google). Entra-se como uma pessoa de teste, pra ver o caminho inteiro. */
      entrarPrevia('cliente.teste@gmail.com', 'google');
      return mexer(function (c) { if (!c.nome) { c.nome = 'Cliente'; c.sobrenome = 'Teste'; } });
    },
    salvarFicha: function (d) {
      return mexer(function (c) {
        ['nome', 'sobrenome', 'cpf', 'telefone', 'nascimento'].forEach(function (k) { if (k in d) c[k] = d[k]; });
        if ('consent_marketing' in d) c.consent_marketing = !!d.consent_marketing;
        if ('consent_personalizar' in d) c.consent_personalizar = !!d.consent_personalizar;
        if (d.aceite_politica) c.politica_aceita = true;
      });
    },
    definirSenha: function (senha) {
      return resumoSenha(senha).then(function (r) { return mexer(function (c) { c.senha = r; }); });
    },
    guardarEndereco: function (e) {
      return mexer(function (c) {
        e.id = 'e' + Date.now().toString(36);
        if (!c.enderecos.length) e.principal = true;
        c.enderecos.push(e);
      });
    },
    tirarEndereco: function (id) {
      return mexer(function (c) {
        c.enderecos = c.enderecos.filter(function (x) { return x.id !== id; });
        if (c.enderecos.length && !c.enderecos.some(function (x) { return x.principal; })) c.enderecos[0].principal = true;
      });
    },
    principalEndereco: function (id) {
      return mexer(function (c) { c.enderecos.forEach(function (x) { x.principal = x.id === id; }); });
    },
    registrarPedido: function (p) {
      var numero = 'AL' + String(Date.now()).slice(-6);
      p.numero = numero;
      p.criado_em = new Date().toISOString();
      var email = ler(K_SESSAO, null);
      if (email) mexer(function (c) { c.pedidos.unshift(p); });
      return Promise.resolve({ numero: numero, previa: true });
    },
    sair: function () { tirar(K_SESSAO); return Promise.resolve({ logado: false }); },
    exportar: function () { return Promise.resolve(euPrevia()); },
    excluir: function () {
      var email = ler(K_SESSAO, null); var cs = contas();
      delete cs[email]; salvarContas(cs); tirar(K_SESSAO);
      return Promise.resolve({ logado: false, mensagem: 'Conta de prévia excluída deste aparelho.' });
    }
  };

  /* --------------------------------------------------------- motor SERVIDOR */
  function api(metodo, caminho, corpo) {
    return fetch(API + caminho, {
      method: metodo, credentials: 'include',
      headers: corpo !== undefined ? { 'Content-Type': 'application/json', 'X-Alea': '1' } : { 'X-Alea': '1' },
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) {
          var d = j && j.detail;
          throw new Error(Array.isArray(d) ? d.map(function (x) { return (x.msg || '').replace(/^Value error, /, ''); }).join(' · ')
                                           : (d || (r.status === 404 ? 'Isso ainda não está ligado no servidor.' : 'Não deu certo agora. Tente de novo.')));
        }
        return j;
      });
    });
  }
  /* o servidor de hoje guarda "nome" inteiro e "whatsapp"; a tela da Tiffany separa primeiro e último
     nome e chama de telefone. A tradução mora aqui, num lugar só. */
  function daFicha(j) {
    if (!j || !j.logado) return j || { logado: false };
    if (!('sobrenome' in j) && j.nome) {
      var partes = String(j.nome).trim().split(/\s+/);
      j.nome = partes.shift() || '';
      j.sobrenome = partes.join(' ');
    }
    if (!j.telefone && j.whatsapp) j.telefone = String(j.whatsapp).replace(/^55/, '');
    j.politica_aceita = j.politica_em_dia !== false;
    return j;
  }
  var servidor = {
    eu: function () { return api('GET', '/api/eu').then(daFicha); },
    enviarCodigo: function (email) { return api('POST', '/api/codigo', { email: email }); },
    entrarCodigo: function (email, codigo) { return api('POST', '/api/entrar', { provedor: 'codigo', email: email, codigo: codigo }).then(daFicha); },
    entrarSenha: function (email, senha) { return api('POST', '/api/entrar', { provedor: 'senha', email: email, senha: senha }).then(daFicha); },
    entrarGoogle: function (credencial) { return api('POST', '/api/entrar', { provedor: 'google', credencial: credencial }).then(daFicha); },
    salvarFicha: function (d) {
      var envio = { nome: [d.nome, d.sobrenome].filter(Boolean).join(' '), sobrenome: d.sobrenome, cpf: d.cpf,
                    whatsapp: d.telefone, nascimento: d.nascimento,
                    consent_marketing: !!d.consent_marketing, consent_personalizar: !!d.consent_personalizar };
      if (d.aceite_politica) envio.aceite_politica = true;
      return api('PUT', '/api/eu', envio).then(daFicha);
    },
    definirSenha: function (senha) { return api('PUT', '/api/eu/senha', { senha: senha }).then(daFicha); },
    guardarEndereco: function (e) { return api('POST', '/api/eu/endereco', e).then(daFicha); },
    tirarEndereco: function (id) { return api('POST', '/api/eu/endereco/' + encodeURIComponent(id) + '/remover').then(daFicha); },
    principalEndereco: function (id) { return api('POST', '/api/eu/endereco/' + encodeURIComponent(id) + '/principal').then(daFicha); },
    registrarPedido: function (p) { return api('POST', '/api/pedido', p); },
    sair: function () { return api('POST', '/api/sair').then(function () { return { logado: false }; }); },
    exportar: function () { return api('GET', '/api/eu/exportar'); },
    excluir: function () { return api('POST', '/api/eu/excluir'); },
    config: function () { return api('GET', '/api/config'); }
  };

  /* ------------------------------------------------------ lista de desejos
     Fica no aparelho nos dois motores (a conta ainda não tem esse campo). */
  var K_DESEJOS = 'alea_desejos_v1';
  var desejos = {
    lista: function () { return ler(K_DESEJOS, []) || []; },
    tem: function (slug) { return desejos.lista().indexOf(slug) >= 0; },
    alternar: function (slug) {
      var l = desejos.lista();
      var i = l.indexOf(slug);
      if (i >= 0) l.splice(i, 1); else l.unshift(slug);
      gravar(K_DESEJOS, l);
      return i < 0;
    }
  };

  /* --------------------------------------------------- dados da compra em curso
     O que a pessoa preencheu no Finalizar Compra sobrevive a recarregar a página (sessionStorage):
     voltar da sacola não pode apagar o CEP que ela já digitou. */
  var K_COMPRA = 'alea_compra_em_curso_v1';
  var compra = {
    ler: function () { try { return JSON.parse(sessionStorage.getItem(K_COMPRA) || '{}') || {}; } catch (e) { return {}; } },
    gravar: function (o) { try { sessionStorage.setItem(K_COMPRA, JSON.stringify(o)); } catch (e) { /* aba anônima */ } },
    limpar: function () { try { sessionStorage.removeItem(K_COMPRA); } catch (e) { /* nada */ } }
  };

  /* ------------------------------------------------------------- CEP
     ViaCEP (gratuito, sem chave, aceita chamada do navegador). O servidor da conta tem /api/cep,
     mas a prévia não fala com ele — então os dois usam o ViaCEP, e o servidor fica de reserva. */
  function buscarCep(cep) {
    var d = String(cep || '').replace(/\D/g, '');
    if (d.length !== 8) return Promise.reject(new Error('CEP incompleto'));
    return fetch('https://viacep.com.br/ws/' + d + '/json/').then(function (r) { return r.json(); }).then(function (j) {
      if (!j || j.erro) throw new Error('CEP não encontrado');
      return { cep: d, logradouro: j.logradouro || '', bairro: j.bairro || '', cidade: j.localidade || '', uf: j.uf || '' };
    }).catch(function (e) {
      if (PREVIA || !API) throw e;
      return api('GET', '/api/cep/' + d).then(function (j) { j.cep = d; return j; });
    });
  }

  var motor = PREVIA ? previa : servidor;
  window.aleaLoja = {
    previa: PREVIA,
    codigoPrevia: CODIGO_PREVIA,
    emailValido: emailValido,
    eu: motor.eu, enviarCodigo: motor.enviarCodigo, entrarCodigo: motor.entrarCodigo, entrarSenha: motor.entrarSenha,
    entrarGoogle: motor.entrarGoogle, salvarFicha: motor.salvarFicha, definirSenha: motor.definirSenha,
    guardarEndereco: motor.guardarEndereco, tirarEndereco: motor.tirarEndereco, principalEndereco: motor.principalEndereco,
    registrarPedido: motor.registrarPedido, sair: motor.sair, exportar: motor.exportar, excluir: motor.excluir,
    config: PREVIA ? function () { return Promise.resolve({}); } : servidor.config,
    desejos: desejos, compra: compra, buscarCep: buscarCep
  };

  /* ------------------------------------------------ o coração na página da peça
     A Tiffany tem o coração ao lado de cada joia; aqui ele mora embaixo do nome da peça e guarda
     na Lista de Desejos (Minha Conta). O slug sai do nome da página: produto-<slug>.html. */
  function coracao() {
    var h1 = document.querySelector('.produto-topo h1');
    var m = location.pathname.match(/produto-([a-z0-9\-]+)\.html$/i);
    if (!h1 || !m || document.querySelector('[data-desejo]')) return;
    var slug = m[1];
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'loja-coracao'; b.setAttribute('data-desejo', slug);
    var pintar = function () {
      var tem = desejos.tem(slug);
      b.setAttribute('aria-pressed', tem ? 'true' : 'false');
      b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">' +
        '<path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.4 4.5 6.9 4.5c2.1 0 3.6 1.2 5.1 3 1.5-1.8 3-3 5.1-3 3.5 0 5.5 3.5 4.2 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"/></svg>' +
        '<span>' + (tem ? 'Na sua Lista de Desejos' : 'Adicionar à Lista de Desejos') + '</span>';
    };
    b.addEventListener('click', function () { desejos.alternar(slug); pintar(); });
    pintar();
    h1.insertAdjacentElement('afterend', b);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', coracao); else coracao();
})();
