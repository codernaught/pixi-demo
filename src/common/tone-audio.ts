import { Midi } from "@tonejs/midi";
import clamp from "lodash-es/clamp";
import defaults from "lodash-es/defaults";
import * as Tone from "tone";
import type { Dict } from "./types";
import { TypedEmitter } from "./typed-emitter";

const CENTER_NOTE = "A3";

export interface NoteJSON {
	time: number;
	midi: number;
	name: string;
	velocity: number;
	duration: number;
	ticks: number;
	durationTicks: number;
}

export interface PlayOptions {
	type: "attack-release" | "attack" | "release";
	delay: number;
	transpose: number;
	duration: number;
	volume: number;
}

export const DEFAULT_PLAY_OPTIONS: PlayOptions = {
	type: "attack-release",
	delay: 0,
	transpose: 0,
	duration: 0,
	volume: 1,
};

export interface SourceConfig {
	url: string;
	volume?: number;
}

export interface SourceEntry extends SourceConfig {
	duration: number;
}

export interface ToneAudioConfig {
	masterVolume?: number;
	sources: Dict<SourceConfig>;
}

export interface MidiPlaybackData {
	tracks: ReadonlyArray<MidiPlaybackTrackData>;
	duration: number;
	start: number;
}

export interface MidiPlaybackTrackData {
	name: string;
	notes: NoteJSON[];
	original: NoteJSON[];
	loops: number;
}

export interface MidiStartedEventData {
	midi: Midi;
}

export interface NoteScheduledEventData {
	absoluteScheduledTime: number;
	trackName: string;
	noteData: NoteJSON;
}

export class ToneAudio {
	public static buffers: Dict<Tone.ToneAudioBuffer> = {};

	public static async loadBuffers(config: ToneAudioConfig) {
		const entries = Object.entries(config.sources);

		const requests = [];

		try {
			for (let i = 0; i < entries.length; i++) {
				const el = entries[i][1];

				if (!ToneAudio.buffers[el.url]) {
					const buffer = new Tone.ToneAudioBuffer();
					requests.push(buffer.load(el.url));
					ToneAudio.buffers[el.url] = buffer;
				}
			}

			// TODO: Concurrent request limit.
			await Promise.all(requests);
		} catch (err) {
			console.error(err);
		}
	}

	public static semitoneToRate(semitones: number): number {
		return Math.exp((semitones * Math.log(2)) / 12);
	}

	public readonly onMidiStarted = new TypedEmitter<MidiStartedEventData>();
	public readonly onNoteScheduled = new TypedEmitter<NoteScheduledEventData>();

	private samplers: Dict<Tone.Sampler> = {};
	private sources: Dict<SourceEntry> = {};
	private config!: ToneAudioConfig;

	public async init(config: ToneAudioConfig) {
		if (this.config) {
			throw new Error("Already initialized");
		}

		this.config = config;

		await ToneAudio.loadBuffers(config);

		this.initInstruments(config);

		window.addEventListener("focus", () => Tone.getDestination().volume.rampTo(0, 0.1));
		window.addEventListener("blur", () => Tone.getDestination().volume.rampTo(-Infinity, 0.1));
	}

	public update() {
		if (!document.hasFocus() || Tone.getContext().state !== "running") {
			return;
		}
	}

	public now() {
		return Tone.now();
	}

	private initInstruments(options: ToneAudioConfig) {
		const sources = Object.entries(options.sources);

		for (let i = 0; i < sources.length; i++) {
			const entry = sources[i];
			const key = entry[0];
			const el = entry[1];

			const buffer = ToneAudio.buffers[el.url];

			const duration = buffer.duration;

			this.sources[key] = { ...el, ...{ duration } };

			const sampler = new Tone.Sampler({
				urls: { [CENTER_NOTE]: buffer },
				volume: el.volume ?? 0,
			}).toDestination();

			this.samplers[key] = sampler;
		}
	}

	public play(name: string, options: Partial<PlayOptions> = {}) {
		const source = this.sources[name];

		if (!source) {
			throw new Error(`Can't find sound with name "${name}"`);
		}

		options.duration = options.duration ?? source.duration;

		const { type, delay, transpose, volume, duration } = defaults(options, DEFAULT_PLAY_OPTIONS);

		const sampler = this.samplers[name];

		let note = CENTER_NOTE;

		let time = Tone.now();

		if (transpose !== 0) {
			options.transpose = clamp(transpose, -48, 48);
			note = Tone.Midi(note).transpose(options.transpose).toNote();
		}

		if (delay > 0) {
			time += delay;
		}

		switch (type) {
			default:
			case "attack-release":
				sampler.triggerAttackRelease(note, duration, time, volume);
				break;

			case "attack":
				sampler.triggerAttack(note, time, volume);
				break;

			case "release":
				sampler.triggerRelease(note, time);
				break;
		}
	}
}

const unlock = async () => {
	document.body.removeEventListener("click", unlock);
	document.body.removeEventListener("touchend", unlock);

	try {
		await Tone.start();
	} catch (err) {
		console.error(err);
	}
};
document.body.addEventListener("click", unlock);
document.body.addEventListener("touchend", unlock);
