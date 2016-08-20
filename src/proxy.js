export default function proxy (ontoObj, val) {
    if (!val) return;

    for (let key of Object.keys(val)) {
        Object.defineProperty(ontoObj, key, {
            enumerable: true,
            configurable: true,
            get () {
                return val[key];
            },
            set (newVal) {
                val[key] = newVal;
            }
        });
    }
}

