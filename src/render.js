import serialize from '~/serialize';

/**
 * render recursively turns a vdom into a real dom.
 * The vnode root can be either an Array, Function, String or Object
 * When the vnode is an Array, it is expected to be an Array of vdom elements.
 * When the vnode is a Function it is expected to return a vdom element. 
 * When the vnode is a string, it will be added to the vdom as a TextNode
 * When the vnode is an Object, this is the "normal" case.  The vnode contains a
 *   tagName, an object of attributes mapped string->string an Array of child
 *   elements.
 */
export function render (vnode) {
    if (vnode.split) return document.createTextNode(vnode);

    if (vnode instanceof Array) return vnode.map(v => render(v));
    if (vnode instanceof Function) return render(vnode.call());

    // This is the "normal" case, where we receive an obj
    let node = document.createElement(vnode.tagName);

    let a = vnode.attrs;
    Object.keys(a).forEach( k => node.setAttribute(k, a[k]) );
    let e = vnode.events || {};
    Object.keys(e).forEach( k => node.addEventListener(k, e[k]) );
    vnode.children.forEach( v => addChildren(node, render(v)));

    return node;
}

function addChildren (el, children) {
    if (children instanceof Array) {
        children.forEach(v => el.appendChild(v));
        return;
    }
    el.appendChild(children);
}

/**
 * This is the magic preRender Function.
 * The preRender function returns a render Function.
 * Functions in the vdom will often contain variables that are not in scope,
 *   this is how we resolve the scope.
 *
 * ex.
 *   // user.name does not exist in the global scope.
 *   let vdom = h('p', {}, [() => user.name]);
 *   let data = {
 *     user: {
 *       name: 'Fred'
 *     }
 *   };
 *   // This returns our magic function that resolves the scope
 *   let render = preRender(vdom, data);
 *   // The ugliest bit, is that we need to call it like this:
 *   let dom = render(...Object.values(data));
 *   // <p>Fred</p>
 */
export function preRender (vdom, data={}) {
    let str = serialize(vdom);
    let fn = new Function('render', ...Object.keys(data),
        `return render(${str})`);
    return fn.bind(null, render);
}
