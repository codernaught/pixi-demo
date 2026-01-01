import * as PIXI from "pixi.js";

import { GameObject } from "./game-object";
import { AppBase } from "./app-base";

const STATUS_TEXT_STYLE: PIXI.TextStyleOptions = {
	fill: "#ffffff",
	fontFamily: "monospace",
	fontSize: 48,
	wordWrap: true,
	wordWrapWidth: 800,
	align: "left",
};

/**
 * Engine-level scene class.
 *
 * This does not have any game-specific logic, that should go in subclasses.
 */
export class Scene<T extends AppBase> extends GameObject<T> {
	protected statusText = new PIXI.Text({ text: "", style: STATUS_TEXT_STYLE });

	constructor(app: T) {
		super(app);

		this.statusText.anchor.set(0.5);
		this.statusText.visible = false;
		this.addChild(this.statusText);
	}

	protected displayAndLogError(error: unknown) {
		if (typeof error === "string") {
			this.displayStatusText(error, 0xff0000);
		} else if (error instanceof Error) {
			this.displayStatusText(error.message, 0xff0000);
		}

		console.error(error);
	}

	protected hideStatusText() {
		this.statusText.visible = false;
	}

	protected displayStatusText(status: string, color: number = 0xffffff) {
		this.statusText.visible = true;
		this.statusText.text = status;
		this.statusText.tint = color;
	}
}
