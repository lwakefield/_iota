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

export function buildFunctionalVdom (vdom) {
    let res = vdom;
    while (res instanceof Function) {
        res = res();
    }
    return res;
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
    let keys = newProps ? Object.keys(newProps) : []
    let len = keys.length
    // Shortcut for checking if props have changed
    if (!oldProps) return true
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

/**
 * Really this is just an array... But I wanted something that I could easily
 * identify with instanceof and also helps avoid confusion when working with
 * arrays in proximity to ComponentGroup, it is very clear what is what.
 */
export class ComponentGroup {
    constructor () {
        this.length = 0
    }
    push (val) {
        this[this.length] = val
        this.length++
    }
    get tail () {
        return this[this.length - 1]
    }
    shouldHold (node) {
        return this.length === 0 ||
        node.uid === this.tail.uid
    }
    iterator () {
        return new ComponentGroupIterator(this)
    }
}

class ComponentGroupIterator {
    constructor (group) {
        this.group = group
        this.index = 0
    }
    next () {
        if (this.index >= this.group.length - 1) {
            return null
        }
        this.index++
        return this.group[this.index]
    }
    curr () {
        return this.group[this.index]
    }
}

