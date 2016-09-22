import {isFormEl} from 'dom/util';

// Update existing attrs and remove any attrs that are no longer needed
export default function patchAttrs (dom, vnode) {
    let nextAttrs = vnode.attrs;
    let currAttrs = gatherAttrs(dom);

    // Make modifications on any existing attrs
    // Add if they don't exist
    // Update if the nextVal differs
    function addAndUpdate () {
        for (let key in nextAttrs) {
            let nextVal = nextAttrs[key];
            let currVal = currAttrs[key];
            if (nextVal instanceof Function) {
                nextVal = nextVal();
            }
            if (key === 'value' && isFormEl(dom)) {
                dom.value = nextVal;
            } else if (nextVal !== currVal) {
                dom.__attrs[key] = nextVal;
                dom.setAttribute(key, nextVal);
            }
        }
    }

    // If there are some attrs on node that don't exist in nextAttrs,
    //   then we need to remove them
    function remove () {
        for (let key in currAttrs) {
            if (!nextAttrs[key]) {
                dom.removeAttribute(key);
                delete dom.__attrs[key]
            }
        }
    }

    remove();
    addAndUpdate();
}

export function gatherAttrs (dom) {
    if (dom.__attrs) return dom.__attrs

    dom.__attrs = {}
    let length = dom.attributes.length
    for (let i = 0; i < length; i++) {
        let attr = dom.attributes[i]
        dom.__attrs[attr.name] = attr.value
    }
    return dom.__attrs
}
