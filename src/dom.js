import { $toArray } from '~/util'
export function insertBefore(toInsert, target) {
    target.parentNode.insertBefore(toInsert, target);
}
export function insertAfter(toInsert, target) {
    target.parentNode.insertBefore(toInsert, target.nextSibling);
}
export function createTextNode(text) {
    return document.createTextNode(text);
}
//export function* traverseDOM(root, test=(() => true)) {
    //let els = $toArray(root.childNodes)
        //.filter(v => test(v));
    //while (els.length) {
        //let el = els.shift();

        //$toArray(el.childNodes)
            //.filter(v => test(v))
            //.forEach(v => els.push(v));
        //yield el;
    //}
//}
export function query(root=document, selector) {
    return $toArray(root.querySelectorAll(selector));
}
