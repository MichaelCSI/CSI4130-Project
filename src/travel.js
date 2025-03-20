import waterVert from './shaders/waterVert';
import waterFrag from './shaders/waterFrag';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';

var shaderGeometry, shaderMaterial, shaderMesh;
var backgroundTexture, backgroundMaterial, backgroundGeometry, backgroundMesh;

var volcano;
var volcanoLight;




export function updateBackground(oldBG, newBG, scene, camera) {
    if(oldBG.localeCompare("water") == 0) {
        resetWater(scene);
    } else if (oldBG.localeCompare("tree") == 0) {
        // ...
    } else if(oldBG.localeCompare("fire") == 0) {
        resetFire(scene);
    }

    if(newBG.localeCompare("water") == 0) {
        createWaterScene(scene, camera);
    } else if(newBG.localeCompare("tree") == 0) {
        // ...
    } else if(newBG.localeCompare("fire") == 0) {
        createFireScene(scene, camera);
    }
}
export function animateScene(shaderTime, backgroundTime) {
    shaderMaterial.uniforms.uTime.value = shaderTime;
    backgroundMesh.rotation.z = backgroundTime;
}



// Water scene
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
    backgroundMesh.position.set(camera.position.x + 20, camera.position.y, camera.position.z -50);
    scene.add(backgroundMesh);
}
function resetWater(scene) {
    scene.remove(shaderMesh);
    shaderGeometry.dispose();
    shaderMaterial.dispose();
    scene.remove(backgroundMesh)
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