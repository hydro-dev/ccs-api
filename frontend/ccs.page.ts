import { $, addPage, confirm, NamedPage, Notification, request } from '@hydrooj/ui-default';

addPage(new NamedPage(['contest_detail'], () => {
  if ((UserContext.priv & 1) && UiContext.tdoc.rule === 'acm') {
    const menuList = $('div.medium-3.columns .menu');
    menuList.append('<li class="menu__item"><a id="contest-init" class="menu__link"><span class="icon icon-settings"></span>(CCS) 初始化比赛</a></li>');
    menuList.append('<li class="menu__item"><a id="contest-reset" class="menu__link"><span class="icon icon-warning"></span>(CCS) 重置比赛</a></li>');
    $('#contest-init').on('click', async () => {
      try {
        Notification.info('正在初始化比赛...');
        const payload = await request.post(`/d/${UiContext.domainId}/ccs/api/contests/${UiContext.tdoc._id}/operation/init`);
        Notification.success(payload.message);
      } catch (e) {
        Notification.error(`${e.message} - params: ${e.params?.[0]}`);
      }
    });
    $('#contest-reset').on('click', async () => {
      try {
        if (!(await confirm('重置后需要重新初始化比赛，确认重置比赛吗？'))) return;
        Notification.info('正在重置比赛...');
        const payload = await request.post(`/d/${UiContext.domainId}/ccs/api/contests/${UiContext.tdoc._id}/operation/reset`);
        Notification.success(payload.message);
      } catch (e) {
        Notification.error(`${e.message} - params: ${e.params?.[0]}`);
      }
    });
  }
}));
