// Where b is newer
const toArray = v => [].slice.call(v);

export function patch (dom, vdom) {
    if (['string', 'number'].includes(typeof vdom)) {
        if (!dom.splitText) {
            replaceNode(dom, newTextNode(vdom));
            return;
        }
        if (dom.textContent !== vdom) {
            dom.textContent = vdom;
            return;
        }
        return;
    }

    // while (dom.splitText && !dom.textContent.trim()) dom = dom.nextSibling;

    let { tagName, attrs, events, children } = vdom;

    // TODO: Sloppy naming, fix this up
    if (!dom.tagName || dom.tagName.toLowerCase() !== tagName) {
        let n = newNode(tagName, attrs, events);
        replaceNode(dom, n);
        dom = n;
    }

    let nextAttrs = attrs;
    let currAttrs = {};
    toArray(dom.attributes).map(v => currAttrs[v.name] = v.value);

    // Make modifications on any existing attrs
    // Add if they don't exist
    // Update if the nextVal differs
    Object.keys(nextAttrs).forEach(k => {
        let nextVal = nextAttrs[k];
        let currVal = currAttrs[k];
        if (nextVal !== currVal) dom.setAttribute(k, nextVal);
    });
    // If there are some attrs on node that don't exist in nextAttrs,
    //   then we need to remove them
    Object.keys(currAttrs).forEach(k => {
        if (!currAttrs[k]) dom.removeAttribute(k);
    });

    // Reattach all events listeners to ensure they are correct
    if (dom.events) {
        toArray(dom.events).forEach(v => dom.removeEventListener(v));
    }
    Object.keys(events).forEach(k => {
        dom.addEventListener(k, events[k])
    });

    // Recursively patch all children
    let currChildren = toArray(dom.childNodes);
    let length = currChildren.length > children.length
        ? currChildren.length
        : children.length;
    for (let i = 0; i < length; i++) {
        let currNode = currChildren[i];
        let nextNode = children[i];
        if (currNode && nextNode) {
            patch(currNode, nextNode);
            continue;
        }
        if (nextNode) {
            let child = dom.appendChild(
                ['string', 'number'].includes(typeof nextNode)
                    ? document.createTextNode(nextNode)
                    : document.createElement(nextNode.tagName)
            );
            patch(child, nextNode);
            continue;
        }
        if (currNode) {
            currNode.remove();
            continue;
        }
    }
}

function newTextNode (text) {
    return document.createTextNode(text);
}

function newNode (name, attrs, events) {
    let node = document.createElement(name);
    Object.keys(attrs).forEach(k => {
        node.setAttribute(k, attrs[k]);
    });
    Object.keys(events).forEach(k => {
        node.addEventListener(k, events[k])
    });
    return node;
}

function replaceNode(oldNode, newNode) {
    return oldNode.parentNode.replaceChild(newNode, oldNode);
}
