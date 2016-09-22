/* eslint-env mocha */
import { expect } from 'chai'

import patchAttrs, {
    gatherAttrs,
} from './attrs'

describe('gatherAttrs', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <p id="foo" class="bar baz"></p>
        `
    })
    it('successfully gathers attributes', () => {
        const el = document.querySelector('p')
        const attrs = gatherAttrs(el)
        expect(attrs).to.eql({
            id: 'foo',
            class: 'bar baz',
        })
    })
    it('successfully sets __attrs', () => {
        const el = document.querySelector('p')
        gatherAttrs(el)
        expect(el.__attrs).to.eql({
            id: 'foo',
            class: 'bar baz',
        })
    })
})

describe('patchAttrs', () => {
    it('patches an empty el', () => {
        const el = document.body
        const vdom = {
            attrs: {
                id: 'foo',
                class: 'bar baz',
            },
        }
        patchAttrs(el, vdom)

        expect(el.getAttribute('id')).to.eql('foo')
        expect(el.getAttribute('class')).to.eql('bar baz')
        expect(el.__attrs).to.eql(vdom.attrs)
    })

    it('adds attrs', () => {
        document.body.innerHTML = `
            <p id="foo"></p>
        `
        const el = document.querySelector('p')
        const vdom = {
            attrs: {
                id: 'foo',
                class: 'bar baz',
            },
        }
        patchAttrs(el, vdom)

        expect(el.getAttribute('id')).to.eql('foo')
        expect(el.getAttribute('class')).to.eql('bar baz')
        expect(el.__attrs).to.eql(vdom.attrs)
    })

    it('changes attrs', () => {
        document.body.innerHTML = `
            <p id="foo"></p>
        `
        const el = document.querySelector('p')
        const vdom = {
            attrs: {
                id: 'bar',
            },
        }
        patchAttrs(el, vdom)

        expect(el.getAttribute('id')).to.eql('bar')
        expect(el.__attrs).to.eql(vdom.attrs)
    })

    it('removes attrs', () => {
        document.body.innerHTML = `
            <p id="foo" class="bar baz"></p>
        `
        const el = document.querySelector('p')
        const vdom = {
            attrs: {
                id: 'bar',
            },
        }
        patchAttrs(el, vdom)

        expect(el.getAttribute('id')).to.eql('bar')
        expect(el.getAttribute('class')).is.null
        expect(el.__attrs).to.eql(vdom.attrs)
    })
    it('works on a complex patch', () => {
        document.body.innerHTML = `
            <p id="foo" class="bar baz" attr1="1"></p>
        `
        const el = document.querySelector('p')
        const vdom = {
            attrs: {
                class: 'BAR BAZ',
                attr1: 1,
                attr2: '2',
            },
        }
        patchAttrs(el, vdom)

        expect(el.getAttribute('id')).is.null
        expect(el.getAttribute('class')).to.eql('BAR BAZ')
        expect(el.getAttribute('attr1')).to.eql('1')
        expect(el.getAttribute('attr2')).to.eql('2')
        expect(el.__attrs).to.eql(vdom.attrs)
    })
})
