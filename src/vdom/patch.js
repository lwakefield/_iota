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
        let length = dom.childNodes.length > vnode.children.length ?
            dom.childNodes.length :
            vnode.children.length;

        for (let i = 0; i < length; i++) {
            let currNode = dom.childNodes[i];
            let nextNode = vnode.children[i];
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

    // We just reattach all event listeners to make sure that all listeners
    //   are attached to the correct dom element
    function patchEvents(dom, vdom) {
        if (dom.__eventListeners) {
            for (let i = 0; i < dom.__eventListeners.length; i++) {
                let v = dom.__eventListeners[i];
                dom.removeEventListener(v.type, v.listener);
            }
        }
        dom.__eventListeners = [];
        for (let i = 0; i < vdom.events.length; i++) {
            let v = vdom.events[i];
            v.listener = v.listener.bind(scope);
            dom.addEventListener(v.type, v.listener);
            dom.__eventListeners.push(v);
        }
    }

    // Update existing attrs and remove any attrs that are no longer needed
    function patchAttrs(dom, vnode) {
        let nextAttrs = vnode.attrs;
        let currAttrs = gatherAttrs(dom);

        // Make modifications on any existing attrs
        // Add if they don't exist
        // Update if the nextVal differs
        function addAndUpdate () {
            let keys = Object.keys(nextAttrs);
            let i = keys.length;
            while (i--) {
                let key = keys[i];
                let nextVal = nextAttrs[key];
                let currVal = currAttrs[key];
                if (key === 'value' && isFormEl(dom)) {
                    dom.value = nextVal;
                } else if (nextVal !== currVal) {
                    dom.setAttribute(key, nextVal);
                }
            }
        }

        // If there are some attrs on node that don't exist in nextAttrs,
        //   then we need to remove them
        function remove () {
            let keys = Object.keys(currAttrs);
            let i = keys.length;
            while (i--) {
                let key = keys[i];
                if (!nextAttrs[key]) {
                    dom.removeAttribute(key);
                }
            }
        }

        addAndUpdate();
        remove();
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

function gatherAttrs (dom) {
    let attrs = {};
    let i = dom.attributes.length;
    while (i--) {
        let attr = dom.attributes[i];
        attrs[attr.name] = attr.value;
    }
    return attrs;
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
