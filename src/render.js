export default function render (vnode) {
    if (vnode.split) return document.createTextNode(vnode);

    let node = document.createElement(vnode.nodeName);

    let attributes = Object.assign({}, vnode.attributes);
    Object.keys(attributes)
        .forEach( k => node.setAttribute(k, attributes[k]) );

    vnode.children.forEach( v => node.appendChild(render(v)) );

    return node;
}
