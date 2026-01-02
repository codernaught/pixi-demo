import * as PIXI from "pixi.js";
import { ResizeEventData } from "../../../common/app-base";
import { Scene } from "../../../common/scene";
import { UiTextButton } from "../../../common/ui/ui-text-button";
import { DEFAULT_TEXT_STYLE } from "../../constants";
import { DemoApp } from "../../demo-app";
import { SceneKey } from "../../scene-key";

const BUTTON_SPACING = 240;

// Create buttons for each scene (excluding Menu itself)
const SCENE_BUTTONS: ReadonlyArray<{ readonly key: SceneKey; readonly label: string }> = [
	{ key: SceneKey.AceOfShadows, label: "Ace of Shadows" },
	{ key: SceneKey.MagicWords, label: "Magic Words" },
	{ key: SceneKey.PhoenixFlame, label: "Phoenix Flame" },
];

export class MenuScene extends Scene<DemoApp> {
	private readonly sceneButtons: UiTextButton[] = [];

	private readonly titleText = new PIXI.Text({
		text: "Select a Scene",
		style: { ...DEFAULT_TEXT_STYLE, ...{ fontSize: 148 } },
	});

	protected handleInit() {
		// Create title
		this.titleText.anchor.set(0.5);
		this.addChild(this.titleText);

		SCENE_BUTTONS.forEach((scene) => {
			const button = new UiTextButton(this.app, {
				text: scene.label,
				textureUp: PIXI.Texture.WHITE,
				textureDown: PIXI.Texture.WHITE,
				textStyle: { ...DEFAULT_TEXT_STYLE, ...{ fontSize: 96 } },
			});

			button.on("pointertap", () => {
				this.app.showScene(scene.key);
			});

			this.sceneButtons.push(button);
			this.addChild(button);
		});
	}

	protected handleResize({ height }: ResizeEventData) {
		// Position title at the top
		this.titleText.position.set(0, -height * 0.3);

		// Position buttons vertically in the center
		const totalHeight = (this.sceneButtons.length - 1) * BUTTON_SPACING;
		const startY = -totalHeight / 2;

		this.sceneButtons.forEach((button, index) => {
			button.position.set(0, startY + index * BUTTON_SPACING);
		});
	}
}
