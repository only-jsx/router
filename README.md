# only-jsx-router
Declarative browser routing for only-jsx runtime

## examples

The source codes are in the repository https://github.com/only-jsx/examples/tree/main/router.

```tsx
//index.tsx
import { Router, Route } from 'only-jsx-router';

//Router uses Context
import { setContext } from 'only-jsx/jsx-runtime';

export interface AppProps {
    onunload?: () => void;
}

const App = ({ props }: { props: AppProps }): DocumentFragment => {
    const ctx: any = {};
    setContext(Router, ctx);

    const state: UnloadState = {};

    let r = <Router>
        {/*Regular expressions in path*/}
        <Route path="/router/(.*)">
            <Layout />
            {/*Part of a parent route path before any named parameter or regexp*/}
            {/*becames a prefix for a child route*/}
            {/*so this actually matches to /router/home*/}
            <Route path="home"><Home /></Route>
            <Route path="await"><AwaitPage state={state}/></Route>
            <Route path="long-load"><LongLoad state={state}/></Route>
            <Route path="todos" error={ErrorBoundary}>
                <TodosList state={state}/>
            </Route>
            <Route path="todos/(.*)" error={ErrorBoundary}>
                <h5>Todo</h5>
                {/*Named parameters*/}
                <Route path=":id"><Todo state={state}/></Route>
            </Route>
            <Route path="error" error={ErrorBoundary}><ErrorComponent/></Route>
            {/*Route without a path is a fallback route*/}
            <Route><Fallback /></Route>
        </Route>
    </Router>

    ctx.router.onnavigate = ()=>{
        state.onunload?.();
        state.onunload = undefined;
    }

    props.onunload = ()=>{
        ctx.router.onnavigate();
        ctx.router.onunload?.();
    };
    return r;
}

export default App;
```
