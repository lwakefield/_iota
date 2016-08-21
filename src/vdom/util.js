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

function buildFunctionalVdom (vdom) {
    let res = vdom;
    while (res instanceof Function) {
        res = res();
    }
    return res;
}

export function newNode (name, attrs, events) {
    let node = document.createElement(name);
    Object.keys(attrs).forEach(k => {
        node.setAttribute(k, attrs[k]);
    });
    return node;
}
