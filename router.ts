import { tokensToRegexp, parse, Key } from 'path-to-regexp';
import { getContext } from 'only-jsx/jsx-runtime';

export interface Params {
    [key: string]: string;
}

export interface PathMatch {
    match?: RegExpExecArray | null;
    params?: Params;
    nextPath?: string;
}

export interface RouterContext {
    path?: string;
    params?: Params;
    matches?: PathMatch[];
    error?: Error;
    firstChild?: Node;
    match?: (p: string, u?: string, s?: string, h?: string) => PathMatch;
    navigate?: (p: string, d?: any, r?: boolean) => void;
    changeEvent?: string;
    getCurrentPath?: () => string;
    update?: () => void;
    onunload?: () => void;
}

export interface Context {
    router: RouterContext;
}

type RouteFunc = (ctx: Context) => HTMLElement | DocumentFragment | Comment | null | undefined;
export type RouteChild = HTMLElement | DocumentFragment | Comment | RouteFunc | null | undefined;

export interface RouterProps {
    children?: RouteChild | RouteChild[];
    onupdated?: () => void;
    onnavigate?: () => void;
    update?: () => void;
}

function match(path: string): PathMatch {
    const keys: Key[] = [];
    const tokens = parse(path);
    const pattern = tokensToRegexp(tokens, keys);

    const { pathname } = window.location;
    const match = pattern.exec(pathname);
    if (!match) {
        return {};
    }

    const params: Params = {};
    for (let i = 1; i < match.length; i++) {
        params[keys[i - 1]['name']] = match[i];
    }

    let nextPath = '';
    if (typeof tokens[0] === 'string') {
        nextPath = (tokens[1] as Key)?.prefix ? tokens[0] + (tokens[1] as Key).prefix : tokens[0];
    } else {
        nextPath = tokens[0].prefix || '';
    }

    return { match, params, nextPath };
}

const changeEvent = 'popstate';

function getCurrentPath() {
    return window.location.pathname;
}

function createFragment(children: RouteChild | RouteChild[], ctx: Context): DocumentFragment | null {
    if (Array.isArray(children)) {
        const fragment = document.createDocumentFragment();
        const fc = children.map((c: RouteChild) => createFragment(c, ctx));
        fragment.replaceChildren(...fc.filter(c => !!c));
        return fragment;
    } else if (typeof children === 'function') {
        return createFragment(children(ctx), ctx);
    } else if (children instanceof DocumentFragment){
        return children;
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
        throw new Error('Router requires context');
    }

    if (!ctx.router) {
        ctx.router = {};
    }

    const { router } = ctx as Context;

    router.path = '';

    if (!router.match) {
        router.match = match;
    }

    if (!router.changeEvent) {
        router.changeEvent = changeEvent;
    }

    if (!router.getCurrentPath) {
        router.getCurrentPath = getCurrentPath;
    }

    function update() {
        router.path = '';
        const parent = router.firstChild.parentNode;
        parent.replaceChildren();
        const c = createRouterFragment(children, ctx);
        const firstChild = c.firstChild;
        parent.replaceChildren(c);
        router.firstChild = firstChild;
        onupdated?.();
    }

    if (!router.update) {
        router.update = update;
    }

    function navigate(path: string, data: any, replace: boolean) {
        onnavigate?.();
        if (replace) {
            history.replaceState(data, '', path);
        } else {
            history.pushState(data, '', path);
        }
        router.update();
    }

    if (!router.navigate) {
        router.navigate = navigate;
    }

    window.addEventListener(router.changeEvent, router.update);

    router.onunload = () => {
        window.removeEventListener(router.changeEvent, router.update);
    }

    const fragment = createRouterFragment(children, ctx);

    router.firstChild = fragment.firstChild;

    return fragment;
}