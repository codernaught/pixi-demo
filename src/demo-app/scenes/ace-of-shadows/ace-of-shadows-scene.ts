import * as PIXI from "pixi.js";
import { ResizeEventData } from "../../../common/app-base";
import { Ease } from "../../../common/ease";
import { Scene } from "../../../common/scene";
import { lerp } from "../../../maths/lerp";
import { DemoApp } from "../../demo-app";
import { SceneKey } from "../../scene-key";
import { DemoAppHUD } from "../../ui/demo-app-hud";
import { CardSprite } from "./card-sprite";
import { CardData, CardMoveEvent, CardsController } from "./cards-controller";
import { ANIMATION_DURATION, DECK_STACKING_OFFSET } from "./constants";

const CARDS_ATLAS_PATH = "textures/cards";

export class AceOfShadowsScene extends Scene<DemoApp> {
	private hud = new DemoAppHUD(this.app, {
		onBackButtonPressed: () => this.app.showScene(SceneKey.Menu),
	});

	private cardsController = new CardsController();

	private cardSprites = new Map<number, CardSprite>();

	private stack1Container = new PIXI.Container();
	private stack2Container = new PIXI.Container();

	/**
	 * Get the local position of a card in a deck based on its index in the stack.
	 * Assumes cards are stacked with a fixed rotation.
	 */
	public static getLocalCardDeckPosition(indexIndStack: number) {
		return {
			x: -indexIndStack * DECK_STACKING_OFFSET,
			y: -indexIndStack * DECK_STACKING_OFFSET,
		};
	}

	protected handleInit() {
		// Create containers for the two stacks
		this.stack1Container.sortableChildren = true;
		this.addChild(this.stack1Container);

		this.stack2Container.sortableChildren = true;
		this.addChild(this.stack2Container);

		this.cardsController.onCardsInitialized.once(this.handleCardsInitialized, this);
		this.cardsController.onCardMove.on(this.handleCardMove, this);
		this.cardsController.init(this.tweenGroup);

		this.addChild(this.hud);
	}

	protected async handleLoad() {
		this.displayStatusText("Loading scene assets...");

		await this.app.addAtlas(CARDS_ATLAS_PATH, 1);

		// Ideally this would be configurable per texture/atlas, but for demo purposes we'll just set it here.
		const cardsAtlas = this.app.getAtlas(CARDS_ATLAS_PATH);
		cardsAtlas.textureSource.style.scaleMode = "nearest";

		this.hideStatusText();
	}

	protected async handleLoadError() {
		this.displayAndLogError("Failed to load scene assets...");
	}

	protected async handleUnload(): Promise<void> {
		await PIXI.Assets.unload(CARDS_ATLAS_PATH);
	}

	private handleCardsInitialized(cards: CardData[]) {
		// Create sprites for all cards
		for (let i = 0; i < cards.length; i++) {
			const cardData = cards[i];

			const sprite = new CardSprite(this.app, i);
			this.cardSprites.set(cardData.index, sprite);

			// Add to appropriate container based on initial stack
			if (cardData.stackId === 1) {
				this.stack1Container.addChild(sprite);
			} else {
				this.stack2Container.addChild(sprite);
			}

			// Position based on stack position
			sprite.position.copyFrom(AceOfShadowsScene.getLocalCardDeckPosition(cardData.indexInStack));
			sprite.zIndex = cardData.indexInStack;
		}
	}

	private handleCardMove(event: CardMoveEvent) {
		const sprite = this.cardSprites.get(event.cardData.index);
		if (!sprite) return;

		this.app.audio.play("card_flap", { volume: 0.33, transpose: 6 + Math.random() * 2 });
		this.app.audio.play("swish", { volume: 0.33, delay: 0.3, transpose: Math.random() * 2 });

		const fromContainer = event.fromStackId === 1 ? this.stack1Container : this.stack2Container;
		const toContainer = event.toStackId === 1 ? this.stack1Container : this.stack2Container;

		const globalSpritePosition = fromContainer.toGlobal(sprite.position, undefined, true);
		const fromPositionLocalToRoot = this.toLocal(globalSpritePosition, undefined, undefined, true);

		const toPositionLocalToStack = AceOfShadowsScene.getLocalCardDeckPosition(event.toStackIndex);

		sprite.position.copyFrom(fromPositionLocalToRoot);
		sprite.rotation = fromContainer.rotation;

		this.addChild(sprite);

		const animationProgress = { value: 0 };

		const tween = this.tween(animationProgress).to({ value: 1 }, ANIMATION_DURATION * 0.9, Ease.quadOut);

		tween.on("change", () => {
			// Could be more efficient by caching the global position, but this will update correctly if containers move during animation
			// which they can do in a more complex scenario or when the browser window is resized
			const toPositionLocalToRoot = this.toLocal(toContainer.toGlobal(toPositionLocalToStack), undefined, undefined, true);

			const easedProgress = Ease.sineInOut(animationProgress.value);
			sprite.x = lerp(fromPositionLocalToRoot.x, toPositionLocalToRoot.x, easedProgress);
			sprite.y = lerp(fromPositionLocalToRoot.y, toPositionLocalToRoot.y, easedProgress);

			const scaleOffset = (-Math.abs(easedProgress - 0.5) + 0.5) * 0.75;
			sprite.scale.set(1 + scaleOffset);

			sprite.rotation = Math.PI * 2 * easedProgress;
		});

		tween.on("complete", () => {
			toContainer.addChild(sprite);
			sprite.position.copyFrom(toPositionLocalToStack);
			sprite.zIndex = event.toStackIndex;
			sprite.rotation = 0;
		});
	}

	protected handleResize({ width }: ResizeEventData) {
		this.stack1Container.position.set(-width * 0.15, 0);
		this.stack2Container.position.set(width * 0.15, 0);
	}
}
