/* globals Text */

import parse from './vdom/parse';
import Iota from './iota';
import proxy from './proxy';

export const templates = {};
export const instances = {};

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
    register (inst) {
        if (!this.instances[inst.tagName]) {
            this.instances[inst.tagName] = [null];
            inst.uid = `${inst.tagName}.0`;
            return;
        }

        const len = this.instances[inst.tagName].length;
        this.instances[inst.tagName].push(null);
        inst.uid = `${inst.tagName}.${len}`;
    }

    get (uid) {
        const [name, id] = uid.split('.');
        return this.instances[name][id];
    }

    instantiate (uid) {
        const [name, id] = uid.split('.');
        const template = templates[name];

        let data = template.options.data();
        let el = template.options.el.cloneNode(true);
        let options = Object.assign({}, template.options, { el, data });
        const inst = new Iota(options);
        this.instances[name][id] = inst;
        return inst;
    }
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

        proxy(this, this.options);
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
}
