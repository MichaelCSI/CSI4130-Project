import * as THREE from "three";

const galaxyParameters = {
    count: 5_000,
    size: 0.01,
    radius: 60,
    branches: 3,
    spin: 1.2,
    rotationVelocity: 0.4,
    randomnessPower: 3,
    spiralHeight: 0,
    insideColor: '#ffffff',
    outsideColor: '#ffffff'
};

export function createGalaxy(scene, scaleX = 1, scaleY = 1, scaleZ = 1) {
    let particlesGeometry = new THREE.BufferGeometry();
    let particlesMaterial = new THREE.PointsMaterial({
        size: galaxyParameters.size,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true
    });

    const positions = new Float32Array(galaxyParameters.count * 3);
    const colors = new Float32Array(galaxyParameters.count * 3);
    const colorInside = new THREE.Color(galaxyParameters.insideColor);
    const colorOutside = new THREE.Color(galaxyParameters.outsideColor);

    for (let i = 0; i < galaxyParameters.count; i++) {
        const i3 = i * 3;
        const radius = Math.random() * galaxyParameters.radius;
        const branchAngle = (i % galaxyParameters.branches) / galaxyParameters.branches * Math.PI * 2;
        const spinAngle = radius * galaxyParameters.spin;

        const randomX = Math.pow(Math.random(), galaxyParameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1);
        const randomY = Math.pow(Math.random(), galaxyParameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1);
        const randomZ = Math.pow(Math.random(), galaxyParameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1);

        positions[i3] = scaleX * Math.cos(branchAngle + spinAngle) * radius + randomX;
        positions[i3 + 1] = scaleY * randomY + radius * galaxyParameters.spiralHeight + 3;
        positions[i3 + 2] = scaleZ * Math.sin(branchAngle + spinAngle) * radius + randomZ;

        const mixedColor = colorInside.clone();
        mixedColor.lerp(colorOutside, radius / galaxyParameters.radius);

        colors[i3] = mixedColor.r;
        colors[i3 + 1] = mixedColor.g;
        colors[i3 + 2] = mixedColor.b;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    let particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);
    return particles;
}

export { galaxyParameters };
