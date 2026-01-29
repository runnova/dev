var dragging = false, remToPx = parseFloat(getComputedStyle(document.documentElement).fontSize), navheight;

var novadotcsscache, transactionLib = [], notificationContext = {};

async function openlaunchprotocol(appid, data, id, winuid) {
    sysLog("OLP", `Opening "${data}" in "${appid}" for ${winuid || id || 'operation'}`);
    let x = {
        "appid": appid,
        "data": data,
        "winuid": winuid
    };
    Gtodo = x;
    openfile(x.appid, { data: Gtodo });
}

let _olpResolverMap = new Map();

function OLPreturn(data, transferID) {
    if (_olpResolverMap.has(transferID)) {
        const { resolve, timeout } = _olpResolverMap.get(transferID);
        clearTimeout(timeout);
        resolve(data);
        _olpResolverMap.delete(transferID);
    }

    // legacy code
    if (iframeReferences[transferID]) {
        iframeReferences[transferID].postMessage({ returned: data, id: transferID, action: 'loadlocalfile' }, '*');
    }
}

async function useHandler(name, stufftodo) {

    return new Promise(async (resolve, reject) => {
        const transferID = `${name}-${Date.now()}`;
        const timeout = setTimeout(() => {
            _olpResolverMap.delete(transferID);
            resolve(undefined);
        }, 600000);

        _olpResolverMap.set(transferID, { resolve, timeout });

        let tagsLib = await getSetting("full","appTags.json");
        console.log(tagsLib, name)
        let finalAppId = tagsLib[name].id;
        openfile(finalAppId, { data: stufftodo, trid: transferID });
    });
}

const iframeReferences = {};

async function openfile(x, stufftodo) {
    let unid = x;
    try {
        if (!unid) {
            console.error("No app id provided");
            return;
        }

        let mm = await getFileById(unid);
        // mm is the file
        if (!mm) {
            console.error("Error: File not found", unid);
            return;
        }
        // extract type from file extension
        mm.type = mtpetxt(mm.fileName);

        if (mm.type == "app") {
            // run the app if it is one
            await openapp(mm.fileName, unid, stufftodo);
        } else if (mm.type == "lnk") {
            let z = JSON.parse(decodeBase64Content(mm.content));
            openfile(z.open)
        } else {
            // Not a .lnk file or an .osl file nor an .app file.
            let appIdToOpen = null;
            const fileExtension = mm.fileName.substring(mm.fileName.lastIndexOf('.'));

            if (fileTypeAssociations[fileExtension] && fileTypeAssociations[fileExtension].length > 0) {
                appIdToOpen = fileTypeAssociations[fileExtension][0];
            } else if (fileTypeAssociations['all'] && fileTypeAssociations['all'].length > 0) {
                appIdToOpen = fileTypeAssociations['all'][0];
            }

            if (appIdToOpen) {
                openlaunchprotocol(appIdToOpen, unid);
            } else {
                say(`No apps installed can read this file. <br><a type="btn" onclick="useHandler('Store@runnova', {'opener':'search', 'data':'${mm.type}'});">Search for handlers <span ic class="material-symbols-rounded">
								arrow_forward
							</span></a>`, "failed")
            }

        }
    } catch (error) {
        console.error(":( Error:", error);
        say("<h1>Unable to open file</h1>File Error: " + error, "failed")
    }
}

async function buildIframeApiBridge(appid, title, winuid, perms) {
    async function checkAndSetPermission(namespace) {
        if (!Array.isArray(perms)) {
            perms = [];
            await setSetting(appid, { perms }, "AppRegistry.json");
        }
        if (perms.includes(namespace)) return true;

        const confirmed = await justConfirm(
            `Allow ${namespace} permission?`,
            `${toTitleCase(await getFileNameByID(appid))} asks permission to ${describeNamespaces(namespace)}. Allow it?`
        );
        if (confirmed) {
            perms.push(namespace);
            await setSetting(appid, { perms }, "AppRegistry.json");
            return true;
        }
        return false;
    }
    function sendLargeMessage(target, data, transactionId, chunkSize = 65536) {
        try {
            const json = JSON.stringify(data);
            if (json.length <= chunkSize) {
                target.postMessage({ transactionId, result: data, isJson: true, success: true }, '*');
                return;
            }
            const totalChunks = Math.ceil(json.length / chunkSize);
            for (let i = 0; i < totalChunks; i++) {
                const chunk = json.slice(i * chunkSize, (i + 1) * chunkSize);
                target.postMessage({
                    transactionId, chunk, chunkIndex: i, totalChunks, isJson: true, success: true
                }, '*');
            }
        } catch (error) {
        }
    }

    async function handleNtxSessionMessage(event) {
        const { action, params, transactionId } = event.data;
        const contextID = genUID();
        notificationContext[contextID] = {
            appID: appid,
            windowID: winuid
        };
        try {
            const [namespace, method] = action.split(".");
            if (ntxWrapper[namespace]?.[method]) {
                if (!await checkAndSetPermission(namespace)) return;

                const fn = ntxWrapper[namespace][method];
                const args = [...params];
                if (supportsXData(namespace, method)) args.push(contextID);

                const result = await fn(...args)

                sendLargeMessage(event.source, result, transactionId);
            } else {
                throw new Error(`Invalid NTX action: ${action}`);
            }
        } catch (error) {
            console.error("Error handling NTX message:", error);
            event.source.postMessage({ transactionId, error: error.message, success: false }, '*');
        } finally {
            delete transactionLib[transactionId];
        }
    }

    function handleMessage(event) {
        if (!event.data || event.data.iframeId !== winuid) return;

        if (event.data.data === "gfdone") {
            setTimeout(() => {
                const loader = document.querySelector(`#window${CSS.escape(winuid)} .windowloader`);
                if (loader) {
                    loader.classList.add("transp5");
                    setTimeout(() => loader.remove(), 500);
                }
            }, 500)
        } else if (event.data.type === "iframeClick") {
            const targetWindow = document.querySelector(`[data-winuid="${winuid}"]`);
            nowapp = winuid;
            putwinontop("window" + winuid);
            winds[winuid].zIndex = targetWindow.style.zIndex;
        } else if (event.data.transactionId && event.data.action) {
            handleNtxSessionMessage(event);
        }
    }

    if (window._messageListeners?.[winuid]) {
        window.removeEventListener("message", window._messageListeners[winuid]);
    }
    window.addEventListener("message", handleMessage);
    if (!window._messageListeners) window._messageListeners = {};
    window._messageListeners[winuid] = handleMessage;
}

async function getSharedNtxScript(winuid, mode = "normal") {
    const baseScript = `
document.addEventListener('mousedown',()=>window.parent.postMessage({type:'iframeClick',iframeId:'${winuid}'},'*'));
var myWindow={};
class NTXSession{
constructor(){
this.transactionIdCounter=0;this.pendingRequests={};this.listeners={};const chunks={};
window.addEventListener("message",t=>{
const{transactionId:s,chunk:n,chunkIndex:i,totalChunks:o,isJson:a,success:d,error:r,type:c,payload:l}=t.data;
if(s&&typeof d==="boolean"){
if(a&&n!==undefined){
if(!chunks[s])chunks[s]={chunks:[],received:0,total:o};
chunks[s].chunks[i]=n;chunks[s].received++;
if(chunks[s].received===o){
const fullData=chunks[s].chunks.join("");
delete chunks[s];
const result=JSON.parse(fullData);
if(this.pendingRequests[s]){this.pendingRequests[s].resolve(result);delete this.pendingRequests[s];}
}}
else{if(this.pendingRequests[s]){d?this.pendingRequests[s].resolve(t.data.result):this.pendingRequests[s].reject(r);delete this.pendingRequests[s];}}
}else if(c&&l!==undefined&&this.listeners[c]){this.listeners[c].forEach(e=>e(l));}
});
}
generateTransactionId(){return\`txn_\${Date.now()}_\${this.transactionIdCounter++}\`;}
send(action,...params){
return new Promise((resolve,reject)=>{
const txnId=this.generateTransactionId();
this.pendingRequests[txnId]={resolve,reject};
window.parent.postMessage({transactionId:txnId,action:action,params:params,iframeId:'${winuid}'},"*");
});
}}
var ntxSession=new NTXSession();
const ntx=new Proxy({},{
get(_,category){return new Proxy({},{
get(_,action){return(...args)=>ntxSession.send(\`\${category}.\${action}\`,...args);}
});}
});
const eventBus=(()=>{const listeners=[];
function deliver(msg){if(typeof msg!=='object'||!msg.type||!msg.event)return;
window.parent.postMessage({__eventBus:true,payload:msg},'*');}
function listen({type='*',event='*',callback}){listeners.push({type,event,callback});}
window.addEventListener('message',e=>{
const{data}=e;if(!data||!data.__eventBus||!data.payload)return;
const msg=data.payload;
listeners.forEach(({type,event,callback})=>{if((type===msg.type||type==='*')&&(event===msg.event||event==='*'))callback(msg);});
});
return{deliver,listen};})();
`;

    const myWindowHandler = mode === "headless"
        ? `
window.addEventListener("message",async e=>{
if(e.data.type==="myWindow"){
try{await onStartup();setTimeout(()=>myWindow.close(),0);}catch(t){}
myWindow={...e.data.data,close:()=>ntxSession.send("sysUI.clwin",myWindow.windowID),
setTitle:e=>ntxSession.send("sysUI.setTitle",myWindow.windowID,e)};
window.parent.postMessage({data:"gfdone",iframeId:myWindow.windowID},"*");
}});`
        : `
window.addEventListener("message",async e=>{
if(e.data.type==="myWindow"){
myWindow={...e.data.data,close:()=>ntxSession.send("sysUI.clwin",myWindow.windowID),
setTitle:e=>ntxSession.send("sysUI.setTitle",myWindow.windowID,e)};
try{await greenflag();}catch(t){}
window.parent.postMessage({data:"gfdone",iframeId:myWindow.windowID},"*");
}else if(e.data?.type==="nova-style"&&typeof e.data.css==="string"){
let styleTag=document.getElementById("novacsstag");
if(!styleTag){styleTag=document.createElement("style");styleTag.id="novacsstag";document.head.appendChild(styleTag);}
styleTag.textContent=e.data.css;
}});`;

    return `<script>${baseScript}${myWindowHandler}</script>`;
}
async function prepareIframeContent(cont, appid, winuid, mode = "normal") {
    let contentString = isBase64(cont) ? decodeBase64Content(cont) : (cont || "<center><h1>Unavailable</h1>App Data cannot be read.</center>");

    let parser = new DOMParser();
    let doc = parser.parseFromString(contentString, "text/html");
    const el = doc.querySelector('script[type="application/json"][data-for="ntxSetup"]')
    const setupScriptData = el ? JSON.parse(el.textContent) : false;
    let styleBlock = '';
    if (mode === "normal") {
        if (setupScriptData["include"]?.includes('nova.css')) {
            let updatedCss = novadotcsscache || '';
            const novaCssTag = document.getElementById('novacsstag');
            if (novaCssTag) {
                const customCss = novaCssTag.textContent;
                const variableRegex = /--([\w-]+)\s*:\s*([^;]+);/g;
                let customVariables = {};
                let match;
                while ((match = variableRegex.exec(customCss)) !== null)
                    customVariables[`--${match[1]}`] = match[2].trim();
                updatedCss = novadotcsscache.replace(/:root\s*{([^}]*)}/, (m, d) => {
                    let upd = d.trim();
                    for (const [k, v] of Object.entries(customVariables))
                        upd = upd.replace(new RegExp(`(${k}\\s*:\\s*).*?;`, 'g'), `$1${v};`);
                    return `:root { ${upd} }`;
                });
            }
            styleBlock += `<style>${updatedCss}</style>`;
        }
        if (setupScriptData["include"]?.includes('material-symbols-rounded')) {
            const fontUrl = 'https://adthoughtsglobal.github.io/resources/MaterialSymbolsRounded.woff2';
            styleBlock += `<style>@font-face{font-family:'Material Symbols Rounded';font-style:normal;src:url(${fontUrl}) format('woff2');}.material-symbols-rounded{font-family:'Material Symbols Rounded';font-weight:normal;font-style:normal;font-size:24px;line-height:1;display:inline-block;white-space:nowrap;direction:ltr;-webkit-font-smoothing:antialiased;}</style>`;
        }
    }
    const ntxScript = await getSharedNtxScript(winuid, mode);
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">${styleBlock}</head><body>${contentString}${ntxScript}<script defer>window.parent.postMessage({type:"iframeReady",windowID:"${winuid}"}, "*");</script></body></html>`;
    return new Blob([html], { type: 'text/html' });
}

async function loadIframe(windowContent, windowLoader, loaderSpinner, cont, appid, winuid, title, params) {
    const iconHtml = await getAppIcon(0, appid) || defaultAppIcon;
    loaderSpinner.insertAdjacentHTML('beforebegin', iconHtml);
    const registry = await getSetting(appid, "AppRegistry.json") || { perms: [] };
    const mode = title === "headless_373452343985$#%" ? "headless" : "normal";
    const blob = await prepareIframeContent(cont, appid, winuid, mode);
    const blobURL = URL.createObjectURL(blob);
    const iframe = document.createElement("iframe");
    if (!registry.perms?.includes("unsandboxed"))
        iframe.setAttribute("sandbox", "allow-scripts allow-modals");
    iframe.src = blobURL;
    iframe.onload = async () => {
        const data = { appID: appid, windowID: winuid, ...(params && { params }) };
        iframe.contentWindow.postMessage({ type: "myWindow", data }, "*");
        await buildIframeApiBridge(appid, title, winuid, registry.perms);
    };
    windowContent.appendChild(iframe);
    iframeReferences[winuid] = iframe.contentWindow;
    if (!winds[winuid]) winds[winuid] = {};
    winds[winuid].src = blobURL;
    winds[winuid].visualState = "free";
}

async function openwindow(title, cont, ic, theme, aspectratio, appid, params) {
    const winuid = initializeWindowState(title, appid, params);

    const { windowDiv, windowHeader, windowContent, windowLoader, loaderSpinner } = createWindowShell(winuid, appid);

    populateWindowHeader(windowHeader, title, ic, winuid);
    const controls = await createHeaderControls(winuid, windowDiv);
    windowHeader.appendChild(controls);

    await applyWindowAppearance(windowDiv, windowHeader, theme, aspectratio);

    windowDiv.onclick = () => {
        nowapp = winuid;
        updateFocusedWindowBorder();
    };

    await loadIframe(windowContent, windowLoader, loaderSpinner, cont, appid, winuid, title, params);

    finalizeWindow(windowDiv, winuid);

    if (title != "headless_373452343985$#%") {
        loadtaskspanel();
    } else {
        setTimeout(() => {
            if (document.body.contains(windowDiv)) {
                loadtaskspanel();
            }
        }, 3000);

        setTimeout(() => {
            if (document.body.contains(windowDiv)) clwin(winuid);
        }, 30000);
    }

    attachDragHandler(windowDiv, windowHeader, winuid);
    attachResizeHandlers(windowDiv);
}

async function openapp(appTitle, external, customtodo, headless = false) {
    if (gid('appdmod').open) gid('appdmod').close();
    if (gid('searchwindow').open) gid('searchwindow').close();

    const fetchDataAndSave = async (appTitle) => {
        try {
            let AppContent;
            if (external === 1) {
                AppContent = await fetchData(`appdata/${appTitle}.html`);
                if (!AppContent) return;

                external = await createFile("Apps/", toTitleCase(appTitle), "app", AppContent);

                openfile(external);
                return;

            } else {
                AppContent = await getFileById(external);
                if (!appTitle) appTitle = AppContent.fileName;
                AppContent = AppContent.content;
            }

            if (headless) {
                if (Gtodo == null && customtodo) Gtodo = customtodo;
                let appIcon = 0;
                try { appIcon = await getAppIcon(external); } catch (e) { };
                await openwindow("headless_373452343985$#%", AppContent, appIcon, getAppTheme(AppContent), getAppAspectRatio(AppContent), external, customtodo);
                gid("window" + Object.keys(winds).pop()).style.display = "none";
                Gtodo = null;
                return;
            }

            if (Gtodo == null && customtodo) Gtodo = customtodo;

            let appIcon = defaultAppIcon;
            try { appIcon = await getAppIcon(0, external); } catch (e) { };
            
			let DecAppContent = decodeBase64Content(AppContent);
            let parser = new DOMParser();
			let doc = parser.parseFromString(DecAppContent, "text/html");
			const el = doc.querySelector('script[type="application/json"][data-for="ntxSetup"]')
			const setupScriptData = el ? JSON.parse(el.textContent) : false;
            openwindow(appTitle, AppContent, appIcon, getAppTheme(setupScriptData), getAppAspectRatio(setupScriptData), external, Gtodo);
            Gtodo = null;
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    fetchDataAndSave(appTitle);
}