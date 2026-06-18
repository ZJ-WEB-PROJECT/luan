# 前后端接口差异对照（luan 后端「字段一致性」）

> 对照后端：`luan` 子模块 commit `4fe15d4`（字段一致性，2026-06-18）  
> 前端 App：`src/api/**`（uni-app C 端）  
> 管理台：`luan-web/src/api/**`（eladmin B 端）

## 适配进度总览

| 优先级 | 项 | 状态 | 说明 |
|--------|-----|------|------|
| P0 | 分享查看 `?token=` | ✅ 已完成 | `getShareView` |
| P1 | family 告警 `GET /alarm` | ✅ 已完成 | `getAlarmList` 双通道 |
| P1 | legacy 列表 `/device/all` | ✅ 已完成 | `getDeviceList` |
| P2 | 定位模式保存 PUT loc-mode | ✅ 已完成 | `setLocationMode` + `workmode.vue` |
| P2 | 围栏 modify | ✅ 已完成 | `modifyFence` + `fence/create.vue` |
| P2 | 设备信息页拉详情 | ✅ 已完成 | `device/info.vue` |
| P2 | 围栏 del | ✅ API 已完成 | `deleteFence`（列表页 UI 待接） |
| P3 | 轨迹日期 / 里程 / 超速 | ✅ API 已完成 | `getTrackDates` 等（页面待接） |
| P3 | 定时开关机 family | ✅ API 已完成 | `get/set/deleteTimerSwitch`（页面待接） |
| P3 | 分享撤销 | ✅ API 已完成 | `revokeShareLink`（页面待接） |
| — | 告警 ack/delete/latest | ⬜ 待办 | family 专用 |
| — | 围栏 batch-del / bind-devices | ⬜ 待办 | |
| — | 设备换组 `PUT /{sn}/group` | ⬜ 待办 | |
| — | legacy 围栏 params 去 simei | ⬜ 待办 | 见第五节 |

---

## 变更原则

后端 C 端 `/api/f/la/**` 与 B 端 `/api/la/**` 统一：

| 旧 | 新 |
|---|---|
| 路径 `/{id}`、`/{deviceId}` | 路径 `/{sn}` |
| 查询 `?deviceId=` | 查询 `?sn=` |
| 请求体 `deviceIds: number[]` | 请求体 `sns: string[]` |
| 指令/围栏等 body 里的 `deviceId` | body 里的 `sn` |

**设备标识一律用 SN（IMEI 字符串）**，不再用 `la_device.id` 作为对外参数。

---

## 一、已在前端适配（✅）

### 1. 设备（family / JT808 通道）

| 功能 | 方法 | 新路径 | 前端 |
|------|------|--------|------|
| 设备详情 | GET | `/f/la/device/{sn}` | ✅ `getDeviceDetail` |
| 运行状态刷新 | POST | `/f/la/device/run-info` | ✅ `{ sns }` |
| 下发指令 | POST | `/f/la/device/cmd` | ✅ `{ sn }` |
| 操作日志 | GET | `/f/la/device/op-logs` | ✅ `?sn=` |
| 业务配置读 | GET | `/f/la/device/{sn}/profile` | ✅ |
| 业务配置写 | PUT | `/f/la/device/{sn}/profile` | ✅ |
| 实时追踪 | POST | `/f/la/device/{sn}/tracking` | ✅ |
| 定位模式读 | GET | `/f/la/device/{sn}/loc-mode` | ✅ `getLocationMode` |
| 定位模式写 | PUT | `/f/la/device/{sn}/loc-mode` | ✅ `setLocationMode` |
| 定时开关机 | GET/PUT/DELETE | `/f/la/device/{sn}/timer-switch` | ✅ API |
| 终端参数 | GET | `/f/la/device/{sn}/terminal-params` | ✅ `getTerminalParams` |

### 2. 轨迹 / 报表（family）

| 功能 | 方法 | 路径 | 前端 |
|------|------|------|------|
| 历史轨迹 | GET | `/f/la/location` | ✅ |
| 有轨迹日期 | GET | `/f/la/location/dates` | ✅ `getTrackDates` |
| 停留报表 | GET | `/f/la/analytics/stops` | ✅ |
| 行程报表 | GET | `/f/la/analytics/trips` | ✅ |
| 里程统计 | GET | `/f/la/analytics/distance` | ✅ `getAnalyticsDistance` |
| 超速点 | GET | `/f/la/analytics/overspeed` | ✅ `getAnalyticsOverspeed` |

### 3. 围栏（family）

| 功能 | 方法 | 路径 | 前端 |
|------|------|------|------|
| 围栏列表 | POST | `/f/la/fence/get` | ✅ `{ sn }` |
| 添加围栏 | POST | `/f/la/fence/add` | ✅ |
| 修改围栏 | POST | `/f/la/fence/modify` | ✅ `modifyFence` |
| 删除围栏 | POST | `/f/la/fence/del` | ✅ `deleteFence` |

### 4. 告警 / 列表 / 分享

| 功能 | 通道 | 前端 |
|------|------|------|
| 设备详情 | legacy iotdoc `GET /iotdoc/device/detail?sn=` | ✅ |
| 设备列表 | legacy `GET /device/all` | ✅ |
| 告警列表 | legacy POST `/iotdoc/alarm/get`；family GET `/alarm?sn=` | ✅ `getAlarmList` |
| 创建分享 | POST `/share/create` | ✅ |
| 撤销分享 | POST `/share/revoke` | ✅ `revokeShareLink` |
| 查看分享 | GET `/share/view?token=` | ✅ `getShareView` |

### 5. 页面已对接

| 页面 | 变更 |
|------|------|
| `pages/share/view.vue` | 经 `getShareView` 传 `token` |
| `pages/message/message.vue` | 经 `getAlarmList` 双通道 |
| `pages/workmode/workmode.vue` | 保存调 `setLocationMode` |
| `pages/fence/create.vue` | 编辑调 `modifyFence` |
| `pages/device/info.vue` | 加载 `getDeviceDetail` + SIM |

### 6. 管理台 B 端

| 功能 | 变更 |
|------|------|
| `POST api/la/device/run-info` | ✅ body `{ sns }` |

---

## 二、后端已有、前端仍待办（⬜）

### 1. 仅 API 已封装、页面未使用

| 功能 | 前端 API | 待接页面 |
|------|----------|----------|
| 删除围栏 UI | `deleteFence` | `fence/fence.vue` 长按删除等 |
| 轨迹日期选择 | `getTrackDates` | `track/track.vue` |
| 里程 / 超速报表 | `getAnalyticsDistance` / `getAnalyticsOverspeed` | 报表页扩展 |
| 定时开关机 | `get/set/deleteTimerSwitch` | 远程设置 / 工作模式 |
| 分享撤销 | `revokeShareLink` | 分享管理 |

### 2. 尚未封装

| 功能 | 方法 | 后端路径 |
|------|------|----------|
| 告警确认 | POST | `/f/la/alarm/{id}/ack` |
| 告警删除 | DELETE | `/f/la/alarm/{id}` |
| 最新告警 | GET | `/f/la/alarm/latest?sn=` |
| 围栏批量删除 | POST | `/f/la/fence/batch-del` |
| 围栏绑/解绑设备 | POST | `/f/la/fence/bind-devices`、`/unbind-devices` |
| 点位判定 | GET | `/f/la/fence/check-point?sn=` |
| 设备换组 | PUT | `/f/la/device/{sn}/group` |

---

## 三、已知问题（🐛）

| 接口 | 状态 | 说明 |
|------|------|------|
| 查看分享定位 | ✅ 已修复 | 已改为 `?token=` |
| legacy 设备列表 | ✅ 已修复 | 已改 `/f/la/device/all` |
| legacy 工作模式保存 | ⚠️ 部分 | `workmode.vue` 保存走 family PUT；legacy 需 iotdoc `set-loc-mode` 专用 params |
| legacy 围栏创建 params.simei | ⚠️ 待清理 | 应只用顶层 `sn` |

---

## 四、响应字段变化（family / LaDeviceItemDto）

JT808 详情/列表返回 **LaDeviceItemDto**，与 iotdoc `DeviceGetDetailResp` 字段不同。前端 `normalizeDeviceDetail()` 已做映射：

| iotdoc 页面字段 | JT808 原始字段 | 适配说明 |
|-----------------|----------------|----------|
| `imei` | `sn` | 映射为展示用 IMEI |
| `state` | `onlineStatus`（0/1） | 映射为 `e_line_on` / `e_line_down` |
| `power` | `batteryPercent` | 直接映射 |
| `last_com_time` | `lastSeenTime`（字符串） | 转为 Unix 秒 |
| `last_pos.wgs` | `lastLat,lastLng` | 拼成 `"lat,lng"` |
| `deviceId` | `id` | 仅内部保留，**请求不再使用** |

告警 family 通道经 `mapAlarmToIotdoc()` 转为 message 页兼容字段：`alarm_name`、`time`、`imei`。

---

## 五、iotdoc（legacy）请求约定

- **只传顶层 `sn`**
- **`params` 内禁止传 `simei`**
- 围栏报警字段推荐 `fence_switch`，传 `alarm` 也会映射

---

## 六、双通道速查（C 端 App）

| 能力 | legacy | family |
|------|--------|--------|
| 设备列表 | GET `/device/all` | GET `/device?page=` |
| 设备详情 | GET `/iotdoc/device/detail?sn=` | GET `/device/{sn}` |
| 告警 | POST `/iotdoc/alarm/get` | GET `/alarm?sn=` |
| 定位模式写 | POST `/iotdoc/loc/set-loc-mode` | PUT `/device/{sn}/loc-mode` |
| 定时开关 | POST `/iotdoc/timerswitch/*` | GET/PUT/DELETE `/device/{sn}/timer-switch` |

切换：`src/common/device-api-mode.js`（`legacy` / `family`）。

---

## 七、B 端管理台（luan-web）

设备子资源均为 `/{sn}/...`；`run-info` 已改为 `{ sns }`。其余管理页若仍用 `deviceId` 拼 URL 需逐一排查。

---

## 八、变更日志

| 日期 | 内容 |
|------|------|
| 2026-06-18 | 初版：sn 字段一致性对照 |
| 2026-06-18 | P0–P3 逐步适配：分享 token、告警/列表双通道、loc-mode、围栏 modify、info 页、扩展 API |

---

*Swagger：`http://{host}:8000/doc.html`*
