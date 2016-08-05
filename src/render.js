import serialize from './serialize';

const flatten = v => [].concat.apply([], v);

/**
 * process recursively processes a dynamic vdom into a static vdom.
 * A vdom is considered dynamic if it contains refs to functions, which will be
 *   called.
 * The vnode root may be an Array, Function, String or Object
 * When the vnode is an Array, it will return an Array of vdom
 *   elements.
 * When the vnode is a Function it will return a vdom element.
 * When the vnode is a string or number, it will return itself.
 * When the vnode is an Object, this is the "normal" case.  The vnode contains a
 *   tagName, an object of attributes mapped string->string an Array of child
 *   elements.
 */
export function process (vnode) {
    if (['string', 'number'].includes(typeof vnode)) return vnode;
    if (vnode instanceof Function) return process(vnode.call());
    if (vnode instanceof Array) {
        let result = new Array(vnode.length);
        for (let i = 0; i < vnode.length; i++) {
            result[i] = process(vnode[i]);
        }
        return result;
    }

    let processed = {
        tagName: vnode.tagName,
        attrs: {},
        children: [],
        events: {}
    };

    processed.attrs = getAttrs(vnode.attrs);

    if (vnode.children.length) {
        processed.children = flatten(process(vnode.children));
    }

    processed.events = vnode.events ? vnode.events : {};

    return processed;
}

function getAttrs(a) {
    let attrs = {};
    for (let k in a) {
        let val = a[k];
        if (val instanceof Function) {
            val = val.call();
        }
        attrs[k] = val;
    }
    return attrs;
}
