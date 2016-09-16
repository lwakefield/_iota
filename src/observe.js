import makeReactive from './reactive';

const nop = () => {};

/**
 * observe recursively mutates an Object and makes it reactive
 * If a property is set on an Object (that is known), fn will be called
 * If a property is set to an Object, we will observe that as well
 *
 * We can't observe things we don't know about.
 * obj = {foo: 1}
 * observe(obj, alert.bind('a change has been made!'))
 * // This will not be observed...
 * obj.bar = 2;
 */
export default function observe(obj, fn=nop) {
    let p = new Proxy(obj, {
        set (target, property, value) {
            target[property] = typeof value === 'object'
                ? observe(value)
                : value;
            notify(fn, value);
            return true;
        }
    });

    for (let key of Object.keys(obj)) {
        if (typeof obj[key] === 'object') {
            obj[key] = observe(obj[key], fn);
        }
    }
    return p;
}

function notify (fn, val) {
    if (!(val instanceof Array) && val instanceof Object) {
        observe(val, fn);
    }
    fn();
}

