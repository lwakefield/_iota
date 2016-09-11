export function collectChildren (vdom) {
    let children = [];
    for (let i = 0; i < vdom.children.length; i++) {
        let child = buildFunctionalVdom(vdom.children[i]);
        if (child instanceof Array) {
            children.push(...child);
        } else {
            children.push(child);
        }
    }
    return children;
}

function buildFunctionalVdom (vdom) {
    let res = vdom;
    while (res instanceof Function) {
        res = res();
    }
    return res;
}

export function newNode (name, attrs, events) {
    let node = document.createElement(name);
    Object.keys(attrs).forEach(k => {
        node.setAttribute(k, attrs[k]);
    });
    return node;
}

/**
  * If the prop doesn't exist in oldProps or the value differs
  *    then there has been a change.
  *  This only really works 100% for primitives (Numbers, Strings and
  *    Bools).
  *  We only do a shallow compare. Such that if there is a prop which is an
  *    object, we just assume that it has changed.
  */
export function propsChanged (newProps, oldProps) {
    // TODO: cache props
    let keys = Object.keys(newProps);
    let len = keys.length;
    // Shortcut for checking if props have changed
    if (!oldProps) return true;
    if (len !== Object.keys(oldProps).length) return true;

    for (let i = 0; i < len; i++) {
        let key = keys[i];
        if (typeof newProps[key] === 'object') {
            return true;
        }
        if (oldProps[key] !== newProps[key]) {
            return true;
        }
    }
    return false;
}

export class ComponentGroup {
    constructor () {
        this.length = 0;
    }
    push (...vals) {
        const len = vals.length;
        for (let i = 0; i < len; i++) {
            this[this.length + i] = vals[i];
        }
        this.length += len;
    }
}

