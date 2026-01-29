async function initializeOS() {
	if (badlaunch) { return }
	dbCache = null;
	cryptoKeyCache = null;
	await say(`
		<h2 style="margin: 0">This is an open source system</h2>
		<p style="">NovaOS uses several browser APIs to store, manage and display data.
		</p>
		<div style="background:: #001b00; color: lightgreen; padding: 0.8em; border: 1px solid #254625;font-size:inherit; border-radius: .5em; margin: 0rem 0; display: flex;flex-direction:row; align-items: center; justify-content: flex-start;gap:0.5em;">
			<span class="material-symbols-rounded">check</span>
			<div>We do not store or share your personal information.</div>
		</div>
	`, "success");
	console.log("Setting Up NovaOS\n\nUsername: " + CurrentUsername + "\nWith: Sample preset\nUsing host: " + location.href)
	initialization = true
	memory = {
		"root": {
			"Downloads/": {
			},
			"Apps/": {},
			"Desktop/": {},
			"Dock/": {},
			"Media/": {}
		}
	};

	setdb().then(async function () {
		await saveMagicStringInLocalStorage(password);
		await ensureAllSettingsFilesExist()
			.then(async () => await installdefaultapps())
			.then(async () => getFileNamesByFolder("Apps"))
			.catch(error => {
				console.error("Error during initialization:", error);
			})
			.then(async () => {
				sharedStore.set(CurrentUsername, "icon", "data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22utf-8%22%3F%3E%3Csvg%20fill%3D%22%23ffffff%22%20width%3D%22800px%22%20height%3D%22800px%22%20viewBox%3D%220%200%20256%20256%22%20id%3D%22Flat%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M228%2C128A100%2C100%2C0%2C1%2C0%2C60.71%2C201.90967a3.97048%2C3.97048%2C0%2C0%2C0%2C.842.751%2C99.79378%2C99.79378%2C0%2C0%2C0%2C132.8982-.00195%2C3.96558%2C3.96558%2C0%2C0%2C0%2C.83813-.74756A99.76267%2C99.76267%2C0%2C0%2C0%2C228%2C128ZM36%2C128a92%2C92%2C0%2C1%2C1%2C157.17139%2C64.87207%2C75.616%2C75.616%2C0%2C0%2C0-44.50782-34.04053%2C44%2C44%2C0%2C1%2C0-41.32714%2C0%2C75.61784%2C75.61784%2C0%2C0%2C0-44.50782%2C34.04A91.70755%2C91.70755%2C0%2C0%2C1%2C36%2C128Zm92%2C28a36%2C36%2C0%2C1%2C1%2C36-36A36.04061%2C36.04061%2C0%2C0%2C1%2C128%2C156ZM68.86475%2C198.417a68.01092%2C68.01092%2C0%2C0%2C1%2C118.27.00049%2C91.80393%2C91.80393%2C0%2C0%2C1-118.27-.00049Z%22%2F%3E%3C%2Fsvg%3E")
				nonotif = false;
				setSetting("narrowMode", matchMedia('(max-width: 500px)').matches);
				await startup();
				let textcontentwelcome = await fetch("appdata/welcome.html");
				textcontentwelcome = await textcontentwelcome.text();
				await createFile('Downloads/', 'Welcome.html', 'html', textcontentwelcome)
				notify("Welcome to NovaOS, " + CurrentUsername + "!", "I really think you'd enjoy it!", "NovaOS");
				initialization = false;
			})
	})
} async function updateApp(appName, attempt = 1) {
	try {
		const filePath = "appdata/" + appName + ".html";
		const response = await fetch(filePath);
		if (!response.ok) {
			throw new Error("Failed to fetch file for " + appName);
		}
		const fileContent = await response.text();

		return await createFile("Apps/", toTitleCase(appName), "app", fileContent);
	} catch (error) {
		console.error("Error updating " + appName + ":", error.message);
		if (attempt < maxRetries) {
			return await updateApp(appName, attempt + 1);
		} else {
			console.error("Max retries reached for " + appName + ". Skipping update.");
			failedApps.push(appName);
			return false;
		}
	}
}
async function installdefaultapps() {
	nonotif = true;
	gid("edison").showModal();
	gid("lazarus").showModal()
	if (gid('startupterms')) {
		gid('startupterms').innerText = "Just a moment...";
	}
	gid("appdmod").close();
	setTimeout(() => gid("lazarus").classList.add("closeEffect"), 2700);
	setTimeout(() => gid("lazarus").close(), 3000);

	const failedApps = [];
	async function waitForNonNull() {
		let result = null;
		while (result === null) {
			result = await updateMemoryData();
			if (result === null) {
				gid('startupterms').innerText = "Waiting for DB to open...";
				await new Promise(resolve => setTimeout(resolve, 1000));
			}
		}
		return result;
	}

	await waitForNonNull().then(async () => {
		const hangMessages = ["Hang in tight...", "Almost there...", "Just a moment more...", "Patience, young grasshopper...", "await fellow padawan...", "Let's see if the stars are with us today...", "what's the meaning of it all...", "just a sec, let me get ready...", "So, what have you been doing lately?", "What are you doing after this?", "Some apps aren't installing, i'm trying again...", "Let's take it slow and precise right?"];

		const interval = setInterval(() => {
			const randomIndex = Math.floor(Math.random() * hangMessages.length);
			gid('startupterms').innerText = hangMessages[randomIndex];
		}, 2500);


		let lclver = await getSetting("versions", "defaultApps.json") || {};

		for (let i = 0; i < defAppsList.length; i++) {
			await new Promise(res => setTimeout(res, 300));
			const appName = defAppsList[i];
			const updated = await Promise.race([updateApp(appName), new Promise(res => setTimeout(res, 3000))]);
			if (updated && updated.id) {
				lclver[appName] = { version: fetchupdatedataver[appName] || 0, appid: updated.id };
			}
			setsrtpprgbr(Math.round((i + 1) / defAppsList.length * 100));
		}
		await setSetting("versions", lclver, "defaultApps.json");

		clearInterval(interval);

		if (failedApps.length > 0) {
			const response = await say(failedApps.length + " apps failed to download. This might be an internet issue, retry?");
			if (response === "yes" || response === true) {
				const stillFailed = [];
				for (let i = 0; i < failedApps.length; i++) {
					const appName = failedApps[i];
					const updated = await updateApp(appName, 1);
					if (updated && updated.id) {
						lclver[appName] = { version: fetchupdatedataver[appName] || 0, appid: updated.id };
					} else {
						stillFailed.push(appName);
					}
				}
				await setSetting("versions", lclver, "defaultApps.json");
				if (stillFailed.length > 0) {
					console.error("These apps still failed after retry:", stillFailed);
					await say("Some apps still failed to download: " + stillFailed.join(", "));
				}
			}
		}
		if (!initialization) {
			closeElementedis();
		}
	});
}