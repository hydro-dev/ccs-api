import { Context, Schema } from 'hydrooj';
import * as handler from './handler';
import { CCSEventFeedService } from './lib/event-mgr';
import { CCSEventContest, CCSEventDoc } from './lib/types';

declare module 'hydrooj' {
    interface Collections {
        'ccs.contest': CCSEventContest;
        'ccs.event': CCSEventDoc;
    }
    interface Context {
        ccs: CCSEventFeedService;
    }
}

export const name = '@frexdeveloper/hydrooj-plugin-ccs';
export const Config = Schema.object({
    username: Schema.string().default('ccs_hydro').description('CCS Username'),
    password: Schema.string().default('defaultKey@ccs').description('CCS Password'),
});

export async function apply(ctx: Context) {
    ctx.plugin(CCSEventFeedService);
    ctx.inject(['ccs'], async (c: Context) => {
        c.server.config.enableSSE = true;
        c.Route('ccs_operation', '/ccs/api/contests/:contestId/operation/:operation', handler.CCSOperationHandler);
        c.Route('ccs_api_info', '/ccs/api', handler.ApiInfoHandler);
        c.Route('ccs_contests', '/ccs/api/contests', handler.ContestsHandler);
        c.Route('ccs_contest', '/ccs/api/contests/:contestId', handler.ContestsHandler);
        c.Route('ccs_contest_state', '/ccs/api/contests/:contestId/state', handler.ContestStateHandler);
        c.Route('ccs_contest_languages', '/ccs/api/contests/:contestId/languages', handler.LanguagesHandler);
        c.Route('ccs_contest_language', '/ccs/api/contests/:contestId/languages/:id', handler.LanguagesHandler);
        c.Route('ccs_contest_problems', '/ccs/api/contests/:contestId/problems', handler.ProblemsHandler);
        c.Route('ccs_contest_problem', '/ccs/api/contests/:contestId/problems/:id', handler.ProblemsHandler);
        c.Route('ccs_contest_teams', '/ccs/api/contests/:contestId/teams', handler.TeamsHandler);
        c.Route('ccs_contest_team', '/ccs/api/contests/:contestId/teams/:id', handler.TeamsHandler);
        c.Route('ccs_contest_organizations', '/ccs/api/contests/:contestId/organizations', handler.OrganizationsHandler);
        c.Route('ccs_contest_organization', '/ccs/api/contests/:contestId/organizations/:id', handler.OrganizationsHandler);
        c.Route('ccs_contest_groups', '/ccs/api/contests/:contestId/groups', handler.GroupsHandler);
        c.Route('ccs_contest_group', '/ccs/api/contests/:contestId/groups/:id', handler.GroupsHandler);
        c.Route('ccs_contest_judgement_types', '/ccs/api/contests/:contestId/judgement-types', handler.JudgementTypesHandler);
        c.Route('ccs_contest_judgement_type', '/ccs/api/contests/:contestId/judgement-types/:id', handler.JudgementTypesHandler);
        c.Route('ccs_contest_submissions', '/ccs/api/contests/:contestId/submissions', handler.SubmissionsHandler);
        c.Route('ccs_contest_submission', '/ccs/api/contests/:contestId/submissions/:id', handler.SubmissionsHandler);
        c.Route('ccs_contest_judgements', '/ccs/api/contests/:contestId/judgements', handler.JudgementsHandler);
        c.Route('ccs_contest_judgement', '/ccs/api/contests/:contestId/judgements/:id', handler.JudgementsHandler);
        c.Route('ccs_contest_runs', '/ccs/api/contests/:contestId/runs', handler.RunsHandler);
        c.Route('ccs_contest_run', '/ccs/api/contests/:contestId/runs/:id', handler.RunsHandler);
        c.Connection('ccs_contest_event_feed', '/ccs/api/contests/:contestId/event-feed', handler.EventFeedHandler);
        c.on('record/change', async (rdoc, $set, $push) => {
            await c.ccs.handleRecordChange(rdoc, $set, $push);
        });
    });

    ctx.i18n.load('zh', {
        'CCS UserName': 'CCS 用户名',
        'CCS Password': 'CCS 密码',
    });
    ctx.i18n.load('zh_TW', {
        'CCS UserName': 'CCS 使用者名稱',
        'CCS Password': 'CCS 密碼',
    });
    ctx.i18n.load('en', {
        'CCS UserName': 'CCS UserName',
        'CCS Password': 'CCS Password',
    });
}
