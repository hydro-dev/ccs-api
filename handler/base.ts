import {
    ConnectionHandler, ContestModel, Context, ForbiddenError,
    Handler, HandlerCommon, NotFoundError, ObjectId, param, PRIV, Types,
} from 'hydrooj';

export class CCSOperationHandler extends Handler {
    async prepare() {
        this.checkPriv(PRIV.PRIV_EDIT_SYSTEM);
    }

    @param('contestId', Types.ObjectId)
    @param('operation', Types.String)
    async post(domainId: string, contestId: ObjectId, operation: string) {
        const tdoc = await ContestModel.get(domainId, contestId);
        if (!tdoc) throw new NotFoundError('Contest not found');
        if (operation === 'init') {
            await this.ctx.ccs.initializeContest(tdoc);
            this.response.status = 200;
            this.response.body = { message: '比赛数据初始化成功！' };
        } else if (operation === 'reset') {
            await this.ctx.ccs.resetContest(tdoc);
            this.response.status = 200;
            this.response.body = { message: '比赛数据重置成功！' };
        }
    }
}

export class ApiInfoHandler extends Handler {
    async get() {
        this.response.body = {
            version: '2023-06',
            version_url: 'https://ccs-specs.icpc.io/2023-06/contest_api',
            name: 'HydroOJ CCS API',
            provider: {
                name: 'HydroOJ CCS Plugin',
                version: '1.0.7',
            },
        };
    }
}

function CCSMixin<TBase extends new (...args: any[]) => HandlerCommon<Context>>(Base: TBase) {
    return class CCSBase extends Base {
        noCheckPermView = true;
        public eventManager = this.ctx.ccs;
        public adapter = this.ctx.ccs.adapter;

        public checkAuth() {
            const usernamePlain = this.ctx.setting.get('@frexdeveloper/hydrooj-plugin-ccs.username') as string;
            const passwordPlain = this.ctx.setting.get('@frexdeveloper/hydrooj-plugin-ccs.password') as string;
            const credential = Buffer.from(`${usernamePlain}:${passwordPlain}`).toString('base64');
            const authHeader = this.request.headers.authorization || '';
            const authQuery = decodeURIComponent(this.args.auth || '');
            if (authHeader && authHeader.startsWith('Basic')) {
                const base64Credential = authHeader.slice('Basic'.length).trim();
                if (base64Credential === credential) {
                    return true;
                }
            } else if (authQuery) {
                if (authQuery === credential) {
                    return true;
                }
            }
            return false;
        }

        async _prepare({ domainId, contestId }: { domainId: string, contestId: ObjectId }) {
            if (!this.checkAuth()) throw new ForbiddenError('Unauthorized');
            if (contestId) {
                const tdoc = await ContestModel.get(domainId, new ObjectId(contestId));
                if (!tdoc) throw new NotFoundError('Contest not found');
                if (!(await this.ctx.ccs.isContestInitialized(tdoc))) {
                    throw new ForbiddenError('Contest not be initialized');
                }
            }
        }
    };
}

export const BaseHandler = CCSMixin(Handler);
export const ConnectionBaseHandler = CCSMixin(ConnectionHandler);
