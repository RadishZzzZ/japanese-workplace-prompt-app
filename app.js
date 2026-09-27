/*
app.js
============================================================
负责提示词生成、示例、复制、历史记录和 PWA 注册。

核心结构：
对象 × 场景 × 礼貌度 × 长度 / 形式

App 本身不调用 AI，只生成可以复制到 ChatGPT 的提示词。
============================================================
*/


// ============================================================
// 选项配置
// ============================================================

const OPTION_CONFIG = {
  audiences: {
    manager: {
      label: "上司",
      instruction: "表达要礼貌、有报告意识，先把原文中的核心信息说清楚；不要机械添加请求确认、道歉或下一步。"
    },
    colleague: {
      label: "同事",
      instruction: "表达要自然、有协作感，避免命令口吻，也不要为了显得客气而强化疑惑或请求。"
    },
    team: {
      label: "团队全体",
      instruction: "表达要客观、简洁、信息清楚，减少个人情绪，但不要删掉原文中必要的态度。"
    },
    external: {
      label: "客户 / 公司外部",
      instruction: "使用自然、谨慎的敬语，避免口语化和敬语堆砌；不要自行增加确认请求、致谢或致歉。"
    },
    self: {
      label: "自己备忘",
      instruction: "不需要敬语，重点是简洁整理信息并完整保留原意。"
    }
  },

  channels: {
    chat: {
      label: "Slack / Teams",
      instruction: "使用适合聊天工具的简洁表达，不要加入邮件式开头和结尾，也不要显得冷淡。"
    },
    email: {
      label: "邮件",
      instruction: "输出可以直接作为邮件正文使用的结构。根据对象加入必要且自然的寒暄和收束，但不要自动增加请求、致谢或其他新信息。"
    },
    spoken: {
      label: "口头报告 / 朝会发言",
      instruction: "句子要适合直接说出口，避免过长或过于书面，只整理原文已有的进度、计划和问题。"
    },
    standup: {
      label: "朝会模板填写",
      instruction: "使用适合直接填入朝会模板的名词、短语或项目符号，不写成完整文章，不加入邮件寒暄。"
    },
    document: {
      label: "文档 / 会议记录",
      instruction: "使用客观、书面、清楚的表达，记录原文已有的事实、状态和行动，不补充推测。"
    }
  },

  politeness: {
    relaxed: {
      label: "稍微轻松",
      instruction: "使用关系较近的同事之间自然、不过分随便的表达。"
    },
    normal: {
      label: "普通礼貌",
      instruction: "使用适合大多数公司内部沟通的自然丁寧語，不过度郑重。"
    },
    formal: {
      label: "更正式",
      instruction: "使用谨慎、自然的敬语，但不要堆砌敬语或显得过度卑微。"
    }
  },

  lengths: {
    bullets: {
      label: "短句 / 条目",
      instruction: "以名词、短语或项目符号输出，每条只保留一个信息点；不要求完整句子，不写成文章。"
    },
    oneSentence: {
      label: "一句话",
      instruction: "只输出 1 句完整日语，不展开说明。"
    },
    short: {
      label: "简短：1-2句",
      instruction: "输出 1 到 2 句，只保留原文中的核心信息。"
    },
    standard: {
      label: "标准：2-3句",
      instruction: "输出 2 到 3 句，清楚组织原文已有的信息；不要为了凑结构添加背景或下一步。"
    },
    detailed: {
      label: "稍详细：4-5句",
      instruction: "以 4 到 5 句为目标，适合邮件或较完整的说明；如果原文信息不足以自然支持这些句数，宁可更短，也不要补写细节。"
    }
  }
};


// 兼容历史记录中曾经使用过的中文和日文标签。
const OPTION_ALIASES = {
  audiences: {
    "上司": "manager",
    "同事": "colleague",
    "同僚": "colleague",
    "团队全体": "team",
    "チーム全体": "team",
    "客户 / 公司外部": "external",
    "社外・お客様": "external",
    "自己备忘": "self",
    "自分用メモ": "self"
  },
  channels: {
    "Slack / Teams": "chat",
    "邮件": "email",
    "メール": "email",
    "口头报告 / 朝会发言": "spoken",
    "朝会・口頭報告": "spoken",
    "朝会模板填写": "standup",
    "朝会テンプレ記入": "standup",
    "文档 / 会议记录": "document",
    "ドキュメント・議事録": "document"
  },
  politeness: {
    "稍微轻松": "relaxed",
    "ややカジュアル": "relaxed",
    "普通礼貌": "normal",
    "普通に丁寧": "normal",
    "更正式": "formal",
    "かなり丁寧": "formal"
  },
  lengths: {
    "短句 / 条目": "bullets",
    "一句话": "oneSentence",
    "一言だけ": "oneSentence",
    "简短：1-2句": "short",
    "短め": "short",
    "标准：2-3句": "standard",
    "標準": "standard",
    "稍详细：4-5句": "detailed",
    "少し詳しく": "detailed"
  }
};


const DEFAULT_SELECTIONS = {
  audienceKey: "manager",
  channelKey: "chat",
  politenessKey: "normal",
  lengthKey: "short"
};


const PRESETS = {
  delay: {
    name: "进度延期示例",
    text: "任务进度有点延期，但我已经确认了原因，今天下午会继续处理。",
    audienceKey: "manager",
    channelKey: "chat",
    politenessKey: "normal",
    lengthKey: "short"
  },
  ask: {
    name: "同事确认示例",
    text: "这个部分我不太确定，想请你帮我确认一下处理方向。",
    audienceKey: "colleague",
    channelKey: "chat",
    politenessKey: "relaxed",
    lengthKey: "short"
  },
  sick: {
    name: "请假/迟到示例",
    text: "今天身体不太舒服，可能会晚一点开始工作，我会先处理紧急事项。",
    audienceKey: "manager",
    channelKey: "chat",
    politenessKey: "normal",
    lengthKey: "short"
  }
};

const SELECTIONS_KEY = "jp_workplace_prompt_selections_v1";
const PRESETS_KEY = "jp_workplace_prompt_presets_v1";

function getSelections() {
  try {
    const saved = JSON.parse(localStorage.getItem(SELECTIONS_KEY));
    if (!saved || typeof saved !== "object") {
      return DEFAULT_SELECTIONS;
    }
    return {
      audienceKey: resolveOptionKey("audiences", saved.audienceKey, DEFAULT_SELECTIONS.audienceKey),
      channelKey: resolveOptionKey("channels", saved.channelKey, DEFAULT_SELECTIONS.channelKey),
      politenessKey: resolveOptionKey("politeness", saved.politenessKey, DEFAULT_SELECTIONS.politenessKey),
      lengthKey: resolveOptionKey("lengths", saved.lengthKey, DEFAULT_SELECTIONS.lengthKey)
    };
  } catch (error) {
    console.error("读取常用设置失败：", error);
    return DEFAULT_SELECTIONS;
  }
}

function getPresets() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(PRESETS_KEY)) || {};
  } catch (error) {
    console.error("读取自定义示例失败：", error);
  }

  return Object.fromEntries(Object.entries(PRESETS).map(([key, original]) => {
    const custom = saved && typeof saved === "object" ? saved[key] : null;
    if (!custom || typeof custom.name !== "string" || !custom.name.trim()
      || typeof custom.text !== "string" || !custom.text.trim()) {
      return [key, original];
    }
    return [key, {
      name: custom.name.trim().slice(0, 20),
      text: custom.text,
      audienceKey: resolveOptionKey("audiences", custom.audienceKey, original.audienceKey),
      channelKey: resolveOptionKey("channels", custom.channelKey, original.channelKey),
      politenessKey: resolveOptionKey("politeness", custom.politenessKey, original.politenessKey),
      lengthKey: resolveOptionKey("lengths", custom.lengthKey, original.lengthKey)
    }];
  }));
}

function storePresets(presets) {
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
    return true;
  } catch (error) {
    console.error("保存自定义示例失败：", error);
    return false;
  }
}


function resolveOptionKey(group, value, fallbackKey) {
  if (value && OPTION_CONFIG[group][value]) {
    return value;
  }

  if (value && OPTION_ALIASES[group][value]) {
    return OPTION_ALIASES[group][value];
  }

  return fallbackKey;
}


function getOption(group, value, fallbackKey) {
  const key = resolveOptionKey(group, value, fallbackKey);
  return {
    key,
    ...OPTION_CONFIG[group][key]
  };
}


// ============================================================
// 生成提示词
// ============================================================

function buildPrompt(chineseText, audienceValue, channelValue, politenessValue, lengthValue) {
  const audience = getOption("audiences", audienceValue, DEFAULT_SELECTIONS.audienceKey);
  const channel = getOption("channels", channelValue, DEFAULT_SELECTIONS.channelKey);
  const politeness = getOption("politeness", politenessValue, DEFAULT_SELECTIONS.politenessKey);
  const length = getOption("lengths", lengthValue, DEFAULT_SELECTIONS.lengthKey);

  return `你是熟悉日本职场沟通的日语编辑。请把下面的中文整理成两种可以直接使用的自然日语表达。

基本原则：
- 完整保留原意和信息边界，不得添加原文没有的事实、理由、请求、道歉、情绪、承诺或下一步。
- 不逐字翻译，只调整语序、语气和日本职场中的自然表达方式。
- 原文含有不确定、请求、确认、道歉等含义时，不要重复或强化；原文没有时不要自行补上。
- 信息不足时保留模糊性，不猜测、不补写。
- 表达要自然得体，不过度卑微，不堆砌敬语。

使用条件：
- 对象：${audience.label}。${audience.instruction}
- 场景：${channel.label}。${channel.instruction}
- 礼貌度：${politeness.label}。${politeness.instruction}
- 长度 / 形式：${length.label}。${length.instruction}

中文原文：
${chineseText}

输出要求：
- 提供两种意思完全一致、措辞或语气略有差别的自然日语，方便使用者自行选择。
- 两种表达都必须完整保留相同的信息边界，不得让其中一种增加请求、道歉、情绪、承诺或下一步。
- 所选“长度 / 形式”分别适用于每一种表达，不是两种表达合计。例如选择“一句话”时，A 和 B 各输出 1 句。
- 不要添加中文解释、直译分析或其他建议。

请严格使用下面的格式：

【自然表达 A】
（日语）

【自然表达 B】
（日语）`;
}


// ============================================================
// 历史记录
// ============================================================

const HISTORY_KEY = "jp_workplace_prompt_history_v3";
const LEGACY_HISTORY_KEYS = ["jp_workplace_prompt_history_v2"];
const HISTORY_LIMIT = 10;
const HISTORY_INITIAL_VISIBLE = 3;


function parseHistory(raw) {
  if (!raw) {
    return [];
  }

  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}


function normalizeHistoryItem(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const chineseText = typeof item.chineseText === "string" ? item.chineseText : "";
  const prompt = typeof item.prompt === "string" ? item.prompt : "";

  if (!chineseText && !prompt) {
    return null;
  }

  return {
    time: typeof item.time === "string" ? item.time : "时间未知",
    createdAt: typeof item.createdAt === "string" ? item.createdAt : "",
    chineseText,
    audienceKey: resolveOptionKey(
      "audiences",
      item.audienceKey || item.audience,
      DEFAULT_SELECTIONS.audienceKey
    ),
    channelKey: resolveOptionKey(
      "channels",
      item.channelKey || item.channel,
      DEFAULT_SELECTIONS.channelKey
    ),
    politenessKey: resolveOptionKey(
      "politeness",
      item.politenessKey || item.politeness,
      DEFAULT_SELECTIONS.politenessKey
    ),
    lengthKey: resolveOptionKey(
      "lengths",
      item.lengthKey || item.length,
      DEFAULT_SELECTIONS.lengthKey
    ),
    prompt
  };
}


function getHistory() {
  try {
    let raw = localStorage.getItem(HISTORY_KEY);
    let migratedFromLegacy = false;

    if (!raw) {
      for (const legacyKey of LEGACY_HISTORY_KEYS) {
        raw = localStorage.getItem(legacyKey);

        if (raw) {
          migratedFromLegacy = true;
          break;
        }
      }
    }

    const history = parseHistory(raw)
      .map(normalizeHistoryItem)
      .filter(Boolean)
      .slice(0, HISTORY_LIMIT);

    if (migratedFromLegacy && history.length > 0) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }

    return history;
  } catch (error) {
    console.error("读取历史记录失败：", error);
    return [];
  }
}


function saveHistoryItem(item) {
  try {
    const history = getHistory();
    const normalizedItem = normalizeHistoryItem(item);

    if (!normalizedItem) {
      return;
    }

    history.unshift(normalizedItem);
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(history.slice(0, HISTORY_LIMIT))
    );
  } catch (error) {
    console.error("保存历史记录失败：", error);
  }
}


function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
    LEGACY_HISTORY_KEYS.forEach((key) => localStorage.removeItem(key));
    renderHistory();
  } catch (error) {
    console.error("清空历史记录失败：", error);
  }
}


function createTag(text) {
  const tag = document.createElement("span");
  tag.textContent = text;
  return tag;
}


function createHistoryItem(item) {
  const audience = OPTION_CONFIG.audiences[item.audienceKey];
  const channel = OPTION_CONFIG.channels[item.channelKey];
  const politeness = OPTION_CONFIG.politeness[item.politenessKey];
  const length = OPTION_CONFIG.lengths[item.lengthKey];

  const wrapper = document.createElement("article");
  wrapper.className = "history-item";

  const meta = document.createElement("div");
  meta.className = "history-meta";
  meta.textContent = `${item.time} / ${audience.label} / ${channel.label}`;

  const tags = document.createElement("div");
  tags.className = "history-tags";
  tags.append(createTag(politeness.label), createTag(length.label));

  const text = document.createElement("div");
  text.className = "history-text";
  text.textContent = item.chineseText || "原文未保存";

  const actions = document.createElement("div");
  actions.className = "history-actions";

  const reuseButton = document.createElement("button");
  reuseButton.type = "button";
  reuseButton.className = "history-reuse-button";
  reuseButton.textContent = "再次使用";
  reuseButton.addEventListener("click", () => restoreHistoryItem(item));

  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className = "history-copy-button";
  copyButton.textContent = "复制旧提示词";
  copyButton.disabled = !item.prompt;
  copyButton.addEventListener("click", () => copyHistoryPrompt(item));

  actions.append(reuseButton, copyButton);
  wrapper.append(meta, tags, text, actions);

  return wrapper;
}


function renderHistory() {
  const historyList = document.getElementById("historyList");
  const clearHistoryButton = document.getElementById("clearHistoryButton");

  if (!historyList || !clearHistoryButton) {
    return;
  }

  const history = getHistory();
  historyList.replaceChildren();
  clearHistoryButton.disabled = history.length === 0;

  if (history.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-history";
    empty.textContent = "还没有历史记录。";
    historyList.appendChild(empty);
    return;
  }

  history.slice(0, HISTORY_INITIAL_VISIBLE).forEach((item) => {
    historyList.appendChild(createHistoryItem(item));
  });

  const olderHistory = history.slice(HISTORY_INITIAL_VISIBLE);

  if (olderHistory.length > 0) {
    const details = document.createElement("details");
    details.className = "history-more";

    const summary = document.createElement("summary");
    summary.textContent = `查看更早记录（${olderHistory.length}）`;

    const olderList = document.createElement("div");
    olderList.className = "history-more-list";
    olderHistory.forEach((item) => olderList.appendChild(createHistoryItem(item)));

    details.append(summary, olderList);
    historyList.appendChild(details);
  }
}


function restoreHistoryItem(item) {
  const chineseInput = document.getElementById("chineseInput");
  const audienceSelect = document.getElementById("audienceSelect");
  const channelSelect = document.getElementById("channelSelect");
  const politenessSelect = document.getElementById("politenessSelect");
  const lengthSelect = document.getElementById("lengthSelect");

  chineseInput.value = item.chineseText;
  audienceSelect.value = item.audienceKey;
  channelSelect.value = item.channelKey;
  politenessSelect.value = item.politenessKey;
  lengthSelect.value = item.lengthKey;
  rememberSelections();

  setStatus("已恢复原文和设置，可修改后重新生成。", false);
  setHistoryStatus("已恢复原文和设置。", false);
  chineseInput.focus();
  chineseInput.scrollIntoView({ behavior: "smooth", block: "center" });
}


async function copyHistoryPrompt(item) {
  if (!item.prompt) {
    setHistoryStatus("这条旧记录没有保存提示词，请再次使用后重新生成。", true);
    return;
  }

  const success = await copyText(item.prompt);

  if (success) {
    setHistoryStatus("已复制这条旧提示词。", false);
  } else {
    showPromptForManualCopy(item.prompt);
    setHistoryStatus("浏览器阻止了复制，旧提示词已显示并选中。", true);
  }
}


// ============================================================
// 工具函数
// ============================================================

function setStatus(message, isError = false) {
  const statusMessage = document.getElementById("statusMessage");

  if (statusMessage) {
    statusMessage.textContent = message;
    statusMessage.classList.toggle("error", isError);
  }
}


function setHistoryStatus(message, isError = false) {
  const historyStatusMessage = document.getElementById("historyStatusMessage");

  if (historyStatusMessage) {
    historyStatusMessage.textContent = message;
    historyStatusMessage.classList.toggle("error", isError);
  }
}

function setPresetStatus(message, isError = false) {
  const statusMessage = document.getElementById("presetStatusMessage");
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
}

function readSelections() {
  return {
    audienceKey: document.getElementById("audienceSelect").value,
    channelKey: document.getElementById("channelSelect").value,
    politenessKey: document.getElementById("politenessSelect").value,
    lengthKey: document.getElementById("lengthSelect").value
  };
}

function applySelections(selections) {
  document.getElementById("audienceSelect").value = selections.audienceKey;
  document.getElementById("channelSelect").value = selections.channelKey;
  document.getElementById("politenessSelect").value = selections.politenessKey;
  document.getElementById("lengthSelect").value = selections.lengthKey;
}

function rememberSelections() {
  try {
    localStorage.setItem(SELECTIONS_KEY, JSON.stringify(readSelections()));
    return true;
  } catch (error) {
    console.error("保存常用设置失败：", error);
    return false;
  }
}

function renderPresetControls() {
  const presets = getPresets();
  document.querySelectorAll(".quick-button").forEach((button) => {
    button.textContent = presets[button.dataset.preset].name;
  });
  const slotSelect = document.getElementById("presetSlot");
  Array.from(slotSelect.options).forEach((option) => {
    option.textContent = presets[option.value].name;
  });
  document.getElementById("presetName").value = presets[slotSelect.value].name;
}


async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("复制失败：", error);
    return false;
  }
}


function showPromptForManualCopy(text) {
  const promptOutput = document.getElementById("promptOutput");
  const resultSection = document.getElementById("resultSection");

  promptOutput.value = text;
  resultSection.classList.remove("hidden");
  resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  promptOutput.focus();
  promptOutput.select();
}


// ============================================================
// 主逻辑
// ============================================================

function initializeApp() {
  const chineseInput = document.getElementById("chineseInput");
  const audienceSelect = document.getElementById("audienceSelect");
  const channelSelect = document.getElementById("channelSelect");
  const politenessSelect = document.getElementById("politenessSelect");
  const lengthSelect = document.getElementById("lengthSelect");
  const generateButton = document.getElementById("generateButton");
  const copyButton = document.getElementById("copyButton");
  const promptOutput = document.getElementById("promptOutput");
  const resultSection = document.getElementById("resultSection");
  const resultTitle = document.getElementById("resultTitle");
  const clearHistoryButton = document.getElementById("clearHistoryButton");
  const quickButtons = document.querySelectorAll(".quick-button");
  const presetSlot = document.getElementById("presetSlot");
  const presetName = document.getElementById("presetName");
  const savePresetButton = document.getElementById("savePresetButton");
  const resetPresetButton = document.getElementById("resetPresetButton");
  let pendingResetSlot = null;

  function cancelPresetReset() {
    pendingResetSlot = null;
    resetPresetButton.textContent = "恢复默认示例";
  }

  applySelections(getSelections());
  renderPresetControls();
  [audienceSelect, channelSelect, politenessSelect, lengthSelect].forEach((select) => {
    select.addEventListener("change", () => {
      if (!rememberSelections()) {
        setStatus("浏览器未能记住设置，请检查存储权限。", true);
      }
    });
  });

  quickButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const preset = getPresets()[button.dataset.preset];

      if (!preset) {
        return;
      }

      chineseInput.value = preset.text;
      audienceSelect.value = preset.audienceKey;
      channelSelect.value = preset.channelKey;
      politenessSelect.value = preset.politenessKey;
      lengthSelect.value = preset.lengthKey;
      rememberSelections();

      setStatus("已填入示例并调整设置，可继续修改。", false);
      chineseInput.focus();
    });
  });

  presetSlot.addEventListener("change", () => {
    cancelPresetReset();
    presetName.value = getPresets()[presetSlot.value].name;
    setPresetStatus("");
  });

  savePresetButton.addEventListener("click", () => {
    cancelPresetReset();
    const name = presetName.value.trim();
    const text = chineseInput.value.trim();
    if (!name || !text) {
      setPresetStatus("请填写示例名称和中文内容后再保存。", true);
      (!name ? presetName : chineseInput).focus();
      return;
    }

    const presets = getPresets();
    presets[presetSlot.value] = { name, text, ...readSelections() };
    if (storePresets(presets)) {
      renderPresetControls();
      setPresetStatus(`已保存“${name}”，下次打开仍可使用。`);
    } else {
      setPresetStatus("浏览器未能保存示例，请检查存储权限。", true);
    }
  });

  resetPresetButton.addEventListener("click", () => {
    if (pendingResetSlot !== presetSlot.value) {
      pendingResetSlot = presetSlot.value;
      resetPresetButton.textContent = "再次点击以恢复默认";
      setPresetStatus("再次点击会覆盖这个位置保存的自定义内容。");
      return;
    }
    cancelPresetReset();
    const presets = getPresets();
    presets[presetSlot.value] = PRESETS[presetSlot.value];
    if (storePresets(presets)) {
      renderPresetControls();
      setPresetStatus("已恢复默认示例。");
    } else {
      setPresetStatus("浏览器未能恢复示例，请检查存储权限。", true);
    }
  });

  generateButton.addEventListener("click", async () => {
    const chineseText = chineseInput.value.trim();

    if (!chineseText) {
      setStatus("请先输入中文内容。", true);
      chineseInput.focus();
      return;
    }

    const audienceKey = audienceSelect.value;
    const channelKey = channelSelect.value;
    const politenessKey = politenessSelect.value;
    const lengthKey = lengthSelect.value;
    const prompt = buildPrompt(
      chineseText,
      audienceKey,
      channelKey,
      politenessKey,
      lengthKey
    );

    promptOutput.value = prompt;
    resultSection.classList.remove("hidden");
    const copyPromise = copyText(prompt);

    const now = new Date();
    saveHistoryItem({
      time: now.toLocaleString(),
      createdAt: now.toISOString(),
      chineseText,
      audienceKey,
      channelKey,
      politenessKey,
      lengthKey,
      prompt
    });

    renderHistory();
    resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
    resultTitle.focus({ preventScroll: true });
    if (await copyPromise) {
      setStatus("提示词已生成并复制，请切换到 ChatGPT 粘贴发送。", false);
    } else {
      showPromptForManualCopy(prompt);
      setStatus("提示词已生成，但浏览器阻止了复制；文本已选中，请手动复制。", true);
    }
  });

  copyButton.addEventListener("click", async () => {
    const text = promptOutput.value;

    if (!text) {
      setStatus("还没有可复制的提示词。", true);
      return;
    }

    const success = await copyText(text);

    if (success) {
      setStatus("已复制，请切换到 ChatGPT 粘贴发送。", false);
    } else {
      showPromptForManualCopy(text);
      setStatus("浏览器阻止了复制，文本已自动选中，请手动复制。", true);
    }
  });

  clearHistoryButton.addEventListener("click", () => {
    const confirmed = confirm("确定要清空最近记录吗？");

    if (confirmed) {
      clearHistory();
      setHistoryStatus("历史记录已清空。", false);
    }
  });

  renderHistory();
}


// ============================================================
// 注册 Service Worker
// ============================================================

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js")
      .then(() => {
        console.log("Service Worker 注册成功。");
      })
      .catch((error) => {
        console.error("Service Worker 注册失败：", error);
      });
  }
}


document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
  registerServiceWorker();
});
