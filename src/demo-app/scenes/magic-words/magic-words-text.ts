import * as PIXI from "pixi.js";
import { GameObject } from "../../../common/game-object";
import { DEFAULT_TEXT_STYLE } from "../../constants";
import { DemoApp } from "../../demo-app";
import { AvatarPosition, MagicWordsAvatarData, MagicWordsDialogueEntry, MagicWordsEmojiData } from "./fetch-magic-words";

const TEXT_WIDTH_PERCENTAGE = 0.5;
const TEXT_MAX_WIDTH = 900;

const BUBBLE_Y_PIVOT = 64;
const BUBBLE_PADDING_X = 32;
const BUBBLE_PADDING_Y = 32;

export type MagicWordsTextEmojiData = {
	asset: PIXI.Texture;
};

export type MagicWordsTextAvatarData = {
	avatarData: MagicWordsAvatarData;
	asset: PIXI.Texture;
};

export class MagicWordsText extends GameObject<DemoApp> {
	private wrapWidth: number = 800;

	private avatarPosition: AvatarPosition = "left";

	private readonly emojiDataMap: Map<string, MagicWordsTextEmojiData> = new Map();
	private readonly avatarDataMap: Map<string, MagicWordsTextAvatarData> = new Map();

	private readonly textBubble = new PIXI.Graphics();

	private readonly avatarSprite = new PIXI.Sprite();

	private readonly textDisplay = new PIXI.SplitBitmapText({
		// Split text error when setting to empty string, so use underscore as placeholder
		text: "_",
		style: {
			...DEFAULT_TEXT_STYLE,
			...{
				fontSize: 42,
				lineHeight: 62,
				wordWrapWidth: 800,
				wordWrap: true,
				align: "left",
			},
		},
	});

	/**
	 * Requires avatars to be preloaded via PIXI.Assets before calling
	 *
	 * @param avatarData - Array of avatar data to register
	 */
	public registerAvatars(avatarData: MagicWordsAvatarData[]) {
		this.avatarDataMap.clear();

		avatarData.forEach((avatar) => {
			this.avatarDataMap.set(avatar.name, {
				avatarData: avatar,
				asset: PIXI.Assets.get(avatar.name),
			});
		});
	}

	/**
	 * Requires avatars to be preloaded via PIXI.Assets before calling
	 *
	 * @param emojiData - Array of emoji data to register
	 */
	public registerEmojis(emojiData: MagicWordsEmojiData[]) {
		this.emojiDataMap.clear();

		emojiData.forEach((emoji) => {
			this.emojiDataMap.set(emoji.name, {
				asset: PIXI.Assets.get(emoji.name),
			});
		});
	}

	/**
	 * Generating a bitmap font atlas with custom glyphs would be a more elegant solution
	 * than inserting sprites into words, but this is outside the scope of this demo.
	 */
	public async displayText(dialogue: MagicWordsDialogueEntry) {
		this.wrapWidth = Math.min(this.app.width * TEXT_WIDTH_PERCENTAGE, TEXT_MAX_WIDTH);
		this.textDisplay.pivot.x = this.wrapWidth / 2;
		this.textDisplay.pivot.y = BUBBLE_Y_PIVOT;
		this.textDisplay.style.wordWrapWidth = this.wrapWidth;

		const dialogueWords = dialogue.text.split(" ");

		const emojisToInsert: { index: number; emojiData: MagicWordsTextEmojiData }[] = [];

		this.emojiDataMap.forEach((emojiData, emojiKey) => {
			const emojiTag = `{${emojiKey}}`;

			while (true) {
				const index = dialogueWords.findIndex((word) => word === emojiTag);
				if (index === -1) break;

				dialogueWords[index] = "----";
				emojisToInsert.push({ index, emojiData });
			}
		});

		const preparedText = dialogueWords.join(" ");

		this.textDisplay.text = preparedText;

		this.updateBubbleSizing();

		for (let i = 0; i < emojisToInsert.length; i++) {
			const emojiToInsert = emojisToInsert[i];
			const emojiSprite = new PIXI.Sprite(emojiToInsert.emojiData.asset);
			this.textDisplay.words[emojiToInsert.index].addChild(emojiSprite);
			emojiSprite.anchor.set(0);
			emojiSprite.width = this.textDisplay.style.fontSize * 1.35;
			emojiSprite.height = this.textDisplay.style.fontSize * 1.35;
		}

		const avatarData = this.avatarDataMap.get(dialogue.name);
		if (avatarData) {
			const texture = avatarData.asset;
			this.avatarSprite.texture = texture;
			this.avatarPosition = avatarData.avatarData.position;
			this.updateAvatarPosition();
		} else {
			console.warn(`No avatar data found for name: ${dialogue.name}`);
			this.avatarSprite.texture = PIXI.Texture.EMPTY;
		}

		for (let i = 0; i < this.textDisplay.words.length; i++) {
			const word = this.textDisplay.words[i];
			word.alpha = 0;
		}

		for (let i = 0; i < this.textDisplay.words.length; i++) {
			const word = this.textDisplay.words[i];

			await this.delay(50);

			this.app.audio.play("click", { volume: 0.5 });
			word.alpha = 1;
		}
	}

	protected handleInit(): void {
		this.addChild(this.textBubble);
		this.addChild(this.textDisplay);
		this.addChild(this.avatarSprite);
	}

	protected async handleUnload() {
		// Ensure dynamic bitmap font texture sources are destroyed
		PIXI.Assets.unload(`${this.textDisplay.style.fontFamily}-bitmap`);
	}

	private updateAvatarPosition() {
		this.avatarSprite.anchor.set(0.5, 0.5);

		const avatarSpacing = 150;
		this.avatarSprite.x = this.avatarPosition === "left" ? -this.wrapWidth / 2 - avatarSpacing : this.wrapWidth / 2 + avatarSpacing;

		// Fixed size while retaining aspect ratio
		this.avatarSprite.height = 256;
		this.avatarSprite.width = this.avatarSprite.texture.width * (256 / this.avatarSprite.texture.height);
	}

	private updateBubbleSizing() {
		this.textBubble.clear();
		this.textBubble.roundRect(
			-this.wrapWidth / 2 - BUBBLE_PADDING_X,
			-BUBBLE_Y_PIVOT - BUBBLE_PADDING_Y,
			this.wrapWidth + BUBBLE_PADDING_X * 2,
			this.textDisplay.lines.length * this.textDisplay.style.lineHeight + BUBBLE_PADDING_Y * 2,
		);
		this.textBubble.fill({ color: 0xffffff, alpha: 0.25 });
	}
}
