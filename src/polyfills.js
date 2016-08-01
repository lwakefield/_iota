export default (function init() {
    Array.prototype.first = function () {
        if (!this.length) return undefined;
        return this[0];
    }
    Array.prototype.last = function () {
        if (!this.length) return undefined;
        return this[this.length-1];
    }
})();

