import { shuffle } from "lodash-es";
import { TweenGroup } from "../../../common/tween-group";
import { TypedEmitter } from "../../../common/typed-emitter";
import { ANIMATION_DURATION, TOTAL_CARDS } from "./constants";

/** Card data model */
export interface CardData {
	index: number;
	stackId: number; // 1 or 2
	indexInStack: number;
}

/** Event data for card movement */
export interface CardMoveEvent {
	cardData: CardData;
	fromStackId: number;
	toStackId: number;
	fromStackIndex: number;
	toStackIndex: number;
}

/** Direction of card movement between stacks */
export enum CardMoveDirection {
	ToStack1 = "toStack1",
	ToStack2 = "toStack2",
}

/** Emits events that the scene can listen to for visual updates */
export class CardsController {
	public readonly onCardMove = new TypedEmitter<CardMoveEvent>();
	public readonly onCardsInitialized = new TypedEmitter<CardData[]>();

	private moveDirection: CardMoveDirection = CardMoveDirection.ToStack2;

	private readonly allCards: CardData[] = [];
	private stack1: CardData[] = [];
	private stack2: CardData[] = [];

	public init(tweenGroup: TweenGroup): void {
		for (let i = 0; i < TOTAL_CARDS; i++) {
			const cardData = { index: i, stackId: 1, indexInStack: i };
			this.allCards.push(cardData);
			this.stack1.push(cardData);
		}

		this.stack1 = this.shuffleStack(this.stack1);

		this.onCardsInitialized.emit(this.allCards);

		tweenGroup.get(this, { loop: -1 }).call(this.moveTopCard.bind(this)).wait(ANIMATION_DURATION);
	}

	private shuffleStack(stack: CardData[]): CardData[] {
		stack = shuffle(stack);

		for (let i = 0; i < stack.length; i++) {
			const cardData = stack[i];
			cardData.indexInStack = i;
		}

		return stack;
	}

	private moveTopCard() {
		if (this.stack1.length === 0 && this.moveDirection === CardMoveDirection.ToStack2) this.moveDirection = CardMoveDirection.ToStack1;
		if (this.stack2.length === 0 && this.moveDirection === CardMoveDirection.ToStack1) this.moveDirection = CardMoveDirection.ToStack2;

		// Determine which stack to move from
		const fromStack = this.moveDirection === CardMoveDirection.ToStack2 ? this.stack1 : this.stack2;
		const toStack = this.moveDirection === CardMoveDirection.ToStack2 ? this.stack2 : this.stack1;
		const fromStackId = fromStack === this.stack1 ? 1 : 2;
		const toStackId = fromStack === this.stack1 ? 2 : 1;

		const cardData = fromStack[fromStack.length - 1];
		const fromStackIndex = cardData.indexInStack;
		const toStackIndex = toStack.length;

		// Update card data
		cardData.stackId = toStackId;
		cardData.indexInStack = toStackIndex;

		// Update stacks
		fromStack.pop();
		toStack.push(cardData);

		// Emit move event
		this.onCardMove.emit({ cardData, fromStackId, toStackId, fromStackIndex, toStackIndex });
	}
}
