/**
 * main.js — Init, animation loop, control binding, resize handler.
 */

import { initGL, buildProgram, createBuffer } from './gl-utils.js';
import { recordSpriteSheet } from './recorder.js';

// ---- Shader sources ----

const VERT_SRC = `
attribute vec2 a_position;
void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAG_SRC = `
precision mediump float;
uniform float u_time;
uniform float u_amplitude;
uniform float u_frequency;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec2 u_resolution;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float wave = sin(uv.y * 10.0 + u_time * u_frequency) * u_amplitude;
    wave += cos(uv.x * 10.0 + u_time * u_frequency * 0.5) * u_amplitude * 0.5;
    float colorValue = sin(wave * 5.0 + u_time * 2.0) * 0.5 + 0.5;
    vec3 color = mix(u_color1, u_color2, colorValue);
    gl_FragColor = vec4(color, 1.0);
}
`;

// ---- State ----

let gl = null;
let program = null;
let quadBuffer = null;
let animationId = 0;
let startTime = 0;

// Uniform locations
let uTime, uAmplitude, uFrequency, uColor1, uColor2, uResolution;
// Attribute
let aPosition;

// Control values (defaults)
const params = {
    timeScale: 1.0,
    amplitude: 0.5,
    frequency: 3.0,
    color1: [0.0, 0.4, 1.0],   // #0066ff
    color2: [1.0, 0.2, 0.0],   // #ff3300
};

// ---- Helpers ----

/** Convert hex color string (#rrggbb) to [r, g, b] in 0..1 range. */
function hexToRGB(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16 & 0xff) / 255, (n >> 8 & 0xff) / 255, (n & 0xff) / 255];
}

// ---- WebGL init ----

function setup() {
    const canvas = document.getElementById('canvas');
    gl = initGL(canvas, true); // preserveDrawingBuffer for capture
    if (!gl) return false;

    program = buildProgram(gl, VERT_SRC, FRAG_SRC);
    if (!program) return false;

    // Full-screen quad (two triangles)
    quadBuffer = createBuffer(gl, new Float32Array([
        -1, -1,  1, -1,  -1, 1,
        -1,  1,  1, -1,   1, 1,
    ]));

    aPosition   = gl.getAttribLocation(program, 'a_position');
    uTime       = gl.getUniformLocation(program, 'u_time');
    uAmplitude  = gl.getUniformLocation(program, 'u_amplitude');
    uFrequency  = gl.getUniformLocation(program, 'u_frequency');
    uColor1     = gl.getUniformLocation(program, 'u_color1');
    uColor2     = gl.getUniformLocation(program, 'u_color2');
    uResolution = gl.getUniformLocation(program, 'u_resolution');

    return true;
}

// ---- Render ----

function renderAtTime(timeMs) {
    if (!gl || !program) return;
    const canvas = gl.canvas;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    // Uniforms
    const elapsed = (timeMs / 1000) * params.timeScale;
    gl.uniform1f(uTime, elapsed);
    gl.uniform1f(uAmplitude, params.amplitude);
    gl.uniform1f(uFrequency, params.frequency);
    gl.uniform3fv(uColor1, params.color1);
    gl.uniform3fv(uColor2, params.color2);
    gl.uniform2f(uResolution, canvas.width, canvas.height);

    // Draw quad
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function animate(now) {
    renderAtTime(now - startTime);
    animationId = requestAnimationFrame(animate);
}

// ---- Resize ----

function resize() {
    if (!gl) return;
    const canvas = gl.canvas;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// ---- Controls ----

function bindControls() {
    const $ = (id) => document.getElementById(id);

    // Slider helper
    function bindSlider(id, valueId, paramKey, format) {
        const slider = $(id);
        const display = $(valueId);
        slider.addEventListener('input', () => {
            params[paramKey] = parseFloat(slider.value);
            display.textContent = format(params[paramKey]);
        });
    }

    bindSlider('timeScale', 'timeScaleValue', 'timeScale', v => v.toFixed(1));
    bindSlider('amplitude', 'amplitudeValue', 'amplitude', v => v.toFixed(2));
    bindSlider('frequency', 'frequencyValue', 'frequency', v => v.toFixed(1));

    $('color1').addEventListener('input', (e) => {
        params.color1 = hexToRGB(e.target.value);
    });
    $('color2').addEventListener('input', (e) => {
        params.color2 = hexToRGB(e.target.value);
    });

    // Record button
    const recordBtn = $('recordBtn');
    const recordStatus = $('recordStatus');

    recordBtn.addEventListener('click', async () => {
        recordBtn.disabled = true;
        recordStatus.textContent = 'Recording...';

        // Pause the live animation during capture
        cancelAnimationFrame(animationId);

        try {
            await recordSpriteSheet({
                canvas: gl.canvas,
                duration: 10,
                fps: 15,
                frameWidth: gl.canvas.width,
                frameHeight: gl.canvas.height,
                onProgress(done, total) {
                    recordStatus.textContent = `Capturing frame ${done} / ${total}`;
                },
                renderFrame(t) {
                    renderAtTime(t);
                },
            });
            recordStatus.textContent = 'Sprite sheet saved.';
        } catch (err) {
            console.error('Recording failed:', err);
            recordStatus.textContent = 'Recording failed — see console.';
        }

        // Resume animation
        startTime = performance.now();
        animationId = requestAnimationFrame(animate);
        recordBtn.disabled = false;
    });
}

// ---- Boot ----

window.addEventListener('load', () => {
    if (!setup()) return;
    resize();
    bindControls();
    startTime = performance.now();
    animationId = requestAnimationFrame(animate);
    window.addEventListener('resize', resize);
});

window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(animationId);
    window.removeEventListener('resize', resize);
    if (gl) {
        gl.deleteBuffer(quadBuffer);
        gl.deleteProgram(program);
    }
});
