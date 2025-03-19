import waterVert from './shaders/waterVert';
import waterFrag from './shaders/waterFrag';
import * as THREE from 'three';

var waterGeometry, waterMaterial, waterMesh;
var waterBackgroundTexture, waterBackgroundMaterial, waterBackgroundGeometry, waterBackgroundMesh;

export function updateBackground(oldBG, newBG, scene, camera) {
    if(oldBG.localeCompare("water") == 0) {
        resetWater(scene);
    } else if(false) {
        // other scenes...
    }

    if(newBG.localeCompare("water") == 0) {
        createWaterScene(scene, camera);
    } else if(false) {
        // other scenes...
    }
}

function createWaterScene(scene, camera) {
    // Use a simple plane with the water shaders to create an ocean/body of water
    waterGeometry = new THREE.PlaneGeometry(80, 40, 1024, 512);
    waterMaterial = new THREE.ShaderMaterial({
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
    
    // Mesh creation and positioning
    waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
    waterMesh.rotation.x = -Math.PI / 1.75;
    waterMesh.rotation.z = -Math.PI / 3;
    waterMesh.position.set(camera.position.x, camera.position.y - 2.5, camera.position.z - 5);
    scene.add(waterMesh);

    // Create the backdrop plane
    waterBackgroundTexture = new THREE.TextureLoader().load('./images/waterSky.png');
    waterBackgroundMaterial = new THREE.MeshBasicMaterial({ map: waterBackgroundTexture, side: THREE.DoubleSide });
    waterBackgroundGeometry = new THREE.PlaneGeometry(80, 60);
    waterBackgroundMesh = new THREE.Mesh(waterBackgroundGeometry, waterBackgroundMaterial);
    waterBackgroundMesh.position.set(camera.position.x + 20, camera.position.y, camera.position.z -50);
    scene.add(waterBackgroundMesh);
}
function resetWater(scene) {
    scene.remove(waterMesh);
    waterGeometry.dispose();
    waterMaterial.dispose();
    scene.remove(waterBackgroundMesh)
    waterBackgroundTexture.dispose();
    waterBackgroundMaterial.dispose();
    waterBackgroundGeometry.dispose();
}
export function animateWater(elapsedTime) {
    waterMaterial.uniforms.uTime.value = elapsedTime;
}
