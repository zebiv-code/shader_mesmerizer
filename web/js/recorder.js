/**
 * recorder.js — Frame capture and sprite sheet PNG export.
 *
 * Captures N frames from a WebGL canvas and composites them into
 * a horizontal sprite sheet, then triggers a PNG download.
 */

/**
 * Capture the current canvas contents as an ImageBitmap.
 * Falls back to drawImage from the canvas if createImageBitmap is unavailable.
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<ImageBitmap|HTMLCanvasElement>}
 */
function captureFrame(canvas) {
    if (typeof createImageBitmap === 'function') {
        return createImageBitmap(canvas);
    }
    // Fallback: copy to an offscreen canvas
    const copy = document.createElement('canvas');
    copy.width = canvas.width;
    copy.height = canvas.height;
    copy.getContext('2d').drawImage(canvas, 0, 0);
    return Promise.resolve(copy);
}

/**
 * Record frames over a duration and assemble into a sprite sheet PNG.
 *
 * @param {object} opts
 * @param {HTMLCanvasElement} opts.canvas       Source canvas (must have preserveDrawingBuffer)
 * @param {number}            opts.duration     Recording duration in seconds (default 10)
 * @param {number}            opts.fps          Frames per second (default 15)
 * @param {number}            opts.frameWidth   Width of each frame in the sheet (default canvas.width)
 * @param {number}            opts.frameHeight  Height of each frame in the sheet (default canvas.height)
 * @param {function}          opts.onProgress   Called with (capturedCount, totalFrames)
 * @param {function}          opts.renderFrame  Called with (time) to force a render at a specific time
 * @returns {Promise<void>}
 */
export async function recordSpriteSheet(opts) {
    const {
        canvas,
        duration = 10,
        fps = 15,
        frameWidth = canvas.width,
        frameHeight = canvas.height,
        onProgress = () => {},
        renderFrame = null,
    } = opts;

    const totalFrames = Math.ceil(duration * fps);
    const interval = 1000 / fps;

    // Determine sprite sheet layout.
    // Use a grid to keep dimensions reasonable.
    const cols = Math.ceil(Math.sqrt(totalFrames));
    const rows = Math.ceil(totalFrames / cols);

    const sheetCanvas = document.createElement('canvas');
    sheetCanvas.width = cols * frameWidth;
    sheetCanvas.height = rows * frameHeight;
    const ctx = sheetCanvas.getContext('2d');

    const frames = [];

    // If a renderFrame callback is provided we can drive the render loop
    // at exact time steps. Otherwise we capture in real-time.
    if (renderFrame) {
        for (let i = 0; i < totalFrames; i++) {
            const t = (i / fps) * 1000; // time in ms
            renderFrame(t);
            const bmp = await captureFrame(canvas);
            frames.push(bmp);
            onProgress(i + 1, totalFrames);
        }
    } else {
        // Real-time capture
        for (let i = 0; i < totalFrames; i++) {
            const bmp = await captureFrame(canvas);
            frames.push(bmp);
            onProgress(i + 1, totalFrames);
            if (i < totalFrames - 1) {
                await new Promise(r => setTimeout(r, interval));
            }
        }
    }

    // Composite frames onto the sprite sheet
    for (let i = 0; i < frames.length; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        ctx.drawImage(frames[i], col * frameWidth, row * frameHeight, frameWidth, frameHeight);
    }

    // Trigger download
    const link = document.createElement('a');
    link.download = `shader-mesmerizer-spritesheet-${Date.now()}.png`;
    link.href = sheetCanvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
