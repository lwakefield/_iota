export function $toArray(obj) {
    if (!obj) return [];
    return [].slice.call(obj);
}

