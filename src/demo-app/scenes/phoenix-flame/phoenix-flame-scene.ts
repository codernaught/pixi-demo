import { Emitter, EmitterConfigV3 } from "@spd789562/particle-emitter";
import * as PIXI from "pixi.js";
import { Player } from "tone";
import { Scene } from "../../../common/scene";
import { DemoApp } from "../../demo-app";
import { SceneKey } from "../../scene-key";
import { DemoAppHUD } from "../../ui/demo-app-hud";

import fireConfig from "./config/fire-config.json";
import lightConfig from "./config/light-config.json";
import smokeConfig from "./config/smoke-config.json";

const ATLAS_PATH = "textures/particles";
const AMBIENCE_AUDIO_PATH = "audio/forest_campfire_ambience.m4a";

/**
 * Scene that showcases a phoenix flame particle effect using particle emitters.
 * Includes ambient sound for atmosphere.
 *
 * Emitters combined will use only 10 active sprites at a time, as per requirement.
 *
 * Potential optimisations:
 * - Preload assets before scene load.
 * - Cache the loaded assets between scene loads depending on overall app asset demands.
 */
export class PhoenixFlameScene extends Scene<DemoApp> {
	private readonly hud = new DemoAppHUD(this.app, {
		onBackButtonPressed: () => this.app.showScene(SceneKey.Menu),
	});

	private readonly background = new PIXI.Sprite();

	private readonly particleContainer = new PIXI.ParticleContainer({
		dynamicProperties: {
			uvs: true,
			vertex: true,
			position: true,
			rotation: true,
			scale: true,
			color: true,
		},
	});

	private flameEmitter?: Emitter;
	private lightEmitter?: Emitter;
	private smokeEmitter?: Emitter;

	private readonly ambiencePlayer = new Player(AMBIENCE_AUDIO_PATH, () => {
		this.ambiencePlayer.volume.value = -6;
		this.ambiencePlayer.loop = true;
		this.ambiencePlayer.start();
	}).toDestination();

	protected handleInit() {
		this.background.anchor.set(0.5);
		this.background.texture = this.app.getFrame(ATLAS_PATH, "campfire_scene");

		const preparedFireConfig: EmitterConfigV3 = { ...fireConfig };
		preparedFireConfig.behaviors.push({
			type: "textureRandom",
			config: {
				textures: [
					this.app.getFrame(ATLAS_PATH, "flame_particle_trimmed"),
					this.app.getFrame(ATLAS_PATH, "flame_particle_flipped_trimmed"),
				],
			},
		});
		this.flameEmitter = new Emitter(this.particleContainer, preparedFireConfig);

		const preparedLightConfig: EmitterConfigV3 = { ...lightConfig };
		preparedLightConfig.behaviors.push({
			type: "textureSingle",
			config: {
				texture: this.app.getFrame(ATLAS_PATH, "radial_gradient"),
			},
		});
		this.lightEmitter = new Emitter(this.particleContainer, preparedLightConfig);

		const preparedSmokeConfig: EmitterConfigV3 = { ...smokeConfig };
		preparedSmokeConfig.behaviors.push({
			type: "textureSingle",
			config: {
				texture: this.app.getFrame(ATLAS_PATH, "radial_gradient"),
			},
		});
		this.smokeEmitter = new Emitter(this.particleContainer, preparedSmokeConfig);

		this.flameEmitter.emit = true;
		this.lightEmitter.emit = true;
		this.smokeEmitter.emit = true;

		this.particleContainer.position.set(0, 120);

		this.addChild(this.background);
		this.addChild(this.particleContainer);
		this.addChild(this.hud);
	}

	protected handleUpdate(): void {
		this.flameEmitter?.update(this.app.ticker.elapsedMS * 0.001);
		this.lightEmitter?.update(this.app.ticker.elapsedMS * 0.001);
		this.smokeEmitter?.update(this.app.ticker.elapsedMS * 0.001);
	}

	protected async handleLoad() {
		this.displayStatusText("Loading scene assets...");

		await this.app.addAtlas(ATLAS_PATH, 1);

		// Ideally this would be configurable per texture/atlas, but for demo purposes we'll just set it here.
		const cardsAtlas = this.app.getAtlas(ATLAS_PATH);
		cardsAtlas.textureSource.style.scaleMode = "nearest";

		this.hideStatusText();
	}

	protected async handleLoadError() {
		this.displayAndLogError("Failed to load scene assets...");
	}

	protected async handleUnload() {
		this.ambiencePlayer.dispose();

		this.flameEmitter?.destroy();
		this.lightEmitter?.destroy();
		this.smokeEmitter?.destroy();

		await PIXI.Assets.unload(ATLAS_PATH);
	}
}
