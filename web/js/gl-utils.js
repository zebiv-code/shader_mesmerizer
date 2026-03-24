/**
 * gl-utils.js — WebGL setup, shader compilation, program creation.
 */

/**
 * Compile a shader from source.
 * @param {WebGLRenderingContext} gl
 * @param {number} type  gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
 * @param {string} source  GLSL source code
 * @returns {WebGLShader|null}
 */
export function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

/**
 * Link a vertex + fragment shader into a program.
 * @param {WebGLRenderingContext} gl
 * @param {WebGLShader} vs
 * @param {WebGLShader} fs
 * @returns {WebGLProgram|null}
 */
export function createProgram(gl, vs, fs) {
    const program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }
    return program;
}

/**
 * Convenience: compile vertex + fragment source strings and link into a program.
 * @param {WebGLRenderingContext} gl
 * @param {string} vsSrc
 * @param {string} fsSrc
 * @returns {WebGLProgram|null}
 */
export function buildProgram(gl, vsSrc, fsSrc) {
    const vs = compileShader(gl, gl.VERTEX_SHADER, vsSrc);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc);
    if (!vs || !fs) return null;
    return createProgram(gl, vs, fs);
}

/**
 * Create and populate a WebGL buffer.
 * @param {WebGLRenderingContext} gl
 * @param {Float32Array} data
 * @returns {WebGLBuffer}
 */
export function createBuffer(gl, data) {
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return buf;
}

/**
 * Initialize WebGL context from a canvas element.
 * @param {HTMLCanvasElement} canvas
 * @param {boolean} preserveDrawingBuffer  needed for frame capture
 * @returns {WebGLRenderingContext|null}
 */
export function initGL(canvas, preserveDrawingBuffer = false) {
    const gl = canvas.getContext('webgl', { preserveDrawingBuffer }) ||
               canvas.getContext('experimental-webgl', { preserveDrawingBuffer });
    if (!gl) {
        console.error('WebGL not supported');
        return null;
    }
    return gl;
}
