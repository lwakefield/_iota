import makeReactive from './reactive';

const nop = () => {};

export default function observe(obj, fn=nop) {
    for (let key of Object.keys(obj)) {
        makeReactive(obj, key, val => {
            if (val instanceof Object) {
                observe(val, fn);
            }
            fn();
        });

        if (obj[key] instanceof Object) observe(obj[key], fn);
    }
}
