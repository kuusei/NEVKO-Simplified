# NEVKO Simplified 改动文档

本仓库是 [NEVKO-UI](https://github.com/dotFelixan/NEVKO-UI) 的简化 / 汉化分支。
每次改动只更新下面的「相对上游的持续改动」（同步时同时改「同步基线」），不要写按日流水账。

本仓库 remote：`origin` → `https://github.com/kuusei/NEVKO-Simplified.git`
原始上游 remote：`upstream` → `https://github.com/dotFelixan/NEVKO-UI.git`

## 同步基线

| 项 | 值 |
| --- | --- |
| 上游提交 | `e8ef4a2` Fix ALT Online Icon |
| 上游版本 | `0.9.900`（Still Alive Update） |
| 上次同步 | 2026-08-22 |

## 相对上游的持续改动

同步上游后必须重放这些差异，不要被上游英文 / 原版样式覆盖。

### 品牌与仓库

- 主题名：`NEVKO Simplified`
- 作者：`.Felixan&kuusei`
- 描述：`Steam 刷新风格主题。简化版。`
- GitHub / `metadata.json` / `skin.json`：`kuusei/NEVKO-Simplified`
- 去掉上游 `discord_support`
- `README.md` 标题改为 Simplified，logo 链接改为 `#`

### 设置项汉化（`skin.json`）

- 分组标签：通用 / 界面个性化 / 刷新预设 / 隐私
- 选项名、选项值、描述全部中文
- DRIVER 分区标题由 `TitleCategory.js` 替换为：用户 / 其他 / 主界面 / 库存 / 聊天
- 默认值保持本分支偏好：替代在线指示器关、交换主按钮关、模糊账户名开、隐藏余额开、底栏/地址栏上移开

### 界面样式

- 库存列表更紧凑：字号 12px、行左内边距减小、圆角/描边减弱
- 列表容器保留上游 10px 圆角，底栏「游戏」筛选用上游内凹深色条
- 分类标题与好友区块左对齐，不再居中
- 收藏夹等分类标题不要单独底色，同时盖掉 Steam 折叠按钮左侧蓝灰渐变
- 游戏页只把主页标签和视图按钮保持上游样式；动态/好友等内容区仍去掉卡片底
- 顶栏余额文字改为白色
- 地址栏前进/后退只在非库存网页出现，放在刷新左侧并对齐；顶栏启动/库存页不显示
- STEAM 顶栏下拉保持上游 Refresh Menu，不要改；仅把陈列架选择和排序下拉改回不透明（上游 `background: unset` 会透出后面文字）
- CSS 相对上游的差异用中文注释 `改动:` 标出
