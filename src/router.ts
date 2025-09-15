import { pathToRegexp, parse } from 'path-to-regexp';
import { getContext } from 'only-jsx/jsx-runtime';
import type { Options, JsxNode } from 'only-jsx/jsx-runtime';

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
    error?: unknown;
    childNodes?: ChildNode[];
    match?: (p: string, u?: string, s?: string, h?: string) => PathMatch;
    navigate?: (p: string, d?: any, r?: boolean) => void;
    onunload?: () => void;
    changeEvent?: string;
    getCurrentPath?: () => string;
    update?: () => void;
}

export interface Context {
    router: RouterContext;
}

type RouteFunc = (ctx: Context) => JsxNode;

export type RouteChild = RouteFunc | JsxNode;

export interface RouterProps {
    onupdated?: () => void;
    onbeforeupdate?: () => void;
}

interface RouterChildren {
    children?: RouteChild | RouteChild[];
}

const defChangeEvent = 'popstate';

function defGetCurrentPath() {
    return window.location.pathname;
}

function defMatch(path: string): PathMatch {
    const { tokens } = parse(path);
    const { regexp, keys } = pathToRegexp(path);

    const pathname = defGetCurrentPath();

    const match = regexp.exec(pathname);

    if (!match) {
        return {};
    }

    const params: Params = {};

    for (let i = 0; i < keys.length; i++) {
        if (keys[i].type === 'param' && match[i + 1]) {
            params[keys[i].name] = match[i + 1];
        }
    }

    const nextPath = tokens[0].type === 'text' ? tokens[0].value : '';

    return { match, params, nextPath };
}

function createFragment(children: RouteChild | RouteChild[], ctx: Context): DocumentFragment | null {
    if (Array.isArray(children)) {
        const fragment = document.createDocumentFragment();
        const fc = children.map((c: RouteChild | RouteChild[]) => createFragment(c, ctx));
        fragment.append(...(fc.filter(c => !!c) as DocumentFragment[]));
        return fragment;
    } else if (typeof children === 'function') {
        return createFragment(children(ctx), ctx);
    } else if (children instanceof DocumentFragment) {
        return children;
    } else if (children != null) {
        const fragment = document.createDocumentFragment();
        if (children instanceof Node) {
            fragment.append(children);
        } else {
            fragment.append('' + children);
        }
        return fragment;
    }

    return null;
}

function createRouterFragment(children: RouteChild | RouteChild[], ctx: Context) {
    let fragment = createFragment(children, ctx);
    if (!fragment) {
        fragment = document.createDocumentFragment();
    }

    if (!fragment.childNodes.length) {
        fragment.replaceChildren(document.createComment('Router placeholder'));
    }

    return fragment;
}

export default function Router(props: RouterProps | RouterChildren | Options, ctx?: Context) {
    const context = ctx || getContext()?.ctx;

    if (!context) {
        throw new Error('Router requires context');
    }

    if (!(props instanceof Object)) {
        return null;
    }

    const { children } = props as RouterChildren;

    let { onupdated, onbeforeupdate } = props as RouterProps;

    if (!children) {
        return null;
    }

    if (!context.router) {
        context.router = {};
    }

    const { router } = context as Context;

    router.path = '';

    if (!router.match) {
        router.match = defMatch;
    }

    if (!router.getCurrentPath) {
        router.getCurrentPath = defGetCurrentPath;
    }

    const prevPath = { value: '' };

    function defUpdate() {

        if (!router.childNodes?.length || !router.childNodes[0].parentNode) {
            //In this case there is no way to find a parent node where insert new elements to
            //Healthy Router always has at least a comment 'Router placeholder'
            return;
        }

        const currentPath = router.getCurrentPath?.();

        if (currentPath === undefined || currentPath === prevPath.value) {
            return;
        }

        onbeforeupdate?.();

        router.path = '';

        const parent = router.childNodes[0].parentNode;

        const rf = createRouterFragment(children, context);

        const newChildren: ChildNode[] = Array.from(rf.childNodes);

        parent.insertBefore(rf, router.childNodes[0]);

        router.childNodes.forEach((c: any) => c.remove());

        router.childNodes = newChildren;

        prevPath.value = currentPath;

        onupdated?.();
    }

    if (!router.update) {
        router.update = defUpdate;
    }

    function defNavigate(path: string, data: any, replace?: boolean) {
        if (replace) {
            history.replaceState(data, '', path);
        } else {
            history.pushState(data, '', path);
        }
        router.update?.();
    }

    if (!router.navigate) {
        router.navigate = defNavigate;
    }

    if (!router.changeEvent) {
        router.changeEvent = defChangeEvent;
    }

    const eventHandler = () => router.update?.();
    
    window.addEventListener(router.changeEvent, eventHandler);

    router.onunload = () => {
        window.removeEventListener(router.changeEvent!, eventHandler);
    }

    const fragment = createRouterFragment(children, context);

    router.childNodes = Array.from(fragment.childNodes);

    return fragment;
}