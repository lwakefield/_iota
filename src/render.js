import serialize from '~/serialize';

export function render (vnode) {
    if (vnode.split) return document.createTextNode(vnode);

    if (vnode instanceof Array) return vnode.map(v => render(v));
    if (vnode instanceof Function) return render(vnode.call());

    // This is the "normal" case, where we receive an obj
    let node = document.createElement(vnode.tagName);

    let a = vnode.attrs;
    Object.keys(a).forEach( k => node.setAttribute(k, a[k]) );

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

export function preRender (vdom, data={}) {
    let str = serialize(vdom);
    let fn = new Function('render', ...Object.keys(data),
        `return render(${str})`);
    return fn.bind(null, render);
}
