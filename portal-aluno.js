const CHAVE_TOKEN_ALUNO='SIGA_PORTAL_ALUNO_TOKEN';let tokenAluno='',dadosPortalAlunoTela=null;
document.addEventListener('DOMContentLoaded',()=>{const t=localStorage.getItem(CHAVE_TOKEN_ALUNO);if(t){tokenAluno=t;google.script.run.withSuccessHandler(r=>abrirPortalAlunoProgressivo(r?.perfil||null)).withFailureHandler(()=>localStorage.removeItem(CHAVE_TOKEN_ALUNO)).validarSessaoPortalAluno(t);}});
function entrarPortalAluno(){const b=document.getElementById('btnEntrar');b.disabled=true;b.textContent='Entrando...';google.script.run.withSuccessHandler(r=>{tokenAluno=r.token;localStorage.setItem(CHAVE_TOKEN_ALUNO,tokenAluno);abrirPortalAlunoProgressivo(r.perfil||null);}).withFailureHandler(e=>{b.disabled=false;b.textContent='Entrar';mensagemLogin(e&&e.message?e.message:String(e));}).autenticarPortalAluno({login:document.getElementById('loginAluno').value,senha:document.getElementById('senhaAluno').value});}
function abrirPortalAlunoProgressivo(perfil){document.getElementById('login').classList.add('oculto');document.getElementById('portal').classList.remove('oculto');dadosPortalAlunoTela={perfil:perfil||{nome:'Aluno',idade:'',foto:''},matriculas:[],frequencia:{total:0,presentes:0,faltas:0,percentual:0,porTurma:[]},notas:[]};renderPortalAluno(dadosPortalAlunoTela);mostrarTelaPortalAluno('inicio');document.getElementById('freqPercentual').textContent='...';document.getElementById('freqPresentes').textContent='...';document.getElementById('freqFaltas').textContent='...';document.getElementById('freqTotal').textContent='...';document.getElementById('corpoFrequencia').innerHTML='<tr><td colspan="5">Calculando frequência...</td></tr>';carregarPartesPortalAluno();}
let sequenciaCargaPortalAluno = 0;
function carregarPartesPortalAluno() {
  const sessao = tokenAluno;
  const sequencia = ++sequenciaCargaPortalAluno;
  google.script.run.withSuccessHandler(d => {
    if (!sessao || tokenAluno !== sessao || sequencia !== sequenciaCargaPortalAluno) return;
    dadosPortalAlunoTela = d;
    renderPortalAluno(d);
    mostrarAtualizacaoPortalAluno(d);
  }).withFailureHandler(e => {
    if (tokenAluno !== sessao || sequencia !== sequenciaCargaPortalAluno) return;
    ['freqPercentual','freqPresentes','freqFaltas','freqTotal'].forEach(id => document.getElementById(id).textContent = '—');
    const mensagem = 'Não foi possível carregar os dados. Saia e entre novamente para tentar.';
    document.getElementById('corpoFrequencia').innerHTML = '<tr><td colspan="5">' + escAluno(mensagem) + '</td></tr>';
    document.getElementById('corpoNotasAluno').innerHTML = '<tr><td colspan="4">' + escAluno(mensagem) + '</td></tr>';
    console.error(e);
  }).obterDadosPortalAlunoComComprovantes(sessao);
}
function mostrarAtualizacaoPortalAluno(d) {
  let aviso = document.getElementById('atualizacaoResumoPortalAluno');
  if (!aviso) {
    aviso = document.createElement('p');
    aviso.id = 'atualizacaoResumoPortalAluno';
    aviso.setAttribute('role','status');
    document.getElementById('portal').appendChild(aviso);
  }
  const data = d.atualizadoEm ? new Date(d.atualizadoEm) : null;
  aviso.textContent = data && !isNaN(data.getTime())
    ? 'Dados atualizados em ' + data.toLocaleString('pt-BR') +
      (d.resumoDesatualizado ? '. Atualização pendente; alterações recentes podem não aparecer ainda.' : '.')
    : '';
}
function abrirPortalAluno(dados){if(dados){dadosPortalAlunoTela=dados;document.getElementById('login').classList.add('oculto');document.getElementById('portal').classList.remove('oculto');renderPortalAluno(dados);return;}abrirPortalAlunoProgressivo(null);}
function renderPortalAluno(d){const p=d.perfil,f=d.frequencia;document.getElementById('nomePerfil').textContent=p.nome;document.getElementById('idadePerfil').textContent=p.idade+' anos';document.getElementById('fotoPerfil').src=p.foto||'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#eee9ff"/><circle cx="60" cy="43" r="22" fill="#9b7bea"/><path d="M22 112c3-28 18-42 38-42s35 14 38 42" fill="#9b7bea"/></svg>');document.getElementById('turmasPerfil').innerHTML=d.matriculas.map(x=>'<span>'+escAluno(x)+'</span>').join('');document.getElementById('freqPercentual').textContent=f.percentual+'%';document.getElementById('freqPresentes').textContent=f.presentes;document.getElementById('freqFaltas').textContent=f.faltas;document.getElementById('freqTotal').textContent=f.total;document.getElementById('corpoFrequencia').innerHTML=f.porTurma.length?f.porTurma.map(x=>`<tr><td>${escAluno(x.turma)}</td><td>${x.total}</td><td>${x.presentes}</td><td>${x.faltas}</td><td><strong>${x.percentual}%</strong></td></tr>`).join(''):'<tr><td colspan="5">Ainda não há chamadas registradas.</td></tr>';document.getElementById('corpoNotasAluno').innerHTML=d.notas.length?d.notas.map(x=>`<tr><td>${escAluno(x.turma)}</td><td>${escAluno(x.disciplina)}</td><td class="nota">${escAluno(x.nota)}</td><td>${escAluno(x.professor)}</td></tr>`).join(''):'<tr><td colspan="4">Ainda não há notas lançadas.</td></tr>';renderAusenciasPortalAluno(f,d.matriculas||[]);renderFinanceiroPortalAluno(d.financeiro,d.resumoDesatualizado);renderResumoHomePortalAluno(d);}

/* Complementa a renderização original com AVs, médias e comentários. */
const renderPortalAlunoBaseNotasAv_ = renderPortalAluno;
renderPortalAluno = function(dados){
  renderPortalAlunoBaseNotasAv_(dados);
  renderizarNotasAvaliacoesPortalAluno_(dados && dados.notas);
  carregarAvaliacaoPortalAlunoTela_();
};

let notaAvaliacaoPortalAluno_=0;
let sessaoAvaliacaoPortalAlunoCarregada_='';

function textoNotaAvaliacaoPortalAluno_(nota){
  return ['', 'Muito ruim', 'Ruim', 'Regular', 'Bom', 'Excelente'][Number(nota)||0]||'Selecione uma nota';
}

function selecionarNotaAvaliacaoPortalAluno(nota){
  nota=Number(nota);
  if(!Number.isInteger(nota)||nota<1||nota>5)return;
  notaAvaliacaoPortalAluno_=nota;
  document.querySelectorAll('#estrelasAvaliacaoPortalAluno button[data-nota]').forEach(botao=>{
    const ativa=Number(botao.dataset.nota)<=nota;
    botao.classList.toggle('ativa',ativa);
    botao.setAttribute('aria-checked',Number(botao.dataset.nota)===nota?'true':'false');
  });
  const texto=document.getElementById('textoNotaAvaliacaoPortalAluno');
  if(texto)texto.textContent=nota+' de 5 · '+textoNotaAvaliacaoPortalAluno_(nota);
}

function mensagemAvaliacaoPortalAluno_(texto,tipo){
  const elemento=document.getElementById('mensagemAvaliacaoPortalAluno');
  if(!elemento)return;
  elemento.textContent=String(texto||'');
  elemento.className=tipo||'';
}

function carregarAvaliacaoPortalAlunoTela_(){
  if(!tokenAluno||sessaoAvaliacaoPortalAlunoCarregada_===tokenAluno)return;
  sessaoAvaliacaoPortalAlunoCarregada_=tokenAluno;
  google.script.run
    .withSuccessHandler(resultado=>{
      if(sessaoAvaliacaoPortalAlunoCarregada_!==tokenAluno)return;
      const avaliacao=resultado&&resultado.avaliacao;
      if(!avaliacao)return;
      selecionarNotaAvaliacaoPortalAluno(Number(avaliacao.nota));
      const comentario=document.getElementById('comentarioAvaliacaoPortalAluno');
      if(comentario)comentario.value=String(avaliacao.comentario||'');
      mensagemAvaliacaoPortalAluno_('Sua avaliação pode ser atualizada quando quiser.','');
    })
    .withFailureHandler(()=>{
      sessaoAvaliacaoPortalAlunoCarregada_='';
    })
    .obterAvaliacaoPortalAluno(tokenAluno);
}

function enviarAvaliacaoPortalAluno(){
  if(!tokenAluno)return;
  if(!notaAvaliacaoPortalAluno_){
    mensagemAvaliacaoPortalAluno_('Selecione de 1 a 5 estrelas.','erro');
    return;
  }
  const comentario=String(document.getElementById('comentarioAvaliacaoPortalAluno')?.value||'').trim();
  const botao=document.getElementById('botaoSalvarAvaliacaoPortalAluno');
  if(botao){botao.disabled=true;botao.textContent='Enviando...';}
  mensagemAvaliacaoPortalAluno_('Salvando sua avaliação...','');
  google.script.run
    .withSuccessHandler(resultado=>{
      if(botao){botao.disabled=false;botao.textContent='Atualizar avaliação';}
      mensagemAvaliacaoPortalAluno_(resultado&&resultado.mensagem?resultado.mensagem:'Avaliação registrada com sucesso.','sucesso');
    })
    .withFailureHandler(erro=>{
      if(botao){botao.disabled=false;botao.textContent='Enviar avaliação';}
      mensagemAvaliacaoPortalAluno_(erro&&erro.message?erro.message:String(erro),'erro');
    })
    .salvarAvaliacaoPortalAluno(tokenAluno,{nota:notaAvaliacaoPortalAluno_,comentario});
}

function numeroNotaPortalAluno_(valor){
  if(valor===''||valor===null||valor===undefined)return null;
  const numero=Number(String(valor).replace(',','.'));
  return Number.isFinite(numero)?numero:null;
}

function formatarNotaPortalAluno_(valor){
  const numero=numeroNotaPortalAluno_(valor);
  return numero===null?'—':numero.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:2});
}

function calcularResumoNotasAvPortalAluno_(registros){
  const grupos=new Map();
  (Array.isArray(registros)?registros:[]).forEach(item=>{
    const turma=String(item.turma||'').trim();
    const avaliacao=String(item.avaliacao||'').trim().toUpperCase();
    const nota=numeroNotaPortalAluno_(item.nota);
    if(!turma||!['AV1','AV2','AV3','AV4'].includes(avaliacao)||nota===null)return;
    const chave=turma.toLocaleUpperCase('pt-BR')+'|'+avaliacao;
    if(!grupos.has(chave))grupos.set(chave,{turma,avaliacao,notas:[]});
    grupos.get(chave).notas.push(nota);
  });

  const porTurma=new Map();
  grupos.forEach(grupo=>{
    grupo.media=grupo.notas.reduce((s,n)=>s+n,0)/grupo.notas.length;
    const chave=grupo.turma.toLocaleUpperCase('pt-BR');
    if(!porTurma.has(chave))porTurma.set(chave,{turma:grupo.turma,avs:[]});
    porTurma.get(chave).avs.push(grupo);
  });

  return Array.from(porTurma.values()).map(turma=>{
    turma.avs.sort((a,b)=>a.avaliacao.localeCompare(b.avaliacao,'pt-BR'));
    turma.mediaGeral=turma.avs.reduce((s,av)=>s+av.media,0)/turma.avs.length;
    return turma;
  }).sort((a,b)=>a.turma.localeCompare(b.turma,'pt-BR'));
}

function renderizarNotasAvaliacoesPortalAluno_(registros){
  const notas=Array.isArray(registros)?registros:[];
  const corpo=document.getElementById('corpoNotasAluno');
  const resumo=document.getElementById('resumoMediasNotasAluno');
  if(!corpo)return;

  const turmas=calcularResumoNotasAvPortalAluno_(notas);
  corpo.innerHTML=notas.length?notas.map(item=>`<tr>
    <td>${escAluno(item.turma||'')}</td>
    <td><strong>${escAluno(item.avaliacao||'—')}</strong></td>
    <td>${escAluno(item.disciplina||'')}</td>
    <td class="nota">${escAluno(formatarNotaPortalAluno_(item.nota))}</td>
    <td>${escAluno(item.comentario||'—')}</td>
    <td>${escAluno(item.professor||'')}</td>
  </tr>`).join(''):'<tr><td colspan="6">Ainda não há notas lançadas.</td></tr>';

  if(resumo){
    resumo.innerHTML=turmas.length?`<style>
      #resumoMediasNotasAluno{display:grid;gap:12px;margin:16px 0}
      .pa-media-turma{border:1px solid #e4e7ec;border-radius:14px;padding:14px;background:#fafaff}
      .pa-media-topo{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:10px}
      .pa-media-topo strong:last-child{color:#6427e8;font-size:20px}
      .pa-media-avs{display:flex;gap:8px;flex-wrap:wrap}
      .pa-media-av{background:#eee9ff;color:#5421bd;border-radius:999px;padding:7px 11px;font-weight:800;font-size:13px}
    </style>`+turmas.map(turma=>`<article class="pa-media-turma">
      <div class="pa-media-topo"><strong>${escAluno(turma.turma)}</strong><strong>Média geral: ${escAluno(formatarNotaPortalAluno_(turma.mediaGeral))}</strong></div>
      <div class="pa-media-avs">${turma.avs.map(av=>`<span class="pa-media-av">${escAluno(av.avaliacao)}: ${escAluno(formatarNotaPortalAluno_(av.media))}</span>`).join('')}</div>
    </article>`).join(''):'';
  }

  const contador=document.getElementById('homeNotasQtd');
  if(contador){
    const avs=new Set(notas.filter(n=>n.avaliacao).map(n=>String(n.turma||'')+'|'+String(n.avaliacao||'').toUpperCase()));
    contador.textContent=String(avs.size);
  }
}

function renderAusenciasPortalAluno(frequencia,matriculasAtivas){
  const turmasAtivas=new Set((matriculasAtivas||[]).map(normalizarNomeAutocompletePortalAluno_));
  document.getElementById('ausenciasPortalAluno')?.remove();
  const corpo=document.getElementById('corpoFrequencia');
  const tabela=corpo?.closest('table');
  const referencia=tabela?.closest('.tabela')||tabela;
  if(!referencia)return;

  const ausencias=[];
  (frequencia?.porTurma||[]).forEach(g=>{
    (g.ausencias||[]).forEach(a=>{const turma=a.turma||g.turma;ausencias.push({...a,turma,turmaAtiva:turmasAtivas.has(normalizarNomeAutocompletePortalAluno_(turma))});});
  });
  ausencias.sort((a,b)=>String(b.data||'').localeCompare(String(a.data||'')));

  const sec=document.createElement('section');
  sec.id='ausenciasPortalAluno';
  sec.innerHTML=`<style>
    #ausenciasPortalAluno{margin-top:24px}
    #ausenciasPortalAluno h3{margin:0 0 6px;font-size:18px;color:#17243a}
    #ausenciasPortalAluno .pa-aus-sub{margin:0 0 14px;color:#718096;font-size:13px}
    #ausenciasPortalAluno .pa-aus-lista{display:grid;gap:10px}
    #ausenciasPortalAluno .pa-aus-item{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:14px 16px;border:1px solid #e4e7ee;border-radius:12px;background:#fff}
    #ausenciasPortalAluno .pa-aus-data{font-weight:700;color:#17243a}
    #ausenciasPortalAluno .pa-aus-turma{display:block;color:#718096;font-size:12px;margin-top:3px}
    #ausenciasPortalAluno .pa-aus-status{font-size:13px;font-weight:600}
    #ausenciasPortalAluno .pa-aus-analise{color:#9a6700}
    #ausenciasPortalAluno .pa-aus-abonada{color:#168352}
    #ausenciasPortalAluno .pa-aus-recusada{color:#b42318}
    #ausenciasPortalAluno .pa-aus-btn{border:1px solid #6425e8;background:#fff;color:#6425e8;border-radius:8px;padding:8px 12px;font-weight:700;cursor:pointer}
    #ausenciasPortalAluno .pa-aus-form{margin-top:10px;padding:14px;background:#f7f8fc;border:1px solid #e1e5ed;border-radius:10px}
    #ausenciasPortalAluno .pa-aus-form input{display:block;margin:10px 0;width:100%}
    #ausenciasPortalAluno .pa-aus-acoes{display:flex;gap:14px;align-items:center}
    #ausenciasPortalAluno .pa-aus-msg{font-size:12px;color:#68758a}
    @media(max-width:650px){#ausenciasPortalAluno .pa-aus-item{align-items:flex-start;flex-direction:column}}
  </style>
  <h3>Datas de ausência</h3>
  <p class="pa-aus-sub">A justificativa pelo portal é feita exclusivamente pelo envio de atestado.</p>
  <div class="pa-aus-lista">${
    ausencias.length?ausencias.map(a=>renderLinhaAusenciaPortalAluno_(a)).join(''):
    '<div class="pa-aus-item">Nenhuma ausência registrada.</div>'
  }</div>`;
  referencia.insertAdjacentElement('afterend',sec);
}

function renderLinhaAusenciaPortalAluno_(a){
  const status=normalizarNomeAutocompletePortalAluno_(a.atestadoStatus||'').replace(/\s+/g,'');
  let acao='';
  if(status==='EMANALISE'){
    acao='<span class="pa-aus-status pa-aus-analise">Atestado em análise</span>';
  }else if(status==='APROVADO'||a.faltaAbonada){
    acao='<span class="pa-aus-status pa-aus-abonada">✓ Falta abonada · atestado aprovado</span>';
  }else if(a.turmaAtiva){
    const recusado=status==='RECUSADO'?'<span class="pa-aus-status pa-aus-recusada">Atestado recusado</span> ':'';
    acao=recusado+`<button type="button" class="pa-aus-btn" data-turma="${escAlunoAtributo_(a.turma)}" data-data="${escAlunoAtributo_(a.data)}" onclick="abrirEnvioAtestadoPortalAluno(this)">Enviar atestado</button>`;
  }else{
    acao='<span class="pa-aus-status">Turma encerrada</span>';
  }
  return `<div class="pa-aus-item" data-ausencia="${escAlunoAtributo_(a.turma+'|'+a.data)}">
    <div><span class="pa-aus-data">${escAluno(a.dataFormatada||formatarDataAusenciaPortalAluno_(a.data))}</span><span class="pa-aus-turma">${escAluno(a.turma)}</span></div>
    <div>${acao}</div>
  </div>`;
}

function formatarDataAusenciaPortalAluno_(data){
  const p=String(data||'').split('-');
  return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:String(data||'');
}

function abrirEnvioAtestadoPortalAluno(botao){
  const item=botao.closest('.pa-aus-item');if(!item)return;
  if(item.querySelector('.pa-aus-form'))return;
  const turma=botao.dataset.turma||'',data=botao.dataset.data||'';
  const form=document.createElement('form');
  form.className='pa-aus-form';
  form.dataset.turma=turma;form.dataset.data=data;
  form.onsubmit=enviarAtestadoPortalAlunoTela;
  form.innerHTML=`<strong>Enviar atestado · ${escAluno(formatarDataAusenciaPortalAluno_(data))}</strong>
    <input name="arquivo" type="file" accept="application/pdf,image/jpeg,image/png" required>
    <div class="pa-aus-acoes"><button class="pa-aus-btn" type="submit">Enviar atestado</button>
    <button class="pa-aus-btn" type="button" onclick="this.closest('.pa-aus-form').remove()">Cancelar</button></div>
    <div class="pa-aus-msg" role="status">PDF, JPG ou PNG até 5 MB. O documento ficará em análise pela secretaria.</div>`;
  item.appendChild(form);botao.style.display='none';
}

function enviarAtestadoPortalAlunoTela(evento){
  evento.preventDefault();
  const form=evento.currentTarget,arquivo=form.elements.arquivo.files[0],msg=form.querySelector('.pa-aus-msg');
  if(!arquivo||arquivo.size>5*1024*1024||!['application/pdf','image/jpeg','image/png'].includes(arquivo.type)){
    msg.textContent='Selecione PDF, JPG ou PNG de até 5 MB.';return;
  }
  const sessao=tokenAluno;if(!sessao)return;
  form.querySelectorAll('button,input').forEach(x=>x.disabled=true);msg.textContent='Enviando atestado...';
  const leitor=new FileReader();
  leitor.onerror=()=>{form.querySelectorAll('button,input').forEach(x=>x.disabled=false);msg.textContent='Não foi possível ler o arquivo.';};
  leitor.onload=()=>{
    if(sessao!==tokenAluno)return;
    google.script.run.withSuccessHandler(r=>{
      if(sessao!==tokenAluno)return;
      msg.textContent=r?.mensagem||'Atestado enviado com sucesso.';
      carregarPartesPortalAluno();
    }).withFailureHandler(e=>{
      if(sessao!==tokenAluno)return;
      form.querySelectorAll('button,input').forEach(x=>x.disabled=false);
      msg.textContent=e?.message||'Não foi possível enviar o atestado.';
    }).enviarAtestadoPortalAluno(sessao,{
      turma:form.dataset.turma,
      dataAula:form.dataset.data,
      arquivo:{mimeType:arquivo.type,nome:arquivo.name,base64:leitor.result}
    });
  };
  leitor.readAsDataURL(arquivo);
}

function enviarFotoPortalAluno(input) {
  const f=input.files&&input.files[0];if(!f)return;
  if(f.size>3*1024*1024){alert('A foto deve ter no máximo 3 MB.');return;}
  const sessao=tokenAluno;
  const r=new FileReader();
  r.onload=()=>{
    if(!sessao||sessao!==tokenAluno)return;
    google.script.run.withSuccessHandler(x=>{
      if(sessao!==tokenAluno)return;
      if(dadosPortalAlunoTela)dadosPortalAlunoTela.perfil.foto=x.url;
      document.getElementById('fotoPerfil').src=x.url;
    }).withFailureHandler(e=>{if(sessao===tokenAluno)alert(e.message||e);})
      .salvarFotoPerfilPortalAluno(sessao,{mimeType:f.type,base64:r.result});
  };
  r.onerror=()=>alert('Não foi possível ler a foto.');
  r.readAsDataURL(f);
}

function turmasFinanceiroAlunoExibicao(nomes) {
  const unicos=new Map();
  (nomes||[]).forEach(nome=>String(nome||'').split(/\s*[+;,\n]\s*/).forEach(parte=>{
    const n=parte.trim();if(!n||/^COMBO\b/i.test(n))return;
    const chave=normalizarNomeAutocompletePortalAluno_(n);if(!unicos.has(chave))unicos.set(chave,n);
  }));
  return Array.from(unicos.values());
}
function renderFinanceiroPortalAluno(financeiro,desatualizado) {
  document.getElementById('comprovantesAlunoPc')?.remove();
  limparHistoricoPagamentosAluno();
  let card=document.getElementById('financeiroPortalAluno');
  if(!card){
    card=document.createElement('section');card.id='financeiroPortalAluno';card.className='card';
    const portal=document.getElementById('portal'),destino=document.getElementById('conteudoPagamentosPortalAluno'),perfil=portal.querySelector('.perfil');
    if(destino)destino.appendChild(card);else if(perfil)perfil.insertAdjacentElement('afterend',card);else portal.appendChild(card);
  }
  const estilo=`<style>
    #financeiroPortalAluno .pa-pag-topo{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:20px}
    #financeiroPortalAluno .pa-pag-topo h2{margin:0}
    #financeiroPortalAluno .pa-pag-titulo{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
    #financeiroPortalAluno .pa-pag-indicadores{display:flex;align-items:center;gap:14px}
    #financeiroPortalAluno .pa-pag-check{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border:2px solid #168352;border-radius:50%;color:#168352;font-size:22px;font-weight:700}
    #financeiroPortalAluno .pa-pag-atualizar{border:0!important;background:transparent!important;box-shadow:none!important;color:#68758a!important;padding:6px!important;min-height:36px;min-width:36px;font-size:24px!important;cursor:pointer}
    #financeiroPortalAluno .tabela{overflow-x:auto;-webkit-overflow-scrolling:touch}
    #financeiroPortalAluno table{width:100%;min-width:1180px;border-collapse:collapse;text-align:left}
    #financeiroPortalAluno th{padding:14px 12px;font-size:13px;color:#536176;font-weight:700;border-bottom:1px solid #e1e5ed;white-space:nowrap}
    #financeiroPortalAluno td{padding:16px 12px;border-bottom:1px solid #e8ebf1;vertical-align:middle;font-size:14px;line-height:1.5}
    #financeiroPortalAluno .pa-pag-turmas{min-width:230px;max-width:310px;white-space:normal;overflow-wrap:anywhere}
    #financeiroPortalAluno .pa-pag-data,#financeiroPortalAluno .pa-pag-valor{white-space:nowrap}
    #financeiroPortalAluno .pa-pag-sub{display:block;color:#718096;font-size:12px;margin-top:3px;font-weight:400}
    #financeiroPortalAluno .pa-pag-link{display:inline-block!important;border:0!important;box-shadow:none!important;background:transparent!important;padding:0!important;color:#6425e8!important;font-size:13px!important;font-weight:600!important;text-decoration:underline!important;text-underline-offset:3px;cursor:pointer;border-radius:0!important;min-height:30px}
    #financeiroPortalAluno button:focus-visible{outline:2px solid #6425e8!important;outline-offset:3px}
    #financeiroPortalAluno button:disabled{opacity:.5;cursor:wait}
    #financeiroPortalAluno [hidden]{display:none!important}
    #financeiroPortalAluno .pa-grupo td{padding:0;background:#f8f8ff}
    #financeiroPortalAluno .pa-grupo-botao{display:flex!important;align-items:center;justify-content:space-between;gap:20px;width:100%;text-align:left;padding:18px 14px!important;border:0!important;border-radius:0!important;background:transparent!important;color:#14233b!important;box-shadow:none!important;cursor:pointer}
    #financeiroPortalAluno .pa-grupo-nome{display:flex;gap:14px;align-items:center;font-size:16px;font-weight:700}
    #financeiroPortalAluno .pa-seta{color:#718096;font-size:16px;transition:transform .15s}
    #financeiroPortalAluno [aria-expanded="true"] .pa-seta{transform:rotate(90deg)}
    #financeiroPortalAluno .pa-ativa{font-size:12px;color:#087b58;background:#e9fbf1;border-radius:20px;padding:5px 12px;font-weight:600}
    #financeiroPortalAluno .pa-filho{background:#fafbfd}
    #financeiroPortalAluno .pa-filho .pa-pag-turmas{padding-left:28px}
    #financeiroPortalAluno .pa-ramo{color:#bdc7d5;margin-right:9px}
    #financeiroPortalAluno .pa-hist-check{color:#168352;font-size:21px}
    #financeiroPortalAluno .pa-pag-aviso{font-size:13px;color:#68758a;margin:12px 0 0}
    #financeiroPortalAluno .pa-pag-aviso:empty{display:none}
    #financeiroPortalAluno .pa-pag-chave{font-size:12px;word-break:break-all;display:block;user-select:text}
    #financeiroPortalAluno .pa-comprovante-form{background:#f7f8fc;padding:16px;border:1px solid #e1e5ed;border-radius:10px}
    #financeiroPortalAluno .pa-comprovante-form fieldset{border:0;padding:0;margin:12px 0;display:grid;grid-template-columns:repeat(3,minmax(160px,1fr));gap:14px}
    #financeiroPortalAluno .pa-comprovante-form label{display:flex;flex-direction:column;gap:5px;font-size:13px;font-weight:600;margin:0}
    #financeiroPortalAluno .pa-comprovante-form input,#financeiroPortalAluno .pa-comprovante-form select{box-sizing:border-box;width:100%;min-height:40px;padding:8px;border:1px solid #cfd6e4;border-radius:7px;font-size:14px;background:#fff}
    #financeiroPortalAluno .pa-comprovante-arquivo{grid-column:1/-1}
    #financeiroPortalAluno .pa-comprovante-acoes{display:flex;gap:20px;align-items:center}
    @media(max-width:700px){#financeiroPortalAluno .pa-comprovante-form fieldset{grid-template-columns:1fr 1fr}}
  </style>`;
  const turmas=turmasFinanceiroAlunoExibicao(dadosPortalAlunoTela?.matriculas?.length?dadosPortalAlunoTela.matriculas:financeiro?.turmas||[]);
  const competencia=String(financeiro?.competencia||'').split('-').reverse().join('/');
  card.innerHTML=estilo+'<div class="pa-pag-topo"><div class="pa-pag-titulo"><h2>Pagamentos</h2><span id="indicadorTurmasAtivasAluno" class="pa-ativa"'+(turmas.length?'':' hidden')+'>'+(turmas.length>1?'Turmas ativas':'Turma ativa')+'</span></div><div class="pa-pag-indicadores">'+
    (financeiro?.status==='PAGO'?'<span class="pa-pag-check" role="img" aria-label="Mensalidade de '+escAlunoAtributo_(competencia)+' quitada" title="Mensalidade de '+escAlunoAtributo_(competencia)+' quitada">✓</span>':'')+
    '<button class="pa-pag-atualizar" type="button" aria-label="Atualizar pagamentos" title="Atualizar pagamentos" onclick="atualizarFinanceiroAlunoPc(this)">↻</button></div></div>'+
    '<div class="tabela" role="region" aria-label="Pagamentos das turmas ativas" tabindex="0"><table aria-label="Pagamentos">'+
    '<thead><tr><th>Turmas</th><th>Mês de referência</th><th>Mês de pagamento</th><th>Valor mensalidade</th><th>Valor Pago</th><th>Valor Faltante</th><th>Situação</th><th>Insira o comprovante</th></tr></thead><tbody>'+
    (turmas.length?'<tr class="pa-grupo"><td colspan="8"><button id="abrirHistoricoPagamentosAluno" type="button" class="pa-grupo-botao" aria-expanded="false" aria-controls="historicoPagamentosAluno" onclick="alternarHistoricoPagamentosAluno()"><span class="pa-grupo-nome"><span class="pa-seta" aria-hidden="true">▸</span><span id="nomeGrupoPagamentosAluno">'+escAluno(turmas.join(' + '))+'</span></span></button></td></tr>':
      '<tr><td colspan="8">'+(financeiro?'Não há turma ativa para exibir.':'Carregando turmas ativas...')+'</td></tr>')+
    '</tbody><tbody id="historicoPagamentosAluno" hidden></tbody></table></div>'+
    '<p id="mensagemBoletoPortalAluno" class="pa-pag-aviso" role="status" aria-live="polite"></p>';
  if(desatualizado)document.getElementById('mensagemBoletoPortalAluno').textContent='Dados aguardando atualização. Use ↻ para consultar.';
}

async function copiarChavePixMensalidadePortalAluno(botao) {
  const sessao=tokenAluno,fin=dadosPortalAlunoTela?.financeiro;
  const msg=document.getElementById('mensagemBoletoPortalAluno');
  if(!sessao||!fin||dadosPortalAlunoTela.comprovantePendenteMes||!['EM_ABERTO','PARCIAL'].includes(fin.status)||!(Number(fin.valorFaltante)>0)){
    msg.textContent='Atualize os pagamentos antes de realizar outro pagamento.';return;
  }
  const chave='oficinadeteatroge@gmail.com';
  botao.disabled=true;
  try {
    await navigator.clipboard.writeText(chave);
    if(sessao===tokenAluno)msg.textContent='Chave Pix copiada. Confira o beneficiário e o valor no aplicativo do banco.';
  }catch(e){
    if(sessao!==tokenAluno)return;
    msg.textContent='Selecione e copie a chave: ';
    const campo=document.createElement('input');campo.readOnly=true;campo.value=chave;campo.setAttribute('aria-label','Chave Pix');msg.appendChild(campo);campo.focus();campo.select();
  }finally{botao.disabled=false;}
}

function abrirBoletoPortalAlunoSeguro(idBoleto,botao) {
  const sessao=tokenAluno;if(!sessao)return;
  const mensagem=document.getElementById('mensagemBoletoPortalAluno');
  mensagem.textContent='Conferindo pagamento e disponibilidade do boleto...';
  const anterior=botao.textContent;botao.disabled=true;botao.textContent='Conferindo...';
  const janela=window.open('','_blank');
  if(janela){janela.opener=null;janela.document.body.textContent='Conferindo boleto no SIGA...';}
  google.script.run.withSuccessHandler(r=>{
    botao.disabled=false;botao.textContent=anterior;
    if(tokenAluno!==sessao){if(janela)janela.close();return;}
    try{
      const url=new URL(r.url);if(url.protocol!=='https:'||url.username||url.password)throw new Error('Link inválido.');
      if(janela&&!janela.closed){janela.location.replace(url.href);mensagem.textContent='Boleto aberto em outra aba.';}
      else {
        mensagem.textContent='Seu navegador bloqueou a abertura. ';
        const link=document.createElement('a');link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';
        link.textContent='Abrir boleto conferido';mensagem.appendChild(link);
      }
    }catch(e){if(janela)janela.close();mensagem.textContent='Não foi possível abrir o link. Consulte a secretaria.';}
  }).withFailureHandler(e=>{
    if(janela)janela.close();botao.disabled=false;botao.textContent=anterior;
    if(tokenAluno===sessao)mensagem.textContent=e&&e.message?e.message:'Não foi possível conferir o boleto.';
  }).obterOpcoesPagamentoPortalAluno(sessao,idBoleto);
}
function sairPortalAlunoTela() {
  const t=tokenAluno;tokenAluno='';dadosPortalAlunoTela=null;sequenciaCargaPortalAluno++;
  carrinhoLojaPortal=[];carrinhoLojaPortalCarregado=false;
  document.getElementById('comprovantesAlunoPc')?.remove();limparHistoricoPagamentosAluno();
  localStorage.removeItem(CHAVE_TOKEN_ALUNO);
  document.getElementById('portal').classList.add('oculto');
  document.getElementById('login').classList.remove('oculto');
  document.getElementById('senhaAluno').value='';
  const b=document.getElementById('btnEntrar');b.disabled=false;b.textContent='Entrar';
  document.getElementById('msgLogin').classList.add('oculto');
  if(t)google.script.run.withFailureHandler(e=>console.error(e)).sairPortalAluno(t);
}
function mensagemLogin(t){const e=document.getElementById('msgLogin');e.textContent=t;e.className='msg erro';}function escAluno(v){const d=document.createElement('div');d.textContent=v??'';return d.innerHTML;}
/* =========================================================
   AUTOCOMPLETE DO NOME — PORTAL DO ALUNO
   ========================================================= */

let nomesPortalAlunoSIGA = [];
let nomesPortalAlunoCarregandoSIGA = false;
let nomesPortalAlunoCarregadoSIGA = false;

function carregarNomesPortalAlunoSIGA() {
  if (
    nomesPortalAlunoCarregadoSIGA ||
    nomesPortalAlunoCarregandoSIGA
  ) {
    return;
  }

  nomesPortalAlunoCarregandoSIGA = true;

  google.script.run
    .withSuccessHandler(lista => {
      nomesPortalAlunoSIGA =
        Array.isArray(lista) ? lista : [];

      nomesPortalAlunoCarregadoSIGA = true;
      nomesPortalAlunoCarregandoSIGA = false;

      buscarNomePortalAlunoSIGA();
    })
    .withFailureHandler(erro => {
      console.error(
        'Erro ao carregar nomes do Portal do Aluno:',
        erro
      );

      nomesPortalAlunoSIGA = [];
      nomesPortalAlunoCarregandoSIGA = false;
    })
    .listarNomesPortalAlunoSIGA();
}


function normalizarNomeAutocompletePortalAluno_(valor) {
  return String(valor || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}


function buscarNomePortalAlunoSIGA() {
  const input =
    document.getElementById('loginAluno');

  const lista =
    document.getElementById(
      'autocompletePortalAluno'
    );

  if (!input || !lista) {
    return;
  }

  if (!nomesPortalAlunoCarregadoSIGA) {
    carregarNomesPortalAlunoSIGA();

    if (input.value.trim().length >= 2) {
      lista.innerHTML = `
        <div class="autocomplete-sem-resultado">
          Carregando nomes...
        </div>
      `;

      lista.classList.remove('oculto');
    }

    return;
  }

  const termo =
    normalizarNomeAutocompletePortalAluno_(
      input.value
    );

  if (termo.length < 2) {
    lista.innerHTML = '';
    lista.classList.add('oculto');
    return;
  }

  /*
   * Primeiro prioriza nomes que COMEÇAM com o texto digitado.
   * Depois nomes que apenas CONTÊM o texto.
   */
  const encontrados =
    nomesPortalAlunoSIGA
      .filter(item => {
        const nome =
          normalizarNomeAutocompletePortalAluno_(
            item.nomeAluno
          );

        return nome.includes(termo);
      })
      .sort((a, b) => {
        const nomeA =
          normalizarNomeAutocompletePortalAluno_(
            a.nomeAluno
          );

        const nomeB =
          normalizarNomeAutocompletePortalAluno_(
            b.nomeAluno
          );

        const comecaA =
          nomeA.startsWith(termo);

        const comecaB =
          nomeB.startsWith(termo);

        if (comecaA !== comecaB) {
          return comecaA ? -1 : 1;
        }

        return String(a.nomeAluno || '')
          .localeCompare(
            String(b.nomeAluno || ''),
            'pt-BR'
          );
      })
      .slice(0, 10);

  if (!encontrados.length) {
    lista.innerHTML = `
      <div class="autocomplete-sem-resultado">
        Nenhum aluno encontrado.
      </div>
    `;

    lista.classList.remove('oculto');
    return;
  }

  lista.innerHTML =
    encontrados
      .map(item => `
        <button
          type="button"
          class="opcao-autocomplete-aluno"
          data-nome="${escAlunoAtributo_(item.nomeAluno)}"
        >
          ${escAluno(item.nomeAluno)}
        </button>
      `)
      .join('');

  lista.classList.remove('oculto');

  lista
    .querySelectorAll(
      '.opcao-autocomplete-aluno'
    )
    .forEach(botao => {
      botao.addEventListener(
        'mousedown',
        evento => {
          evento.preventDefault();

          selecionarNomePortalAlunoSIGA(
            botao.dataset.nome || ''
          );
        }
      );
    });
}


function selecionarNomePortalAlunoSIGA(nome) {
  const input =
    document.getElementById('loginAluno');

  const lista =
    document.getElementById(
      'autocompletePortalAluno'
    );

  if (input) {
    input.value = nome;
  }

  if (lista) {
    lista.innerHTML = '';
    lista.classList.add('oculto');
  }

  document
    .getElementById('senhaAluno')
    ?.focus();
}


function escAlunoAtributo_(valor) {
  return String(valor || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}


/* Fecha a lista ao clicar fora */

document.addEventListener(
  'click',
  evento => {
    const campo =
      document.querySelector(
        '.autocomplete-aluno-wrap'
      );

    if (
      campo &&
      !campo.contains(evento.target)
    ) {
      document
        .getElementById(
          'autocompletePortalAluno'
        )
        ?.classList.add('oculto');
    }
  }
);


/*
 * Pré-carrega os nomes logo que o login aparece.
 * Assim, quando o aluno começar a digitar,
 * a lista provavelmente já estará pronta.
 */

document.addEventListener(
  'DOMContentLoaded',
  () => {
    carregarNomesPortalAlunoSIGA();
  }
);
// A árvore consulta somente ao expandir. O formulário pertence à linha do mês.
let historicoPagamentosAlunoEstado=null;
function limparHistoricoPagamentosAluno() {
  historicoPagamentosAlunoEstado=null;
  const painel=document.getElementById('historicoPagamentosAluno');
  if(painel){painel.hidden=true;painel.innerHTML='';}
}
function alternarHistoricoPagamentosAluno() {
  const painel=document.getElementById('historicoPagamentosAluno');
  const botao=document.getElementById('abrirHistoricoPagamentosAluno');
  if(!painel||!botao||!tokenAluno)return;
  const abrir=painel.hidden;painel.hidden=!abrir;botao.setAttribute('aria-expanded',String(abrir));
  if(!abrir)return;
  const e=historicoPagamentosAlunoEstado;
  if(e&&e.sessao===tokenAluno&&(e.carregando||e.formAberto||Date.now()-e.criadoEm<60000))return;
  carregarHistoricoPagamentosAluno(false);
}
function carregarHistoricoPagamentosAluno(maisAntigos) {
  const painel=document.getElementById('historicoPagamentosAluno');
  if(!painel||!tokenAluno)return;
  let estado=historicoPagamentosAlunoEstado;
  if(estado&&estado.sessao===tokenAluno&&(estado.carregando||estado.formAberto||estado.enviando))return;
  if(!maisAntigos||!estado||estado.sessao!==tokenAluno){
    estado={sessao:tokenAluno,itens:[],carregando:false,carregado:false,proximoAntesDe:null,erro:'',criadoEm:Date.now(),formAberto:'',enviando:false};
    historicoPagamentosAlunoEstado=estado;
  }
  if(maisAntigos&&!estado.proximoAntesDe)return;
  estado.carregando=true;estado.erro='';renderHistoricoPagamentosAluno();
  const sessao=tokenAluno,antesDe=maisAntigos?estado.proximoAntesDe:'';
  google.script.run.withSuccessHandler(r=>{
    if(tokenAluno!==sessao||historicoPagamentosAlunoEstado!==estado)return;
    estado.carregando=false;estado.carregado=true;estado.criadoEm=Date.now();
    const porMes=new Map(estado.itens.map(x=>[x.competencia,x]));
    (r.itens||[]).filter(x=>/^\d{4}-(0[1-9]|1[0-2])$/.test(x.competencia)&&x.status!=='CANCELADO').forEach(x=>porMes.set(x.competencia,x));
    estado.itens=Array.from(porMes.values()).sort((a,b)=>String(b.competencia).localeCompare(String(a.competencia)));
    estado.proximoAntesDe=r.proximoAntesDe||null;estado.semCompetencia=r.semCompetencia===true;
    estado.dataHoje=r.dataHoje||dadosPortalAlunoTela?.dataHojePortal||'';
    if(Array.isArray(r.turmasAtivas)){
      estado.turmasAtivas=turmasFinanceiroAlunoExibicao(r.turmasAtivas);
      const nome=document.getElementById('nomeGrupoPagamentosAluno');
      if(nome)nome.textContent=estado.turmasAtivas.join(' + ')||'Nenhuma turma ativa';
      const indicador=document.getElementById('indicadorTurmasAtivasAluno');
      if(indicador){indicador.hidden=!estado.turmasAtivas.length;indicador.textContent=estado.turmasAtivas.length>1?'Turmas ativas':'Turma ativa';}
    }
    renderHistoricoPagamentosAluno();
  }).withFailureHandler(()=>{
    if(tokenAluno!==sessao||historicoPagamentosAlunoEstado!==estado)return;
    estado.carregando=false;estado.erro='Não foi possível carregar os pagamentos. Tente novamente.';
    renderHistoricoPagamentosAluno();
  }).obterHistoricoPagamentosPortalAluno(sessao,{antesDe,forcar:!maisAntigos});
}
function podeEnviarComprovanteHistoricoAluno(x) {
  return !!x&&x.permiteComprovante===true&&!x.comprovantePendente&&
    ['EM_ABERTO','PARCIAL'].includes(x.status)&&Number.isFinite(x.saldoConfirmado)&&x.saldoConfirmado>0;
}
function agruparMesesPagamentoAluno(pagamentos) {
  const meses=new Map();
  (pagamentos||[]).forEach(p=>{
    const mes=String(p.data||'').slice(0,7);
    if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)||!Number.isFinite(p.valor)||p.valor<0)return;
    meses.set(mes,(meses.get(mes)||0)+Math.round(p.valor*100));
  });
  return Array.from(meses,([mes,centavos])=>({mes,valor:centavos/100})).sort((a,b)=>a.mes.localeCompare(b.mes));
}
function renderHistoricoPagamentosAluno() {
  const painel=document.getElementById('historicoPagamentosAluno'),e=historicoPagamentosAlunoEstado;
  if(!painel||!e||e.sessao!==tokenAluno||e.enviando||e.formAberto)return;
  const moeda=v=>v==null||v===''||!Number.isFinite(Number(v))?'A conferir':Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const data=s=>String(s||'').split('-').reverse().join('/');
  const rotulos={RECEBIMENTO_REGISTRADO:'',EM_ABERTO:'Em aberto',PARCIAL:'Parcial',ISENTO:'Isento',SEM_RECEBIMENTO:'Sem recebimento',EM_CONFERENCIA:'Em conferência'};
  const linhas=e.itens.filter(x=>x.status!=='CANCELADO').map(x=>{
    const pagamentos=agruparMesesPagamentoAluno(x.pagamentos);
    const datas=pagamentos.map(p=>'<div>'+escAluno(data(p.mes))+
      (pagamentos.length>1?' <span class="pa-pag-sub">'+escAluno(moeda(p.valor))+'</span>':'')+'</div>').join('')||'—';
    const situacao=x.status==='QUITADO'?'<span class="pa-hist-check" role="img" aria-label="Quitado" title="Quitação confirmada">✓</span>':escAluno(rotulos[x.status]??'Em conferência');
    const saldo=x.valorFaltante??x.valorASerPago??(['QUITADO','ISENTO'].includes(x.status)?0:x.saldoConfirmado);
    const podeEnviar=podeEnviarComprovanteHistoricoAluno(x);
    const comprovante=x.comprovantePendente?'<span class="pa-pag-sub">Em análise</span>':podeEnviar?'<button type="button" class="pa-pag-link" onclick="abrirComprovanteHistoricoAluno(\''+x.competencia+'\')">Inserir comprovante</button>':'—';
    const fin=dadosPortalAlunoTela?.financeiro;
    let acoes='';
    // Boleto/Pix permanecem acessíveis no mês atual, sem acrescentar colunas.
    if(fin&&x.competencia===fin.competencia&&podeEnviar&&!dadosPortalAlunoTela.comprovantePendenteMes){
      acoes=(fin.boletos||[]).map(b=>'<div><button type="button" class="pa-pag-link" data-boleto="'+escAlunoAtributo_(b.id)+'" onclick="abrirBoletoPortalAlunoSeguro(this.dataset.boleto,this)">Baixar boleto</button></div>').join('')+
        '<span class="pa-pag-chave">oficinadeteatroge@gmail.com</span><button type="button" class="pa-pag-link" onclick="copiarChavePixMensalidadePortalAluno(this)">Copiar chave Pix</button>';
    }
    return '<tr class="pa-filho"><td class="pa-pag-turmas"><span class="pa-ramo" aria-hidden="true">↳</span>'+escAluno(turmasFinanceiroAlunoExibicao(x.turmas).join(' + ')||'Turma não informada')+
      '</td><td class="pa-pag-data">'+escAluno(data(x.competencia))+'</td><td class="pa-pag-data">'+datas+
      '</td><td class="pa-pag-valor"><strong>'+escAluno(moeda(x.valorMensalidade))+'</strong></td><td class="pa-pag-valor"><strong>'+escAluno(moeda(x.totalPago))+'</strong></td><td class="pa-pag-valor"><strong>'+escAluno(moeda(saldo))+'</strong></td><td>'+situacao+acoes+'</td><td>'+comprovante+'</td></tr>'+
      (podeEnviar?'<tr id="linhaComprovanteAluno-'+x.competencia+'" hidden><td colspan="8"><div id="formularioComprovanteAluno-'+x.competencia+'"></div></td></tr>':'');
  }).join('');
  const aviso=(texto,role)=>'<tr><td colspan="8"><span class="pa-pag-aviso"'+(role?' role="'+role+'"':'')+'>'+escAluno(texto)+'</span></td></tr>';
  painel.innerHTML=linhas+
    (e.carregando?aviso('Carregando pagamentos...','status'):'')+
    (!e.carregando&&!e.erro&&e.carregado&&!linhas?aviso('Nenhum pagamento identificado para as turmas ativas neste período.'):'')+
    (e.semCompetencia?aviso('Há registros sem mês identificado. Consulte a secretaria.'):'')+
    (e.erro?aviso(e.erro,'alert'):'')+
    (!e.carregando&&(e.erro||e.proximoAntesDe)?'<tr><td colspan="8"><button id="maisHistoricoPagamentosAluno" type="button" class="pa-pag-link" onclick="carregarHistoricoPagamentosAluno('+Boolean(e.proximoAntesDe)+')">'+(e.erro?'Tentar novamente':'Mais antigos')+'</button></td></tr>':'');
}
function abrirComprovanteHistoricoAluno(mes) {
  const e=historicoPagamentosAlunoEstado;
  if(!e||e.sessao!==tokenAluno||e.enviando||e.carregando||!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes))return;
  const x=e.itens.find(r=>r.competencia===mes);
  if(!podeEnviarComprovanteHistoricoAluno(x))return;
  if(e.formAberto){
    if(e.formAberto!==mes)document.getElementById('msgComprovanteHistoricoAluno')?.focus();
    return; // Não descarta os dados de um formulário já aberto.
  }
  const linha=document.getElementById('linhaComprovanteAluno-'+mes),destino=document.getElementById('formularioComprovanteAluno-'+mes);
  if(!linha||!destino)return;e.formAberto=mes;linha.hidden=false;
  const mais=document.getElementById('maisHistoricoPagamentosAluno');if(mais)mais.disabled=true;
  destino.innerHTML='<form class="pa-comprovante-form" data-competencia="'+mes+'" onsubmit="enviarComprovanteHistoricoAluno(event)"><strong>Comprovante · '+escAluno(mes.split('-').reverse().join('/'))+'</strong>'+
    '<fieldset><label>Data do pagamento<input name="dataPagamento" type="date" required max="'+escAlunoAtributo_(e.dataHoje||'')+'"></label>'+
    '<label>Valor do comprovante (R$)<input name="valor" type="number" inputmode="decimal" min="0.01" max="100000" step="0.01" required></label>'+
    '<label>Forma de pagamento<select name="forma"><option>Pix</option><option>Boleto</option><option>Transferência</option></select></label>'+
    '<label class="pa-comprovante-arquivo">Arquivo · PDF, JPG ou PNG até 3 MB<input name="arquivo" type="file" accept="application/pdf,image/jpeg,image/png" required></label></fieldset>'+
    '<div class="pa-comprovante-acoes"><button type="submit" class="pa-pag-link">Enviar para validação</button><button type="button" class="pa-pag-link" onclick="cancelarComprovanteHistoricoAluno()">Cancelar</button></div>'+
    '<p id="msgComprovanteHistoricoAluno" class="pa-pag-aviso" role="status" tabindex="-1">O valor será considerado após validação da secretaria.</p></form>';
}
function cancelarComprovanteHistoricoAluno() {
  const e=historicoPagamentosAlunoEstado;if(!e||e.sessao!==tokenAluno||e.enviando)return;
  e.formAberto='';renderHistoricoPagamentosAluno();
}
function enviarComprovanteHistoricoAluno(evento) {
  evento.preventDefault();
  const e=historicoPagamentosAlunoEstado,form=evento.currentTarget;
  if(!e||e.sessao!==tokenAluno||e.enviando||!form.reportValidity())return;
  const mes=form.dataset.competencia,x=e.itens.find(r=>r.competencia===mes);
  if(e.formAberto!==mes||!podeEnviarComprovanteHistoricoAluno(x))return;
  const msg=document.getElementById('msgComprovanteHistoricoAluno');
  const arquivo=form.elements.arquivo.files[0];
  if(!arquivo||arquivo.size>3*1024*1024||!['application/pdf','image/jpeg','image/png'].includes(arquivo.type)){
    msg.textContent='Selecione PDF, JPG ou PNG de até 3 MB.';return;
  }
  const sessao=tokenAluno;
  const dados={competencia:mes,dataPagamento:form.elements.dataPagamento.value,valor:Number(form.elements.valor.value),forma:form.elements.forma.value,observacao:''};
  if(!['Pix','Boleto','Transferência'].includes(dados.forma)){
    msg.textContent='Selecione Pix, boleto ou transferência.';return;
  }
  e.enviando=true;form.querySelectorAll('fieldset,button').forEach(n=>n.disabled=true);msg.textContent='Enviando comprovante...';
  const valido=()=>tokenAluno===sessao&&historicoPagamentosAlunoEstado===e;
  const falha=erro=>{
    if(!valido())return;e.enviando=false;form.querySelectorAll('fieldset,button').forEach(n=>n.disabled=false);
    msg.textContent=erro?.message||'Não foi possível enviar. Tente novamente.';
  };
  const leitor=new FileReader();leitor.onerror=()=>falha(new Error('Não foi possível ler o arquivo.'));
  leitor.onload=()=>{
    if(!valido())return;
    dados.arquivo={tipo:arquivo.type,base64:String(leitor.result).split(',')[1]};
    google.script.run.withSuccessHandler(r=>{
      if(!valido())return;e.enviando=false;e.formAberto='';
      const pendente=['PENDENTE','PROCESSANDO'].includes(r.comprovante?.status);
      if(pendente){
        x.comprovantePendente=true;x.permiteComprovante=false;
        if(dadosPortalAlunoTela?.financeiro?.competencia===mes)dadosPortalAlunoTela.comprovantePendenteMes=true;
        renderHistoricoPagamentosAluno();
      }else carregarHistoricoPagamentosAluno(false);
      document.getElementById('mensagemBoletoPortalAluno').textContent=pendente?'Comprovante recebido. Aguarde a validação da secretaria.':'Este comprovante já foi registrado. Atualizando pagamentos...';
    }).withFailureHandler(falha).enviarComprovanteMensalidadePortalAluno(sessao,dados);
  };
  leitor.readAsDataURL(arquivo);
}
function atualizarFinanceiroAlunoPc(botao) {
  const sessao=tokenAluno;if(!sessao)return;botao.disabled=true;
  google.script.run.withSuccessHandler(r=>{
    if(tokenAluno!==sessao)return;dadosPortalAlunoTela.financeiro=r.financeiro;dadosPortalAlunoTela.comprovantePendenteMes=r.pendente;
    renderFinanceiroPortalAluno(r.financeiro,false);
  }).withFailureHandler(e=>{botao.disabled=false;if(tokenAluno===sessao)document.getElementById('mensagemBoletoPortalAluno').textContent=e.message||'Não foi possível atualizar.';})
    .atualizarFinanceiroComprovantesPortalAluno(sessao);
}
function copiarPixAlunoPc(idBoleto,botao) {
  const sessao=tokenAluno;if(!sessao)return;botao.disabled=true;
  const msg=document.getElementById('mensagemBoletoPortalAluno');msg.textContent='Conferindo cobrança...';
  google.script.run.withSuccessHandler(r=>{
    botao.disabled=false;if(tokenAluno!==sessao)return;
    if(!r.pix){msg.textContent='Pix copia e cola não disponível nessa importação. Abra o boleto ou consulte a secretaria.';return;}
    msg.textContent='';
    const campo=document.createElement('textarea');campo.readOnly=true;campo.value=r.pix;campo.setAttribute('aria-label','Pix copia e cola');campo.style.width='100%';msg.appendChild(campo);
    const copiar=document.createElement('button');copiar.type='button';copiar.textContent='Copiar código Pix';msg.appendChild(copiar);
    const aviso=document.createElement('span');msg.appendChild(aviso);
    // Novo clique preserva a permissão do navegador para a área de transferência.
    copiar.onclick=async()=>{
      if(tokenAluno!==sessao)return;
      try{await navigator.clipboard.writeText(campo.value);if(tokenAluno===sessao)aviso.textContent=' Código copiado. Confira beneficiário e valor no banco antes de pagar.';}
      catch(e){campo.focus();campo.select();aviso.textContent=' Selecione e copie o código acima.';}
    };
  }).withFailureHandler(e=>{botao.disabled=false;if(tokenAluno===sessao)msg.textContent=e.message||'Não foi possível consultar o Pix.';})
    .obterOpcoesPagamentoPortalAluno(sessao,idBoleto);
}

/* =========================================================
   PORTAL DO ALUNO 2.0 — NAVEGAÇÃO E HOME APP
   Mantém as rotinas existentes e reorganiza apenas a interface.
   ========================================================= */
function mostrarTelaPortalAluno(nome){
  const telas=document.querySelectorAll('.pa-tela');
  telas.forEach(t=>t.classList.toggle('ativa',t.dataset.tela===nome));
  document.querySelectorAll('[data-nav]').forEach(b=>{
    const ativo=b.dataset.nav===nome;
    b.classList.toggle('ativo',ativo);
    b.setAttribute('aria-current',ativo?'page':'false');
  });
  window.scrollTo({top:0,behavior:'smooth'});

  if(nome==='pagamentos'){
    const painel=document.getElementById('historicoPagamentosAluno');
    if(painel&&painel.hidden)setTimeout(()=>alternarHistoricoPagamentosAluno(),80);
  }
  if(nome==='loja')setTimeout(inicializarLojaPortal,60);
  if(nome==='carteirinha')setTimeout(prepararCarteirinhaPortalV3,60);
  if(nome==='perfil')setTimeout(carregarPerfilDetalhadoPortalV3,60);
  if(nome==='secretaria')setTimeout(carregarAtendimentosPortalAlunoV3,60);
}

function abrirAtalhoPortalAluno(nome){
  mostrarTelaPortalAluno(nome);
}

function renderResumoHomePortalAluno(d){
  d=d||{};const p=d.perfil||{},f=d.frequencia||{},fin=d.financeiro||null;
  const nome=(p.nome||'Aluno').trim();
  const primeiro=nome.split(/\s+/)[0]||'Aluno';
  const ola=document.getElementById('homeSaudacaoAluno');
  if(ola)ola.textContent='Olá, '+primeiro+' 👋';
  const sub=document.getElementById('homeSubAluno');
  if(sub)sub.textContent=(d.matriculas||[]).join(' · ')||'Portal do Aluno';
  const foto=document.getElementById('homeFotoAluno');
  if(foto)foto.src=document.getElementById('fotoPerfil')?.src||'';

  const valor=document.getElementById('homeMensalidadeValor');
  const status=document.getElementById('homeMensalidadeStatus');
  const venc=document.getElementById('homeMensalidadeVencimento');
  const acao=document.getElementById('homeMensalidadeAcao');
  const competencia=document.getElementById('homeMensalidadeCompetencia');
  const moeda=v=>v==null||!Number.isFinite(Number(v))?'A conferir':Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const mesNome=s=>{
    if(!/^\d{4}-\d{2}$/.test(String(s||'')))return 'Mensalidade';
    const [a,m]=String(s).split('-').map(Number);
    return new Date(a,m-1,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'}).replace(/^./,c=>c.toUpperCase());
  };
  if(competencia)competencia.textContent=fin?mesNome(fin.competencia):'Mensalidade';
  if(valor){
    const principal=fin
      ?(fin.valorFaltante??fin.valorMensalidadeHoje??fin.valorPrevisto)
      :null;
    valor.textContent=fin?moeda(principal):'Carregando...';
  }
  const rotulos={PAGO:'Pago',EM_ABERTO:'Em aberto',PARCIAL:'Parcial',ISENTO:'Isento',EM_CONFERENCIA:'Em conferência',SEM_MENSALIDADE:'Sem mensalidade'};
  if(status){
    status.textContent=fin?(rotulos[fin.status]||'Em conferência'):'Carregando';
    status.dataset.status=fin?.status||'';
  }
  if(venc){
    const p=fin?.previsaoMatricula||{};
    const data=String(fin?.vencimento||p.vencimento||'');
    const vencFmt=data?data.split('-').reverse().join('/'):'';
    const ate=Number.isFinite(Number(p.ateVencimento))?moeda(p.ateVencimento):'A conferir';
    const apos=Number.isFinite(Number(p.aposVencimento))?moeda(p.aposVencimento):'A conferir';
    const regra=p.regraEntrada||{};
    let regraTexto='';

    if(regra.tipo==='INICIO_JUNTO_TURMA'){
      regraTexto=' · Início junto com a turma: valor integral com desconto';
    }else if(regra.tipo==='PROPORCIONAL'){
      regraTexto=' · Proporcional: '+Number(regra.aulasRestantes||0)+' de '+Number(regra.totalAulas||0)+' aulas';
    }

    if(vencFmt){
      venc.textContent='Vencimento: '+vencFmt+' · Até o vencimento: '+ate+' · Após o vencimento: '+apos+regraTexto;
    }else{
      venc.textContent='Valor de hoje: '+moeda(fin?.valorMensalidadeHoje)+regraTexto;
    }
  }
  if(acao){
    acao.textContent=fin?.status==='PAGO'?'Ver histórico':'Ver pagamentos';
  }

  const fp=document.getElementById('homeFreqPercentual');
  if(fp)fp.textContent=(f.percentual??0)+'%';
  const nf=document.getElementById('homeFaltas');
  if(nf)nf.textContent=String(f.faltasNaoAbonadas??f.faltas??0);
  const nn=document.getElementById('homeNotasQtd');
  if(nn)nn.textContent=String((d.notas||[]).length);
  sincronizarPerfilVisualPortalV3(d);
}

function acaoMensalidadeHomePortalAluno(){
  mostrarTelaPortalAluno('pagamentos');
}


/* =========================================================
   PORTAL DO ALUNO 3.0 — TELAS NOVAS
   ========================================================= */
let fotoCarteirinhaNovaPortalV3=null;
let perfilDetalhadoPortalV3=null;
let atendimentosPortalV3Carregando=false;

function fotoPadraoPortalV3(){
  return document.getElementById('fotoPerfil')?.src||
    document.getElementById('homeFotoAluno')?.src||'';
}

function sincronizarPerfilVisualPortalV3(d){
  const p=d?.perfil||{};
  const foto=p.foto||fotoPadraoPortalV3();
  const home=document.getElementById('homeFotoAluno');
  if(home&&foto)home.src=foto;
  const opcao=document.getElementById('fotoCarteirinhaPerfilOpcao');
  const prev=document.getElementById('fotoCarteirinhaPreview');
  if(opcao&&foto)opcao.src=foto;
  if(prev&&!fotoCarteirinhaNovaPortalV3&&foto)prev.src=foto;

  const nome=String(p.nome||'Aluno').trim();
  const iniciais=nome.split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'AL';
  const el=document.getElementById('perfilIniciaisV3');
  if(el)el.textContent=iniciais;
  const mensal=document.getElementById('perfilMensalidadeV3');
  if(mensal){
    const fin=d?.financeiro;
    const valorPerfil=fin?.valorMensalidadeHoje??fin?.valorPrevisto;
    mensal.textContent=fin&&Number.isFinite(Number(valorPerfil))
      ?Number(valorPerfil).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
      :'—';
  }
}

function atualizarResumoCamisaPortalV3(){
  const status=document.getElementById('statusCamisaPortal');
  const resumo=document.getElementById('statusCamisaResumoV3');
  if(resumo&&status)resumo.textContent=status.textContent||'Consulte ou faça sua encomenda.';
  if(!tokenAluno)return;
  google.script.run.withSuccessHandler(d=>{
    if(!d||!resumo)return;
    if(d.encomenda&&d.encomenda.emAndamento){
      resumo.textContent='Status: '+(d.encomenda.status||'SOLICITADO')+
        ' · Tamanho: '+(d.encomenda.tamanho||'—')+
        ' · Falta pagar: R$ '+(d.encomenda.valorFaltante||'0,00');
    }else resumo.textContent='Nenhuma encomenda em andamento.';
  }).withFailureHandler(()=>{}).obterDadosCamisaPortalAluno(tokenAluno);
}

function prepararCarteirinhaPortalV3(){
  const foto=fotoPadraoPortalV3();
  const prev=document.getElementById('fotoCarteirinhaPreview');
  const opcao=document.getElementById('fotoCarteirinhaPerfilOpcao');
  if(foto&&!fotoCarteirinhaNovaPortalV3){
    if(prev)prev.src=foto;
    if(opcao)opcao.src=foto;
  }
  if(!tokenAluno)return;
  google.script.run.withSuccessHandler(r=>{
    const box=document.getElementById('statusCarteirinhaPortal');
    if(!box)return;
    if(r&&r.solicitacao){
      box.classList.remove('oculto');
      box.textContent='Solicitação atual: '+(r.solicitacao.status||'RECEBIDA')+
        (r.solicitacao.criadoEm?' · enviada em '+formatarDataHoraPortalV3(r.solicitacao.criadoEm):'');
    }else box.classList.add('oculto');
  }).withFailureHandler(()=>{}).obterSolicitacaoCarteirinhaPortalAluno(tokenAluno);
}

function usarFotoPerfilCarteirinha(botao){
  fotoCarteirinhaNovaPortalV3=null;
  document.getElementById('fotoCarteirinhaArquivo').value='';
  document.querySelectorAll('.foto-opcao').forEach(x=>x.classList.remove('ativa'));
  botao.classList.add('ativa');
  const foto=fotoPadraoPortalV3();
  if(foto)document.getElementById('fotoCarteirinhaPreview').src=foto;
}

function previewNovaFotoCarteirinha(input){
  const f=input.files?.[0];if(!f)return;
  if(f.size>3*1024*1024||!['image/jpeg','image/png','image/webp'].includes(f.type)){
    alert('Use JPG, PNG ou WEBP de até 3 MB.');input.value='';return;
  }
  const leitor=new FileReader();
  leitor.onload=()=>{
    fotoCarteirinhaNovaPortalV3={mimeType:f.type,base64:leitor.result,nome:f.name};
    document.getElementById('fotoCarteirinhaPreview').src=leitor.result;
    document.querySelectorAll('.foto-opcao').forEach(x=>x.classList.remove('ativa'));
    input.closest('.foto-opcao')?.classList.add('ativa');
  };
  leitor.readAsDataURL(f);
}

function enviarSolicitacaoCarteirinhaPortal(evento){
  evento.preventDefault();
  const form=evento.currentTarget,msg=document.getElementById('msgCarteirinhaPortal');
  if(!tokenAluno||!form.reportValidity())return;

  const forma=form.elements.formaPagamento.value;
  const comprovante=form.elements.comprovante.files?.[0]||null;

  if(!['PIX','DINHEIRO','CARTÃO'].includes(forma)){
    msg.textContent='Selecione a forma de pagamento.';return;
  }
  if(forma==='PIX'&&!comprovante){
    msg.textContent='Para pagamento via PIX, envie o comprovante.';return;
  }
  if(comprovante&&(comprovante.size>4*1024*1024||!['application/pdf','image/jpeg','image/png'].includes(comprovante.type))){
    msg.textContent='O comprovante deve ser PDF, JPG ou PNG de até 4 MB.';return;
  }

  const btn=form.querySelector('button[type="submit"]');
  btn.disabled=true;msg.textContent='Enviando solicitação...';

  const enviar=comprovantePayload=>{
    const dados={
      nomeCompleto:form.elements.nomeCompleto.value,
      cpf:form.elements.cpf.value,
      rg:form.elements.rg.value,
      dataNascimento:form.elements.dataNascimento.value,
      usarFotoPerfil:!fotoCarteirinhaNovaPortalV3,
      foto:fotoCarteirinhaNovaPortalV3,
      formaPagamento:forma,
      valorPago:85,
      comprovante:comprovantePayload
    };
    google.script.run.withSuccessHandler(r=>{
      const pedidoId=r?.pedidoId||r?.idPedido||r?.pedido||'';

      const concluir=()=>{
        btn.disabled=false;
        msg.textContent='Compra realizada com sucesso! A carteirinha será confeccionada quando o lote atingir o mínimo de 10 pedidos.';
        fotoCarteirinhaNovaPortalV3=null;
        prepararCarteirinhaPortalV3();
        carregarArteCarteirinhaPortalV33();
      };

      if(typeof google!=='undefined'&&google.script&&google.script.run){
        google.script.run
          .withSuccessHandler(()=>concluir())
          .withFailureHandler(()=>concluir())
          .corrigirRegistroCarteirinhaPortalAluno(tokenAluno,pedidoId);
      }else{
        concluir();
      }
    }).withFailureHandler(e=>{
      btn.disabled=false;msg.textContent=e?.message||'Não foi possível enviar a solicitação.';
    }).solicitarCarteirinhaPortalAluno(tokenAluno,dados);
  };

  if(!comprovante){enviar(null);return;}
  const leitor=new FileReader();
  leitor.onerror=()=>{btn.disabled=false;msg.textContent='Não foi possível ler o comprovante.';};
  leitor.onload=()=>enviar({mimeType:comprovante.type,nome:comprovante.name,base64:leitor.result});
  leitor.readAsDataURL(comprovante);
}

function carregarPerfilDetalhadoPortalV3(){
  if(!tokenAluno)return;
  google.script.run.withSuccessHandler(r=>{
    perfilDetalhadoPortalV3=r||{};
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v||'—';};
    set('perfilEmailV3',r.email||'Email não informado');
    set('perfilEmailDetalheV3',r.email||'—');
    set('perfilMatriculaV3',(r.matriculas||[]).join(' · ')||'—');
    set('perfilCursoV3',(r.turmas||[]).join(' · ')||'—');
    const valorPerfil=r.financeiro?.valorMensalidadeHoje??r.financeiro?.valorPrevisto;
    if(r.financeiro&&Number.isFinite(Number(valorPerfil))){
      set('perfilMensalidadeV3',Number(valorPerfil).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}));
    }
  }).withFailureHandler(e=>{
    console.error('Perfil detalhado:',e);
  }).obterPerfilDetalhadoPortalAluno(tokenAluno);
}

function enviarMensagemSecretariaPortal(evento){
  evento.preventDefault();
  const form=evento.currentTarget,msg=document.getElementById('msgSecretariaPortal');
  if(!tokenAluno||!form.reportValidity())return;
  const arquivo=form.elements.arquivo.files?.[0]||null;
  if(arquivo&&(arquivo.size>4*1024*1024||!['application/pdf','image/jpeg','image/png'].includes(arquivo.type))){
    msg.textContent='O anexo deve ser PDF, JPG ou PNG de até 4 MB.';return;
  }
  const assunto=String(form.elements.assunto.value||'').trim();
  const mensagem=String(form.elements.mensagem.value||'').trim();
  const nomeAluno=String(dadosPortalAlunoTela?.perfil?.nome||'Aluno').trim();
  const textoWhatsApp=[
    '*Mensagem pelo Portal do Aluno – CAGE*',
    '',
    '*Aluno:* '+nomeAluno,
    '*Assunto:* '+assunto,
    '',
    mensagem,
    arquivo?'':'',
    arquivo?'_Um anexo foi enviado e ficou registrado no Portal do Aluno._':''
  ].filter((linha,indice,lista)=>linha!==''||lista[indice-1]!=='').join('\n');
  const urlWhatsApp='https://wa.me/5521975731161?text='+encodeURIComponent(textoWhatsApp);
  const janelaWhatsApp=window.open(urlWhatsApp,'_blank');
  if(janelaWhatsApp)janelaWhatsApp.opener=null;
  if(!janelaWhatsApp){
    msg.textContent='A mensagem foi preparada. Clique aqui para abrir o WhatsApp: ';
    const link=document.createElement('a');
    link.href=urlWhatsApp;
    link.target='_blank';
    link.rel='noopener noreferrer';
    link.textContent='Abrir WhatsApp';
    msg.appendChild(link);
  }
  const btn=form.querySelector('button[type="submit"]');
  btn.disabled=true;
  if(janelaWhatsApp)msg.textContent='WhatsApp aberto. Registrando a mensagem no portal...';
  let concluido=false;
  const limite=setTimeout(()=>{
    if(concluido)return;
    concluido=true;
    btn.disabled=false;
    msg.textContent='O envio demorou demais. Atualize o portal e tente novamente.';
  },30000);
  const finalizar=()=>{
    if(concluido)return false;
    concluido=true;
    clearTimeout(limite);
    btn.disabled=false;
    return true;
  };
  const enviar=anexo=>{
    google.script.run.withSuccessHandler(r=>{
      if(!finalizar())return;
      form.reset();
      if(janelaWhatsApp){
        msg.textContent='WhatsApp aberto e mensagem registrada no portal.';
      }else{
        msg.textContent='Mensagem registrada. ';
        const link=document.createElement('a');
        link.href=urlWhatsApp;
        link.target='_blank';
        link.rel='noopener noreferrer';
        link.textContent='Abrir WhatsApp';
        msg.appendChild(link);
      }
      carregarAtendimentosPortalAlunoV3();
    }).withFailureHandler(e=>{
      if(!finalizar())return;
      msg.textContent=e?.message||'Não foi possível enviar a mensagem.';
    }).enviarAtendimentoPortalAluno(tokenAluno,{
      assunto,
      mensagem,
      anexo
    });
  };
  if(!arquivo){enviar(null);return;}
  const leitor=new FileReader();
  leitor.onerror=()=>{if(finalizar())msg.textContent='Não foi possível ler o anexo.';};
  leitor.onload=()=>enviar({mimeType:arquivo.type,nome:arquivo.name,base64:leitor.result});
  leitor.readAsDataURL(arquivo);
}

function carregarAtendimentosPortalAlunoV3(){
  if(!tokenAluno||atendimentosPortalV3Carregando)return;
  atendimentosPortalV3Carregando=true;
  const lista=document.getElementById('listaAtendimentosPortal');
  if(lista)lista.innerHTML='<div class="atendimento-vazio">Carregando mensagens...</div>';
  google.script.run.withSuccessHandler(r=>{
    atendimentosPortalV3Carregando=false;
    renderAtendimentosPortalV3(r?.itens||[]);
    atualizarBadgeSecretariaPortalV3(r?.naoLidas||0);
  }).withFailureHandler(e=>{
    atendimentosPortalV3Carregando=false;
    if(lista)lista.innerHTML='<div class="atendimento-vazio">'+escAluno(e?.message||'Não foi possível carregar as mensagens.')+'</div>';
  }).listarAtendimentosPortalAluno(tokenAluno);
}

function renderAtendimentosPortalV3(itens){
  const lista=document.getElementById('listaAtendimentosPortal');if(!lista)return;
  if(!itens.length){lista.innerHTML='<div class="atendimento-vazio">Você ainda não enviou mensagens para a Secretaria.</div>';return;}
  lista.innerHTML=itens.map(x=>`
    <article class="atendimento-card">
      <div class="atendimento-topo">
        <strong>${escAluno(x.assunto||'Atendimento')}</strong>
        <span class="atendimento-status">${escAluno(x.status||'RECEBIDO')}</span>
      </div>
      <p>${escAluno(x.mensagem||'')}</p>
      <p class="atendimento-meta">${escAluno(formatarDataHoraPortalV3(x.criadoEm))}</p>
      ${x.resposta?`<p class="atendimento-resposta"><strong>Secretaria:</strong><br>${escAluno(x.resposta)}</p>`:''}
    </article>`).join('');
}

function atualizarBadgeSecretariaPortalV3(qtd){
  const b=document.getElementById('badgeSecretariaPortal');if(!b)return;
  qtd=Number(qtd)||0;b.textContent=String(qtd);b.classList.toggle('oculto',qtd<1);
}

function formatarDataHoraPortalV3(v){
  const d=new Date(v);return isNaN(d)?String(v||''):d.toLocaleString('pt-BR');
}


function alternarPixCarteirinhaPortalV31(valor){
  const box=document.getElementById('pixCarteirinhaPortalV31');
  if(box)box.classList.toggle('oculto',valor!=='PIX');
}
async function copiarPixCarteirinhaPortalV31(){
  const chave='oficinadeteatroge@gmail.com';
  try{
    await navigator.clipboard.writeText(chave);
    alert('Chave PIX copiada.');
  }catch(e){
    prompt('Copie a chave PIX:',chave);
  }
}


function formatarCpfCarteirinhaPortalV32(input){
  let v=String(input.value||'').replace(/\D/g,'').slice(0,11);
  if(v.length>9)v=v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/,'$1.$2.$3-$4');
  else if(v.length>6)v=v.replace(/(\d{3})(\d{3})(\d{1,3})/,'$1.$2.$3');
  else if(v.length>3)v=v.replace(/(\d{3})(\d{1,3})/,'$1.$2');
  input.value=v;
}


let arteCarteirinhaPortalCarregadaV33=false;

function carregarArteCarteirinhaPortalV33(){
  if(arteCarteirinhaPortalCarregadaV33)return;
  const box=document.getElementById('arteCarteirinhaPortalContainer');
  if(!box)return;

  box.classList.add('arte-carteirinha-loading');

  google.script.run
    .withSuccessHandler(html=>{
      if(!html)return;
      box.innerHTML=html;
      box.classList.remove('arte-carteirinha-loading');
      arteCarteirinhaPortalCarregadaV33=true;
    })
    .withFailureHandler(()=>{
      box.classList.remove('arte-carteirinha-loading');
      box.innerHTML='<div class="arte-carteirinha-placeholder"><span>🎫</span><strong>Carteirinha estudantil</strong><small>Não foi possível carregar a imagem agora.</small></div>';
    })
    .obterArteCarteirinhaPortalV33();
}


function filtrarLojaPortal(tipo,botao){
  tipo=String(tipo||'todos').trim().toLowerCase();
  const filtros=document.querySelector('.loja-filtros');
  const grade=document.querySelector('.loja-produtos-grid');
  if(!filtros||!grade)return;

  filtros.querySelectorAll('button[data-filtro-loja]').forEach(b=>{
    const selecionado=b===botao||b.dataset.filtroLoja===tipo;
    b.classList.toggle('ativo',selecionado);
    b.setAttribute('aria-pressed',selecionado?'true':'false');
  });

  grade.querySelectorAll('[data-produto]').forEach(card=>{
    const categoria=String(card.dataset.produto||'').trim().toLowerCase();
    const mostrar=tipo==='todos'||categoria===tipo;
    card.classList.toggle('oculto',!mostrar);
    card.hidden=!mostrar;
    card.style.display=mostrar?'':'none';
  });
}

/* Delegação de clique: continua funcionando mesmo se a loja for redesenhada
   ou os botões forem recriados dinamicamente. */
document.addEventListener('click',function(evento){
  const botao=evento.target.closest('.loja-filtros button[data-filtro-loja]');
  if(!botao||botao.disabled)return;
  evento.preventDefault();
  filtrarLojaPortal(botao.dataset.filtroLoja,botao);
});

let indiceFotoCamisaPortal=0;
function fotosCamisaPortal(){
 return Array.from(document.querySelectorAll('.camisas-fotos-vitrine img'));
}
function navegarVitrineCamisaPortal(direcao){
 const vitrine=document.querySelector('.camisas-fotos-vitrine');
 const fotos=fotosCamisaPortal();
 if(!vitrine||!fotos.length)return;
 indiceFotoCamisaPortal=(indiceFotoCamisaPortal+direcao+fotos.length)%fotos.length;
 vitrine.scrollTo({left:indiceFotoCamisaPortal*vitrine.clientWidth,behavior:'smooth'});
}
function abrirFotoCamisaPortal(botao){
 const fotos=fotosCamisaPortal();
 if(!fotos.length)return;
 if(botao){
  const foto=botao.querySelector('img');
  const achado=fotos.indexOf(foto);
  if(achado>=0)indiceFotoCamisaPortal=achado;
 }
 atualizarFotoAmpliadaCamisaPortal();
 const dialog=document.getElementById('camisaFotoDialog');
 if(dialog&&!dialog.open)dialog.showModal();
}
function navegarFotoCamisaPortal(direcao){
 const fotos=fotosCamisaPortal();
 if(!fotos.length)return;
 indiceFotoCamisaPortal=(indiceFotoCamisaPortal+direcao+fotos.length)%fotos.length;
 atualizarFotoAmpliadaCamisaPortal();
}
function atualizarFotoAmpliadaCamisaPortal(){
 const fotos=fotosCamisaPortal();
 const ampliada=document.getElementById('camisaFotoAmpliada');
 if(!fotos.length||!ampliada)return;
 indiceFotoCamisaPortal=(indiceFotoCamisaPortal+fotos.length)%fotos.length;
 ampliada.src=fotos[indiceFotoCamisaPortal].src;
 ampliada.alt=fotos[indiceFotoCamisaPortal].alt;
 const contador=document.getElementById('camisaFotoContador');
 if(contador)contador.textContent=(indiceFotoCamisaPortal+1)+' / '+fotos.length;
}
function abrirCalcaPortal(){
 const m=document.getElementById('modalCalcaPortal');
 if(!m){console.error('Modal da calça não encontrado.');return;}
 // Retira o modal de qualquer ancestral oculto ou com empilhamento próprio.
 if(m.parentElement!==document.body)document.body.appendChild(m);
 m.classList.remove('oculto');
 m.style.display='flex';
 document.body.classList.add('calca-modal-aberto');
 if(!m.dataset.carregada){
  const galeria=document.getElementById('galeriaCalcaPortal');
  if(galeria)galeria.textContent='Carregando fotos...';
  google.script.run.withSuccessHandler(html=>{
   if(galeria)galeria.innerHTML=html;
   m.dataset.carregada='1';
  }).withFailureHandler(e=>{
   if(galeria)galeria.textContent='Não foi possível carregar as fotos.';
   console.error(e);
  }).obterGaleriaCalcaPortal();
 }
}
function fecharCalcaPortal(){
 const m=document.getElementById('modalCalcaPortal');
 if(m){m.classList.add('oculto');m.style.display='none';}
 document.body.classList.remove('calca-modal-aberto');
}
function solicitarCalcaPortal(){
 const tamanho=document.getElementById('tamanhoCalcaPortal').value;
 if(!tamanho){document.getElementById('msgCalcaPortal').textContent='Selecione o tamanho.';return;}
 const texto='Olá! Quero encomendar a calça jogger CAGE. Tamanho: '+tamanho+'. Valor: R$ 65,00. Sinal mínimo: R$ 32,50. Gostaria de confirmar as medidas e o pagamento.';
 window.open('https://wa.me/5521975731161?text='+encodeURIComponent(texto),'_blank','noopener,noreferrer');
}

/* Loja unificada: camisa e calça no mesmo carrinho. */
const LOJA_PORTAL_CONFIG={
 CAMISA:{
  nome:'Camisa oficial CAGE',
  preco:65,
  modelos:{
   COM_MANGA:{
    nome:'Com manga',
    foto:1,
    tamanhos:['P','M','G','GG','XGG','G1 - G2','G3','6 ANOS','8 ANOS','10 ANOS','12 ANOS','14 ANOS']
   },
   SEM_MANGA:{
    nome:'Sem manga',
    foto:2,
    tamanhos:['P','M','G','GG','XG']
   }
  }
 },
 CALCA:{nome:'Calça jogger CAGE',modelo:'Jogger CAGE preta',preco:65,tamanhos:['PP','P','M','G','GG']}
};
let carrinhoLojaPortal=[];
let quantidadeProdutoLojaPortal=1;
let carrinhoLojaPortalCarregado=false;
let indiceGaleriaCalcaLojaPortal=0;
let opcaoPagamentoLojaPortal='METADE';
let enviandoPedidoLojaPortal=false;

function mostrarMensagemLojaPortal(id,texto,tipo){
 const el=document.getElementById(id);
 if(!el)return;
 el.className='loja-mensagem'+(tipo?' '+tipo:'');
 el.textContent=texto||'';
 if(texto){el.scrollIntoView({behavior:'smooth',block:'nearest'});el.focus({preventScroll:true});}
}

function selecionarModeloCamisaLojaPortal(modelo){
 document.getElementById('lojaProdutoModelo').value=modelo;
 atualizarModeloCamisaLojaPortal();
 mostrarMensagemLojaPortal('lojaProdutoMensagem','');
}

function selecionarPagamentoLojaPortal(opcao){
 if(enviandoPedidoLojaPortal)return;
 opcaoPagamentoLojaPortal=opcao==='TOTAL'?'TOTAL':'METADE';
 atualizarResumoPagamentoLojaPortal();
 mostrarMensagemLojaPortal('lojaMensagem','');
}

function mostrarConfirmacaoPedidoLojaPortal(texto){
 const el=document.getElementById('lojaConfirmacaoPedido');
 if(!el)return;
 el.textContent=texto||'';
 el.classList.toggle('oculto',!texto);
 if(texto)el.scrollIntoView({behavior:'smooth',block:'nearest'});
}


function chaveCarrinhoLojaPortal(){
 return 'SIGA_LOJA_CARRINHO_'+String(tokenAluno||'SEM_TOKEN');
}

function inicializarLojaPortal(){
 if(!carrinhoLojaPortalCarregado){
  try{
   const salvo=JSON.parse(localStorage.getItem(chaveCarrinhoLojaPortal())||'[]');
   carrinhoLojaPortal=Array.isArray(salvo)?salvo
    .filter(i=>LOJA_PORTAL_CONFIG[i.tipo]&&i.tamanho&&Number(i.quantidade)>0)
    .map(i=>{
      if(i.tipo!=='CAMISA')return i;
      let modelo=String(i.modelo||'').toUpperCase();
      let tamanho=String(i.tamanho||'').toUpperCase();
      if(!modelo){
        modelo=tamanho.includes('SEM MANGA')?'SEM_MANGA':'COM_MANGA';
        tamanho=tamanho.replace(/\s+SEM\s+MANGA$/i,'').trim();
      }
      return {...i,modelo,tamanho};
    }):[];
  }catch(e){carrinhoLojaPortal=[];}
  carrinhoLojaPortalCarregado=true;
 }

 const fotosCamisa=Array.from(document.querySelectorAll('.camisas-fotos-vitrine>button'));
 if(fotosCamisa[0]){
  fotosCamisa[0].dataset.modelo='COM_MANGA';
  fotosCamisa[0].setAttribute('aria-label','Camisa CAGE com manga · 1ª foto');
  let rotulo=fotosCamisa[0].querySelector('.modelo-camisa-rotulo');
  if(!rotulo){rotulo=document.createElement('span');rotulo.className='modelo-camisa-rotulo';fotosCamisa[0].appendChild(rotulo);}
  rotulo.textContent='Com manga';
 }
 if(fotosCamisa[1]){
  fotosCamisa[1].dataset.modelo='SEM_MANGA';
  fotosCamisa[1].setAttribute('aria-label','Camisa CAGE sem manga · 2ª foto');
  let rotulo=fotosCamisa[1].querySelector('.modelo-camisa-rotulo');
  if(!rotulo){rotulo=document.createElement('span');rotulo.className='modelo-camisa-rotulo';fotosCamisa[1].appendChild(rotulo);}
  rotulo.textContent='Sem manga';
 }

 const fotoCalca=document.querySelector('.produto-card-calca .produto-imagem');
 if(fotoCalca&&!fotoCalca.dataset.galeriaAtiva){
  fotoCalca.dataset.galeriaAtiva='1';
  fotoCalca.setAttribute('role','button');
  fotoCalca.setAttribute('tabindex','0');
  fotoCalca.setAttribute('aria-label','Ver fotos ampliadas da calça');
  fotoCalca.addEventListener('click',abrirGaleriaCalcaLojaPortal);
  fotoCalca.addEventListener('keydown',e=>{
   if(e.key==='Enter'||e.key===' '){e.preventDefault();abrirGaleriaCalcaLojaPortal();}
  });
 }
 renderCarrinhoLojaPortal();
}

function obterFotosCalcaLojaPortal(){
 if(typeof FOTOS_CALCA_PORTAL==='undefined'||!Array.isArray(FOTOS_CALCA_PORTAL))return [];
 return FOTOS_CALCA_PORTAL.filter(Boolean);
}

function abrirGaleriaCalcaLojaPortal(){
 const fotos=obterFotosCalcaLojaPortal();
 if(!fotos.length){abrirAdicionarProdutoLojaPortal('CALCA');return;}
 indiceGaleriaCalcaLojaPortal=Math.min(indiceGaleriaCalcaLojaPortal,fotos.length-1);
 renderGaleriaCalcaLojaPortal();
 document.getElementById('modalGaleriaCalcaLoja')?.classList.remove('oculto');
 document.body.classList.add('loja-modal-aberto');
}

function fecharGaleriaCalcaLojaPortal(){
 document.getElementById('modalGaleriaCalcaLoja')?.classList.add('oculto');
 if(document.getElementById('modalAdicionarProdutoLoja')?.classList.contains('oculto')&&document.getElementById('modalCarrinhoLoja')?.classList.contains('oculto'))document.body.classList.remove('loja-modal-aberto');
}

function renderGaleriaCalcaLojaPortal(){
 const fotos=obterFotosCalcaLojaPortal();
 if(!fotos.length)return;
 indiceGaleriaCalcaLojaPortal=(indiceGaleriaCalcaLojaPortal+fotos.length)%fotos.length;
 const imagem=document.getElementById('lojaGaleriaCalcaImagem');
 const contador=document.getElementById('lojaGaleriaCalcaContador');
 const miniaturas=document.getElementById('lojaGaleriaCalcaMiniaturas');
 if(imagem)imagem.src=fotos[indiceGaleriaCalcaLojaPortal];
 if(contador)contador.textContent=(indiceGaleriaCalcaLojaPortal+1)+' / '+fotos.length;
 if(miniaturas)miniaturas.innerHTML=fotos.map((src,i)=>'<button type="button" class="'+(i===indiceGaleriaCalcaLojaPortal?'ativa':'')+'" onclick="selecionarFotoGaleriaCalcaLojaPortal('+i+')" aria-label="Ver foto '+(i+1)+'"><img src="'+src+'" alt="Miniatura '+(i+1)+' da calça"></button>').join('');
}

function mudarFotoGaleriaCalcaLojaPortal(delta){
 indiceGaleriaCalcaLojaPortal+=Number(delta||0);
 renderGaleriaCalcaLojaPortal();
}

function selecionarFotoGaleriaCalcaLojaPortal(indice){
 indiceGaleriaCalcaLojaPortal=Number(indice||0);
 renderGaleriaCalcaLojaPortal();
}

function continuarCalcaCarrinhoLojaPortal(){
 fecharGaleriaCalcaLojaPortal();
 abrirAdicionarProdutoLojaPortal('CALCA');
}

function salvarCarrinhoLocalLojaPortal(){
 try{localStorage.setItem(chaveCarrinhoLojaPortal(),JSON.stringify(carrinhoLojaPortal));}catch(e){}
}

function moedaLojaPortal(valor){
 return Number(valor||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
}

function abrirAdicionarProdutoLojaPortal(tipo){
 inicializarLojaPortal();
 mostrarConfirmacaoPedidoLojaPortal('');
 tipo=String(tipo||'').toUpperCase();
 const cfg=LOJA_PORTAL_CONFIG[tipo];
 if(!cfg)return;
 quantidadeProdutoLojaPortal=1;
 document.getElementById('lojaProdutoTipo').value=tipo;
 document.getElementById('lojaProdutoTitulo').textContent=cfg.nome;

 const modeloWrap=document.getElementById('lojaProdutoModeloWrap');
 const modelo=document.getElementById('lojaProdutoModelo');
 mostrarMensagemLojaPortal('lojaProdutoMensagem','');
 document.getElementById('lojaProdutoTamanhoLabel').textContent=tipo==='CAMISA'?'2. Escolha o tamanho':'1. Escolha o tamanho';

 if(tipo==='CAMISA'){
  if(modeloWrap)modeloWrap.classList.remove('oculto');
  if(modelo)modelo.value='';
  document.querySelectorAll('input[name=lojaModeloCamisa]').forEach(el=>el.checked=false);
  document.getElementById('lojaProdutoDescricao').textContent='Escolha o modelo, o tamanho e a quantidade antes de adicionar.';
  atualizarModeloCamisaLojaPortal();
 }else{
  if(modeloWrap)modeloWrap.classList.add('oculto');
  document.getElementById('lojaProdutoTamanho').disabled=false;
  document.getElementById('lojaProdutoTamanhoAjuda').textContent='Tamanhos disponíveis para a calça jogger.';
  document.getElementById('lojaProdutoDescricao').textContent='Escolha o tamanho e a quantidade antes de adicionar.';
  document.getElementById('lojaProdutoTamanho').innerHTML='<option value="">Selecione o tamanho</option>'+cfg.tamanhos.map(t=>'<option value="'+escAluno(t)+'">'+escAluno(t)+'</option>').join('');
 }

 document.getElementById('lojaProdutoQuantidade').textContent='1';
 document.getElementById('lojaProdutoSubtotal').textContent=moedaLojaPortal(cfg.preco);
 document.getElementById('modalAdicionarProdutoLoja').classList.remove('oculto');
 document.body.classList.add('loja-modal-aberto');
}

function atualizarModeloCamisaLojaPortal(){
 if(document.getElementById('lojaProdutoTipo')?.value!=='CAMISA')return;
 const codigo=document.getElementById('lojaProdutoModelo')?.value||'';
 const modelo=LOJA_PORTAL_CONFIG.CAMISA.modelos[codigo];
 const select=document.getElementById('lojaProdutoTamanho');
 select.disabled=!modelo;
 select.innerHTML='<option value="">'+(modelo?'Selecione o tamanho':'Escolha o modelo primeiro')+'</option>'+(modelo?modelo.tamanhos.map(t=>'<option value="'+escAluno(t)+'">'+escAluno(t)+'</option>').join(''):'');
 document.getElementById('lojaProdutoTamanhoAjuda').textContent=modelo?'Tamanhos da camisa '+modelo.nome.toLowerCase()+'.':'Escolha o modelo para ver os tamanhos disponíveis.';
}

function fecharAdicionarProdutoLojaPortal(){
 const modal=document.getElementById('modalAdicionarProdutoLoja');
 if(modal)modal.classList.add('oculto');
 if(document.getElementById('modalCarrinhoLoja')?.classList.contains('oculto'))document.body.classList.remove('loja-modal-aberto');
}

function alterarQuantidadeProdutoLojaPortal(delta){
 quantidadeProdutoLojaPortal=Math.min(10,Math.max(1,quantidadeProdutoLojaPortal+Number(delta||0)));
 const tipo=document.getElementById('lojaProdutoTipo').value;
 const cfg=LOJA_PORTAL_CONFIG[tipo];
 document.getElementById('lojaProdutoQuantidade').textContent=String(quantidadeProdutoLojaPortal);
 document.getElementById('lojaProdutoSubtotal').textContent=moedaLojaPortal((cfg?.preco||0)*quantidadeProdutoLojaPortal);
}

function confirmarAdicionarProdutoLojaPortal(){
 const tipo=document.getElementById('lojaProdutoTipo').value;
 const tamanho=document.getElementById('lojaProdutoTamanho').value;
 const cfg=LOJA_PORTAL_CONFIG[tipo];
 if(!cfg)return;

 const modelo=tipo==='CAMISA'
  ?(document.getElementById('lojaProdutoModelo')?.value||'')
  :'';

 const modeloCfg=tipo==='CAMISA'?cfg.modelos[modelo]:null;
 if(tipo==='CAMISA'&&!modeloCfg){mostrarMensagemLojaPortal('lojaProdutoMensagem','Escolha a camisa com manga ou sem manga.','erro');return;}
 if(!tamanho||!(modeloCfg?modeloCfg.tamanhos:cfg.tamanhos).includes(tamanho)){mostrarMensagemLojaPortal('lojaProdutoMensagem','Selecione um tamanho válido.','erro');return;}
 if(totaisCarrinhoLojaPortal().quantidade+quantidadeProdutoLojaPortal>20){mostrarMensagemLojaPortal('lojaProdutoMensagem','O pedido pode ter no máximo 20 peças.','erro');return;}

 const existente=carrinhoLojaPortal.find(i=>i.tipo===tipo&&i.tamanho===tamanho&&String(i.modelo||'')===modelo);
 if(existente&&Number(existente.quantidade)+quantidadeProdutoLojaPortal>10){mostrarMensagemLojaPortal('lojaProdutoMensagem','Você pode adicionar até 10 peças do mesmo modelo e tamanho.','erro');return;}
 if(existente)existente.quantidade=Number(existente.quantidade||0)+quantidadeProdutoLojaPortal;
 else carrinhoLojaPortal.push({
  tipo,
  nome:cfg.nome,
  modelo:tipo==='CALCA'?'JOGGER_CAGE_PRETA':modelo,
  modeloNome:tipo==='CALCA'?(cfg.modelo||'Jogger CAGE preta'):(modeloCfg?.nome||''),
  tamanho,
  quantidade:quantidadeProdutoLojaPortal,
  preco:cfg.preco
 });
 salvarCarrinhoLocalLojaPortal();
 renderCarrinhoLojaPortal();
 fecharAdicionarProdutoLojaPortal();
 abrirCarrinhoLojaPortal();
 mostrarMensagemLojaPortal('lojaMensagem','Produto adicionado ao carrinho. Você pode comprar mais ou finalizar o pedido.','sucesso');
}

function abrirCarrinhoLojaPortal(){
 inicializarLojaPortal();
 mostrarMensagemLojaPortal('lojaMensagem','');
 document.getElementById('modalCarrinhoLoja').classList.remove('oculto');
 document.body.classList.add('loja-modal-aberto');
}

function fecharCarrinhoLojaPortal(){
 if(enviandoPedidoLojaPortal)return;
 const modal=document.getElementById('modalCarrinhoLoja');
 if(modal)modal.classList.add('oculto');
 document.body.classList.remove('loja-modal-aberto');
}

function continuarComprandoLojaPortal(){
 if(enviandoPedidoLojaPortal)return;
 fecharCarrinhoLojaPortal();
 const telaLoja=document.querySelector('.pa-tela[data-tela="loja"]');
 if(telaLoja&&telaLoja.classList.contains('oculto')&&typeof mostrarTelaPortalAluno==='function'){
  mostrarTelaPortalAluno('loja');
 }
 window.requestAnimationFrame(()=>{
  const produtos=document.querySelector('.loja-produtos-grid');
  if(produtos)produtos.scrollIntoView({behavior:'smooth',block:'start'});
 });
}

function irParaFinalizacaoLojaPortal(){
 if(!carrinhoLojaPortal.length){
  mostrarMensagemLojaPortal('lojaMensagem','Adicione pelo menos um produto ao carrinho.','erro');
  return;
 }
 const checkout=document.getElementById('lojaCheckout');
 if(!checkout)return;
 checkout.classList.remove('oculto');
 const painel=checkout.closest('.loja-modal-carrinho');
 if(painel&&typeof painel.scrollTo==='function')painel.scrollTo({top:checkout.offsetTop-20,behavior:'smooth'});
 else checkout.scrollIntoView({behavior:'smooth',block:'start'});
 window.setTimeout(()=>{
  document.querySelector('input[name=lojaOpcaoPagamento]:checked')?.focus({preventScroll:true});
 },450);
}

function alterarQuantidadeCarrinhoLojaPortal(indice,delta){
 if(enviandoPedidoLojaPortal)return;
 if(delta>0&&totaisCarrinhoLojaPortal().quantidade>=20){mostrarMensagemLojaPortal('lojaMensagem','O pedido pode ter no máximo 20 peças.','erro');return;}
 mostrarMensagemLojaPortal('lojaMensagem','');
 const item=carrinhoLojaPortal[indice];
 if(!item)return;
 item.quantidade=Number(item.quantidade||0)+Number(delta||0);
 if(item.quantidade<=0)carrinhoLojaPortal.splice(indice,1);
 else item.quantidade=Math.min(10,item.quantidade);
 salvarCarrinhoLocalLojaPortal();
 renderCarrinhoLojaPortal();
}

function removerItemCarrinhoLojaPortal(indice){
 if(enviandoPedidoLojaPortal)return;
 mostrarMensagemLojaPortal('lojaMensagem','');
 carrinhoLojaPortal.splice(indice,1);
 salvarCarrinhoLocalLojaPortal();
 renderCarrinhoLojaPortal();
}

function totaisCarrinhoLojaPortal(){
 const quantidade=carrinhoLojaPortal.reduce((s,i)=>s+Number(i.quantidade||0),0);
 const total=carrinhoLojaPortal.reduce((s,i)=>s+(Number(i.preco||65)*Number(i.quantidade||0)),0);
 return {quantidade,total,sinal:total/2};
}

function renderCarrinhoLojaPortal(){
 const box=document.getElementById('lojaCarrinhoItens');
 if(!box)return;
 const totais=totaisCarrinhoLojaPortal();
 const flutuante=document.getElementById('lojaCarrinhoFlutuante');
 const badge=document.getElementById('lojaCarrinhoBadge');
 if(badge)badge.textContent=String(totais.quantidade);
 if(flutuante)flutuante.classList.toggle('oculto',totais.quantidade===0);
 const resumo=document.getElementById('statusCamisaResumoV3');
 if(resumo)resumo.textContent=totais.quantidade?totais.quantidade+' '+(totais.quantidade===1?'item':'itens')+' · '+moedaLojaPortal(totais.total):'Adicione camisas e calças ao mesmo carrinho.';

 if(!carrinhoLojaPortal.length){
  box.innerHTML='<div class="loja-carrinho-vazio"><strong>Seu carrinho está vazio.</strong><p>Adicione uma camisa, uma calça ou as duas juntas.</p></div>';
 }else{
  box.innerHTML=carrinhoLojaPortal.map((i,indice)=>{
   const modelo=i.tipo==='CAMISA'
    ? (i.modeloNome||(i.modelo==='SEM_MANGA'?'Sem manga':'Com manga'))
    : i.tipo==='CALCA'
      ? (i.modeloNome||'Jogger CAGE preta')
      : '';
   const detalhe=(modelo?modelo+' · ':'')+'Tamanho '+i.tamanho+' · '+moedaLojaPortal(i.preco)+' cada';
   return '<article class="loja-carrinho-item"><div><h3>'+escAluno(i.nome)+'</h3><p>'+escAluno(detalhe)+'</p></div><strong>'+moedaLojaPortal(Number(i.preco)*Number(i.quantidade))+'</strong><div class="loja-item-acoes"><div><button type="button" onclick="alterarQuantidadeCarrinhoLojaPortal('+indice+',-1)">−</button><b>'+Number(i.quantidade)+'</b><button type="button" onclick="alterarQuantidadeCarrinhoLojaPortal('+indice+',1)">＋</button></div><button class="loja-remover" type="button" onclick="removerItemCarrinhoLojaPortal('+indice+')">Remover</button></div></article>';
  }).join('');
 }

 document.getElementById('lojaCheckout').classList.toggle('oculto',!carrinhoLojaPortal.length);
 document.getElementById('lojaCarrinhoTotal').textContent=moedaLojaPortal(totais.total);
 document.getElementById('lojaCarrinhoSinal').textContent=moedaLojaPortal(totais.sinal);

 atualizarResumoPagamentoLojaPortal();
}

function atualizarResumoPagamentoLojaPortal(){
 const totais=totaisCarrinhoLojaPortal();
 const pago=opcaoPagamentoLojaPortal==='TOTAL'?totais.total:totais.sinal;
 document.getElementById('lojaValorPago').value=pago.toFixed(2);
 document.getElementById('lojaPagamentoMetade').checked=opcaoPagamentoLojaPortal==='METADE';
 document.getElementById('lojaPagamentoTotal').checked=opcaoPagamentoLojaPortal==='TOTAL';
 document.getElementById('lojaPagamentoMetadeValor').textContent=moedaLojaPortal(totais.sinal);
 document.getElementById('lojaPagamentoTotalValor').textContent=moedaLojaPortal(totais.total);
 const falta=document.getElementById('lojaValorFaltante');
 if(falta)falta.textContent=pago===totais.total?'Sem saldo restante após este pagamento.':'Restante a pagar: '+moedaLojaPortal(totais.total-pago);
}

function alternarPixLojaPortal(){
 const forma=document.getElementById('lojaFormaPagamento').value;
 document.getElementById('lojaPixBox').classList.toggle('oculto',forma!=='PIX');
}

async function copiarPixLojaPortal(){
 const campo=document.getElementById('lojaPixChave');
 try{
  await navigator.clipboard.writeText(campo.value);
  mostrarMensagemLojaPortal('lojaMensagem','Chave PIX copiada.');
 }catch(e){
  mostrarMensagemLojaPortal('lojaMensagem','Selecione e copie a chave PIX no campo abaixo.');
  campo.focus();campo.select();campo.setSelectionRange(0,campo.value.length);
 }
}

function finalizarPedidoLojaPortal(){
 if(enviandoPedidoLojaPortal)return;
 const totais=totaisCarrinhoLojaPortal();
 const forma=document.getElementById('lojaFormaPagamento').value;
 const valorPago=Number(document.getElementById('lojaValorPago').value||0);
 const arquivo=document.getElementById('lojaComprovante').files[0];
 const btn=document.getElementById('lojaFinalizarPedido');
 const aviso=(texto,tipo)=>mostrarMensagemLojaPortal('lojaMensagem',texto,tipo);
 aviso('');
 if(!carrinhoLojaPortal.length){aviso('O carrinho está vazio.','erro');return;}
 if(!Number.isFinite(valorPago)||(valorPago!==totais.sinal&&valorPago!==totais.total)){aviso('Selecione metade ou o total do pedido.','erro');return;}
 if(forma==='PIX'&&!arquivo){aviso('Envie o comprovante do PIX.','erro');return;}
 if(arquivo&&(!/^(image\/(jpeg|png|webp)|application\/pdf)$/i.test(arquivo.type)||arquivo.size>5*1024*1024)){aviso('Envie uma imagem JPG, PNG, WEBP ou PDF de até 5 MB.','erro');return;}
 const dados={itens:carrinhoLojaPortal.map(i=>({tipo:i.tipo,modelo:i.modelo||'',tamanho:i.tamanho,quantidade:Number(i.quantidade)})),valorPago,opcaoPagamento:opcaoPagamentoLojaPortal,formaPagamento:forma};
 const sessao=tokenAluno;
 enviandoPedidoLojaPortal=true;
 const controles=Array.from(document.querySelectorAll('#modalCarrinhoLoja button,#modalCarrinhoLoja input,#modalCarrinhoLoja select'));
 const estados=controles.map(el=>el.disabled);
 controles.forEach(el=>el.disabled=true);
 btn.textContent='Enviando pedido...';
 const finalizar=()=>{enviandoPedidoLojaPortal=false;controles.forEach((el,i)=>el.disabled=estados[i]);btn.textContent='Finalizar pedido';};
 const falhou=e=>{finalizar();if(sessao===tokenAluno)aviso(e?.message||String(e),'erro');};
 const enviar=comprovante=>{
  try{
   google.script.run.withSuccessHandler(r=>{
    finalizar();
    if(sessao!==tokenAluno)return;
    if(!r||!r.sucesso){aviso(r?.mensagem||'Não foi possível confirmar o pedido.','erro');return;}
    carrinhoLojaPortal=[];
    opcaoPagamentoLojaPortal='METADE';
    salvarCarrinhoLocalLojaPortal();
    renderCarrinhoLojaPortal();
    document.getElementById('lojaComprovante').value='';
    aviso('');
    mostrarConfirmacaoPedidoLojaPortal(
      'Compra realizada com sucesso! ' +
      (r.pedidoId ? 'Pedido '+r.pedidoId+'. ' : '') +
      'A encomenda será realizada quando o lote deste produto atingir o mínimo de 10 pedidos.'
    );
   }).withFailureHandler(falhou).salvarCarrinhoPortalAluno(sessao,{...dados,comprovante});
  }catch(e){falhou(e);}
 };
 if(!arquivo){enviar(null);return;}
 const leitor=new FileReader();
 leitor.onerror=()=>falhou(new Error('Não foi possível ler o comprovante.'));
 leitor.onload=()=>enviar({mimeType:arquivo.type,base64:leitor.result});
 leitor.readAsDataURL(arquivo);
}
