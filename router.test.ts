import { describe, expect, test } from '@jest/globals';
import Router, { Context } from './router';
import { setContext } from 'only-jsx/jsx-runtime';

describe('Test Router component', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('empty', () => {
        const r = Router({});
        expect(r).toBeNull();
    });

    test('without context', () => {
        const ctx = undefined as unknown as Context;
        setContext(Router, ctx);
        const children = ()=>null;
        expect(() => Router({ children })).toThrowError('Router requires context');
    });

    test('without router in context and without children', () => {
        const ctx: Context = { } as unknown as Context;
        setContext(Router, ctx);
        const children = ()=>null;
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

    test('with child', () => {
        const ctx: Context = { router: {} };
        setContext(Router, ctx);
        const element = document.createElement('div');
        const children = ()=>{
            const fragment = document.createDocumentFragment();
            fragment.replaceChildren(element);
            return fragment;
        }
        const r = Router({ children });

        expect(r instanceof DocumentFragment).toBeTruthy();
        expect(r?.firstChild).toBe(element);
        expect(r?.lastChild).toBe(element);
    });

    test('with children', () => {
        const ctx: Context = { router: {} };
        setContext(Router, ctx);
        const element1 = document.createElement('div');
        const element2 = document.createElement('div');
        const r = Router({ children: [element1, element2] });

        expect(r instanceof DocumentFragment).toBeTruthy();
        expect(r?.firstChild).toBe(element1);
        expect(r?.lastChild).toBe(element2);

        const r2 = Router({ children: [element1, undefined, null] });
        expect(r2 instanceof DocumentFragment).toBeTruthy();
        expect(r2?.firstChild).toStrictEqual(element1);
        expect(r2?.lastChild).toBe(r2?.firstChild);
    });

    test('with match and navigate props', () => {
        const match = (path: string, url: string) => ({});
        const navigate = jest.fn((p) => { });
        const update = jest.fn(() => { });
        const element1 = document.createElement('div');
        const element2 = document.createElement('div');

        const ctx: Context = { router: { match, navigate, update } };
        setContext(Router, ctx);

        const r = Router({ children: [element1, element2] });

        expect(r instanceof DocumentFragment).toBeTruthy();
        expect(r?.firstChild).toBe(element1);
        expect(r?.lastChild).toBe(element2);

        const prev = window.location.pathname;
        expect(prev).not.toBe('/path');
        ctx.router.navigate?.('/path');
        expect(navigate).toHaveBeenCalled();
        expect(update).not.toHaveBeenCalled();
        expect(window.location.pathname).toBe(prev);
    });

    test('default match', () => {
        const ctx: Context = { router: {} };
        setContext(Router, ctx);

        const element1 = document.createElement('div');
        const element2 = document.createElement('div');
        const r = Router({ children: [element1, element2] });

        expect(r instanceof DocumentFragment).toBeTruthy();
        expect(r?.firstChild).toBe(element1);
        expect(r?.lastChild).toBe(element2);

        const m1 = ctx.router.match?.('/path', '/test');
        expect(m1).toStrictEqual({});

        const m2 = ctx.router.match?.('/path/:id', '/path/1');
        const result2 = ['/path/1', '1'] as any;
        result2.groups = undefined;
        result2.index = 0;
        result2.input = '/path/1';
        expect(m2).toMatchObject({ match: result2, params: { id: '1' }, nextPath: '/path/' });

        const m3 = ctx.router.match?.('/:child', '/child/');
        const result3 = ['/child/', 'child'] as any;
        result3.groups = undefined;
        result3.index = 0;
        result3.input = '/child/';
        expect(m3).toMatchObject({ match: result3, params: { child: 'child' }, nextPath: '/' });

        const m4 = ctx.router.match?.(':child', 'child');
        const result4 = ['child', 'child'] as any;
        result4.groups = undefined;
        result4.index = 0;
        result4.input = 'child';
        expect(m4).toMatchObject({ match: result4, params: { child: 'child' }, nextPath: '' });
    });

    test('default navigate with context update', () => {
        const update = jest.fn(() => { });
        const ctx: Context = { router: { update } };
        setContext(Router, ctx);

        const element = document.createElement('div');
        const r = Router({ children: element });

        expect(r instanceof DocumentFragment).toBeTruthy();
        expect(r?.firstChild).toBe(element);
        expect(r?.lastChild).toBe(element);

        const prev = window.location.pathname;
        expect(prev).not.toBe('/path');
        ctx.router.navigate?.('/path');
        //expect(history.length).toBe(1);
        expect(update).toHaveBeenCalled();
        expect(window.location.pathname).toBe('/path');

        const data1 = {};
        ctx.router.navigate?.('/path', data1, true);
        //expect(history.length).toBe(2);

        const data2 = {};
        ctx.router.navigate?.('/path', data2, false);
        expect(history.state).toBe(data2);
        //expect(history.length).toBe(3);

        expect(window.location.pathname).toBe('/path');
    });

    test('with props onupdated and onnavigate', () => {
        const onupdated = jest.fn(() => { });
        const onnavigate = jest.fn(() => { });

        const ctx: Context = { router: {} };
        setContext(Router, ctx);

        const element = document.createElement('div');
        const r = Router({ children: element, onupdated, onnavigate });

        expect(r instanceof DocumentFragment).toBeTruthy();
        expect(r?.firstChild).toBe(element);
        expect(r?.lastChild).toBe(element);

        const data = {};
        ctx.router.navigate?.('/path', data, false);
        expect(onnavigate).toHaveBeenCalled();
        expect(onupdated).toHaveBeenCalled();

        window.dispatchEvent(new Event('popstate'));

        ctx.router.onunload?.();

        expect(onupdated.mock.calls.length).toBe(2);
    });
});