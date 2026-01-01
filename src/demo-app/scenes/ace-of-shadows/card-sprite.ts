import * as PIXI from "pixi.js";
import { DemoApp } from "../../demo-app";
import { GameObject } from "../../../common/game-object";
import { CARD_FRAME_IDS } from "./constants";

/**
 * Represents a single card sprite (using Graphics as a sprite-like object).
 *
 * Currently a bit redundant, but useful for future expansions (e.g., adding card-specific effects).
 */
export class CardSprite extends GameObject<DemoApp> {
	private static readonly CARD_SCALE_COMPENSATION = 8;

	private cardSprite: PIXI.Sprite;

	constructor(
		app: DemoApp,
		private readonly cardIndex: number,
	) {
		super(app);

		const frameID = CARD_FRAME_IDS[this.cardIndex % CARD_FRAME_IDS.length];
		this.cardSprite = PIXI.Sprite.from(app.getFrame("textures/cards", frameID));
		this.cardSprite.anchor.set(0.5);

		// Card sprites are 8bit style textures and scaled up with nearest neighbor algorithm
		this.cardSprite.scale.set(CardSprite.CARD_SCALE_COMPENSATION);

		this.addChild(this.cardSprite);
	}
}
