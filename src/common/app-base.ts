import * as SPINE from "@esotericsoftware/spine-pixi-v8";
import * as PIXI from "pixi.js";
import * as screenfull from "screenfull";
import { lerp } from "../maths/lerp";
import { ToneAudio } from "./tone-audio";
import { Tween } from "./tween";
import { TweenGroup } from "./tween-group";
import { TweenOptions } from "./tween-props";
import { TypedEmitter } from "./typed-emitter";
import { Dict } from "./types";

const LOAD_OPTIONS: PIXI.LoadOptions = {
	strategy: "retry",
	retryDelay: 3,
	retryCount: 10,
};

export const MAX_DPR = 4;
export const MIN_DPR = 0.5;

export interface AppReferenceSize {
	width: number;
	height: number;
	blend: number;
	resolutionBreakpoints: Array<{
		maxSideSizeThreshold: number;
		resolution: number;
	}>;
}

export interface ResizeEventData {
	width: number;
	height: number;
}

/**
 * Engine-level app class.
 *
 * This does not contain any game-specific logic and is intended to be extended by app implementations.
 */
export class AppBase extends PIXI.Application {
	public readonly onInit = new TypedEmitter<void>();
	public readonly onUpdate = new TypedEmitter<number>();
	public readonly onResize = new TypedEmitter<ResizeEventData>();

	/** App audio manager reference */
	public readonly audio = new ToneAudio();

	/** Root container. */
	public readonly root = new PIXI.Container();

	/** Renderer pixel ratio. Use resizeRoot to modify. */
	public get dpr() {
		return this._dpr;
	}
	private _dpr = 1;

	/** Renderer virtual width. Use resizeRoot to modify. */
	public get width() {
		return this._width;
	}
	private _width = 0;

	/** Renderer virtual height. Use resizeRoot to modify. */
	public get height() {
		return this._height;
	}
	private _height = 0;

	/** Global app tween group. */
	protected readonly tweenGroup = new TweenGroup(false, 1);

	private readonly selectedDpr: number;

	private innerWidthLastUpdate = 0;
	private innerHeightLastUpdate = 0;

	private initialized = false;

	private assets: {
		json: Dict<unknown>;
		atlas: Dict<PIXI.Spritesheet>;
		bmfont: Dict<PIXI.BitmapFont>;
		spine: Dict<SPINE.SpineFromOptions>;
	} = {
		json: {},
		atlas: {},
		bmfont: {},
		spine: {},
	};

	constructor(
		/** Reference size of the app. If this is not defined, no root scaling is applied. */
		private readonly referenceSize: AppReferenceSize,
		selectedDpr?: number,
	) {
		super();

		this.selectedDpr = selectedDpr ?? this.getSelectedDpr();
	}

	/** Initialize the app */
	public startApp() {
		if (!this.initialized) {
			this.initialized = true;
			this.stage.addChild(this.root);
			this.ticker.add(this.update, this);
			this.ticker.add(this.audio.update, this.audio);
			this.onInit.emit();
		} else {
			throw new Error("App already initialized!");
		}
	}

	private update(ticker: PIXI.Ticker) {
		if (window.innerWidth !== this.innerWidthLastUpdate || window.innerHeight !== this.innerHeightLastUpdate) {
			this.innerWidthLastUpdate = window.innerWidth;
			this.innerHeightLastUpdate = window.innerHeight;
			this.resizeRoot(window.innerWidth, window.innerHeight, this.selectedDpr);
		}

		this.onUpdate.emit(ticker.deltaTime);
	}

	public tween<T>(target: T, options?: TweenOptions): Tween<T> {
		const tween = this.tweenGroup.get(target, options);
		return tween;
	}

	public delay(time: number) {
		return new Promise((resolve) => this.tween(this).wait(time).call(resolve));
	}

	public requestFullscreen(): Promise<void> {
		return screenfull.request(this.canvas as unknown as Element);
	}

	public preventContextMenu() {
		window.addEventListener("contextmenu", (e) => e.preventDefault(), false);
	}

	private getSelectedDpr(): number {
		for (let i = this.referenceSize.resolutionBreakpoints.length - 1; i >= 0; i--) {
			const el = this.referenceSize.resolutionBreakpoints[i];
			const maxSideSize = Math.max(window.innerWidth, window.innerHeight) * window.devicePixelRatio;
			if (maxSideSize > el.maxSideSizeThreshold || i === 0) {
				return el.resolution;
			}
		}

		return 1;
	}

	private getTextureDpr(): number {
		return this.selectedDpr;
	}

	private resizeRoot(windowWidth: number, windowHeight: number, dpr: number) {
		this._width = windowWidth;
		this._height = windowHeight;
		this._dpr = dpr;

		if (this.canvas && this.canvas.style) {
			this.canvas.style.width = this.width + "px";
			this.canvas.style.height = this.height + "px";
		}

		this.renderer.resolution = this.dpr;
		this.renderer.resize(this.width, this.height);

		// Center root container but this could be made optional.
		this.root.x = this._width / 2;
		this.root.y = this._height / 2;

		const refSize = lerp(this.referenceSize.width, this.referenceSize.height, this.referenceSize.blend);
		const refWindow = lerp(windowWidth, windowHeight, this.referenceSize.blend);
		const r = refSize / refWindow;
		this.root.scale.set(1 / r);

		this._width *= r;
		this._height *= r;

		this.onResize.emit({
			width: this.renderer.width * r,
			height: this.renderer.height * r,
		});
	}

	public getAtlas(atlasPath: string): PIXI.Spritesheet {
		const resource = this.assets.atlas[atlasPath];

		if (!resource) {
			throw new Error(`Can't find atlas: "${atlasPath}"`);
		}

		return resource;
	}

	public getFrame(atlasPath: string, frameName: string): PIXI.Texture {
		const atlas = this.getAtlas(atlasPath);

		if (!atlas.textures || !(atlas.textures[frameName] instanceof PIXI.Texture)) {
			throw new Error(`Can't find frame "${frameName}" in atlas "${atlasPath}"`);
		}

		return atlas.textures[frameName];
	}

	public getSpine(spinePath: string): SPINE.SpineFromOptions {
		const spine = this.assets.spine[spinePath];

		if (!spine) {
			throw new Error(`Can't find spine: "${spinePath}"`);
		}

		return spine;
	}

	public getJson(name: string): unknown {
		const resource = this.assets.json[name];

		if (!resource) {
			throw new Error(`Can't find json: "${name}"`);
		}

		return this.assets.json[name];
	}

	/** Add a spine asset to the loader. */
	public async addSpine(spinePath: string, scale: number = this.getTextureDpr()) {
		PIXI.Assets.add({ alias: `${spinePath}-atlas`, src: `${spinePath}@${scale}x.atlas` });
		PIXI.Assets.add({ alias: `${spinePath}-data`, src: `${spinePath}.json` });
		await PIXI.Assets.load([`${spinePath}-data`, `${spinePath}-atlas`], LOAD_OPTIONS);

		this.assets.spine[spinePath] = {
			atlas: `${spinePath}-atlas`,
			skeleton: `${spinePath}-data`,
			scale: 1,
		};
	}

	/** Add an atlas asset to the loader. */
	public async addAtlas(atlasPath: string, scale: number = this.getTextureDpr()) {
		const res = (await PIXI.Assets.load({ alias: atlasPath, src: `${atlasPath}@${scale}x.json` }, LOAD_OPTIONS)) as PIXI.Spritesheet;
		this.assets.atlas[atlasPath] = res;
	}

	/** Add an atlas asset to the loader. */
	public async addBitmapFont(assetPath: string, scale: number = this.getTextureDpr()) {
		const res = (await PIXI.Assets.load(`${assetPath}@${scale}x.fnt`, LOAD_OPTIONS)) as PIXI.BitmapFont;
		this.assets.bmfont[assetPath] = res;
	}

	/** Add an JSON asset to the loader. */
	public async addJson(jsonName: string, url: string) {
		const res = await PIXI.Assets.load(url, LOAD_OPTIONS);
		this.assets.json[jsonName] = res;
	}
}
