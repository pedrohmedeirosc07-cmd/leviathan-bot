// automod.js - Sistema Automod Modular para Leviathan
// Coloque este arquivo na mesma pasta do index.js

const fs = require('fs');
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const AUTOMOD_FILE = './automod.json';

const automodDefault = {
  enabled: true,
  antiPalavrao: true,
  antiLink: true,
  antiInvite: true,
  antiSpam: true,
  antiFlood: true,
  antiEveryone: true,
  muteTime: 5,
  maxWarnings: 3,
  ignoreChannels: [],
  ignoreRoles: []
};

// Lista de palavrões
const PALAVROES = [
  'arrombado','arrombada','buceta','caralho','cuzao','cuzão','fuder','fodase','foda-se','fdp',
  'filho da puta','puta','puto','piranha','pica','vsf','porra','merda','bosta','corno','otario','otário',
  'retardado','imbecil','idiota','viado','mongol'
];

const LINK_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+|discord\.gg\/[^\s]+|discord\.com\/invite\/[^\s]+)/gi;
const INVITE_REGEX = /(discord\.gg\/[^\s]+|discord\.com\/invite\/[^\s]+)/gi;

let config = automodDefault;
if(fs.existsSync(AUTOMOD_FILE)){
  try{ config = { ...automodDefault, ...JSON.parse(fs.readFileSync(AUTOMOD_FILE,'utf8')) }; }catch{}
} else {
  fs.writeFileSync(AUTOMOD_FILE, JSON.stringify(automodDefault, null, 2));
}

const spamCache = new Map();
const warningsCache = new Map();

function salvar(){ fs.writeFileSync(AUTOMOD_FILE, JSON.stringify(config, null, 2)); }

function containsPalavrao(text){
  const normalized = text.toLowerCase().normalize('NFD').replace(/[\u036f]/g, '');
  for(const p of PALAVROES){
    if(normalized.includes(p)) return p;
  }
  return null;
}

function checkSpam(userId, content){
  const now = Date.now();
  if(!spamCache.has(userId)) spamCache.set(userId, { messages: [], lastContent: '', repeatCount: 0 });
  const data = spamCache.get(userId);
  data.messages = data.messages.filter(m => now - m.timestamp < 5000);
  data.messages.push({ content, timestamp: now });
  if(data.messages.length >= 5) return { type: 'flood', count: data.messages.length };
  if(data.lastContent === content){
    data.repeatCount++;
    if(data.repeatCount >= 3) return { type: 'repeat', count: data.repeatCount };
  } else {
    data.repeatCount = 1;
    data.lastContent = content;
  }
  return null;
}

async function punir(member, reason, message){
  const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;
  if(STAFF_ROLE_ID && member.roles.cache.has(STAFF_ROLE_ID)) return false;

  const userId = member.id;
  const now = Date.now();
  if(!warningsCache.has(userId)) warningsCache.set(userId, { count: 0, lastWarn: 0 });
  const warn = warningsCache.get(userId);
  if(now - warn.lastWarn > 600000) warn.count = 0;
  warn.count++;
  warn.lastWarn = now;

  if(message) await message.delete().catch(()=>{});

  if(warn.count >= config.maxWarnings){
    await member.timeout(config.muteTime * 60 * 1000, `Automod: ${reason}`).catch(()=>{});
    warn.count = 0;
    const embed = new EmbedBuilder()
      .setColor(0xFF8C00)
      .setTitle('🔇 Silenciado pelo Automod')
      .setDescription(`**Usuário:** ${member}\n**Motivo:** ${reason}\n**Tempo:** ${config.muteTime}min`)
      .setTimestamp();
    await message.channel.send({ embeds: [embed] }).then(m => setTimeout(()=>m.delete().catch(()=>{}), 10000)).catch(()=>{});
    return true;
  } else {
    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setDescription(`⚠️ ${member}, **${reason}**\n> Aviso ${warn.count}/${config.maxWarnings}`);
    await message.channel.send({ embeds: [embed] }).then(m => setTimeout(()=>m.delete().catch(()=>{}), 5000)).catch(()=>{});
    return false;
  }
}

// Função principal chamada no evento messageCreate
async function handleMessage(message, isWhitelistedFunc, isTicketChannelFunc){
  if(!config.enabled) return;
  if(message.author.bot) return;
  if(!message.content) return;
  if(message.member && isWhitelistedFunc && isWhitelistedFunc(message.author.id, message.member)) return;
  if(config.ignoreChannels.includes(message.channel.id)) return;
  if(message.member && message.member.roles.cache.some(r => config.ignoreRoles.includes(r.id))) return;

  const content = message.content;
  const channelName = (message.channel.name || '').toLowerCase();
  const isParceriaChannel = channelName.includes('parceria') || channelName.includes('parcerias') || channelName.includes('🤝') || channelName.includes('divulga');
  let isParceriaTicket = false;

  if(isTicketChannelFunc && isTicketChannelFunc(message.channel)){
    if(channelName.includes('parceria') || channelName.includes('🤝')){
      isParceriaTicket = true;
    } else {
      if(!isParceriaChannel) return;
    }
  }

  // Anti palavrão
  if(config.antiPalavrao){
    const palavrão = containsPalavrao(content);
    if(palavrão){
      await punir(message.member, `Palavrão: \`${palavrão}\``, message);
      return;
    }
  }

  // Anti invite - LIBERADO EM PARCERIA
  if(config.antiInvite && !isParceriaChannel && !isParceriaTicket){
    if(INVITE_REGEX.test(content)){
      await punir(message.member, `Link de convite não permitido`, message);
      return;
    }
  }

  // Anti link - LIBERADO EM PARCERIA
  if(config.antiLink && !isParceriaChannel && !isParceriaTicket){
    const allowed = ['imgur.com','i.imgur.com','youtube.com','youtu.be','tenor.com','giphy.com'];
    if(LINK_REGEX.test(content)){
      if(!allowed.some(d => content.toLowerCase().includes(d))){
        await punir(message.member, `Links não são permitidos`, message);
        return;
      }
    }
  }

  // Anti spam
  if(config.antiSpam || config.antiFlood){
    const spam = checkSpam(message.author.id, content);
    if(spam){
      await punir(message.member, `Spam - ${spam.type} ${spam.count}x`, message);
      return;
    }
  }
}

module.exports = {
  config,
  salvar,
  handleMessage,
  containsPalavrao,
  checkSpam,
  PALAVROES
};

