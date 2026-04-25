# app_prompt_only.py
# ============================================================
# 这是“无 API Key 的手机友好版”Streamlit App。
#
# 它不会调用 OpenAI API，也不需要 .env 文件。
#
# 它的作用是：
# 1. 让你输入中文
# 2. 选择日本职场场景
# 3. 选择语气
# 4. 自动生成一段可以复制到 ChatGPT 的高质量 Prompt
#
# 使用方式：
# 你把生成出来的 Prompt 复制到 ChatGPT 手机 App / 网页版里，
# ChatGPT 就会按照指定格式帮你输出自然的日本职场日语。
#
# 适合场景：
# - 公司电脑不方便设置 API Key
# - 手机上想快速使用
# - 不想产生 OpenAI API 费用
# - 不想把 API Key 存在本地项目里
# ============================================================

import traceback
from datetime import datetime
from pathlib import Path

import streamlit as st


# ============================================================
# 基础配置
# ============================================================

SCENE_OPTIONS = [
    "メール：社内向け",
    "メール：社外・お客様向け",
    "Slack：上司向け",
    "Slack：同僚向け",
    "Slack：チーム全体向け",
    "朝会報告",
    "進捗報告",
    "相談したい時",
    "依頼したい時",
    "謝罪したい時",
    "体調不良・休み連絡",
    "早退・遅刻連絡",
    "柔らかく断りたい時",
    "確認後に返信したい時",
    "自分の理解が不安な時",
    "もう少し自然な日本語に直したい時",
]

TONE_OPTIONS = [
    "かなり丁寧",
    "普通に丁寧",
    "ややカジュアル",
    "Slack向けに短く",
    "失礼がない範囲でかなり短く",
]


# 保存 prompt 历史的文件夹。
OUTPUT_DIR = Path(__file__).parent / "output"
PROMPT_HISTORY_FILE = OUTPUT_DIR / "prompt_history.txt"


# ============================================================
# 场景说明函数
# ============================================================

def get_scene_instruction(scene: str) -> str:
    """
    根据选择的场景，返回给 ChatGPT 的具体说明。
    """

    scene_map = {
        "メール：社内向け": (
            "这是公司内部邮件。语气要礼貌、清楚，但不要像客户邮件那样过度正式。"
            "可以使用自然的社内表达。"
        ),
        "メール：社外・お客様向け": (
            "这是对客户或公司外部人员的邮件。语气要正式、谨慎、清楚。"
            "避免过度口语化，注意敬语自然。"
        ),
        "Slack：上司向け": (
            "这是发给上司的 Slack。要简洁、礼貌、有报告意识。"
            "重点是让上司快速理解现状、问题和下一步。"
        ),
        "Slack：同僚向け": (
            "这是发给平级同事的 Slack。要自然、有协作感，避免命令感和冷淡感。"
        ),
        "Slack：チーム全体向け": (
            "这是发给团队全体的 Slack。要简洁、客观、容易理解，避免个人情绪。"
        ),
        "朝会報告": (
            "这是晨会报告。要简洁、适合说出口，最好包含昨日、今日、困っていること。"
        ),
        "進捗報告": (
            "这是进度汇报。要说明现状、原因、下一步。"
            "如果有延迟，要客观说明，不要像找借口。"
        ),
        "相談したい時": (
            "这是想找别人商量。要表现出自己已经尝试或思考过，"
            "但希望对方确认或给建议。"
        ),
        "依頼したい時": (
            "这是请求别人帮忙。要说明背景、请求内容、希望对方做什么。"
            "礼貌但不要过度卑微。"
        ),
        "謝罪したい時": (
            "这是道歉场景。要先承认问题，再说明修正或下一步。"
            "不要过度自责，也不要长篇解释。"
        ),
        "体調不良・休み連絡": (
            "这是身体不舒服、请假或休息联系。要自然说明情况、对工作的影响和后续处理。"
            "不要写得太沉重。"
        ),
        "早退・遅刻連絡": (
            "这是早退或迟到联系。要说明原因、预计影响和后续处理。"
            "简洁、诚恳，不要过度解释。"
        ),
        "柔らかく断りたい時": (
            "这是委婉拒绝。要先表示理解或感谢，再说明目前难以对应，"
            "必要时给出替代方案。"
        ),
        "確認後に返信したい時": (
            "这是表达确认后再回复。要自然表达暂时不能确定，会确认后再联系。"
        ),
        "自分の理解が不安な時": (
            "这是表达自己理解可能不准确，想确认一下。"
            "要表现为谨慎确认，而不是完全没理解。"
        ),
        "もう少し自然な日本語に直したい時": (
            "这是把已有表达改成更自然的日本职场日语。"
            "重点是自然、真实、不过度书面化。"
        ),
    }

    return scene_map.get(scene, "请根据日本职场语境，生成自然、得体的日语。")


def get_tone_instruction(tone: str) -> str:
    """
    根据选择的语气，返回给 ChatGPT 的具体说明。
    """

    tone_map = {
        "かなり丁寧": (
            "语气要相当礼貌，适合上司、客户、正式邮件。"
            "但不要过度卑微，不要堆砌敬语。"
        ),
        "普通に丁寧": (
            "语气要普通礼貌，适合大多数公司内部沟通。"
            "自然、清楚、不过度正式。"
        ),
        "ややカジュアル": (
            "语气可以稍微轻松，适合同僚或关系较近的团队成员。"
            "但仍要保持职场礼貌。"
        ),
        "Slack向けに短く": (
            "语气要适合 Slack。句子短，重点清楚，不要写成邮件。"
        ),
        "失礼がない範囲でかなり短く": (
            "在不失礼的范围内尽量短。"
            "优先保留核心信息，删除重复铺垫。"
        ),
    }

    return tone_map.get(tone, "语气要自然、礼貌，适合日本职场。")


# ============================================================
# Prompt 生成函数
# ============================================================

def build_copy_prompt(chinese_text: str, scene: str, tone: str) -> str:
    """
    生成可以复制到 ChatGPT 的完整 Prompt。
    """

    scene_instruction = get_scene_instruction(scene)
    tone_instruction = get_tone_instruction(tone)

    prompt = f"""
你是一位非常熟悉日本职场沟通、日本商务日语、Slack 日语、上司/同僚/客户语感差异的语言顾问。

我的背景：
我是一个在日本 IT / 云服务 / 咨询相关职场工作的中国人。我的日语达到商务水平，但希望表达更自然、更符合日本职场语感。

你的任务：
请把我输入的中文内容，改写成自然、得体、符合日本职场语感的日语。

请注意：
1. 不要逐字翻译中文。
2. 要根据场景调整语气。
3. 上司、同事、客户、Slack、邮件的语感要区分。
4. 输出要自然，像真实日本公司员工会写的话。
5. 不要过度卑微。
6. 不要过度夸张。
7. 不要把中文式逻辑硬翻成日语。
8. 遇到表达情绪、困难、请求时，要委婉但清楚。
9. 如果原文里有攻击性、焦虑、抱怨、过度解释，请自动改成职场可接受表达。
10. 如果信息不足，请用自然的日语保留模糊性，不要乱编细节。
11. Slack 用语要短，但不能显得冷淡。
12. 给上司时要礼貌，但不要过度卑微。
13. 给同僚时要自然、有协作感。
14. 晨会报告要简洁，适合说出口。
15. 遇到进度延迟时，要表达“现状、原因、下一步”，但不要像在找借口。
16. 遇到不懂的问题时，要表达“自己先尝试过，但希望确认”，不要显得完全没想。
17. 遇到身体不舒服、请假、早退时，要自然说明，不要写得太沉重。

【我的中文原文】
{chinese_text}

【使用场景】
{scene}

【场景说明】
{scene_instruction}

【希望语气】
{tone}

【语气说明】
{tone_instruction}

请严格按照下面格式输出：

【おすすめ表現】
（日语）

【より丁寧な表現】
（日语）

【短めの表現】
（日语）

【ニュアンス解説】
（中文解释：为什么这样说适合这个场景）

【注意点】
（中文解释：哪些直译容易显得奇怪、强硬、冷淡或不自然）
""".strip()

    return prompt


# ============================================================
# 历史保存函数
# ============================================================

def save_prompt_history(prompt: str) -> bool:
    """
    把生成过的 Prompt 保存到本地 txt 文件。
    这样你以后可以回头找。
    """

    try:
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        with open(PROMPT_HISTORY_FILE, "a", encoding="utf-8") as file:
            file.write("\n\n")
            file.write("=" * 80)
            file.write(f"\n生成时间：{now}\n")
            file.write("=" * 80)
            file.write("\n")
            file.write(prompt)
            file.write("\n")

        print(f"Prompt 历史已保存到：{PROMPT_HISTORY_FILE}")
        return True

    except Exception:
        print("保存 Prompt 历史时发生错误。完整错误如下：")
        traceback.print_exc()
        return False


# ============================================================
# Streamlit 页面
# ============================================================

def main() -> None:
    """
    Streamlit 主函数。
    """

    st.set_page_config(
        page_title="日本职场日语 Prompt 生成器",
        page_icon="📱",
        layout="centered",
    )

    st.title("📱 日本职场日语 Prompt 生成器")
    st.caption("无 API Key 版：生成 Prompt，然后复制到 ChatGPT 手机 App / 网页版使用。")

    st.info(
        "这个版本不会调用 API，不需要 `.env`，也不会产生 API 费用。"
        "它只负责帮你生成一段高质量 Prompt。"
    )

    st.subheader("1. 输入中文")

    chinese_text = st.text_area(
        label="请输入你想转换的中文",
        placeholder="例如：任务进度有点延迟，但我已经确认了原因，今天下午会继续处理。",
        height=140,
    )

    st.subheader("2. 选择场景和语气")

    selected_scene = st.selectbox(
        label="选择职场场景",
        options=SCENE_OPTIONS,
    )

    selected_tone = st.selectbox(
        label="选择语气强度",
        options=TONE_OPTIONS,
        index=1,
    )

    st.subheader("3. 生成可复制 Prompt")

    if st.button("生成 Prompt", type="primary"):
        try:
            if not chinese_text.strip():
                print("用户没有输入中文就点击了生成 Prompt。")
                st.error("请先输入中文内容。")
                return

            prompt = build_copy_prompt(
                chinese_text=chinese_text.strip(),
                scene=selected_scene,
                tone=selected_tone,
            )

            save_prompt_history(prompt)

            st.success("Prompt 已生成。请复制下面内容到 ChatGPT。")

            st.text_area(
                label="复制这里的完整 Prompt",
                value=prompt,
                height=500,
            )

            st.markdown(
                """
                使用方法：

                1. 复制上面整个 Prompt  
                2. 打开 ChatGPT 手机 App 或网页版  
                3. 粘贴并发送  
                4. 复制 ChatGPT 输出的日语结果  
                """
            )

        except Exception:
            print("生成 Prompt 时发生未预期错误。完整错误如下：")
            traceback.print_exc()
            st.error("生成 Prompt 时发生错误。请查看终端 traceback。")

    st.divider()

    st.caption(f"Prompt 历史保存位置：{PROMPT_HISTORY_FILE}")


if __name__ == "__main__":
    main()