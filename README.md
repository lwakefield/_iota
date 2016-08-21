<h1 align="center">ιota</h1>

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
