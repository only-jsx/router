import { describe, expect, test } from '@jest/globals';
import Router, { type Context } from './router';
import { type Options, setContext } from 'only-jsx/jsx-runtime';

describe('Test Router component', () => {
    const element = document.createElement('div');

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('empty', () => {
        const ctx: Context = { router: {} };
        const r = Router({}, ctx);
        expect(r).toBeNull();
    });

    test('without props', () => {
        const ctx: Context = { router: {} };
        const r = Router(undefined as unknown as Options, ctx);
        expect(r).toBeNull();
    });

    test('with primitive props', () => {
        const ctx: Context = { router: {} };
        const r = Router('test' as unknown as Options, ctx);
        expect(r).toBeNull();
    });

    test('with undefined children', () => {
        const ctx: Context = { router: {} };
        const children = () => undefined;
        const r = Router({ children }, ctx);
        expect(r instanceof DocumentFragment).toBeTruthy();
        expect(r?.firstChild instanceof Comment).toBeTruthy();
        expect(r?.firstChild?.textContent).toBe('Router placeholder');
        expect(r?.lastChild).toBe(r?.firstChild);
    });

    test('with primitive children', () => {
        const ctx: Context = { router: {} };
        const children = () => 'test';
        const r = Router({ children }, ctx);
        expect(r instanceof DocumentFragment).toBeTruthy();
        expect(r?.firstChild instanceof Text).toBeTruthy();
        expect(r?.firstChild?.textContent).toBe('test');
        expect(r?.lastChild).toBe(r?.firstChild);
    });

    test('without context', () => {
        const ctx = undefined as unknown as Context;
        setContext(Router, ctx);
        const children = () => null;
        expect(() => Router({ children })).toThrow('Router requires context');
    });

    test('without router in context and without children', () => {
        const ctx: Context = {} as unknown as Context;
        setContext(Router, ctx);
        const children = () => null;
        const onupdated = jest.fn(() => { });
        const r = Router({ children, onupdated });

        expect(r instanceof DocumentFragment).toBeTruthy();
        expect(r?.firstChild instanceof Comment).toBeTruthy();
        expect(r?.lastChild).toBe(r?.firstChild);
        expect(r?.firstChild?.textContent).toBe('Router placeholder');

        expect(onupdated).not.toHaveBeenCalled();

        ctx.router.navigate?.('/');

        expect(onupdated).toHaveBeenCalled();

        ctx.router.onunload?.();

        expect(onupdated.mock.calls.length).toBe(1);
    });

    test('without update and getCurrentPath', () => {
        const ctx: Context = {} as unknown as Context;
        setContext(Router, ctx);
        const children = () => null;
        const onupdated = jest.fn(() => { });
        const r = Router({ children, onupdated });

        expect(r instanceof DocumentFragment).toBeTruthy();
        expect(r?.firstChild instanceof Comment).toBeTruthy();
        expect(r?.lastChild).toBe(r?.firstChild);
        expect(r?.firstChild?.textContent).toBe('Router placeholder');

        expect(onupdated).not.toHaveBeenCalled();

        const prevGetCurrentPath = ctx.router.getCurrentPath;
        delete ctx.router.getCurrentPath;
        ctx.router.navigate?.('/1');

        expect(onupdated).not.toHaveBeenCalled();

        ctx.router.getCurrentPath = prevGetCurrentPath;

        const prevUpdate = ctx.router.update;
        delete ctx.router.update;

        ctx.router.navigate?.('/2');
        window.dispatchEvent(new Event('popstate'));

        expect(onupdated).not.toHaveBeenCalled();

        ctx.router.update = prevUpdate;

        ctx.router.navigate?.('/3');
        expect(onupdated).toHaveBeenCalled();

        ctx.router.onunload?.();

        expect(onupdated.mock.calls.length).toBe(1);
    });

    test('with child function', () => {
        const ctx: Context = { router: {} };
        const element = document.createElement('div');
        const children = () => {
            const fragment = document.createDocumentFragment();
            fragment.replaceChildren(element.cloneNode());
            return fragment;
        }
        const onupdated = jest.fn(() => { });
        const onbeforeupdate = jest.fn(() => { });
        const r = Router({ children, onupdated, onbeforeupdate }, ctx);

        expect(r instanceof DocumentFragment).toBeTruthy();
        expect(r?.firstChild).toStrictEqual(element);
        expect(r?.lastChild).toBe(r?.firstChild);

        ctx.router.getCurrentPath = () => '/path';
        window.dispatchEvent(new Event('popstate'));

        expect(onbeforeupdate).toHaveBeenCalled();
        expect(onupdated).toHaveBeenCalled();
        ctx.router.onunload?.();
    });

    test('with children', () => {
        const ctx: Context = { router: {} };
        setContext(Router, ctx);
        const children = [
            () => document.createElement('div'),
            () => document.createElement('div')
        ]

        const r = Router({ children });

        expect(r instanceof DocumentFragment).toBeTruthy();
        expect(r?.firstChild).toStrictEqual(element);
        expect(r?.lastChild).toStrictEqual(element);
        expect(r?.lastChild).not.toBe(r?.firstChild);

        ctx.router.onunload?.();

        const children2 = [() => document.createElement('div'), undefined, null];
        const r2 = Router({ children: children2 });

        expect(r2 instanceof DocumentFragment).toBeTruthy();
        expect(r2?.firstChild).toStrictEqual(element);
        expect(r2?.lastChild).toBe(r2?.firstChild);

        ctx.router.onunload?.();
    });

    test('with match, navigate, changeEvent and getCurrentPath props', () => {
        const match = (p: string, u?: string, s?: string, h?: string) => ({});
        const navigate = jest.fn((p) => { window.location.hash = p });
        const changeEvent = 'testchange';
        const getCurrentPath = () => window.location.hash;
        const update = jest.fn(() => { });
        const children = [
            () => document.createElement('div'),
            () => document.createElement('div')
        ]

        const ctx: Context = { router: { match, navigate, changeEvent, getCurrentPath, update } };
        const r = Router({ children }, ctx);

        expect(r instanceof DocumentFragment).toBeTruthy();
        expect(r?.firstChild).toStrictEqual(element);
        expect(r?.lastChild).toStrictEqual(element);
        expect(r?.lastChild).not.toBe(r?.firstChild);

        const prev = getCurrentPath();
        expect(prev).not.toBe('/path');
        ctx.router.navigate?.('/path');
        expect(navigate).toHaveBeenCalled();
        expect(update).not.toHaveBeenCalled();
        expect(getCurrentPath()).toBe('#/path');

        window.dispatchEvent(new Event(changeEvent));
        expect(update).toHaveBeenCalledTimes(1);

        ctx.router.onunload?.();
    });

    test('default match', () => {
        const ctx: Context = { router: {} };
        setContext(Router, ctx);
        const children = [
            () => document.createElement('div'),
            () => document.createElement('div')
        ]

        const r = Router({ children });

        expect(r instanceof DocumentFragment).toBeTruthy();
        expect(r?.firstChild).toStrictEqual(element);
        expect(r?.lastChild).toStrictEqual(element);
        expect(r?.lastChild).not.toBe(r?.firstChild);

        ctx.router.navigate?.('/wrong');
        const m1 = ctx.router.match?.('/path');
        expect(m1).toStrictEqual({});

        const testMatch = (navigated: string, path: string, mr: (string | undefined)[], params: object, nextPath: string) => {
            ctx.router.navigate?.(navigated);
            const m = ctx.router.match?.(path);
            const match = [...mr] as any;
            match.groups = undefined;
            match.index = 0;
            match.input = mr[0];
            expect(m).toMatchObject({ match, params, nextPath });
            expect(ctx.router.getCurrentPath?.()).toBe(navigated);
        }

        testMatch('/path/1', '/path/:id', ['/path/1', '1'], { id: '1' }, '/path/');
        testMatch('/path/1/2', '/path/1/:id', ['/path/1/2', '2'], { id: '2' }, '/path/1/');
        testMatch('/path/1/2', '/path{/1}/:id', ['/path/1/2', '2'], { id: '2' }, '/path');
        testMatch('/path/1/2/3/4', '/path/*wildcard/4', ['/path/1/2/3/4', '1/2/3'], {}, '/path/');
        testMatch('/path/2', '/path/{optional/}:id', ['/path/2', , '2'], { id: '2' }, '/path/');
        testMatch('/child/', '/:child', ['/child/', 'child'], { child: 'child' }, '/');
        testMatch('/child', '/:child', ['/child', 'child'], { child: 'child' }, '/');
        testMatch('/child', '*child', ['/child', '/child'], {}, '');

        ctx.router.onunload?.();
    });

    test('default navigate with context update', () => {
        const update = jest.fn(() => { });
        const ctx: Context = { router: { update } };
        setContext(Router, ctx);

        const children = () => document.createElement('div');
        const r = Router({ children });

        expect(r instanceof DocumentFragment).toBeTruthy();
        expect(r?.firstChild).toStrictEqual(element);
        expect(r?.lastChild).toBe(r?.firstChild);

        const prev = window.location.pathname;
        expect(prev).not.toBe('/path');
        ctx.router.navigate?.('/path');
        expect(update).toHaveBeenCalled();
        expect(window.location.pathname).toBe('/path');

        const data1 = {};
        ctx.router.navigate?.('/path', data1, true);

        const data2 = {};
        //test without update
        delete ctx.router.update;
        ctx.router.navigate?.('/path', data2, false);
        expect(history.state).toBe(data2);

        expect(window.location.pathname).toBe('/path');

        ctx.router.onunload?.();
    });

    test('with props onupdated', () => {
        const onupdated = jest.fn(() => { });

        const ctx: Context = { router: {} };
        const children = () => document.createElement('div');
        const r = Router({ children, onupdated }, ctx);

        expect(r instanceof DocumentFragment).toBeTruthy();
        expect(r?.firstChild).toStrictEqual(element);
        expect(r?.lastChild).toBe(r?.firstChild);

        const data = {};
        ctx.router.navigate?.('/path', data, false);
        expect(onupdated).toHaveBeenCalledTimes(1);

        ctx.router.getCurrentPath = () => '';
        window.dispatchEvent(new Event('popstate'));
        expect(onupdated.mock.calls.length).toBe(2);

        ctx.router.onunload?.();
    });

    test('with context without childNodes', () => {
        const onupdated = jest.fn(() => { });

        const ctx: Context = { router: {} };
        const children = () => document.createElement('div');
        const r = Router({ children }, ctx);

        expect(r instanceof DocumentFragment).toBeTruthy();
        expect(r?.firstChild).toStrictEqual(element);
        expect(r?.lastChild).toBe(r?.firstChild);

        ctx.router.getCurrentPath = () => '';
        delete ctx.router.childNodes;
        window.dispatchEvent(new Event('popstate'));
        expect(onupdated.mock.calls.length).toBe(0);
        ctx.router.onunload?.();
    });

    test('onunload removes listener', () => {
        const ctx: Context = { router: {} };
        const children = () => null;
        const r = Router({ children }, ctx);

        const spy = jest.spyOn(window, 'removeEventListener');
        ctx.router.onunload?.();
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });
});