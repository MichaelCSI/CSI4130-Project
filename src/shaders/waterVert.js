const vertexShader = /* glsl */`

    uniform float uTime;
    uniform float uWaveElevation;
    uniform vec2 uWaveFrequency;
    uniform float uWaveSpeed;
    uniform float uXOffset;

    uniform float uSmallWavesElevation;
    uniform float uSmallWavesFrequency;
    uniform float uSmallWavesSpeed;
    uniform float uSmallIterations;

    varying float vElevation;

    // "Random" function using fract (fractional part of arg)
    float rand(float x){
        return fract(sin(x) * 100000.);
    }

    void main()
    {
        vec4 modelPosition = modelMatrix * vec4(position, 1.0);

        // General sinusoidal wave elevation
        float xElevation = sin(-modelPosition.x * uWaveFrequency.x + uTime * uWaveSpeed + rand(modelPosition.z));
        float zElevation = sin(-modelPosition.z * uWaveFrequency.y + uTime * uWaveSpeed);
        float elevation = xElevation * zElevation * uWaveElevation;
        
        modelPosition.y += elevation;

        vec4 viewPosition = viewMatrix * modelPosition;
        vec4 projectedPosition = projectionMatrix * viewPosition;
        gl_Position = projectedPosition;

        vElevation = elevation;
    }
`

export default vertexShader