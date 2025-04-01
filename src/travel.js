import waterVert from './shaders/waterVert';
import waterFrag from './shaders/waterFrag';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise.js';

var shaderGeometry, shaderMaterial, shaderMesh;
var backgroundTexture, backgroundMaterial, backgroundGeometry, backgroundMesh;

var volcano;
var volcanoLight;

var treeObjects = [];

export function updateBackground(oldBG, newBG, scene, camera) {
    if(oldBG.localeCompare("water") == 0) {
        resetWater(scene);
    } else if (oldBG.localeCompare("tree") == 0) {
        resetTree(scene);
    } else if(oldBG.localeCompare("fire") == 0) {
        resetFire(scene);
    }


    if(newBG.localeCompare("water") == 0) {
        createWaterScene(scene, camera);
    } else if(newBG.localeCompare("tree") == 0) {
        createTreeScene(scene, camera);
    } else if(newBG.localeCompare("fire") == 0) {
        createFireScene(scene, camera);
    }
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

function warp(scene, camera){
    
}