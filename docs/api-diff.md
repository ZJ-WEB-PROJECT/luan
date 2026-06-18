# 前后端接口差异对照（luan 后端「字段一致性」）

> 对照后端：`luan` 子模块 commit `4fe15d4`（字段一致性，2026-06-18）  
> 前端 App：`src/api/**`（uni-app C 端）  
> 管理台：`luan-web/src/api/**`（eladmin B 端）

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

以下接口已在 `src/api/device.js` / `adapters.js` / `endpoints.js` 中按新规范改完。

### 1. 设备（family / JT808 通道）

| 功能 | 方法 | 新路径 | 参数变化 |
|------|------|--------|----------|
| 设备详情 | GET | `/f/la/device/{sn}` | 原 `/{id}` |
| 运行状态刷新 | POST | `/f/la/device/run-info` | body: `{ sns: string[] }` |
| 下发指令 | POST | `/f/la/device/cmd` | body: `{ sn, type, ... }` |
| 操作日志 | GET | `/f/la/device/op-logs` | `?sn=&page=&size=` |
| 业务配置读 | GET | `/f/la/device/{sn}/profile` | 原 `/{id}/profile` |
| 业务配置写 | PUT | `/f/la/device/{sn}/profile` | 原 `/{id}/profile` |
| 实时追踪 | POST | `/f/la/device/{sn}/tracking` | body: `{ intervalSec, durationSec }` |
| 定位模式读 | GET | `/f/la/device/{sn}/loc-mode` | 原 `/{id}/loc-mode` |

### 2. 轨迹 / 报表（family）

| 功能 | 方法 | 新路径 | 参数变化 |
|------|------|--------|----------|
| 历史轨迹 | GET | `/f/la/location` | `?sn=&timeBegin=&timeEnd=&page=&size=` |
| 停留报表 | GET | `/f/la/analytics/stops` | `?sn=&timeBegin=&timeEnd=&page=&size=` |
| 行程报表 | GET | `/f/la/analytics/trips` | `?sn=&timeBegin=&timeEnd=&page=&size=` |

### 3. 围栏（family）

| 功能 | 方法 | 路径 | 参数变化 |
|------|------|------|----------|
| 围栏列表 | POST | `/f/la/fence/get` | body: `{ sn, limitSize?, lastSfid? }`（**已移除 GET ?deviceId=**） |
| 添加围栏 | POST | `/f/la/fence/add` | body: `{ sn, fence: {...} }` |

### 4. 设备详情（legacy / iotdoc 通道）

| 功能 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 设备详情 | GET | `/f/la/iotdoc/device/detail?sn=` | 旧版仍走 iotdoc，**不是** `/f/la/device/{sn}` |

### 5. 管理台 B 端

| 功能 | 变更 |
|------|------|
| `POST api/la/device/run-info` | body 改为 `{ sns: string[] }`（`luan-web` 已改） |

---

## 二、后端已更新、前端尚未对接（⚠️ 待办）

### 1. 设备 settings（family 专用，endpoints 未收录）

| 功能 | 方法 | 后端路径 | 前端现状 |
|------|------|----------|----------|
| 定位模式保存 | PUT | `/f/la/device/{sn}/loc-mode` | 仅实现 GET；`workmode.vue` 保存仍写本地 storage |
| 定时开关机读 | GET | `/f/la/device/{sn}/timer-switch` | 未实现 |
| 定时开关机写 | PUT | `/f/la/device/{sn}/timer-switch` | 未实现 |
| 关闭定时开关机 | DELETE | `/f/la/device/{sn}/timer-switch` | 未实现 |
| 终端参数只读 | GET | `/f/la/device/{sn}/terminal-params` | 未实现；`device/info.vue` 未拉详情 |
| 设备换组 | PUT | `/f/la/device/{sn}/group` | 未实现 |

**legacy 对应（iotdoc，仍可用）：**

| 功能 | 路径 |
|------|------|
| 定时开关 | `/f/la/iotdoc/timerswitch/get|set|close` |
| 定位模式写 | `/f/la/iotdoc/loc/set-loc-mode` |
| 周期定位等 | `/f/la/iotdoc/loc/*` |

### 2. 轨迹 / 分析（family）

| 功能 | 方法 | 后端路径 | 前端现状 |
|------|------|----------|----------|
| 有轨迹日期 | GET | `/f/la/location/dates?sn=` | 未实现（legacy 有 `POST /iotdoc/location/track-dates`） |
| 里程统计 | GET | `/f/la/analytics/distance?sn=` | 未实现 |
| 超速点 | GET | `/f/la/analytics/overspeed?sn=` | 未实现 |

### 3. 围栏（family）

| 功能 | 方法 | 后端路径 | 前端现状 |
|------|------|----------|----------|
| 修改围栏 | POST | `/f/la/fence/modify` | `fence/create.vue` 提示「编辑围栏接口待对接」 |
| 删除围栏 | POST | `/f/la/fence/del` | body: `{ sn, fenceId }`，未实现 |
| 批量删除 | POST | `/f/la/fence/batch-del` | body: `{ sn, fenceIds }`，未实现 |
| 绑/解绑设备 | POST | `/f/la/fence/bind-devices`、`/unbind-devices` | 未实现 |
| 点位判定 | GET | `/f/la/fence/check-point?sn=&lat=&lng=` | 未实现 |

### 4. 告警（family vs legacy 分叉）

| 通道 | 方法 | 路径 | 前端现状 |
|------|------|------|----------|
| **legacy** | POST | `/f/la/iotdoc/alarm/get` | `user.js` → `getAlarmList`，`message.vue` 在用 |
| **family** | GET | `/f/la/alarm?sn=&page=&size=` | **未实现**；family 模式下消息页仍调 iotdoc |
| family 确认 | POST | `/f/la/alarm/{id}/ack` | 未实现 |
| family 删除 | DELETE | `/f/la/alarm/{id}` | 未实现 |
| family 最新 | GET | `/f/la/alarm/latest?sn=` | 未实现 |

### 5. 分享

| 功能 | 方法 | 路径 | 前端现状 |
|------|------|------|----------|
| 创建分享 | POST | `/f/la/share/create` | ✅ body `{ sn, ttlHours? }` 已对接 |
| 撤销分享 | POST | `/f/la/share/revoke` | 未实现 |
| 查看分享 | GET | `/f/la/share/view?token=` | ⚠️ **参数名不一致**，见第三节 |

### 6. 设备列表（legacy 路径注释 vs 实现）

| 说明 | endpoints 注释 | 实际 endpoints | 后端 |
|------|----------------|----------------|------|
| legacy 列表 | 注释写「不分页 `/all`」 | 配置为 `/f/la/device` | `GET /f/la/device/all` 返回简要列表；`GET /f/la/device` 为分页 |

**建议：** legacy 模式 `getDeviceList` 应改调 `/f/la/device/all`，或确认分页 GET 行为是否符合预期。

---

## 三、已知参数 / 路径不一致（🐛 需修复）

| 接口 | 后端要求 | 前端当前 | 位置 |
|------|----------|----------|------|
| 查看分享定位 | `GET /f/la/share/view?**token**=` | 传 `{ shareToken }` | `device.js` → `getShareView`；`pages/share/view.vue` |
| legacy 设备列表 | 推荐 `GET /f/la/device/all` | `GET /f/la/device`（与 family 同路径） | `endpoints.js` + `getDeviceList` |

---

## 四、响应字段变化（family / LaDeviceItemDto）

JT808 详情/列表返回 **LaDeviceItemDto**，与 iotdoc `DeviceGetDetailResp` 字段不同。前端 `normalizeDeviceDetail()` 已做映射：

| iotdoc 页面字段 | JT808 原始字段 | 适配说明 |
|-----------------|----------------|----------|
| `imei` | `sn` | 映射为展示用 IMEI |
| `state` | `onlineStatus`（0/1） | 映射为 `e_line_on` / `e_line_down` |
| `power` | `batteryPercent` | 直接映射 |
| `last_com_time` | `lastSeenTime`（`yyyy-MM-dd HH:mm:ss` 字符串） | 转为 Unix 秒 |
| `last_pos.wgs` | `lastLat,lastLng` | 拼成 `"lat,lng"` |
| `deviceId` | `id` | 仅内部保留，**请求不再使用** |

iotdoc 详情仍保留：`last_pos`（JSON 字符串）、`state`（`e_line_on/down/sleep`）、`last_com_time`（Unix 秒）等原字段。

---

## 五、iotdoc（legacy）请求约定（后端强制）

来自 `LaIotdocFrontApiNotes`：

- **只传顶层 `sn`**（本系统绑定的 SN/IMEI）
- **`params` 内禁止传 `simei`**，后端会按 `sn` 查库并注入第三方 simei
- 围栏报警字段推荐 `fence_switch`（`e_fence_in/out/in_out/close`），传 `alarm` 也会映射

前端 `buildFenceCreateParams` 里若仍带 `simei` 数组，legacy 模式下可能被后端忽略或覆盖，建议统一改为顶层 `sn`。

---

## 六、双通道速查（C 端 App）

| 能力 | legacy（旧版 / iotdoc） | family（新版 / JT808） |
|------|-------------------------|------------------------|
| 设备详情 | GET `/iotdoc/device/detail?sn=` | GET `/device/{sn}` |
| 设备配置 | POST `/iotdoc/device/get-config` | GET `/device/{sn}/profile` |
| 写配置 | POST `/iotdoc/device/set-config` | PUT `/device/{sn}/profile` |
| 轨迹 | POST `/iotdoc/location/query` | GET `/location?sn=` |
| 停留报表 | POST `/iotdoc/location/ppoint-summary` | GET `/analytics/stops?sn=` |
| 行程报表 | POST `/iotdoc/location/pdistance` | GET `/analytics/trips?sn=` |
| 操作日志 | POST `/iotdoc/device/get-log` | GET `/device/op-logs?sn=` |
| 定位模式 | POST `/iotdoc/loc/get-loc-mode` | GET `/device/{sn}/loc-mode` |
| 实时追踪 | POST `/iotdoc/location/tracking` | POST `/device/{sn}/tracking` |
| 围栏列表 | POST `/iotdoc/fence/get` | POST `/fence/get` `{ sn }` |
| 告警 | POST `/iotdoc/alarm/get` | GET `/alarm?sn=` |
| SIM | POST `/iotdoc/sim/*` | 同左（两通道共用 iotdoc SIM） |

切换方式：`src/common/device-api-mode.js`（本地 storage `deviceApiMode`：`legacy` / `family`）。

---

## 七、B 端管理台额外变更（luan-web）

除 `run-info` 外，B 端设备子资源路径与 C 端 family 一致，均为 `/{sn}/...`：

- `GET api/la/device/{sn}` 详情
- `GET|PUT api/la/device/{sn}/profile`
- `GET|PUT api/la/device/{sn}/loc-mode`
- `GET|PUT|DELETE api/la/device/{sn}/timer-switch`
- `POST api/la/device/{sn}/tracking`
- `PUT api/la/device/{sn}/group`

管理台若仍有按 `deviceId` 拼 URL 的页面，需逐一改为 `sn`。

---

## 八、建议修复优先级

1. **P0** — `getShareView` 查询参数改为 `token`（分享页不可用）
2. **P1** — family 模式下 `getAlarmList` 改调 `GET /f/la/alarm?sn=`
3. **P1** — legacy `getDeviceList` 确认是否改 `/f/la/device/all`
4. **P2** — 补充 `setLocationMode`（PUT loc-mode）、围栏 modify/del
5. **P2** — `device/info.vue` 对接详情或 `terminal-params`
6. **P3** — 轨迹日期、里程/超速分析、定时开关机 family 接口

---

*文档生成依据：后端 `luan/eladmin-system/.../luanfront/rest/**` 与前端 `src/api/**` 静态对照。Swagger 在线文档：`http://{host}:8000/doc.html`*
