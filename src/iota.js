import { parse } from './parse';
import { preRender, preProcess } from './render';
import { patch, scheduleFlush } from './diff';
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
            if (requested) return;

            requested = true;
            setTimeout(() => {
                let vdom = this._process();
                let tasks = patch(this.$el, vdom);
                scheduleFlush(tasks, () => requested = false);
            }, 0);
        });
        proxy(this, this.$data);

        this._vdom = parse(this.$el);
        this._render = preRender(this._vdom, this.$data);
        this._process = preProcess(this._vdom, this.$data);

        let vdom = this._process();
        let tasks = patch(this.$el, vdom);
        scheduleFlush(tasks, () => requested = false);
    }

    $get (path) {
        return $get(this.$data, path);
    }

    $set (path, val) {
        $set(this.$data, path, val);
    }

}
