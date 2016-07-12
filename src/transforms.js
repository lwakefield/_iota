import {insertBefore, insertAfter, createTextNode} from '~/dom';

export default class Transform {
    constructor (el) {
        this.el = el;
    }
    apply () { }
}

export class For extends Transform {
    constructor (el) {
        super(el);

        let attr = this.el.getAttribute('i-for');
        let matches = attr.match(/(.+) (in|of) (.+)/);
        this.left = matches[1];
        this.right = matches[3];
    }
    apply () {
        let left = this.left;
        let right = this.right;
        let contents = this.el.innerHTML;
        insertBefore(createTextNode(
            `{ ${right}.map( (${left}, $index) => `
        ), this.el);
        insertAfter(createTextNode(') }'), this.el);
        this.el.removeAttribute('i-for');
    };
    static apply (el) {
        let t = new For(el);
        return t.apply();
    }
}

export const Transforms = new Map([
    ['i-for', For]
]);
