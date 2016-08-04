import { parse } from './parse';
import { preRender, preProcess } from './render';
import { patch } from './diff';
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
        let requested = false;
        observe(this.$data, () => {
            if (!requested) {
                requested = true;
                requestAnimationFrame(() => {
                    this.$update();
                    requested = false;
                });
            }
        });
        proxy(this, this.$data);

        this._vdom = parse(this.$el);
        this._render = preRender(this._vdom, this.$data);
        this._process = preProcess(this._vdom, this.$data);

        this.$update();
    }

    $update () {
        setTimeout(() => {
            console.log(this._process());
            patch(this.$el, this._process());
            // const rendered = this._render();
            // this.$el.innerHTML = rendered.innerHTML;
        }, 0);
    }

    $get (path) {
        return $get(this.$data, path);
    }

    $set (path, val) {
        $set(this.$data, path, val);
    }

}
