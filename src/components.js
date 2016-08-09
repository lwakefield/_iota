export const components = {}
export const instances = {}

export function registerInstance(name) {
    let inst = {
        isComponent: true,
        isMounted: false,
        tagName: name
    };

    let instPool = instances[name];
    if (!instPool) {
        inst.uid = 0;
        instances[name] = [inst];
        return inst;
    }

    inst.uid = instPool.length;
    instPool.push(inst);
    return inst;
}
