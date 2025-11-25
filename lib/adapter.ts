import crypto from 'crypto';
import {
    ContestModel, ProblemConfig, ProblemDict, ProblemModel,
    RecordDoc, STATUS_SHORT_TEXTS, Tdoc, TestCase, User,
} from 'hydrooj';
import {
    CCSContest, CCSJudgement, CCSOrganization,
    CCSProblem, CCSRun, CCState, CCSTeam, CCSubmission,
} from './types';
import { TimeUtils } from './utils';

export class CCSAdapter {
    public toContest(tdoc: Tdoc): CCSContest {
        return {
            id: tdoc.docId.toHexString(),
            name: tdoc.title,
            formal_name: tdoc.title,
            start_time: TimeUtils.formatTime(tdoc.beginAt),
            duration: TimeUtils.formatDuration(tdoc.endAt.getTime() - tdoc.beginAt.getTime()),
            scoreboard_type: 'pass-fail',
            scoreboard_freeze_duration: tdoc.lockAt
                ? TimeUtils.formatDuration(tdoc.endAt.getTime() - tdoc.lockAt.getTime())
                : null,
            penalty_time: 20,
        };
    }

    public toState(tdoc: Tdoc): CCState {
        const nowTime = new Date();
        const started = (ContestModel.isOngoing(tdoc)) ? TimeUtils.formatTime(tdoc.beginAt) : null;
        const ended = ContestModel.isDone(tdoc) ? TimeUtils.formatTime(tdoc.endAt) : null;
        const frozen = tdoc.lockAt
            ? (ContestModel.isDone(tdoc) ? TimeUtils.formatTime(tdoc.lockAt) : (ContestModel.isLocked(tdoc) ? TimeUtils.formatTime(tdoc.lockAt) : null))
            : null;
        const thawed = (ContestModel.isDone(tdoc) && !ContestModel.isLocked(tdoc)) ? TimeUtils.formatTime(nowTime) : null;
        const finalized = ContestModel.isDone(tdoc) ? TimeUtils.formatTime(new Date(tdoc.endAt.getTime() + 60 * 1000)) : null;
        return {
            started,
            frozen,
            ended,
            thawed,
            finalized,
            end_of_updates: null,
        };
    }

    public async toProblem(tdoc: Tdoc, pdict: ProblemDict, index: number, pid: number): Promise<CCSProblem> {
        const referenceInfo: { domainId: string, pid: number } = pdict[pid].reference;
        const referenceData = referenceInfo ? await ProblemModel.get(referenceInfo.domainId, referenceInfo.pid) : null;
        return {
            id: `${pid}`,
            label: String.fromCharCode(65 + index),
            name: pdict[pid].title,
            ordinal: index,
            color: (typeof (tdoc.balloon?.[pid]) === 'object' ? tdoc.balloon[pid].name : tdoc.balloon?.[pid]) || 'white',
            rgb: (typeof (tdoc.balloon?.[pid]) === 'object' ? tdoc.balloon[pid].color : null) || '#ffffff',
            time_limit: (((referenceData ? referenceData.config : pdict[pid].config) as ProblemConfig).timeMax) / 1000,
            test_data_count: (((referenceData ? referenceData.config : pdict[pid].config) as ProblemConfig).count),
        };
    }

    public toTeam(udoc: User, unrank: boolean): CCSTeam {
        return {
            id: `team-${udoc._id}`,
            label: udoc.seat || `team-${udoc._id}`,
            name: udoc.displayName || udoc.uname,
            display_name: (unrank ? '⭐' : '') + (udoc.displayName || udoc.uname),
            organization_id: crypto.createHash('md5').update(udoc.school || udoc.uname).digest('hex'),
            group_ids: [unrank ? 'observers' : 'participants'],
        };
    }

    public toOrganization(orgId: string, udoc: User): CCSOrganization {
        return {
            id: orgId,
            name: udoc.school || udoc.uname,
            formal_name: udoc.school || udoc.uname,
        };
    }

    public toSubmission(tdoc: Tdoc, rdoc: RecordDoc): CCSubmission {
        const submitTime = TimeUtils.formatTime(rdoc._id.getTimestamp());
        const contestTime = TimeUtils.getContestTime(tdoc, rdoc._id.getTimestamp());
        return {
            id: rdoc._id.toHexString(),
            language_id: rdoc.lang?.split('.')[0],
            problem_id: `${rdoc.pid}`,
            team_id: `team-${rdoc.uid}`,
            time: submitTime,
            contest_time: contestTime,
        };
    }

    public toJudgement(tdoc: Tdoc, rdoc: RecordDoc): CCSJudgement {
        return {
            id: `j-${rdoc._id.toHexString()}`,
            submission_id: rdoc._id.toHexString(),
            judgement_type_id: rdoc.judgeAt ? STATUS_SHORT_TEXTS[rdoc.status] : null,
            start_time: TimeUtils.formatTime(rdoc._id.getTimestamp()),
            start_contest_time: TimeUtils.getContestTime(tdoc, rdoc._id.getTimestamp()),
            end_time: rdoc.judgeAt ? TimeUtils.formatTime(rdoc.judgeAt) : null,
            end_contest_time: rdoc.judgeAt ? TimeUtils.getContestTime(tdoc, rdoc.judgeAt) : null,
        };
    }

    public toRun(tdoc: Tdoc, rdoc: RecordDoc, testCaseDoc: TestCase): CCSRun {
        return {
            id: `r-${rdoc._id.toHexString()}-${testCaseDoc.id}`,
            judgement_id: `j-${rdoc._id.toHexString()}`,
            ordinal: testCaseDoc.id,
            judgement_type_id: STATUS_SHORT_TEXTS[testCaseDoc.status],
            time: TimeUtils.formatTime(new Date(rdoc._id.getTimestamp().getTime() + testCaseDoc.time)),
            contest_time: TimeUtils.getContestTime(tdoc, new Date(rdoc._id.getTimestamp().getTime() + testCaseDoc.time)),
            run_time: testCaseDoc.time / 1000,
        };
    }
}
