// LEVIATHAN ACCOUNTS - DESIGN PROFISSIONAL PREMIUM - ESTILO LOJA GRINGA
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, PermissionFlagsBits, ChannelType, REST, Routes, AttachmentBuilder } = require('discord.js');

const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID || null;
const CATEGORIA_TICKET_ID = process.env.CATEGORIA_TICKET_ID || null;
const CANAL_VENDAS_ID = process.env.CANAL_VENDAS_ID || null;
const CANAL_AVALIACOES_ID = process.env.CANAL_AVALIACOES_ID || '1554485743278100602';
const PIX_KEY = process.env.PIX_KEY || 'ce767a59-4472-4fc8-8f5e-5189f97d6bf1';
const PIX_NOME = process.env.PIX_NOME || 'Leviathan Accounts';
const ESTOQUE_FILE = './estoque.json';
const PAINEL_FILE = './painel.json';
const CLIENTES_FILE = './clientes.json';
const AVALIACOES_FILE = './avaliacoes.json';

// ===== SISTEMA DE CARGOS AUTOMÁTICOS POR VALOR GASTO - VALORES ATUALIZADOS =====
const CARGOS_CLIENTE = [
  { nome: 'Cliente Eterno「🏆」', minimo: 400, busca: 'eterno', id: process.env.CARGO_ETERNO_ID || null },
  { nome: 'Ultra Cliente「🏅」', minimo: 100, busca: 'ultra', id: process.env.CARGO_ULTRA_ID || null },
  { nome: 'Mega Cliente「🔥」', minimo: 50, busca: 'mega', id: process.env.CARGO_MEGA_ID || null },
  { nome: 'Cliente VIP「👑」', minimo: 25, busca: 'vip', id: process.env.CARGO_VIP_ID || null },
  { nome: 'Cliente「😎」', minimo: 1, busca: 'cliente', id: process.env.CARGO_CLIENTE_ID || null },
];
// Ordem decrescente para pegar o maior que se qualifica

try {
  const express = require('express');
  const app = express();
  app.use(express.json({limit: '5mb'}));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));
  
  app.get('/', (req, res) => res.send('Leviathan Professional ON - Bot Online ✅'));

  // PAINEL ULTRA FÁCIL V3 - ARRASTA E SOLTA
  app.get('/admin', (req, res) => {
    const estoque = carregar();
    const total = estoque.reduce((a,c)=>a+c.opcoes.reduce((x,y)=>x+y.contas.length,0),0);
    const opcoesList = estoque.flatMap(c=> c.opcoes.map(o=> ({comboId:c.id, comboTitulo:c.titulo, label:o.label, preco:o.preco, qtd:o.contas.length })));
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Leviathan - Super Fácil</title>
    <style>
      *{box-sizing:border-box} body{font-family:Inter,Arial;background:#0a0a0a;color:#fff;padding:15px;max-width:900px;margin:0 auto}
      .card{background:#171717;padding:22px;border-radius:16px;margin-bottom:18px;border:1px solid #2a2a2a}
      h1{color:#FFD700;font-size:24px} h2{font-size:18px;margin-top:0}
      input,select,textarea{width:100%;padding:12px;margin:6px 0 12px 0;border-radius:10px;border:1px solid #333;background:#111;color:#fff;font-size:14px}
      button{background:#FFD700;color:#000;font-weight:900;padding:14px 20px;border:none;border-radius:10px;cursor:pointer;width:100%;font-size:16px}
      button:hover{background:#ffea00} .drop{border:2px dashed #FFD700;background:#1a1a00;padding:30px;text-align:center;border-radius:14px;cursor:pointer;margin:10px 0}
      .drop.drag{border-color:#00ff7f;background:#001a00}
      .prod{background:#222;padding:12px;border-radius:10px;margin:8px 0;font-size:13px}
      .ok{color:#00ff7f} .off{color:#ff4444} .badge{background:#333;padding:3px 8px;border-radius:6px;font-size:12px}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      @media(max-width:600px){.grid{grid-template-columns:1fr}}
    </style></head><body>
    <h1>⚡ LEVIATHAN - MODO SUPER FÁCIL</h1>
    <p>Arraste um .txt com contas ou cole no campo. 1 clique e já vai pro painel.</p>
    
    <div class="card" style="border-color:#FFD700">
      <h2>📥 PASSO 1 - Jogue suas contas aqui</h2>
      <div id="drop" class="drop">
        <div style="font-size:40px">📄</div>
        <b>ARRASTE SEU ARQUIVO .TXT AQUI</b><br>
        <span style="color:#aaa">ou clique para escolher</span><br>
        <span style="font-size:12px;color:#888">Formato: email:senha por linha</span>
        <input type="file" id="fileInput" accept=".txt,.csv" style="display:none">
      </div>
      <textarea id="contas" rows="8" placeholder="conta1@gmail.com:senha123&#10;conta2@gmail.com:senha456&#10;conta3@gmail.com:senha789"></textarea>
      <div id="preview" style="background:#111;padding:10px;border-radius:8px;margin-top:8px;display:none"></div>
    </div>

    <div class="card">
      <h2>📦 PASSO 2 - Onde colocar?</h2>
      <div class="grid">
        <div>
          <label>Produto Existente</label>
          <select id="produtoExistente">
            <option value="">-- Criar Produto NOVO --</option>
            ${opcoesList.map(o=> `<option value="${o.comboId}|${o.label}">${o.comboTitulo} > ${o.label} (${o.qtd}) - R$ ${o.preco}</option>`).join('')}
          </select>
        </div>
        <div>
          <label>Ou selecione o plano existente</label>
          <select id="planoSelect">
            <option value="">-- Digitar novo --</option>
            ${[...new Set(opcoesList.map(o=>o.label))].map(l=> `<option value="${l}">${l}</option>`).join('')}
          </select>
        </div>
      </div>
      
      <div id="novoProduto" style="background:#111;padding:15px;border-radius:10px;margin-top:10px">
        <h3 style="margin:0 0 10px 0">🆕 Novo Produto (só se não existir)</h3>
        <div class="grid">
          <div><label>ID (ex: sanguine-vip)</label><input id="id" placeholder="sanguine-vip"></div>
          <div><label>Título (ex: SANGUINE ART)</label><input id="titulo" placeholder="SANGUINE ART"></div>
        </div>
        <label>Banner URL</label><input id="banner" placeholder="https://i.imgur.com/xxx.png" value="https://i.imgur.com/8QJ4sQy.png">
        <div class="grid">
          <div><label>Nome do Plano</label><input id="plano" placeholder="SANGUINE + CDK"></div>
          <div><label>Preço</label><input id="preco" placeholder="9,99" value="9,99"></div>
        </div>
      </div>
      <button onclick="enviar()" id="btnEnviar" style="margin-top:15px">🚀 ADICIONAR AGORA - 1 CLIQUE</button>
      <div id="resultado" style="margin-top:15px"></div>
    </div>

    <div class="card">
      <h2>📊 Estoque Atual: ${total} contas</h2>
      ${estoque.map(c=> `<div class="prod"><b>${c.titulo}</b> <span class="badge">${c.id}</span><br>${c.opcoes.map(o=> `&nbsp;&nbsp; ${o.contas.length>0?'<span class=ok>🟢</span>':'<span class=off>🔴</span>'} <b>${o.label}</b> - R$ ${o.preco} - ${o.contas.length} unid.`).join('<br>')}</div>`).join('')}
    </div>

    <script>
      const drop = document.getElementById('drop');
      const fileInput = document.getElementById('fileInput');
      const contasTa = document.getElementById('contas');
      const preview = document.getElementById('preview');
      const produtoExistente = document.getElementById('produtoExistente');
      const planoSelect = document.getElementById('planoSelect');

      function parseContas(text){
        return text.split(/\n|\r/).map(s=>s.trim()).filter(Boolean).filter(s=>s.includes(':'));
      }
      function updatePreview(){
        const lista = parseContas(contasTa.value);
        if(lista.length>0){
          preview.style.display='block';
          preview.innerHTML = '<b class=ok>✅ ' + lista.length + ' contas detectadas</b><br><span style=color:#888>' + lista.slice(0,3).join('<br>') + (lista.length>3?'<br>... +'+(lista.length-3):'') + '</span>';
        } else {
          preview.style.display='none';
        }
      }
      contasTa.addEventListener('input', updatePreview);

      drop.addEventListener('click', ()=> fileInput.click());
      drop.addEventListener('dragover', e=> {e.preventDefault(); drop.classList.add('drag')});
      drop.addEventListener('dragleave', ()=> drop.classList.remove('drag'));
      drop.addEventListener('drop', e=> {
        e.preventDefault(); drop.classList.remove('drag');
        const file = e.dataTransfer.files[0];
        if(file) lerArquivo(file);
      });
      fileInput.addEventListener('change', e=>{
        const file = e.target.files[0];
        if(file) lerArquivo(file);
      });
      function lerArquivo(file){
        const reader = new FileReader();
        reader.onload = e=> { contasTa.value = e.target.result; updatePreview(); };
        reader.readAsText(file);
      }

      produtoExistente.addEventListener('change', ()=>{
        if(produtoExistente.value){
          document.getElementById('novoProduto').style.display='none';
          const [cid, label] = produtoExistente.value.split('|');
          document.getElementById('id').value = cid;
          document.getElementById('plano').value = label;
        } else {
          document.getElementById('novoProduto').style.display='block';
        }
      });
      planoSelect.addEventListener('change', ()=>{
        if(planoSelect.value) document.getElementById('plano').value = planoSelect.value;
      });

      async function enviar(){
        const contas = contasTa.value.trim();
        if(!contas){ alert('Cole as contas primeiro!'); return; }
        const lista = parseContas(contas);
        if(lista.length===0){ alert('Nenhuma conta válida! Use formato email:senha'); return; }
        
        let payload = { contas };
        if(produtoExistente.value){
          const [id, plano] = produtoExistente.value.split('|');
          payload.id = id;
          payload.plano = plano;
          payload.modo = 'existente';
        } else {
          payload.id = document.getElementById('id').value.trim();
          payload.titulo = document.getElementById('titulo').value.trim();
          payload.banner = document.getElementById('banner').value.trim();
          payload.plano = document.getElementById('plano').value.trim();
          payload.preco = document.getElementById('preco').value.trim();
          payload.modo = 'novo';
          if(!payload.id || !payload.titulo || !payload.plano){ alert('Preencha ID, Título e Plano!'); return; }
        }

        const btn = document.getElementById('btnEnviar');
        btn.innerText = '⏳ Enviando...';
        btn.disabled = true;
        try{
          const res = await fetch('/admin/add-v2', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
          const data = await res.json();
          if(data.ok){
            document.getElementById('resultado').innerHTML = '<div style=background:#002a00;padding:15px;border-radius:10px;border:1px solid #00ff7f><b class=ok>✅ ' + data.added + ' contas adicionadas!</b><br>Produto: ' + data.produto + ' > ' + data.plano + '<br>Total agora: ' + data.total + ' unidades<br><br><a href="/admin" style=color:#FFD700>🔄 Recarregar página</a> | No Discord digite /painel-vendas para atualizar</div>';
            contasTa.value = '';
            updatePreview();
          } else {
            document.getElementById('resultado').innerHTML = '<div style=background:#2a0000;padding:15px;border-radius:10px;color:#ff5555>❌ Erro: '+data.error+'</div>';
          }
        }catch(e){
          document.getElementById('resultado').innerHTML = '❌ Erro de conexão: '+e.message;
        }
        btn.innerText = '🚀 ADICIONAR AGORA - 1 CLIQUE';
        btn.disabled = false;
      }
    </script>
    </body></html>`;
    res.send(html);
  });

  app.post('/admin/add-v2', (req, res) => {
    try{
      const {id, titulo, banner, plano, preco, contas, modo} = req.body;
      if(!contas) return res.json({ok:false, error:'Sem contas'});
      const estoque = carregar();
      let combo = estoque.find(c=>c.id===id);
      
      if(modo==='existente'){
        if(!combo) return res.json({ok:false, error:'Produto não encontrado'});
        let opcao = combo.opcoes.find(o=>o.label===plano);
        if(!opcao) return res.json({ok:false, error:'Plano não encontrado'});
        const lista = contas.split(/\n|\r/).flatMap(l=>l.split(/[,; ]+/)).map(s=>s.trim()).filter(Boolean).filter(s=>s.includes(':'));
        opcao.contas.push(...lista);
        salvar(estoque);
        return res.json({ok:true, added: lista.length, produto: combo.titulo, plano: opcao.label, total: opcao.contas.length});
      } else {
        if(!id || !titulo || !plano) return res.json({ok:false, error:'ID, Título e Plano obrigatórios'});
        if(!combo){
          combo = {id, titulo: titulo||id, banner: banner||'https://i.imgur.com/8QJ4sQy.png', opcoes:[]};
          estoque.push(combo);
        }
        let opcao = combo.opcoes.find(o=>o.label.toLowerCase()===plano.toLowerCase());
        if(!opcao){
          opcao = {id: String(Date.now()), label: plano, preco: preco||'9,99', contas:[]};
          combo.opcoes.push(opcao);
        } else {
          if(preco) opcao.preco = preco;
        }
        const lista = contas.split(/\n|\r/).flatMap(l=>l.split(/[,; ]+/)).map(s=>s.trim()).filter(Boolean).filter(s=>s.includes(':'));
        if(lista.length===0) return res.json({ok:false, error:'Nenhuma conta válida (use email:senha)'});
        opcao.contas.push(...lista);
        salvar(estoque);
        return res.json({ok:true, added: lista.length, produto: combo.titulo, plano: opcao.label, total: opcao.contas.length});
      }
    }catch(e){ res.json({ok:false, error: e.message}); }
  });

  app.post('/admin/add', (req, res) => {
    try{
      const {id, titulo, banner, plano, preco, contas} = req.body;
      const estoque = carregar();
      let combo = estoque.find(c=>c.id===id);
      if(!combo){
        combo = {id, titulo, banner, opcoes:[]};
        estoque.push(combo);
      }
      let opcao = combo.opcoes.find(o=>o.label===plano);
      if(!opcao){
        opcao = {id: String(Date.now()), label: plano, preco, contas:[]};
        combo.opcoes.push(opcao);
      } else {
        opcao.preco = preco;
      }
      const lista = (contas||'').split(/\n|\r| |,|;/).map(s=>s.trim()).filter(Boolean).filter(s=>s.includes(':')||s.includes('@'));
      opcao.contas.push(...lista);
      salvar(estoque);
      res.send('<h1>✅ Produto adicionado!</h1><p>'+lista.length+' contas adicionadas em '+plano+'</p><a href="/admin">Voltar</a> - Agora digite /painel-vendas no Discord para atualizar');
    }catch(e){ res.send('Erro: '+e.message); }
  });

  app.listen(process.env.PORT || 3000, () => console.log('🚀 Server ON + Admin SUPER FÁCIL em /admin'));
} catch {}

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMembers, 
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildEmojisAndStickers
  ] 
});

// Anti-duplicação de carrinho - evita criar 2 tickets se clicar 2x rápido
const comprasRecentes = new Map(); // userId -> timestamp

function carregar() { 
  try {
    if (!fs.existsSync(ESTOQUE_FILE)) { 
      console.log('⚠️ estoque.json não existe, criando com estoque padrão...');
      const padrao = [
        {
          "id": "combo-sanguine",
          "titulo": "SANGUINE ART",
          "banner": "",
          "opcoes": [
            {
              "id": "1",
              "label": "SANGUINE ART + CDK",
              "preco": "9,99",
              "contas": [
                "conta1.leviathan@gmail.com:Leviathan123 - CONTA FAKE 1",
                "conta2.leviathan@gmail.com:Leviathan456 - CONTA FAKE 2"
              ]
            },
            {
              "id": "2",
              "label": "SANGUINE ART + GOD HUMAN",
              "preco": "12,50",
              "contas": [
                "conta3.leviathan@gmail.com:Leviathan789 - CONTA FAKE 3"
              ]
            },
            {
              "id": "3",
              "label": "GOD HUMAN + TTK",
              "preco": "7,99",
              "contas": [
                "conta4.leviathan@gmail.com:Leviathan000 - CONTA FAKE 4"
              ]
            }
          ]
        }
      ];
      fs.writeFileSync(ESTOQUE_FILE, JSON.stringify(padrao, null, 2));
      return padrao; 
    }
    const data = fs.readFileSync(ESTOQUE_FILE, 'utf8');
    if(!data || data.trim()==='' || data.trim()==='[]'){
      console.log('⚠️ estoque.json vazio no Render, voltando com estoque padrão...');
      // No Render free o arquivo apaga a cada deploy, então volta com padrão
      try {
        const parsed = JSON.parse(data||'[]');
        if(parsed.length===0){
          const padrao = [
            {
              "id": "combo-sanguine",
              "titulo": "SANGUINE ART",
              "banner": "",
              "opcoes": [
                {"id": "1","label": "SANGUINE ART + CDK","preco": "9,99","contas": ["conta1.leviathan@gmail.com:Leviathan123 - CONTA FAKE 1","conta2.leviathan@gmail.com:Leviathan456 - CONTA FAKE 2"]},
                {"id": "2","label": "SANGUINE ART + GOD HUMAN","preco": "12,50","contas": ["conta3.leviathan@gmail.com:Leviathan789 - CONTA FAKE 3"]},
                {"id": "3","label": "GOD HUMAN + TTK","preco": "7,99","contas": ["conta4.leviathan@gmail.com:Leviathan000 - CONTA FAKE 4"]}
              ]
            }
          ];
          fs.writeFileSync(ESTOQUE_FILE, JSON.stringify(padrao, null, 2));
          return padrao;
        }
        return parsed;
      } catch(e){
        return [];
      }
    }
    const parsed = JSON.parse(data);
    // Se por acaso ficou vazio no Render, devolve padrão pra não mostrar "ESTOQUE VAZIO"
    if(parsed.length===0 || parsed.every(c=>c.opcoes.every(o=>o.contas.length===0))){
      console.log('⚠️ estoque.json zerado, restaurando padrão temporário');
      // Não salva, só retorna pra mostrar no painel, mas avisa
    }
    return parsed; 
  } catch(e){ 
    console.log('Erro carregar():', e.message);
    return []; 
  } 
}
function salvar(e) { fs.writeFileSync(ESTOQUE_FILE, JSON.stringify(e, null, 2)); }
function carregarPainel(){ if(!fs.existsSync(PAINEL_FILE)) return null; try{ return JSON.parse(fs.readFileSync(PAINEL_FILE,'utf8')); }catch{return null;} }
function salvarPainel(d){ fs.writeFileSync(PAINEL_FILE, JSON.stringify(d,null,2)); }
function carregarClientes(){
  if(!fs.existsSync(CLIENTES_FILE)) { fs.writeFileSync(CLIENTES_FILE, '{}'); return {}; }
  try { return JSON.parse(fs.readFileSync(CLIENTES_FILE,'utf8')); } catch { return {}; }
}
function salvarClientes(d){ fs.writeFileSync(CLIENTES_FILE, JSON.stringify(d,null,2)); }
function carregarAvaliacoes(){
  if(!fs.existsSync(AVALIACOES_FILE)) { fs.writeFileSync(AVALIACOES_FILE, '[]'); return []; }
  try { return JSON.parse(fs.readFileSync(AVALIACOES_FILE,'utf8')); } catch { return []; }
}
function salvarAvaliacoes(d){ fs.writeFileSync(AVALIACOES_FILE, JSON.stringify(d,null,2)); }
function isStaff(i) { return i.member?.roles?.cache?.has(STAFF_ROLE_ID); }
function getCargoPorValor(total){
  for(const cargo of CARGOS_CLIENTE){
    if(total >= cargo.minimo) return cargo;
  }
  return null;
}
function acharCargoPorNome(guild, nome){
  // Busca exata primeiro
  let role = guild.roles.cache.find(r => r.name.toLowerCase() === nome.toLowerCase());
  if(role) return role;
  // Busca por includes (para lidar com emojis e variações)
  const busca = nome.toLowerCase();
  role = guild.roles.cache.find(r => r.name.toLowerCase().includes(busca));
  if(role) return role;
  // Busca por palavra-chave (campo busca)
  const cargoInfo = CARGOS_CLIENTE.find(c => c.nome.toLowerCase() === busca);
  if(cargoInfo && cargoInfo.busca){
    role = guild.roles.cache.find(r => r.name.toLowerCase().includes(cargoInfo.busca));
    if(role) return role;
  }
  return null;
}
function acharCargoPorBusca(guild, termo){
  return guild.roles.cache.find(r => r.name.toLowerCase().includes(termo.toLowerCase()));
}
function isUrl(s){ try{ const u=new URL(s); return u.protocol==='http:'||u.protocol==='https:'; }catch{return false;} }
function acharBannerLocal(){
  try{
    // Prioridade máxima para seu banner oficial
    const candidatos = [
      './banner-leviathan.webp',
      './banner-leviathan.png',
      './banner-leviathan-680x240.png',
      './banner-leviathan-680x240-stretched.png',
      './banner.png',
      './banner.jpg'
    ];
    for(const p of candidatos){
      if(fs.existsSync(p)){
        console.log('✅ Banner local encontrado:', p);
        return p;
      }
    }
    const arqs = fs.readdirSync('.');
    const b = arqs.find(f => f.toLowerCase().includes('banner') && (f.endsWith('.png')||f.endsWith('.webp')||f.endsWith('.jpg')||f.endsWith('.jpeg')));
    if(b){
      console.log('✅ Banner genérico encontrado:', b);
      return './'+b;
    }
  }catch(e){ console.log('Erro acharBanner:', e.message); } 
  console.log('⚠️ Nenhum banner local encontrado');
  return null;
}

const commands = [
    new SlashCommandBuilder().setName('painel-vendas').setDescription('Envia painel profissional Leviathan').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    new SlashCommandBuilder().setName('setup-tickets').setDescription('🎫 Cria painel de tickets profissional (estilo loja gringa)').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
     .addChannelOption(o => o.setName('canal').setDescription('Canal onde vai o painel de tickets').setRequired(false))
     .addChannelOption(o => o.setName('categoria').setDescription('Categoria onde os tickets serão criados').setRequired(false))
     .addRoleOption(o => o.setName('cargo_staff').setDescription('Cargo da equipe que vê os tickets').setRequired(false)),
    new SlashCommandBuilder().setName('painel-tickets').setDescription('🎫 Envia painel de tickets simples (alternativo)').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    new SlashCommandBuilder().setName('criar-combo').setDescription('Cria produto profissional').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
     .addStringOption(o => o.setName('id').setDescription('ID ex: sanguine-vip').setRequired(true))
     .addStringOption(o => o.setName('titulo').setDescription('Titulo ex: SANGUINE ART').setRequired(true))
     .addStringOption(o => o.setName('banner').setDescription('Link https da imagem do produto').setRequired(true)),
    new SlashCommandBuilder().setName('add-opcao').setDescription('Adiciona plano ao produto').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
     .addStringOption(o => o.setName('combo_id').setDescription('ID do produto').setRequired(true))
     .addStringOption(o => o.setName('label').setDescription('Nome do plano ex: SANGUINE + CDK').setRequired(true))
     .addStringOption(o => o.setName('preco').setDescription('Preco ex: 9,99').setRequired(true)),
    new SlashCommandBuilder().setName('add-credencial').setDescription('Adiciona conta ao estoque').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
     .addStringOption(o => o.setName('combo_id').setDescription('ID do produto').setRequired(true))
     .addStringOption(o => o.setName('label').setDescription('Label exata').setRequired(true))
     .addStringOption(o => o.setName('credencial').setDescription('email:senha').setRequired(true)),
    new SlashCommandBuilder().setName('ver-estoque').setDescription('Ver estoque privado').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    new SlashCommandBuilder().setName('limpar-estoque').setDescription('Limpar estoque').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    new SlashCommandBuilder().setName('saldo-cliente').setDescription('Ver quanto cliente gastou e cargo').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
     .addUserOption(o => o.setName('usuario').setDescription('Usuario para ver saldo').setRequired(true)),
    new SlashCommandBuilder().setName('meu-saldo').setDescription('Ver seu total gasto e cargo atual'),
    new SlashCommandBuilder().setName('add-rapido').setDescription('🔥 ADICIONA PRODUTO COMPLETO DE UMA VEZ (MAIS FÁCIL)').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
     .addStringOption(o => o.setName('id').setDescription('ID ex: sanguine-vip').setRequired(true))
     .addStringOption(o => o.setName('titulo').setDescription('Título ex: SANGUINE ART').setRequired(true))
     .addStringOption(o => o.setName('banner').setDescription('Link da imagem https').setRequired(true))
     .addStringOption(o => o.setName('plano').setDescription('Nome do plano ex: SANGUINE + CDK').setRequired(true))
     .addStringOption(o => o.setName('preco').setDescription('Preço ex: 9,99').setRequired(true))
     .addStringOption(o => o.setName('contas').setDescription('Cole as contas SEPARADAS POR ESPAÇO: email:senha email2:senha2').setRequired(true)),
    new SlashCommandBuilder().setName('importar-lote').setDescription('📥 Importa VÁRIAS contas de uma vez (cola lista)').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
     .addStringOption(o => o.setName('combo_id').setDescription('ID do produto existente').setRequired(true))
     .addStringOption(o => o.setName('label').setDescription('Label exata do plano').setRequired(true))
     .addStringOption(o => o.setName('contas').setDescription('Cole VÁRIAS contas: uma por linha OU separadas por espaço').setRequired(true)),
    new SlashCommandBuilder().setName('editar-preco').setDescription('💲 Edita preço rápido').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
     .addStringOption(o => o.setName('combo_id').setDescription('ID do produto').setRequired(true))
     .addStringOption(o => o.setName('label').setDescription('Label do plano').setRequired(true))
     .addStringOption(o => o.setName('novo_preco').setDescription('Novo preço ex: 15,99').setRequired(true)),
    new SlashCommandBuilder().setName('ticket-add').setDescription('👤 Adiciona usuário ao ticket').setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
     .addUserOption(o => o.setName('usuario').setDescription('Usuário para adicionar').setRequired(true)),
    new SlashCommandBuilder().setName('ticket-remove').setDescription('👤 Remove usuário do ticket').setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
     .addUserOption(o => o.setName('usuario').setDescription('Usuário para remover').setRequired(true)),
    new SlashCommandBuilder().setName('ticket-transcript').setDescription('📋 Gera transcript do ticket').setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    new SlashCommandBuilder().setName('fechar').setDescription('🔒 Fecha o ticket atual'),
    new SlashCommandBuilder().setName('ver-avaliacoes').setDescription('⭐ Ver estatísticas de avaliações').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    new SlashCommandBuilder().setName('antiraid').setDescription('🛡️ Configura proteção anti-nuke/raid').setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
     .addStringOption(o => o.setName('acao').setDescription('Ação').setRequired(true).addChoices(
       { name: 'Status', value: 'status' },
       { name: 'Ativar', value: 'ativar' },
       { name: 'Desativar', value: 'desativar' },
       { name: 'Whitelist Add', value: 'whitelist_add' },
       { name: 'Whitelist Remove', value: 'whitelist_remove' }
     ))
     .addUserOption(o => o.setName('usuario').setDescription('Usuário para whitelist').setRequired(false)),
    new SlashCommandBuilder().setName('setup-pings').setDescription('🔔 Cria painel de cargos de notificação/pings').setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
     .addChannelOption(o => o.setName('canal').setDescription('Canal onde vai o painel de pings').setRequired(false)),
    new SlashCommandBuilder().setName('ping').setDescription('📢 Envia ping para um cargo de notificação').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
     .addStringOption(o => o.setName('cargo').setDescription('Qual cargo pingar').setRequired(true).addChoices(
       { name: '🔔 Notificações', value: 'notificacoes' },
       { name: '💰 Promoções', value: 'promocoes' },
       { name: '📦 Restock', value: 'restock' },
       { name: '🎉 Sorteios', value: 'sorteios' },
       { name: '⚡ Atualizações', value: 'atualizacoes' },
       { name: '🤝 Parcerias', value: 'parcerias' },
       { name: '👥 Todos com ping', value: 'todos' }
     ))
     .addStringOption(o => o.setName('mensagem').setDescription('Mensagem do ping').setRequired(true)),
    new SlashCommandBuilder().setName('backup-servidor').setDescription('💾 Cria backup do servidor (canais e cargos)').setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder().setName('automod').setDescription('🤖 Configura anti-palavrão, anti-link, anti-spam').setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
     .addStringOption(o => o.setName('acao').setDescription('Ação').setRequired(true).addChoices(
       { name: 'Status', value: 'status' },
       { name: 'Ativar tudo', value: 'ativar' },
       { name: 'Desativar tudo', value: 'desativar' },
       { name: 'Ativar anti-palavrão', value: 'palavrao_on' },
       { name: 'Desativar anti-palavrão', value: 'palavrao_off' },
       { name: 'Ativar anti-link', value: 'link_on' },
       { name: 'Desativar anti-link', value: 'link_off' },
       { name: 'Ativar anti-invite', value: 'invite_on' },
       { name: 'Desativar anti-invite', value: 'invite_off' },
       { name: 'Ativar anti-spam', value: 'spam_on' },
       { name: 'Desativar anti-spam', value: 'spam_off' }
     )),
].map(c => c.toJSON());

// ===== SISTEMA ANTI-ROUBO - SÓ FICA NO SEU SERVIDOR =====
const GUILD_ID_ENV = process.env.GUILD_ID || '1430243817801519286';
const ALLOWED_GUILDS = [
  GUILD_ID_ENV,
  '1430243817801519286', // seu servidor principal
  process.env.GUILD_ID_2 || null,
  process.env.GUILD_ID_3 || null
].filter(Boolean);

function isGuildAllowed(guildId){
  return ALLOWED_GUILDS.includes(guildId);
}

// ===== SISTEMA ANTI-NUKE / ANTI-RAID - PROTEGE SERVIDOR DE DESTRUIÇÃO =====
const OWNER_ID = process.env.OWNER_ID || null;
const CANAL_LOGS_ID = process.env.CANAL_LOGS_ID || process.env.CANAL_AVALIACOES_ID || null;

const WHITELIST_IDS = [
  OWNER_ID,
  process.env.BOT_OWNER_ID || null,
  '1430243817801519286', // você pode colocar seu ID aqui
].filter(Boolean);

const antiNukeConfig = {
  enabled: true,
  maxChannelDelete: 2, // máximo de canais deletados em 10s
  maxChannelCreate: 3,
  maxRoleDelete: 2,
  maxRoleCreate: 3,
  maxBan: 2,
  maxKick: 3,
  maxWebhook: 2,
  timeWindow: 10000, // 10 segundos
  punish: 'ban', // ban, kick, removeRoles
  logChannel: CANAL_LOGS_ID
};

const antiNukeCache = {
  channelDelete: new Map(),
  channelCreate: new Map(),
  roleDelete: new Map(),
  roleCreate: new Map(),
  ban: new Map(),
  kick: new Map(),
  webhook: new Map(),
  mention: new Map()
};

// ===== SISTEMA AUTOMOD - MODULAR (arquivo separado automod.js) =====
const automod = require('./automod.js');
let automodConfig = automod.config;
const TODOS_PALAVROES = automod.PALAVROES;
function salvarAutomod(d){ 
  automod.config = { ...automod.config, ...d };
  automod.salvar();
  automodConfig = automod.config;
}

function isWhitelisted(userId, memberOrGuild){
  if(!userId) return false;
  if(WHITELIST_IDS.includes(userId)) return true;
  
  let member = null;
  let guild = null;
  
  // Se passou member
  if(memberOrGuild && memberOrGuild.roles){
    member = memberOrGuild;
    guild = member.guild;
  } else if(memberOrGuild && memberOrGuild.members){
    // Se passou guild
    guild = memberOrGuild;
    try{
      member = guild.members.cache.get(userId);
    }catch{}
  }
  
  if(member){
    // Se tem cargo de staff, é whitelist - STAFF NÃO LEVA BAN NUNCA
    if(STAFF_ROLE_ID && member.roles?.cache?.has(STAFF_ROLE_ID)) return true;
    // Se é dono do servidor
    if(member.guild?.ownerId === userId) return true;
    // Se é o próprio bot
    if(member.id === member.client.user.id) return true;
  }
  
  // Se tem guild, tenta pegar membro do cache e verificar staff
  if(guild && STAFF_ROLE_ID){
    try{
      const m = guild.members.cache.get(userId);
      if(m && m.roles?.cache?.has(STAFF_ROLE_ID)) return true;
      if(guild.ownerId === userId) return true;
    }catch{}
  }
  
  return false;
}

async function getAuditExecutor(guild, actionType){
  try{
    const logs = await guild.fetchAuditLogs({ type: actionType, limit: 1 });
    const entry = logs.entries.first();
    if(!entry) return null;
    // Só pega se foi nos últimos 5 segundos
    if(Date.now() - entry.createdTimestamp > 5000) return null;
    return entry.executor;
  }catch{ return null; }
}

async function punishUser(guild, userId, reason){
  try{
    if(isWhitelisted(userId)) {
      console.log(`⚠️ Tentativa de punir whitelisted ignorada: ${userId}`);
      return;
    }
    const member = await guild.members.fetch(userId).catch(()=>null);
    if(!member) {
      // Se já saiu, tenta banir direto
      try{
        await guild.members.ban(userId, { reason: `ANTI-NUKE: ${reason}` });
        console.log(`🔨 ANTI-NUKE: Baniu ${userId} - ${reason}`);
      }catch{}
      return;
    }
    
    // Verifica se o bot tem permissão maior que o alvo
    if(member.roles.highest.position >= guild.members.me.roles.highest.position){
      console.log(`❌ ANTI-NUKE: Não pode punir ${member.user.tag} - cargo maior que o bot`);
      return;
    }

    if(antiNukeConfig.punish === 'ban'){
      await member.ban({ reason: `ANTI-NUKE: ${reason}` }).catch(()=>{});
      console.log(`🔨 ANTI-NUKE: Baniu ${member.user.tag} - ${reason}`);
    } else if(antiNukeConfig.punish === 'kick'){
      await member.kick(`ANTI-NUKE: ${reason}`).catch(()=>{});
    } else {
      // Remove todos os cargos perigosos
      const rolesToRemove = member.roles.cache.filter(r => r.permissions.has(PermissionFlagsBits.Administrator) || r.permissions.has(PermissionFlagsBits.BanMembers) || r.permissions.has(PermissionFlagsBits.KickMembers) || r.permissions.has(PermissionFlagsBits.ManageChannels) || r.permissions.has(PermissionFlagsBits.ManageRoles) || r.permissions.has(PermissionFlagsBits.ManageGuild));
      await member.roles.remove(rolesToRemove).catch(()=>{});
    }
  }catch(e){
    console.log(`❌ Erro ao punir ${userId}: ${e.message}`);
  }
}

async function logAntiNuke(guild, embed){
  try{
    if(CANAL_LOGS_ID){
      const channel = await guild.channels.fetch(CANAL_LOGS_ID).catch(()=>null);
      if(channel) await channel.send({ embeds: [embed] }).catch(()=>{});
    }
    // Também tenta logar no canal de vendas como fallback
    if(CANAL_VENDAS_ID && CANAL_VENDAS_ID !== CANAL_LOGS_ID){
      const channel2 = await guild.channels.fetch(CANAL_VENDAS_ID).catch(()=>null);
      // Não spama no canal de vendas, só se for crítico
    }
  }catch{}
}

function checkRateLimit(map, userId, max){
  const now = Date.now();
  const key = userId;
  if(!map.has(key)) map.set(key, []);
  const timestamps = map.get(key).filter(t => now - t < antiNukeConfig.timeWindow);
  timestamps.push(now);
  map.set(key, timestamps);
  return timestamps.length > max;
}

// Limpa cache a cada 30s
setInterval(() => {
  const now = Date.now();
  for(const type of Object.keys(antiNukeCache)){
    const map = antiNukeCache[type];
    for(const [userId, timestamps] of map.entries()){
      const filtered = timestamps.filter(t => now - t < antiNukeConfig.timeWindow);
      if(filtered.length === 0) map.delete(userId);
      else map.set(userId, filtered);
    }
  }
}, 30000);

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

client.once('ready', async () => {
    console.log(`✅ LEVIATHAN PROFISSIONAL LOGADO COMO ${client.user.tag}`);
    console.log(`🔒 PROTEÇÃO ANTI-ROUBO ATIVA - Servidores permitidos: ${ALLOWED_GUILDS.join(', ')}`);
    console.log(`📊 Bot está em ${client.guilds.cache.size} servidor(es): ${[...client.guilds.cache.values()].map(g=>`${g.name} (${g.id})`).join(', ')}`);
    
    // Verifica todos os servidores e sai dos não autorizados
    for (const g of client.guilds.cache.values()) {
        if(!isGuildAllowed(g.id)){
          console.log(`🚨 SERVIDOR NÃO AUTORIZADO DETECTADO: ${g.name} (${g.id}) - SAINDO...`);
          try{
            await g.leave();
            console.log(`✅ Saiu do servidor não autorizado: ${g.name}`);
          }catch(e){
            console.log(`❌ Erro ao sair de ${g.name}: ${e.message}`);
          }
          continue;
        }
        try {
          await rest.put(Routes.applicationGuildCommands(client.user.id, g.id), { body: commands });
          console.log(`✅ Comandos registrados em: ${g.name}`);
        } catch(e) {
          console.log(`❌ Erro ao registrar comandos em ${g.name}: ${e.message}`);
        }
    }
    console.log(`🔒 PROTEÇÃO ATIVA - Bot protegido contra roubo! Só funciona em ${ALLOWED_GUILDS.length} servidor(es) autorizado(s)`);
});

client.on('guildCreate', async (guild) => {
  console.log(`🎉 Bot adicionado em novo servidor: ${guild.name} (${guild.id})`);
  
  // PROTEÇÃO ANTI-ROUBO - Se não for seu servidor, sai imediatamente
  if(!isGuildAllowed(guild.id)){
    console.log(`🚨 TENTATIVA DE ROUBO! Bot adicionado em servidor não autorizado: ${guild.name} (${guild.id})`);
    console.log(`🚨 SAINDO IMEDIATAMENTE...`);
    try{
      // Tenta avisar no primeiro canal que achar
      const channel = guild.channels.cache.find(c => c.type === ChannelType.GuildText && c.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.SendMessages));
      if(channel){
        await channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF0000)
              .setTitle('🚨 BOT PROTEGIDO - ACESSO NEGADO')
              .setDescription(
`### Este bot é privado e protegido contra roubo!

> **Este bot pertence à Leviathan Accounts**
> **Só funciona no servidor oficial**

**🔒 Sistema anti-roubo ativado**
> Este servidor não está na lista autorizada
> O bot irá sair automaticamente

**💎 Quer um bot igual?**
> Entre em contato com o dono para adquirir
> Bot profissional com sistema de tickets + vendas

**Servidor oficial:** https://discord.gg/leviathan
`
              )
              .setFooter({ text: 'Leviathan Accounts • Sistema Anti-Roubo' })
          ]
        }).catch(()=>{});
      }
    }catch{}
    
    // Espera 2 segundos e sai
    setTimeout(async () => {
      try{
        await guild.leave();
        console.log(`✅ Saiu do servidor não autorizado: ${guild.name} (${guild.id})`);
      }catch(e){
        console.log(`❌ Erro ao sair de ${guild.name}: ${e.message}`);
      }
    }, 2000);
    return;
  }

  // Se for autorizado, registra comandos
  try{
    await rest.put(Routes.applicationGuildCommands(client.user.id, guild.id), { body: commands });
    console.log(`✅ Comandos registrados no novo servidor autorizado: ${guild.name}`);
  }catch(e){
    console.log(`❌ Erro ao registrar no novo servidor: ${e.message}`);
  }
});

// ===== SISTEMA ANTI-NUKE COMPLETO - PROTEGE SERVIDOR DE DESTRUIÇÃO =====
console.log('🛡️ Inicializando sistema anti-nuke...');

// Anti Channel Delete
client.on('channelDelete', async (channel) => {
  if(!antiNukeConfig.enabled) return;
  if(!channel.guild) return;
  if(!isGuildAllowed(channel.guild.id)) return;
  
  try{
    const executor = await getAuditExecutor(channel.guild, 12); // ChannelDelete = 12
    if(!executor) return;
    if(isWhitelisted(executor.id, channel?.guild || role?.guild || ban?.guild || member?.guild || guild || null)) return;
    
    // Ignora tickets sendo fechados pelo bot
    if(channel.name.includes('ticket') || channel.name.includes('🎫') || channel.name.includes('🛒')) {
      console.log(`ℹ️ Ticket fechado: ${channel.name} por ${executor.tag} - ignorando anti-nuke`);
      return;
    }
    
    if(checkRateLimit(antiNukeCache.channelDelete, executor.id, antiNukeConfig.maxChannelDelete)){
      console.log(`🚨 ANTI-NUKE: ${executor.tag} deletou muitos canais!`);
      
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('🚨 ANTI-NUKE ATIVADO - Tentativa de destruição detectada!')
        .setDescription(
`**Ação:** Deletou canais em massa
**Usuário:** ${executor} (${executor.tag} - \`${executor.id}\`)
**Canal deletado:** #${channel.name}
**Limite:** ${antiNukeConfig.maxChannelDelete} canais em ${antiNukeConfig.timeWindow/1000}s

**🛡️ Ação tomada:** Usuário banido automaticamente
**⏰ Horário:** <t:${Math.floor(Date.now()/1000)}:F>
`
        )
        .setFooter({ text: 'Leviathan Accounts • Sistema Anti-Nuke' })
        .setTimestamp();
      
      await punishUser(channel.guild, executor.id, `Deletou canais em massa (${channel.name})`);
      await logAntiNuke(channel.guild, embed);
    }
  }catch(e){ console.log('Erro anti-nuke channelDelete:', e.message); }
});

// Anti Channel Create (raid de canais)
client.on('channelCreate', async (channel) => {
  if(!antiNukeConfig.enabled) return;
  if(!channel.guild) return;
  if(!isGuildAllowed(channel.guild.id)) return;
  
  try{
    const executor = await getAuditExecutor(channel.guild, 10); // ChannelCreate = 10
    if(!executor) return;
    if(isWhitelisted(executor.id, channel?.guild || role?.guild || ban?.guild || member?.guild || guild || null)) return;
    
    if(checkRateLimit(antiNukeCache.channelCreate, executor.id, antiNukeConfig.maxChannelCreate)){
      console.log(`🚨 ANTI-NUKE: ${executor.tag} criou muitos canais!`);
      
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('🚨 ANTI-NUKE - Spam de canais detectado!')
        .setDescription(
`**Ação:** Criou canais em massa (possível raid)
**Usuário:** ${executor} (${executor.tag})
**Canal criado:** #${channel.name}

**🛡️ Ação:** Banido automaticamente
`
        )
        .setTimestamp();
      
      await punishUser(channel.guild, executor.id, `Criou canais em massa`);
      await logAntiNuke(channel.guild, embed);
      
      // Deleta os canais criados pelo raider
      try{
        const channels = channel.guild.channels.cache.filter(c => c.createdTimestamp > Date.now() - 10000);
        for(const [id, ch] of channels){
          if(ch.deletable) await ch.delete().catch(()=>{});
        }
      }catch{}
    }
  }catch(e){ console.log('Erro anti-nuke channelCreate:', e.message); }
});

// Anti Role Delete
client.on('roleDelete', async (role) => {
  if(!antiNukeConfig.enabled) return;
  if(!isGuildAllowed(role.guild.id)) return;
  
  try{
    const executor = await getAuditExecutor(role.guild, 32); // RoleDelete = 32
    if(!executor) return;
    if(isWhitelisted(executor.id, channel?.guild || role?.guild || ban?.guild || member?.guild || guild || null)) return;
    
    if(checkRateLimit(antiNukeCache.roleDelete, executor.id, antiNukeConfig.maxRoleDelete)){
      console.log(`🚨 ANTI-NUKE: ${executor.tag} deletou muitos cargos!`);
      
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('🚨 ANTI-NUKE - Deleção de cargos em massa!')
        .setDescription(`**Usuário:** ${executor} (${executor.tag})\n**Cargo:** ${role.name}\n**Ação:** Banido`)
        .setTimestamp();
      
      await punishUser(role.guild, executor.id, `Deletou cargos em massa`);
      await logAntiNuke(role.guild, embed);
    }
  }catch(e){ console.log('Erro roleDelete:', e.message); }
});

// Anti Role Create
client.on('roleCreate', async (role) => {
  if(!antiNukeConfig.enabled) return;
  if(!isGuildAllowed(role.guild.id)) return;
  
  try{
    const executor = await getAuditExecutor(role.guild, 30); // RoleCreate = 30
    if(!executor) return;
    if(isWhitelisted(executor.id, channel?.guild || role?.guild || ban?.guild || member?.guild || guild || null)) return;
    
    // Se criou cargo com ADM, já bane na hora
    if(role.permissions.has(PermissionFlagsBits.Administrator)){
      console.log(`🚨 ANTI-NUKE: ${executor.tag} criou cargo com ADM: ${role.name}`);
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('🚨 ANTI-NUKE - Cargo com ADM criado!')
        .setDescription(`**Usuário:** ${executor}\n**Cargo:** ${role.name} com ADMINISTRATOR\n**Ação:** Banido imediatamente`)
        .setTimestamp();
      
      await punishUser(role.guild, executor.id, `Criou cargo com ADM: ${role.name}`);
      await role.delete().catch(()=>{});
      await logAntiNuke(role.guild, embed);
      return;
    }
    
    if(checkRateLimit(antiNukeCache.roleCreate, executor.id, antiNukeConfig.maxRoleCreate)){
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('🚨 ANTI-NUKE - Spam de cargos!')
        .setDescription(`**Usuário:** ${executor} criando muitos cargos\n**Ação:** Banido`)
        .setTimestamp();
      
      await punishUser(role.guild, executor.id, `Criou cargos em massa`);
      await logAntiNuke(role.guild, embed);
    }
  }catch(e){ console.log('Erro roleCreate:', e.message); }
});

// Anti Ban
client.on('guildBanAdd', async (ban) => {
  if(!antiNukeConfig.enabled) return;
  if(!isGuildAllowed(ban.guild.id)) return;
  
  try{
    const executor = await getAuditExecutor(ban.guild, 22); // MemberBanAdd = 22
    if(!executor) return;
    if(isWhitelisted(executor.id, channel?.guild || role?.guild || ban?.guild || member?.guild || guild || null)) return;
    
    if(checkRateLimit(antiNukeCache.ban, executor.id, antiNukeConfig.maxBan)){
      console.log(`🚨 ANTI-NUKE: ${executor.tag} baniu muitas pessoas!`);
      
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('🚨 ANTI-NUKE - Ban em massa detectado!')
        .setDescription(
`**Usuário:** ${executor} (${executor.tag})
**Ação:** Baniu ${antiNukeCache.ban.get(executor.id)?.length || 'muitas'} pessoas
**Último ban:** ${ban.user.tag}

**🛡️ Ação:** Banido e todos os bans desfeitos
`
        )
        .setTimestamp();
      
      await punishUser(ban.guild, executor.id, `Ban em massa`);
      await logAntiNuke(ban.guild, embed);
      
      // Tenta desbanir todos que ele baniu recentemente
      try{
        const bans = await ban.guild.bans.fetch();
        const recentBans = bans.filter(b => b.user.id !== executor.id);
        for(const [id, b] of recentBans){
          // Só desbane se foi banido nos últimos 30s (evita desbanir bans antigos legítimos)
          await ban.guild.members.unban(id, 'Anti-nuke: desfazendo bans em massa').catch(()=>{});
        }
      }catch{}
    }
  }catch(e){ console.log('Erro guildBanAdd:', e.message); }
});

// Anti Kick / Member Remove
client.on('guildMemberRemove', async (member) => {
  if(!antiNukeConfig.enabled) return;
  if(!isGuildAllowed(member.guild.id)) return;
  
  try{
    // Tenta descobrir se foi kick
    const executor = await getAuditExecutor(member.guild, 20); // MemberKick = 20
    if(!executor) return;
    if(isWhitelisted(executor.id, channel?.guild || role?.guild || ban?.guild || member?.guild || guild || null)) return;
    
    if(checkRateLimit(antiNukeCache.kick, executor.id, antiNukeConfig.maxKick)){
      console.log(`🚨 ANTI-NUKE: ${executor.tag} kickou muita gente!`);
      
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('🚨 ANTI-NUKE - Kick em massa!')
        .setDescription(`**Usuário:** ${executor} kickou muitas pessoas\n**Último:** ${member.user.tag}\n**Ação:** Banido`)
        .setTimestamp();
      
      await punishUser(member.guild, executor.id, `Kick em massa`);
      await logAntiNuke(member.guild, embed);
    }
  }catch(e){ console.log('Erro memberRemove:', e.message); }
});

// Anti Webhook
client.on('webhookUpdate', async (channel) => {
  if(!antiNukeConfig.enabled) return;
  if(!isGuildAllowed(channel.guild.id)) return;
  
  try{
    const executor = await getAuditExecutor(channel.guild, 50); // WebhookCreate = 50, 51 update, 52 delete - usamos 50 como base
    if(!executor) return;
    if(isWhitelisted(executor.id, channel?.guild || role?.guild || ban?.guild || member?.guild || guild || null)) return;
    
    if(checkRateLimit(antiNukeCache.webhook, executor.id, antiNukeConfig.maxWebhook)){
      console.log(`🚨 ANTI-NUKE: ${executor.tag} criou muitos webhooks!`);
      
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('🚨 ANTI-NUKE - Webhook spam!')
        .setDescription(`**Usuário:** ${executor} criando webhooks em massa\n**Canal:** #${channel.name}\n**Ação:** Banido + webhooks deletados`)
        .setTimestamp();
      
      await punishUser(channel.guild, executor.id, `Webhook spam`);
      
      // Deleta todos webhooks do canal
      try{
        const webhooks = await channel.fetchWebhooks();
        for(const [id, wh] of webhooks){
          await wh.delete().catch(()=>{});
        }
      }catch{}
      
      await logAntiNuke(channel.guild, embed);
    }
  }catch(e){ console.log('Erro webhookUpdate:', e.message); }
});

// ===== ANTI @everyone + AUTOMOD (PALAVRÃO, LINK, SPAM, CAPS) =====
client.on('messageCreate', async (message) => {
  if(!message.guild) return;
  if(!isGuildAllowed(message.guild.id)) return;
  if(message.author.bot) return;
  if(!message.content) return;
  if(message.member && isWhitelisted(message.author.id, message.member)) return; // Staff whitelist - NÃO PUNE STAFF
  
  // === ANTI-NUKE @everyone ===
  if(antiNukeConfig.enabled && message.mentions.everyone){
    try{
      if(checkRateLimit(antiNukeCache.mention, message.author.id, 2)){
        console.log(`🚨 ANTI-NUKE: ${message.author.tag} spam de @everyone`);
        await message.delete().catch(()=>{});
        const embed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('🚨 ANTI-NUKE - Spam @everyone!')
          .setDescription(`**Usuário:** ${message.author} spamou @everyone/@here\n**Canal:** ${message.channel}\n**Ação:** Mensagem deletada + cargos removidos`)
          .setTimestamp();
        try{
          const member = message.member;
          if(member && member.roles.highest.position < message.guild.members.me.roles.highest.position){
            const rolesToRemove = member.roles.cache.filter(r => r.permissions.has(PermissionFlagsBits.MentionEveryone) || r.permissions.has(PermissionFlagsBits.Administrator));
            await member.roles.remove(rolesToRemove).catch(()=>{});
          }
        }catch{}
        await logAntiNuke(message.guild, embed);
        return;
      }
    }catch(e){ console.log('Erro mention:', e.message); }
  }
  
  // Anti link de webhook / token
  if(message.content.includes('discord.com/api/webhooks') || message.content.includes('https://discord.com/api/webhooks')){
    await message.delete().catch(()=>{});
    console.log(`🛡️ Webhook link deletado de ${message.author.tag}`);
    return;
  }

  // ===== AUTOMOD - SÓ RODA SE ATIVADO =====
  if(!automodConfig.enabled) return;
  
  // Ignora canais configurados
  if(automodConfig.ignoreChannels.includes(message.channel.id)) return;
  // Ignora cargos configurados
  if(message.member && message.member.roles.cache.some(r => automodConfig.ignoreRoles.includes(r.id))) return;

  const content = message.content;
  const channelName = (message.channel.name || '').toLowerCase();
  const isParceriaChannel = channelName.includes('parceria') || channelName.includes('parcerias') || channelName.includes('🤝') || channelName.includes('divulga') || channelName.includes('partners');
  
  // Se for ticket, verifica se é ticket de parceria - se for, libera links/invites
  let isParceriaTicket = false;
  if(isTicketChannel(message.channel)){
    // Se for ticket de parceria, libera invites
    if(channelName.includes('parceria') || channelName.includes('🤝')){
      isParceriaTicket = true;
    } else {
      // Se for qualquer outro ticket (suporte, dúvida, etc), ignora automod completamente
      if(!isParceriaChannel){
        return;
      }
    }
  }

  // 1. ANTI PALAVRÃO
  if(automodConfig.antiPalavrao){
    const palavrãoEncontrado = containsPalavrao(content);
    if(palavrãoEncontrado){
      console.log(`🤬 Automod palavrão: ${message.author.tag} disse "${palavrãoEncontrado}"`);
      await applyAutomodPunishment(message.member, `Palavrão detectado: \`${palavrãoEncontrado}\``, message);
      return;
    }
  }

  // 2. ANTI INVITE (discord.gg) - LIBERADO EM CANAL DE PARCERIA
  if(automodConfig.antiInvite && !isParceriaChannel && !isParceriaTicket){
    if(INVITE_REGEX.test(content)){
      console.log(`🔗 Automod invite: ${message.author.tag} mandou invite`);
      await applyAutomodPunishment(message.member, `Link de convite Discord não permitido`, message);
      return;
    }
  }

  // 3. ANTI LINK (qualquer link) - LIBERADO EM CANAL DE PARCERIA
  if(automodConfig.antiLink && !isParceriaChannel && !isParceriaTicket){
    const allowedDomains = ['imgur.com', 'i.imgur.com', 'youtube.com', 'youtu.be', 'tenor.com', 'giphy.com'];
    const hasLink = LINK_REGEX.test(content);
    if(hasLink){
      const isAllowed = allowedDomains.some(d => content.toLowerCase().includes(d));
      if(!isAllowed){
        console.log(`🔗 Automod link: ${message.author.tag} mandou link`);
        await applyAutomodPunishment(message.member, `Links não são permitidos aqui`, message);
        return;
      }
    }
  }

  // 4. ANTI SPAM / FLOOD
  if(automodConfig.antiSpam || automodConfig.antiFlood){
    const spamResult = checkSpam(message.author.id, content);
    if(spamResult){
      if(spamResult.type === 'flood'){
        console.log(`💬 Automod flood: ${message.author.tag} - ${spamResult.count} msgs em 5s`);
        await applyAutomodPunishment(message.member, `Flood - ${spamResult.count} mensagens em 5 segundos`, message);
        return;
      }
      if(spamResult.type === 'repeat' || spamResult.type === 'same'){
        console.log(`🔁 Automod repeat: ${message.author.tag} - repetindo mensagem`);
        await applyAutomodPunishment(message.member, `Spam - Mensagem repetida ${spamResult.count}x`, message);
        return;
      }
    }
  }
});

console.log('🛡️ Sistema anti-nuke + Automod carregado com sucesso!');


async function gerarPainelUnico(){
  const estoque = carregar();
  const totalContas = estoque.reduce((a,c)=>a+c.opcoes.reduce((x,y)=>x+y.contas.length,0),0);

  // Banner
  const files = [];
  let bannerAttachment = null;
  let bannerLocal = acharBannerLocal();
  try {
    if(bannerLocal && fs.existsSync(bannerLocal)){
      const nome = 'banner' + path.extname(bannerLocal);
      files.push(new AttachmentBuilder(bannerLocal,{name:nome}));
      bannerAttachment = 'attachment://' + nome;
    }
  } catch {}

  // Embed principal PROFISSIONAL com imagem grande
  const embedMain = new EmbedBuilder()
   .setColor(0xFFD700) // Dourado profissional
   .setAuthor({ name: 'LEVIATHAN ACCOUNTS — OFFICIAL STORE', iconURL: 'https://i.imgur.com/8QJ4sQy.png' })
   .setTitle('LEVIATHAN ACCOUNTS')
   .setDescription(
`### 💎 LOJA OFICIAL • ENTREGA AUTOMÁTICA • 24/7

> A loja mais confiável de contas Blox Fruits do Discord.
> Produtos verificados, entrega instantânea e suporte premium.

**🔥 PRODUTOS EM DESTAQUE:**
${estoque.length===0 ? '> *Nenhum produto no momento - Aguarde restock*\n> Contate <@&' + STAFF_ROLE_ID + '> para encomendas' : estoque.map(c=>{
  const total = c.opcoes.reduce((a,b)=>a+b.contas.length,0);
  const status = total===0 ? '🔴 ESGOTADO' : `🟢 ${total} DISPONÍVEIS`;
  return `> **${c.titulo}** — ${status}`;
}).join('\n')}
`
   )
   .addFields(
     { name: '✅ Garantia', value: '7 dias\nTroca garantida', inline: true },
     { name: '⚡ Entrega', value: 'Automática\n5 segundos', inline: true },
     { name: '🛡️ Suporte', value: 'VIP 24/7\nAtendimento rápido', inline: true },
     { name: '📦 Estoque Total', value: `${totalContas} contas\nVerificadas`, inline: true },
     { name: '💳 Pagamento', value: 'Pix • Nubank\nSeguro', inline: true },
        )
   .setFooter({ text: `Leviathan Accounts • ${totalContas} contas disponíveis • Loja Oficial desde 2024`, iconURL: 'https://i.imgur.com/8QJ4sQy.png' })
   .setTimestamp();

  // SEMPRE usa banner local se existir - não usa mais imgur quebrado
  if(bannerAttachment){
    embedMain.setImage(bannerAttachment);
  } else if(estoque[0] && isUrl(estoque[0].banner) && !estoque[0].banner.includes('8QJ4sQy')){
    // Só usa URL se não for o imgur quebrado antigo
    embedMain.setImage(estoque[0].banner);
  } else if(bannerAttachment===null){
    // Se não tem banner local nem URL válida, tenta achar de novo e avisa
    console.log('⚠️ Sem banner para o painel - adicione banner-leviathan.png no GitHub');
  }

  const embeds = [embedMain];
  // Embeds secundários REMOVIDOS conforme pedido do usuário - só painel principal agora

  const components = [];
  
  // ===== NOVO SISTEMA: 1 CLIQUE DIRETO PRO TICKET =====
  // Junta todas as opções de todos os produtos
  const todasOpcoes = [];
  estoque.forEach(combo => {
    combo.opcoes.forEach(op => {
      todasOpcoes.push({
        comboId: combo.id,
        comboTitulo: combo.titulo,
        opcao: op
      });
    });
  });

  const opcoesComEstoque = todasOpcoes.filter(x => x.opcao.contas.length > 0);

  if(todasOpcoes.length === 0 || opcoesComEstoque.length === 0){
    const opcaoVazia = new StringSelectMenuOptionBuilder()
      .setLabel('🔴 ESTOQUE INDISPONIVEL!')
      .setDescription('Nenhuma conta disponível no momento')
      .setValue('estoque_vazio')
      .setEmoji('🔴');
    
    components.push(new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('estoque_vazio')
        .setPlaceholder('🔴 Clique aqui para ver as opções')
        .addOptions([opcaoVazia])
    ));
  } else {
    // USANDO LABEL como valor principal - NUNCA mais dá erro de ID
    const opcoesMenu = opcoesComEstoque.slice(0,25).map(item => {
      const op = item.opcao;
      const label = `${item.comboTitulo} - ${op.label}`.slice(0,100);
      const desc = `R$ ${op.preco} | 🟢 ${op.contas.length} disp. | Clique para comprar`.slice(0,100);
      // VALOR = LABEL (estável) + ID como fallback
      const valor = `${item.comboId}||${op.label}`;
      return new StringSelectMenuOptionBuilder()
        .setLabel(label)
        .setDescription(desc)
        .setValue(valor.slice(0,100)) // Discord limite 100 chars
        .setEmoji('🛒')
    });

    components.push(new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('comprar_select')
        .setPlaceholder('🔽 Clique aqui para ver as opções')
        .addOptions(opcoesMenu)
    ));
  }

  return { embeds, files, components };
}

async function enviarPainelVendas(interaction){
  try {
    const canal = await client.channels.fetch(CANAL_VENDAS_ID);
    const painel = await gerarPainelUnico();
    const msg = await canal.send(painel);
    salvarPainel({ messageId: msg.id, channelId: canal.id });
    await interaction.followUp({ content: `✅ **Painel Profissional enviado!** Design que impressiona em <#${CANAL_VENDAS_ID}>`, ephemeral: true });
  } catch(e){ await interaction.followUp({ content: `❌ Erro: ${e.message}`, ephemeral: true }); }
}

async function atualizarPainelUnico(){
  try{
    const p = carregarPainel(); if(!p) return;
    const canal = await client.channels.fetch(p.channelId || CANAL_VENDAS_ID).catch(()=>null); if(!canal) return;
    const msg = await canal.messages.fetch(p.messageId).catch(()=>null); if(!msg) return;
    const novo = await gerarPainelUnico();
    await msg.edit({ embeds: novo.embeds, components: novo.components, files: novo.files }).catch(()=>{});
  }catch{}
}

// ===== SISTEMA DE TICKETS PROFISSIONAL LEVIATHAN =====
const TICKET_TYPES = {
  suporte: { label: '🎫 Suporte', emoji: '🎫', desc: 'Problema com minha conta', color: 0xFF4444 },
  duvida: { label: '❓ Dúvidas', emoji: '❓', desc: 'Tirar dúvidas gerais', color: 0x00AAFF },
  parceria: { label: '🤝 Parceria', emoji: '🤝', desc: 'Quero ser parceiro', color: 0x00FF7F },
  reembolso: { label: '💸 Reembolso', emoji: '💸', desc: 'Solicitar reembolso/troca', color: 0xFF8C00 }
};

// Função para verificar se é ticket - MUITO mais flexível agora
function isTicketChannel(channel){
  if(!channel) return false;
  try{
    const name = (channel.name || '').toLowerCase();
    const topic = (channel.topic || '').toLowerCase();
    const parentId = channel.parentId || channel.parent_id || '';
    
    // Verifica por nome
    if(name.includes('🎫') || name.includes('🛒') || name.includes('ticket') || name.includes('suporte') || name.includes('duvida') || name.includes('dúvida') || name.includes('parceria') || name.includes('reembolso') || name.includes('compra')) return true;
    
    // Verifica se está na categoria de tickets
    if(CATEGORIA_TICKET_ID && parentId === CATEGORIA_TICKET_ID) return true;
    
    // Verifica por tópico
    if(topic.includes('ticket') || topic.includes('criado por') || topic.includes('tipo:')) return true;
    
    // Se tem overwrites (canal privado), provavelmente é ticket
    if(channel.permissionOverwrites && channel.permissionOverwrites.cache && channel.permissionOverwrites.cache.size >= 3) return true;
    
    return false;
  }catch{ return false; }
}

function gerarPainelTicketsProfissional(){
  const embed = new EmbedBuilder()
    .setColor(0x0a0a0a)
    .setAuthor({ name: 'LEVIATHAN ACCOUNTS • CENTRAL DE ATENDIMENTO', iconURL: 'https://i.imgur.com/8QJ4sQy.png' })
    .setTitle('🎫 SISTEMA DE TICKETS • LEVIATHAN ACCOUNTS')
    .setDescription(
`### 💎 BEM-VINDO A CENTRAL DE ATENDIMENTO OFICIAL

> A loja mais confiável de Blox Fruits do Brasil
> Suporte rápido, atendimento premium 24/7

**📋 COMO FUNCIONA:**
> 1️⃣ Clique no botão abaixo de acordo com sua necessidade
> 2️⃣ Um canal privado será criado só pra você
> 3️⃣ Nossa equipe vai te atender em até 5 minutos
> 4️⃣ Após resolver, o ticket será fechado automaticamente

**⚡ TEMPO MÉDIO DE RESPOSTA:** \`2 minutos\`
**🛡️ EQUIPE ONLINE:** <@&${STAFF_ROLE_ID || 'STAFF'}>
**⭐ AVALIAÇÃO:** \`\`

---
**👇 SELECIONE O TIPO DE ATENDIMENTO:**
`
    )
    .addFields(
      { name: '🎫 Suporte', value: 'Problema com conta\nResolvemos rápido', inline: true },
      { name: '❓ Dúvidas', value: 'Tirar dúvidas\nSobre produtos', inline: true },
      { name: '🤝 Parceria', value: 'Ser parceiro\nGanhe dinheiro', inline: true },
      { name: '💸 Reembolso', value: 'Troca / Garantia\n7 dias garantia', inline: true },
      { name: '⚡ Status', value: 'Online 24/7\nResposta imediata', inline: true },
      { name: '💎 Loja', value: 'Use /painel-vendas\nPara comprar', inline: true }
    )
    .setFooter({ text: 'Leviathan Accounts • Sistema de tickets profissional • Desde 2024', iconURL: 'https://i.imgur.com/8QJ4sQy.png' })
    .setTimestamp();

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_create_suporte').setLabel('Suporte').setStyle(ButtonStyle.Danger).setEmoji('🎫'),
    new ButtonBuilder().setCustomId('ticket_create_duvida').setLabel('Dúvidas').setStyle(ButtonStyle.Primary).setEmoji('❓'),
    new ButtonBuilder().setCustomId('ticket_create_parceria').setLabel('Parceria').setStyle(ButtonStyle.Secondary).setEmoji('🤝')
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_create_reembolso').setLabel('Reembolso').setStyle(ButtonStyle.Secondary).setEmoji('💸')
  );

  return { embeds: [embed], components: [row1, row2] };
}

async function criarTicketProfissional(interaction, tipo){
  const config = TICKET_TYPES[tipo];
  if(!config) return interaction.reply({ content: '❌ Tipo de ticket inválido', ephemeral: true });

  // Verifica se já tem ticket aberto desse tipo
  try {
    const canaisExistentes = interaction.guild.channels.cache.filter(c => 
      c.type === ChannelType.GuildText &&
      c.name.startsWith(`🎫・${interaction.user.username.toLowerCase().slice(0,8)}`) &&
      c.parentId === (CATEGORIA_TICKET_ID || null)
    );
    if(canaisExistentes.size >= 2){
      return interaction.reply({ content: `⚠️ Você já tem **${canaisExistentes.size} tickets** abertos!\n> Feche um ticket antes de abrir outro: ${canaisExistentes.map(c=>`${c}`).join(', ')}`, ephemeral: true });
    }
  } catch{}

  await interaction.deferReply({ ephemeral: true });

  const nomeCanal = `🎫・${tipo}-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-・]/g, '-').slice(0,90);

  const ticket = await interaction.guild.channels.create({
    name: nomeCanal,
    type: ChannelType.GuildText,
    parent: CATEGORIA_TICKET_ID || undefined,
    topic: `Ticket de ${config.label} | Criado por ${interaction.user.tag} (${interaction.user.id}) | Tipo: ${tipo}`,
    permissionOverwrites: [
      { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks] },
      ...(STAFF_ROLE_ID ? [{ id: STAFF_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ManageChannels] }] : [])
    ]
  });

  const embedWelcome = new EmbedBuilder()
    .setColor(config.color)
    .setAuthor({ name: `LEVIATHAN ACCOUNTS • ${config.label.toUpperCase()}`, iconURL: 'https://i.imgur.com/8QJ4sQy.png' })
    .setTitle(`${config.emoji} Ticket de ${config.label} criado!`)
    .setDescription(
`**Olá ${interaction.user}! Bem-vindo ao seu ticket privado.**

> **Tipo:** \`${config.label}\`
> **Criado em:** <t:${Math.floor(Date.now()/1000)}:F>
> **Cliente:** ${interaction.user} (\`${interaction.user.id}\`)

${tipo === 'compra' ? `
**🛒 VOCÊ QUER COMPRAR?**
> Digite qual conta você quer:
> Ex: \`SANGUINE ART + CDK\` ou \`GOD HUMAN\`
> Nossa equipe vai te atender com o Pix e entrega

**📦 Estoque atual:** Use \`/ver-estoque\` (staff)
` : tipo === 'suporte' ? `
**🎫 SUPORTE TÉCNICO**
> Descreva seu problema com detalhes:
> - Qual conta comprou?
> - Qual erro aparece?
> - Print do erro ajuda muito!

**⏱️ Garantia:** 7 dias para troca
` : tipo === 'duvida' ? `
**❓ TIRE SUAS DÚVIDAS**
> Pergunte o que quiser sobre:
> - Produtos disponíveis
> - Formas de pagamento
> - Garantia e entrega
> - Como funciona

**💡 Dica:** Veja nosso painel de vendas em <#${CANAL_VENDAS_ID || 'vendas'}>
` : tipo === 'parceria' ? `
**🤝 PARCERIA LEVIATHAN**
> Quer ganhar dinheiro revendendo?
> - Comissão de até 30%
> - Suporte exclusivo
> - Material de divulgação

**📈 Requisitos:**
> Ter servidor Discord ou TikTok/YouTube
> Ser ativo na comunidade Blox Fruits
` : `
**💸 REEMBOLSO / TROCA**
> Informe:
> - Qual conta comprou?
> - Qual problema?
> - Comprovante de pagamento
> - Print do erro

**📋 Regras:**
> Garantia de 7 dias
> Conta com problema comprovado = troca imediata
`}

**⚡ EQUIPE NOTIFICADA:** ${STAFF_ROLE_ID ? `<@&${STAFF_ROLE_ID}>` : '@Staff'} vai te atender em até 5 minutos!
`
    )
    .setFooter({ text: `Leviathan Accounts • Ticket #${ticket.id.slice(-6)} • Atendimento Premium`, iconURL: interaction.user.displayAvatarURL() })
    .setTimestamp();

  const rowControle = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_claim').setLabel('Reivindicar').setStyle(ButtonStyle.Primary).setEmoji('✋'),
    new ButtonBuilder().setCustomId('ticket_close').setLabel('Fechar').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
    new ButtonBuilder().setCustomId('ticket_transcript').setLabel('Transcript').setStyle(ButtonStyle.Secondary).setEmoji('📋')
  );
  const rowControle2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_add_user').setLabel('Add Usuário').setStyle(ButtonStyle.Secondary).setEmoji('👤'),
    new ButtonBuilder().setCustomId('ticket_notify').setLabel('Notificar Staff').setStyle(ButtonStyle.Secondary).setEmoji('🔔')
  );

  await ticket.send({ content: `${interaction.user} ${STAFF_ROLE_ID ? `<@&${STAFF_ROLE_ID}>` : ''}`, embeds: [embedWelcome], components: [rowControle, rowControle2] });

  return interaction.followUp({ content: `✅ **Ticket criado com sucesso!**\n> Vá para ${ticket}\n> Tipo: **${config.label}**\n> Nossa equipe já foi notificada!`, ephemeral: true });
}

async function gerarTranscript(channel){
  try{
    const messages = await channel.messages.fetch({ limit: 100 });
    const sorted = [...messages.values()].sort((a,b) => a.createdTimestamp - b.createdTimestamp);
    
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Transcript - ${channel.name}</title><style>body{font-family:Arial;background:#0a0a0a;color:#fff;padding:20px} .msg{background:#171717;margin:10px 0;padding:12px;border-radius:8px;border-left:3px solid #FFD700} .author{color:#FFD700;font-weight:bold} .time{color:#888;font-size:12px} .content{margin-top:5px}</style></head><body><h1>📋 Transcript - ${channel.name}</h1><p>Canal: ${channel.name} | ID: ${channel.id} | Gerado em: ${new Date().toLocaleString('pt-BR')}</p>`;
    
    for(const msg of sorted){
      if(msg.author.bot && msg.embeds.length>0) continue; // pula embeds do bot
      html += `<div class="msg"><div class="author">${msg.author.tag} <span class="time">${new Date(msg.createdTimestamp).toLocaleString('pt-BR')}</span></div><div class="content">${msg.content || '<i>embed/anexo</i>'}</div></div>`;
    }
    
    html += '</body></html>';
    const filePath = `/tmp/transcript-${channel.id}.html`;
    fs.writeFileSync(filePath, html);
    return filePath;
  }catch(e){
    console.log('Erro transcript:', e.message);
    return null;
  }
}


client.on('interactionCreate', async interaction=>{
  try {
    // ===== PROTEÇÃO ANTI-ROUBO - BLOQUEIA USO FORA DO SERVIDOR AUTORIZADO =====
    if(interaction.guild && !isGuildAllowed(interaction.guild.id)){
      console.log(`🚨 Tentativa de uso em servidor não autorizado: ${interaction.guild.name} (${interaction.guild.id}) por ${interaction.user.tag}`);
      try{
        await interaction.reply({ content: '🚨 **BOT PROTEGIDO - ACESSO NEGADO**\n> Este bot pertence à Leviathan Accounts e só funciona no servidor oficial.\n> O bot irá sair deste servidor.', ephemeral: true });
      }catch{}
      // Sai do servidor após 3 segundos
      setTimeout(async () => {
        try{ await interaction.guild.leave(); }catch{}
      }, 3000);
      return;
    }

    if(interaction.isChatInputCommand()){
      // Comandos liberados para todos
      if(interaction.commandName==='meu-saldo'){
        await interaction.deferReply({ephemeral:true});
        const clientes = carregarClientes();
        const dados = clientes[interaction.user.id] || { totalGasto: 0, compras: [] };
        const cargo = getCargoPorValor(dados.totalGasto);
        const embed = new EmbedBuilder()
         .setColor(0x00ff7f)
         .setTitle('💰 SEU SALDO - LEVIATHAN ACCOUNTS')
         .setDescription(
`**Total gasto:** R$ ${dados.totalGasto.toFixed(2).replace('.',',')}
**Cargo atual:** ${cargo ? `**${cargo.nome.toUpperCase()}**` : 'Nenhum (ainda não comprou)'}
**Compras:** ${dados.compras.length}

${dados.compras.length>0 ? dados.compras.slice(-5).map(c=>`> ${c.produto} - R$ ${c.preco.toFixed(2).replace('.',',')} - ${new Date(c.data).toLocaleDateString('pt-BR')}`).join('\n') : '> Nenhuma compra ainda'}

**Próximos cargos:**
${CARGOS_CLIENTE.slice().reverse().map(c=>`${dados.totalGasto >= c.minimo ? '✅' : '⬜'} ${c.nome} - R$ ${c.minimo}`).join('\n')}
`
         )
         .setFooter({ text: 'Leviathan Accounts • Sistema de fidelidade' });
        return interaction.followUp({ embeds: [embed], ephemeral: true });
      }

      if(interaction.commandName==='fechar'){
        if(!isTicketChannel(interaction.channel)){
          const isInTicketCategory = CATEGORIA_TICKET_ID && interaction.channel.parentId === CATEGORIA_TICKET_ID;
          if(!isInTicketCategory){
            // Permite fechar mesmo se não detectar, mas avisa
            console.log(`⚠️ /fechar usado fora de ticket detectado: ${interaction.channel.name} (${interaction.channel.id}) - permitindo mesmo assim para staff`);
          }
        }
        await interaction.reply({ content: '🔒 Fechando ticket em 3 segundos...' });
        setTimeout(()=>interaction.channel.delete().catch(()=>{}),3000);
        return;
      }

      // ===== APENAS STAFF PODE USAR COMANDOS DE CONFIGURAÇÃO =====
      const comandosLivres = ['meu-saldo', 'fechar'];
      const comandosStaffOnly = ['painel-vendas', 'setup-tickets', 'painel-tickets', 'criar-combo', 'add-opcao', 'add-credencial', 'ver-estoque', 'limpar-estoque', 'add-rapido', 'importar-lote', 'editar-preco', 'saldo-cliente', 'ticket-add', 'ticket-remove', 'ver-avaliacoes', 'antiraid', 'backup-servidor', 'automod', 'setup-pings', 'ping'];
      
      if(comandosStaffOnly.includes(interaction.commandName)){
        const hasStaffRole = STAFF_ROLE_ID && interaction.member.roles.cache.has(STAFF_ROLE_ID);
        const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
        const isOwner = interaction.guild.ownerId === interaction.user.id;
        if(!hasStaffRole && !isAdmin && !isOwner){
          return interaction.reply({ content: '❌ **Sem permissão!**\n> Apenas a equipe <@&'+STAFF_ROLE_ID+'> pode usar este comando!', ephemeral: true });
        }
      }
      
      if(!comandosLivres.includes(interaction.commandName) && !isStaff(interaction) && !interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)){
        const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
        if(!isAdmin){
          const hasStaffRole = STAFF_ROLE_ID && interaction.member.roles.cache.has(STAFF_ROLE_ID);
          if(!hasStaffRole){
            return interaction.reply({ content: '❌ Sem permissão - Só staff pode usar este comando', ephemeral: true });
          }
        }
      }

      if(interaction.commandName==='painel-vendas'){ await interaction.deferReply({ephemeral:true}); await enviarPainelVendas(interaction); return; }
      
      if(interaction.commandName==='setup-tickets' || interaction.commandName==='painel-tickets'){
        await interaction.deferReply({ephemeral:true});
        const canalOpt = interaction.options.getChannel('canal');
        const categoriaOpt = interaction.options.getChannel('categoria');
        const cargoOpt = interaction.options.getRole('cargo_staff');
        
        if(canalOpt) {
          // Se especificou canal, envia lá
          const painel = gerarPainelTicketsProfissional();
          await canalOpt.send(painel);
          return interaction.followUp({ content: `✅ **Painel de tickets profissional criado!**\n> Canal: ${canalOpt}\n> Estilo: Loja gringa premium\n> Botões: 5 tipos de ticket`, ephemeral: true });
        } else {
          // Envia no canal atual
          const painel = gerarPainelTicketsProfissional();
          await interaction.channel.send(painel);
          return interaction.followUp({ content: `✅ **Painel de tickets criado aqui!**\n> ${interaction.channel}\n> Pronto para uso!`, ephemeral: true });
        }
      }

      if(interaction.commandName==='criar-combo'){
        await interaction.deferReply({ephemeral:true});
        const id = interaction.options.getString('id').toLowerCase().replace(/[^a-z0-9-]/g,'-');
        const titulo = interaction.options.getString('titulo'); 
        const banner = interaction.options.getString('banner');
        const estoque=carregar(); 
        if(estoque.find(c=>c.id===id)) return interaction.followUp({content:'❌ ID já existe',ephemeral:true});
        estoque.push({id,titulo,banner,opcoes:[]}); salvar(estoque); await atualizarPainelUnico();
        return interaction.followUp({content:`✅ Produto **${titulo}** criado!`,ephemeral:true});
      }
      if(interaction.commandName==='add-opcao'){
        await interaction.deferReply({ephemeral:true});
        const estoque=carregar(); const combo=estoque.find(c=>c.id===interaction.options.getString('combo_id'));
        if(!combo) return interaction.followUp({content:'❌ Produto não existe',ephemeral:true});
        combo.opcoes.push({id:Date.now().toString(),label:interaction.options.getString('label'),preco:interaction.options.getString('preco'),contas:[]});
        salvar(estoque); await atualizarPainelUnico();
        return interaction.followUp({content:`✅ Plano criado!`,ephemeral:true});
      }
      if(interaction.commandName==='add-credencial'){
        await interaction.deferReply({ephemeral:true});
        const estoque=carregar(); const combo=estoque.find(c=>c.id===interaction.options.getString('combo_id'));
        if(!combo) return interaction.followUp({content:'❌ Produto não existe',ephemeral:true});
        const opcao=combo.opcoes.find(o=>o.label===interaction.options.getString('label'));
        if(!opcao) return interaction.followUp({content:`❌ Plano não encontrado: ${combo.opcoes.map(o=>o.label).join(' | ')}`,ephemeral:true});
        opcao.contas.push(interaction.options.getString('credencial'));
        salvar(estoque); await atualizarPainelUnico();
        return interaction.followUp({content:`✅ Conta adicionada! Agora ${opcao.contas.length}`,ephemeral:true});
      }
      if(interaction.commandName==='ver-estoque'){
        await interaction.deferReply({ephemeral:true});
        const estoque=carregar();
        let t=estoque.map(c=>`**${c.titulo} (${c.id})**\n`+c.opcoes.map(o=>`> ${o.label} | R$ ${o.preco} | ${o.contas.length===0?'🔴':'🟢 QTD:'+o.contas.length}`).join('\n')).join('\n\n')||'Vazio';
        return interaction.followUp({content:t.slice(0,1900),ephemeral:true});
      }
      if(interaction.commandName==='limpar-estoque'){
        await interaction.deferReply({ephemeral:true});
        fs.writeFileSync(ESTOQUE_FILE,'[]'); await atualizarPainelUnico();
        return interaction.followUp({content:'✅ Limpo!',ephemeral:true});
      }
      if(interaction.commandName==='add-rapido'){
        await interaction.deferReply({ephemeral:true});
        const id = interaction.options.getString('id').toLowerCase().replace(/[^a-z0-9-]/g,'-');
        const titulo = interaction.options.getString('titulo');
        const banner = interaction.options.getString('banner');
        const plano = interaction.options.getString('plano');
        const preco = interaction.options.getString('preco');
        const contasRaw = interaction.options.getString('contas');
        const estoque = carregar();
        let combo = estoque.find(c=>c.id===id);
        if(!combo){
          combo = {id, titulo, banner, opcoes:[]};
          estoque.push(combo);
        } else {
          combo.titulo = titulo;
          combo.banner = banner;
        }
        let opcao = combo.opcoes.find(o=>o.label.toLowerCase()===plano.toLowerCase());
        if(!opcao){
          opcao = {id: Date.now().toString(), label: plano, preco, contas:[]};
          combo.opcoes.push(opcao);
        } else {
          opcao.preco = preco;
        }
        const lista = contasRaw.split(/\n| |,|;/).map(s=>s.trim()).filter(Boolean);
        const validas = lista.filter(s=>s.includes(':'));
        opcao.contas.push(...validas);
        salvar(estoque);
        await atualizarPainelUnico();
        return interaction.followUp({content:`✅ **PRODUTO CRIADO RÁPIDO!**\n**${titulo}** > **${plano}** - R$ ${preco}\n📦 ${validas.length} contas adicionadas (total: ${opcao.contas.length})\nID: ${id}`,ephemeral:true});
      }
      if(interaction.commandName==='importar-lote'){
        await interaction.deferReply({ephemeral:true});
        const comboId = interaction.options.getString('combo_id');
        const label = interaction.options.getString('label');
        const contasRaw = interaction.options.getString('contas');
        const estoque = carregar();
        const combo = estoque.find(c=>c.id===comboId);
        if(!combo) return interaction.followUp({content:'❌ Produto ID não existe. Use /ver-estoque para ver IDs',ephemeral:true});
        const opcao = combo.opcoes.find(o=>o.label===label || o.label.toLowerCase()===label.toLowerCase());
        if(!opcao) return interaction.followUp({content:`❌ Plano não encontrado. Planos disponíveis: ${combo.opcoes.map(o=>o.label).join(' | ')}`,ephemeral:true});
        const lista = contasRaw.split(/\n|\r/).flatMap(l=>l.split(/[ ,;]+/)).map(s=>s.trim()).filter(Boolean).filter(s=>s.includes(':'));
        if(lista.length===0) return interaction.followUp({content:'❌ Nenhuma conta válida encontrada. Use formato email:senha',ephemeral:true});
        opcao.contas.push(...lista);
        salvar(estoque);
        await atualizarPainelUnico();
        return interaction.followUp({content:`✅ **${lista.length} contas importadas!**\nPlano: **${label}** - Agora tem **${opcao.contas.length}** unidades\nEx: ${lista[0]}`,ephemeral:true});
      }
      if(interaction.commandName==='editar-preco'){
        await interaction.deferReply({ephemeral:true});
        const comboId = interaction.options.getString('combo_id');
        const label = interaction.options.getString('label');
        const novo = interaction.options.getString('novo_preco');
        const estoque = carregar();
        const combo = estoque.find(c=>c.id===comboId);
        if(!combo) return interaction.followUp({content:'❌ ID não existe',ephemeral:true});
        const opcao = combo.opcoes.find(o=>o.label===label);
        if(!opcao) return interaction.followUp({content:`❌ Plano não existe. Disponíveis: ${combo.opcoes.map(o=>o.label).join(', ')}`,ephemeral:true});
        opcao.preco = novo;
        salvar(estoque);
        await atualizarPainelUnico();
        return interaction.followUp({content:`✅ Preço de **${label}** alterado para **R$ ${novo}**`,ephemeral:true});
      }
      if(interaction.commandName==='saldo-cliente'){
        await interaction.deferReply({ephemeral:true});
        const user = interaction.options.getUser('usuario');
        const clientes = carregarClientes();
        const dados = clientes[user.id] || { totalGasto: 0, compras: [] };
        const cargo = getCargoPorValor(dados.totalGasto);
        const embed = new EmbedBuilder()
         .setColor(0xFFD700)
         .setTitle(`💰 SALDO DE ${user.username.toUpperCase()}`)
         .setDescription(
`**Usuário:** ${user}
**Total gasto:** R$ ${dados.totalGasto.toFixed(2).replace('.',',')}
**Cargo:** ${cargo ? `**${cargo.nome.toUpperCase()}**` : 'Nenhum'}
**Compras:** ${dados.compras.length}

${dados.compras.length>0 ? dados.compras.map(c=>`> ${c.produto} - R$ ${c.preco.toFixed(2).replace('.',',')} - ${new Date(c.data).toLocaleDateString('pt-BR')}`).join('\n') : '> Nenhuma compra'}
`
         );
        return interaction.followUp({ embeds: [embed], ephemeral: true });
      }
      if(interaction.commandName==='ticket-add'){
        await interaction.deferReply({ephemeral:true});
        if(!isTicketChannel(interaction.channel)){
          return interaction.followUp({ content: '❌ Só pode usar dentro de um ticket!\n> Este canal não parece ser um ticket. Verifique se está dentro de um ticket criado pelo bot.', ephemeral: true });
        }
        const usuario = interaction.options.getUser('usuario');
        await interaction.channel.permissionOverwrites.edit(usuario.id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
        return interaction.followUp({ content: `✅ ${usuario} adicionado ao ticket!`, ephemeral: false });
      }
      if(interaction.commandName==='ticket-remove'){
        await interaction.deferReply({ephemeral:true});
        if(!isTicketChannel(interaction.channel)){
          return interaction.followUp({ content: '❌ Só pode usar dentro de um ticket!\n> Este canal não parece ser um ticket. Verifique se está dentro de um ticket criado pelo bot.', ephemeral: true });
        }
        const usuario = interaction.options.getUser('usuario');
        await interaction.channel.permissionOverwrites.delete(usuario.id).catch(()=>{});
        return interaction.followUp({ content: `✅ ${usuario} removido do ticket!`, ephemeral: false });
      }
      if(interaction.commandName==='ticket-transcript'){
        await interaction.deferReply({ephemeral:true});
        const filePath = await gerarTranscript(interaction.channel);
        if(filePath){
          const file = new AttachmentBuilder(filePath);
          return interaction.followUp({ content: `📋 Transcript de ${interaction.channel.name}`, files: [file], ephemeral: false });
        } else {
          return interaction.followUp({ content: '❌ Erro ao gerar transcript', ephemeral: true });
        }
      }
      if(interaction.commandName==='ver-avaliacoes'){
        await interaction.deferReply({ephemeral:true});
        const avaliacoes = carregarAvaliacoes();
        if(avaliacoes.length===0){
          return interaction.followUp({ content: '📭 Ainda não tem avaliações. Quando clientes avaliarem tickets, aparecerá aqui!', ephemeral: true });
        }
        const total = avaliacoes.length;
        const media = (avaliacoes.reduce((a,b)=>a+b.estrelas,0) / total).toFixed(1);
        const cinco = avaliacoes.filter(a=>a.estrelas===5).length;
        const quatro = avaliacoes.filter(a=>a.estrelas===4).length;
        const tres = avaliacoes.filter(a=>a.estrelas===3).length;
        const dois = avaliacoes.filter(a=>a.estrelas===2).length;
        const um = avaliacoes.filter(a=>a.estrelas===1).length;
        
        const ultimas = avaliacoes.slice(-5).reverse();
        
        const embed = new EmbedBuilder()
          .setColor(0xFFD700)
          .setAuthor({ name: 'LEVIATHAN ACCOUNTS • AVALIAÇÕES', iconURL: 'https://i.imgur.com/8QJ4sQy.png' })
          .setTitle(`⭐ ESTATÍSTICAS DE AVALIAÇÕES • ${total} avaliações`)
          .setDescription(
`**Média geral:** ${media} ⭐ (${total} avaliações)

**📊 Distribuição:**
> ⭐⭐⭐⭐⭐ 5 estrelas: ${cinco} (${((cinco/total)*100).toFixed(1)}%)
> ⭐⭐⭐⭐ 4 estrelas: ${quatro} (${((quatro/total)*100).toFixed(1)}%)
> ⭐⭐⭐ 3 estrelas: ${tres} (${((tres/total)*100).toFixed(1)}%)
> ⭐⭐ 2 estrelas: ${dois} (${((dois/total)*100).toFixed(1)}%)
> ⭐ 1 estrela: ${um} (${((um/total)*100).toFixed(1)}%)

**📋 Últimas 5 avaliações:**
${ultimas.map(a=>`> ${'⭐'.repeat(a.estrelas)} ${a.estrelas}/5 - ${a.clienteTag} - ${new Date(a.data).toLocaleDateString('pt-BR')} - ${a.ticket}`).join('\n') || '> Nenhuma'}

**🏆 Status da loja:**
> ${media >= 4.5 ? '🌟 EXCELENTE - Loja 5 estrelas!' : media >= 4.0 ? '⭐ MUITO BOA - Quase perfeita!' : media >= 3.0 ? '💛 BOA - Pode melhorar' : '⚠️ PRECISA MELHORAR'}
`
          )
          .setFooter({ text: `Leviathan Accounts • Sistema de avaliações profissional`, iconURL: 'https://i.imgur.com/8QJ4sQy.png' })
          .setTimestamp();
        
        return interaction.followUp({ embeds: [embed], ephemeral: true });
      }
      if(interaction.commandName==='antiraid'){
        await interaction.deferReply({ephemeral:true});
        const acao = interaction.options.getString('acao');
        const usuario = interaction.options.getUser('usuario');
        
        if(acao==='status'){
          const embed = new EmbedBuilder()
            .setColor(antiNukeConfig.enabled ? 0x00FF7F : 0xFF4444)
            .setTitle(`🛡️ ANTI-NUKE - ${antiNukeConfig.enabled ? 'ATIVADO ✅' : 'DESATIVADO ❌'}`)
            .setDescription(
`**Status:** ${antiNukeConfig.enabled ? '🟢 Protegendo servidor' : '🔴 Desativado'}
**Punição:** ${antiNukeConfig.punish === 'ban' ? '🔨 Banir' : '👢 Kickar'}

**📊 Limites configurados (em ${antiNukeConfig.timeWindow/1000}s):**
> 📺 Canais deletados: ${antiNukeConfig.maxChannelDelete}
> 📺 Canais criados: ${antiNukeConfig.maxChannelCreate}
> 👑 Cargos deletados: ${antiNukeConfig.maxRoleDelete}
> 👑 Cargos criados: ${antiNukeConfig.maxRoleCreate}
> 🔨 Bans: ${antiNukeConfig.maxBan}
> 👢 Kicks: ${antiNukeConfig.maxKick}
> 🔗 Webhooks: ${antiNukeConfig.maxWebhook}

**👤 Whitelist:**
> ${WHITELIST_IDS.map(id=>`<@${id}>`).join(', ') || 'Nenhum'}
> + Dono do servidor
> + Cargo Staff (<@&${STAFF_ROLE_ID}>)
> + Bot

**📋 O que protege:**
> ✅ Deletar canais em massa
> ✅ Criar canais spam (raid)
> ✅ Deletar cargos em massa
> ✅ Criar cargo com ADM
> ✅ Ban em massa
> ✅ Kick em massa
> ✅ Webhook spam
> ✅ @everyone spam
> ✅ Link de webhook vazado

**💾 Backup:** Use /backup-servidor para salvar canais e cargos
`
            )
            .setFooter({ text: 'Leviathan Accounts • Sistema Anti-Nuke Profissional' })
            .setTimestamp();
          return interaction.followUp({ embeds: [embed], ephemeral: true });
        }
        
        if(acao==='ativar'){
          antiNukeConfig.enabled = true;
          return interaction.followUp({ content: '✅ **Anti-nuke ATIVADO!**\n> Seu servidor agora está protegido contra destruição!', ephemeral: true });
        }
        
        if(acao==='desativar'){
          antiNukeConfig.enabled = false;
          return interaction.followUp({ content: '⚠️ **Anti-nuke DESATIVADO!**\n> Servidor vulnerável! Ative de novo com /antiraid ativar', ephemeral: true });
        }
        
        if(acao==='whitelist_add'){
          if(!usuario) return interaction.followUp({ content: '❌ Mencione um usuário para adicionar na whitelist!', ephemeral: true });
          if(WHITELIST_IDS.includes(usuario.id)){
            return interaction.followUp({ content: `⚠️ ${usuario} já está na whitelist!`, ephemeral: true });
          }
          WHITELIST_IDS.push(usuario.id);
          return interaction.followUp({ content: `✅ ${usuario} adicionado na whitelist anti-nuke!\n> Ele não será punido pelo sistema`, ephemeral: true });
        }
        
        if(acao==='whitelist_remove'){
          if(!usuario) return interaction.followUp({ content: '❌ Mencione um usuário para remover da whitelist!', ephemeral: true });
          const idx = WHITELIST_IDS.indexOf(usuario.id);
          if(idx===-1) return interaction.followUp({ content: `⚠️ ${usuario} não está na whitelist!`, ephemeral: true });
          WHITELIST_IDS.splice(idx, 1);
          return interaction.followUp({ content: `✅ ${usuario} removido da whitelist!`, ephemeral: true });
        }
      }
      if(interaction.commandName==='automod'){
        await interaction.deferReply({ephemeral:true});
        const acao = interaction.options.getString('acao');
        
        if(acao==='status'){
          const cfg = automodConfig;
          const embed = new EmbedBuilder()
            .setColor(cfg.enabled ? 0x00FF7F : 0xFF4444)
            .setTitle(`🤖 AUTOMOD - ${cfg.enabled ? 'ATIVADO ✅' : 'DESATIVADO ❌'}`)
            .setDescription(
`**Status geral:** ${cfg.enabled ? '🟢 Ativo' : '🔴 Desativado'}
**Punição:** Mute de ${cfg.muteTime} min após ${cfg.maxWarnings} avisos

**📋 Filtros:**
> 🤬 Anti-palavrão: ${cfg.antiPalavrao ? '🟢 ON' : '🔴 OFF'}
> 🔗 Anti-link: ${cfg.antiLink ? '🟢 ON' : '🔴 OFF'} (liberado em #parcerias)
> 📨 Anti-invite (discord.gg): ${cfg.antiInvite ? '🟢 ON' : '🔴 OFF'} (liberado em #parcerias)
> 💬 Anti-spam: ${cfg.antiSpam ? '🟢 ON' : '🔴 OFF'}
> 🔁 Anti-flood (5 msgs/5s): ${cfg.antiFlood ? '🟢 ON' : '🔴 OFF'}
> 📢 Anti-@everyone: ${cfg.antiEveryone ? '🟢 ON' : '🔴 OFF'}

**🤝 Canais liberados para convites:**
> #parcerias, #parceria, #🤝parcerias, #divulgações
> Tickets de parceria (🤝 Parceria)

**👤 Quem é ignorado:**
> ✅ Staff (<@&${STAFF_ROLE_ID}>)
> ✅ Dono do servidor
> ✅ Whitelist anti-nuke
> ✅ Tickets normais (não modera dentro)

**🔧 Comandos:**
> /automod ativar - Ativa tudo
> /automod desativar - Desativa tudo
> /automod palavrão_on/off - Liga/desliga palavrão
> /automod link_on/off - Liga/desliga link

**📝 Palavrões detectados:** ${TODOS_PALAVROES.length} palavras
`
            )
            .setFooter({ text: 'Leviathan Accounts • Automod Profissional' })
            .setTimestamp();
          return interaction.followUp({ embeds: [embed], ephemeral: true });
        }
        
        if(acao==='ativar'){
          automodConfig.enabled = true;
          automodConfig.antiPalavrao = true;
          automodConfig.antiLink = true;
          automodConfig.antiInvite = true;
          automodConfig.antiSpam = true;
          automodConfig.antiFlood = true;
          salvarAutomod(automodConfig);
          return interaction.followUp({ content: '✅ **Automod ATIVADO!**\n> Anti-palavrão, anti-link, anti-spam ligado! (anti-caps removido, parceria liberada)', ephemeral: true });
        }
        
        if(acao==='desativar'){
          automodConfig.enabled = false;
          salvarAutomod(automodConfig);
          return interaction.followUp({ content: '⚠️ **Automod DESATIVADO!**\n> Servidor sem filtro de mensagens', ephemeral: true });
        }
        
        const map = {
          'palavrao_on': ['antiPalavrao', true, 'Anti-palavrão ATIVADO'],
          'palavrao_off': ['antiPalavrao', false, 'Anti-palavrão DESATIVADO'],
          'link_on': ['antiLink', true, 'Anti-link ATIVADO'],
          'link_off': ['antiLink', false, 'Anti-link DESATIVADO'],
          'invite_on': ['antiInvite', true, 'Anti-invite ATIVADO'],
          'invite_off': ['antiInvite', false, 'Anti-invite DESATIVADO'],
          'spam_on': ['antiSpam', true, 'Anti-spam ATIVADO'],
          'spam_off': ['antiSpam', false, 'Anti-spam DESATIVADO'],
        };
        
        if(map[acao]){
          const [key, val, msg] = map[acao];
          automodConfig[key] = val;
          salvarAutomod(automodConfig);
          return interaction.followUp({ content: `✅ **${msg}!**`, ephemeral: true });
        }
      }
      if(interaction.commandName==='setup-pings'){
        await interaction.deferReply({ephemeral:true});
        const canalOpt = interaction.options.getChannel('canal');
        const targetChannel = canalOpt || interaction.channel;
        const guild = interaction.guild;
        
        // Verifica permissão do bot primeiro
        if(!guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)){
          return interaction.followUp({ content: '❌ **Bot sem permissão!**\n> Preciso da permissão **Gerenciar Cargos** para criar os cargos de ping.\n> Dá essa permissão pra mim e tenta de novo!', ephemeral: true });
        }
        
        const cargosCriados = [];
        const cargosExistentes = [];
        
        // Cria todos os cargos em paralelo - MUITO mais rápido
        const promessas = pingsConfig.cargos.map(async (ping) => {
          let role = guild.roles.cache.find(r => r.name === ping.nome || r.name.toLowerCase().includes(ping.id.toLowerCase()));
          if(!role){
            try{
              role = await guild.roles.create({ name: ping.nome, color: ping.cor, reason: 'Cargo de ping Leviathan - sistema de notificações', mentionable: true });
              cargosCriados.push(role.name);
              return role;
            }catch(e){
              console.log('Erro criar cargo '+ping.nome+': '+e.message);
              return null;
            }
          } else {
            cargosExistentes.push(role.name);
            return role;
          }
        });
        
        // Aguarda todas as criações (máximo 3 segundos)
        await Promise.all(promessas).catch(()=>{});
        
        const embed = new EmbedBuilder()
          .setColor(0xFFD700)
          .setAuthor({ name: 'LEVIATHAN ACCOUNTS • NOTIFICAÇÕES', iconURL: 'https://i.imgur.com/8QJ4sQy.png' })
          .setTitle('🔔 ESCOLHA SUAS NOTIFICAÇÕES')
          .setDescription('### Bem-vindo ao sistema de pings da Leviathan!\n\n> Selecione abaixo quais notificações você quer receber\n> Você pode escolher várias e mudar quando quiser\n\n**📋 Cargos disponíveis:**\n\n'+pingsConfig.cargos.map(p => '> '+p.emoji+' **'+p.nome+'** - '+p.descricao).join('\n')+'\n\n**🎯 Como funciona:**\n> Clique nos botões abaixo para **ativar/desativar**\n> Verde = você tem o cargo | Cinza = você não tem\n> Use para não perder promoções e novidades!\n\n**⚡ Dica:** Ative **Notificações** para receber tudo!\n')
          .setThumbnail('https://i.imgur.com/8QJ4sQy.png')
          .setFooter({ text: 'Leviathan Accounts • Clique para ativar/desativar • Sistema de pings' })
          .setTimestamp();
        const row1 = new ActionRowBuilder().addComponents(...pingsConfig.cargos.slice(0,3).map(p => new ButtonBuilder().setCustomId('ping_'+p.id).setLabel(p.nome.replace(/[^\w\s]/gi,'').trim().slice(0,20)).setStyle(ButtonStyle.Secondary).setEmoji(p.emoji)));
        const row2 = new ActionRowBuilder().addComponents(...pingsConfig.cargos.slice(3,6).map(p => new ButtonBuilder().setCustomId('ping_'+p.id).setLabel(p.nome.replace(/[^\w\s]/gi,'').trim().slice(0,20)).setStyle(ButtonStyle.Secondary).setEmoji(p.emoji)));
        const row3 = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ping_todos').setLabel('Ativar Todos').setStyle(ButtonStyle.Success).setEmoji('✅'), new ButtonBuilder().setCustomId('ping_remover_todos').setLabel('Remover Todos').setStyle(ButtonStyle.Danger).setEmoji('❌'));
        
        try {
          await targetChannel.send({ embeds: [embed], components: [row1, row2, row3] });
          return interaction.followUp({ content: '✅ **Painel de pings criado em '+targetChannel+'!**\n> Novos: '+(cargosCriados.join(', ') || 'nenhum')+'\n> Existentes: '+(cargosExistentes.join(', ') || 'nenhum')+'\n> Total: '+pingsConfig.cargos.length+' cargos\n> Pronto para uso!', ephemeral: true });
        } catch(e){
          return interaction.followUp({ content: '❌ Erro ao enviar painel: '+e.message+'\n> Verifica se tenho permissão para enviar mensagens em '+targetChannel, ephemeral: true });
        }
      }
      if(interaction.commandName==='ping'){
        await interaction.deferReply({ephemeral:false});
        const cargoId = interaction.options.getString('cargo');
        const mensagem = interaction.options.getString('mensagem');
        const guild = interaction.guild;
        let rolesToPing = [];
        if(cargoId === 'todos'){
          for(const p of pingsConfig.cargos){
            const role = guild.roles.cache.find(r => r.name.toLowerCase().includes(p.id) || r.name === p.nome);
            if(role) rolesToPing.push(role);
          }
        } else {
          const pingConfig = pingsConfig.cargos.find(p => p.id === cargoId);
          if(!pingConfig) return interaction.followUp({ content: '❌ Cargo não encontrado', ephemeral: true });
          const role = guild.roles.cache.find(r => r.name === pingConfig.nome || r.name.toLowerCase().includes(pingConfig.id));
          if(!role) return interaction.followUp({ content: '❌ Cargo '+pingConfig.nome+' não existe. Use /setup-pings primeiro!', ephemeral: true });
          rolesToPing = [role];
        }
        if(rolesToPing.length === 0) return interaction.followUp({ content: '❌ Nenhum cargo de ping encontrado. Use /setup-pings para criar!', ephemeral: true });
        const mentions = rolesToPing.map(r => r.toString()).join(' ');
        const embed = new EmbedBuilder().setColor(0xFFD700).setAuthor({ name: 'LEVIATHAN ACCOUNTS • AVISO', iconURL: 'https://i.imgur.com/8QJ4sQy.png' }).setTitle((rolesToPing[0]?.name || '📢')+' • Notificação').setDescription(mensagem).setFooter({ text: 'Enviado por '+interaction.user.tag+' • Leviathan Accounts', iconURL: interaction.user.displayAvatarURL() }).setTimestamp();
        await interaction.followUp({ content: mentions, embeds: [embed], allowedMentions: { roles: rolesToPing.map(r=>r.id) } });
        return;
      }
      if(interaction.commandName==='backup-servidor'){
        await interaction.deferReply({ephemeral:true});
        try{
          const guild = interaction.guild;
          const canais = guild.channels.cache.map(c => ({
            id: c.id,
            name: c.name,
            type: c.type,
            parentId: c.parentId,
            position: c.position,
            topic: c.topic || null
          }));
          
          const cargos = guild.roles.cache.filter(r => !r.managed && r.name !== '@everyone').map(r => ({
            id: r.id,
            name: r.name,
            color: r.color,
            permissions: r.permissions.bitfield.toString(),
            position: r.position,
            hoist: r.hoist,
            mentionable: r.mentionable
          }));
          
          const backup = {
            guildId: guild.id,
            guildName: guild.name,
            createdAt: new Date().toISOString(),
            canais,
            cargos,
            totalCanais: canais.length,
            totalCargos: cargos.length
          };
          
          const backupStr = JSON.stringify(backup, null, 2);
          const filePath = `./backup-${guild.id}-${Date.now()}.json`;
          fs.writeFileSync(filePath, backupStr);
          
          const file = new AttachmentBuilder(filePath);
          const embed = new EmbedBuilder()
            .setColor(0x00FF7F)
            .setTitle('💾 BACKUP DO SERVIDOR CRIADO!')
            .setDescription(
`**Servidor:** ${guild.name}
**Canais salvos:** ${canais.length}
**Cargos salvos:** ${cargos.length}
**Data:** <t:${Math.floor(Date.now()/1000)}:F>

> Backup salvo com sucesso!
> Guarde este arquivo em local seguro
> Em caso de ataque, use para restaurar

**⚠️ IMPORTANTE:**
> Este arquivo contém estrutura do servidor
> Não compartilhe com desconhecidos
`
            )
            .setFooter({ text: 'Leviathan Accounts • Sistema de Backup' });
          
          await interaction.followUp({ embeds: [embed], files: [file], ephemeral: true });
          fs.unlinkSync(filePath);
        }catch(e){
          await interaction.followUp({ content: `❌ Erro ao criar backup: ${e.message}`, ephemeral: true });
        }
        return;
      }
    }

    // ===== HANDLERS DE BOTÕES DE TICKETS PROFISSIONAIS =====
    if(interaction.isButton()){
      // Criação de tickets profissionais
      if(interaction.customId.startsWith('ticket_create_')){
        const tipo = interaction.customId.replace('ticket_create_', '');
        return criarTicketProfissional(interaction, tipo);
      }

      // Controles dentro do ticket
      if(interaction.customId==='ticket_close' || interaction.customId==='fechar_ticket'){
        if(!isTicketChannel(interaction.channel)){
          // Se não detectar como ticket, ainda permite fechar se estiver na categoria de tickets OU for staff tentando fechar
          const isInTicketCategory = CATEGORIA_TICKET_ID && interaction.channel.parentId === CATEGORIA_TICKET_ID;
          const isStaffTrying = isStaff(interaction) || interaction.member.permissions.has(PermissionFlagsBits.ManageChannels);
          if(!isInTicketCategory && !isStaffTrying){
            return interaction.reply({ content: '❌ Só pode fechar dentro de um ticket!\n> Se este É um ticket, peça para um staff usar `/fechar` ou o botão de fechar.', ephemeral: true });
          }
        }
        
        // Sistema de avaliação profissional antes de fechar
        const embedAvaliacao = new EmbedBuilder()
          .setColor(0xFFD700)
          .setAuthor({ name: 'LEVIATHAN ACCOUNTS • AVALIAÇÃO', iconURL: 'https://i.imgur.com/8QJ4sQy.png' })
          .setTitle('⭐ Avalie nosso atendimento!')
          .setDescription(
`### Obrigado por usar a Leviathan Accounts!

> Seu ticket **${interaction.channel.name}** será fechado em breve.

**📋 Como foi seu atendimento?**
> Clique nas estrelas abaixo para avaliar
> Sua opinião é muito importante para nós!

**🎁 Ao avaliar, você:**
> ✅ Ajuda a melhorar nosso atendimento
> ✅ Ganha prioridade nos próximos tickets
> ✅ Participa de sorteios mensais

**⏱️ Este canal será deletado em 30 segundos após avaliar**
> Se não avaliar, fechará automaticamente em 60 segundos
`
          )
          .setFooter({ text: 'Leviathan Accounts • Sua avaliação nos ajuda a crescer', iconURL: 'https://i.imgur.com/8QJ4sQy.png' })
          .setTimestamp();

        const rowEstrelas = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('avaliacao_5').setLabel('⭐⭐⭐⭐⭐').setStyle(ButtonStyle.Success).setEmoji('🌟'),
          new ButtonBuilder().setCustomId('avaliacao_4').setLabel('⭐⭐⭐⭐').setStyle(ButtonStyle.Primary).setEmoji('⭐'),
          new ButtonBuilder().setCustomId('avaliacao_3').setLabel('⭐⭐⭐').setStyle(ButtonStyle.Secondary).setEmoji('⭐'),
          new ButtonBuilder().setCustomId('avaliacao_2').setLabel('⭐⭐').setStyle(ButtonStyle.Secondary).setEmoji('⭐'),
          new ButtonBuilder().setCustomId('avaliacao_1').setLabel('⭐').setStyle(ButtonStyle.Danger).setEmoji('💔')
        );
        
        const rowFechar = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('ticket_close_final').setLabel('Fechar sem avaliar').setStyle(ButtonStyle.Danger).setEmoji('🔒')
        );

        await interaction.reply({ embeds: [embedAvaliacao], components: [rowEstrelas, rowFechar] });
        
        // Auto-fecha em 60 segundos se não avaliar
        setTimeout(()=>interaction.channel.delete().catch(()=>{}),60000);
        return;
      }

      if(interaction.customId==='ticket_close_final'){
        await interaction.reply({ content: '🔒 **Fechando ticket em 3 segundos...**\n> Obrigado por usar a Leviathan Accounts! Volte sempre 💎' });
        setTimeout(()=>interaction.channel.delete().catch(()=>{}),3000);
        return;
      }

      // Sistema de avaliação com estrelas
      if(interaction.customId.startsWith('avaliacao_')){
        const estrelas = parseInt(interaction.customId.replace('avaliacao_', ''));
        const estrelasEmoji = '⭐'.repeat(estrelas) + '☆'.repeat(5-estrelas);
        
        // Salva avaliação
        try {
          const avaliacoes = carregarAvaliacoes();
          // Tenta achar quem é o cliente (dono do ticket)
          let clienteId = null;
          let clienteTag = 'Desconhecido';
          try {
            const topic = interaction.channel.topic || '';
            const match = topic.match(/(\d{17,19})/);
            if(match) clienteId = match[1];
            // Tenta pegar da permissão do canal
            if(!clienteId){
              const overwrites = interaction.channel.permissionOverwrites.cache;
              for(const [id, ow] of overwrites){
                if(id !== interaction.guild.roles.everyone.id && id !== STAFF_ROLE_ID && id !== interaction.client.user.id){
                  clienteId = id;
                  break;
                }
              }
            }
            if(clienteId){
              const member = await interaction.guild.members.fetch(clienteId).catch(()=>null);
              if(member) clienteTag = member.user.tag;
            }
          } catch {}
          
          const novaAvaliacao = {
            id: Date.now().toString(),
            estrelas,
            ticket: interaction.channel.name,
            ticketId: interaction.channel.id,
            clienteId: clienteId || interaction.user.id,
            clienteTag: clienteTag,
            avaliadorId: interaction.user.id,
            avaliadorTag: interaction.user.tag,
            data: new Date().toISOString(),
            tipo: interaction.channel.topic?.includes('compra') ? 'compra' : interaction.channel.topic?.includes('suporte') ? 'suporte' : 'geral'
          };
          
          avaliacoes.push(novaAvaliacao);
          salvarAvaliacoes(avaliacoes);
          
          // Calcula média
          const media = avaliacoes.length > 0 ? (avaliacoes.reduce((a,b)=>a+b.estrelas,0) / avaliacoes.length).toFixed(1) : estrelas;
          
          // Embed de agradecimento
          const embedObrigado = new EmbedBuilder()
            .setColor(estrelas >= 4 ? 0x00FF7F : estrelas >= 3 ? 0xFFD700 : 0xFF4444)
            .setTitle(estrelas === 5 ? '🌟 OBRIGADO PELA AVALIAÇÃO PERFEITA!' : estrelas >= 4 ? '⭐ Obrigado pela avaliação!' : '💛 Obrigado pelo feedback!')
            .setDescription(
`${estrelasEmoji} **${estrelas}/5 estrelas**

> **Avaliação registrada com sucesso!**
> Muito obrigado pelo seu feedback ${interaction.user}!

**📊 Estatísticas da loja:**
> Média atual: **${media} ⭐** (${avaliacoes.length} avaliações)
> Sua avaliação: **${estrelasEmoji}**

${estrelas === 5 ? `
**🎉 VOCÊ É INCRÍVEL!**
> Avaliação 5 estrelas nos ajuda MUITO!
> Você ganhou prioridade nos próximos atendimentos
> E participa do sorteio mensal de contas grátis!
` : estrelas >= 3 ? `
**💎 Obrigado!**
> Vamos continuar melhorando para chegar no 5 estrelas!
> Seu feedback é essencial!
` : `
**😢 Poxa, o que houve?**
> Lamentamos que não foi 5 estrelas
> Nossa equipe vai analisar o que melhorar
> Se tiver problema pendente, fale com <@&${STAFF_ROLE_ID || 'staff'}>
`}

**🔒 Este ticket será fechado em 5 segundos...**
`
            )
            .setFooter({ text: `Leviathan Accounts • Avaliação #${avaliacoes.length} • Obrigado!`, iconURL: 'https://i.imgur.com/8QJ4sQy.png' })
            .setTimestamp();
          
          // Envia no canal de avaliações se configurado
          if(CANAL_AVALIACOES_ID){
            try {
              const canalAvaliacoes = await interaction.guild.channels.fetch(CANAL_AVALIACOES_ID).catch(()=>null);
              if(canalAvaliacoes){
                const embedLog = new EmbedBuilder()
                  .setColor(estrelas >= 4 ? 0x00FF7F : 0xFFD700)
                  .setAuthor({ name: `Nova Avaliação • ${estrelas} estrelas`, iconURL: interaction.user.displayAvatarURL() })
                  .setDescription(
`**Cliente:** ${interaction.user} (\`${clienteTag}\`)
**Ticket:** \`${interaction.channel.name}\`
**Nota:** ${estrelasEmoji} (${estrelas}/5)
**Tipo:** ${novaAvaliacao.tipo}
**Média da loja:** ${media} ⭐ (${avaliacoes.length} avaliações)
**Data:** <t:${Math.floor(Date.now()/1000)}:F>

> Avaliação feita por ${interaction.user.tag}
`
                  )
                  .setFooter({ text: `Leviathan Accounts • Sistema de avaliações` })
                  .setTimestamp();
                
                await canalAvaliacoes.send({ embeds: [embedLog] });
              }
            } catch(e){ console.log('Erro enviar log avaliação:', e.message); }
          }
          
          await interaction.reply({ embeds: [embedObrigado] });
          setTimeout(()=>interaction.channel.delete().catch(()=>{}),5000);
          
        } catch(e){
          console.log('Erro avaliação:', e);
          await interaction.reply({ content: `✅ Avaliação ${estrelasEmoji} registrada! Fechando em 3s...`, ephemeral: false });
          setTimeout(()=>interaction.channel.delete().catch(()=>{}),3000);
        }
        return;
      }

      if(interaction.customId==='ticket_claim'){
        if(!isStaff(interaction)) return interaction.reply({ content: '❌ Só staff pode reivindicar tickets!', ephemeral: true });
        const embed = new EmbedBuilder()
          .setColor(0x00FF7F)
          .setDescription(`✋ Ticket reivindicado por ${interaction.user}!\n> Agora ${interaction.user} é o responsável por este atendimento.`);
        await interaction.channel.send({ embeds: [embed] });
        return interaction.reply({ content: `✅ Você reivindicou este ticket!`, ephemeral: true });
      }

      if(interaction.customId==='ticket_transcript'){
        await interaction.deferReply({ ephemeral: true });
        const filePath = await gerarTranscript(interaction.channel);
        if(filePath){
          const file = new AttachmentBuilder(filePath);
          return interaction.followUp({ content: `📋 Transcript gerado!`, files: [file], ephemeral: true });
        } else {
          return interaction.followUp({ content: '❌ Erro ao gerar transcript', ephemeral: true });
        }
      }

      if(interaction.customId==='ticket_add_user'){
        return interaction.reply({ content: '👤 Use o comando `/ticket-add @usuario` para adicionar alguém ao ticket!', ephemeral: true });
      }

      if(interaction.customId==='ticket_notify'){
        await interaction.reply({ content: `🔔 ${STAFF_ROLE_ID ? `<@&${STAFF_ROLE_ID}>` : '@Staff'} **foi notificado!**\n> Equipe chamada por ${interaction.user}`, ephemeral: false });
        return;
      }
      if(interaction.customId.startsWith('ping_')){
        const pingId = interaction.customId.replace('ping_', '');
        if(pingId === 'todos'){
          let adicionados = 0;
          for(const p of pingsConfig.cargos){
            const role = interaction.guild.roles.cache.find(r => r.name === p.nome || r.name.toLowerCase().includes(p.id));
            if(role && !interaction.member.roles.cache.has(role.id)){ try{ await interaction.member.roles.add(role); adicionados++; }catch{} }
          }
          return interaction.reply({ content: `✅ **${adicionados} cargos de notificação ativados!**\n> Agora você vai receber todos os pings da loja!`, ephemeral: true });
        }
        if(pingId === 'remover_todos'){
          let removidos = 0;
          for(const p of pingsConfig.cargos){
            const role = interaction.guild.roles.cache.find(r => r.name === p.nome || r.name.toLowerCase().includes(p.id));
            if(role && interaction.member.roles.cache.has(role.id)){ try{ await interaction.member.roles.remove(role); removidos++; }catch{} }
          }
          return interaction.reply({ content: `❌ **${removidos} cargos removidos!**\n> Você não vai mais receber pings`, ephemeral: true });
        }
        const pingConfig = pingsConfig.cargos.find(p => p.id === pingId);
        if(!pingConfig) return interaction.reply({ content: '❌ Cargo não encontrado', ephemeral: true });
        const role = interaction.guild.roles.cache.find(r => r.name === pingConfig.nome || r.name.toLowerCase().includes(pingConfig.id));
        if(!role) return interaction.reply({ content: `❌ Cargo **${pingConfig.nome}** não existe. Use /setup-pings para criar!`, ephemeral: true });
        if(interaction.member.roles.cache.has(role.id)){
          await interaction.member.roles.remove(role).catch(()=>{});
          return interaction.reply({ content: `❌ **${pingConfig.emoji} ${pingConfig.nome} removido!**\n> Você não vai mais receber esse tipo de notificação`, ephemeral: true });
        } else {
          await interaction.member.roles.add(role).catch(()=>{});
          return interaction.reply({ content: `✅ **${pingConfig.emoji} ${pingConfig.nome} ativado!**\n> ${pingConfig.descricao}`, ephemeral: true });
        }
      }
    }


    if(interaction.isStringSelectMenu() && interaction.customId==='selecionar_combo'){
      const comboId = interaction.values[0]; const estoque=carregar(); const combo=estoque.find(c=>c.id===comboId);
      if(!combo) return interaction.reply({content:'❌ Produto não encontrado',ephemeral:true});
      const total = combo.opcoes.reduce((a,b)=>a+b.contas.length,0);
      
      const embed = new EmbedBuilder()
       .setColor(total===0 ? 0x2b2d31 : 0xFFD700)
       .setAuthor({ name: `${combo.titulo} • LEVIATHAN OFFICIAL`, iconURL: 'https://i.imgur.com/8QJ4sQy.png' })
       .setTitle(`${combo.titulo}`)
       .setDescription(
`**Produto Oficial Leviathan Accounts**
> Level 2650-2800 • Full Awakening • Raças V4
> Itens raros • Frutas míticas • Verificado

**📦 Estoque:** \`${total} unidades\` ${total===0?'🔴 ESGOTADO':'🟢 DISPONÍVEL'}
**⚡ Entrega:** Automática em 5 segundos
**🛡️ Garantia:** 7 dias

**Escolha o plano abaixo:**
`
       )
       .setFooter({ text: `Leviathan • ${combo.id} • Produto verificado` })
       .setTimestamp();
      if(isUrl(combo.banner)) embed.setImage(combo.banner);

      const opcoesMenu = combo.opcoes.map(op => {
        const ind = op.contas.length === 0;
        return new StringSelectMenuOptionBuilder()
         .setLabel(`${op.label}`.slice(0,100))
         .setDescription(ind ? `R$ ${op.preco} | 🔴 ESGOTADO` : `R$ ${op.preco} | 🟢 ${op.contas.length} disponíveis`.slice(0,100))
         .setValue(`${combo.id}|${op.id}`)
         .setEmoji(ind ? '🔴' : '💎')
      });
      if(opcoesMenu.length===0) return interaction.reply({content:'⚠️ Sem planos. Use /add-opcao',ephemeral:true});
      return interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('comprar_select').setPlaceholder('💎 Escolha o plano').addOptions(opcoesMenu))], ephemeral: true });
    }

    if(interaction.isStringSelectMenu() && interaction.customId==='estoque_vazio'){
      return interaction.reply({content:'🔴 **ESTOQUE INDISPONIVEL!**\n\n> Nenhuma conta disponível no momento.\n> Volte mais tarde ou contate <@&'+STAFF_ROLE_ID+'> para encomendar!', ephemeral: true});
    }

    if(interaction.isStringSelectMenu() && interaction.customId==='comprar_select'){
      const raw = interaction.values[0];
      
      // ===== ANTI-DUPLICAÇÃO: Se clicou 2x em menos de 5 segundos, ignora =====
      const userId = interaction.user.id;
      const agora = Date.now();
      const ultimo = comprasRecentes.get(userId);
      if(ultimo && (agora - ultimo) < 5000){
        console.log(`⚠️ Compra duplicada bloqueada para ${interaction.user.tag} - clicou 2x rápido`);
        return interaction.reply({ content: '⚠️ **Calma!** Você já criou um carrinho há poucos segundos.\n> Verifique seus canais - já tem um ticket aberto pra você!', ephemeral: true });
      }
      comprasRecentes.set(userId, agora);
      // Limpa após 10 segundos
      setTimeout(() => comprasRecentes.delete(userId), 10000);
      
      // ===== Verifica se já tem ticket aberto =====
      try {
        const canais = interaction.guild.channels.cache.filter(c => 
          c.type === ChannelType.GuildText && 
          c.name.includes(interaction.user.username.toLowerCase().slice(0,10)) &&
          c.parentId === CATEGORIA_TICKET_ID
        );
        if(canais.size > 0){
          const canalExistente = canais.first();
          console.log(`⚠️ Usuário ${interaction.user.tag} já tem ticket: ${canalExistente.name}`);
          return interaction.reply({ content: `⚠️ **Você já tem um carrinho aberto!**\n> Vá para ${canalExistente}\n> Feche o ticket atual antes de abrir outro.`, ephemeral: true });
        }
      } catch(e){ console.log('Erro ao verificar tickets existentes:', e.message); }
      
      console.log('COMPRA TENTATIVA:', raw);
      const estoque=carregar();
      console.log('ESTOQUE:', JSON.stringify(estoque).slice(0,1000));
      
      // Novo formato: comboId||label
      let comboId = null;
      let opcaoLabel = raw;
      if(raw.includes('||')){
        const split = raw.split('||');
        comboId = split[0];
        opcaoLabel = split[1];
      } else if(raw.includes('|')){
        // Compatibilidade com formato antigo com |
        const parts = raw.split('|');
        if(parts.length>=2){
          comboId = parts[0];
          opcaoLabel = parts.slice(1).join('|');
        } else {
          opcaoLabel = raw;
        }
      }
      
      opcaoLabel = opcaoLabel.trim();
      if(comboId) comboId = comboId.trim();
      
      // Busca por LABEL (estável, nunca muda)
      let combo = null;
      let opcao = null;
      
      // 1. Tenta achar pelo label exato
      for(const c of estoque){
        if(comboId && c.id!==comboId && c.titulo!==comboId) {
          // Se tem comboId, tenta filtrar mas não obriga
          const maybe = c.opcoes.find(o=> o.label===opcaoLabel || o.label.toLowerCase()===opcaoLabel.toLowerCase() || String(o.id)===opcaoLabel);
          if(maybe && (c.id===comboId || c.titulo.toLowerCase().includes(comboId.toLowerCase()) || comboId.toLowerCase().includes(c.titulo.toLowerCase()))){
            combo=c; opcao=maybe; break;
          }
        }
        const found = c.opcoes.find(o=> o.label===opcaoLabel || o.label.toLowerCase()===opcaoLabel.toLowerCase());
        if(found){ combo=c; opcao=found; break; }
      }
      
      // 2. Busca por ID também (compatibilidade)
      if(!opcao){
        for(const c of estoque){
          const found = c.opcoes.find(o=> String(o.id)===String(opcaoLabel));
          if(found){ combo=c; opcao=found; break; }
        }
      }
      
      // 3. Busca parcial (contém)
      if(!opcao){
        for(const c of estoque){
          const found = c.opcoes.find(o=> opcaoLabel.toLowerCase().includes(o.label.toLowerCase()) || o.label.toLowerCase().includes(opcaoLabel.toLowerCase()));
          if(found){ combo=c; opcao=found; break; }
        }
      }
      
      if(!combo || !opcao){
        console.log('FALHA BUSCA FINAL:', raw, 'tentou label:', opcaoLabel);
        // NÃO mostra erro falso - tenta atualizar painel e mostra estoque real
        await atualizarPainelUnico().catch(()=>{});
        comprasRecentes.delete(userId); // libera pra tentar de novo
        return interaction.reply({content:'🔴 **ESTOQUE INDISPONIVEL NO MOMENTO**\n\n> Não achei **'+opcaoLabel+'** no estoque atual.\n> O painel foi atualizado automaticamente.\n> Tente novamente no novo painel!',ephemeral:true});
      }
      
      if(!opcao.contas || opcao.contas.length===0){
        await atualizarPainelUnico().catch(()=>{});
        comprasRecentes.delete(userId); // libera pra tentar de novo
        return interaction.reply({content:'🔴 **ESTOQUE INDISPONIVEL!**\n\n> **'+opcao.label+'** esgotou agora mesmo!\n> Escolha outra opção.',ephemeral:true});
      }

      // Defer pra não dar timeout enquanto cria canal
      await interaction.deferReply({ ephemeral: true });

      const ticket=await interaction.guild.channels.create({
        name:`🛒・${interaction.user.username}-${opcao.label.toLowerCase().replace(/[^a-z0-9]/g,'-')}`.slice(0,90),
        type:ChannelType.GuildText,
        parent:CATEGORIA_TICKET_ID || undefined,
        permissionOverwrites:[
          {id:interaction.guild.roles.everyone.id,deny:[PermissionFlagsBits.ViewChannel]},
          {id:interaction.user.id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory,PermissionFlagsBits.AttachFiles]},
          ...(STAFF_ROLE_ID ? [{id:STAFF_ROLE_ID,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory,PermissionFlagsBits.ManageChannels]}] : [])
        ]
      });

      const embedProd = new EmbedBuilder()
       .setColor(0xFFD700)
       .setAuthor({ name: 'LEVIATHAN • PRODUTO SELECIONADO', iconURL: 'https://i.imgur.com/8QJ4sQy.png' })
       .setTitle(`${combo.titulo} — ${opcao.label}`)
       .setDescription(
`**Produto Oficial**
> **Plano:** \`${opcao.label}\`
> **Preço:** \`R$ ${opcao.preco}\`
> **Estoque:** \`${opcao.contas.length} unidades\`

**O que você recebe:**
> ✅ Conta nível máximo 2650-2800
> ✅ Godhuman, Sanguine Art, CDK, TTK
> ✅ Raça V4, Soul Guitar, itens raros
> ✅ Email + senha originais
`
       )
       .setImage(isUrl(combo.banner) ? combo.banner : null)
       .setFooter({ text: 'Produto verificado • Entrega garantida' });

      const pixQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(PIX_KEY)}`;

      const embedPay = new EmbedBuilder()
       .setColor(0x000000)
       .setTitle('💳 CHECKOUT • PAGAMENTO VIA PIX')
       .setDescription(
`**💰 Resumo do pedido**
\`\`\`yaml
Produto: ${opcao.label}
Valor: R$ ${opcao.preco}
Entrega: Automática (5s)
Garantia: 7 dias
\`\`\`

**Pix:** ||Copie no botão abaixo||
**Titular:** \`${PIX_NOME}\`

**Total a pagar:** **R$ ${opcao.preco}**

> 1️⃣ Clique em **Pagar no Nubank**
> 2️⃣ Copie a chave Pix
> 3️⃣ Pague no app do Nubank
> 4️⃣ Clique em **Já paguei** e envie comprovante
`
       )
       .setImage(pixQrUrl)
       .setFooter({ text: `Pedido de ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
       .setTimestamp();

      const pixNubankUrl = `https://nubank.com.br/pagar/`;

      const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel(`💳 Pagar R$ ${opcao.preco} no Nubank`).setStyle(ButtonStyle.Link).setURL(pixNubankUrl),
        new ButtonBuilder().setCustomId(`copiar_pix`).setLabel('📋 Copiar Pix').setStyle(ButtonStyle.Secondary)
      );
      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`comprovante_${combo.id}||${opcao.label}`).setLabel('✅ Já paguei').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('fechar_ticket').setLabel('❌ Cancelar').setStyle(ButtonStyle.Danger)
      );
      const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`confirmar_pagamento_${combo.id}||${opcao.label}`).setLabel('✅ Confirmar Pagamento e Entregar').setStyle(ButtonStyle.Success)
      );

      await ticket.send({ content: `${interaction.user} ${STAFF_ROLE_ID ? `<@&${STAFF_ROLE_ID}>` : ''} • Pedido criado`, embeds: [embedProd, embedPay], components: [row1, row2, row3] });
      await interaction.followUp({ content: `✅ Carrinho criado! Vá para ${ticket}`, ephemeral: true });
    }

    if(interaction.isButton()){
      if(interaction.customId==='copiar_pix'){
        return interaction.reply({ content: `**Pix:**\n\`\`\`${PIX_KEY}\`\`\`\nTitular: ${PIX_NOME}`, ephemeral: true });
      }
      if(interaction.customId.startsWith('comprovante_')){
        return interaction.reply({ content: `📎 Envie o comprovante aqui no ticket!\n> Anexe a imagem do Pix e aguarde um staff confirmar.`, ephemeral: false });
      }
      // Suporte para novo formato com |
      if(interaction.customId.startsWith('comprovante') && interaction.customId.includes('|')){
        return interaction.reply({ content: `📎 Envie o comprovante aqui no ticket!\n> Anexe a imagem do Pix e aguarde um staff confirmar.`, ephemeral: false });
      }
      if(interaction.customId.startsWith('confirmar_pagamento_')){
        if(!isStaff(interaction)){
          return interaction.reply({ 
            content: '⛔ **ACESSO NEGADO**\n\n> 🔒 Apenas staff pode confirmar.', 
            ephemeral: true 
          });
        }
        
        const estoque=carregar();
        let rawPayload = interaction.customId.replace('confirmar_pagamento_','');
        console.log('CONFIRMAR TENTATIVA - raw:', rawPayload, 'canal:', interaction.channel.name);
        console.log('ESTOQUE:', JSON.stringify(estoque).slice(0,1000));
        
        // Tenta extrair label do payload
        let opcaoLabel = rawPayload;
        let comboId = null;
        
        if(rawPayload.includes('||')){
          const parts = rawPayload.split('||');
          comboId = parts[0];
          opcaoLabel = parts[1];
        } else if(rawPayload.includes('|')){
          const parts = rawPayload.split('|');
          comboId = parts[0];
          opcaoLabel = parts.slice(1).join('|');
        } else {
          // Formato antigo com _ : tenta achar ID no final
          const parts = rawPayload.split('_');
          if(parts.length>1){
            // Última parte pode ser ID numérico
            const last = parts[parts.length-1];
            if(!isNaN(last) || last.length<10){
              opcaoLabel = last;
              comboId = parts.slice(0,-1).join('_');
            } else {
              opcaoLabel = rawPayload;
            }
          }
        }
        
        opcaoLabel = (opcaoLabel||'').trim();
        if(comboId) comboId = comboId.trim();
        
        // Busca inteligente: tenta achar por vários jeitos
        let combo = null;
        let opcao = null;
        
        // 1. Busca exata por label
        for(const c of estoque){
          const found = c.opcoes.find(o=> o.label.toLowerCase()===opcaoLabel.toLowerCase() || String(o.id)===String(opcaoLabel));
          if(found){ combo=c; opcao=found; break; }
        }
        
        // 2. Busca por ID se comboId existe
        if(!opcao && comboId){
          combo = estoque.find(c=> c.id===comboId || c.id.toLowerCase()===comboId.toLowerCase() || c.titulo.toLowerCase()===comboId.toLowerCase());
          if(combo){
            opcao = combo.opcoes.find(o=> String(o.id)===String(opcaoLabel) || o.label.toLowerCase()===opcaoLabel.toLowerCase());
          }
        }
        
        // 3. Busca pelo nome do canal do ticket (ex: yeezyx-sanguine-art-cdk -> sanguine art + cdk)
        if(!opcao){
          const canalNome = interaction.channel.name.toLowerCase();
          for(const c of estoque){
            for(const o of c.opcoes){
              const labelSlug = o.label.toLowerCase().replace(/[^a-z0-9]+/g,'-');
              if(canalNome.includes(labelSlug) || labelSlug.includes(canalNome.replace('🛒・','').split('-').slice(1).join('-'))){
                combo=c; opcao=o; break;
              }
              // Também tenta match parcial: se canal tem "sanguine" e opcao tem "sanguine"
              const palavrasLabel = o.label.toLowerCase().split(/[^a-z0-9]+/);
              const palavrasCanal = canalNome.split(/[^a-z0-9]+/);
              const match = palavrasLabel.some(p=> p.length>2 && palavrasCanal.includes(p));
              if(match){ combo=c; opcao=o; break; }
            }
            if(opcao) break;
          }
        }
        
        // 4. ULTIMO RECURSO: Pega PRIMEIRA conta com estoque de QUALQUER produto (NUNCA falha se tiver estoque)
        if(!opcao){
          console.log('⚠️ Não achou por label, tentando primeira com estoque...');
          for(const c of estoque){
            const comEstoque = c.opcoes.find(o=> o.contas && o.contas.length>0);
            if(comEstoque){
              combo=c;
              opcao=comEstoque;
              console.log('✅ Usando primeira com estoque:', o.label);
              break;
            }
          }
        }
        
        if(!combo || !opcao){
          console.log('❌ FALHA TOTAL - estoque vazio ou não encontrado');
          // Verifica se tem algum estoque em qualquer lugar
          const totalContas = estoque.reduce((a,c)=>a+c.opcoes.reduce((x,y)=>x+y.contas.length,0),0);
          if(totalContas===0){
            return interaction.reply({content:'🔴 **ESTOQUE REALMENTE VAZIO!**\n\n> Não tem nenhuma conta no estoque.json\n> Adicione contas em /admin ou por comando\n> Depois digite /painel-vendas', ephemeral: true});
          } else {
            // Tem estoque mas não achou a específica - entrega qualquer uma mesmo assim
            for(const c of estoque){
              const comEstoque = c.opcoes.find(o=> o.contas && o.contas.length>0);
              if(comEstoque){
                combo=c;
                opcao=comEstoque;
                break;
              }
            }
            if(!opcao){
              return interaction.reply({content:'🔴 **ESTOQUE INDISPONIVEL!**\n> Erro ao achar conta, mas tem '+totalContas+' contas no total.\n> Tente /painel-vendas', ephemeral: true});
            }
          }
        }
        
        if(!opcao.contas || opcao.contas.length===0){
          await atualizarPainelUnico().catch(()=>{});
          // Mesmo se essa esgotou, tenta outra
          let alternativa = null;
          for(const c of estoque){
            const alt = c.opcoes.find(o=> o.contas && o.contas.length>0);
            if(alt){ alternativa=alt; combo=c; break; }
          }
          if(alternativa){
            opcao = alternativa;
            console.log('⚠️ Original esgotou, usando alternativa:', opcao.label);
          } else {
            return interaction.reply({content:'🔴 **ESTOQUE INDISPONIVEL!**\n\n> **'+opcao.label+'** esgotou!\n> Não tem mais nenhuma conta no estoque.', ephemeral: true});
          }
        }
        
        // ===== ACHA O COMPRADOR DO TICKET =====
        let compradorId = null;
        // Tenta pegar pela permissão do canal (quem não é bot, everyone, nem staff)
        try{
          const overwrites = interaction.channel.permissionOverwrites.cache;
          for(const [id, ow] of overwrites){
            if(id !== interaction.guild.roles.everyone.id && id !== STAFF_ROLE_ID && id !== client.user.id){
              const member = interaction.guild.members.cache.get(id);
              if(member && !member.user.bot){
                compradorId = id;
                break;
              }
            }
          }
        }catch{}
        // Fallback: tenta pegar da primeira mensagem do canal que menciona usuário
        if(!compradorId){
          try{
            const msgs = await interaction.channel.messages.fetch({ limit: 10 });
            for(const m of msgs.values()){
              const match = m.content.match(/<@!?(\d+)>/);
              if(match){ compradorId = match[1]; break; }
            }
          }catch{}
        }

        const conta=opcao.contas.shift(); salvar(estoque); await atualizarPainelUnico();

        // ===== SISTEMA DE CARGO AUTOMÁTICO =====
        let cargoInfo = null;
        let totalGasto = 0;
        let compradorMember = null;
        if(compradorId){
          try{
            const precoNum = parseFloat(opcao.preco.replace(',','.')) || 0;
            const clientes = carregarClientes();
            if(!clientes[compradorId]) clientes[compradorId] = { totalGasto: 0, compras: [] };
            clientes[compradorId].totalGasto += precoNum;
            clientes[compradorId].compras.push({ produto: opcao.label, preco: precoNum, data: new Date().toISOString() });
            totalGasto = clientes[compradorId].totalGasto;
            salvarClientes(clientes);

            cargoInfo = getCargoPorValor(totalGasto);
            if(cargoInfo){
              // Acha o cargo no servidor por ID (se definido no .env) ou por nome
              let cargoRole = null;
              if(cargoInfo.id){
                cargoRole = interaction.guild.roles.cache.get(cargoInfo.id);
              }
              if(!cargoRole){
                cargoRole = acharCargoPorNome(interaction.guild, cargoInfo.nome);
              }
              if(cargoRole){
                try{
                  compradorMember = await interaction.guild.members.fetch(compradorId);
                  // Remove todos os outros cargos de cliente e adiciona o novo mais alto
                  const cargosParaRemover = [];
                  for(const c of CARGOS_CLIENTE){
                    let r = null;
                    if(c.id) r = interaction.guild.roles.cache.get(c.id);
                    if(!r) r = acharCargoPorNome(interaction.guild, c.nome);
                    if(r && compradorMember.roles.cache.has(r.id) && r.id !== cargoRole.id){
                      cargosParaRemover.push(r);
                    }
                  }
                  if(cargosParaRemover.length>0){
                    await compradorMember.roles.remove(cargosParaRemover).catch(()=>{});
                  }
                  if(!compradorMember.roles.cache.has(cargoRole.id)){
                    await compradorMember.roles.add(cargoRole).catch(()=>{});
                  }
                }catch(e){ console.log('Erro ao dar cargo:', e.message); }
              }
            }
          }catch(e){ console.log('Erro sistema cargos:', e); }
        }

        const embed=new EmbedBuilder()
         .setColor(0x00ff7f)
         .setTitle('✅ ENTREGA REALIZADA')
         .setDescription(`**Produto:** \`${opcao.label}\`\n\n**Sua conta:**\n\`\`\`${conta}\`\`\`\n\n⚠️ Troque a senha após login!\nGarantia de 7 dias.${cargoInfo ? `\n\n🏆 **Cargo atualizado:** <@&${acharCargoPorNome(interaction.guild, cargoInfo.nome)?.id || cargoInfo.id}> — Total gasto: R$ ${totalGasto.toFixed(2).replace('.',',')}` : ''}`)
         .setFooter({ text: 'Leviathan Accounts • Obrigado!' });
        await interaction.reply({embeds:[embed]});
        
        if(compradorId && cargoInfo && compradorMember){
          await interaction.channel.send({ content: `🎉 ${compradorMember} comprou **${opcao.label}** por **R$ ${opcao.preco}**!\n💰 Total gasto na loja: **R$ ${totalGasto.toFixed(2).replace('.',',')}**\n🏅 Novo cargo: **${cargoInfo.nome.toUpperCase()}**!` }).catch(()=>{});
        }

        await interaction.channel.send({ content: `🔒 Fechando em 30s...` });
        setTimeout(()=>interaction.channel.delete().catch(()=>{}),30000);
      }
      if(interaction.customId==='fechar_ticket'){ await interaction.reply({content:'🔒 Fechando...'}); setTimeout(()=>interaction.channel.delete().catch(()=>{}),2000); }
    }

  } catch(err){
    console.error('Erro:', err);
    try { if(!interaction.replied) await interaction.reply({ content: `❌ Erro: ${err.message}`, ephemeral: true }); } catch {}
  }
});

process.on('unhandledRejection', e => console.log(e));
process.on('uncaughtException', e => console.log(e));
client.login(process.env.DISCORD_TOKEN);
