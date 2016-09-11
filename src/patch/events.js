// We just reattach all event listeners to make sure that all listeners
//   are attached to the correct dom element
export default function patchEvents (dom, vdom, scope) {
    function removeEvents (dom) {
        if (dom.__eventListeners) {
            for (let i = 0; i < dom.__eventListeners.length; i++) {
                let v = dom.__eventListeners[i];
                dom.removeEventListener(v.type, v.listener);
            }
            dom.__eventListeners = [];
        }
    }
    function addEvents (dom, events) {
        let listeners = [];
        for (let i = 0; i < events.length; i++) {
            let v = events[i];
            v.listener = v.listener.bind(scope);
            dom.addEventListener(v.type, v.listener);
            listeners.push(v);
        }
        dom.__eventListeners = listeners;
    }

    removeEvents(dom);
    if (!vdom.events || !vdom.events.length) return;
    addEvents(dom, vdom.events);
}
