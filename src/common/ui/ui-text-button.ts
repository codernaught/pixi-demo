import defaults from "lodash-es/defaults";
import * as PIXI from "pixi.js";
import { AppBase } from "../app-base";
import { UiButton, ButtonOptions } from "./ui-button";

export interface ButtonTextOptions extends Partial<PIXI.TextStyle>, ButtonOptions {
	text: string;
	textStyle: PIXI.TextStyleOptions;
}

export const ButtonTextOptionDefaults: ButtonTextOptions = {
	textureUp: PIXI.Texture.WHITE,
	textureDown: PIXI.Texture.WHITE,
	textStyle: {
		fontSize: 32,
		fontFamily: "Arial",
	},
	text: "",
};

export class UiTextButton extends UiButton {
	public get text(): string {
		return this.labelText.text;
	}
	public set text(value: string) {
		this.labelText.text = value;
	}

	private options: ButtonTextOptions;
	private labelText: PIXI.Text;

	constructor(app: AppBase, options: ButtonTextOptions) {
		super(app, options);

		this.options = defaults(options, ButtonTextOptionDefaults);

		this.labelText = new PIXI.Text({
			text: this.options.text,
			style: this.options.textStyle,
		});
		this.labelText.text = this.options.text || "";
		this.labelText.anchor.set(0.5);
		this.labelText.y = -10;

		this.addChild(this.labelText);

		this.on("pointerdown", () => this.labelText.scale.set(0.9));
		this.on("pointerout", () => this.labelText.scale.set(1));
		this.on("pointerup", () => this.labelText.scale.set(1));
	}
}
