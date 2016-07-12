import { jsdom } from 'jsdom';
import { $toArray } from '~/util';
import sum from 'hash-sum';
import { parse } from 'acorn';
import 'acorn-jsx';
import { generate } from 'escodegen-wallaby';

export function extractParts(html) {
    const children = $toArray(jsdom(html).body.childNodes);
    let content = children.filter(v => {
        return !['STYLE', 'SCRIPT'].includes(v.nodeName);
    }).filter(v => {
        if (v.nodeName !== '#text') return true;
        return v.textContent.trim() !== '';
    });
    let styles = children.filter(v => {
        return v.nodeName === 'STYLE';
    });
    let scripts = children.filter(v => {
        return v.nodeName === 'SCRIPT';
    });
    return { content, styles, scripts };
}

export function makeRootNode (contents) {
    if (contents.length === 1) return contents[0];
    let root = document.createElement('div');
    contents.forEach(v => root.appendChild(v));
    return root;
}

export function hash (el) {
    el.classList.add(sum(el.innerHTML));
}

export function closeTags(html) {
    const selfclosers = [
        'area',
        'base',
        'br',
        'col',
        'command',
        'embed',
        'hr',
        'img',
        'input',
        'keygen',
        'link',
        'meta',
        'param',
        'source',
        'track',
        'wbr'
    ].join('|');
    const re = RegExp(`(<(${selfclosers}).*?)>`, 'g');
    return html.replace(re, '$1/>');
};

export function injectRender(js, jsx) {
    const config = {
        range: false,
        loc: false,
        tokens: false,
        plugins: {jsx: true}
    };
    let toInject = parse(`
    class A {
        render () { return (${jsx}) }
    }`, config);
    let code = parse(js, Object.assign({sourceType: 'module'}, config));

    let renderFn = toInject.body[0].body.body[0];
    code.body[0].declaration.body.body.push(renderFn);
    return generate(code);
}

export function makeRenderFn (el) {
    return `
    render () {
        return (${el.outerHTML});
    }
    `;
}

export function buildComponent (contents, script) {
}
