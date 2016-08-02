import { expect } from 'chai';
import observe from '~/observe';

describe('Observe', () => {
    it('Walks the obj', () => {
        let data = {
            foo: {
                bar: {
                    baz: 'hello'
                }
            }
        };

        observe(data);

        let props = [
            Object.getOwnPropertyDescriptor(data, 'foo'),
            Object.getOwnPropertyDescriptor(data.foo, 'bar'),
            Object.getOwnPropertyDescriptor(data.foo.bar, 'baz')
        ];

        expect(props[0].get).to.not.be.undefined;
        expect(props[0].set).to.not.be.undefined;
        expect(props[1].get).to.not.be.undefined;
        expect(props[1].set).to.not.be.undefined;
        expect(props[2].get).to.not.be.undefined;
        expect(props[2].set).to.not.be.undefined;
    });

    it('Notifies of changes', done => {
        let data = {
            foo: {
                bar: {
                    baz: 'hello'
                }
            }
        };
        observe(data, () => {
            done();
        });
        data.foo.bar.baz = 'world';
    });

    it('Refreshes observe if you set prop to an obj', () => {
        let data = {
            foo: {
                bar: 'hello'
            }
        };
        let set = 0;
        observe(data, () => set++);

        data.foo = { bar: 'world' };
        expect(set).to.be.eql(1);
        data.foo.bar = 'hello';
        expect(set).to.be.eql(2);
    });

});


