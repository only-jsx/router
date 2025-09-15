# only-jsx-router
Declarative browser routing for only-jsx runtime.

Routing rules are declared using Router and Route components.

### Router
**Router** is a root component that declares a route dependent part of an application.

*Router* props:
- onbeforeupdate - method called by default implementation of *update* function before DOM updates;
- onupdated - method called by default implementation of *update* function after DOM updated;

*Router* component requires context to be set using setContext method of only-jsx library.
*Router* enriches context with *router* object that contains following properties:
path - base path for child *Routes*
params - template parameters of parent route
matches - array of matches of all Routes on current routing level
error - error that occurred on current routing level
childNodes - array of child nodes rendered by the Router
match - method that matches current path with path argument and returns the result with matched params;
navigate - method for navigation between routers;
onunload - method that should be called by parent component to release Router resources (remove event listeners)
changeEvent - name of an event that may change the current path. Router listens for this event and updates content when the event is fired;
getCurrentPath - method for retrieving the current path;
update - method that renders Router children;

Default implementation relies on the browser History API for the frontend routing, so 
default implementation of *navigate* is *window.history.pushState* or *window.history.replaceState*,
*changeEvent* is  *popstate*, and *getCurrentPath* returns *window.location.pathname*.

Default implementation of the *match* function uses the *pathToRegexp* function from the *path-to-regexp* library https://github.com/pillarjs/path-to-regexp. All rules for the *path* argument of *pathToRegexp* function work for the *path* prop value of a child *Route* component.

*Match* is usually used by child *Route* components. *Navigate* is used by children to trigger transitions between routes.

### Route
**Route** is a child component of the *Router* that controls rendering of its children depending on the current router path.

*Route* props:
- path - path which Route renders children for;
- error - component that is rendered in case of any errors in route children;

If Route's paths are overlapped then both are rendered.

*Route* modifies *router* object from the context and provides updated properties path, params, matches and error
to children.

The default browser history routing strategy can be replaced with custom routing strategy (hash, memory, etc.) via *Router* component props: *match*, *navigate*, *changeEvent*, *getCurrentPath*.

**It does not provide server side routing.** You can use the routing provided by your back-end API for this.

## Examples
Our examples also demonstrate how to implement URL hash routing.

### Simple
```tsx
const App = () => <Router>
    <Route path="/*wildcard">
        <Route path="path1">{child1}</Route>
        {/* "path2/:param" and "path2/(.*)" are overlapped, both are rendered */}
        {/* this component has params.param === ...rest of path... */}
        <Route path="path2/:param">{child21}</Route>
        {/* this component has params[0] === ...rest of path... */}
        <Route path="path2/*child">{child22}</Route>
        <Route path="path3/*child">{child3}</Route>
        {/* this is a fallback route */}
        <Route>{fallback}</Route>
    </Route>
</Router>;
```
### More complicated
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
        {/* Regular expressions in path with wildcard */}
        <Route path="/router/*wildcard">
            <Layout />
            {/* Part of a parent route path before any named parameter or wildcard */}
            {/* becames a prefix for a child route */}
            {/* so this actually matches to /router/home */}
            <Route path="home">
                <RoutedSpan>RoutedSpan</RoutedSpan>
                <LinkButton>LinkButton</LinkButton>
                <Link to="/hello/world">Link</Link>
            </Route>
            <Route path="await{/:optional}/status"><AwaitPage/></Route>
            <Route path="long-load"><LongLoad/></Route>
            <Route path="todos" error={ErrorBoundary}>
                <TodosList/>
            </Route>
            <Route path="todos/*todo" error={ErrorBoundary}>
                <h5>Todo</h5>
                {/* Named parameters */}
                <Route path=":id"><Todo/></Route>
            </Route>
            <Route path="error" error={ErrorBoundary}><ErrorComponent/></Route>
            {/* Route without a path is a fallback route */}
            <Route><Fallback /></Route>
        </Route>
    </Router>;

    props.onunload = ()=>{
        state.onunload?.();
        state.onunload = undefined;
        ctx.router.onunload?.();
    };
    return r;
}

export default App;
```
