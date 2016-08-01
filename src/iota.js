import { parse } from '~/parse';
import { preRender } from '~/render';

export default class Iota {
    constructor (options) {
        this.$el = options.el;
        this.$data = options.data;

        this._vdom = parse(this.$el);
        this._render = preRender(this._vdom, this.$data);

        this.$update();
    }
    $update () {
        const rendered = this._render();
        this.$el.innerHTML = rendered.innerHTML;
    }
}
