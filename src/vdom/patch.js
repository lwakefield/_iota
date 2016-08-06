/**
 * The patch function walks the dom, diffing with the vdom along the way.
 * When there is a difference, the dom will be patched.
 * This minimizes DOM writes.
 * We need to pass in scope to make sure that any event listeners we attach
 *   will have the correct scope.
 */
export default function patch(scope, rootDom, rootVdom) {
    let tasks = [];

    // Recursively patch all children
    function patchChildren(dom, vnode) {
        let {
            children
        } = vnode;
        let length = dom.childNodes.length > children.length ?
            dom.childNodes.length :
            children.length;

        for (let i = 0; i < length; i++) {
            let currNode = dom.childNodes[i];
            let nextNode = children[i];
            if (currNode && nextNode) {
                _patch(currNode, nextNode);
                continue;
            }
            if (nextNode) {
                let child =
                    typeof nextNode === 'string' || typeof nextNode === 'number' ?
                    document.createTextNode(nextNode) :
                    document.createElement(nextNode.tagName)
                dom.appendChild(child);
                _patch(child, nextNode);
                continue;
            }
            if (currNode) {
                removeNode(currNode);
                continue;
            }
        }
    }

    function patchEvents(dom, vdom) {
        if (dom.__eventListeners) {
            for (let v of dom.__eventListeners) {
                dom.removeEventListener(v.type, v.listener);
            }
        }
        dom.__eventListeners = [];
        for (let v of vdom.events) {
            v.listener = v.listener.bind(scope);
            dom.addEventListener(v.type, v.listener);
            dom.__eventListeners.push(v);
        }
    }

    function patchAttrs(dom, vnode) {
        let nextAttrs = vnode.attrs;
        let currAttrs = {};
        for (let i = 0; i < dom.attributes.length; i++) {
            let v = dom.attributes[i];
            currAttrs[v.name] = v.value;
        }

        // Make modifications on any existing attrs
        // Add if they don't exist
        // Update if the nextVal differs
        for (let k in nextAttrs) {
            let nextVal = nextAttrs[k];
            let currVal = currAttrs[k];
            if (nextVal !== currVal) {
                dom.setAttribute(k, nextVal);
            }
        }
        // If there are some attrs on node that don't exist in nextAttrs,
        //   then we need to remove them
        for (let k in currAttrs) {
            if (!nextAttrs[k]) {
                dom.removeAttribute(k);
            }
        }
    }

    function patchNode(dom, vdom) {
        if (!dom.tagName || dom.tagName.toLowerCase() !== vdom.tagName) {
            // TODO: Sloppy naming, fix this up
            let n = newNode(vdom.tagName, vdom.attrs, vdom.events);
            const olddom = dom;
            replaceNode(olddom, n);
            return n;
        }
        return dom;
    }

    function patchText(dom, vdom) {
        // Dom is not a TextNode, replace it
        if (!dom.splitText) {
            replaceNode(dom, newTextNode(vdom));
        }
        // Dom content does not match
        if (dom.textContent !== vdom) {
            dom.textContent = vdom;
        }
    }

    function _patch(dom, vdom) {
        if (typeof vdom === 'string') return patchText(dom, vdom);
        if (typeof vdom === 'number') return patchText(dom, vdom);

        dom = patchNode(dom, vdom);

        patchAttrs(dom, vdom);
        patchEvents(dom, vdom);
        patchChildren(dom, vdom);
    }

    _patch(rootDom, rootVdom);
    return tasks;
}

function removeNode(node) {
    node.remove();
    node = null;
}

function newTextNode(text) {
    return document.createTextNode(text);
}

function newNode(name, attrs, events) {
    let node = document.createElement(name);
    Object.keys(attrs).forEach(k => {
        node.setAttribute(k, attrs[k]);
    });
    return node;
}

function replaceNode(oldNode, newNode) {
    if (!oldNode.parentNode) return;
    oldNode.parentNode.replaceChild(newNode, oldNode);
    oldNode = null;
}
