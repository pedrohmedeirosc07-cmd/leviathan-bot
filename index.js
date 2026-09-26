// LEVIATHAN ACCOUNTS - DESIGN PROFISSIONAL PREMIUM - ESTILO LOJA GRINGA
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, PermissionFlagsBits, ChannelType, REST, Routes, AttachmentBuilder } = require('discord.js');

const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID || '1552881282835288174';
const CATEGORIA_TICKET_ID = process.env.CATEGORIA_TICKET_ID || '1553104636334964756';
const CANAL_VENDAS_ID = process.env.CANAL_VENDAS_ID || '1552702271744254002';
const PIX_KEY = process.env.PIX_KEY || 'SUA_CHAVE_ALEATORIA_AQUI';
const PIX_NOME = process.env.PIX_NOME || 'Leviathan Accounts';
const ESTOQUE_FILE = './estoque.json';
const PAINEL_FILE = './painel.json';
const CLIENTES_FILE = './clientes.json';

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

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages] });

function carregar() { 
  try {
    if (!fs.existsSync(ESTOQUE_FILE)) { 
      // Se não existe, tenta criar com estoque atual em memória ou vazio
      fs.writeFileSync(ESTOQUE_FILE, '[]'); 
      return []; 
    }
    const data = fs.readFileSync(ESTOQUE_FILE, 'utf8');
    if(!data || data.trim()==='' || data.trim()==='[]'){
      // Arquivo vazio - não retorna vazio se já tinha algo antes, tenta manter
      const parsed = JSON.parse(data||'[]');
      return parsed;
    }
    return JSON.parse(data); 
  } catch { return []; } 
}
function salvar(e) { fs.writeFileSync(ESTOQUE_FILE, JSON.stringify(e, null, 2)); }
function carregarPainel(){ if(!fs.existsSync(PAINEL_FILE)) return null; try{ return JSON.parse(fs.readFileSync(PAINEL_FILE,'utf8')); }catch{return null;} }
function salvarPainel(d){ fs.writeFileSync(PAINEL_FILE, JSON.stringify(d,null,2)); }
function carregarClientes(){
  if(!fs.existsSync(CLIENTES_FILE)) { fs.writeFileSync(CLIENTES_FILE, '{}'); return {}; }
  try { return JSON.parse(fs.readFileSync(CLIENTES_FILE,'utf8')); } catch { return {}; }
}
function salvarClientes(d){ fs.writeFileSync(CLIENTES_FILE, JSON.stringify(d,null,2)); }
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
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// ===== PROTEÇÃO: SÓ SEU SERVER PODE USAR O BOT =====
const ALLOWED_GUILDS = (process.env.GUILD_ID || '').split(',').filter(Boolean);
// Se não definir GUILD_ID no .env, vai pegar automaticamente o primeiro server que já está e travar nele

client.once('ready', async () => {
    console.log(`✅ LEVIATHAN PROFISSIONAL LOGADO COMO ${client.user.tag}`);
    
    // Se GUILD_ID não foi definido, define automaticamente com os servers atuais (primeira vez)
    if(ALLOWED_GUILDS.length===0){
      console.log(`⚠️ GUILD_ID não definido no .env - Bot vai funcionar no(s) servidor(es) atual(is): ${[...client.guilds.cache.values()].map(g=>g.id).join(', ')}`);
      console.log(`🔒 Para travar, coloque GUILD_ID=${[...client.guilds.cache.values()].map(g=>g.id).join(',')} no .env do Render`);
    }

    for (const g of client.guilds.cache.values()) {
        // Se tem lista de permitidos e esse não está na lista, sai
        if(ALLOWED_GUILDS.length>0 && !ALLOWED_GUILDS.includes(g.id)){
          console.log(`🚫 Servidor não autorizado ${g.name} (${g.id}) - Saindo...`);
          try{ await g.leave(); }catch{}
          continue;
        }
        await rest.put(Routes.applicationGuildCommands(client.user.id, g.id), { body: commands });
    }
    console.log('✅ DESIGN PROFISSIONAL ATIVO - PROTEÇÃO ANTI-CLONE ATIVA');
});

// Se alguém tentar adicionar o bot em outro server, ele sai automaticamente
client.on('guildCreate', async (guild) => {
  if(ALLOWED_GUILDS.length===0){
    console.log(`⚠️ Bot adicionado em ${guild.name} (${guild.id}) - Como GUILD_ID não está definido, vou permitir por enquanto`);
    console.log(`🔒 Defina GUILD_ID no .env para travar apenas no seu server`);
    try{
      await rest.put(Routes.applicationGuildCommands(client.user.id, guild.id), { body: commands });
    }catch{}
    return;
  }
  if(!ALLOWED_GUILDS.includes(guild.id)){
    console.log(`🚫 TENTATIVA DE ROUBO! Bot adicionado em servidor não autorizado: ${guild.name} (${guild.id}) - SAINDO AUTOMATICAMENTE`);
    try{
      await guild.systemChannel?.send('🚫 **Este bot é privado do Leviathan Accounts e não pode ser usado em outros servidores!** Saindo...');
    }catch{}
    await guild.leave().catch(()=>{});
  }
});

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
     { name: '⭐ Avaliação', value: '5.0 • 1000+\nVendas', inline: true },
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

client.on('interactionCreate', async interaction=>{
  try {
    if(interaction.isChatInputCommand()){
      // Comando liberado para todos
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

      // Comandos só staff
      if(interaction.commandName!=='meu-saldo' && !isStaff(interaction)) return interaction.reply({ content: '❌ Sem permissão - Só staff pode usar este comando', ephemeral: true });

      if(interaction.commandName==='painel-vendas'){ await interaction.deferReply({ephemeral:true}); await enviarPainelVendas(interaction); return; }
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
        return interaction.reply({content:'🔴 **ESTOQUE INDISPONIVEL NO MOMENTO**\n\n> Não achei **'+opcaoLabel+'** no estoque atual.\n> O painel foi atualizado automaticamente.\n> Tente novamente no novo painel!',ephemeral:true});
      }
      
      if(!opcao.contas || opcao.contas.length===0){
        await atualizarPainelUnico().catch(()=>{});
        return interaction.reply({content:'🔴 **ESTOQUE INDISPONIVEL!**\n\n> **'+opcao.label+'** esgotou agora mesmo!\n> Escolha outra opção.',ephemeral:true});
      }

      const ticket=await interaction.guild.channels.create({
        name:`🛒・${interaction.user.username}-${opcao.label.toLowerCase().replace(/[^a-z0-9]/g,'-')}`.slice(0,90),
        type:ChannelType.GuildText,
        parent:CATEGORIA_TICKET_ID,
        permissionOverwrites:[
          {id:interaction.guild.roles.everyone.id,deny:[PermissionFlagsBits.ViewChannel]},
          {id:interaction.user.id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory,PermissionFlagsBits.AttachFiles]},
          {id:STAFF_ROLE_ID,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory,PermissionFlagsBits.ManageChannels]}
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

      await ticket.send({ content: `${interaction.user} <@&${STAFF_ROLE_ID}> • Pedido criado`, embeds: [embedProd, embedPay], components: [row1, row2, row3] });
      await interaction.reply({ content: `✅ Carrinho criado! Vá para ${ticket}`, ephemeral: true });
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
