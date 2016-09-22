/* eslint-env mocha */
import { expect } from 'chai';
import {
    collectChildren,
    buildFunctionalVdom,
    propsChanged,
    ComponentGroup
} from './util'

// global['Text'] = window.Text;

describe('buildFunctionalVdom', () => {
    it('correctly turns a vfdom into a vdom', () => {
        const vfdom = () =>
            () => ({tagName: 'p'})

        const vdom = buildFunctionalVdom(vfdom)
        expect(vdom).to.eql({tagName: 'p'})
    })
})

describe('collectChildren', () => {
    it('correctly collects a single vdom child', () => {
        const vdom = {children: [
            {tagName: 'p'},
        ]}
        const children = collectChildren(vdom)
        expect(children).to.eql([ {tagName: 'p'} ])
    })
    it('correctly collects a single vfdom child', () => {
        const vdom = {children: [
            () => ({tagName: 'p'}),
        ]}
        const children = collectChildren(vdom)
        expect(children).to.eql([ {tagName: 'p'} ])
    })
    it('correctly collects a single vfdom child which is an array', () => {
        const vdom = {children: [
            () => ([{tagName: 'h1'}, {tagName: 'h2'}, {tagName: 'h3'}]),
        ]}
        const children = collectChildren(vdom)
        expect(children).to.eql([
            {tagName: 'h1'},
            {tagName: 'h2'},
            {tagName: 'h3'}
        ])
    })
    it('correctly collects complex vdom children', () => {
        const vdom = {children: [
            {tagName: 'p'},
            () => ([{tagName: 'h1'}, {tagName: 'h2'}, {tagName: 'h3'}]),
            () => ({tagName: 'p'}),
            {tagName: 'p'},
        ]}
        const children = collectChildren(vdom)
        expect(children).to.eql([
            {tagName: 'p'},
            {tagName: 'h1'},
            {tagName: 'h2'},
            {tagName: 'h3'},
            {tagName: 'p'},
            {tagName: 'p'},
        ])
    })
})

describe('propsChanged', () => {
    it('correctly identifies when props have changed' +
    '(based on length)', () => {
        expect(propsChanged({}, {foo: 1})).to.be.true
    })
    it('correctly identifies when props have changed' +
    '(based on differing shallow val)', () => {
        expect(propsChanged({foo: 1}, {foo: 2})).to.be.true
    })
    it('correctly identifies when props have changed' +
    '(based on differing keys)', () => {
        expect(propsChanged({foo: 1}, {bar: 1})).to.be.true
    })
    it('correctly identifies when props have changed' +
    '(based on deep props)', () => {
        expect(propsChanged({foo: {bar: 1}}, {foo: {bar: 1}})).to.be.true
    })
    it('correctly identifies when props have not changed', () => {
        expect(propsChanged({foo: 1}, {foo: 1})).to.be.false
    })
})

describe('ComponentGroup', () => {
    it('instantiates correctly', () => {
        const group = new ComponentGroup()
        expect(group).is.not.undefined
        expect(group.length).to.eql(0)
    })
    describe('push', () => {
        it('correctly pushes a single el', () => {
            const group = new ComponentGroup()
            group.push({foo: 1})
            expect(group.length).to.eql(1)
            expect(group[0]).to.eql({foo: 1})
        })
        it('correctly pushes multiple els', () => {
            const group = new ComponentGroup()
            group.push({foo: 1}, {bar: 2})
            expect(group.length).to.eql(2)
            expect(group[0]).to.eql({foo: 1})
            expect(group[1]).to.eql({bar: 2})
        })
    })
})
