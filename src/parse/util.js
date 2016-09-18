/**
 * Searches an elements attributes for an attibute with the name matching
 * `nameRegex`
 */
const getAttr = (el, nameRegex) => Array.from(el.attributes)
    .find(v => v.name.match(nameRegex));

function parseAttr (attr) {
    return needsInterpolation(attr.value)
        ? interpolate(attr.value)
        : attr.value;
}

function needsInterpolation (text) {
    return text.match(/{{(.*?)}}/g);
}

function interpolate (text) {
    const interpolation = text.split(/({{.*?}})/)
        .filter(v => v.trim().length)
        .map(v => {
            if (v.match(/{{(.*?)}}/g)) {
                return v.replace(/{{\s*(.*?)\s*}}/g, '$1');
            }
            return `"${v}"`;
        })
        .join(' + ');
    // eslint-disable-next-line
    return new Function(`return ${interpolation};`);
}

export {
    getAttr,
    parseAttr,
    needsInterpolation,
    interpolate
};
