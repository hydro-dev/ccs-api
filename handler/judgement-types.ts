import { ObjectId, param, STATUS, STATUS_SHORT_TEXTS, STATUS_TEXTS, Types } from 'hydrooj';
import { BaseHandler } from './base';

export class JudgementTypesHandler extends BaseHandler {
    @param('contestId', Types.ObjectId)
    @param('id', Types.String, true)
    async get(domainId: string, contestId: ObjectId, id: string) {
        if (id) {
            const statusKey = Object.keys(STATUS_SHORT_TEXTS).find((key) => STATUS_SHORT_TEXTS[key] === id);
            if (!statusKey) {
                this.response.status = 404;
                this.response.body = { message: 'Judgement type not found' };
                return;
            }
            const key = statusKey;
            this.response.body = {
                id: STATUS_SHORT_TEXTS[key],
                name: STATUS_TEXTS[key],
                penalty: ![STATUS.STATUS_ACCEPTED, STATUS.STATUS_COMPILE_ERROR, STATUS.STATUS_SYSTEM_ERROR].includes(+key),
                solved: +key === STATUS.STATUS_ACCEPTED,
            };
        } else {
            this.response.body = [
                ...Object.keys(STATUS_SHORT_TEXTS).map((i) => {
                    return {
                        id: STATUS_SHORT_TEXTS[i],
                        name: STATUS_TEXTS[i],
                        penalty: ![STATUS.STATUS_ACCEPTED, STATUS.STATUS_COMPILE_ERROR, STATUS.STATUS_SYSTEM_ERROR].includes(+i),
                        solved: +i === STATUS.STATUS_ACCEPTED,
                    };
                }),
            ];
        }
    }
}
