// CreateJS lib imports.
// this is the only package that uses global namespaces due to legacy support.
import "tweenjs/lib/tweenjs";
import "../libs/tween-group";
createjs.Ticker.timingMode = createjs.Ticker.RAF;
createjs.Ticker.maxDelta = 100;

import { DemoApp } from "./demo-app/demo-app";
import { SceneKey } from "./demo-app/scene-key";
import * as audioManifest from "./demo-app/audio.json";

async function start() {
	setWindowStyle();

	const app = new DemoApp();
	await app.init({ backgroundColor: 0x1f1f1f });
	app.startApp();

	let loadError;

	try {
		await Promise.all([
			// Currently no other assets to load, but audio is needed.
			// More common assets would usually be added here.
			app.audio.init(audioManifest),
		]);
	} catch (err) {
		loadError = err;
	}

	if (loadError) {
		// Handle common asset loading errors.
		// Assumes essential textures could not be loaded.
		console.error("Error loading assets:", loadError);
		showLoadingError(loadError);
	} else {
		// Quick and dirty fullscreen on click implementation.
		// In a real app you'd want a proper UI button for this.
		// This also won't work on iOS Safari due to their restrictions around fullscreen.
		// For that you need to do some workarounds with scrolling and viewport sizing.
		window.document.body.onpointerdown = () => app.requestFullscreen();

		// Add the app canvas to the DOM.
		window.document.body.appendChild(app.canvas);

		// Show the menu scene.
		app.showScene(SceneKey.Menu);
	}
}

function setWindowStyle() {
	window.document.body.style.background = "black";
	window.document.body.style.overflow = "hidden";
	window.document.body.style.margin = "0px";
	window.document.body.style.padding = "0px";
	window.document.body.style.border = "0px";
}

// Quick and dirty dom-based error display.
function showLoadingError(error: unknown) {
	const errorContainer = window.document.createElement("div");
	errorContainer.style.position = "fixed";
	errorContainer.style.top = "50%";
	errorContainer.style.left = "50%";
	errorContainer.style.transform = "translate(-50%, -50%)";
	errorContainer.style.color = "#ff4444";
	errorContainer.style.fontFamily = "Arial, sans-serif";
	errorContainer.style.fontSize = "24px";
	errorContainer.style.textAlign = "center";
	errorContainer.style.padding = "20px";
	errorContainer.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
	errorContainer.style.borderRadius = "10px";
	errorContainer.style.maxWidth = "80%";

	errorContainer.innerHTML = `
		<h2 style="margin: 0 0 10px 0;">Loading Error</h2>
		<p style="margin: 0; font-size: 16px; color: #cccccc;">
			${error instanceof Error ? error.message : String(error)}
		</p>
	`;

	window.document.body.appendChild(errorContainer);
}

if (window.document.readyState === "loading") {
	window.addEventListener("load", start);
} else {
	start();
}
