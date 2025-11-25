import { ObjectId, param, Types } from 'hydrooj';
import { BaseHandler } from './base';

export class GroupsHandler extends BaseHandler {
    @param('contestId', Types.ObjectId)
    @param('id', Types.String, true)
    async get(domainId: string, contestId: ObjectId, id: string) {
        if (id) {
            if (id !== 'participants' && id !== 'observers') {
                this.response.status = 404;
                this.response.body = { message: 'Group not found' };
                return;
            }
            this.response.body = { id, name: id === 'participants' ? '正式队伍' : '打星队伍' };
        } else {
            this.response.body = [
                { id: 'participants', name: '正式队伍' },
                { id: 'observers', name: '打星队伍' },
            ];
        }
    }
}
