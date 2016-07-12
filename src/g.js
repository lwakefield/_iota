import { $toArray } from '~/util';

export default function g(el) {
    if (el.nodeName === '#text') return el.textContent;

    let nodeName = el.nodeName.toLowerCase();
    let attributes = {};
    for (let attr of $toArray(el.attributes)) {
        attributes[attr.name] = attr.value;
    }
    let children = $toArray(el.childNodes).map(v => g(v));

    return {nodeName, attributes, children};
}

