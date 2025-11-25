import { ObjectId, param, Types } from 'hydrooj';
import { BaseHandler } from './base';

export class LanguagesHandler extends BaseHandler {
    @param('contestId', Types.ObjectId)
    @param('id', Types.String, true)
    async get(domainId: string, contestId: ObjectId, id: string) {
        const languagesMap: Record<string, string> = {
            c: 'C',
            cpp: 'C++',
            cc: 'C++',
            java: 'Java',
            python: 'Python',
            py: 'Python',
            kotlin: 'Kotlin',
            kt: 'Kotlin',
            rust: 'Rust',
            go: 'Go',
        };
        if (id) {
            const langName = languagesMap[id];
            if (!langName) {
                this.response.status = 404;
                this.response.body = { message: 'Language not found' };
                return;
            }
            this.response.body = { id, name: langName };
        } else {
            this.response.body = Object.entries(languagesMap).map(([key, value]) => ({ id: key, name: value }));
        }
    }
}
