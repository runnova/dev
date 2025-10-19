function startPanel(code, params) {
    const winuid = genUID();

    const panelApiCodeWorker = `
    class NTXSession {
        constructor() {
            this.transactionIdCounter = 0;
            this.pendingRequests = {};
            this.listeners = {};
            const chunks = {};
            self.onmessage = (t) => {
                const { transactionId:s, chunk:n, chunkIndex:i, totalChunks:o, isJson:a, success:d, error:r, type:c, payload:l } = t.data;
                if (s && typeof d === "boolean") {
                    if (a && n !== undefined) {
                        if (!chunks[s]) chunks[s] = { chunks:[], received:0, total:o };
                        chunks[s].chunks[i] = n;
                        chunks[s].received++;
                        if (chunks[s].received === o) {
                            const fullData = chunks[s].chunks.join("");
                            delete chunks[s];
                            const result = JSON.parse(fullData);
                            if (this.pendingRequests[s]) { this.pendingRequests[s].resolve(result); delete this.pendingRequests[s]; }
                        }
                    } else {
                        if (this.pendingRequests[s]) { d ? this.pendingRequests[s].resolve(t.data.result) : this.pendingRequests[s].reject(r); delete this.pendingRequests[s]; }
                    }
                } else if (c && l !== undefined && this.listeners[c]) {
                    this.listeners[c].forEach(e => e(l));
                }
            };
        }
        generateTransactionId(){ return \`txn_\${Date.now()}_\${this.transactionIdCounter++}\`; }
        send(action, ...params){
            return new Promise((resolve, reject) => {
                const txnId = this.generateTransactionId();
                this.pendingRequests[txnId] = { resolve, reject };
                self.postMessage({ transactionId: txnId, action: action, params: params, workerId:'${winuid}' });
            });
        }
    }

    var ntxSession = new NTXSession();
    const ntx = new Proxy({}, {
        get(_, category){ return new Proxy({}, {
            get(_, action){ return (...args) => ntxSession.send(\`\${category}.\${action}\`, ...args); }
        }); }
    });

    const eventBus = (() => {
        const listeners=[];
        function deliver(msg){ if(typeof msg!=='object'||!msg.type||!msg.event) return; self.postMessage({ __eventBus:true, payload:msg }); }
        function listen({type='*', event='*', callback}){ listeners.push({type,event,callback}); }
        self.onmessage = (e) => {
            const data = e.data;
            if (!data || !data.__eventBus || !data.payload) return;
            const msg = data.payload;
            listeners.forEach(({type,event,callback}) => { if ((type===msg.type||type==='*')&&(event===msg.event||event==='*')) callback(msg); });
        };
        return { deliver, listen };
    })();
    `;

    const blob = new Blob([`${panelApiCodeWorker};${code}`], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));

    const panels = {};

    function safeSetHTML(appid, html) {
        if (!panels[appid]) {
            const container = document.createElement('div');
            const shadow = container.attachShadow({ mode: 'closed' });
            document.getElementById("panels").appendChild(container);
            panels[appid] = shadow;
        }
        const shadow = panels[appid];
        shadow.innerHTML = '';
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        doc.querySelectorAll('script, iframe, link[rel="import"]').forEach(e => e.remove());
        const style = doc.querySelector('style');
        if (style) shadow.appendChild(style.cloneNode(true));
        const bodyContent = Array.from(doc.body.childNodes).filter(n => n.nodeType === 1 || n.nodeType === 3);
        bodyContent.forEach(node => shadow.appendChild(node.cloneNode(true)));
    }

    function safeSetText(appid, className, text) {
        const shadow = panels[appid];
        if (!shadow) return;
        const el = shadow.querySelector(`.${className}`);
        if (el) el.textContent = text;
    }

    async function checkAndSetPermission() { return true; }

    worker.onmessage = async (event) => {
        const { transactionId, action, params, workerId } = event.data;
        if (!transactionId || !action || workerId !== winuid) return;
        try {
            const [namespace, method] = action.split(".");
            if (namespace === 'panel') {
                if (method === 'setHTML') safeSetHTML(winuid, params[0]);
                else if (method === 'setText') safeSetText(winuid, params[0], params[1]);
                else throw new Error('Unauthorized panel action');
                worker.postMessage({ transactionId, result: true, success: true });
                return;
            }
            if (!await checkAndSetPermission(namespace)) return;
            if (!ntxWrapper[namespace]?.[method]) throw new Error(`Invalid NTX action: ${action}`);
            const args = [...params];
            const contextID = genUID();
            if (supportsXData(namespace, method)) args.push(contextID);
            const result = await ntxWrapper[namespace][method](...args);
            sendLargeMessage(worker, result, transactionId);
        } catch (err) {
            worker.postMessage({ transactionId, error: err.message, success: false });
        }
    };

    function sendLargeMessage(target, data, transactionId, chunkSize = 65536) {
        try {
            const json = JSON.stringify(data);
            if (json.length <= chunkSize) {
                target.postMessage({ transactionId, result: data, isJson: true, success: true });
                return;
            }
            const totalChunks = Math.ceil(json.length / chunkSize);
            for (let i = 0; i < totalChunks; i++) {
                const chunk = json.slice(i * chunkSize, (i + 1) * chunkSize);
                target.postMessage({ transactionId, chunk, chunkIndex: i, totalChunks, isJson: true, success: true });
            }
        } catch {}
    }

    return { worker, winuid };
}
