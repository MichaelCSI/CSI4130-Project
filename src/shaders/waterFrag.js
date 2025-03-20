const fragmentShader = /* glsl */`

    uniform vec3 uDepthColor;
    uniform vec3 uSurfaceColor;
    uniform float uColorMultiplier;
    uniform vec3 uEmissionColor;
    uniform float uEmissionStrength;

    varying float vElevation;

    void main()
    {
        float mixStrength = vElevation * uColorMultiplier;
        vec3 color = mix(uDepthColor, uSurfaceColor, mixStrength);

        gl_FragColor = vec4(color + uEmissionColor * uEmissionStrength, 1.0);
    }
`

export default fragmentShader