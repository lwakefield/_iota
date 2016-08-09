<h1 align="center">ιota</h1>

<p align="center"><strong>ιota</strong> is a <i>super</i> small, <i>super</i> fast JavaScript framework.</p>
<p align="center">It is <i>truly</i> reactive, none of this <code>setState()</code> nonsense.</p>

---

# Get Started

Give it the ol' college `npm install`, then you can run `npm run dev` to spin up a dev server and have a play.
If you want to make a build, then `npm install`.

# Why

Why not.

Well, to give a more "real" answer, for the fun of it.
I wanted to build a framework and see what is needed to add all the bells and whistles.
I learnt from a lot of other frameworks, like Preact and Vue (heavily inspired by vue, though operation is completely different).

I also found that a lot of frameworks seemed to over complicate the workings of the framework.
As a result, I really wanted to focus on the readability of the code, in such a way that you can have a qiuck read of 
the source and fully understand what is going on.

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
        1. Single components without directives.
        2. Components with directives, `i-for` will be the difficult one.
        3. Recursive components - I haven't though about this too much yet.
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
