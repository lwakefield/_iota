/* eslint-env mocha */
import { expect } from 'chai'

import parse from 'parse'
import { registerComponent } from 'components'

global.Text = window.Text

describe('parse', () => {
    it('parses an el containing a component', () => {
        const el = document.createElement('div')
        el.innerHTML = `
            <bar></bar>
        `
        const bar = document.createElement('template')
        bar.innerHTML = `
            <p>Hello from bar</p>
        `
        registerComponent('bar', {el: bar})

        const [ vdom, pool ] = parse(el)
        expect(pool).to.eql({
            'instances': {
                'bar': [
                    { 'length': 0 },
                ],
            },
        })
        expect(vdom.tagName).to.eql('div')
        expect(vdom.children.length).to.eql(1)
        const child = vdom.children[0]
        expect(child.tagName).to.eql('bar')
        expect(child.uid).to.eql('bar.0')
        expect(child.isComponent).to.be.true
    })
})
