import { expect } from 'chai';
import makeReactive from '~/reactive';

describe('Reactive', () => {
    it('Adds getters and setters', () => {
        let data = {
            foo: 'hello'
        };
        makeReactive(data, 'foo');

        let prop = Object.getOwnPropertyDescriptor(data, 'foo');

        expect(prop.get).to.not.be.undefined;
        expect(prop.set).to.not.be.undefined;
    });

    it('Doesn\'t break anything', () => {
        let data = {
            foo: 'hello'
        };
        makeReactive(data, 'foo');

        let prop = Object.getOwnPropertyDescriptor(data, 'foo');

        expect(data.foo).to.eql('hello');
        data.foo = 'world';
        expect(data.foo).to.eql('world');
    });

    it('Notifies of changes', done => {
        let data = {
            foo: 'hello'
        };
        makeReactive(data, 'foo', val => {
            expect(val).to.eql('world');
            done();
        });
        data.foo = 'world';
    });

    it('Can make nested reactive objs', () => {
        let data = {
            foo: {
                bar: 'hello'
            }
        };
        makeReactive(data, 'foo');
        makeReactive(data.foo, 'bar');

        let prop = Object.getOwnPropertyDescriptor(data, 'foo');
        expect(prop.get).to.not.be.undefined;
        expect(prop.set).to.not.be.undefined;

        let prop2 = Object.getOwnPropertyDescriptor(data.foo, 'bar');
        expect(prop2.get).to.not.be.undefined;
        expect(prop2.set).to.not.be.undefined;
    });

    it('Wraps existing getters and setters', () => {
        let data = { foo: 'hello' };
        let flag1 = false;
        let flag2 = false;
        makeReactive(data, 'foo', () => flag1 = true);
        makeReactive(data, 'foo', () => flag2 = true);

        data.foo = 'hello';

        expect(flag1).to.be.true;
        expect(flag2).to.be.true;
    });
});

