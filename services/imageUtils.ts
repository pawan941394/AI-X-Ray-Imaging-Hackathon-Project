/**
 * Draws the source image onto a canvas and adds a visual pointer at the specified coordinates.
 * @param imageUrl The base64 or URL of the source image.
 * @param coords The relative coordinates (0-1 range) on the image to place the pointer.
 * @returns A Promise that resolves with the new image as a base64 data URL.
 */
export async function drawImageWithPointer(
    imageUrl: string,
    coords: { x: number; y: number }
): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }

            // Draw the original image
            ctx.drawImage(img, 0, 0);

            // Calculate absolute pixel coordinates for the pointer
            const pointerX = coords.x * img.width;
            const pointerY = coords.y * img.height;

            // Draw the pointer (a red circle with a white border)
            const radius = Math.max(10, img.width * 0.02); // Pointer size relative to image
            ctx.beginPath();
            ctx.arc(pointerX, pointerY, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
            ctx.fill();
            ctx.lineWidth = Math.max(2, img.width * 0.005);
            ctx.strokeStyle = 'white';
            ctx.stroke();

            // Resolve with the new image as a data URL
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => {
            reject(new Error('Failed to load the image for annotation.'));
        };
        img.src = imageUrl;
    });
}
