import { Context, RouteChild } from './router';

export interface RouteProps {
    children?: RouteChild | RouteChild[];
    path?: string;
    error?: (ctx: Context) => RouteChild | RouteChild[];
}

function routeChildren(children: RouteChild | RouteChild[], ctx: Context): RouteChild | RouteChild[] {
    if (typeof children === 'function') {
        return routeChildren(children(ctx), ctx);
    } else if (Array.isArray(children)) {
        return children.map(c => routeChildren(c, ctx) as RouteChild)
    }
    return children;
}

export default function Route({ children, path, error }: RouteProps, ctx: Context) {
    if (!ctx?.router) {
        throw new Error('Routes are not allowed outside the Router component');
    }

    let routeParams = {};
    let routePath = (ctx.router.path || '') + (path || '');

    if (path) {
        const { match, params, nextPath } = ctx.router.match(routePath);

        if (!match) {
            return null;
        }

        routeParams = params;
        routePath = nextPath;

        if (!ctx.router.matches) {
            ctx.router.matches = [];
        }

        ctx.router.matches.push({ match, params, nextPath });
    } else {
        if (ctx.router.matches?.length || ctx.router.error) {
            return null;
        }
    }

    const routeCtx: Context = { ...ctx, router: { ...ctx.router, path: routePath, params: routeParams, matches: [] } };

    try {
        return routeChildren(children, routeCtx);
    } catch (e) {
        routeCtx.router.error = e;
        return error?.(routeCtx);
    }
}
