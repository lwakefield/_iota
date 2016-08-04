// Where b is newer
const nop = () => {};

export function scheduleFlush (tasks, done=nop) {
    requestAnimationFrame(flush.bind(null, tasks, done));
}

const TIME_LIMIT = 5;
function flush (tasks, done) {
    let start = Date.now();
    while (tasks.length) {
        // Run the next task
        (tasks.shift())();

        // We have run out of time, schedule another flush
        if ((Date.now() - start) > TIME_LIMIT) {
            console.log('buffer');
            return requestAnimationFrame(flush.bind(null, tasks, done));
        }
    }
    done();
}

export function patch (dom, vdom) {
    let tasks = [];
    if (['string', 'number'].includes(typeof vdom)) {
        return patchText(dom, vdom);
    }

    let { tagName, attrs, events, children } = vdom;

    // TODO: Sloppy naming, fix this up
    if (!dom.tagName || dom.tagName.toLowerCase() !== tagName) {
        let n = newNode(tagName, attrs, events);
        const olddom = dom;
        tasks.push(replaceNode.bind(null, olddom, n));
        dom = n;
    }

    tasks = tasks.concat(patchAttrs(dom, vdom));

    // Reattach all events listeners to ensure they are correct
    // if (dom.events) {
    //     toArray(dom.events).forEach(v => dom.removeEventListener(v));
    // }
    // Object.keys(events).forEach(k => {
    //     dom.addEventListener(k, events[k])
    // });

    tasks = tasks.concat(patchChildren(dom, vdom));

    return tasks;
}

function patchAttrs(dom, vnode) {
    let tasks = [];
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
            tasks.push(() => dom.setAttribute(k, nextVal));
        }
    }
    // If there are some attrs on node that don't exist in nextAttrs,
    //   then we need to remove them
    for (let k in currAttrs) {
        if (!nextAttrs[k]) {
            tasks.push(() => dom.removeAttribute(k));
        }
    }
    return tasks;
}

// Recursively patch all children
function patchChildren(dom, vnode) {
    let tasks = [];
    let { children } = vnode;
    let length = dom.childNodes.length > children.length
        ? dom.childNodes.length
        : children.length;
    for (let i = 0; i < length; i++) {
        let currNode = dom.childNodes[i];
        let nextNode = children[i];
        if (currNode && nextNode) {
            tasks = tasks.concat(patch(currNode, nextNode));
            continue;
        }
        if (nextNode) {
            let child = dom.appendChild(
                ['string', 'number'].includes(typeof nextNode)
                    ? document.createTextNode(nextNode)
                    : document.createElement(nextNode.tagName)
            );
            tasks = tasks.concat(patch(child, nextNode));
            continue;
        }
        if (currNode) {
            tasks.push(removeNode.bind(null, currNode));
            continue;
        }
    }
    return tasks;
}

function removeNode (node) {
    node.remove();
    node = null;
}

function patchText(dom, vdom) {
    // Dom is not a TextNode, replace it
    if (!dom.splitText) {
        return [replaceNode.bind(null, dom, newTextNode(vdom))];
    }
    // Dom content does not match
    if (dom.textContent !== vdom) {
        return [() => dom.textContent = vdom];
    }
    return [];
}

function newTextNode (text) {
    return document.createTextNode(text);
}

function newNode (name, attrs, events) {
    let node = document.createElement(name);
    Object.keys(attrs).forEach(k => {
        node.setAttribute(k, attrs[k]);
    });
    // Object.keys(events).forEach(k => {
    //     node.addEventListener(k, events[k])
    // });
    return node;
}

function replaceNode(oldNode, newNode) {
    if (!oldNode.parentNode) return;
    oldNode.parentNode.replaceChild(newNode, oldNode);
    oldNode = null;
}
