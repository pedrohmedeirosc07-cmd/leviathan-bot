Leviathan Accounts Bot - 24/7 🛡️🤖
Bot profissional com sistema completo:

🛡️ Anti-nuke / Anti-raid (protege contra destruição)
🤖 Automod modular (anti-palavrão, anti-link, anti-spam)
🎫 Sistema de tickets profissional
💰 Vendas automáticas + estoque
🏆 Cargos automáticos por valor gasto
💾 Backup de servidor
📁 Estrutura
leviathan-bot/
├── index.js          # Bot principal
├── automod.js        # Sistema automod separado (NOVO)
├── automod.json      # Config automod
├── estoque.json      # Estoque de contas
├── package.json
├── render.yaml       # Config Render
├── .env.example
└── .gitignore
🚀 Instalação
bash
npm install
⚙️ Configurar .env
Crie arquivo .env na raiz:

env
DISCORD_TOKEN=seu_token_aqui
GUILD_ID=1430243817801519286
OWNER_ID=seu_id
STAFF_ROLE_ID=1554489184327311390
CATEGORIA_TICKET_ID=id_categoria
CANAL_VENDAS_ID=id_canal_vendas
CANAL_AVALIACOES_ID=id_canal_avaliacoes
CANAL_LOGS_ID=id_canal_logs
PIX_KEY=sua_chave_pix
PIX_NOME=Leviathan Accounts
CARGO_CLIENTE_ID=id
CARGO_VIP_ID=id
CARGO_MEGA_ID=id
CARGO_ULTRA_ID=id
CARGO_ETERNO_ID=id
▶️ Rodar
bash
npm start
# Painel web em http://localhost:3000/admin
🤖 Automod
Arquivo separado automod.js:

Anti-palavrão (25+ palavras BR)
Anti-link (liberado em #parcerias)
Anti-invite discord.gg (liberado em #parcerias)
Anti-spam / flood
Staff nunca é punido
3 avisos → mute 5min
Config em automod.json ou comando /automod

🛡️ Anti-nuke
Protege contra:

Deletar/criar canais em massa
Deletar/criar cargos em massa (com ADM = ban instant)
Ban/kick em massa
Webhook spam
@everyone spam
Staff e dono são whitelist - nunca levam ban.

📦 Comandos
/painel-tickets - Painel de tickets
/painel-vendas - Painel de vendas
/antiraid status - Status anti-nuke
/automod status - Status automod
/backup-servidor - Backup canais e cargos
🌐 Deploy no Render
Conecta repo GitHub no Render
Adiciona env vars
Deploy automático
📄 Licença
Privado - Leviathan Accounts

