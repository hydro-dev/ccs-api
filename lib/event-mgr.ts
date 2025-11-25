/* eslint-disable no-await-in-loop */
import crypto from 'crypto';
import { Collection } from 'mongodb';
import {
    ContestModel, Context, ForbiddenError, ObjectId, ProblemModel, RecordDoc, RecordModel, Service,
    STATUS, STATUS_SHORT_TEXTS, STATUS_TEXTS, Tdoc, UserModel,
} from 'hydrooj';
import { CCSAdapter } from './adapter';
import { CCSEventContest, CCSEventDoc, CCState, EventType } from './types';

export class CCSEventFeedService extends Service {
    public adapter: CCSAdapter;
    public eventCollection: Collection<CCSEventDoc>;
    public contestCollection: Collection<CCSEventContest>;

    constructor(ctx: Context) {
        super(ctx, 'ccs');
        this.adapter = new CCSAdapter();
        this.eventCollection = ctx.db.collection('ccs.event');
        this.contestCollection = ctx.db.collection('ccs.contest');
    }

    async resetContest(tdoc: Tdoc) {
        await this.contestCollection.deleteOne({ domainId: tdoc.domainId, tid: tdoc._id });
        await this.eventCollection.deleteMany({ tid: tdoc._id });
    }

    async isContestInitialized(tdoc: Tdoc) {
        const existed = await this.contestCollection.findOne({ domainId: tdoc.domainId, tid: tdoc._id });
        if (!existed) return false;
        return true;
    }

    async addEvent(tid: ObjectId, type: EventType, data: any) {
        const edoc: CCSEventDoc = { _id: new ObjectId(), tid, type, data };
        await this.eventCollection.insertOne(edoc);
        return edoc;
    }

    async getEvents(tid: ObjectId, sinceId: ObjectId | null = null, type: EventType | null = null) {
        const query = { ...(sinceId ? { _id: { $gt: sinceId } } : {}), tid, ...(type ? { type } : {}) };
        return this.eventCollection.find(query).sort({ _id: 1 }).toArray();
    }

    public getEventAsText(event: CCSEventDoc) {
        return JSON.stringify({
            type: event.type as EventType,
            id: event.data.id ? `${event.data.id}` : null,
            data: event.data,
            token: event._id.toHexString(),
        });
    }

    async addMissingStateEvent(tdoc: Tdoc) {
        let shouldAddEvent = false;
        const stateEvents = await this.getEvents(tdoc._id, null, 'state');
        const lastStateEvent = stateEvents[stateEvents.length - 1];
        const stateData: CCState | null = lastStateEvent?.data as CCState ?? null;

        const isOngoing = ContestModel.isOngoing(tdoc);
        const isDone = ContestModel.isDone(tdoc);
        const isLocked = ContestModel.isLocked(tdoc);

        if (!stateData) {
            shouldAddEvent = true;
        } else {
            shouldAddEvent = (
                (isOngoing && !stateData.started)
                || (isOngoing && isLocked && !stateData.frozen)
                || (isDone && !stateData.ended)
                || (isDone && !isLocked && !stateData.thawed)
            );
        }

        if (shouldAddEvent) {
            await this.addEvent(tdoc._id, 'state', this.adapter.toState(tdoc));
        }
    }

    async handleRecordChange(rdoc: RecordDoc, $set: any, $push: any) {
        if (!rdoc.contest || rdoc.contest.toHexString().startsWith('0'.repeat(23))) return;
        const tdoc = await ContestModel.get(rdoc.domainId, rdoc.contest);
        if (!tdoc) return;
        if (!(await this.isContestInitialized(tdoc))) return;
        if (rdoc.status === 0) {
            await this.addEvent(tdoc._id, 'submissions', this.adapter.toSubmission(tdoc, rdoc));
            await this.addEvent(tdoc._id, 'judgements', this.adapter.toJudgement(tdoc, rdoc));
        } else if (rdoc.judgeAt) {
            await this.addEvent(tdoc._id, 'judgements', this.adapter.toJudgement(tdoc, rdoc));
        } else if ($push.testCases) {
            await this.addEvent(tdoc._id, 'runs', this.adapter.toRun(tdoc, rdoc, $push.testCases));
        }
    }

    async initializeEvent(tdoc: Tdoc) {
        // contest
        await this.addEvent(tdoc._id, 'contest', this.adapter.toContest(tdoc));

        // state
        await this.addEvent(tdoc._id, 'state', this.adapter.toState(tdoc));

        // languages
        await this.addEvent(tdoc._id, 'languages', { id: 'c', name: 'C' });
        await this.addEvent(tdoc._id, 'languages', { id: 'cpp', name: 'C++' });
        await this.addEvent(tdoc._id, 'languages', { id: 'cc', name: 'C++' });
        await this.addEvent(tdoc._id, 'languages', { id: 'java', name: 'Java' });
        await this.addEvent(tdoc._id, 'languages', { id: 'python', name: 'Python' });
        await this.addEvent(tdoc._id, 'languages', { id: 'py', name: 'Python' });
        await this.addEvent(tdoc._id, 'languages', { id: 'kotlin', name: 'Kotlin' });
        await this.addEvent(tdoc._id, 'languages', { id: 'kt', name: 'Kotlin' });
        await this.addEvent(tdoc._id, 'languages', { id: 'rust', name: 'Rust' });
        await this.addEvent(tdoc._id, 'languages', { id: 'go', name: 'Go' });

        // problems
        const pdict = await ProblemModel.getList(tdoc.domainId, tdoc.pids, true, false, ProblemModel.PROJECTION_CONTEST_DETAIL, true);
        for (const [index, pid] of tdoc.pids.entries()) {
            const problem = await this.adapter.toProblem(tdoc, pdict, index, pid);
            await this.addEvent(tdoc._id, 'problems', problem);
        }

        // groups
        await this.addEvent(tdoc._id, 'groups', { id: 'participants', name: '正式队伍' });
        await this.addEvent(tdoc._id, 'groups', { id: 'observers', name: '打星队伍' });

        // organizations
        const tudocs = await ContestModel.getMultiStatus(tdoc.domainId, { docId: tdoc._id }).toArray();
        const udict = await UserModel.getList(tdoc.domainId, tudocs.map((i) => i.uid));
        const orgMap: Record<string, { id: string, name: string, formal_name: string }> = {};
        for (const i of tudocs) {
            const udoc = udict[i.uid];
            const orgId = crypto.createHash('md5').update(udoc.school || udoc.uname).digest('hex');
            orgMap[orgId] ||= this.adapter.toOrganization(orgId, udoc);
        }
        for (const org of Object.values(orgMap)) {
            await this.addEvent(tdoc._id, 'organizations', org);
        }

        // teams
        const teams = tudocs.map((i) => {
            const udoc = udict[i.uid];
            return this.adapter.toTeam(udoc, i.unrank);
        });
        for (const team of teams) {
            await this.addEvent(tdoc._id, 'teams', team);
        }

        // judgement-types
        const judgementTypes = Object.keys(STATUS_SHORT_TEXTS);
        for (const i of judgementTypes) {
            await this.addEvent(tdoc._id, 'judgement-types', {
                id: STATUS_SHORT_TEXTS[i],
                name: STATUS_TEXTS[i],
                penalty: ![STATUS.STATUS_ACCEPTED, STATUS.STATUS_COMPILE_ERROR, STATUS.STATUS_SYSTEM_ERROR].includes(+i),
                solved: +i === STATUS.STATUS_ACCEPTED,
            });
        }

        // submissions & judgements
        const records = await RecordModel.getMulti(tdoc.domainId, { contest: tdoc._id }).sort({ _id: 1 }).toArray();
        for (const rdoc of records) {
            await this.addEvent(tdoc._id, 'submissions', this.adapter.toSubmission(tdoc, rdoc));
            await this.addEvent(tdoc._id, 'judgements', this.adapter.toJudgement(tdoc, rdoc));
            for (const testCase of rdoc.testCases) {
                await this.addEvent(tdoc._id, 'runs', this.adapter.toRun(tdoc, rdoc, testCase));
            }
        }
    }

    async initializeContest(tdoc: Tdoc) {
        const isInitialized = await this.isContestInitialized(tdoc);
        const hasProblems = tdoc.pids && tdoc.pids.length > 0;
        const hasParticipants = await ContestModel.countStatus(tdoc.domainId, { docId: tdoc._id }) > 0;
        if (isInitialized) {
            throw new ForbiddenError('CCS Contest already initialized.');
        }
        if (!hasProblems) {
            throw new ForbiddenError('Contest has no problems.');
        }
        if (!hasParticipants) {
            throw new ForbiddenError('Contest has no participants.');
        }
        await this.contestCollection.insertOne({ _id: new ObjectId(), domainId: tdoc.domainId, tid: tdoc._id });
        await this.initializeEvent(tdoc);
    }
}
