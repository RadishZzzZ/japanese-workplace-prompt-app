/*
app.js
============================================================
这个文件负责 App 的全部逻辑。

当前版本核心结构：
对象 × 场景 × 礼貌度 × 长度

这个文件不调用 AI。
它只是把固定说明、用户输入和选择项拼成 Prompt。
真正生成日语结果的是：用户把 Prompt 复制到 ChatGPT 后，由 ChatGPT 生成。
============================================================
*/


const PRESETS = {
  delay: {
    text: "任务进度有点延期，但我已经确认了原因，今天下午会继续处理。",
    audienceIndex: 0,
    channelIndex: 0,
    politenessIndex: 1,
    lengthIndex: 2
  },
  ask: {
    text: "这个部分我不太确定，想请你帮我确认一下处理方向。",
    audienceIndex: 1,
    channelIndex: 0,
    politenessIndex: 0,
    lengthIndex: 2
  },
  sick: {
    text: "今天身体不太舒服，可能会晚一点开始工作，我会先处理紧急事项。",
    audienceIndex: 0,
    channelIndex: 0,
    politenessIndex: 1,
    lengthIndex: 2
  }
};


// ============================================================
// 对象说明：誰に伝えるか
// ============================================================

function getAudienceInstruction(audience) {
  const audienceMap = {
    "上司":
      "对象是上司。表达要礼貌、有报告意识。先说结论，再说现状和下一步。不要过度解释，也不要显得在找借口。不要过度卑微。",

    "同事":
      "对象是平级同事。表达要自然、有协作感。可以稍微柔和，但不要太随便。避免命令口吻。",

    "团队全体":
      "对象是团队全体。表达要客观、简洁、信息清楚。避免个人情绪、抱怨和过度道歉。",

    "客户 / 公司外部":
      "对象是公司外部人员或客户。表达要正式、谨慎、敬语自然。避免口语化表达。必要时使用「恐れ入りますが」「ご確認いただけますと幸いです」等表达。",

    "自己备忘":
      "对象是自己。重点是整理意思，不需要敬语。表达可以短而清楚，但要保留原意。"
  };

  return audienceMap[audience] || "请根据对象生成自然、得体的日本职场表达。";
}


// ============================================================
// 场景说明：在哪里使用
// ============================================================

function getChannelInstruction(channel) {
  const channelMap = {
    "Slack / Teams":
      "使用场景是 Slack 或 Teams。请使用短句，不要写邮件开头和结尾。表达要简洁，但不能冷淡。适合使用「確認します」「対応します」「共有します」等自然的社内表达。",

    "邮件":
      "使用场景是邮件。请使用相对完整的结构。根据对象选择是否加入「お疲れ様です」或「いつもお世話になっております」。结尾要自然收束。",

    "口头报告 / 朝会发言":
      "使用场景是晨会或口头报告。表达要适合说出口，句子不要太长。优先使用「昨日は〜」「本日は〜」「現状〜です」「困っている点は〜です」等结构。",

    "朝会模板填写":
      "使用场景是晨会模板填写。请不要写完整文章，也不要写正式邮件。请优先使用名词、短句、项目符号风格，适合直接填入「前日までの進捗」「本日の予定」「困っていること」「勤怠連絡」「話したいこと」等栏目。可以使用「特になし」「確認中」「対応中」「XX研修課題」「XX講義参加」这类短表达。",

    "文档 / 会议记录":
      "使用场景是文档或会议记录。表达要客观、书面、清楚，减少主观情绪。适合记录事实、状态和下一步。"
  };

  return channelMap[channel] || "请根据使用场景调整表达形式。";
}


// ============================================================
// 礼貌度说明：どのくらい丁寧にするか
// ============================================================

function getPolitenessInstruction(politeness) {
  const politenessMap = {
    "稍微轻松":
      "礼貌度是稍微轻松。适合关系较近的同事。可以使用「確認してみます」「助かります」「〜できそうです」等表达，但不要太随便。",

    "普通礼貌":
      "礼貌度是普通礼貌。适合大多数公司内部沟通。使用自然的丁寧語，不要过度郑重，也不要太随便。",

    "更正式":
      "礼貌度是相当礼貌。适合上司、客户、正式邮件。使用更谨慎的敬语，但不要堆砌敬语，不要过度卑微。"
  };

  return politenessMap[politeness] || "请使用自然、礼貌的日本职场表达。";
}


// ============================================================
// 长度说明：どのくらい短くするか
// ============================================================

function getLengthInstruction(length) {
  const lengthMap = {
    "短句 / 条目":
      "输出形式是短句或条目，不要求完整句子。适合晨会模板、列表、记录、进度填写。优先使用名词、短语、项目符号，例如「Java研修課題」「RDB講義参加」「特になし」。",

    "一句话":
      "输出 1 句完整表达。适合 Slack / Teams 中的快速回复或简短说明。不要展开解释。",

    "简短：1-2句":
      "输出 1 到 2 句。优先保留结论和必要的下一步，适合大多数日常职场沟通。",

    "标准：2-3句":
      "输出 2 到 3 句。包含必要背景、现状和下一步，适合稍微正式一点的说明。",

    "稍详细：4-5句":
      "输出 4 到 5 句。适合邮件、复杂说明或需要补充背景的情况，但不要冗长。"
  };

  return lengthMap[length] || "请控制在自然、易读的长度。";
}


// ============================================================
// 生成 Prompt
// ============================================================

function buildPrompt(chineseText, audience, channel, politeness, length) {
  const audienceInstruction = getAudienceInstruction(audience);
  const channelInstruction = getChannelInstruction(channel);
  const politenessInstruction = getPolitenessInstruction(politeness);
  const lengthInstruction = getLengthInstruction(length);

  return `你是一位非常熟悉日本职场沟通、日本商务日语、Slack / Teams 日语、上司/同僚/客户语感差异的语言顾问。

我的背景：
使用者是以中文为母语、在日本职场中使用日语进行沟通的人。使用者具备一定的日语基础或商务日语能力，但在不同对象和使用场景下，希望把表达调整得更自然、更得体、更符合日本职场语感。

你的任务：
请把我输入的中文内容，改写成自然、得体、符合日本职场语感的日语。

这不是逐字翻译任务，而是日本职场表达的语感调整任务。

请注意：
1. 不要逐字翻译中文。
2. 要根据对象、使用场景、礼貌度和长度调整表达。
3. 请根据中文原文自行判断表达意图，例如报告、商量、请求、确认、道歉、拒绝、请假、迟到、早退或普通闲聊式沟通。不要强行把内容归类为某一种目的。不要因为系统选项而重复或强化原文里已经存在的“疑惑、请求、确认、道歉”等含义。重点是把原文整理成自然、得体、符合日本职场语感的表达。
4. 上司、同事、客户、Slack / Teams、邮件、晨会报告、晨会模板填写的语感要区分。
5. 输出要自然，像真实日本公司员工会写或会说的话。
6. 不要过度卑微。
7. 不要过度夸张。
8. 不要把中文式逻辑硬翻成日语。
9. 遇到表达情绪、困难、请求时，要委婉但清楚。
10. 如果原文里有攻击性、焦虑、抱怨、过度解释，请自动改成职场可接受表达。
11. 如果信息不足，请用自然的日语保留模糊性，不要乱编细节。
12. 如果是 Slack / Teams，用语要短，但不能显得冷淡。
13. 如果是给上司，要礼貌、有报告意识，但不要过度卑微。
14. 如果是给同事，要自然、有协作感。
15. 如果是晨会或口头报告，要简洁，适合说出口。
16. 如果是晨会模板填写，要优先使用短句、名词、项目符号，不要强行写成完整句。

【我的中文原文】
${chineseText}

【对象】
${audience}

【对象说明】
${audienceInstruction}

【场景】
${channel}

【场景说明】
${channelInstruction}

【礼貌度】
${politeness}

【礼貌度说明】
${politenessInstruction}

【长度】
${length}

【长度说明】
${lengthInstruction}

请严格按照下面格式输出：

【そのまま使える表現】
（日语）

【少し調整した表現】
（日语：在同一条件下，给一个语感略有不同的备选表达）

【より自然にするポイント】
（中文解释：为什么这样说适合这个对象、使用场景和长度）

【避けた方がいい直訳】
（中文解释：哪些中文直译容易显得奇怪、强硬、冷淡或不自然）`;
}


// ============================================================
// 历史记录
// ============================================================

const HISTORY_KEY = "jp_workplace_prompt_history_v3";

function getHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);

    if (!raw) {
      return [];
    }

    return JSON.parse(raw);
  } catch (error) {
    console.error("读取历史记录失败：", error);
    return [];
  }
}

function saveHistoryItem(item) {
  try {
    const history = getHistory();

    history.unshift(item);

    // 只保留最近 10 条，避免 localStorage 过大。
    const latestHistory = history.slice(0, 10);

    localStorage.setItem(HISTORY_KEY, JSON.stringify(latestHistory));
  } catch (error) {
    console.error("保存历史记录失败：", error);
  }
}

function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
  } catch (error) {
    console.error("清空历史记录失败：", error);
  }
}

function renderHistory() {
  const historyList = document.getElementById("historyList");
  const history = getHistory();

  if (history.length === 0) {
    historyList.innerHTML = `<p class="empty-history">还没有历史记录。</p>`;
    return;
  }

  historyList.innerHTML = "";

  history.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "history-item";

    div.innerHTML = `
      <div class="history-meta">
        ${escapeHtml(item.time)}｜${escapeHtml(item.audience)}｜${escapeHtml(item.channel)}
      </div>
      <div class="history-tags">
        <span>${escapeHtml(item.politeness)}</span>
        <span>${escapeHtml(item.length)}</span>
      </div>
      <div class="history-text">${escapeHtml(item.chineseText)}</div>
      <button class="history-copy-button" data-index="${index}">
        复制这条提示词
      </button>
    `;

    div.querySelector(".history-meta").textContent =
      `${item.time} / ${item.audience} / ${item.channel}`;

    historyList.appendChild(div);
  });

  const buttons = document.querySelectorAll(".history-copy-button");

  buttons.forEach((button) => {
    button.addEventListener("click", async () => {
      const index = Number(button.dataset.index);
      const item = history[index];

      if (!item) {
        return;
      }

      const success = await copyText(item.prompt);

      if (success) {
        setStatus("已复制历史提示词。");
      } else {
        setStatus("浏览器阻止了一键复制。请手动复制输出框内容。");
      }
    });
  });
}


// ============================================================
// 工具函数
// ============================================================

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setStatus(message) {
  const statusMessage = document.getElementById("statusMessage");

  if (statusMessage) {
    statusMessage.textContent = message;
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("一键复制失败，改用备用复制方式：", error);

    // 备用方案：把输出框选中，让用户手动复制。
    const promptOutput = document.getElementById("promptOutput");

    if (promptOutput) {
      promptOutput.focus();
      promptOutput.select();
    }

    return false;
  }
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
  const clearHistoryButton = document.getElementById("clearHistoryButton");
  const quickButtons = document.querySelectorAll(".quick-button");

  quickButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const preset = PRESETS[button.dataset.preset];

      if (!preset) {
        return;
      }

      chineseInput.value = preset.text;
      audienceSelect.selectedIndex = preset.audienceIndex;
      channelSelect.selectedIndex = preset.channelIndex;
      politenessSelect.selectedIndex = preset.politenessIndex;
      lengthSelect.selectedIndex = preset.lengthIndex;

      setStatus("已套用常用组合，可继续修改后生成提示词。");
      chineseInput.focus();
    });
  });

  generateButton.addEventListener("click", () => {
    const chineseText = chineseInput.value.trim();
    const audience = audienceSelect.value;
    const channel = channelSelect.value;
    const politeness = politenessSelect.value;
    const length = lengthSelect.value;

    if (!chineseText) {
      setStatus("请先输入中文内容。");
      return;
    }

    const prompt = buildPrompt(
      chineseText,
      audience,
      channel,
      politeness,
      length
    );

    promptOutput.value = prompt;
    resultSection.classList.remove("hidden");

    const now = new Date();

    saveHistoryItem({
      time: now.toLocaleString(),
      chineseText,
      audience,
      channel,
      politeness,
      length,
      prompt
    });

    renderHistory();

    setStatus("提示词已生成。可以点击复制。");

    // 自动滚动到结果区域，手机上体验更好。
    resultSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });

  copyButton.addEventListener("click", async () => {
    const text = promptOutput.value;

    if (!text) {
      setStatus("还没有可复制的提示词。");
      return;
    }

    const success = await copyText(text);

    if (success) {
      setStatus("已复制。请切换到 ChatGPT App 或网页版粘贴发送。");
    } else {
      setStatus("浏览器阻止了一键复制。文本已自动选中，请手动复制后切换到 ChatGPT。");
    }
  });

  clearHistoryButton.addEventListener("click", () => {
    const confirmed = confirm("确定要清空最近记录吗？");

    if (confirmed) {
      clearHistory();
      setStatus("历史记录已清空。");
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


// 页面加载完成后启动 App。
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
  registerServiceWorker();
});
