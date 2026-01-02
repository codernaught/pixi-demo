import * as PIXI from "pixi.js";
import { ResizeEventData } from "../../common/app-base";
import { GameObject } from "../../common/game-object";
import { UiTextButton } from "../../common/ui/ui-text-button";
import { DEFAULT_TEXT_STYLE } from "../constants";
import { DemoApp } from "../demo-app";

const BUTTON_PADDING = 128;

export interface DemoAppHudOptions {
	/** Callback function to be called when the back button is pressed */
	onBackButtonPressed: () => void;
}

/** Demo App HUD with a back button in the top left corner. */
export class DemoAppHUD extends GameObject<DemoApp> {
	private backButton: UiTextButton;
	private options: DemoAppHudOptions;

	constructor(app: DemoApp, options: DemoAppHudOptions) {
		super(app);

		this.options = options;

		// Create back button
		this.backButton = new UiTextButton(app, {
			text: "Back",
			textureUp: PIXI.Texture.WHITE,
			textureDown: PIXI.Texture.WHITE,
			textStyle: {
				...DEFAULT_TEXT_STYLE,
				...{ fontSize: 96 },
			},
		});

		// Add click handler
		this.backButton.on("pointertap", this.handleBackButtonPress, this);

		this.addChild(this.backButton);
	}

	private handleBackButtonPress() {
		if (this.options.onBackButtonPressed) {
			this.options.onBackButtonPressed();
		}
	}

	protected handleResize({ width, height }: ResizeEventData) {
		this.backButton.position.set(-width / 2 + BUTTON_PADDING + 60, -height / 2 + BUTTON_PADDING + 30);
	}
}
