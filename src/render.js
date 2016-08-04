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
    if (vnode instanceof Array) return vnode.map(v => process(v));
    if (vnode instanceof Function) return process(vnode.call());

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

/**
 * This is the magic preProcess Function.
 * The preProcess function returns a process Function.
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
 *   let render = preProcess(vdom, data);
 *   // The ugliest bit, is that we need to call it like this:
 *   let dom = process();
 *   // <p>Fred</p>
 */
export function preProcess (vdom, data={}) {
    let code = serialize(vdom);
    let params = Object.keys(data).join(',');
    let passedParams = Object.keys(data).map(v => `data.${v}`).join(',');
    return new Function('process', 'data', `
        return (function (${params}) {
            return process(${code});
        })( ${passedParams} );
    `).bind(null, process, data);
}

