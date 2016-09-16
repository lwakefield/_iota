import { expect } from 'chai';
import exposeScope from '../src/scope';

describe('exposeScope', () => {
    it('works', () => {
        let data = {foo: 1}
        let fn = exposeScope(
            function () { return foo; },
            null, data
        );
        expect(fn()).to.be.eql(1);
    });
    it('works with multiple vals', () => {
        let data = {foo: 1, bar: 2};
        let fn = exposeScope(
            function () { return [foo, bar] },
            null, data
        );
        expect(fn()).to.be.eql([1,2]);
    });
    it('works with multiple scopes', () => {
        let data1 = {foo: 1}
        let data2 = {bar: 2}
        let fn = exposeScope(
            function () { return [foo, bar]; },
            null, data1, data2
        );
        expect(fn()).to.be.eql([1, 2]);
    });
    it('observes changes', () => {
        let data = {foo: 1}
        let fn = exposeScope(
            function () { return foo; },
            null, data
        );
        expect(fn()).to.be.eql(1);
        data.foo = 2;
        expect(fn()).to.be.eql(2);
    });
    it('can access scope', () => {
        let data = {foo: 1};
        let fn = exposeScope(
            function () { return this.foo; },
            data, data
        );
        expect(fn()).to.be.eql(1);
    });
    it('can mutate data', () => {
        let data = {foo: 1};
        let fn = exposeScope(
            function () { this.foo = 2; },
            data, data
        );
        fn();
        expect(data).to.be.eql({foo:2});
    });
    it('works with empty scope', () => {
        let data = {foo: 1};
        let fn = exposeScope(
            function () { return foo; },
            null, data, {}, {}
        );
        expect(fn()).to.eql(1)
    });
});

