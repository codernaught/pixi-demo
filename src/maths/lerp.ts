/**
 * Interpolates between two values using a value
 *
 * @param a - starting value
 * @param b - ending value
 * @param k - interpolation factor (0 to 1)
 */
export function lerp(a: number, b: number, k: number): number {
	return (b - a) * k + a;
}
