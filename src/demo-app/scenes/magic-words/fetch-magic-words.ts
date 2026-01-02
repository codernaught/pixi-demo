import { MAGIC_WORDS_ENDPOINT } from "./constants";

export type AvatarPosition = "left" | "right";

/**
 * Dialogue entry in the magic words response
 */
export interface MagicWordsDialogueEntry {
	name: string;
	text: string;
}

/**
 * Emoji data in the magic words response
 */
export interface MagicWordsEmojiData {
	name: string;
	url: string;
}

/**
 * Avatar data in the magic words response
 */
export interface MagicWordsAvatarData {
	name: string;
	url: string;
	position: AvatarPosition;
}

/**
 * Magic Words API response type
 */
export interface MagicWordsResponse {
	dialogue: MagicWordsDialogueEntry[];
	emojies: MagicWordsEmojiData[];
	avatars: MagicWordsAvatarData[];
}

/**
 * Fetches magic words data from the API endpoint
 *
 * @returns Promise resolving to the magic words data
 * @throws Error if the fetch fails or returns non-OK status
 */
export async function fetchMagicWords(): Promise<MagicWordsResponse> {
	const url = MAGIC_WORDS_ENDPOINT;

	try {
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`Failed to fetch magic words: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		return data as MagicWordsResponse;
	} catch (error) {
		if (error instanceof Error) {
			throw new Error(`Error fetching magic words: ${error.message}`);
		}
		if (typeof error === "string") {
			throw new Error(`Error fetching magic words: ${error}`);
		}
		throw new Error("Unknown error fetching magic words");
	}
}
