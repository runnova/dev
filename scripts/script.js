var batteryLevel, winds = {}, memory = {}, _nowapp, fulsapp = false, appsHistory = [], nowwindow, appicns = {}, fileslist = [], badlaunch = false, initmenuload = true, fileTypeAssociations = {}, handlers = {}, Gtodo, notifLog = {}, initialization = false, onstartup = [], novaFeaturedImage = `Dev.png`, defAppsList = [
	"store",
	"files",
	"settings",
	"calculator",
	"text",
	"musicplr",
	"camera",
	"time",
	"gallery",
	"browser",
	"studio"
], timeFormat, timetypecondition = true, genTaskBar, genDesktop, nonotif, currentImage = 1;

Object.defineProperty(window, 'nowapp', {
	get() {
		return _nowapp;
	},
	set(value) {
		_nowapp = value;
	}
});

function loginscreenbackbtn() {
	document.getElementsByClassName("backbtnscont")[0].style.display = "none";
	document.getElementsByClassName("userselect")[0].style.flex = "1";
	document.getElementsByClassName("logincard")[0].style.flex = "0";
}

async function showloginmod() {
	if (badlaunch) { return }
	var imgprvtmp = gid("wallbgpreview");
	imgprvtmp.src = novaFeaturedImage;
	imgprvtmp.onload = function handler() {
		imgprvtmp.onload = null;

		imgprvtmp.decode().then(() => {
			closeElementedis();
		}).catch(() => {
			closeElementedis();
		});
	};

	document.getElementsByClassName("backbtnscont")[0].style.display = "none";
	function createUserDivs(users) {
		const usersChooser = document.getElementById('userschooser');
		usersChooser.innerHTML = '';
		users.forEach(async (cacusername) => {
			const userDiv = document.createElement('div');
			userDiv.className = 'user';
			userDiv.tabIndex = 0;
			const selectUser = async function () {
				try {
					await cleanupram();
					CurrentUsername = cacusername;
					let isdefaultpass = false;
					try {
						isdefaultpass = await checkPassword('nova');
					} catch (err) {
						console.error("Password check failed:", err);
					}
					if (isdefaultpass) {
						gid('loginmod').close();
						gid('edison').showModal();
						startup();
					} else {
						console.log("Password check failed: ", isdefaultpass);
						document.getElementsByClassName("backbtnscont")[0].style.display = "flex";
						document.getElementsByClassName("userselect")[0].style.flex = "0";
						document.getElementsByClassName("logincard")[0].style.flex = "1";
						gid("loginform1").focus();
						gid('loginmod').showModal()
					}
				} catch (err) { }
			};

			userDiv.onclick = selectUser;
			userDiv.addEventListener("keydown", function (event) {
				if (event.key === "Enter") {
					selectUser();
				}
			});
			const img = document.createElement('img');
			img.className = 'icon';
			sharedStore.get(cacusername, "icon").then((icon) => { img.src = icon });
			const nameDiv = document.createElement('div');
			nameDiv.className = 'name';
			nameDiv.textContent = cacusername;
			userDiv.appendChild(img);
			userDiv.appendChild(nameDiv);
			usersChooser.appendChild(userDiv);
		});
	}
	let users = await sharedStore.getAllUsers();
	createUserDivs(users);
	if (users.length > 0) {
		document.querySelector('.user').focus();
	}
	const now = new Date();
	const hours = String(now.getHours()).padStart(2, '0');
	const minutes = String(now.getMinutes()).padStart(2, '0');
	document.getElementById('loginusselctime').textContent = `${hours}:${minutes}`;
	gid('loginmod').showModal();
	gid('loginform1').addEventListener("keydown", async function (event) {
		if (event.key === 'Enter') {
			event.preventDefault();
			await checkifpassright();
		}
	});
}
function setsrtpprgbr(val) {
	let progressBar = document.getElementById('progress-bar');
	let width = val;
	progressBar.style.width = width + '%';
}

async function loadFileTypeAssociations() {
	const associations = await getSetting('fileTypeAssociations');
	fileTypeAssociations = associations || {};
	const associations2 = await getSetting('handlers');
	handlers = associations2 || {};

	cleanupInvalidAssociations();
}

function closeElementedis(element) {
	if (!element) {
		element = document.getElementById("edison");
	}
	element.classList.add("closeEffect");
	setTimeout(function () {
		element.close()
		element.classList.remove("closeEffect");
	}, 200);
}

async function startup() {
	gid("edison").showModal();
	gid('loginmod').close();
	if (badlaunch) { return }
	lethalpasswordtimes = false;
	setsrtpprgbr(50);
	const start = performance.now();

	updateNavSize();

	await updateMemoryData().then(async () => {
		try {
			setsrtpprgbr(70);
			try {
				qsetsRefresh()
				timetypecondition = await getSetting("timefrmt") == '24 Hour' ? false : true;
			} catch { }
			gid('startupterms').innerHTML = "Initializing...";
			updateTime();
			setsrtpprgbr(80);
			await checkdmode();
			setsrtpprgbr(90);
			await genTaskBar();
			setsrtpprgbr(100);
			gid('startupterms').innerHTML = "Startup completed";
			await genDesktop();
			closeElementedis();

			async function fetchDataAndUpdate() {
				let fetchupdatedata = await fetch("versions.json");
				if (fetchupdatedata.ok) {
					let fetchupdatedataver = await fetchupdatedata.json();
					let lclver = await getSetting("versions", "defaultApps.json") || {};
					let howmany = 0;
					for (let item of Object.keys(fetchupdatedataver)) {
						let local = lclver[item]?.version || 0;
						if (local && fetchupdatedataver[item] != local) {
							initialization = 1;
							let updated = await updateApp(item);
							initialization = 0;
							howmany++;
							lclver[item] = { version: fetchupdatedataver[item], appid: updated.id };
						}
					}
					await setSetting("versions", lclver, "defaultApps.json");

					if (howmany) toast(howmany + " default app(s) have been updated")
				} else {
					console.error("Failed to fetch data from the server.");
				}
			}

			let shouldcheckupd = await getSetting("nvaupdcheck");
			if (shouldcheckupd) await fetchDataAndUpdate();
			removeInvalidMagicStrings();
			function startUpdateTime() {
				let now = new Date();
				let delay = (60 - now.getSeconds()) * 1000;
				setTimeout(function () {
					updateTime();
					setInterval(updateTime, 60000);
				}, delay);
			}
			startUpdateTime();
			await loadFileTypeAssociations();
			await ensureAllSettingsFilesExist();
			await loadSessionSettings();
			const end = performance.now();

			rllog(
				`You are using \n\n%cNovaOS%c\n%cNovaOS is the web system made for you.%c\n\nStartup: ${(end - start).toFixed(2)}ms\nUsername: ${CurrentUsername}\n12hr Time format: ${timetypecondition}`,
				'color: white; background-color: #101010; font-size: 2em; padding: 0.7rem 1em; border-radius: 1em;',
				'',
				'padding:5px 0; padding-top:1em;',
				'color: lightgreen; font-size:70%;'
			);

			try {

				stopAllPanels();

				let panels = await getSetting("navPanels") || [];
				if (panels.length) {
					for (let id of panels) {
						let code = await getFileById(id);
						let js = atob(code.content.split(',')[1]);
						startPanelSafely(js);
					}
				}


				console.log("889")
				function runScriptsSequentially(scripts, delay) {
					scripts.forEach((script, index) => {
						setTimeout(script, index * delay);
					});
				}
				runScriptsSequentially(onstartup, 1000)

				// onstartup apps
				let allOnstarts = await getSetting('RunOnStartup');
				allOnstarts.forEach(item => {
					openapp(0, item, {}, 1);
				})
			} catch (e) { }
		} catch (err) { console.error("startup error:", err); }
	})
}

function updateTime() {
	const now = new Date();
	let hours = now.getHours();
	if (timetypecondition) {
		// 12-hour format
		const ampm = hours >= 12 ? 'PM' : 'AM';
		hours = (hours % 12) || 12;
		timeFormat = `${hours}:${now.getMinutes().toString().padStart(2, '0')} ${ampm}`;
	} else {
		// 24-hour format
		timeFormat = `${hours.toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
	}
	const date = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
	gid('time-display').innerText = timeFormat;
	gid('date-display').innerText = date;
}
async function openn() {
	gid("strtsear").value = "";
	gid("strtappsugs").style.display = "none";
	let x = await getFileNamesByFolder("Apps/");
	x.sort((a, b) => a.name.localeCompare(b.name));

	if (x.length === 0 && initmenuload) {
		initmenuload = false;
		gid("appdmod").close();
		let choicetoreinst = await justConfirm(
			`Re-initialize OS?`,
			`Did the OS initialization fail? If yes, we can re-initialize your OS and install all the default apps. \n\nNovaOS did not find any apps while the initial load of Nova Menu. \n\nRe-initializing your OS may delete your data.`
		);
		if (choicetoreinst) {
			initializeOS();
		}
		return;
	}

	initmenuload = false;

	const isMobile = await getSetting("narrowMode");

	let existingAppElements = [...gid("appsindeck").children];
	let existingAppIds = new Set(existingAppElements.map((child) => child.dataset.appId));
	let newAppIds = new Set(x.map((app) => app.id));

	existingAppElements.forEach((element) => {
		if (!newAppIds.has(element.dataset.appId)) {
			element.remove();
		}
	});

	Promise.all(
		x.map(async (app) => {
			if (existingAppIds.has(app.id)) return;

			var appShortcutDiv = document.createElement("div");
			appShortcutDiv.className = "app-shortcut ctxAvail tooltip sizableuielement";
			appShortcutDiv.setAttribute("unid", app.id || '');
			appShortcutDiv.dataset.appId = app.id;
			appShortcutDiv.addEventListener("click", () => openfile(app.id));

			var iconSpan = document.createElement("span");
			iconSpan.classList.add("appicnspan");
			iconSpan.innerHTML = "<span class='taskbarloader'></span>";
			getAppIcon(false, app.id).then((appIcon) => {
				iconSpan.innerHTML = appIcon;
				insertSVG(appIcon, iconSpan);
			});

			function getapnme(x) {
				return x.split(".")[0];
			}

			var nameSpan = document.createElement("span");
			nameSpan.className = "appname";
			nameSpan.textContent = getapnme(app.name);

			appShortcutDiv.appendChild(iconSpan);
			appShortcutDiv.appendChild(nameSpan);

			gid("appsindeck").appendChild(appShortcutDiv);
		})
	)
		.then(() => { })
		.catch((error) => {
			console.error("An error occurred:", error);
		});

	if (gid("closeallwinsbtn").checked) {
		gid("closeallwinsbtn").checked = false;
	}

	if (!Object.keys(winds).length) {
		gid("closeallwinsbtn").checked = true;
		gid("closeallwinsbtn").setAttribute("disabled", true);
	} else {
		gid("closeallwinsbtn").setAttribute("disabled", false);
	}

	if (isMobile) {
		const el = gid("windowscont");
		if (el.classList.contains("reselector")) {
			el.classList.toggle("hidden")
			return;
		}
	}
	gid("appdmod").showModal();
	if (isMobile) {
		gid("appdmod").blur();
	}
}
async function loadrecentapps() {
	gid("serrecentapps").innerHTML = ``
	if (appsHistory.length < 1) {
		gid("partrecentapps").style.display = "none";
		gid("serrecentapps").innerHTML = `No recent apps`
		return;
	} else {
		gid("partrecentapps").style.display = "block";
	}
	let x = await getFileNamesByFolder("Apps");
	x.reverse();
	Promise.all(x.map(async (app) => {
		if (!appsHistory.includes(app.name)) {
			return
		}
		var appShortcutDiv = document.createElement("div");
		appShortcutDiv.className = "app-shortcut ctxAvail sizableuielement";
		appShortcutDiv.setAttribute("unid", app.id || '');
		appShortcutDiv.addEventListener("click", () => openapp(app.name, app.id));
		var iconSpan = document.createElement("span");
		iconSpan.classList.add("appicnspan");
		console.log(47973595, app.id)
		iconhtml = await getAppIcon(false, app.id);
		iconSpan.innerHTML = iconhtml;
		appicns[app.id] = iconSpan.innerHTML;
		var nameSpan = document.createElement("span");
		nameSpan.className = "appname";
		nameSpan.textContent = basename(app.name);

		appShortcutDiv.appendChild(iconSpan);
		appShortcutDiv.appendChild(nameSpan);
		gid("serrecentapps").appendChild(appShortcutDiv);
	})).then(async () => {

		gid("novamenusearchinp").focus();
	}).catch((error) => {
		console.error('An error occurred:', error);
	});

}
function makedefic(str) {
	if (!str) {
		return 'app';
	}
	const words = str.split(/\s+/);
	const result = words.map(word => {
		const consonantPattern = /[^aeiouAEIOU\s]+/g;
		const consonantMatches = word.match(consonantPattern);
		if (consonantMatches && consonantMatches.length >= 2) {
			return consonantMatches.slice(0, 2).map((letter, index) => index === 0 ? letter : letter.toLowerCase()).join('');
		} else {
			const firstLetter = word.charAt(0);
			const firstConsonantIndex = word.search(consonantPattern);
			if (firstConsonantIndex !== -1) {
				return firstLetter + word.charAt(firstConsonantIndex).toLowerCase();
			}
			return firstLetter;
		}
	});
	return result.join('').slice(0, 3);
} 

function updateBattery() {
	var batteryPromise;
	if ('getBattery' in navigator) {
		batteryPromise = navigator.getBattery();
	} else if ('battery' in navigator) {
		batteryPromise = Promise.resolve(navigator.battery);
	} else {
		document.getElementById("batterydisdiv").style.display = "none";
		return;
	}
	batteryPromise.then(function (battery) {
		if (typeof battery.level !== 'number' || isNaN(battery.level)) {
			document.getElementById("batterydisdiv").style.display = "none";
			return;
		}
		var batteryLevel = Math.round(battery.level * 100);
		var isCharging = !!battery.charging;
		if ((batteryLevel === 100 && isCharging) || (batteryLevel === 0 && isCharging)) {
			document.getElementById("batterydisdiv").style.display = "none";
		} else {
			document.getElementById("batterydisdiv").style.display = "flex";
		}
		let iconClass;
		if (batteryLevel >= 75) {
			iconClass = 'battery_full';
		} else if (batteryLevel >= 25) {
			iconClass = 'battery_5_bar';
		} else if (batteryLevel >= 15) {
			iconClass = 'battery_2_bar';
		} else {
			iconClass = 'battery_alert';
		}
		var batteryDisplayElement = document.getElementById('battery-display');
		var batteryPDisplayElement = document.getElementById('battery-p-display');
		if (batteryDisplayElement && batteryPDisplayElement) {
			if (iconClass !== batteryDisplayElement.innerText || batteryPDisplayElement.innerText !== batteryLevel + "%") {
				batteryDisplayElement.innerHTML = iconClass;
				batteryPDisplayElement.innerHTML = batteryLevel + "%";
			}
		}
	}).catch(function () {
		document.getElementById("batterydisdiv").style.display = "none";
	});
}

function getMetaTagContent(unshrunkContent, metaName, decode = false) {
	const content = decode ? decodeBase64Content(unshrunkContent) : unshrunkContent;
	const tempElement = document.createElement('div');
	tempElement.innerHTML = content;
	const metaTag = Array.from(tempElement.getElementsByTagName('meta')).find(tag =>
		tag.getAttribute('name') === metaName && tag.getAttribute('content')
	);
	return metaTag ? metaTag.getAttribute('content') : null;
}
function getAppTheme(setupScriptData) {
	return setupScriptData["theme-color"];
}
function getAppAspectRatio(setupScriptData) {
	return setupScriptData["aspect-ratio"] || null;
}
async function getAppIcon(content, id, lazy = 0) {
	try {
		if (content, id == undefined) {
			if (content == 'folder')
				return `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="var(--col-txt1)"><path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h207q16 0 30.5 6t25.5 17l57 57h360q17 0 28.5 11.5T880-680q0 17-11.5 28.5T840-640H447l-80-80H160v480l79-263q8-26 29.5-41.5T316-560h516q41 0 64.5 32.5T909-457l-72 240q-8 26-29.5 41.5T760-160H160Zm84-80h516l72-240H316l-72 240Zm-84-262v-218 218Zm84 262 72-240-72 240Z"/></svg>`;

			return defaultAppIcon;
		} else if (id == "info") {
			return `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="var(--col-txt1)"><path d="M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>`
		}
		const withTimeout = (promise) =>
			Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(), 3000))]);

		const getAppIconFromRegistry = async (id, registry) => {
			if (registry && registry.icon) {
				appicns = registry.icon;
				return appicns;
			}
			return null;
		};

		const saveIconToRegistry = async (id, iconContent, registry) => {
			const updatedRegistry = {
				...(registry || {}),
				icon: iconContent
			};
			await setSetting(id, updatedRegistry, "AppRegistry.json");
		};

		try {
			if (appicns[id]) return appicns[id];
			if (lazy) return defaultAppIcon;

			const registry = await getSetting(id, "AppRegistry.json") || {};
			const cachedIcon = await getAppIconFromRegistry(id, registry);
			if (cachedIcon) return cachedIcon;

			if (!content) {
				const file = await withTimeout(await getFileById(id));
				if (!file || !file.content) throw new Error("File content unavailable " + id);
				content = file.content;
			}
			content = decodeBase64Content(content);

			let parser = new DOMParser();
			let doc = parser.parseFromString(content, "text/html");
			const el = doc.querySelector('script[type="application/json"][data-for="ntxSetup"]')
			const setupScriptData = el ? JSON.parse(el.textContent) : false;
			const iconContent = setupScriptData["nova-icon"];
			if (iconContent) {
				appicns[id] = iconContent;
				await saveIconToRegistry(id, iconContent, registry);
				return iconContent;
			}
		} catch (err) {
			console.warn("Error in getAppIcon:", err);
		}

	} catch (e) { }

	const fallbackIcon = generateFallbackIcon(id);
	appicns[id] = fallbackIcon;

	return fallbackIcon;
}

async function generateFallbackIcon(id) {
	const icondatatodo = await getFileNameByID(id) || id;
	return `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="115.24806" height="130.92446" viewBox="0,0,115.24806,130.92446"><g transform="translate(-182.39149,-114.49081)"><g stroke="none" stroke-miterlimit="10"><path d="M182.39149,245.41527v-130.83054h70.53005l44.68697,44.95618v85.87436z" fill="` + stringToPastelColor(icondatatodo) + `" stroke-width="none"/><path d="M252.60365,158.84688v-44.35607l45.03589,44.35607z" style="opacity: 0.7" fill="#dadada" stroke-width="0"/><text transform="translate(189,229) scale(0.9,0.9)" font-size="3rem" xml:space="preserve" fill="#dadada" style="opacity: 0.7" stroke-width="1" font-family="monospace" font-weight="normal" text-anchor="start"><tspan x="0" dy="0" fill="black">${makedefic(icondatatodo)}</tspan></text></g></g></svg>`;
}

async function applyIconPack(iconPack) {
	try {
		for (const namespace in handlers) {
			const appID = handlers[namespace];
			const iconSVG = iconPack[namespace];

			if (!iconSVG) continue;
			try {
				const appicn = await getSetting(appID, "AppRegistry.json") || {};

				appicn["icon"] = iconSVG;

				await setSetting(appID, appicn, "AppRegistry.json");
				console.log(`Icon set for app ${appID} from namespace ${namespace}`);
			} catch (err) {
				console.error(`Failed to set icon for app ${appID}`, err);
			}
		}
	} catch (err) {
		console.error("Failed to apply icon pack", err);
	}
	appicns = {};
	gid("appsindeck").innerHTML = "";
	genTaskBar();
	genDesktop();
}

async function fetchData(url) {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error! Status: ${response.status}`);
		}
		const data = await response.text();
		return data;
	} catch (error) {
		console.error("Error fetching data:", error.message);
		const data = null;
		return data;
	}
}
var content;
function getMaxZIndex() {
	const elements = document.querySelectorAll('.window');
	let maxZIndex = 0;
	elements.forEach(element => {
		const zIndex = parseInt(window.getComputedStyle(element).zIndex);
		if (zIndex > maxZIndex) {
			maxZIndex = zIndex;
		}
	});
}
function folderExists(folderName) {
	const parts = folderName.replace(/\/$/, '').split('/');
	let current = memory.root;
	for (let part of parts) {
		part += '/';
		if (!current[part]) {
			return false;
		}
		current = current[part];
	}
	return true;
}

async function extractAndRegisterCapabilities(appId, content) {
	try {
		if (!content) {
			content = await getFileById(appId);
			content = content.content;
		}
		if (isBase64(content)) {
			content = decodeBase64Content(content);
		}
		let parser = new DOMParser();
		let doc = parser.parseFromString(content, "text/html");

		const el = doc.querySelector('script[type="application/json"][data-for="ntxSetup"]')
		const setupScriptData = el ? JSON.parse(el.textContent) : false;
		let capabilities = [];
		if (setupScriptData) {
			capabilities = setupScriptData["capabilities"];
		}

		let onlyDefPerms = false;
		let totalperms = ['utility', 'sysUI'];
		let permsRegAvble = setupScriptData["permissions"]?.length > 0;
		let requestedperms = [];
		if (permsRegAvble) {
			requestedperms = setupScriptData["permissions"].map(s => s.trim());
		} else {
			console.log(`No permissions: ${appId}`);
			onlyDefPerms = true
		}

		function arraysEqualIgnoreOrder(arr1, arr2) {
			if (arr1.length !== arr2.length) return false;
			let sorted1 = [...arr1].sort();
			let sorted2 = [...arr2].sort();
			for (let i = 0; i < sorted1.length; i++) {
				if (sorted1[i] !== sorted2[i]) return false;
			}
			return true;
		}

		onlyDefPerms = (onlyDefPerms) ? true : arraysEqualIgnoreOrder(requestedperms, totalperms);

		let permissions = Array.from(new Set([...totalperms, ...requestedperms]));
		let specialsFlags = setupScriptData["special-features"];

		if (!onlyDefPerms) {
			let modal = gid("AppInstDia");
			gid("app_inst_dia_icon").innerHTML = await getAppIcon(0, appId);
			let appName = await getFileNameByID(appId);
			gid("app_inst_mod_app_name").innerText = appName;
			let listelement = gid("app_inst_mod_li");
			listelement.innerHTML = '';
			if (capabilities?.length > 0) {
				let fileTypes = capabilities.join(', ');
				if (fileTypes) {
					let span = document.createElement("li");
					span.innerHTML = `Open ${fileTypes} by default`;
					listelement.appendChild(span);
				}

				if (specialsFlags) {
					if (specialsFlags.includes("onStartup")) {

						let span = document.createElement("li");
						span.innerHTML = "Run during startup";
						listelement.appendChild(span);
					}
				}
			}

			permissions.sort((a, b) => getNamespaceRisk(b) - getNamespaceRisk(a));

			if (permissions.includes("unsandboxed")) {
				let span = document.createElement("li");
				span.innerHTML = describeNamespaces("unsandboxed").replace(/^./, c => c.toUpperCase());
				span.innerHTML += `<small>Only recommended for apps you trust.</small>`;
				listelement.appendChild(span);
			} else {
				permissions.forEach((perm) => {
					let span = document.createElement("li");
					span.innerHTML = describeNamespaces(perm).replace(/^./, c => c.toUpperCase());
					listelement.appendChild(span);
				});
			}

			let yesButton = gid("app_inst_mod_agbtn");
			let noButton = gid("app_inst_mod_nobtn");
			let lclver = await getSetting("versions", "defaultApps.json") || {};
			let defaultappsext = Object.values(lclver).some(a => a.appid === appId);

			let condition = await new Promise((resolve) => {
				if (initialization || defaultappsext) {
					if (defaultappsext) toast(appName + " Updated");
					return resolve(true);
				}

				modal.showModal();
				yesButton.onclick = () => {
					modal.close();
					resolve(true);
				};
				noButton.onclick = () => {
					modal.close();
					resolve(false);
				};
			});


			if (!condition) return;
		}

		requestedperms.forEach((perm) => {
			if (!totalperms.includes(perm)) {
				totalperms.push(perm);
			}
		});
		await registerApp(appId, capabilities, specialsFlags, setupScriptData);

		let registry = {};
		registry.perms = totalperms;
		await setSetting(appId, registry, "AppRegistry.json");

	} catch (error) {
		console.error("Error extracting and registering capabilities:", error);
	}
}
async function registerApp(appId, capabilities, specialsFlags, setupScriptData = {}) {
	if (capabilities?.length) {
		for (let rawCapability of capabilities) {
			let capability = rawCapability.trim();
			if (capability.startsWith('.')) {
				fileTypeAssociations[capability] = [appId];
			} else {
				handlers[capability] = appId;
			}
		}
	}

	let fileName = await getFileNameByID(appId);
	let appTag = getapnme(fileName) + "@" + setupScriptData["author"];
	await setSetting(appTag, { "id": appId }, "appTags.json")
	await setSetting('fileTypeAssociations', fileTypeAssociations);

	if (specialsFlags) {
		if (specialsFlags.includes("onStartup")) {
			let startupApps = await getSetting('RunOnStartup') || [];
			if (!startupApps.includes(appId)) startupApps.push(appId);
			await setSetting('RunOnStartup', startupApps);
		}
	}

	if (!initialization)
		notify(fileName + " installed", "Now handles " + capabilities?.toString(), "NovaOS System");
	return capabilities?.toString() || "";
}

async function cleanupInvalidAssociations() {
	const validAppIds = await getAllValidAppIds();
	let associationsChanged = false;

	for (let fileType in fileTypeAssociations) {
		const appId = fileTypeAssociations[fileType][0];
		if (!validAppIds.includes(appId)) {
			console.log(`Removing invalid file type association: ${fileType} for app ID ${appId}`);
			delete fileTypeAssociations[fileType];
			associationsChanged = true;
		}
	}

	if (associationsChanged) {
		await setSetting('fileTypeAssociations', fileTypeAssociations);
	}

	let registry = await getSetting('full', "AppRegistry.json");

	for (let key in registry) {
		if (!await window.parent.getFileNameByID(key)) {
			window.parent.remSettingKey(key, "AppRegistry.json")
			continue;
		}
	}
}
async function getAllValidAppIds() {
	const appsFolder = await getFileNamesByFolder('Apps/');
	return Object.keys(appsFolder || {}).map(appFileName => appsFolder[appFileName].id);
}

const removalQueue = new Map();

async function loadtaskspanel() {
	let appbarelement = gid("nowrunninapps");
	let currentShortcuts = Array.from(appbarelement.querySelectorAll(".app-shortcut"));
	let currentKeys = currentShortcuts.map(el => el.dataset.key);

	let validKeys = Object.entries(winds)
		.filter(([winID, data]) => data.visualState !== "hidden" || gid("window" + winID) === null)
		.map(([winID, data]) => data.title + winID);

	let now = performance.now();
	if ((window.innerWidth < 500) && validKeys.length > 0) {
		let appShortcutDiv = document.createElement("div");
		appShortcutDiv.className = "app-shortcut ctxAvail tooltip adock sizableuielement";

		appShortcutDiv.addEventListener("click", () => {
			const el = gid("windowscont");
			el.classList.toggle("reselector");

			if (el.classList.contains("hidden")) {
				el.classList.remove("hidden")
			};
		});

		let iconSpan = document.createElement("span");
		iconSpan.classList.add("appicnspan");
		iconSpan.innerHTML = `<span ic class="material-symbols-rounded directxicons">
								select_window
							</span>`

		appShortcutDiv.appendChild(iconSpan);
		appbarelement.innerHTML = "";
		appbarelement.appendChild(appShortcutDiv)
		appbarelement.style.display = "flex";
		return
	}


	for (let element of currentShortcuts) {
		let key = element.dataset.key;
		if (validKeys.includes(key)) continue;
		if (removalQueue.has(key)) continue;

		let addedAt = parseFloat(element.dataset.addedAt) || 0;
		let timeElapsed = now - addedAt;

		if (timeElapsed < 1000) {
			let delay = 1000 - timeElapsed;
			removalQueue.set(key, setTimeout(() => tryRemoveElement(element, key), delay));
		} else {
			tryRemoveElement(element, key);
		}
	}

	let keysToAdd = validKeys.filter(key => !currentKeys.includes(key));

	for (let key of keysToAdd) {
		let app = key.slice(0, -12);
		let wid = key.slice(-12);

		let appShortcutDiv = document.createElement("div");
		appShortcutDiv.className = "app-shortcut ctxAvail tooltip adock sizableuielement";
		appShortcutDiv.setAttribute("unid", app);
		appShortcutDiv.dataset.key = key;
		appShortcutDiv.setAttribute("winid", wid);
		appShortcutDiv.dataset.addedAt = performance.now();

		appShortcutDiv.addEventListener("click", () => {
			putwinontop('window' + wid);
			minim(wid);
		});

		let iconSpan = document.createElement("span");
		iconSpan.classList.add("appicnspan");
		insertSVG((await getAppIcon(0, winds[wid]?.appid)) || defaultAppIcon, iconSpan);

		let tooltip = document.createElement("span");
		tooltip.className = "tooltiptext";
		tooltip.innerText = basename(app);

		appShortcutDiv.appendChild(iconSpan);
		appShortcutDiv.appendChild(tooltip);
		appbarelement.appendChild(appShortcutDiv);
	}

	let visibleShortcuts = appbarelement.querySelectorAll(".app-shortcut");
	if (visibleShortcuts.length === 1) {
		appbarelement.classList.add("closeDockObj");
		setTimeout(() => {
			appbarelement.style.display = validKeys.length > 0 ? "flex" : "none";
			appbarelement.classList.remove("closeDockObj");
		}, 500);
	}
}

function tryRemoveElement(element, key) {
	if (!element.isConnected) {
		removalQueue.delete(key);
		return;
	}

	element.classList.add("closeEffect");
	setTimeout(() => {
		if (element.parentNode) element.parentNode.removeChild(element);
		removalQueue.delete(key);
	}, 500);
}

var dev;
function shrinkbsf(s) {
	return s;
}
function unshrinkbsf(s) {
	return s;
}

async function prepareArrayToSearch() {
	let arrayToSearch = [];
	function scanFolder(folderPath, folderContents) {
		for (let name in folderContents) {
			let item = folderContents[name];
			let fullPath = `${folderPath}${name}`;
			if (item.id) {
				let displayName = mtpetxt(name) == "app" ? basename(name) : name;
				arrayToSearch.push({ name: displayName, id: item.id, type: "file", path: folderPath });
			} else {
				let folderId = folderContents[name]._id || fullPath;
				arrayToSearch.push({ name, id: folderId, type: "folder", path: fullPath });
				scanFolder(fullPath, item);
			}
		}
	}
	scanFolder("", memory["root"]);
	fileslist = arrayToSearch;
}

strtappse = debounce(rlstrtappse, 100);

async function rlstrtappse(event) {
	if (fileslist.length === 0) await prepareArrayToSearch();
	const searchValue = gid("strtsear").value.toLowerCase().trim();
	if (searchValue === "") return;
	const abracadra = await getSetting("smartsearch");
	let maxSimilarity = 0.5;
	let appToOpen = null;
	let mostRelevantItem = null;
	const itemsWithSimilarity = [];
	fileslist.forEach(item => {
		const itemName = item.name.toLowerCase();
		let similarity = abracadra ? calculateSimilarity(itemName, searchValue) : 0;
		if (!abracadra && itemName.startsWith(searchValue)) similarity = 1;
		if (similarity > maxSimilarity) {
			maxSimilarity = similarity;
			appToOpen = item;
		}
		if (similarity >= 0.2) {
			itemsWithSimilarity.push({ item, similarity });
		}
	});

	if (event.key === "Enter") {
		event.preventDefault();
		if (searchValue === "i love nova") {
			closeElementedis(gid("searchwindow"));
			let x = await ask("What can i call you?");
			say("i love you too, " + x);
			return;
		}
		if (appToOpen) {
			if (appToOpen.type === 'folder') {
				useHandler('Files@runnova', { 'opener': 'showDir', 'path': appToOpen.path });
			} else {
				openfile(appToOpen.id);
			}
		}
		return;
	}

	itemsWithSimilarity.sort((a, b) => b.similarity - a.similarity);
	const groupedResults = itemsWithSimilarity.reduce((acc, { item }) => {
		const path = item.path || '';
		if (!acc[path]) acc[path] = [];
		acc[path].push(item);
		return acc;
	}, {});

	gid("strtappsugs").innerHTML = "";
	let elements = 0;
	for (const path in groupedResults) {
		const items = groupedResults[path];
		if (path.length > 0) {
			const pathElement = document.createElement("div");
			pathElement.innerHTML = `<strong>${path}</strong>`;
			gid("strtappsugs").appendChild(pathElement);
		}

		for (const item of items) {
			if (!mostRelevantItem) mostRelevantItem = item;
			const newElement = document.createElement("div");

			let icon;
			if (item.type == "folder") {
				icon = await getAppIcon('folder');
				newElement.innerHTML = `<div>${icon} ${item.path}</div><span class="material-symbols-rounded">arrow_outward</span>`;
				newElement.onclick = () => useHandler('Files@runnova', { 'opener': 'showDir', 'path': item.path });
			} else {
				icon = await getAppIcon(0, item.id);
				newElement.innerHTML = `<div>${icon} ${item.name}</div><span class="material-symbols-rounded">arrow_outward</span>`;
				newElement.onclick = () => openfile(item.id);
			}

			gid("strtappsugs").appendChild(newElement);
			elements++;
		}
	}

	gid("strtappsugs").style.display = "flex";
	if (mostRelevantItem) {
		gid("partrecentapps").style.display = "none";
		document.getElementsByClassName("previewsside")[0].style.display = "flex";
		gid("seapppreview").style.display = "block";
		gid('seprw-icon').innerHTML = await getAppIcon(0, mostRelevantItem.id);
		gid('seprw-appname').innerText = mostRelevantItem.name;
		gid('seprw-openb').onclick = function () {
			if (mostRelevantItem.type === 'folder') {
				useHandler('Files@runnova', { 'opener': 'showDir', 'path': mostRelevantItem.path });
			} else {
				openfile(mostRelevantItem.id);
			}
		};
	} else {
		gid("partrecentapps").style.display = "block";
		gid("seapppreview").style.display = "none";
	}

	if (elements == 0) {
		gid("strtappsugs").innerHTML = `<p style="margin:1em; opacity: 0.5;">No results</p>`;
	}

}

(async () => {
	let appbarelement = document.getElementById("dock");
	let dropZone = appbarelement;
	dropZone.addEventListener('dragover', (event) => {
		event.preventDefault();
	});
	dropZone.addEventListener('drop', async (event) => {
		event.preventDefault();
		const unid = event.dataTransfer.getData("Text");
		await moveFileToFolder(unid, "Dock/");
		genTaskBar();
	});
	dropZone.addEventListener('dragend', (event) => {
		event.preventDefault();
	});
})();

async function realgenTaskBar() {
	gid("dock").style.display = "none";
	gid("novanav").style.display = "grid";

	// nav theme
	try {

		var NovNavCtrl = await getSetting("NovNavCtrl")
		if (NovNavCtrl.bg) {
			gid("novanav").style.backgroundColor = "transparent";
		} else {
			gid("novanav").style.backgroundColor = "var(--col-bg1)";
		}

		gid("novanav").style.justifyContent = NovNavCtrl.align;
	} catch (e) { }

	var appbarelement = document.getElementById("dock");
	appbarelement.innerHTML = "<span class='taskbarloader' id='taskbarloaderprime'></span>";
	if (appbarelement) {
		try {

			let x = await getFileNamesByFolder("Dock");
			if (Array.isArray(x) && x.length === 0) {
				const y = await getFileNamesByFolder("Apps");
				x = (await Promise.all(
					('ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0) ?
						y.filter(item =>
							item.name === "Files.app"
						)
						:
						y.filter(item =>
							item.name === "Files.app" ||
							item.name === "Settings.app" ||
							item.name === "Store.app"
						)

				)).filter(Boolean);
			}
			x.forEach(async function (app, index) {
				index++;
				var islnk = false;

				var appShortcutDiv = document.createElement("biv");
				appShortcutDiv.setAttribute("draggable", true);
				appShortcutDiv.setAttribute("ondragstart", "dragfl(event, this)");
				appShortcutDiv.setAttribute("unid", app.id || '');
				appShortcutDiv.className = "app-shortcut ctxAvail tooltip adock sizableuielement";

				let lnkappidcatched = app.id;
				if (mtpetxt(app.name) == "lnk") {
					app = await getFileById(app.id);
					let z = JSON.parse(decodeBase64Content(app.content));
					app = await getFileById(z.open);
					if (!app) {
						await remfile(lnkappidcatched);
						say("LNK file removed as real file was deleted.");
						genTaskBar();
						return;
					}
					islnk = true;
				}

				var iconSpan = document.createElement("span");
				iconSpan.classList.add("appicnspan");

				var tooltisp = document.createElement("span");
				tooltisp.className = "tooltiptext";
				tooltisp.innerHTML = islnk ? basename(app.name) + `*` : basename(app.name);
				appShortcutDiv.appendChild(iconSpan);
				appShortcutDiv.appendChild(tooltisp);
				appbarelement.appendChild(appShortcutDiv);

				if (!app.id) {
					let folderName = app.name;
					await getAppIcon('folder')
						.then(icon => iconSpan.innerHTML = icon)
						.catch(error => console.error(error));
					appShortcutDiv.addEventListener("click", async () => {

						let filesInFolder = await getFileNamesByFolder(`Dock/${folderName}`);
						console.log(45, filesInFolder, folderName)
						let appIds = filesInFolder.map(file => file.id);
						appGroupModal(folderName, appIds);
					});
				} else {
					await getAppIcon(0, app.id, 0)
						.then(icon => iconSpan.innerHTML = icon)
						.catch(error => console.error(error));
					appShortcutDiv.addEventListener("click", () => openfile(app.id));
				}

			});
			gid("dock").style.display = "flex";

		} catch (err) {
			console.log(err)
		}
		document.querySelector('#taskbarloaderprime').remove();
	}
}

(async () => {
	let dropZone = document.getElementById("desktop");
	dropZone.addEventListener('dragover', (event) => {
		event.preventDefault();
	});
	dropZone.addEventListener('drop', async (event) => {
		event.preventDefault();
		const unid = event.dataTransfer.getData("Text");
		await moveFileToFolder(unid, "Desktop/");
		genDesktop()
	});
	dropZone.addEventListener('dragend', (event) => {
		event.preventDefault();
	});
})();

async function realgenDesktop() {
	gid("desktop").innerHTML = ``;
	let x;
	try {
		let y = await getFileNamesByFolder("Desktop");

		y.forEach(async function (app) {
			var appShortcutDiv = document.createElement("div");
			appShortcutDiv.className = "app-shortcut ctxAvail sizableuielement";
			appShortcutDiv.setAttribute("unid", app.id || '');
			app = await getFileById(app.id);
			let islnk = false;
			if (mtpetxt(app.fileName) == "lnk") {
				let z = JSON.parse(decodeBase64Content(app.content));
				app = await getFileById(z.open);
				islnk = true;
			}
			appShortcutDiv.setAttribute("draggable", true);
			appShortcutDiv.setAttribute("ondragstart", "dragfl(event, this)");
			appShortcutDiv.addEventListener("click", () => openfile(app.id));
			appShortcutDiv.setAttribute("unid", app.id);
			var iconSpan = document.createElement("span");

			iconSpan.classList.add("appicnspan");
			getAppIcon(app.content, app.id).then((icon) => {
				iconSpan.innerHTML = `${icon}`;
			})
			var nameSpan = document.createElement("span");
			nameSpan.className = "appname";
			nameSpan.textContent = islnk ? basename(app.fileName) + `*` : basename(app.fileName);
			appShortcutDiv.appendChild(iconSpan);
			appShortcutDiv.appendChild(nameSpan);
			gid("desktop").appendChild(appShortcutDiv);
		});
		renderWall();
	} catch (error) {
		console.error(error)
	}

}

async function opensearchpanel(preset = "") {
	gid("seapppreview").style.display = "none";
	if (appsHistory.length > 0) {
		gid("partrecentapps").style.display = "block";
	} else {
		gid("partrecentapps").style.display = "none";
		document.querySelector(".previewsside").style.display = "none";
	}
	if (await getSetting("smartsearch")) {
		gid('searchiconthingy').setAttribute("type", "smart")
	} else {
		gid('searchiconthingy').setAttribute("type", "regular")
	}
	if (window.innerWidth > 500) {
		gid("strtsear").focus()
	}
	if (typeof preset === "string") {
		gid("strtsear").value = preset;
	}

	loadrecentapps();
	displayNotifications();
	gid('searchwindow').showModal();
	prepareArrayToSearch()
}

async function checkifpassright() {
	lethalpasswordtimes = true;
	var trypass = gid("loginform1").value;
	if (await checkPassword(trypass)) {
		password = trypass;
		lethalpasswordtimes = false;
		startup();
	} else {
		gid("loginform1").classList.add("thatsnotrightcls");
		setTimeout(function () {
			gid("loginform1").classList.remove("thatsnotrightcls");
		}, 1000)
	}
	gid("loginform1").value = '';
}
async function logoutofnova() {
	await cleanupram();
	await showloginmod();
	removeTheme();
	loginscreenbackbtn();
	console.log("logged out of " + CurrentUsername);
	CurrentUsername = null;
}
async function cleanupram() {
	closeallwindows();
	document.querySelectorAll('dialog[open].onramcloseable').forEach(dialog => dialog.close());
	memory = null;
	CurrentUsername = null;
	password = 'nova';
	winds = {};
	MemoryTimeCache = null;
	lethalpasswordtimes = true;
	dbCache = null;
	cryptoKeyCache = null;
	fileTypeAssociations = {};
	handlers = {};
}
async function setandinitnewuser() {
	gid("edison").showModal()
	await cleanupram();
	CurrentUsername = await ask("Enter a username:", "");
	await initializeOS();
	gid('loginmod').close();
}
async function novarefresh() {
	genDesktop();
	genTaskBar();
	cleanupInvalidAssociations();
	checkdmode();
	loadtaskspanel()
	loadrecentapps();
	sessionSettingsLoaded = false;
	loadSessionSettings();
}
function launchbios() {
	document.getElementById('novasetupusernamedisplay').innerText = CurrentUsername;
	document.getElementById('bios').showModal();
}
function domLoad_checkedgecases() {
	const request = indexedDB.deleteDatabase('trojencat');

	let existed = false;

	request.onblocked = function () { };

	request.onsuccess = function (event) {
		if (event.oldVersion > 0) existed = true;
		if (existed) location.reload();
	};

	request.onerror = function () {
		console.error('Failed to delete database trojencat');
	};
}
document.addEventListener("DOMContentLoaded", async function () {
	sysLog("DOM", "Loaded");
	domLoad_checkedgecases()

	genTaskBar = debounce(realgenTaskBar, 500);
	genDesktop = debounce(realgenDesktop, 500);

	const searchInput5342 = document.querySelector('#novamenusearchinp');
	let keyHeld = false;

	searchInput5342.addEventListener('keydown', () => {
		keyHeld = true;
	});

	searchInput5342.addEventListener('keyup', (e) => {
		if (keyHeld) {
			keyHeld = false;
			opensearchpanel(searchInput5342.value);
			gid('appdmod').close();
			searchInput5342.value = "";
		}
	});
	const scriptSources = [
		// "scripts/utlity.js", // utility and general tools
		// "scripts/sw.js", // service worker for offline access
		// "scripts/system32.js", // system configuration and filesystem management 
		// "scripts/readwrite.js", // storage and memory management 
		"scripts/fflate.js", // data compression
		"scripts/encdec.js", // data encoding and decoding
		"scripts/initialization.js", // first time setup
		"scripts/novagui.js", // additional visual interfaces
		"scripts/kernel.js", // application management and launching
		"scripts/ctxmenu.js", // context menu generation
		"scripts/edgecases.js", // edgecases and error handling
		"scripts/scripties.js", // additional visual enhancements and utlity
		"scripts/windman.js", // novaos window manager
		"scripts/panels.js", // taskbar panels management
		"scripts/ntx.js" // nova transaction exchange config
	];

	const loadScripts = async () => {
		let prog = 10;
		setsrtpprgbr(prog);
		const increment = 40 / scriptSources.length;

		for (const src of scriptSources) {
			await new Promise((resolve, reject) => {
				const script = document.createElement('script');
				script.src = src;
				script.onload = resolve;
				script.onerror = reject;
				document.body.appendChild(script);
			});
			prog += increment;
			setsrtpprgbr(prog);
		}

		setsrtpprgbr(40);
	};

	await loadScripts();

	setbgimagetourl(novaFeaturedImage);

	gid("nowrunninapps").style.display = "none";
	gid('seprw-openb').onclick = function () {
		gid('searchside').style.flexGrow = 1;
	}

	function startfunctions() {
		try {
			updateBattery();
			navigator.getBattery().then(function (battery) {
				battery.addEventListener('levelchange', updateBattery);
			});
		} catch (e) { }

		makedialogclosable('appdmod');

		// hotkeys
		document.addEventListener('keydown', function (event) {
			if (event.ctrlKey && (event.key === 'f' || event.keyCode === 70)) {
				event.preventDefault();
				openapp('files', 1);
			}
			if (event.ctrlKey && (event.key === 's')) {
				event.preventDefault();
				openapp('settings', 1);
			}
		});
		document.addEventListener('keydown', function (event) {
			if (event.key === 'Escape') {
				var appdmod = document.getElementById('appdmod');
				if (appdmod && appdmod.open) {
					appdmod.close();
				}
			}
		});
		document.addEventListener('keydown', function (event) {
			if (event.ctrlKey && event.key === '/') {
				event.preventDefault();
				opensearchpanel();
			}
		});
		document.addEventListener('keydown', function (event) {
			if (event.ctrlKey && event.key === ' ') {
				event.preventDefault();
				openn();
			}
		});

		makedialogclosable('searchwindow');
		prepareArrayToSearch();

		onstartup.push(async () => {
			edgecases();

			if (detectIE()) {
				issues = `<li><b>HTMLDialogElement Not supported: </b> We have taken some efforts to fix this for you.</li>
				<li><b>Internet explorer detected: </b> i dunno what to say ;-;</li>`;
				say(cantusetext + issues + caniuse2 + `<br><b>Anyway, it is so interesting why you still use explorer.</b>`, "failed");
				badlaunch = true;
			}
		});
	}

	startfunctions();
	gid("novanav").style.display = "none";
	async function waitForNonNull() {
		const startTime = Date.now();
		const maxWaitTime = 2000;
		while (Date.now() - startTime < maxWaitTime) {
			const result = await updateMemoryData();
			if (result !== null) {
				return result;
			}
			await new Promise(resolve => setTimeout(resolve, 100));
		}
		return null;
	}
	waitForNonNull().then(async (result) => {
		await checkAndRunFromURL();
		gid('startupterms').innerHTML = "<span>Checking database...</span>";
		try {
			if (result || result == 3) {
				await showloginmod();
			} else {
				await cleanupram();
				CurrentUsername = 'Admin';
				await initializeOS();
			}
		} catch (error) {
			console.error('Error in database operations:', error);
		}
	});

	var bgImage = document.getElementById("bgimage");
	bgImage.addEventListener("click", function () {
		nowapp = '';
	});
});

async function appGroupModal(name, list) {
	const modal = gid("appgrpmodal");
	const listElement = gid("appgrp_list");
	const heading = gid("appgrp_name");

	listElement.innerHTML = '';

	if (name) {
		heading.innerText = name;
		heading.style.display = "block";
	} else {
		heading.style.display = "none";
	}

	if (list) {
		modal.showModal();
	}

	list.forEach(async (appid) => {
		try {
			let app = await getFileById(appid, "fileName");

			var appShortcutDiv = document.createElement("div");
			appShortcutDiv.className = "app-shortcut sizableuielement";
			appShortcutDiv.setAttribute("unid", app.id || '');
			appShortcutDiv.dataset.appId = app.id;
			appShortcutDiv.addEventListener("click", () => openfile(app.id));

			var iconSpan = document.createElement("span");
			iconSpan.classList.add("appicnspan");
			iconSpan.innerHTML = "<span class='taskbarloader'></span>";
			getAppIcon(false, app.id).then((appIcon) => {
				iconSpan.innerHTML = appIcon;
			});

			function getapnme(x) {
				return x.split(".")[0];
			}

			var nameSpan = document.createElement("span");
			nameSpan.className = "appname";
			nameSpan.textContent = getapnme(app.fileName);

			appShortcutDiv.appendChild(iconSpan);
			appShortcutDiv.appendChild(nameSpan);

			listElement.appendChild(appShortcutDiv);
		} catch (err) { console.error(err) }

	})
}