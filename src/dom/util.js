export const formEls = [
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
].join('|');

export function isFormEl (node) {
    return node.tagName.toLowerCase().match(formEls) !== null;
}

// We pool nodes for later use.
// This is WAAAY faster than calling document.createElement
export const nodes = {};

export function removeNode(node) {
    node.remove();
    if (node instanceof Text) return;

    let name = node.tagName.toLowerCase();
    let list = nodes[name];
    if (list) list.push(node);
    else nodes[name] = [node];
}

export function newNode(nodeName) {
    let list = nodes[nodeName];
    let val;
    if (list) val = list.pop();

    if (val) return val;
    else return document.createElement(nodeName);
}

export function newTextNode(text) {
    return document.createTextNode(text);
}

export function replaceNode(oldNode, newNode) {
    if (!oldNode.parentNode) return;
    oldNode.parentNode.replaceChild(newNode, oldNode);
    removeNode(oldNode);
}

