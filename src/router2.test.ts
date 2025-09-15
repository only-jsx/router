jest.mock('only-jsx/jsx-runtime');

import { describe, expect, test } from '@jest/globals';
import Router, { type Context } from './router';

import { getContext } from 'only-jsx/jsx-runtime';

const { setContext } = jest.requireActual('only-jsx/jsx-runtime');

describe('Test Router with wrong only-jsx module', () => {
    test('with child', () => {
        (getContext as jest.Mock).mockReturnValue(undefined);

        const ctx: Context = { router: {} };
        setContext(Router, ctx);
        const children = () => null;
        expect(() => Router({ children })).toThrow('Router requires context');
    });
});