function makedialogclosable(ok) {
	const myDialog = gid(ok);

	if (!myDialog.__originalClose) {
		myDialog.__originalClose = myDialog.close;
		myDialog.close = function () {
			console.log(342, ok)
			this.classList.add("closeEffect");

			function handler() {
				myDialog.__originalClose();
				myDialog.classList.remove("closeEffect");
			};
			setTimeout(handler, 200);
		};
	}

	document.addEventListener('click', (event) => {
		if (event.target === myDialog) {
			myDialog.close();
		}
	});
}
function openModal(type, { title = '', message, options = null, status = null, preset = '' } = {}, registerRef = false) {
	if (badlaunch) { return }
	return new Promise((resolve) => {
		const modal = document.createElement('dialog');
		modal.classList.add('modal');

		const modalItemsCont = document.createElement('div');
		modalItemsCont.classList.add('modal-items');

		if (status) {
			const icon = document.createElement('span');
			icon.classList.add('material-symbols-rounded');
			let ic = "warning";
			if (status === "success") ic = "check_circle";
			else if (status === "failed") ic = "dangerous";
			icon.textContent = ic;
			icon.classList.add('modal-icon');
			modalItemsCont.appendChild(icon);

		}
		if (title && title.length > 0) {

			const h1 = document.createElement('h1');
			h1.textContent = title;
			modalItemsCont.appendChild(h1);
		}

		const p = document.createElement('p');
		if (type === 'say' || type === 'confirm') {
			p.innerHTML = `${message}`;
		} else {
			p.textContent = message;
		}
		modalItemsCont.appendChild(p);

		let dropdown = null;
		if (type === 'dropdown') {
			dropdown = document.createElement('select');
			let items = Array.isArray(options) ? options : Object.values(options);
			for (const option of items) {
				const opt = document.createElement('option');
				opt.value = option;
				opt.textContent = option;
				dropdown.appendChild(opt);
			}
			modalItemsCont.appendChild(dropdown);
		}

		let inputField = null;
		if (type === 'ask') {
			inputField = document.createElement('input');
			inputField.type = 'text';
			inputField.value = preset;
			modalItemsCont.appendChild(inputField);
		}

		const btnContainer = document.createElement('div');
		btnContainer.classList.add('button-container');
		modalItemsCont.appendChild(btnContainer);

		const yesButton = document.createElement('button');
		yesButton.textContent = type === 'confirm' ? 'Yes' : 'OK';
		btnContainer.appendChild(yesButton);

		if (type === 'confirm' || type === 'dropdown') {
			const noButton = document.createElement('button');
			noButton.textContent = type === 'confirm' ? 'No' : 'Cancel';
			btnContainer.appendChild(noButton);
			noButton.onclick = () => {
				modal.close();
				modal.remove();
				resolve(false);
			};
		}

		yesButton.onclick = () => {
			modal.close();
			modal.remove();
			if (type === 'dropdown') {
				resolve(dropdown.value);
			} else if (type === 'ask') {
				resolve(inputField.value);
			} else {
				resolve(true);
			}
		};

		if (registerRef) {
			document.getElementById("window" + notificationContext[registerRef]?.windowID).querySelectorAll(".windowcontent")[0].appendChild(modal);
			modal.show();
			modal.appendChild(modalItemsCont);
		} else {
			document.body.appendChild(modal);
			modal.appendChild(modalItemsCont);
			modal.showModal();
		}
	});
}

function justConfirm(title, message, registerRef = false) {
	return openModal('confirm', { title, message }, registerRef);
}
function showDropdownModal(title, message, options, registerRef = false) {
	return openModal('dropdown', { title, message, options }, registerRef);
}
function say(message, status = null, registerRef = false) {
	return openModal('say', { message, status }, registerRef);
}
function ask(question, preset = '', registerRef = false) {
	return openModal('ask', { message: question, preset }, registerRef);
}

function setbgimagetourl(x) {
	const img1 = document.getElementById('bgimage1');
	const img2 = document.getElementById('bgimage2');
	if (!img1 || !img2) return;

	const activeImg = currentImage === 1 ? img1 : img2;
	const nextImg = currentImage === 1 ? img2 : img1;

	nextImg.style.opacity = 0;

	const setImageSrc = (url) => {
		nextImg.src = url;
		nextImg.onload = async () => {
			nextImg.style.opacity = 1;
			activeImg.style.opacity = 0;
			activeImg.classList.remove('current-bg');
			nextImg.classList.add('current-bg');
			currentImage = currentImage === 1 ? 2 : 1;

			const wallpos = await getSetting("wallpaperPos") || "center";
			document.getElementsByClassName("current-bg")[0].style.objectPosition = wallpos;
			const wallsiz = await getSetting("wallpaperSiz") || "cover";
			document.getElementsByClassName("current-bg")[0].style.objectFit = wallsiz;
		};
	};

	if (x.startsWith('data:')) {
		try {
			const byteString = atob(x.split(',')[1]);
			const mimeString = x.split(',')[0].split(':')[1].split(';')[0];
			const arrayBuffer = new Uint8Array(byteString.length);

			for (let i = 0; i < byteString.length; i++) {
				arrayBuffer[i] = byteString.charCodeAt(i);
			}

			const blob = new Blob([arrayBuffer], { type: mimeString });
			const blobUrl = URL.createObjectURL(blob);

			setImageSrc(blobUrl);
			setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
		} catch (e) {
			console.error("Failed to decode base64 string:", e);
		}
	} else {
		setImageSrc(x);
	}
}
async function resolveWallSource(x) {
	if (x == null) return;
	if (x.startsWith("http")) return x;
	const f = await getFileById(x);
	return f?.content;
}

async function makewall(deid) {
	const src = await resolveWallSource(deid);
	if (src) setbgimagetourl(src);
	await setSetting("wall", deid);
}

async function renderWall() {
	const x = await getSetting("wall");
	if (x && x.trim()) {
		const src = await resolveWallSource(x);
		if (src) setbgimagetourl(src);
	}
	document.getElementById("bgimage").onerror = async function () {
		toast("It doesn't seem to work as the wallpaper...");
		setbgimagetourl(novaFeaturedImage);
		if (await getSetting("wall")) remSettingKey("wall");
	};
}
eventBusWorker.listen({
	type: "settings",
	event: "set",
	key: "wall",
	callback: () => {
		console.log(342423424)
		setTimeout(() => { loadSessionSettings(); renderWall() }, 1500)
	}
});

let countdown, countdown2;
function startTimer(minutes) {
	document.getElementById("sleepbtns").style.display = "none";
	clearInterval(countdown);
	const now = Date.now();
	const then = now + minutes * 60 * 1000;
	displayTimeLeft(minutes * 60);
	countdown = setInterval(() => {
		const secondsLeft = Math.round((then - Date.now()) / 1000);
		if (secondsLeft <= 0) {
			clearInterval(countdown);
			document.getElementById('sleeptimer').textContent = '00:00';
			playBeeps();
			document.getElementById('sleepwindow').close()
			return;
		}
		displayTimeLeft(secondsLeft);
	}, 1000);
}
function playBeeps() {
	const context = new (window.AudioContext || window.webkitAudioContext)();
	const now = context.currentTime;
	const duration = 0.1;
	const fadeDuration = 0.02;
	const gap = 0.1;
	const pitch = 700;
	const rhythm = [
		[0, 0.2, 0.4, 0.6],
		[1.2, 1.4, 1.6, 1.8],
		[2.4, 2.6, 2.8, 3.0]
	];
	const getOffsetTime = (index, time) => now + time + index * (4 * (duration + gap));
	rhythm.forEach((set, index) => {
		set.forEach(time => {
			const offsetTime = getOffsetTime(index, time);
			const oscillator = context.createOscillator();
			const gainNode = context.createGain();
			oscillator.type = 'triangle';
			oscillator.frequency.setValueAtTime(pitch, offsetTime);
			gainNode.gain.setValueAtTime(0, offsetTime);
			gainNode.gain.linearRampToValueAtTime(1, offsetTime + fadeDuration); // Fade in
			gainNode.gain.linearRampToValueAtTime(0, offsetTime + duration - fadeDuration); // Fade out
			oscillator.connect(gainNode);
			gainNode.connect(context.destination);
			oscillator.start(offsetTime);
			oscillator.stop(offsetTime + duration);
		});
	});
}
async function setMessage() {
	const message = await ask('What should be the message?', 'Do not disturb...');
	document.getElementById('sleepmessage').innerHTML = message;
}

function displayTimeLeft(seconds) {
	const minutes = Math.floor(seconds / 60);
	const remainderSeconds = seconds % 60;
	const display = `${minutes}:${remainderSeconds < 10 ? '0' : ''}${remainderSeconds}`;
	document.getElementById('sleeptimer').textContent = display;
}


async function notify(...args) {
	if (nonotif) { return }
	let appname = "System";
	let [title = "Notification", description = "There is a notification", isid] = args;
	let appID = notificationContext[isid]?.appID;
	appname = (!(appID == undefined)) ? basename(await getFileNameByID(appID)) : appname;

	if (document.getElementById("notification").style.display == "block") {
		document.getElementById("notification").style.display = "none";
		setTimeout(() => notify(title, description, appname), 2500);
	}
	var appnameb = document.getElementById('notifappName');
	var descb = document.getElementById('notifappDesc');
	var titleb = document.getElementById('notifTitle');
	if (appnameb && descb && titleb) {
		appnameb.innerText = appname;
		descb.innerText = description;
		titleb.innerText = title;
		const windValues = Object.values(winds).map(wind => Number(wind.zIndex) || 0);
		const maxWindValue = Math.max(...windValues);
		document.getElementById("notification").style.zIndex = maxWindValue + 1;
		document.getElementById("notification").style.display = "block";
		document.getElementById("notification").onclick = () => {
			openfile(appID);
		}
		setTimeout(function () {
			document.getElementById("notification").style.display = "none";
		}, 5000);
	} else {
		console.error("One or more DOM elements not found.");
	}
	const notificationID = genUID();
	notifLog[notificationID] = { title, description, appname };
	(isid) ? delete notificationContext[isid] : 0;
}

let toastInProgress = false;
let totalDuration = 0;
const maxToastDuration = 5000;
let toastQueue = [];

function toast(text, regref, duration = 5000,) {
	let displayDuration = Math.min(duration, maxToastDuration);

	if (toastInProgress) {
		toastQueue.push({ text, duration: displayDuration });
	} else {
		totalDuration = displayDuration;
		toastInProgress = true;
		displayToast(text, displayDuration, regref);
	}
}

function displayToast(text, duration, regref) {
	var titleb = document.getElementById('toastdivtext');
	if (titleb) {
		titleb.innerText = text;
		(async () => { insertSVG(await getAppIcon(0, notificationContext[regref]?.appID || "info"), document.getElementById('toasticon')); })();

		const windValues = Object.values(winds).map(wind => Number(wind.zIndex) || 0);
		const maxWindValue = Math.max(...windValues);
		document.getElementById("toastdiv").style.zIndex = maxWindValue + 100;
		document.getElementById("toastdiv").classList.add('notifpullanim');
		document.getElementById("toastdiv").style.display = "block";

		setTimeout(function () {
			document.getElementById("toastdiv").classList.remove('closeEffect');
		}, 200);

		document.getElementById("toastdiv").onclick = function () {
			document.getElementById("toastdiv").classList.add('closeEffect');
			document.getElementById("toastdiv").style.display = "none";
			toastInProgress = false;
			if (toastQueue.length > 0) {
				const nextToast = toastQueue.shift();
				displayToast(nextToast.text, nextToast.duration);
			}
		};

		setTimeout(function () {
			document.getElementById("toastdiv").classList.add('closeEffect');
			setTimeout(function () {
				document.getElementById("toastdiv").style.display = "none";
				toastInProgress = false;
				if (toastQueue.length > 0) {
					const nextToast = toastQueue.shift();
					displayToast(nextToast.text, nextToast.duration);
				}
			}, 200);
		}, duration);
	} else {
		console.error("DOM elements not found.");
	}
}

function displayNotifications(x) {
	if (x == "clear") {
		notifLog = {};

	}
	const notifList = document.getElementById("notiflist");
	notifList.innerHTML = "";
	if (Object.values(notifLog).length == 0) {
		document.querySelector(".notiflist").style.display = "none";
	} else {
		document.querySelector(".notiflist").style.display = "flex";
	}
	Object.values(notifLog).forEach(({ title, description, appname }) => {
		const notifDiv = document.createElement("div");
		notifDiv.className = "notification";
		const titleDiv = document.createElement("div");
		titleDiv.className = "notifTitle";
		titleDiv.innerText = title;
		const descDiv = document.createElement("div");
		descDiv.className = "notifDesc";
		descDiv.innerText = description;
		const appNameDiv = document.createElement("div");
		appNameDiv.className = "notifAppName";
		appNameDiv.innerText = appname;
		notifDiv.appendChild(appNameDiv);
		notifDiv.appendChild(titleDiv);
		notifDiv.appendChild(descDiv);
		notifList.appendChild(notifDiv);
	});
}