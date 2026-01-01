import { TweenOptions } from "./tween-props";
import { Ease } from "./ease";

/**
 * This serves as an alias to the namespaced Tween class.
 * Experimental - Adding type safety to createjs tweenjs API.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class Tween<T = any> extends createjs.Tween {
	public static get<T>(target: T, options?: TweenOptions): Tween<T> {
		return new Tween(target, options);
	}

	wait(duration: number, passive?: boolean): this {
		return super.wait(duration, passive) as this;
	}

	to(props: Partial<T>, duration?: number, ease = Ease.sineInOut): this {
		return super.to(props, duration, ease) as this;
	}

	label(name: string): this {
		return super.label(name) as this;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	call(callback: (...params: any[]) => void, params?: Partial<T>[], scope?: unknown): this {
		return super.call(callback, params, scope) as this;
	}

	set(props: Partial<T>, target?: T): this {
		return super.set(props, target) as this;
	}

	play(tween?: Tween<T>): this {
		return super.play(tween) as this;
	}

	pause(tween?: Tween<T>): this {
		return super.pause(tween) as this;
	}

	complete(): Promise<void> {
		return new Promise((resolve) => this.call(() => resolve()));
	}
}
