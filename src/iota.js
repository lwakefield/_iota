import { $get, $set } from './util';
import proxy from './proxy';
import observe from './observe';
import exposeScope from './scope';
import serialize from './serialize';
import { components, instances } from './components';

import parse from './vdom/parse';
import patch  from './vdom/patch';

const requestAnimationFrame = window.requestAnimationFrame ||
    (cb => setTimeout(cb, 16));

window.components = components;
window.instances = instances;

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
        for (let k in options.methods) {
            this.$methods[k] = options.methods[k].bind(this);
        }
        proxy(this, this.$methods);

        this._vdom = {};
        if (options.vdom) this._vdom = options.vdom;
        else this._vdom = parse(this.$el);

        this._patch = exposeScope(
            `__patch(this, $el, ${serialize(this._vdom)})`,
            this,
            this.$data, this.$methods, { __patch: patch, $el: this.$el }
        );
        this._nextTickCallBacks = [];

        this.$forceUpdate();
    }

    $update () {
        if (this._updating) return;
        this.$forceUpdate();
    }

    $forceUpdate () {
        this._updating = true;
        this._patch();
        this._updating = false;
        this._nextTickHandler();
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

    static registerComponent (name, options) {
        components[name] = new Component(name, options);
    }

}

class Component {
    constructor (name, options) {
        this.name = name;
        this.options = options;

        let el = options.el;
        // Filter any empty text nodes
        let children = Array.from(el.content.childNodes).filter(v => {
            if (v instanceof Text) {
                return !!v.nodeValue.trim();
            }
            return true;
        });

        // If there is more than one child, then we need to wrap it
        if (children.length === 1) {
            this.options.el = children[0];
        } else {
            let wrapper = document.createElement('div');
            let len = el.content.childNodes.length;
            let node = el.content.firstChild;
            while (node) {
                wrapper.appendChild(node.cloneNode(true));
                node = node.nextSibling;
            }
            this.options.el = wrapper;
        }

        this.options.vdom = parse(this.options.el);
    }
    newInstance () {
        let data = JSON.parse(JSON.stringify(this.options.data))
        let el = this.options.el.cloneNode(true);
        let options = Object.assign(this.options, { el, data })
        return new Iota(options);
    }
}
