/* Engineering notes only: do not use these descriptions as protocol implementations. */
(function () {
  const notes = {
  "overview": {
    "conditions": "仅供评审，不进入正式 App。",
    "behavior": "用页面树查看界面、状态与产品图形。",
    "exceptions": "不触发真实设备操作。",
    "demo": "所有数据和状态可由评审工具模拟。"
  },
  "overview/product-shapes": {
    "conditions": "仅供评审，不进入正式 App。",
    "behavior": "用页面树查看界面、状态与产品图形。",
    "exceptions": "不触发真实设备操作。",
    "demo": "所有数据和状态可由评审工具模拟。"
  },
  "devices/empty": {
    "conditions": "按已保存设备列表与授权状态进入；型号不是设备唯一标识。",
    "behavior": "Add Device 先检查权限与蓝牙状态；已具备条件直接扫描。",
    "exceptions": "授权拒绝、蓝牙关闭分开处理；连接开关失败须回退。",
    "demo": "列表/名称仅内存；开关直接切状态并互斥，仅作演示。",
    "entry": "首次启动无设备，或最后一台设备成功移除后。",
    "exits": [
      "等待蓝牙授权",
      "搜索设备",
      "关于 YUI"
    ]
  },
  "devices/empty-bluetooth": {
    "conditions": "按已保存设备列表与授权状态进入；型号不是设备唯一标识。",
    "behavior": "等待系统真实授权结果；允许后检查蓝牙状态再扫描，不计时假定允许。",
    "exceptions": "授权拒绝、蓝牙关闭分开处理；连接开关失败须回退。",
    "demo": "列表/名称仅内存；开关直接切状态并互斥，仅作演示。",
    "entry": "添加时尚未取得蓝牙授权；蓝牙关闭需独立处理。"
  },
  "devices/list": {
    "conditions": "按已保存设备列表与授权状态进入；型号不是设备唯一标识。",
    "behavior": "已连接打开控制页，未连接进入对应蓝牙重连；信息入口打开关于。",
    "exceptions": "授权拒绝、蓝牙关闭分开处理；连接开关失败须回退。",
    "demo": "列表/名称仅内存；开关直接切状态并互斥，仅作演示。",
    "entry": "用户进入 App，或从设备控制、关于返回。",
    "exits": [
      "S601 控制/重连",
      "S602 控制/重连",
      "N86 控制/重连",
      "添加设备",
      "关于 YUI"
    ]
  },
  "add/search": {
    "conditions": "授权允许且蓝牙开启；选择或扫描结果携带 deviceId。",
    "behavior": "真实结果到达才锁定产品；按 deviceId 去重，同型号多台可区分。",
    "exceptions": "退出停止扫描；旧 sessionId 结果丢弃；无结果超时可重试。",
    "demo": "固定三型号样本按计时返回；search-result=timeout 可预览未发现。"
  },
  "add/not-found": {
    "conditions": "授权允许且蓝牙开启；选择或扫描结果携带 deviceId。",
    "behavior": "真实结果到达才锁定产品；按 deviceId 去重，同型号多台可区分。",
    "exceptions": "退出停止扫描；旧 sessionId 结果丢弃；无结果超时可重试。",
    "demo": "固定三型号样本按计时返回；search-result=timeout 可预览未发现。"
  },
  "add/found": {
    "conditions": "授权允许且蓝牙开启；选择或扫描结果携带 deviceId。",
    "behavior": "真实结果到达才锁定产品；按 deviceId 去重，同型号多台可区分。",
    "exceptions": "退出停止扫描；旧 sessionId 结果丢弃；无结果超时可重试。",
    "demo": "固定三型号样本按计时返回；search-result=timeout 可预览未发现。"
  },
  "bluetooth/connecting": {
    "conditions": "选中设备或已有设备重连；保留 deviceId、model、source、requestId。",
    "behavior": "真实成功回调→平滑补满→原位成功→Open；失败退水，重试新会话。",
    "exceptions": "取消返回发起页并忽略迟到结果；真实超时待 D03；N86 配网顺序待 D02。",
    "demo": "2.2 秒模拟成功、约3秒补满；失败演示1.5秒触发；取消统一回已发现。",
    "purpose": "等待选中设备的真实蓝牙连接结果；成功连续补满后原位呈现成功，失败退水。"
  },
  "bluetooth/connecting-s602": {
    "conditions": "选中设备或已有设备重连；保留 deviceId、model、source、requestId。",
    "behavior": "真实成功回调→平滑补满→原位成功→Open；失败退水，重试新会话。",
    "exceptions": "取消返回发起页并忽略迟到结果；真实超时待 D03；N86 配网顺序待 D02。",
    "demo": "2.2 秒模拟成功、约3秒补满；失败演示1.5秒触发；取消统一回已发现。",
    "purpose": "等待选中设备的真实蓝牙连接结果；成功连续补满后原位呈现成功，失败退水。"
  },
  "bluetooth/connecting-n86": {
    "conditions": "选中设备或已有设备重连；保留 deviceId、model、source、requestId。",
    "behavior": "真实成功回调→平滑补满→原位成功→Open；失败退水，重试新会话。",
    "exceptions": "取消返回发起页并忽略迟到结果；真实超时待 D03；N86 配网顺序待 D02。",
    "demo": "2.2 秒模拟成功、约3秒补满；失败演示1.5秒触发；取消统一回已发现。",
    "purpose": "等待选中设备的真实蓝牙连接结果；成功连续补满后原位呈现成功，失败退水。"
  },
  "bluetooth/success": {
    "conditions": "选中设备或已有设备重连；保留 deviceId、model、source、requestId。",
    "behavior": "真实成功回调→平滑补满→原位成功→Open；失败退水，重试新会话。",
    "exceptions": "取消返回发起页并忽略迟到结果；真实超时待 D03；N86 配网顺序待 D02。",
    "demo": "2.2 秒模拟成功、约3秒补满；失败演示1.5秒触发；取消统一回已发现。"
  },
  "bluetooth/error": {
    "conditions": "选中设备或已有设备重连；保留 deviceId、model、source、requestId。",
    "behavior": "真实成功回调→平滑补满→原位成功→Open；失败退水，重试新会话。",
    "exceptions": "取消返回发起页并忽略迟到结果；真实超时待 D03；N86 配网顺序待 D02。",
    "demo": "2.2 秒模拟成功、约3秒补满；失败演示1.5秒触发；取消统一回已发现。",
    "purpose": "保留目标设备，显示连接失败并提供重试、取消；退水仅表达失败结果。"
  },
  "wifi/list": {
    "conditions": "N86 配网能力可用；保留目标设备与选中 SSID/安全类型。",
    "behavior": "配网容器 progress/success/timeout 原位切换；真实确认才显示成功。",
    "exceptions": "格式错误与认证失败分开；系统返回/退出策略待 D09；密码不得入日志。",
    "demo": "SSID 固定；不足8字符模拟密码错误；计时自动成功/超时不代表真实网络。"
  },
  "wifi/password": {
    "conditions": "N86 配网能力可用；保留目标设备与选中 SSID/安全类型。",
    "behavior": "配网容器 progress/success/timeout 原位切换；真实确认才显示成功。",
    "exceptions": "格式错误与认证失败分开；系统返回/退出策略待 D09；密码不得入日志。",
    "demo": "SSID 固定；不足8字符模拟密码错误；计时自动成功/超时不代表真实网络。",
    "purpose": "接收选中网络的密码并发起配网；格式校验与设备认证结果分开。"
  },
  "wifi/password-error": {
    "conditions": "N86 配网能力可用；保留目标设备与选中 SSID/安全类型。",
    "behavior": "配网容器 progress/success/timeout 原位切换；真实确认才显示成功。",
    "exceptions": "格式错误与认证失败分开；系统返回/退出策略待 D09；密码不得入日志。",
    "demo": "SSID 固定；不足8字符模拟密码错误；计时自动成功/超时不代表真实网络。"
  },
  "wifi/progress": {
    "conditions": "N86 配网能力可用；保留目标设备与选中 SSID/安全类型。",
    "behavior": "配网容器 progress/success/timeout 原位切换；真实确认才显示成功。",
    "exceptions": "格式错误与认证失败分开；系统返回/退出策略待 D09；密码不得入日志。",
    "demo": "SSID 固定；不足8字符模拟密码错误；计时自动成功/超时不代表真实网络。",
    "purpose": "用同一容器呈现配网中、成功与失败；以真实回调驱动，动效不等于网络进度。"
  },
  "device/s601": {
    "conditions": "已连接设备进入；设备唯一标识与型号分离。",
    "behavior": "重命名与移除为弹层；控制需设备确认结果，不由动画判断成功。",
    "exceptions": "请求中防重入；失败保留/回退确认值；断连原位禁用并提示重连。",
    "demo": "控制、名称和移除直接改内存；持久化、失败回退、最后一台转空页待接入。"
  },
  "device/s602": {
    "conditions": "已连接设备进入；设备唯一标识与型号分离。",
    "behavior": "重命名与移除为弹层；控制需设备确认结果，不由动画判断成功。",
    "exceptions": "请求中防重入；失败保留/回退确认值；断连原位禁用并提示重连。",
    "demo": "控制、名称和移除直接改内存；持久化、失败回退、最后一台转空页待接入。",
    "events": [
      "device.view",
      "light.toggle",
      "light.brightness.set",
      "device.rename",
      "device.remove.confirm"
    ]
  },
  "device/n86": {
    "conditions": "已连接设备进入；设备唯一标识与型号分离。",
    "behavior": "网络状态与蓝牙状态分开查询；Change Wi-Fi 进入网络选择；未查询到不可显示示例网络在线。",
    "exceptions": "请求中防重入；失败保留/回退确认值；断连原位禁用并提示重连。",
    "demo": "控制、名称和移除直接改内存；持久化、失败回退、最后一台转空页待接入。",
    "exits": [
      "我的设备",
      "蓝牙重连",
      "选择 Wi-Fi / 重新配网"
    ],
    "events": [
      "device.view",
      "wifi.scan.start",
      "wifi.provision.start",
      "device.rename",
      "device.remove.confirm"
    ]
  },
  "settings/about": {
    "conditions": "我的设备信息入口→关于→协议正文；无中间设置页。",
    "behavior": "返回关于或我的设备；阅读不等于接受协议。",
    "exceptions": "正式内容与版本由产品确认；内容加载失败需可重试。",
    "demo": "协议正文明确待补充，非正式条款；版本号为原型版本。"
  },
  "settings/terms": {
    "conditions": "我的设备信息入口→关于→协议正文；无中间设置页。",
    "behavior": "返回关于或我的设备；阅读不等于接受协议。",
    "exceptions": "正式内容与版本由产品确认；内容加载失败需可重试。",
    "demo": "协议正文明确待补充，非正式条款；版本号为原型版本。"
  },
  "settings/privacy": {
    "conditions": "我的设备信息入口→关于→协议正文；无中间设置页。",
    "behavior": "返回关于或我的设备；阅读不等于接受协议。",
    "exceptions": "正式内容与版本由产品确认；内容加载失败需可重试。",
    "demo": "协议正文明确待补充，非正式条款；版本号为原型版本。"
  }
};
  Object.entries(notes).forEach(([id, note]) => {
    const screen = window.YUI_SCREENS[id];
    for (const key of ['purpose', 'entry', 'exits', 'events']) if (note[key]) screen[key] = note[key];
    screen.handoff = note;
  });
})();
