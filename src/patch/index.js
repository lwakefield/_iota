/* globals Text */
import {
    removeNode,
    newNode,
    newTextNode,
    replaceNode,
} from 'dom/util'
import {
    propsChanged,
    ComponentGroup,
    collectChildren,
} from 'vdom/util'
import patchAttrs from 'patch/attrs'
import patchEvents from 'patch/events'

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
            ? patchComponent({pool, dom, vdom})
            : patchNode(dom, vdom);
        patchAttrs(dom, vdom);
        patchEvents(dom, vdom, scope);

        if (!vdom.children) return dom;

        patchChildren(dom, collectChildren(vdom));
        return dom;
    }
    _patch(rootDom, rootVdom);

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

    function patchChild (parent, node, vnode) {
        if (node) {
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

export function patchComponent ({pool, dom, vdom}) {
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

export function patchText (dom, vdom) {
    if (!(dom instanceof Text)) {
        let textNode = newTextNode(vdom);
        replaceNode(dom, textNode);
        return textNode;
    } else if (dom.nodeValue !== vdom) {
        dom.nodeValue = vdom;
        return dom;
    }
}

export function patchNode (dom, vdom) {
    if (!dom.tagName || dom.tagName.toLowerCase() !== vdom.tagName) {
        // TODO: Sloppy naming, fix this up
        let n = newNode(vdom.tagName);
        replaceNode(dom, n);
        return n;
    }
    return dom;
}


/**
    * At this point, our vdom will have been fully compiled and all our nodes
    *   will be objects.
    * Out of all these nodes, some will be components.
    * Adjacent components with the same uid, will be part of the same group.
    * This function collects these components into a ComponentGroup.
    */
export function collectComponentGroups (children) {
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

export function cleanChildren (child) {
    while (child) {
        let nextChild = child.nextSibling;
        removeNode(child);
        child = nextChild;
    }
}


