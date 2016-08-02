import { expect } from 'chai';
import proxy from '~/proxy';

describe('Proxy', () => {
    it('Works', () => {
        let data = {
            foo: 'bar'
        };

        let instance = {};

        proxy(instance, data);
        expect(instance.foo).to.eql('bar');
        data.foo = 'baz';
        expect(instance.foo).to.eql('baz');
        instance.foo = 'bar';
        expect(instance.foo).to.eql('bar');
        expect(data.foo).to.eql('bar');
    });
});

