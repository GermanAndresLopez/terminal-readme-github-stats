import { Jimp, intToRGBA } from "jimp";
import { PHOTO_SLOT_WIDTH, PHOTO_SLOT_HEIGHT } from "../constants/ascii-art.constants";

// Ramp from lightest to darkest print density, used to map pixel luminance to a character.
// Deliberately fine-grained so the conversion keeps visible detail despite the small target size.
const DENSITY_RAMP = " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";

/**
 * Downloads an image (e.g. a GitHub avatar) and converts it into a monochrome
 * ASCII-art block sized to match the built-in catalog art's footprint exactly.
 *
 * @param imageUrl Absolute URL of the source image.
 * @param width Target width in characters.
 * @param height Target height in characters (character cells are roughly twice as tall as wide).
 * @returns An array of equal-length strings, one per row.
 */
export async function imageToAscii(imageUrl: string, width: number = PHOTO_SLOT_WIDTH, height: number = PHOTO_SLOT_HEIGHT): Promise<string[]> {
    const image = await Jimp.read(imageUrl);
    image.resize({ w: width, h: height });
    image.greyscale();
    image.contrast(0.15);
    image.normalize();

    const lines: string[] = [];
    for (let y = 0; y < height; y++) {
        let line = "";
        for (let x = 0; x < width; x++) {
            const { r } = intToRGBA(image.getPixelColor(x, y));
            const charIndex = Math.min(DENSITY_RAMP.length - 1, Math.floor((r / 255) * DENSITY_RAMP.length));
            line += DENSITY_RAMP[charIndex];
        }
        lines.push(line);
    }
    return lines;
}

/**
 * Downloads an image and returns it as a base64 `data:` URI, preserving its
 * original bytes/quality (used for the "photo" art mode — a real image, not ASCII).
 *
 * @param imageUrl Absolute URL of the source image.
 */
export async function fetchImageAsDataUri(imageUrl: string): Promise<string> {
    const response = await fetch(imageUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch image (${response.status}): ${imageUrl}`);
    }
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await response.arrayBuffer());
    return `data:${contentType};base64,${buffer.toString("base64")}`;
}
