# 日本职场日语 Prompt 生成器

这是一个手机友好的 Streamlit 网页 App。

它的目标是：

> 输入中文，选择日本职场场景和语气，然后生成一段可以复制到 ChatGPT 的高质量 Prompt，让 ChatGPT 帮你改写成自然、得体、符合日本职场语感的日语。

这个版本是 **无 API Key 版**。

也就是说：

- 不需要 OpenAI API Key
- 不会调用 OpenAI API
- 不会产生 API 使用费用
- 适合在手机或公司电脑上打开网页使用
- 生成的内容需要手动复制到 ChatGPT App / 网页版

---

## 1. 这个工具适合做什么？

适合把中文转换成更自然的日本职场日语，例如：

- 邮件用语
- 给上司的 Slack
- 给同僚的 Slack
- 给团队的简短通知
- 晨会报告
- 进度汇报
- 请假、迟到、早退联系
- 请求别人帮忙
- 表达自己遇到困难
- 表达“我会确认后回复”
- 表达“我理解可能有误，想确认一下”
- 表达“任务有点延迟，但正在处理”

---

## 2. 使用方式

### 在线使用

点击下面的网址即可打开：

https://japanese-workplace-prompt-app-sesnbpwspadq2cppic5vkm.streamlit.app/

打开后：

1. 输入中文
2. 选择日本职场场景
3. 选择语气强度
4. 点击「生成 Prompt」
5. 点击「一键复制 Prompt」
6. 打开 ChatGPT，把 Prompt 粘贴进去发送

---

### 手机上使用

用手机浏览器打开上面的网址。

iPhone 用户可以：

1. 用 Safari 打开网址
2. 点击分享按钮
3. 选择「添加到主屏幕」
4. 之后就可以像 App 一样从桌面打开

Android 用户可以：

1. 用 Chrome 打开网址
2. 点击右上角三个点
3. 选择「添加到主屏幕」
4. 之后就可以像 App 一样从桌面打开

---

### 本地运行时

如果想在自己电脑上运行，可以在项目文件夹中执行：

```bash
python -m streamlit run app_prompt_only.py
