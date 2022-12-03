import { describe, expect, test } from '@jest/globals';
import { setContext } from 'only-jsx/jsx-runtime';
import Route from './route';
import Router, { Context, Params } from './router';

describe('Test Route component', () => {
    const routerCtx: Context = { router: {} };
    setContext(Router, routerCtx);
    Router({ children: document.createComment('Router')});

    const navigate = routerCtx.router.navigate;
    const match = routerCtx.router.match;

    test('without Router', () => {
        const element = document.createElement('div');
        expect(() => Route({ children: element }, {} as Context)).toThrowError('Routes are not allowed outside the Router component');

        expect(() => Route({ children: element }, undefined as unknown as Context)).toThrowError('Routes are not allowed outside the Router component');
    });

    test('without children', () => {
        const ctx: Context = { router: {} };
        const r = Route({}, ctx);
        expect(r).toBe(undefined);
    });

    test('empty', () => {
        const ctx: Context = { router: {} };
        const element1 = document.createElement('div');
        const element2 = document.createElement('div');
        const children = [element1, element2];
        const r = Route({ children }, ctx);
        expect(r).toStrictEqual(children);
    });

    test('empty route with matches', () => {
        const ctx: Context = { router: { matches: [{ match: null, params: {} }] } };
        const element1 = document.createElement('div');
        const element2 = document.createElement('div');
        const r = Route({ children: [element1, element2] }, ctx);
        expect(r).toBeNull();
    });

    test('empty route with error', () => {
        const ctx: Context = { router: { error: new Error('Test error') } };
        const element1 = document.createElement('div');
        const element2 = document.createElement('div');
        const r = Route({ children: [element1, element2] }, ctx);
        expect(r).toBeNull();
    });

    const testParentParameters = (name: string, params?: Params) =>
        test(name, () => {
            const ctx: Context = { router: { params } };
            const element = document.createElement('div');
            const children = [element];
            const r = Route({ children }, ctx);
            expect(r).toStrictEqual(children);
        });

    testParentParameters('without parent parameters');
    testParentParameters('empty parent parameters', {});
    testParentParameters('one parent parameter', { '0': '1' });
    testParentParameters('many parent parameters', { id: '1', userId: '2', 0: '1', 1: '2' });

    test('correct path', () => {
        navigate?.('/parent/child');

        const ctx: Context = { router: { path: '/parent', match, navigate } };
        const element = document.createElement('div');
        const children = [element];
        const r = Route({ children, path: '/child' }, ctx);
        expect(r).toStrictEqual(children);
    });

    test('wrong parent path', () => {
        navigate?.('/parent/child');
        const ctx: Context = { router: { path: '/wrong', match, navigate } };
        const element = document.createElement('div');
        const r = Route({ children: [element], path: '/child' }, ctx);
        expect(r).toBeNull();
    });

    test('wrong child path', () => {
        navigate?.('/parent/child');
        const ctx: Context = { router: { path: '/parent', match, navigate } };
        const element = document.createElement('div');
        const r = Route({ children: [element], path: '/wrong' }, ctx);
        expect(r).toBeNull();
    });

    test('with error', () => {
        navigate?.('/parent/child');
        const ctx: Context = { router: { path: '/parent', match, navigate } };
        const element = () => {
            throw Error('Error');
            return document.createElement('div');
        }
        const errElement = document.createComment('error');
        const error = (ctx: Context) => errElement;
        const r = Route({ children: [element], path: '/child', error }, ctx);
        expect(r).toBe(errElement);

        const r2 = Route({ children: [element], path: '/child' }, ctx);
        expect(r2).toBe(undefined);
    });

    test('path', () => {
        const testPathHandle = (navigated: string, contextPath: string, path: string, nextPath: string, params: object) => {
            navigate?.(navigated);

            const ctx: Context = { router: { path: contextPath, match, navigate } };
            let childCtx: Context = { router: {} };
            const e = document.createElement('div');
            const element = (c: Context) => {
                childCtx = c;
                return e;
            }
            const children = [element];
            const r = Route({ children, path }, ctx);
            expect(r).toStrictEqual([e]);
            expect(childCtx.router.path).toBe(nextPath);
            expect(childCtx.router.params).toStrictEqual(params);
        };

        testPathHandle('/parent1/parent2/child/', '/par\\ent1/parent2/', ':child/', '/parent1/parent2/', { child: 'child' });
        testPathHandle('/child1/child2/index.html', '/child1/', 'child2/(in)(.*).html', '/child1/child2/', { 0: 'in', 1: 'dex' });
        testPathHandle('/child1/child2/index.html', '', '/child1/:c1/(inde)(.*).html', '/child1/', { c1: 'child2', '0': 'inde', '1': 'x' });
        testPathHandle('/child1/child2', '/child1/', '(child2)', '/child1/', { 0: 'child2' });
        testPathHandle('/child1/child2/', '/child1/', 'child2/', '/child1/child2/', {});
        testPathHandle('/child1/', '', '/:child1', '/', { child1: 'child1' });
    });
});