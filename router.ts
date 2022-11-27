import { pathToRegexp, Key } from 'path-to-regexp';
import { getContext } from 'only-jsx';

export interface Params {
    [key: string]: string;
}

export interface PathMatch {
    match?: RegExpExecArray | null;
    params?: Params;
}

export interface RouterContext {
    path: string;
    params?: Params;
    match?: (p: string, u: string) => PathMatch;
    matches?: PathMatch[];
    error?: Error;
    navigate?: (p: string, d?: any, r?: boolean) => void;
    onupdated?: () => void;
    onnavigate?: () => void;
}

export interface Context {
    router: RouterContext;
}

type RouteFunc = (ctx: Context) => HTMLElement | DocumentFragment | Comment;
export type RouteChild = HTMLElement | DocumentFragment | Comment | RouteFunc;

export interface RouterProps {
    children?: RouteChild | RouteChild[];
    onupdated?: () => void;
    onnavigate?: () => void;
}

function match(path: string, url: string): PathMatch {
    const keys: Key[] = [];
    const pattern = pathToRegexp(path, keys);
    const match = pattern.exec(url);
    if (!match) {
        return {};
    }

    const params: Params = {};
    for (let i = 1; i < match.length; i++) {
        params[keys[i - 1].name] = match[i];
    }
    return { match, params };
}

function createFragment(children: RouteChild | RouteChild[], ctx: Context): DocumentFragment | null {
    if (Array.isArray(children)) {
        const fragment = document.createDocumentFragment();
        const fc = children.map((c: RouteChild) => createFragment(c, ctx));
        fragment.replaceChildren(...fc.filter(c => !!c));
        return fragment;
    } else if (typeof children === 'function') {
        return createFragment(children(ctx), ctx);
    } else if (children) {
        const fragment = document.createDocumentFragment();
        fragment.replaceChildren(children);
        return fragment;
    }

    return null;
}

function createRouterFragment(children: RouteChild | RouteChild[], ctx: Context) {
    let fragment = createFragment(children, ctx);
    if (!fragment) {
        fragment = document.createDocumentFragment();
    }

    if (!fragment.firstChild) {
        fragment.replaceChildren(document.createComment('Router placeholder'));
    }

    return fragment;
}

export default function Router({ children, onupdated, onnavigate }: RouterProps) {
    if (!children) {
        return null;
    }

    const { ctx } = getContext() || {};
    if (!ctx) {
        return 'Router requires context';
    }

    if (!ctx.router) {
        ctx.router = {};
    }

    const { router } = ctx;

    router.path = '';

    if (!router.match) {
        router.match = match;
    }

    function update() {
        router.path = '';

        const c = createRouterFragment(children, ctx);
        const firstChild = c.firstChild;
        router.firstChild.parentNode.replaceChildren(c);
        router.firstChild = firstChild;
        router.onupdated?.();
    }

    function navigate(path: string, data: any, replace: boolean) {
        router.onnavigate?.();
        if (replace) {
            history.replaceState(data, '', path);
        } else {
            history.pushState(data, '', path);
        }
        update();
    }

    if (!router.navigate) {
        router.navigate = navigate;
    }

    window.addEventListener('popstate', update);

    router.onunload = () => {
        window.removeEventListener('popstate', update);
    }

    const fragment = createRouterFragment(children, ctx);

    router.firstChild = fragment.firstChild;

    return fragment;
}