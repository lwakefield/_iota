import { parse } from './parse';
import { process } from './render';
import { patch, scheduleFlush } from './patch';
import { $get, $set } from './util';
import proxy from './proxy';
import observe from './observe';
import exposeScope from './scope';
import serialize from './serialize';

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

        this.$methods = {};
        if (options.methods) {
            this.$methods = options.methods;
            proxy(this, this.$methods);
        }

        this._vdom = parse(this.$el);
        this._process = exposeScope(
            `return __process(${serialize(this._vdom)})`,
            this,
            this.$data, this.$methods, { __process: process }
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
        let vdom = this._process();
        let tasks = patch(this.$el, vdom);
        scheduleFlush(tasks, () => {
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
