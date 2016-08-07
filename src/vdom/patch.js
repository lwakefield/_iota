/**
 * The patch function walks the dom, diffing with the vdom along the way.
 * When there is a difference, the dom will be patched.
 * This minimizes DOM writes.
 * We need to pass in scope to make sure that any event listeners we attach
 *   will have the correct scope.
 */
export default function patch(scope, rootDom, rootVdom) {
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

    function patchNode(dom, vdom) {
        if (!dom.tagName || dom.tagName.toLowerCase() !== vdom.tagName) {
            // TODO: Sloppy naming, fix this up
            let n = newNode(vdom.tagName, vdom.attrs, vdom.events);
            replaceNode(dom, n);
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
        return dom;
    }

    function _patch(dom, vdom) {
        if (vdom === undefined) return removeNode(dom);
        if (typeof vdom === 'string') return patchText(dom, vdom);
        if (typeof vdom === 'number') return patchText(dom, vdom);

        dom = patchNode(dom, vdom);

        patchAttrs(dom, vdom);
        patchEvents(dom, vdom);
        return dom;
    }

    function walk (dom, vdom) {
        dom = _patch(dom, vdom);

        if (!vdom.children) return;

        let nextChildren = collectChildren(vdom);
        let currChildren = dom.childNodes;

        let length = currChildren.length > nextChildren.length
            ? currChildren.length
            : nextChildren.length;

        for (let i = 0; i < length; i++) {
            let currNode = currChildren[i];
            let nextNode = nextChildren[i];
            if (currNode && nextNode) {
                walk(currNode, nextNode);
            } else if (nextNode) {
                let child =
                    typeof nextNode === 'string' || typeof nextNode === 'number' ?
                    document.createTextNode(nextNode) :
                    document.createElement(nextNode.tagName)
                dom.appendChild(child);
                walk(child, nextNode);
            } else if (currNode) {
                removeNode(currNode);
            }
        }
    }

    function collectChildren (vdom) {
        let children = [];
        for (let i = 0; i < vdom.children.length; i++) {
            let child = vdom.children[i];
            while (child instanceof Function) {
                child = child();
            }
            if (child instanceof Array) {
                children.push(...child);
            } else {
                children.push(child);
            }
        }
        return children;
    }

    walk(rootDom, rootVdom);
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

const formEls = [
    'button',
    'datalist',
    'fieldset',
    'form',
    'input',
    'keygen',
    'label',
    'legend',
    'meter',
    'optgroup',
    'option',
    'output',
    'progress',
    'select',
    'textarea'
].join('|')
function isFormEl(node) {
    return node.tagName.toLowerCase().match(formEls);
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
