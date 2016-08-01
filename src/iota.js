import { parse } from '~/parse';
import { preRender } from '~/render';
import { $get, $set, $flatten } from '~/util';

export default class Iota {

    constructor (options) {
        this.$el = options.el;
        this.$data = {};
        this._watching = [];
        if (options.data) {
            let flattenedData = $flatten(options.data);
            Object.keys(flattenedData).forEach(v => {
                this.$set(v, flattenedData[v]);
            })
        }

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

        if (!this._watching.includes(path)) {
            this.$watch(path);
        }
    }

    $watch (path) {
        let pathSplit = path.split('.');
        let pathsVisited = [];
        let currObj = this;
        const instance = this;
        while (pathSplit.length) {
            let thisKey = pathSplit.shift();
            pathsVisited.push(thisKey);
            let thisPath = pathsVisited.join('.');

            if (!currObj.hasOwnProperty(thisKey)) {
                const target = currObj;
                Object.defineProperty(target, thisKey, {
                    enumerable: true,
                    configurable: true,
                    get () { return instance.$get(thisPath); },
                    set (val) {
                        instance.$set(thisPath, val);
                        instance.$update();
                    }
                });
                this._watching.push(thisPath);
            }

            currObj = currObj[thisKey];
        }
    }

}
