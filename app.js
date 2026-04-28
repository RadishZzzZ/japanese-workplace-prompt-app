/*
app.js
============================================================
这个文件负责 App 的全部逻辑。

新版核心：
对象 × 渠道 × 目的 × 礼貌度 × 长度

这个文件不调用 AI。
它只是把固定说明、用户输入和五个选择项拼成 Prompt。
============================================================
*/

function getAudienceInstruction(audience) {
  const audienceMap = {
    "上司":
      "对象是上司。表达要礼貌、有报告意识。先说结论，再说现状和下一步。不要过度解释，也不要显得在找借口。不要过度卑微。",

    "同僚":
      "对象是平级同事。表达要自然、有协作感。可以稍微柔和，但不要太随便。避免命令口吻。",

    "チーム全体":
      "对象是团队全体。表达要客观、简洁、信息清楚。避免个人情绪、抱怨和过度道歉。",

    "社外・お客様":
      "对象是公司外部人员或客户。表达要正式、谨慎、敬语自然。避免口语化表达。必要时使用「恐れ入りますが」「ご確認いただけますと幸いです」等表达。",

    "自分用メモ":
      "对象是自己。重点是整理意思，不需要敬语。表达可以短而清楚，但要保留原意。"
  };

  return audienceMap[audience] || "请根据对象生成自然、得体的日本职场表达。";
}

function getChannelInstruction(channel) {
  const channelMap = {
    "Slack / Teams":
      "使用渠道是 Slack 或 Teams。请使用短句，不要写邮件开头和结尾。表达要简洁，但不能冷淡。适合使用「確認します」「対応します」「共有します」等自然的社内表达。",

    "メール":
      "使用渠道是邮件。请使用相对完整的结构。根据对象选择是否加入「お疲れ様です」或「いつもお世話になっております」。结尾要自然收束。",

    "朝会・口頭報告":
      "使用渠道是晨会或口头报告。表达要适合说出口，句子不要太长。优先使用「昨日は〜」「本日は〜」「現状〜です」「困っている点は〜です」等结构。",

    "ドキュメント・議事録":
      "使用渠道是文档或会议记录。表达要客观、书面、清楚，减少主观情绪。适合记录事实、状态和下一步。"
  };

  return channelMap[channel] || "请根据使用渠道调整表达形式。";
}

function getPurposeInstruction(purpose) {
  const purposeMap = {
    "報告する":
      "目的是报告。请包含现状、已经完成的部分、下一步。如有延迟，要说明原因和对应方针，但不要像找借口。",

    "相談する":
      "目的是商量。请表达自己已经尝试或思考过，但希望对方确认或给建议。不要显得完全没想。",

    "依頼する":
      "目的是请求别人帮忙。请说明背景、请求内容、希望对方做什么。避免命令感，语气要自然礼貌。",

    "確認する":
      "目的是确认。请自然表达「自己的理解是否正确」「确认后再回复」等含义。不要显得完全没理解，也不要让对方觉得你在推迟。",

    "謝罪する":
      "目的是道歉。请简洁承认问题，再说明修正或下一步。不要过度自责，也不要写成长篇解释。",

    "断る":
      "目的是委婉拒绝。请先表示理解或感谢，再说明目前难以对应，必要时给出替代方案或后续余地。",

    "体調不良・休み・遅刻・早退を伝える":
      "目的是说明体调不良、请假、迟到或早退。请自然说明状况、对工作的影响和后续处理。不要写得过于沉重。",

    "自然な日本語に直す":
      "目的是把表达改得更自然。请保持原意，不要补充不存在的信息。重点是日本职场中真实、自然、不生硬的表达。"
  };

  return purposeMap[purpose] || "请根据沟通目的生成合适的日本职场表达。";
}

function getPolitenessInstruction(politeness) {
  const politenessMap = {
    "ややカジュアル":
      "礼貌度是稍微轻松。适合关系较近的同事。可以使用「確認してみます」「助かります」「〜できそうです」等表达，但不要太随便。",

    "普通に丁寧":
      "礼貌度是普通礼貌。适合大多数公司内部沟通。使用自然的丁寧語，不要过度郑重，也不要太随便。",

    "かなり丁寧":
      "礼貌度是相当礼貌。适合上司、客户、正式邮件。使用更谨慎的敬语，但不要堆砌敬语，不要过度卑微。"
  };

  return politenessMap[politeness] || "请使用自然、礼貌的日本职场表达。";
}

function getLengthInstruction(length) {
  const lengthMap = {
    "一言だけ":
      "长度必须控制在 1 句话以内。不要解释，不要寒暄，只保留最核心的信息。",

    "短め":
      "长度控制在 1〜2 句话。优先保留结论和下一步。",

    "標準":
      "长度控制在 2〜4 句话。包含必要的背景、现状和下一步。",

    "少し詳しく":
      "长度控制在 4〜6 句话。适合邮件或复杂说明。可以适度补充背景、理由和后续安排，但不要冗长。"
  };

  return lengthMap[length] || "请控制在自然、易读的长度。";
}

function buildPrompt(chineseText, audience, channel, purpose, politeness, length) {
  const audienceInstruction = getAudienceInstruction(audience);
  const channelInstruction = getChannelInstruction(channel);
  const purposeInstruction = getPurposeInstruction(purpose);
  const politenessInstruction = getPolitenessInstruction(politeness);
  const lengthInstruction = getLengthInstruction(length);

  return `你是一位非常熟悉日本职场沟通、日本商务日语、Slack / Teams 日语、上司/同僚/客户语感差异的语言顾问。

我的背景：
我是一个在日本 IT / 云服务 / 咨询相关职场工作的中文母语者。我的日语达到商务水平，但希望表达更自然、更符合日本职场语感。

你的任务：
请把我输入的中文内容，改写成自然、得体、符合日本职场语感的日语。

这不是逐字翻译任务，而是日本职场表达的语感调整任务。

请注意：
1. 不要逐字翻译中文。
2. 要根据对象、渠道、目的、礼貌度和长度调整表达。
3. 上司、同事、客户、Slack / Teams、邮件、晨会报告的语感要区分。
4. 输出要自然，像真实日本公司员工会写或会说的话。
5. 不要过度卑微。
6. 不要过度夸张。
7. 不要把中文式逻辑硬翻成日语。
8. 遇到表达情绪、困难、请求时，要委婉但清楚。
9. 如果原文里有攻击性、焦虑、抱怨、过度解释，请自动改成职场可接受表达。
10. 如果信息不足，请用自然的日语保留模糊性，不要乱编细节。
11. 如果是 Slack / Teams，用语要短，但不能显得冷淡。
12. 如果是给上司，要礼貌、有报告意识，但不要过度卑微。
13. 如果是给同僚，要自然、有协作感。
14. 如果是晨会或口头报告，要简洁，适合说出口。
15. 遇到进度延迟时，要表达“现状、原因、下一步”，但不要像在找借口。
16. 遇到不懂的问题时，要表达“自己先尝试过，但希望确认”，不要显得完全没想。
17. 遇到身体不舒服、请假、早退、迟到时，要自然说明，不要写得太沉重。

【我的中文原文】
${chineseText}

【对象】
${audience}

【对象说明】
${audienceInstruction}

【渠道】
${channel}

【渠道说明】
${channelInstruction}

【目的】
${purpose}

【目的说明】
${purposeInstruction}

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
（中文解释：为什么这样说适合这个对象、渠道和目的）

【避けた方がいい直訳】
（中文解释：哪些中文直译容易显得奇怪、强硬、冷淡或不自然）`;
}

const HISTORY_KEY = "jp_workplace_prompt_history_v2";

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
        <span>${escapeHtml(item.purpose)}</span>
        <span>${escapeHtml(item.politeness)}</span>
        <span>${escapeHtml(item.length)}</span>
      </div>
      <div class="history-text">${escapeHtml(item.chineseText)}</div>
      <button class="history-copy-button" data-index="${index}">
        复制这条 Prompt
      </button>
    `;

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
        setStatus("已复制历史 Prompt。");
      } else {
        setStatus("浏览器阻止了一键复制。请手动复制输出框内容。");
      }
    });
  });
}

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
  statusMessage.textContent = message;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("一键复制失败，改用备用复制方式：", error);

    const promptOutput = document.getElementById("promptOutput");

    if (promptOutput) {
      promptOutput.focus();
      promptOutput.select();
    }

    return false;
  }
}

function initializeApp() {
  const chineseInput = document.getElementById("chineseInput");
  const audienceSelect = document.getElementById("audienceSelect");
  const channelSelect = document.getElementById("channelSelect");
  const purposeSelect = document.getElementById("purposeSelect");
  const politenessSelect = document.getElementById("politenessSelect");
  const lengthSelect = document.getElementById("lengthSelect");

  const generateButton = document.getElementById("generateButton");
  const copyButton = document.getElementById("copyButton");
  const promptOutput = document.getElementById("promptOutput");
  const resultSection = document.getElementById("resultSection");
  const clearHistoryButton = document.getElementById("clearHistoryButton");

  generateButton.addEventListener("click", () => {
    const chineseText = chineseInput.value.trim();
    const audience = audienceSelect.value;
    const channel = channelSelect.value;
    const purpose = purposeSelect.value;
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
      purpose,
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
      purpose,
      politeness,
      length,
      prompt
    });

    renderHistory();

    setStatus("Prompt 已生成。可以点击一键复制。");

    resultSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });

  copyButton.addEventListener("click", async () => {
    const text = promptOutput.value;

    if (!text) {
      setStatus("还没有可复制的 Prompt。");
      return;
    }

    const success = await copyText(text);

    if (success) {
      setStatus("已复制。现在可以打开 ChatGPT 粘贴发送。");
    } else {
      setStatus("浏览器阻止了一键复制。文本已自动选中，请手动复制。");
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
