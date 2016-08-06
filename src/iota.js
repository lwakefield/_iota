import { $get, $set } from './util';
import proxy from './proxy';
import observe from './observe';
import exposeScope from './scope';
import serialize from './serialize';

import parse from './vdom/parse';
import expand from './vdom/expand';
import patch  from './vdom/patch';

const requestAnimationFrame = window.requestAnimationFrame ||
    (cb => setTimeout(cb, 16));

export default class Iota {

    constructor (options) {
        this.$el = options.el;
        this.$data = {};
        if (options.data) {
            this.$data = options.data;
        }
        this._updating = false;
        observe(this.$data, this.$update.bind(this));
        proxy(this, this.$data);

        this.$methods = options.methods
            ? options.methods
            : {};
        for (let k in this.$methods) {
            this.$methods[k] = this.$methods[k].bind(this);
        }
        proxy(this, this.$methods);

        this._vdom = parse(this.$el);
        this._expandVdom = exposeScope(
            `return __expand(${serialize(this._vdom)})`,
            this,
            this.$data, this.$methods, { __expand: expand, $set: this.$set }
        );
        this._nextTickCallBacks = [];

        this.$forceUpdate();
    }

    $update () {
        if (this._updating) return;
        setTimeout(this.$forceUpdate.bind(this), 0);
    }

    $forceUpdate () {
        this._updating = true;
        let vdom = this._expandVdom();
        requestAnimationFrame(() => {
            patch(this, this.$el, vdom);
            this._updating = false;
            this._nextTickHandler();
        });
    }

    $nextTick (fn) {
        this._nextTickCallBacks.push(fn);
    }

    _nextTickHandler () {
        let length = this._nextTickCallBacks.length;
        for (let i = 0; i < length; i++) {
            this._nextTickCallBacks[i]();
        }
        this._nextTickCallBacks.splice(0, length);
    }

    $get (path) {
        return $get(this.$data, path);
    }

    $set (path, val) {
        $set(this.$data, path, val);
    }

}
