/** @jsx h */
export default function h(nodeName, attributes, ...args) {
    let children = [].concat(...args);
    return { nodeName, attributes, children };
}
