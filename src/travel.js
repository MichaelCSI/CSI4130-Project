import waterVert from './shaders/waterVert';
import waterFrag from './shaders/waterFrag';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise.js';
import { currentAudio } from "./music.js";

var shaderGeometry, shaderMaterial, shaderMesh;
var backgroundTexture, backgroundMaterial, backgroundGeometry, backgroundMesh;

var volcano;
var volcanoLight;

var treeObjects = [];
var updatingScene = false;

export async function updateBackground(oldBG, newBG, scene, camera) {
    if(updatingScene) {
        return;
    }
    updatingScene = true;
    triggerInSceneWarp(scene, camera, 4000);

    await wait(4000).then();
    if (oldBG.localeCompare("water") == 0) {
        resetWater(scene);
    } else if (oldBG.localeCompare("tree") == 0) {
        resetTree(scene);
    } else if (oldBG.localeCompare("fire") == 0) {
        resetFire(scene);
    }


    if (newBG.localeCompare("water") == 0) {
        createWaterScene(scene, camera);
    } else if (newBG.localeCompare("tree") == 0) {
        createTreeScene(scene, camera);
    } else if (newBG.localeCompare("fire") == 0) {
        createFireScene(scene, camera);
    }
    updatingScene = false;
}

export function animateScene(shaderTime, backgroundTime) {
    shaderMaterial.uniforms.uTime.value = shaderTime;
    backgroundMesh.rotation.z = backgroundTime;
}

function createWaterScene(scene, camera) {
    // Use a simple plane with the water shaders to create an ocean/body of water
    shaderGeometry = new THREE.PlaneGeometry(80, 40, 1024, 512);
    shaderMaterial = new THREE.ShaderMaterial({
        vertexShader: waterVert,
        fragmentShader: waterFrag,
        transparent: true,
        side: THREE.DoubleSide,
        uniforms: {
            // Vertex uniforms
            uTime: { value: 0 },
            uWaveElevation: { value: 0.07 },
            uWaveFrequency: { value: new THREE.Vector2(0.2, 0.2) },
            uWaveSpeed: { value: 0.4 },

            // Fragment uniforms
            uDepthColor: { value: new THREE.Color('#1c597c') },
            uSurfaceColor: { value: new THREE.Color('#7a9db7') },
            uColorMultiplier: { value: 5 }
        }
    });

    // Shader Mesh creation and positioning
    shaderMesh = new THREE.Mesh(shaderGeometry, shaderMaterial);
    shaderMesh.rotation.x = -Math.PI / 1.75;
    shaderMesh.rotation.z = -Math.PI / 3;
    shaderMesh.position.set(camera.position.x, camera.position.y - 2.5, camera.position.z - 5);
    scene.add(shaderMesh);

    // Create the backdrop plane
    backgroundTexture = new THREE.TextureLoader().load('./images/waterSky.png');
    backgroundMaterial = new THREE.MeshBasicMaterial({ map: backgroundTexture, side: THREE.DoubleSide });
    backgroundGeometry = new THREE.PlaneGeometry(80, 60);
    backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
    backgroundMesh.position.set(camera.position.x + 20, camera.position.y, camera.position.z - 50);
    scene.add(backgroundMesh);
}

function resetWater(scene) {
    scene.remove(shaderMesh);
    shaderGeometry.dispose();
    shaderMaterial.dispose();
    scene.remove(backgroundMesh);
    backgroundTexture.dispose();
    backgroundMaterial.dispose();
    backgroundGeometry.dispose();
}
// Fire/Volcano Scene
function createFireScene(scene) {
    const loader = new GLTFLoader();
    loader.load('./models/volcano.glb', function (gltf) {
        console.log("Loaded Volcano", gltf);
        volcano = gltf.scene;
        volcano.scale.set(2, 2, 2);
        volcano.position.set(5, -20, -20);
        volcano.rotation.set(0, Math.PI / 2.3, 0);
        scene.add(volcano);
    }, undefined, function (error) {
        console.error("Error loading Volcano:", error);
    });

    // Add light for lava
    volcanoLight = new THREE.PointLight(0xFF4500, 8000, 100);
    volcanoLight.position.set(5, -4, -20);
    scene.add(volcanoLight);

    // Use a simple plane with the water shaders (different parameters for lava)
    shaderGeometry = new THREE.PlaneGeometry(40, 40, 400, 400);
    shaderMaterial = new THREE.ShaderMaterial({
        vertexShader: waterVert,
        fragmentShader: waterFrag,
        transparent: true,
        side: THREE.DoubleSide,
        uniforms: {
            // Vertex uniforms
            uTime: { value: 0 },
            uWaveElevation: { value: 0.5 },
            uWaveFrequency: { value: new THREE.Vector2(0.08, 0.08) },
            uWaveSpeed: { value: 0.4 },

            // Fragment uniforms
            uDepthColor: { value: new THREE.Color('#FF8C00') },
            uSurfaceColor: { value: new THREE.Color('#800000') },
            uColorMultiplier: { value: 7 },
            uEmissionColor: { value: new THREE.Color('#FF8C00') },
            uEmissionStrength: { value: 1.5 }
        }
    });

    // Shader Mesh creation and positioning
    shaderMesh = new THREE.Mesh(shaderGeometry, shaderMaterial);
    shaderMesh.rotation.x = -Math.PI / 2;
    shaderMesh.rotation.z = -Math.PI / 3;
    shaderMesh.position.set(5, -5, -20);
    scene.add(shaderMesh);

    // Create the backdrop plane
    backgroundTexture = new THREE.TextureLoader().load('./images/cloudSky.jpg');
    backgroundMaterial = new THREE.MeshBasicMaterial({ map: backgroundTexture, side: THREE.DoubleSide });
    backgroundGeometry = new THREE.PlaneGeometry(120, 100);
    backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
    backgroundMesh.position.set(20, -20, -50);
    scene.add(backgroundMesh);
}

function resetFire(scene) {
    scene.remove(volcano);
    scene.remove(volcanoLight);
    scene.remove(shaderMesh);
    shaderGeometry.dispose();
    shaderMaterial.dispose();
    scene.remove(backgroundMesh);
    backgroundTexture.dispose();
    backgroundMaterial.dispose();
    backgroundGeometry.dispose();
}

function createTreeScene(scene, camera) {
    const width = 80, height = 40, segmentsW = 100, segmentsH = 50;
    const groundGeo = new THREE.PlaneGeometry(width, height, segmentsW, segmentsH);

    // Distort vertices with Perlin noise to simulate texture
    const noise = new ImprovedNoise();
    const perlinZ = Math.random() * 100;
    for (let i = 0; i < groundGeo.attributes.position.count; i++) {
        const x = groundGeo.attributes.position.getX(i);
        const y = groundGeo.attributes.position.getY(i);
        const noiseVal = noise.noise(x * 5, y * 5, perlinZ); //frequency
        const z = noiseVal * 0.3; // bumpiness
        groundGeo.attributes.position.setZ(i, z);
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 1.75;
    ground.rotation.z = -Math.PI / 3;
    ground.position.set(camera.position.x, camera.position.y - 2.5, camera.position.z - 5);
    ground.receiveShadow = true;
    scene.add(ground);
    treeObjects.push(ground);

    const loader = new GLTFLoader();

    loader.load('./models/pine_tree.glb', (gltf) => {
        const baseTree = gltf.scene;
        baseTree.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        const defaultPos = new THREE.Vector3(-7, 7, 30);

        const tree = baseTree.clone();
        tree.position.copy(defaultPos);
        tree.scale.set(0.005, 0.005, 0.005);
        tree.rotation.y = Math.random() * Math.PI * 2;
        scene.add(tree);
        treeObjects.push(tree);

        const count = 120;
        const radius = 8;

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * radius;
            const xOffset = Math.cos(angle) * dist;
            const zOffset = Math.sin(angle) * dist;
            const yAdjustment = -0.05 * xOffset + 7 * (zOffset / 30);

            const treeClone = baseTree.clone();
            treeClone.position.set(
                defaultPos.x + xOffset,
                defaultPos.y + yAdjustment,
                defaultPos.z + zOffset
            );
            treeClone.scale.set(0.005, 0.005, 0.005);
            treeClone.rotation.y = Math.random() * Math.PI * 2;
            scene.add(treeClone);
            treeObjects.push(treeClone);
        }
    });
}

function resetTree(scene) {
    treeObjects.forEach(obj => scene.remove(obj));
    treeObjects = [];
}


export function triggerInSceneWarp(scene, camera, duration = 3000) {
    const trailCount = 1000;
    const positions = new Float32Array(trailCount * 6); // 2 points per line (start and end)

    const velocities = new Float32Array(trailCount);
    const lengths = new Float32Array(trailCount); // length of the line (for control)

    for (let i = 0; i < trailCount; i++) {
        const x = (Math.random() - 0.5) * 100;
        const y = (Math.random() - 0.5) * 100;
        const z = Math.random() * -200 - 10;

        // Head (front)
        positions[i * 6 + 0] = x;
        positions[i * 6 + 1] = y;
        positions[i * 6 + 2] = z;

        // Tail (back)
        positions[i * 6 + 3] = x;
        positions[i * 6 + 4] = y;
        positions[i * 6 + 5] = z + 1;

        velocities[i] = 3 + Math.random() * 2;
        lengths[i] = 3 + Math.random() * 3;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.7,
        linewidth: 2,
        depthWrite: false,
    });

    const trails = new THREE.LineSegments(geometry, material);
    scene.add(trails);

    const startTime = performance.now();

    function animateWarp() {
        const now = performance.now();
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        const speedFactor = easeInCubic(t);

        const pos = geometry.attributes.position.array;

        for (let i = 0; i < trailCount; i++) {
            const vx = velocities[i] * speedFactor;
            const len = lengths[i];

            const fx = i * 6;
            const fy = fx + 1;
            const fz = fx + 2;

            const bx = fx + 3;
            const by = fy + 3;
            const bz = fz + 3;

            pos[fz] += vx;

            const dynamicLength = len * Math.pow(speedFactor, 1.4) * 2.5;
            pos[bz] = pos[fz] - dynamicLength;

            if (pos[fz] > camera.position.z + 10) {
                const x = (Math.random() - 0.5) * 100;
                const y = (Math.random() - 0.5) * 100;
                const z = -200 - Math.random() * 100;
                pos[fx] = pos[bx] = x;
                pos[fy] = pos[by] = y;
                pos[fz] = z;
                pos[bz] = z - len;
            }
        }

        geometry.attributes.position.needsUpdate = true;

        if (t < 1) {
            requestAnimationFrame(animateWarp);
        } else {
            scene.remove(trails);
            geometry.dispose();
            material.dispose();
            
        }
    }


    animateWarp();
    console.log(currentAudio);
    if (currentAudio) {
        const audio = new Audio('./audio/warp.mp3');
        audio.volume = 0.8;
        audio.play();
    }
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function easeInQuad(t) {
    return t * t; // starts slow, speeds up
}
function easeInCubic(t) {
    return t * t * t;
}
function easeInExpo(t) {
    return t === 0 ? 0 : Math.pow(2, 10 * (t - 1));
}