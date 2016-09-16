function _makeReactive (obj, handler) {
    let getter = handler.get;
    let setter = handler.set;
    return new Proxy(obj, handler)
}
export default function makeReactive (obj, key, fn=() => {}) {
    const prop = Object.getOwnPropertyDescriptor(obj, key);
    let val = obj[key];
    let setter = prop.set
        ? prop.set
        : newVal => {val = newVal};
    let getter = prop.get
        ? prop.get
        : () => val;

    Object.defineProperty(obj, key, {
        enumerable: true,
        configurable: true,
        get () {
            return getter();
        },
        set (val) {
            setter(val);
            fn(val);
        }
    });
}
