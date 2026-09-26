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
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  app.get('/', (req, res) => res.send('Leviathan Professional ON - Bot Online ✅'));

  // PAINEL WEB FÁCIL - acesse https://seu-bot.onrender.com/admin
  app.get('/admin', (req, res) => {
    const estoque = carregar();
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Leviathan Admin</title>
    <style>body{font-family:Arial;background:#0f0f0f;color:#fff;padding:20px} .card{background:#1e1e1e;padding:20px;border-radius:12px;margin-bottom:20px;border:1px solid #333} input,textarea{width:100%;padding:10px;margin:5px 0;border-radius:8px;border:1px solid #444;background:#111;color:#fff} button{background:#FFD700;color:#000;font-weight:bold;padding:12px 20px;border:none;border-radius:8px;cursor:pointer;width:100%} button:hover{background:#ffea00} .prod{background:#252525;padding:15px;border-radius:8px;margin:10px 0} .ok{color:#00ff7f} .off{color:#ff4444}</style></head><body>
    <h1>🔥 Leviathan Admin - Adicionar Produto FÁCIL</h1>
    <div class="card"><h2>➕ Adicionar Produto Completo (Mais Fácil)</h2>
    <form method="POST" action="/admin/add">
      <label>ID do Produto (ex: sanguine-vip)</label><input name="id" required placeholder="sanguine-vip">
      <label>Título (ex: SANGUINE ART)</label><input name="titulo" required placeholder="SANGUINE ART">
      <label>Banner URL (https://i.imgur.com/...)</label><input name="banner" required placeholder="https://i.imgur.com/xxx.png">
      <label>Nome do Plano (ex: SANGUINE + CDK)</label><input name="plano" required placeholder="SANGUINE + CDK">
      <label>Preço (ex: 9,99)</label><input name="preco" required placeholder="9,99">
      <label>Contas (cole uma por linha: email:senha)</label><textarea name="contas" rows="8" required placeholder="conta1@gmail.com:senha123&#10;conta2@gmail.com:senha456"></textarea>
      <button type="submit">🚀 CRIAR PRODUTO AGORA</button>
    </form></div>
    <div class="card"><h2>📦 Estoque Atual: ${estoque.reduce((a,c)=>a+c.opcoes.reduce((x,y)=>x+y.contas.length,0),0)} contas</h2>`;
    estoque.forEach(c=>{
      html+=`<div class="prod"><b>${c.titulo}</b> (ID: ${c.id}) - ${c.banner}<br>`;
      c.opcoes.forEach(o=>{
        html+=`&nbsp;&nbsp; ${o.contas.length>0?'<span class=ok>🟢</span>':'<span class=off>🔴</span>'} <b>${o.label}</b> - R$ ${o.preco} - ${o.contas.length} unid.<br>`;
      });
      html+=`</div>`;
    });
    html+=`</div></body></html>`;
    res.send(html);
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

  app.listen(process.env.PORT || 3000, () => console.log('🚀 Server ON + Admin em /admin'));
} catch {}

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages] });

function carregar() { 
  if (!fs.existsSync(ESTOQUE_FILE)) { fs.writeFileSync(ESTOQUE_FILE, '[]'); return []; } 
  try { return JSON.parse(fs.readFileSync(ESTOQUE_FILE, 'utf8')); } catch { return []; } 
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
    if(fs.existsSync('./banner-leviathan.png')) return './banner-leviathan.png';
    if(fs.existsSync('./banner-leviathan.webp')) return './banner-leviathan.webp';
    if(fs.existsSync('./banner.png')) return './banner.png';
    const arqs = fs.readdirSync('.');
    const b = arqs.find(f => f.toLowerCase().includes('banner') && (f.endsWith('.png')||f.endsWith('.webp')||f.endsWith('.jpg')||f.endsWith('.jpeg')));
    if(b) return './'+b;
  }catch{} return null;
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

  if(bannerAttachment) embedMain.setImage(bannerAttachment);
  else if(estoque[0] && isUrl(estoque[0].banner)) embedMain.setImage(estoque[0].banner);

  const embeds = [embedMain];

  // Embeds secundários para cada produto com imagem individual (profissional)
  if(estoque.length>0){
    estoque.slice(0,3).forEach(c=>{
      const total = c.opcoes.reduce((a,b)=>a+b.contas.length,0);
      const e = new EmbedBuilder()
       .setColor(total===0 ? 0x2b2d31 : 0x00ff7f)
       .setTitle(`${c.titulo.toUpperCase()}`)
       .setDescription(
`> **Status:** ${total===0 ? '🔴 ESGOTADO' : `🟢 ${total} em estoque`}
> **Variações:** ${c.opcoes.length} planos

${c.opcoes.map(o=>{
  const st = o.contas.length===0 ? '🔴' : '🟢';
  return `${st} **${o.label}** — \`R$ ${o.preco}\` • ${o.contas.length} unid.`;
}).join('\n')}
`
       )
       .setFooter({ text: `${c.titulo} • Clique no menu abaixo para comprar` });
      if(isUrl(c.banner)) e.setThumbnail(c.banner);
      embeds.push(e);
    });
  }

  const components = [];
  if(estoque.length>0){
    const opcoes = estoque.slice(0,25).map(c=>{
      const total = c.opcoes.reduce((a,b)=>a+b.contas.length,0);
      return new StringSelectMenuOptionBuilder()
        .setLabel(`${c.titulo}`.slice(0,100))
        .setDescription(total===0 ? '🔴 ESGOTADO' : `🟢 ${total} disponíveis • Entrega instantânea`.slice(0,100))
        .setValue(c.id)
        .setEmoji(total===0 ? '🔴' : '🛒')
    });
    components.push(new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('selecionar_combo').setPlaceholder('🛒 Selecione o produto para ver detalhes').addOptions(opcoes)));
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

    if(interaction.isStringSelectMenu() && interaction.customId==='comprar_select'){
      const [comboId,opcaoId]=interaction.values[0].split('|'); 
      const estoque=carregar(); const combo=estoque.find(c=>c.id===comboId); const opcao=combo?.opcoes.find(o=>o.id===opcaoId);
      if(!opcao || opcao.contas.length<=0) return interaction.reply({content:'🔴 **ESGOTADO**',ephemeral:true});

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
        new ButtonBuilder().setCustomId(`comprovante_${comboId}_${opcaoId}`).setLabel('✅ Já paguei').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('fechar_ticket').setLabel('❌ Cancelar').setStyle(ButtonStyle.Danger)
      );
      const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`confirmar_pagamento_${comboId}_${opcaoId}`).setLabel('✅ Confirmar Pagamento e Entregar').setStyle(ButtonStyle.Success)
      );

      await ticket.send({ content: `${interaction.user} <@&${STAFF_ROLE_ID}> • Pedido criado`, embeds: [embedProd, embedPay], components: [row1, row2, row3] });
      await interaction.reply({ content: `✅ Carrinho criado! Vá para ${ticket}`, ephemeral: true });
    }

    if(interaction.isButton()){
      if(interaction.customId==='copiar_pix'){
        return interaction.reply({ content: `**Pix:**\n\`\`\`${PIX_KEY}\`\`\`\nTitular: ${PIX_NOME}`, ephemeral: true });
      }
      if(interaction.customId.startsWith('comprovante_')){
        return interaction.reply({ content: `📎 Envie o comprovante aqui!`, ephemeral: false });
      }
      if(interaction.customId.startsWith('confirmar_pagamento_')){
        if(!isStaff(interaction)){
          return interaction.reply({ 
            content: '⛔ **ACESSO NEGADO**\n\n> 🔒 Apenas membros com cargo <@&1552881282835288174> podem confirmar pagamentos e entregar contas.\n> Se você é cliente, aguarde um staff confirmar seu comprovante!', 
            ephemeral: true 
          });
        }
        const parts=interaction.customId.split('_'); const comboId=parts[2]; const opcaoId=parts.slice(3).join('_'); 
        const estoque=carregar(); const combo=estoque.find(c=>c.id===comboId); const opcao=combo?.opcoes.find(o=>o.id===opcaoId);
        if(!opcao || opcao.contas.length===0) return interaction.reply({content:'🔴 Sem estoque!', ephemeral: true});

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
