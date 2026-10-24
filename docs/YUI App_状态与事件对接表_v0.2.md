# YUI App 状态与事件对接表 v0.2

日期：2026-10-24。与 PRD v0.2 配套。本文是建议接入契约，非已实现 API；传输方式、字段编码、错误码数值与时限由工程评审冻结。

## 1. 分层与数据

UI 动作 → 客户端适配层 → 设备/系统/必要服务 → 结果回调 → 更新确认状态 → 更新 UI。右侧事件名称是交互语义，不是服务端端点；交互日志仅用于原型观察，不是完整埋点实现。

| 字段 | 建议含义 | 边界 |
| --- | --- | --- |
| deviceId | 稳定唯一设备标识 | 不得用 s601/s602/n86 代替；来源待确认 |
| model | s601 / s602 / n86 | 用于能力与图形选择 |
| displayName | 用户名称 | 空值回落产品名；持久化位置待确认 |
| requestId / sessionId | 单次操作/扫描或配网会话标识 | 重试新建；过滤取消后、旧会话回调 |
| source | add / reconnect / control | 决定返回路径，不以当前动画推断 |
| bluetoothState | disconnected / connecting / connected / error | 不代表 Wi-Fi 在线 |
| wifiState | unknown / configuring / connected / disconnected / error | N86 专属；成功判定待 D02 |
| operationState | idle / pending / success / failed / cancelled | 控制操作与设备在线状态分离 |
| lightPower / brightness | boolean / 1..5 | 亮度不使用 0 表示关闭 |
| ssid / security | 当前或选中网络、认证方式 | 以扫描/查询结果为准，不硬编码 |
| errorCode / retryable | 机器原因与可否重试 | 由文案映射给用户，不直接暴露堆栈 |
| revision | 设备确认状态版本或序号 | 顺序方案待定，防旧结果覆盖新值 |

密码不写入日志、埋点、URL、错误详情或普通持久化；传输与安全存储方案由工程确认。日志中的设备标识和网络名称应按实际隐私要求脱敏。

## 2. 操作与回调（建议名，不是现成接口）

| UI/语义事件 | 请求内容 | 结果/界面更新 | 失败、取消与当前原型差距 |
| --- | --- | --- | --- |
| permission.bluetooth.request | 平台、授权类型、source | 系统授权结果；允许后检查蓝牙再扫描 | 拒绝/不可请求/蓝牙关闭分开；原型无真实授权 |
| device.scan.start / stop / retry | sessionId、支持型号、source | result(deviceId, model, name) 累积去重 | 超时无结果→未发现；退出停止；原型计时发固定样本 |
| device.select | deviceId、model、source | 进入该设备连接中 | 不因型号相同而选错设备 |
| bluetooth.connect.start / cancel / retry | requestId、deviceId、source | connected / failed / cancelled；成功才补满水位 | 真实超时待 D03；原型 2.2 秒自动回成功 |
| device.connection.toggle | deviceId、目标连接状态 | 成功更新开关、动画；断开立即禁用控制 | 请求中防重复；失败回退；原型直接切状态且互斥 |
| wifi.scan.start / retry | deviceId、sessionId | 可用 SSID、安全类型列表 | 空列表/扫描失败可重试；原型重扫仅 Toast |
| wifi.network.select | deviceId、ssid、安全类型 | 密码页或对应支持的流程 | 开放/隐藏网络待 D07；原型未完整绑定选择 |
| wifi.password.submit | deviceId、ssid、安全类型、密码、requestId | 本地校验后进入配网 | 格式错误不是认证失败；不得记录密码 |
| wifi.provision.start / retry / cancel | requestId、deviceId、网络参数 | progress / success / failed；保持同一 UI 容器 | auth_failed→密码错误；timeout→失败状态；取消语义待 D09 |
| light.toggle | requestId、deviceId、目标 power、revision | ack + 设备实际 power/brightness | 失败回确认值并提示；原型直接成功 |
| light.brightness.set | requestId、deviceId、1..5、revision | ack + 设备实际档位 | 拖动节流/提交频率待 D08；乱序结果不可回写旧档位 |
| device.state.changed | 设备主动上报，无 UI 请求 | 同步实体操作、断连、灯光或网络状态 | 需要匹配 deviceId、状态序号；原型无真实订阅 |
| device.rename | requestId、deviceId、displayName | 成功刷新列表/标题/弹层名称 | 失败保留输入；24 字符为原型限制，正式规则待 D05 |
| device.remove.confirm | requestId、deviceId、移除范围 | 成功清理对应记录；列表为空→空状态 | 失败保留设备；真实移除范围待 D06 |
| about.view / terms.view / privacy.view | 页面标识（如需埋点） | 仅浏览，不触发接受协议 | 正式正文与内容版本待 D10 |

## 3. 状态转移与竞态

| 流程 | 转移 | 约束 |
| --- | --- | --- |
| 蓝牙 | idle → connecting → connected / failed / cancelled | 成功后动效补满；动画不能产生成功事实 |
| 配网 | idle → configuring → connected / failed / cancelled | 原型 timeout 是失败预览；正式保留具体 errorCode |
| 设备控制 | idle → pending → success / failed | 局部反馈；失败恢复最近确认值，不锁全页 |
| 授权 | notDetermined → authorized / denied / blocked | 蓝牙 poweredOff 是另一维度；不可当授权被拒 |

- 同一操作防重复提交；重试分配新 requestId，旧结果只作诊断，不改新会话 UI。
- 取消时清理计时器、扫描订阅和可取消请求；设备端不可取消的阶段需由 D09 决定恢复策略，不能宣称操作已停止。
- 用户已退出页面时，不因迟到结果强制跳转。后台回来先重新查询真实状态，再恢复界面。
- 蓝牙连接成功不能清除其他设备的 Wi-Fi 状态；原型互斥连接不能直接复制进正式数据层。
- 名称、设备列表与最近确认灯光值需定义持久化和读取失败兜底；原型内存值不是设备事实。

## 4. 错误映射建议

| 语义原因 | 呈现与恢复 | 状态 |
| --- | --- | --- |
| permission_denied / permission_blocked | 解释用途；按平台允许重试或进入设置 | 待真机补齐 |
| bluetooth_off / unavailable | 提示开启或说明不可用，不冒充权限弹窗 | 待真机补齐 |
| device_not_found | 未发现页，重新搜索/返回 | 原型可预览 |
| connect_timeout / connect_failed | 退水、重试/取消 | 原型可预览；真实时限待定 |
| invalid_input | 输入附近提示，保留可编辑内容 | 需区别于认证失败 |
| wifi_auth_failed | 密码错误，修改或换网络 | 当前页面有，真实回调未接 |
| provision_timeout / network_unreachable / online_unconfirmed | 配网失败，解释可确认的原因，重试/换网络 | 后两者需补文案映射 |
| command_failed / disconnected | 回退确认值；禁用不可用控制并给重连入口 | 真实执行中/失败待接入 |

## 5. 可执行验收清单

1. 三型号分别连接成功/失败/取消/重试；取消后迟到成功不跳页；连续重试无旧会话覆盖。
2. 同型号两台设备的名称、控制和移除不串设备；并发连接按 D01 决议验收。
3. 拒绝权限、不可再次请求、蓝牙关闭、后台恢复分别有可恢复路径。
4. 真实成功晚于 3 秒时继续等待，早到时平滑补满；失败退水；减少动态效果仍准确显示结果。
5. N86 蓝牙成功但未配网时不显示假 SSID/网络在线；配网失败与密码认证失败分开测试。
6. 灯光命令 pending/失败/乱序/实体操作回传；关灯禁调，开灯恢复确认档位。
7. 重命名空白、超长、取消、失败、重启后读取；移除失败不丢记录，最后一台成功移除进入空状态。
8. 首页信息入口→关于→两个协议页→返回；无 App Settings/帮助/权限管理旧入口。
9. 真机 360–430px、安全区、长名称、键盘遮挡、系统返回、读屏与减少动态效果。

以上是生产验收要求，不表示本 HTML 原型已经通过真实设备测试。
