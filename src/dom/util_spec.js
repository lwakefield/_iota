/* eslint-env mocha */
import { expect } from 'chai';
import {
    formEls,
    isFormEl,
    removeNode,
    nodes as pooledNodes,
    newNode,
    newTextNode,
    replaceNode
} from './util'

global['Text'] = window.Text;

describe('isFormEl', () => {
    it('correctly identifies form elements', () => {
        formEls.split('|').forEach(v => {
            expect(isFormEl({tagName: v})).to.be.true;
        });
    });
    it('correctly identifies form elements with caps tag name', () => {
        formEls.split('|').forEach(v => {
            expect(isFormEl({tagName: v.toUpperCase()})).to.be.true;
        });
    });
});

describe('removeNode', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <p>First test</p>
        `;
    });
    it('successfully removes node from DOM', () => {
        const el = document.querySelector('p');
        removeNode(el);
        expect(document.querySelector('p')).is.null;
    });
    it('adds the removed node to a pool for reuse', () => {
        const el = document.querySelector('p');
        removeNode(el);
        expect(pooledNodes['p']).is.not.undefined;
        expect(pooledNodes['p'][0]).is.not.undefined;
    });
});

describe('newNode', () => {
    it('successfully creates a new node', () => {
        const el = newNode('p');
        expect(el).is.not.undefined;
    });
    it('reuses a node from the pool', () => {
        const el1 = newNode('p');
        removeNode(el1);
        expect(pooledNodes['p'].length).to.eql(1);
        const el2 = newNode('p');
        expect(el2).to.eql(el1);
        expect(pooledNodes['p'].length).to.eql(0);
    });
});

describe('newTextNode', () => {
    it('successfully creates a new text node', () => {
        const el = newTextNode('hello world');
        expect(el).is.not.undefined;
    });
});

describe('replaceNode', () => {
    beforeEach(() => {
        document.body.innerHTML = `
        <h1>Hello world</h1>
    `;
    })
    it('successfully replaces a node', () => {
        const el = newNode('h2');
        el.innerHTML = 'Hello world';
        replaceNode(document.querySelector('h1'), el);
        expect(document.querySelector('h1')).is.null;
        expect(document.querySelector('h2')).is.not.null;
    });
});


