import * as PIXI from "pixi.js";
import { AppBase, ResizeEventData } from "./app-base";
import { TypedEmitter } from "./typed-emitter";
import { Tween } from "./tween";
import { TweenGroup } from "./tween-group";
import { TweenOptions } from "./tween-props";

// These are copied from the Container inline type.
export type GameObjectDestroyOptions = {
	children?: boolean;
	texture?: boolean;
	baseTexture?: boolean;
};

/** The start of a core component class. */
export class GameObject<T extends AppBase> extends PIXI.Container {
	/** Pixi application reference. */
	public app: T;

	/** Reference to audio manager instance. */
	public get audio() {
		return this.app.audio;
	}

	public readonly onInit = new TypedEmitter();
	public readonly onDestroy = new TypedEmitter();

	protected readonly tweenGroup = new TweenGroup(false, 1);

	protected loadError?: unknown;

	/**
	 * Core app component class helps manage linkages to core systems.
	 *
	 * @param app - Pixi application reference.
	 */
	constructor(app: T) {
		super();

		this.app = app;

		// Defer load to the next tick.
		this.app.ticker.addOnce(async () => {
			try {
				await this.handleLoad?.();
			} catch (error) {
				console.error("Error during component load:", error);
				this.loadError = error;
				this.handleLoadError?.(error);
			} finally {
				this.ready();
			}
		});
	}

	public ready() {
		// Call init function if it exists.
		if (this.handleInit) {
			this.onInit.emit();
			this.handleInit();
		}

		// Call resize function if it exists.
		if (this.handleResize) {
			this.handleResize(this.app);
		}

		// Add listeners
		if (this.handleUpdate) {
			this.app.onUpdate.on(this.handleUpdate, this);
		}

		if (this.handleResize) {
			this.app.onResize.on(this.handleResize, this);
		}
	}

	public destroy(options?: GameObjectDestroyOptions) {
		if (this.handleUpdate) this.app.onUpdate.off(this.handleUpdate, this);
		if (this.handleResize) this.app.onResize.off(this.handleResize, this);
		if (this.handleUnload) {
			try {
				this.handleUnload();
			} catch (error) {
				this.handleUnloadError?.(error);
			}
		}

		this.clearTweens();

		this.onDestroy.emit();

		super.destroy(options);
	}

	public clearTweens() {
		this.tweenGroup.reset(true);
	}

	protected tween<T>(target: T = {} as T, options?: TweenOptions): Tween<T> {
		const tween = this.tweenGroup.get(target, options);
		return tween;
	}

	protected delay(time: number) {
		return new Promise((resolve) => this.tween(this).wait(time).call(resolve));
	}

	/**
	 * Init method is called after app ready event. If app is already ready, it
	 * runs during the constructor.
	 */
	protected handleInit?(): void;

	/**
	 * Optional method called on update.
	 *
	 * @param dt - Frame delta time.
	 */
	protected handleUpdate?(dt: number): void;

	/**
	 * Optional method called on resize. Note, this is called once after init
	 * regardles of wether the app has resized or not.
	 *
	 * @param width - App virtual width.
	 * @param height - App virtual height.
	 */
	protected handleResize?(data: ResizeEventData): void;

	/**
	 * Optional method called on destroy.
	 */
	protected async handleUnload?(): Promise<void>;

	/**
	 * Optional method called on unload.
	 */
	protected handleUnloadError?(error: unknown): Promise<void>;

	/**
	 * Optional method called on load.
	 */
	protected async handleLoad?(): Promise<void>;

	/**
	 * Optional method called on load error.
	 */
	protected handleLoadError?(error: unknown): Promise<void>;
}
