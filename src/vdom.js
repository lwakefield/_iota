import htmlparser from 'htmlparser';
import { Transforms } from '~/transforms';
import { query } from '~/dom';
import g from '~/g';

export default class VirtualDom {
    constructor (el) {
        this.el = el;
    }

    runTransforms () {
        for (let [attr, t] of Transforms) {
            for (let el of query(this.el, `[${attr}]`)) {
                t.apply(el);
            }
        }
    }

    parse () {
        this.parsed = g(this.el);
    }
}
