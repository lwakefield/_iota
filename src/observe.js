import makeReactive from './reactive';

const nop = () => {};

export default function observe(obj, fn=nop) {
    for (let key of Object.keys(obj)) {
        makeReactive(obj, key, notify.bind(null, fn));
        if (obj[key] instanceof Object) {
            observe(obj[key], fn);
        }
    }
}

function notify (fn, val) {
    if (!(val instanceof Array) && val instanceof Object) {
        observe(val, fn);
    }
    fn();
}

