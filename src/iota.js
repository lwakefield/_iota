import { $get, $set } from './util';
import proxy from './proxy';
import observe from './observe';
import exposeScope from './scope';
import serialize from './serialize';
import { templates, ComponentTemplate } from './components';

import parse from './vdom/parse';
import patch from './vdom/patch';

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

        this.$props = {};
        if (options.props) {
            options.props.forEach(k => { this.$props[k] = {}; });
        }
        proxy(this, this.$props);

        const [vdom, pool] = parse(this.$el);

        this._vdom = options.vdom ? options.vdom : vdom;
        this._pool = options.pool ? options.pool : pool;

        this._patch = exposeScope(
            `__patch(this, $pool, $el, ${serialize(this._vdom)})`,
            this,
            this.$data, this.$props, this.$methods,
            { __patch: patch, $el: this.$el, $pool: this._pool }
        );

        this.$forceUpdate();
    }

    __setProps (props) {
        Object.keys(props).forEach(k => {
            this.$props[k] = props[k];
        });
    }

    $update () {
        if (this._updating) return;
        this.$forceUpdate();
    }

    $forceUpdate () {
        this._updating = true;
        this._patch();
        this._updating = false;
    }

    $get (path) {
        return $get(this.$data, path);
    }

    $set (path, val) {
        $set(this.$data, path, val);
    }

    static registerComponent (name, options) {
        templates[name] = new ComponentTemplate(name, options);
    }

}

