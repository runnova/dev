function timeAgo(ms) {
	if (!ms) return false;
	let sec = Math.floor((Date.now() - ms) / 1000),
		min = Math.floor(sec / 60),
		hr = Math.floor(min / 60),
		day = Math.floor(hr / 24),
		mo = Math.floor(day / 30),
		yr = Math.floor(day / 365);

	return sec < 60 ? `${sec} second${sec === 1 ? '' : 's'} ago` :
		min < 60 ? `${min} minute${min === 1 ? '' : 's'} ago` :
			hr < 24 ? `${hr} hour${hr === 1 ? '' : 's'} ago` :
				day < 30 ? `${day} day${day === 1 ? '' : 's'} ago` :
					mo < 12 ? `${mo} month${mo === 1 ? '' : 's'} ago` :
						yr === 1 ? `a year ago` :
							`${yr} years ago`;
}

function genUID() {
	const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789?!@#$%+';
	let randomString = '';
	for (let i = 0; i < 12; i++) {
		const randomIndex = Math.floor(Math.random() * characters.length);
		randomString += characters.charAt(randomIndex);
	}
	return randomString;
}

function isBase64(str) {
	try {
		function validateBase64(data) {
			const base64Pattern = /^[A-Za-z0-9+/=]+$/;
			if (!base64Pattern.test(data)) {
				return false;
			}
			const padding = data.length % 4;
			if (padding > 0) {
				data += '='.repeat(4 - padding);
			}
			atob(data);
			return true;
		}
		if (validateBase64(str)) {
			return true;
		}
		const base64Prefix = 'data:';
		const base64Delimiter = ';base64,';
		if (str.startsWith(base64Prefix)) {
			const delimiterIndex = str.indexOf(base64Delimiter);
			if (delimiterIndex !== -1) {
				const base64Data = str.substring(delimiterIndex + base64Delimiter.length);
				return validateBase64(base64Data);
			}
		}
		return false;
	} catch (err) {
		return false;
	}
}

function isElement(element) {
	return element instanceof Element || element instanceof HTMLDocument;
}

function decodeBase64Content(str) {
	const base64Prefix = ';base64,';
	const prefixIndex = str.indexOf(base64Prefix);
	if (prefixIndex !== -1) {
		str = str.substring(prefixIndex + base64Prefix.length);
	}
	return isBase64(str) ? atob(str) : str;
}

function getfourthdimension() {
	return Date.now();
}

function getbaseflty(ext) {
	if (mtpetxt(ext) != '') {
		ext = mtpetxt(ext);
	}
	switch (ext) {
		case 'mp3':
		case 'mpeg':
		case 'wav':
		case 'flac':
			return 'music';
		case 'mp4':
		case 'avi':
		case 'mov':
		case 'mkv':
		case 'webm':
			return 'video';
		case 'jpg':
		case 'jpeg':
		case 'png':
		case 'gif':
		case 'bmp':
		case 'webp':
			return 'image';
		case 'txt':
		case 'doc':
		case 'docx':
		case 'pdf':
		case 'html':
			return 'document';
		case 'app':
			return 'app';
		case 'cpp':
		case 'py':
		case 'css':
		case 'js':
		case 'json':
			return 'code'
		case 'html':
			return 'webpage'
		default:
			return ext;
	}
}

function basename(str) {
	try {
		const parts = str.split('.');
		if (parts.length > 1) {
			parts.pop();
			return parts.join('.');
		}
		return str;
	} catch { }
}

function markdownToHTML(html) {
	html = html.replace(/(\*\*)(.*?)\1/g, '<strong>$2</strong>');
	html = html.replace(/(\*|_)(.*?)\1/g, '<em>$2</em>');
	html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
	html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
	html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
	html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
	html = html.replace(/^\s*[-+*] (.*$)/gim, '<li>$1</li>');
	html = html.replace(/```([^`]+)```/g, '<codeblock>$1</codeblock>');
	html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
	html = html.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>');
	html = html.replace(/  \n/g, '<br>');
	html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');
	return html.trim();
}

function stringToPastelColor(str) {
	if (!str) {
		return `rgb(255,255,255)`;
	}
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}

	const r = (hash >> 24) & 0xFF;
	const g = (hash >> 16) & 0xFF;
	const b = (hash >> 8) & 0xFF;


	const pastelR = Math.min(255, r + 100);
	const pastelG = Math.min(255, g + 100);
	const pastelB = Math.min(255, b + 100);

	return `rgb(${pastelR}, ${pastelG}, ${pastelB})`;
}

function stringToDarkPastelColor(str) {
	if (!str) {
		return `rgb(50,50,50)`;
	}
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}

	const r = (hash >> 24) & 0xFF;
	const g = (hash >> 16) & 0xFF;
	const b = (hash >> 8) & 0xFF;

	const darkPastelR = Math.max(50, r - 100);
	const darkPastelG = Math.max(50, g - 100);
	const darkPastelB = Math.max(50, b - 100);

	return `rgb(${darkPastelR}, ${darkPastelG}, ${darkPastelB})`;
}

function mtpetxt(str) {
	if (!str) {
		return;
	}
	try {
		const parts = str.split('.');
		return parts.length > 1 ? parts.pop() : '';
	} catch (err) {
		console.error(err)
	}
}

function toTitleCase(str) {
	return str.replace(/\w\S*/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

function ercache() {
	window.top.appicns = {};
	window.top.memory = {};
}

function getRandomNothingQuote() {
	const nothingquotes = [
		"Seems like theres nothing in here...",
		"Nothing, yea, nothing to see here...",
		"Trust me, i looked, there's nothing here...",
		"Nope, can't find anything here...",
		"There's nothing in here, not even a UFO...",
		"Nothing here, i saw someone take all of it...",
		"Not anything in here..."
	]

	return nothingquotes[Math.floor(Math.random() * nothingquotes.length)]
}

var sysLogHeading;
function sysLog(heading, description) {
	if (sysLogHeading == heading) {
		rllog(`%c.%c${description}`, 'background:: ' + stringToDarkPastelColor(heading) + '; color: ' + stringToDarkPastelColor(heading) + '; font-weight:bolder; padding:0 4px; margin-right: .5em; border-radius: .5em;', 'color: grey;',);
	} else {
		rllog(`%c${heading}%c${description}`, 'color: white; background:: ' + stringToDarkPastelColor(heading) + '; font-size: 0.5em; padding: .2rem .6em; margin-right: .5em; border-radius: .5em;', 'color: grey;',);
	}
	sysLogHeading = heading;
}

const rllog = console.log;
console.log = function (...args) {
	try {
		sysLogHeading = null;
		const stack = new Error().stack;
		const caller = stack.split('\n')[2].trim();
		const match = caller.match(/at (\S+)/);
		const source = match ? (match[1].startsWith('http') ? 'system' : match[1]) : 'anonymous';
		const style = 'font-size: 0.8em; color:grey;';
		rllog(`%c${source}\n`, style, ...args);
	} catch { }
};

const debounceMap = new Map();

function debounce(func, delay = 300) {
	return function (...args) {
		const key = func.name;

		if (debounceMap.has(key)) {
			clearTimeout(debounceMap.get(key).timeout);
		}

		let resolvePromise;
		const promise = new Promise((resolve) => {
			resolvePromise = resolve;
		});

		const timeout = setTimeout(async () => {
			debounceMap.delete(key);
			const result = await func(...args);
			resolvePromise(result);
		}, delay);

		debounceMap.set(key, { timeout, promise });

		return promise;
	};
}
function createBlobFromBase64(base64Data, mimeType) {
	let byteString = atob(base64Data.split(',')[1]);
	let ab = new ArrayBuffer(byteString.length);
	let ia = new Uint8Array(ab);
	for (let i = 0; i < byteString.length; i++) {
		ia[i] = byteString.charCodeAt(i);
	}
	return new Blob([ab], { type: mimeType });
}

function insertSVG(svgString, targetElement) {
	const parser = new DOMParser();
	const svgDoc = parser.parseFromString(svgString, "image/svg+xml").documentElement;
	targetElement.innerHTML = "";
	targetElement.appendChild(svgDoc);
}
function createSafeHTMLRenderer(targetElement) {
	const host = document.createElement('div');
	const shadow = host.attachShadow({ mode: 'closed' });
	targetElement.appendChild(host);

	return {
		render(html) {
			const cleanNode = DOMPurify.sanitize(html, {
				ALLOWED_TAGS: ['style', 'div', 'p', 'span', 'b', 'i', 'u', 'ul', 'ol', 'li', 'a', 'br', 'input', 'button', 'img', 'code', 'pre', 'h1', 'h2', 'h3', 'blockquote', 'select'],
				ALLOWED_ATTR: ['href', 'title', 'alt', 'target'],
				ALLOW_UNKNOWN_PROTOCOLS: false,
				FORCE_BODY: true,
				RETURN_DOM: true,
				RETURN_DOM_FRAGMENT: true
			});
			shadow.innerHTML = '';
			shadow.appendChild(cleanNode);
		},
		clear() {
			shadow.innerHTML = '';
		}
	};
}

async function navGetBattery() {
	if (!('getBattery' in navigator)) return { supported: false, level: 0, charging: false };
	const battery = await navigator.getBattery();
	return { supported: true, level: battery.level, charging: battery.charging };
}


function getapnme(x) {
	return x.split(".")[0];
}

const jsonToDataURI = json => `data:application/json,${encodeURIComponent(JSON.stringify(json))}`;

function isBase64(str) {
	try {
		function validateBase64(data) {
			const base64Pattern = /^[A-Za-z0-9+/=]+$/;
			if (!base64Pattern.test(data)) {
				return false;
			}
			const padding = data.length % 4;
			if (padding > 0) {
				data += '='.repeat(4 - padding);
			}
			atob(data);
			return true;
		}
		if (validateBase64(str)) {
			return true;
		}
		const base64Prefix = 'data:';
		const base64Delimiter = ';base64,';
		if (str.startsWith(base64Prefix)) {
			const delimiterIndex = str.indexOf(base64Delimiter);
			if (delimiterIndex !== -1) {
				const base64Data = str.substring(delimiterIndex + base64Delimiter.length);
				return validateBase64(base64Data);
			}
		}
		return false;
	} catch (err) {
		return false;
	}
}

function calculateSimilarity(string1, string2) {
	const m = string1.length;
	const n = string2.length;
	const dp = Array.from(Array(m + 1), () => Array(n + 1).fill(0));
	for (let i = 0; i <= m; i++) {
		for (let j = 0; j <= n; j++) {
			if (i === 0) dp[i][j] = j;
			else if (j === 0) dp[i][j] = i;
			else if (string1[i - 1] === string2[j - 1]) dp[i][j] = dp[i - 1][j - 1];
			else {
				const penalty = (i + j) / (m + n);
				dp[i][j] = 1 + Math.min(dp[i][j - 1], dp[i - 1][j], dp[i - 1][j - 1] + penalty);
			}
		}
	}
	return 1 - dp[m][n] / Math.max(m, n);
}

function containsSmallSVGElement(str) {
	var svgRegex = /^<svg\s*[^>]*>[\s\S]*<\/svg>$/i;
	if (!svgRegex.test(str) || str.length > 10000) return false;

	var idMap = {};
	var idRegex = /\bid="([^"]+)"/g;
	var urlRefRegex = /url\(#([^")]+)\)/g;

	str = str.replace(idRegex, function (match, id) {
		if (!idMap[id]) {
			idMap[id] = 'svguid_' + Math.random().toString(36).substr(2, 8);
		}
		return `id="${idMap[id]}"`;
	});

	str = str.replace(urlRefRegex, function (match, id) {
		return idMap[id] ? `url(#${idMap[id]})` : match;
	});

	return str;
}