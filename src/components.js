/* globals Text */

import parse from 'parse';
import Iota from 'iota';

export const templates = {};

export function isComponent (el) {
    return !!templates[el.tagName.toLowerCase()];
}

/**
 * uid is used to track the mount point in the vdom
 * The cases are as follows:
 *   A single component instance will be mounted:
 *     this.instances['my-component'][uid] = instance
 *   A list of un-keyed instances are mounted:
 *     this.instances['my-component'][uid] = [inst1, inst2, inst3]
 *   A list of keyed instances are mounted:
 *     this.instances['my-component'][uid] = {
 *       'as1': inst1, 'as2': inst2, 'as3': inst3
 *     }
 */
export class ComponentPool {
    constructor () {
        this.instances = {};
    }
    register (tagName) {
        if (!this.instances[tagName]) {
            this.instances[tagName] = [];
        }

        const len = this.instances[tagName].length;
        this.instances[tagName].push({length: 0});
        return `${tagName}.${len}`;
    }

    get (uid, key = 0) {
        const [name, id] = uid.split('.');
        return this.instances[name][id][key];
    }

    instantiate (uid, key = undefined) {
        const [name, id] = uid.split('.');
        const template = templates[name];
        const inst = template.newInstance();

        if (!key) {
            key = this.instances[name][id].length;
        }

        this.instances[name][id][key] = inst;
        this.instances[name][id].length++;
        return inst;
    }
}

export function registerComponent (name, options) {
    templates[name] = new ComponentTemplate(name, options);
}

export class ComponentTemplate {
    constructor (name, options) {
        this.name = name;
        this.options = options;
        if (typeof options.el === 'string') {
            this.options.el = document.querySelector(options.el);
        }
        this._collectTemplate();

        const [vdom, pool] = parse(this.options.el);
        this.options.vdom = vdom;
        this.options.pool = pool;
    }

    _collectTemplate () {
        let children = this._getNonEmptyChildren(this.options.el);
        let needsToBeWrapped = children.length > 1;
        if (!needsToBeWrapped) {
            this.options.el = children[0];
            return;
        }

        let wrapper = document.createElement('div');
        for (let child of children) {
            wrapper.appendChild(child.cloneNode(true));
        }
        this.options.el = wrapper;
    }

    _getNonEmptyChildren (el) {
        // Filter any empty text nodes
        return Array.from(el.content.childNodes).filter(v => {
            return !(v instanceof Text) || !!v.nodeValue.trim();
        });
    }

    newInstance () {
        const data = typeof this.options.data === 'function'
            ? this.options.data()
            : {};
        const el = this.options.el.cloneNode(true);
        const options = Object.assign({}, this.options, { el, data });
        return new Iota(options);
    }
}
