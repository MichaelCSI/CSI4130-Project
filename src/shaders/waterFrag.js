const fragmentShader = /* glsl */`

    uniform vec3 uDepthColor;
    uniform vec3 uSurfaceColor;
    uniform float uColorMultiplier;

    varying float vElevation;

    void main()
    {
        float mixStrength = vElevation * uColorMultiplier;
        vec3 color = mix(uDepthColor, uSurfaceColor, mixStrength);

        gl_FragColor = vec4(color, 1.0);
    }
`

export default fragmentShader