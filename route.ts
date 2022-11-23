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
        return 'Routes are not allowed outside the Router component';
    }

    if (ctx.router.params && Object.keys(ctx.router.params).length > 1) {
        return 'Parameters are not allowed in parent routes';
    }

    let routeParams = {};
    let routePath = ctx.router.path + (path || '');

    if (path) {
        const { match, params } = ctx.router.match(routePath, window.location.pathname);

        if (!match) {
            return null;
        }

        routeParams = params;

        if (!ctx.router.matches) {
            ctx.router.matches = [];
        }

        ctx.router.matches.push({ match, params });

        if (match.length > 1) {
            routePath = match[0].substring(0, match[0].length - match[1].length);
        }
    } else {
        if (ctx.router.matches?.length) {
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
