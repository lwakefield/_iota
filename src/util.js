export function $get(obj, path, defaultVal=undefined) {
    if (!path) return obj;

    const splitPath = path.split('.');
    let currVal = obj;
    for (let p of splitPath) {
        if (!currVal.hasOwnProperty(p)) return defaultVal;

        currVal = currVal[p];
    }
    return currVal;
}
export function $set(obj, key, val) {
    if (!key) return false;

    let path = key.split('.');
    let currObj = obj;
    while (path.length) {
        let nextKey = path.shift();
        let lookAheadKey = path[0];
        if (path.length === 0) currObj[nextKey] = val;
        if (currObj[nextKey] === undefined) {
            if (parseInt(lookAheadKey) !== NaN) currObj[nextKey] = [];
            if (parseInt(lookAheadKey) === NaN) currObj[nextKey] = {};
        }
        currObj = currObj[nextKey];
    }
}

