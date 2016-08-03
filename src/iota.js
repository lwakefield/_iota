import { parse } from './parse';
import { preRender } from './render';
import { $get, $set, $flatten } from './util';
import proxy from './proxy';
import observe from './observe';

export default class Iota {

    constructor (options) {
        this.$el = options.el;
        this.$data = {};
        if (options.data) {
            this.$data = options.data;
        }
        observe(this.$data, this.$update.bind(this));
        proxy(this, this.$data);

        this._vdom = parse(this.$el);
        this._render = preRender(this._vdom, this.$data);

        this.$update();
    }

    $update () {
        const rendered = this._render();
        this.$el.innerHTML = rendered.innerHTML;
    }

    $get (path) {
        return $get(this.$data, path);
    }

    $set (path, val) {
        $set(this.$data, path, val);
    }

}
