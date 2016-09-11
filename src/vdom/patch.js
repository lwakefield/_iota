/* globals Text */
import { collectChildren } from './util';
import {
    isFormEl,
    removeNode,
    newNode,
    newTextNode,
    replaceNode
} from '../dom/util';
import {
    propsChanged,
    ComponentGroup
} from './util';

/**
 * The patch function walks the dom, diffing with the vdom along the way.
 * When there is a difference, the dom will be patched.
 * This minimizes DOM writes.
 * We need to pass in scope to make sure that any event listeners we attach
 *   will have the correct scope.
 */
export default function patch (scope, pool, rootDom, rootVdom) {
    function _patch (dom, vdom) {
        // These are the root cases, where we just return a TextNode
        if (typeof vdom === 'string') return patchText(dom, vdom);
        if (typeof vdom === 'number') return patchText(dom, vdom);

        dom = vdom.isComponent
            ? patchComponent(dom, vdom)
            : patchNode(dom, vdom);
        patchAttrs(dom, vdom);
        patchEvents(dom, vdom);

        if (!vdom.children) return dom;

        patchChildren(dom, collectChildren(vdom));
        return dom;
    }
    _patch(rootDom, rootVdom);

    function patchComponent (dom, vdom) {
        let instance = pool.get(vdom.uid, vdom.key);
        if (!instance) {
            instance = pool.instantiate(vdom.uid);
            replaceNode(dom, instance.$el);
        }

        const newProps = vdom.props();
        const oldProps = instance.$props;
        if (propsChanged(newProps, oldProps)) {
            instance.__setProps(newProps);
            instance.$update();
        }
        return instance.$el;
    }

    function patchText (dom, vdom) {
        if (!(dom instanceof Text)) {
            let textNode = newTextNode(vdom);
            replaceNode(dom, textNode);
            return textNode;
        } else if (dom.nodeValue !== vdom) {
            dom.nodeValue = vdom;
            return dom;
        }
    }

    function patchNode (dom, vdom) {
        if (!dom.tagName || dom.tagName.toLowerCase() !== vdom.tagName) {
            // TODO: Sloppy naming, fix this up
            let n = newNode(vdom.tagName);
            replaceNode(dom, n);
            return n;
        }
        return dom;
    }

    // Update existing attrs and remove any attrs that are no longer needed
    function patchAttrs (dom, vnode) {
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
                }
            }
        }

        remove();
        addAndUpdate();
    }

    // We just reattach all event listeners to make sure that all listeners
    //   are attached to the correct dom element
    function patchEvents (dom, vdom) {
        removeEvents(dom);
        if (!vdom.events || !vdom.events.length) return;
        addEvents(dom, vdom.events);
    }

    function removeEvents (dom) {
        if (dom.__eventListeners) {
            for (let i = 0; i < dom.__eventListeners.length; i++) {
                let v = dom.__eventListeners[i];
                dom.removeEventListener(v.type, v.listener);
            }
            dom.__eventListeners = [];
        }
    }

    function addEvents (dom, events) {
        let listeners = [];
        for (let i = 0; i < events.length; i++) {
            let v = events[i];
            v.listener = v.listener.bind(scope);
            dom.addEventListener(v.type, v.listener);
            listeners.push(v);
        }
        dom.__eventListeners = listeners;
    }

    function patchChildren (dom, nextChildren) {
        let children = collectComponentGroups(nextChildren);
        let len = children.length;
        let currNode = dom.firstChild;
        for (let i = 0; i < len; i++) {
            let nextNode = children[i];
            if (nextNode instanceof ComponentGroup) {
                const group = nextNode;
                for (let j = 0; j < group.length; j++) {
                    nextNode = group[j];
                    nextNode.key = j;
                    currNode = patchChild(dom, currNode, nextNode);
                    if (currNode) currNode = currNode.nextSibling;
                }
            } else {
                currNode = patchChild(dom, currNode, nextNode);
                if (currNode) currNode = currNode.nextSibling;
            }
        }

        cleanChildren(currNode);
    }

    /**
     * At this point, our vdom will have been fully compiled and all our nodes
     *   will be objects.
     * Out of all these nodes, some will be components.
     * Adjacent components with the same uid, will be part of the same group.
     * This function collects these components into a ComponentGroup.
     */
    function collectComponentGroups (children) {
        const bothAreComponents = (a, b) => a.isComponent && b.isComponent;
        const bothHaveSameMountPoint = (a, b) => a.uid === b.uid;

        let result = [];
        let i = 0;
        while (i < children.length) {
            let thisChild = children[i];
            let nextChild = children[i + 1];

            if (bothAreComponents(thisChild, nextChild) &&
                bothHaveSameMountPoint(thisChild, nextChild)) {
                const group = new ComponentGroup();
                group.push(thisChild, nextChild);
                const uid = thisChild.uid;
                for (let j = i + 2; j < children.length; j++) {
                    const child = children[j];
                    if (child.uid !== uid) break;
                    group.push(child);
                }
                result.push(group);
                i += group.length;
            } else {
                result.push(thisChild);
                i++;
            }
        }
        return result;
    }

    function cleanChildren (child) {
        while (child) {
            let nextChild = child.nextSibling;
            removeNode(child);
            child = nextChild;
        }
    }

    function patchChild (parent, node, vnode) {
        if (node) {
            if (vnode.isComponent) {
                console.log(node, vnode);
            }
            return _patch(node, vnode);
        } else if (typeof vnode === 'string' || typeof vnode === 'number') {
            let child = newTextNode(vnode);
            parent.appendChild(child);
            return _patch(child, vnode);
        } else {
            let child = newNode(vnode.tagName);
            parent.appendChild(child);
            return _patch(child, vnode);
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

