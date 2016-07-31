export default function serialize(obj, originalIndentation='  ') {
    function _serialize(obj, indentation) {
        return (obj instanceof Array)
            ? _serializeArr(obj, indentation)
            : _serializeObj(obj, indentation);
    }
    function _serializeObj(obj, indentation) {
        if (!Object.keys(obj).length) return '{}';

        let str = '{\n';
        Object.keys(obj).forEach(key => {
            let val = obj[key];
            let out;
            if (typeof val === 'string') {
                out = `'${val}'`;
            } else if (val instanceof Function) {
                out = val.toString();
            } else if (val instanceof Object) {
                out = _serialize(val, indentation+originalIndentation);
            } else {
                out = val;
            }
            str += `${indentation}${key}: ${out},\n`;
        });
        let minusIndentation = indentation.replace(originalIndentation, '');
        return str.replace(/(,\n)?$/, `\n${minusIndentation}}`);
    }
    function _serializeArr(arr, indentation) {
        if (!arr.length) return '[]';

        let str = '[\n';
        arr.forEach(val => {
            let out;
            if (typeof val === 'string') {
                out = `'${val}'`;
            } else if (val instanceof Function) {
                out = val.toString();
            } else if (val instanceof Object) {
                out = _serialize(val, indentation+originalIndentation);
            } else {
                out = val;
            }
            str += `${indentation}${out},\n`;
        });
        let minusIndentation = indentation.replace(originalIndentation, '');
        return str.replace(/(,\n)?$/, `\n${minusIndentation}]`);

    }
    return _serialize(obj, originalIndentation);
}

