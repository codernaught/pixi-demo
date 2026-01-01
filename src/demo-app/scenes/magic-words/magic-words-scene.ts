import * as PIXI from "pixi.js";
import { Scene } from "../../../common/scene";
import { DemoApp } from "../../demo-app";
import { SceneKey } from "../../scene-key";
import { DemoAppHUD } from "../../ui/demo-app-hud";
import { fetchMagicWords, MagicWordsResponse } from "./fetch-magic-words";
import { MagicWordsText } from "./magic-words-text";

const DIALOGUE_MIN_DELAY = 1500;
const DIALOGUE_DELAY_PER_WORD = 200;

/**
 * Potential optimisations:
 *
 * - Generate a texture atlas for avatar textures which are brought in dynamically.
 * - Generate a dynamic bitmap which includes custom emoji glyphs.
 * - Preload assets before scene load.
 * - Cache the fetched data between scene loads.
 */
export class MagicWordsScene extends Scene<DemoApp> {
	private hud = new DemoAppHUD(this.app, {
		onBackButtonPressed: () => this.app.showScene(SceneKey.Menu),
	});

	private magicWordsText = new MagicWordsText(this.app);

	private cachedMagicWordsResponse?: MagicWordsResponse;

	protected async handleInit() {
		this.addChild(this.magicWordsText);
		this.addChild(this.hud);

		if (this.cachedMagicWordsResponse) {
			this.magicWordsText.registerEmojis(this.cachedMagicWordsResponse.emojies);
			this.magicWordsText.registerAvatars(this.cachedMagicWordsResponse.avatars);

			for (let i = 0; i < this.cachedMagicWordsResponse.dialogue.length; i++) {
				const dialogueEntry = this.cachedMagicWordsResponse.dialogue[i];
				await this.magicWordsText.displayText(dialogueEntry);

				const wordDelay = dialogueEntry.text.split(" ").length * DIALOGUE_DELAY_PER_WORD;
				const totalDelay = Math.max(DIALOGUE_MIN_DELAY, wordDelay);
				await this.tween().wait(totalDelay).complete();
			}
		}
	}

	protected async handleLoad() {
		this.displayStatusText("Loading scene assets...");
		await this.loadMagicWordsData();
		this.hideStatusText();
	}

	protected async handleLoadError() {
		this.displayAndLogError("Failed to load scene assets...");
	}

	protected async handleUnload() {
		await this.unloadMagicWordsData();
	}

	/**
	 * Currently a simple fetch and load assets function.
	 * It does not retry on failure or show progress.
	 * It fetches data on every scene load but could easily store it for reuse.
	 */
	private async loadMagicWordsData() {
		this.cachedMagicWordsResponse = await fetchMagicWords();

		const assetsToLoad = [...this.cachedMagicWordsResponse.emojies, ...this.cachedMagicWordsResponse.avatars];

		await PIXI.Assets.load(
			assetsToLoad.map((assetToLoad) => ({
				alias: assetToLoad.name,
				src: assetToLoad.url,
				parser: "texture",
			})),
		);
	}

	private async unloadMagicWordsData() {
		if (this.cachedMagicWordsResponse) {
			await PIXI.Assets.unload([
				...this.cachedMagicWordsResponse.emojies.map((e) => e.name),
				...this.cachedMagicWordsResponse.avatars.map((e) => e.name),
			]);

			delete this.cachedMagicWordsResponse;
		}
	}
}
