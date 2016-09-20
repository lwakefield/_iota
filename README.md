<h1 align="center">ιota</h1>

https://circleci.com/gh/lwakefield/iota.png?circle-token=6b15855738e2ea84a71901e60d7062e233a893f4

<p align="center"><strong>ιota</strong> is a <i>super</i> small, <i>super</i> fast JavaScript framework.</p>
<p align="center">It is <i>truly</i> reactive, none of this <code>setState()</code> nonsense.</p>

---

# Get Started

Give it the ol' college `npm install`, then you can run `npm run dev` to spin up a dev server and have a play.
If you want to make a build, then `npm install`.

There are some VERY basic examples that will be shown when your run the dev server.

- dbmon is a demonstration of the repaint rate. Ie. make a change to the data
  in the Iota instance, see how long it takes to render that change. Then do 
  this again and again as fast as possible, to give an idea of the max FPS
  achievable.
- Simple components demonstration.
- Simple todo app demonstration.

# Why

Why not.

Well, to give a more "real" answer, for the fun of it.
I wanted to build a framework and see what is needed to add all the bells and whistles.
I learnt from a lot of other frameworks, like Preact and Vue (heavily inspired by vue, though operation is completely different).

I also found that a lot of frameworks seemed to over complicate the workings of the framework.
As a result, I really wanted to focus on the readability of the code, in such a way that you can have a qiuck read of 
the source and fully understand what is going on.

# The Magic

Iota passes the existing DOM into a Virtual DOM. Where there are dynamic components, like `i-if`/`i-for` or interpolations like `{{ user.name }}`, the vdom object will return a function instead of a JavaScript object. Our vdom object might look like this:

    {
        tagName: 'div',
        attrs: {},
        events: [],
        children: [
            function anonymous() {
                return messages.map(function(m) {
                    return {
                        tagName: 'div',
                        attrs: {},
                        events: [],
                        children: [function anonymous() {
                            return "message: " + m.text;
                        }]
                    };
                });
            }
        ]
    }
    
Because we don't know what data will be passed in from dynamic components/interpolations, our vdom will be referencing variables that do not exist in the scope of the vdom. Most frameworks solve this by parsing and compiling the expressions before hand, or more explicitly defining the data which will be passed in. We get around this with a magic function `exposeScope` which will receive a function and some data, and return a new function with the scope exposed to the inner function.

The rest of the code base I have tried to keep as simple as possible.

# Tasks

A lot to do still.

- [x] Speed up the `patch` and `expand` functions, if possible
    - [ ] ~~Move to a non-recursive patch function~~ Non-recursive is not faster
    - [ ] ~~Move vdom attrs to an array for faster traversal~~ Instead we create a new field on a dom with the attrs we manage
- [x] Implement `i-model`
- [ ] Implement component system
    - Components should not depend on their parent.
    - Components should only depend on their props
    - This needs to be done incrementally
        - [x] Single components that standalone ie. don't depend on props.
        - [x] Passing in props to components
        - [ ] Components with directives, `i-for` will be the difficult one.
        - [ ] Recursive components - I haven't though about this too much yet.
    - Components can have child dom elements passed in.
        - The child dom elements should not depend on the props passed in.
- [x] Implement event system
- [ ] Lifecycle and ability to destroy the iota instance
- [ ] Computed getters
- [ ] Prove security of `exposeScope`
- [ ] Better ability to mutate exposed scope
    - We can do `this.foo = 'newval'`
    - We would like to do `foo = 'newval'`. This may not be possible and may be discouraged anyway.
- [ ] Rerun the parser when a new field is set
    - Alternatively, enforce that all data is exposed before instantiation. This may be preferred.

# VFDOM

First off, disclaimer - I have no idea if this concept exists already.

A VFDOM is a Virtual Functional DOM. The idea is, that in compiling a VFDOM, you
will end up with a VDOM.

More simply put, a VFDOM is a VDOM that may contain functions, which return a
VDOM.

We use a VFDOM so we can encapsulate conditional rendering, list rendering and
various interpolation (mustache/handlebars).

A VDOM is just a concept, there is no correct way to format a VDOM. The gist is
that you can represent a DOM, with POJO (Plain Old Javascript Objects).

For example given a DOM:

```html
<div id="my-app" class="foo bar">
    <ul>
        <li>One</li>
        <li>Two</li>
        <li>Three</li>
    </ul>
</div>
```

A VDOM can be represented with:

```javascript
{ tagName: 'div', attrs: {id: 'my-app', class='foo bar'}, children: [
    {tagName: 'ul', children: [
      {tagName: 'li', children: ['One']},
      {tagName: 'li', children: ['Two']},
      {tagName: 'li', children: ['Three']},
    ]}
]}
```

I think this is a relatively simple concept.

Given a DOM, which you want to render a list of posts:

```html
<div id="my-app" class="foo bar">
    <ul>
        <li i-for="p of posts">{{ p.content }}</li>
    </ul>
</div>
```

The VFDOM, might look like this:

```javascript
{ tagName: 'div', attrs: {id: 'my-app', class='foo bar'}, children: [
    {tagName: 'ul', children: [
      () => {
          return posts.map(p => {
              return {tagName: 'li', children: [p.content]}
          })
      }
    ]}
]}
```

If we assume posts is equal to:

```javascript
[
    {content: 'post one'},
    {content: 'post two'},
    {content: 'post three'},
]
```

Then compiling our VFDOM might produce a VDOM like this:

```javascript
{ tagName: 'div', attrs: {id: 'my-app', class='foo bar'}, children: [
    {tagName: 'ul', children: [
      {tagName: 'li', children: ['post one']},
      {tagName: 'li', children: ['post two']},
      {tagName: 'li', children: ['post three']},
    ]}
]}
```

# Components

A component system is necessary for any modern JavaScript framework.
It becomes difficult to maintain a large web app, with many states that exist
and mutate in real time.

Behind the scenes in Iota, every component is just another Iota instance.

## Static Components

First lets consider a static component, that is one who's state never changes,
wherever it is rendered it will always the same.

This is the trivial case.

We can simply store a single instance of the component and we can even render it
straight away (it doesn't even need to be attached to the living DOM).

When we need an instance, we can `root.cloneNode(true)` (deep clone) the root
node and insert it into the living DOM as necessary.

## Stateful Components

Stateful components are less trivial. These components have an internal state
which can be mutated, which in turn affects how it is rendered. We want the
state of a each component to be local to that component.

We now introduce the concept of a ComponentPool. As mentioned above, each
Component is really just another Iota instance. Every Iota instance, will
maintain a ComponentPool. This is a way of maintaining and persisting the state
of each Comopnent. This can also allows us to nest components infinitely.

First lets start with a basic example.

```html
<div>
    <!-- Some more DOM elemenets... -->
    <counter></counter>
    <!-- Some more DOM elemenets... -->
    <counter></counter>
    <!-- Some more DOM elemenets... -->
    <counter></counter>
    <!-- Some more DOM elemenets... -->
    <counter></counter>
</div>
```

Because there are other elements in between our counter components, we don't
actually know where our counter elements will end up lying in the DOM.

We do however know that the counters will always exist in the same order as
which they first appear.

So when we parse the DOM into a VFDOM and we come across a component, we will
insert a new instance into the ComponentPool with a generated UID. We can then
use the UID in the VFDOM, and whenever we need to render the component, we fetch
it from the ComponentPool, then render.

The format used for the ComponentPool is trivial and I will extend it as I
extend the component system.

Right now, our component pool might look like this:

```javascript
{
    'counter': [
      CounterComponentInstance,
      CounterComponentInstance,
      CounterComponentInstance,
      CounterComponentInstance
    ]
}
```

## Passing Properties

At this point, I want to talk briefly about properties, which have somehow
ambiguously become known as _props_. I think the easiest way to handle props,
which is opinionated, is to say that props can only be passed down to children
and that props that have been passed into a component, cannot be modified.

This is opinionated, but I believe it helps the developer avoid complex logic.

If a component does not have props, then the component alone determines when it
needs to re-render itself, generally speaking the component's state changes.

If a component has props passed in, then it may need to be re-rendered if one of
it's props changes.
If a prop is a primitive type (Number, String, Boolean), then we just compare
the new prop to the old prop. If it has changed, we re-render.
If a prop is an Object, then it is harder to detect whether there has been a
change, so we just re-render. We actually do a little bit of optimization here,
but we omit for simplicity sake.

In the VFDOM, we will need to store any props along side the UID of the
component.

## Functional Components

Previously, we have always known how many components we need to maintain. With
the concept of functional components (ie. i-if, i-for), we have no idea how many
component instances we will need to maintain.

We now introduce the concept of ComponentGroups. Rendering a ComponentGroup can
return zero or more components. Since every component manages further child
child components, we can now say that we know how many ComponentGroups will
exist and we know in which order they exist.

At this point, we are just extending how we dealt with our Stateful Components.

Our ComponentGroups will also have a UID and be managed by the ComponentPool in
a similar fashion.

In the VFDOM, we will need to store a function which returns the reference to
our ComponentGroup.

Our ComponentPool distinguishes between regular Components (instances) and
ComopnentGroups (array of instances).

```javascript
{
    'counter': [
      // Regular Component
      CounterComponentInstance,
      // Component Group
      [CounterComponentInstance, CounterComponentInstance, ...],
    ]
}
```

## Keyed Functional Components

We can now parse and render functional components, but we run into an issue if
we are passing props to the functional components.

Imagine the following, we have a functional component:

`<post i-for="p of postList" :content="p.content"></post>`

For this example, it returns three components:

- Post A with Content A
- Post B with Content B
- Post C with Content C

If our `postList` collection changes, then we may end up with something else:

- Post A with _Content D_
- Post B with Content B
- Post C with Content C

Remember: Post A,B and C are Component instances and our components have a
state. Post A, may have some state that was associated with Content A. Now we
have passed in Content D... This may cause Post A to render incorrectly. Really
we want:

- _Post D_ with _Content D_
- Post B with Content B
- Post C with Content C

Where Post D is a new instance specifically associated with Content D.

Achieving this automatically is not possible(?). So we need to track our
components. Maybe our components have a Post ID, which we can use to help track
our components.

So we might have:

`<post i-for="p of postList" i-key="p.id" :content="p.content"></post>`

So now when the first post in postList changes, we can see this and create a new
instance for the new content.

We now have a ComponentPool that might look like this:

```javascript
{
    'counter': [
      // Regular Component
      CounterComponentInstance,
      // Un-keyed Component Group
      [CounterComponentInstance, CounterComponentInstance, ...],
      // Keyed Component Group
      {
          'counter-key-a': CounterComponentInstance,
          'counter-key-b': CounterComponentInstance,
          'counter-key-c': CounterComponentInstance,
          ...
      }
    ]
}
```

### Further Advantages

Now that our component groups are keyed, we have access to some cheap cases:

- Reordering the group means we can reuse existing components.
- If a component is no longer rendered and needed at a later point in time, then
    we don't need to re-instantiate it.

# Generalizing

From this point, we can make some generalizations. Our ComponentPool only
contains Components, but they exist in different formats:

- Instance for regular components
- Un-keyed are arrays
- Keyed are Objects (dicts)

We can pretty easily generalize this so all components exist in the pool as
dictionaries.

<!--
React, or more specifically JSX has inline HTML embedded in JavaScript. It
cannot be interpreted by the Browser (or Node.js). Instead it is pre-processed
and your inline HTML will be compiled into a VDOM like you see above, which can
be interpreted by the Browser. There are couple of steps I am omitting, but that
is the general idea.

A common case when building a web application, is list rendering. For instance,
you have a list of posts which you want to display.

In React, it might look like this:

```JavaScript
render () {
    return posts.map(p => {
        return <li>{p.content}</li>
    })
}
```

Which will be compiled to something like this:

render () {
    return posts.map(p => {
        return {tagName: 'li', children: [p.content]}
    })
}
-->

