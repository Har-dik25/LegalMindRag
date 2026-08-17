import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginSignup({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);

  // WebGL Shader Effect matching user's spec
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function syncSize() {
      if (!canvas) return;
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }
    syncSize();

    let resizeObs;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObs = new ResizeObserver(syncSize);
      resizeObs.observe(canvas);
    }

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    const vs = `attribute vec2 a_position;
    varying vec2 v_texCoord;
    void main() {
      v_texCoord = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }`;

    const fs = `precision highp float;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;

    void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        uv.x *= u_resolution.x / u_resolution.y;

        // Slow drifting columns effect
        float columns = abs(sin(uv.x * 8.0 + sin(u_time * 0.2) * 0.5));
        float mask = smoothstep(0.48, 0.5, columns);
        
        // Brass color components
        vec3 brass = vec3(0.69, 0.55, 0.34); // #B08D57
        vec3 dark = vec3(0.055, 0.059, 0.07); // #0E0F12
        
        float pattern = mask * (0.05 + 0.02 * sin(u_time * 0.5));
        vec3 finalColor = mix(dark, brass, pattern);
        
        gl_FragColor = vec4(finalColor, 1.0);
    }`;

    function compileShader(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, compileShader(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
    const handleMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1.0 - (event.clientY - rect.top) / rect.height;
        mouse.x = nx * canvas.width;
        mouse.y = ny * canvas.height;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    let animId;
    function render(t) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animId = requestAnimationFrame(render);
    }
    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      if (resizeObs) resizeObs.disconnect();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both your identifier and password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000${isLogin ? '/auth/login' : '/auth/register'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Authorization failed');
      onLogin(data);
    } catch (err) {
      // Fallback guest login if backend auth fails or is in extractive mode
      if (err.message.includes('Failed to fetch')) {
        onLogin({ access_token: 'local_token', token_type: 'bearer', username: username.trim() });
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoGuest = () => {
    onLogin({ access_token: 'guest_token', token_type: 'bearer', username: 'Senior_Counsel' });
  };

  return (
    <div className="bg-obsidian text-on-surface h-screen w-full flex overflow-hidden font-inter">
      {/* Left Panel: Brand & Shader */}
      <div className="hidden md:flex relative w-1/2 h-full bg-obsidian items-center justify-center p-16 overflow-hidden">
        {/* Shader Animation Background */}
        <div className="absolute inset-0 w-full h-full">
          <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
        </div>

        {/* Subtle Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-tr from-obsidian via-obsidian/60 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-obsidian/90 pointer-events-none" />

        {/* Quote Content */}
        <div className="relative z-10 max-w-2xl text-center space-y-8">
          <span className="material-symbols-outlined text-brass/50 text-[48px] drop-shadow-[0_0_8px_rgba(232,192,134,0.3)]">
            balance
          </span>
          <p className="font-fraunces text-[36px] lg:text-[48px] leading-tight text-tertiary-fixed italic drop-shadow-[0_0_12px_rgba(247,224,180,0.2)]">
            "Justice is the constant and perpetual will to allot to every man his due."
          </p>
          <div className="h-px w-16 bg-brass/40 mx-auto mt-8 shadow-[0_0_8px_rgba(232,192,134,0.4)]" />
          <p className="font-citation text-xs tracking-widest text-on-surface-variant/60 uppercase">
            Samvidhan AI · Indian Legal Intelligence
          </p>
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="w-full md:w-1/2 h-full flex flex-col justify-center px-6 md:px-16 bg-obsidian relative">
        <div className="max-w-md w-full mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-2 text-center md:text-left mb-8">
            <h1 className="font-fraunces text-[28px] md:text-[34px] text-brass tracking-tight">
              Samvidhan AI
            </h1>
            <p className="text-[15px] text-on-surface-variant">
              {isLogin ? 'Sign in to your private legal chamber' : 'Open your private legal workspace'}
            </p>
          </div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-error-container/20 border border-error/30 text-error px-4 py-2.5 rounded text-xs flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">warning</span>
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Identifier / Email Field */}
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-0 text-on-surface-variant/40 pointer-events-none text-[20px]">
                mail
              </span>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder=" "
                className="ghost-input w-full text-[15px] peer pl-8 pr-2 focus:border-brass"
                autoComplete="username"
              />
              <label
                htmlFor="username"
                className="absolute left-8 text-on-surface-variant text-[14px] transition-all pointer-events-none
                peer-placeholder-shown:top-2 peer-placeholder-shown:text-[14px] peer-placeholder-shown:text-on-surface-variant/60
                peer-focus:-top-3.5 peer-focus:left-0 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-brass
                peer-[:not(:placeholder-shown)]:-top-3.5 peer-[:not(:placeholder-shown)]:left-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-brass"
              >
                Username or Chamber ID
              </label>
            </div>

            {/* Password Field */}
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-0 text-on-surface-variant/40 pointer-events-none text-[20px]">
                lock
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                className="ghost-input w-full text-[15px] peer pl-8 pr-10 focus:border-brass"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
              <label
                htmlFor="password"
                className="absolute left-8 text-on-surface-variant text-[14px] transition-all pointer-events-none
                peer-placeholder-shown:top-2 peer-placeholder-shown:text-[14px] peer-placeholder-shown:text-on-surface-variant/60
                peer-focus:-top-3.5 peer-focus:left-0 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-brass
                peer-[:not(:placeholder-shown)]:-top-3.5 peer-[:not(:placeholder-shown)]:left-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-brass"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 text-on-surface-variant/40 hover:text-brass transition-colors p-1"
                title={showPassword ? 'Hide Password' : 'Show Password'}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>

            {/* Forgot Password / Guest demo link */}
            <div className="flex justify-between items-center text-xs">
              <button
                type="button"
                onClick={handleDemoGuest}
                className="text-secondary hover:text-secondary-fixed transition-colors font-citation"
              >
                ⚡ Fast Enter as Guest Counsel
              </button>
              <a href="#" className="text-on-surface-variant/70 hover:text-brass transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="brass-button w-full text-[14px] font-semibold py-3 px-4 rounded-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                  Authenticating...
                </span>
              ) : (
                <>
                  <span>{isLogin ? 'Sign in' : 'Create Account'}</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-brass/15" />
            <span className="flex-shrink-0 mx-4 text-[12px] font-citation text-on-surface-variant/60">
              OR
            </span>
            <div className="flex-grow border-t border-brass/15" />
          </div>

          {/* Switch mode */}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="brass-outline-button w-full flex items-center justify-center gap-2 text-[13px] font-medium py-2.5 px-4 rounded-sm"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isLogin ? 'person_add' : 'login'}
            </span>
            {isLogin ? 'Create a new Chamber Account' : 'Sign in to existing Chamber'}
          </button>
        </div>
      </div>
    </div>
  );
}
