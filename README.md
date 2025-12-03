# ccs-api

![NPM Version](https://img.shields.io/npm/v/@frexdeveloper/hydrooj-plugin-ccs)

为 Hydro OJ 中的 ACM/ICPC 赛制比赛添加部分 CCS(Contest Control System) API 支持

## 特别提醒

开源项目不提供任何技术支持，如有需要，请 [添加 Hydro 官方 QQ 群联系群主咨询](https://qm.qq.com/q/NsYu3dNXa2)

## 已支持

- `/api`
- `/api/contests`
- `/api/contests/<contestId>`
- `/api/contests/<contestId>/state`
- `/api/contests/<contestId>/languages`
- `/api/contests/<contestId>/problems`
- `/api/contests/<contestId>/teams`
- `/api/contests/<contestId>/organizations`
- `/api/contests/<contestId>/groups`
- `/api/contests/<contestId>/judgement-types`
- `/api/contests/<contestId>/submissions`
- `/api/contests/<contestId>/judgements`
- `/api/contests/<contestId>/runs`
- `/api/contests/<contestId>/event-feed` (支持 `stream` 和 `since_token` 查询参数)

## 未支持

- `webhooks` 接口
- `scoreboard` 接口
- `Persons` 接口

## 未计划支持

- `Awards` 接口
- `Accounts` 接口
- `Commentary` 接口
- `Clarifications` 接口
- 部分 `POST` / `PUT` / `PATCH` 接口

## How to use

- 安装插件并重启 Hydro OJ

```bash
yarn global add @frexdeveloper/hydrooj-plugin-ccs
hydrooj addon add @frexdeveloper/hydrooj-plugin-ccs
pm2 restart hydrooj
```

- 创建好 ACM/ICPC 赛制比赛，并将时间、题目、队伍等等一系列赛前设置全部设置完善，保持在随时可以开始比赛的状态即可。

> [!CAUTION]
> 本插件只考虑正规 XCPC 比赛场景，即假设比赛中途不会改动任何有关比赛设置、队伍、题目等一系列赛前应该设置完善的数据。如果迫不得已需要改动，请联系管理员[重置比赛 CCS 数据并重新初始化](#注意事项)
>
> 如果比赛中途重新初始化比赛，请重置 CDS Event-Feed 缓存，否则 CDS 会出现数据混乱。

- 进入 “控制面板-配置管理” 修改 CCS 账户的默认密码：

![](./images/change-default-passwd.png)

- 确定以上所有比赛的赛前基本设置均已设置完毕且不再改变后，进入比赛详情页面，点击右侧菜单栏中的 “(CCS) 初始化比赛” 按钮对比赛数据初始化：

![](./images/init-contest.png)

- 使用 ICPC Tools CDS 连接 CCS，CCS URL 格式为：  
`http(s)://<domain>/ccs/api/contests/<ContestId>`
- 如果你的比赛在特定的域中，那么预期的 URL 格式应为：  
`http(s)://<domain>/d/<domainId>/ccs/api/contests/<ContestId>`

- 若配置无误，CDS 将会按预期正常工作。

![](./images/cds.png)

> [!TIP]
> 比赛 ID 就在你进入比赛详情页面后的 URL 里：
>
> 形如 `http(s)://xxxx/contest/68ead09f61ab6063d9fcd417`，比赛 ID 就是 `68ead09f61ab6063d9fcd417`

## 注意事项

在初始化后如果出现比赛数据混乱或改动了任何有关比赛设置、队伍、题目等赛前数据，进入比赛详情页面，点击 “(CCS) 重置比赛” 对比赛数据进行重置。随后再点击 “(CCS) 初始化比赛” 重新初始化比赛数据：

> [!CAUTION]
> 注意此操作会将此比赛的 CCS Events 以及数据全部清空，重新初始化后按预期会恢复目前比赛已有的所有事件。

![](./images/reset-contest.png)

## PRs welcome ~