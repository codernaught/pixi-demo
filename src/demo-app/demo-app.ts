import { AppBase } from "../common/app-base";
import { Scene } from "../common/scene";
import { SceneKey } from "./scene-key";
import { AceOfShadowsScene } from "./scenes/ace-of-shadows/ace-of-shadows-scene";
import { MagicWordsScene } from "./scenes/magic-words/magic-words-scene";
import { MenuScene } from "./scenes/menu/menu-scene";
import { PhoenixFlameScene } from "./scenes/phoenix-flame/phoenix-flame-scene";

/**
 * Game-specific app class.
 *
 * Expands on the base app class with a basic scene management system.
 *
 * This scene system would ideally be more fully featured in a real app,
 * with proper scene transitions, loading, and unloading of assets via
 * scene configuration data rather than per-scene implementation.
 */
export class DemoApp extends AppBase {
	public scenes: { [key in SceneKey]: typeof Scene<DemoApp> } = {
		[SceneKey.Menu]: MenuScene,
		[SceneKey.AceOfShadows]: AceOfShadowsScene,
		[SceneKey.MagicWords]: MagicWordsScene,
		[SceneKey.PhoenixFlame]: PhoenixFlameScene,
	};

	private currentScene?: Scene<DemoApp>;

	constructor() {
		super({
			// 4K 16:9 reference resolution
			width: 4096,
			height: 2160,
			blend: 1,
			resolutionBreakpoints: [
				// Approximate breakpoints still need refinement and testing on real devices
				{ maxSideSizeThreshold: 0, resolution: 1 },
				{ maxSideSizeThreshold: 1200, resolution: 2 },
			],
		});

		this.preventContextMenu();
	}

	public async showScene(key: SceneKey) {
		if (this.currentScene) {
			this.currentScene.destroy({ children: true });
			delete this.currentScene;
		}

		this.currentScene = new this.scenes[key](this);

		this.root.addChild(this.currentScene);
	}
}
