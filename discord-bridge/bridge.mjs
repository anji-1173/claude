// Discord <-> Claude Code bridge.
// 追加インストールなしで動くよう、Node 22 の標準 WebSocket / fetch だけを使う。

import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const API = "https://discord.com/api/v10";

// ---------- 設定の読み込み ----------

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(path.join(HERE, ".env"));

const TOKEN = (process.env.DISCORD_BOT_TOKEN || "").trim();
const WORK_DIR = process.env.WORK_DIR || path.resolve(HERE, "..");
const PERMISSION_MODE = process.env.PERMISSION_MODE || "acceptEdits";
const CLAUDE_BIN = process.env.CLAUDE_BIN || "claude";
const TIMEOUT_MS = Number(process.env.TIMEOUT_MINUTES || 15) * 60 * 1000;
const STATE_FILE = path.join(HERE, "state.json");
const LOG_DIR = path.join(HERE, "logs");

// ---------- ログ ----------

fs.mkdirSync(LOG_DIR, { recursive: true });

function log(...parts) {
  const now = new Date();
  const stamp = now.toISOString().replace("T", " ").slice(0, 19);
  const line = `[${stamp}] ${parts.join(" ")}`;
  console.log(line);
  const file = path.join(LOG_DIR, `bridge-${now.toISOString().slice(0, 10)}.log`);
  try {
    fs.appendFileSync(file, line + "\n");
  } catch {}
}

// ---------- 状態(会話の続き / 持ち主のID)----------

function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return {};
  }
}

function writeState(next) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(next, null, 2));
}

let state = readState();
if (process.env.OWNER_USER_ID && process.env.OWNER_USER_ID.trim()) {
  state.ownerId = process.env.OWNER_USER_ID.trim();
}

// ---------- 起動前チェック ----------

if (typeof globalThis.WebSocket !== "function") {
  console.error(
    "このパソコンの Node.js が古いようです(バージョン22以上が必要です)。\n" +
      "ハルに『橋が古いNodeで動かない』と伝えてください。",
  );
  process.exit(1);
}

if (!TOKEN) {
  console.error(
    "Botの合鍵(トークン)が設定されていません。\n" +
      `${path.join(HERE, ".env")} を開いて DISCORD_BOT_TOKEN= の右側に貼り付けてください。`,
  );
  process.exit(1);
}

// ---------- Discord REST ----------

async function rest(method, route, body) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(API + route, {
      method,
      headers: {
        Authorization: `Bot ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (res.status === 429) {
      const info = await res.json().catch(() => ({}));
      const wait = Math.ceil((info.retry_after || 1) * 1000);
      log("rate limited, waiting", wait, "ms");
      await sleep(wait);
      continue;
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`${method} ${route} -> ${res.status} ${text}`);
    }
    return res.status === 204 ? null : res.json();
  }
  throw new Error(`${method} ${route} -> rate limited too many times`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const sendMessage = (channelId, content, replyTo) =>
  rest("POST", `/channels/${channelId}/messages`, {
    content,
    ...(replyTo
      ? { message_reference: { message_id: replyTo, fail_if_not_exists: false } }
      : {}),
    allowed_mentions: { parse: [] },
  });

const react = (channelId, messageId, emoji) =>
  rest(
    "PUT",
    `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/@me`,
  ).catch(() => {});

const typing = (channelId) =>
  rest("POST", `/channels/${channelId}/typing`).catch(() => {});

function chunk(text, size = 1900) {
  const out = [];
  let rest = text;
  while (rest.length > size) {
    let cut = rest.lastIndexOf("\n", size);
    if (cut < size * 0.5) cut = size;
    out.push(rest.slice(0, cut));
    rest = rest.slice(cut);
  }
  if (rest.trim()) out.push(rest);
  return out;
}

async function reply(channelId, text, replyTo) {
  const parts = chunk(text.trim() || "(返事が空でした)");
  for (let i = 0; i < parts.length; i++) {
    await sendMessage(channelId, parts[i], i === 0 ? replyTo : undefined);
  }
}

// ---------- Claude Code の呼び出し ----------

function runClaude(prompt) {
  return new Promise((resolve) => {
    const args = ["-p", "--output-format", "json", "--permission-mode", PERMISSION_MODE];
    if (state.sessionId) {
      args.push("--resume", state.sessionId);
    } else {
      state.sessionId = randomUUID();
      writeState(state);
      args.push("--session-id", state.sessionId);
    }

    log("claude", args.join(" "));
    const child = spawn(CLAUDE_BIN, args, {
      cwd: WORK_DIR,
      shell: process.platform === "win32",
      env: process.env,
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.stdin.write(prompt);
    child.stdin.end();

    const timer = setTimeout(() => {
      child.kill();
      resolve({ text: "時間がかかりすぎたので、いったん中断しました。もう一度、区切って頼んでください。" });
    }, TIMEOUT_MS);

    child.on("error", (err) => {
      clearTimeout(timer);
      log("spawn error:", err.message);
      resolve({ text: `Claude Code を起動できませんでした: ${err.message}` });
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (stderr.trim()) log("claude stderr:", stderr.trim().slice(0, 800));

      let parsed = null;
      try {
        parsed = JSON.parse(stdout);
      } catch {}

      if (parsed && typeof parsed.session_id === "string") {
        if (parsed.session_id !== state.sessionId) {
          state.sessionId = parsed.session_id;
          writeState(state);
        }
      }

      if (parsed && typeof parsed.result === "string" && parsed.result.trim()) {
        resolve({ text: parsed.result });
        return;
      }

      if (code !== 0) {
        // 会話の続きが読めなくなった場合は、次回は新しい会話として始め直す
        if (/resume|session/i.test(stderr)) {
          state.sessionId = null;
          writeState(state);
        }
        resolve({
          text: `うまく動きませんでした(終了コード ${code})。\n${(stderr || stdout).trim().slice(0, 1200) || "(詳細なし)"}`,
        });
        return;
      }

      resolve({ text: stdout.trim() || "(返事が空でした)" });
    });
  });
}

// ---------- メッセージ処理(1件ずつ順番に)----------

let queue = Promise.resolve();

function enqueue(message) {
  queue = queue.then(() => handle(message)).catch((err) => log("handle error:", err.stack || err));
}

async function handle(message) {
  const channelId = message.channel_id;
  const text = (message.content || "").trim();
  if (!text) return;

  await react(channelId, message.id, "👀");

  let alive = true;
  const keepTyping = async () => {
    while (alive) {
      await typing(channelId);
      await sleep(8000);
    }
  };
  keepTyping();

  const slowNotice = setTimeout(() => {
    if (alive) sendMessage(channelId, "調べています。もう少しお待ちください。").catch(() => {});
  }, 90_000);

  try {
    const { text: answer } = await runClaude(text);
    await reply(channelId, answer, message.id);
  } catch (err) {
    log("run error:", err.stack || err);
    await sendMessage(channelId, `困りました。エラーが出ています: ${err.message}`).catch(() => {});
  } finally {
    alive = false;
    clearTimeout(slowNotice);
  }
}

// ---------- Discord Gateway ----------

const INTENTS =
  (1 << 0) | // GUILDS
  (1 << 9) | // GUILD_MESSAGES
  (1 << 12) | // DIRECT_MESSAGES
  (1 << 15); // MESSAGE_CONTENT

let ws = null;
let seq = null;
let gatewaySession = null;
let resumeUrl = null;
let heartbeat = null;
let acked = true;
let backoff = 1000;

function connect() {
  const url = resumeUrl || "wss://gateway.discord.gg";
  ws = new WebSocket(`${url}/?v=10&encoding=json`);

  ws.addEventListener("open", () => log("接続しました"));

  ws.addEventListener("message", (event) => {
    const payload = JSON.parse(event.data);
    if (payload.s !== null && payload.s !== undefined) seq = payload.s;

    switch (payload.op) {
      case 10: {
        const interval = payload.d.heartbeat_interval;
        clearInterval(heartbeat);
        acked = true;
        heartbeat = setInterval(() => {
          if (!acked) {
            log("応答が返らないので接続し直します");
            ws.close(4000);
            return;
          }
          acked = false;
          ws.send(JSON.stringify({ op: 1, d: seq }));
        }, interval);

        if (gatewaySession && seq !== null) {
          ws.send(
            JSON.stringify({
              op: 6,
              d: { token: TOKEN, session_id: gatewaySession, seq },
            }),
          );
        } else {
          ws.send(
            JSON.stringify({
              op: 2,
              d: {
                token: TOKEN,
                intents: INTENTS,
                properties: { os: process.platform, browser: "hal-bridge", device: "hal-bridge" },
              },
            }),
          );
        }
        break;
      }
      case 11:
        acked = true;
        break;
      case 7:
        ws.close(4000);
        break;
      case 9:
        gatewaySession = null;
        seq = null;
        resumeUrl = null;
        setTimeout(() => ws.close(4000), 1500);
        break;
      case 0:
        onDispatch(payload);
        break;
    }
  });

  ws.addEventListener("close", (event) => {
    clearInterval(heartbeat);
    if (event.code === 4014) {
      log(
        "権限が足りません: Developer Portal の Bot ページで Message Content Intent を ON にしてください。",
      );
      process.exit(1);
    }
    if (event.code === 4004) {
      log("合鍵(トークン)が違うようです。.env の DISCORD_BOT_TOKEN を確認してください。");
      process.exit(1);
    }
    log(`切断されました (code ${event.code})。${backoff / 1000}秒後につなぎ直します`);
    setTimeout(connect, backoff);
    backoff = Math.min(backoff * 2, 60_000);
  });

  ws.addEventListener("error", () => {});
}

function onDispatch(payload) {
  if (payload.t === "READY") {
    backoff = 1000;
    gatewaySession = payload.d.session_id;
    resumeUrl = payload.d.resume_gateway_url;
    const me = payload.d.user;
    log(`ハルの受付窓口が開きました: ${me.username} (${me.id})`);
    if (state.ownerId) log(`持ち主として登録済み: ${state.ownerId}`);
    else log("持ち主はまだ未登録です。最初に話しかけた人を持ち主として覚えます。");
    return;
  }

  if (payload.t === "RESUMED") {
    backoff = 1000;
    log("接続を復帰しました");
    return;
  }

  if (payload.t !== "MESSAGE_CREATE") return;

  const message = payload.d;
  if (message.author?.bot) return;

  if (!state.ownerId) {
    state.ownerId = message.author.id;
    writeState(state);
    log(`持ち主として ${message.author.username} (${message.author.id}) を覚えました`);
    sendMessage(
      message.channel_id,
      `${message.author.username} さんを持ち主として覚えました。これ以降、ほかの方には返事をしません。`,
    ).catch(() => {});
  } else if (message.author.id !== state.ownerId) {
    log(`持ち主以外(${message.author.id})のメッセージを無視しました`);
    return;
  }

  enqueue(message);
}

process.on("SIGINT", () => {
  log("終了します");
  process.exit(0);
});

log(`作業する場所: ${WORK_DIR}`);
log(`許可の設定: ${PERMISSION_MODE}`);
connect();
