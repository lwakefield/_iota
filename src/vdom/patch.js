import {
    collectChildren
} from './util';
import {
    isFormEl,
    removeNode,
    newNode,
    newTextNode,
    replaceNode
} from '../dom/util';
/**
 * The patch function walks the dom, diffing with the vdom along the way.
 * When there is a difference, the dom will be patched.
 * This minimizes DOM writes.
 * We need to pass in scope to make sure that any event listeners we attach
 *   will have the correct scope.
 */
export default function patch(scope, rootDom, rootVdom) {
    function _patch (dom, vdom) {
        if (typeof vdom === 'string') return patchText(dom, vdom);
        if (typeof vdom === 'number') return patchText(dom, vdom);

        dom = patchNode(dom, vdom);
        patchAttrs(dom, vdom);
        patchEvents(dom, vdom);

        if (!vdom.children) return;

        patchChildren(dom, collectChildren(vdom));

    }
    _patch(rootDom, rootVdom);

    function patchText(dom, vdom) {
        if (!(dom instanceof Text)) {
            replaceNode(dom, newTextNode(vdom));
        } else if (dom.nodeValue !== vdom) {
            dom.nodeValue = vdom;
        }
    }

    function patchNode(dom, vdom) {
        if (!dom.tagName || dom.tagName.toLowerCase() !== vdom.tagName) {
            // TODO: Sloppy naming, fix this up
            let n = newNode(vdom.tagName);
            replaceNode(dom, n);
            return n;
        }
        return dom;
    }

    // Update existing attrs and remove any attrs that are no longer needed
    function patchAttrs(dom, vnode) {
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
                    dom.removeAttribute(name);
                }
            }
        }

        remove();
        addAndUpdate();
    }

    // We just reattach all event listeners to make sure that all listeners
    //   are attached to the correct dom element
    function patchEvents(dom, vdom) {
        removeEvents(dom);
        if (!vdom.events.length) return;
        addEvents(dom, vdom.events);
    }

    function removeEvents(dom) {
        if (dom.__eventListeners) {
            for (let i = 0; i < dom.__eventListeners.length; i++) {
                let v = dom.__eventListeners[i];
                dom.removeEventListener(v.type, v.listener);
            }
            dom.__eventListeners = [];
        }
    }

    function addEvents(dom, events) {
        let listeners = []
        for (let i = 0; i < events.length; i++) {
            let v = events[i];
            v.listener = v.listener.bind(scope);
            dom.addEventListener(v.type, v.listener);
            listeners.push(v);
        }
        dom.__eventListeners = listeners;
    }

    function patchChildren(dom, nextChildren) {
        let len = nextChildren.length;
        let currNode = dom.firstChild;
        for (let i = 0; i < len; i++) {
            let nextNode = nextChildren[i];
            patchChild(dom, currNode, nextNode);
            if (currNode) currNode = currNode.nextSibling;
        }

        cleanChildren(currNode);
    }

    function cleanChildren (child) {
        while (child) {
            let nextChild = child.nextSibling;
            removeNode(child);
            child = nextChild;
        }
    }

    function patchChild(parent, node, vnode) {
        if (node) {
            _patch(node, vnode);
        } else if (typeof vnode === 'string' || typeof vnode === 'number') {
            let child = newTextNode(vnode);
            parent.appendChild(child);
            _patch(child, vnode);
        } else {
            let child = newNode(vnode.tagName);
            parent.appendChild(child);
            _patch(child, vnode);
        }
    }

}

function gatherAttrs (dom) {
    if (dom.__attrs) return dom.__attrs;

    dom.__attrs = {};
    let length = dom.attributes.length;
    for (let i = 0; i < length; i++) {
        let attr = dom.attributes[i];
        dom.__attrs[attr.name] = attr.value;
    }
    return dom.__attrs;
}

