import {
    extractParts,
    makeRootNode,
    hash,
    closeTags,
    injectRender
} from '~/parse';

export default function (data) {
    let { content, styles, scripts } = extractParts(data);
    let rootNode = makeRootNode(content);
    hash(rootNode);
    let html = closeTags(rootNode.outerHTML);
    let script = scripts[0].innerHTML;
    return injectRender(script, html);
}
