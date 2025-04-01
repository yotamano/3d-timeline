// Register the ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

// Scene setup
let scene, camera, renderer, model;
let lights = {};
let mainTimeline; // Single unified timeline
// Mouse movement variables
let mouse = { x: 0, y: 0 };
let targetRotationX = 0;
let targetRotationY = 0;
let currentRotationX = 0;
let currentRotationY = 0;
// How much the camera will rotate in response to mouse movement
const mouseSensitivity = 0.0005;
// How quickly the camera follows the target rotation (0-1)
const rotationDamping = 0.05;

// Store animation state that can be edited by the timeline
window.animationState = {
    // Model object - only spins at the end
    'model': {
        'rotation': {
            'x': [
                { position: 0, value: 0 },
                { position: 75, value: 0 },
                { position: 100, value: 1.57 }
            ],
            'y': [
                { position: 0, value: 0 },
                { position: 75, value: 0 },
                { position: 100, value: 3.14 }
            ],
            'z': [
                { position: 0, value: 0 },
                { position: 75, value: 0 },
                { position: 90, value: 0.4 },
                { position: 100, value: 0 }
            ]
        },
        'position': {
            'y': [
                { position: 0, value: 0 },
                { position: 75, value: 0 },
                { position: 90, value: 0.3 },
                { position: 100, value: 0 }
            ]
        }
    },
    // Camera object - starts close, moves back, then orbits
    'camera': {
        'position': {
            'z': [
                { position: 0, value: 1.5 },     // Very close
                { position: 25, value: 4 },      // Dollying back
                { position: 50, value: 6 },      // Continuing back
                { position: 75, value: 8 },      // Furthest point
                { position: 100, value: 7 }      // Slight move forward at end
            ],
            'y': [
                { position: 0, value: 0 },
                { position: 25, value: 0.2 },
                { position: 50, value: 0.5 },
                { position: 75, value: 0.8 },
                { position: 100, value: 0.5 }
            ],
            'x': [
                { position: 0, value: 0 },       // Start centered
                { position: 25, value: 0.2 },    // Slight movement
                { position: 50, value: 2 },      // Begin orbit
                { position: 62.5, value: 5 },    // Orbit point 1
                { position: 75, value: 0 },      // Orbit point 2
                { position: 87.5, value: -5 },   // Orbit point 3
                { position: 100, value: 0 }      // Return to center
            ]
        },
        'rotation': {
            'y': [
                { position: 0, value: 0 },
                { position: 25, value: 0 },      // No rotation initially
                { position: 50, value: 0.5 },    // Begin turning
                { position: 62.5, value: 1.57 }, // 90 degrees
                { position: 75, value: 3.14 },   // 180 degrees
                { position: 87.5, value: 4.71 }, // 270 degrees
                { position: 100, value: 6.28 }   // Full circle
            ],
            'x': [
                { position: 0, value: -0.1 },    // Looking slightly down
                { position: 25, value: 0 },      // Level view
                { position: 50, value: 0.1 },    // Looking slightly up
                { position: 75, value: 0.2 },    // Looking more up
                { position: 100, value: 0.1 }    // Back to slight up
            ]
        }
    },
    // Main light - changes color and intensity
    'pointLight': {
        'intensity': {
            'value': [
                { position: 0, value: 0.3 },     // Very low light
                { position: 25, value: 1 },      // Brighter
                { position: 50, value: 2 },      // Even brighter
                { position: 75, value: 2.5 },    // Brightest
                { position: 100, value: 3 }      // Dramatic peak
            ]
        },
        'color': {
            // RGB colors as hex values converted to decimals
            'r': [
                { position: 0, value: 1 },       // White/neutral (r=1)
                { position: 25, value: 0 },      // Blue (r=0)
                { position: 50, value: 0.2 },    // Starting to red (r=0.2)
                { position: 75, value: 1 },      // Full red (r=1)
                { position: 100, value: 1 }      // Stay red
            ],
            'g': [
                { position: 0, value: 1 },       // White/neutral (g=1)
                { position: 25, value: 0.5 },    // Blue (g=0.5)
                { position: 50, value: 0.2 },    // Reducing for red (g=0.2)
                { position: 75, value: 0.1 },    // Very low for red (g=0.1)
                { position: 100, value: 0.3 }    // Slight increase
            ],
            'b': [
                { position: 0, value: 1 },       // White/neutral (b=1)
                { position: 25, value: 1 },      // Blue (b=1)
                { position: 50, value: 0.5 },    // Reducing (b=0.5)
                { position: 75, value: 0.2 },    // Low for red (b=0.2)
                { position: 100, value: 0.3 }    // Slight increase
            ]
        }
    },
    // Rim light - appears dramatically at the end
    'rimLight': {
        'intensity': {
            'value': [
                { position: 0, value: 0 },       // Off at start
                { position: 60, value: 0 },      // Still off
                { position: 75, value: 0.5 },    // Starting to show
                { position: 85, value: 1.5 },    // Full dramatic power
                { position: 100, value: 2 }      // Extra bright at end
            ]
        },
        'position': {
            'x': [
                { position: 0, value: 0 },
                { position: 75, value: 0 },
                { position: 85, value: -2 },
                { position: 100, value: -3 }
            ],
            'y': [
                { position: 0, value: 4 },
                { position: 75, value: 4 },
                { position: 100, value: 5 }
            ]
        },
        'color': {
            // Blue rim light that shifts to purple at the end
            'r': [
                { position: 0, value: 0 },       // Blue (r=0)
                { position: 75, value: 0 },      // Still blue
                { position: 100, value: 0.5 }    // Add some red for purple
            ],
            'g': [
                { position: 0, value: 0.5 },     // Blue (g=0.5)
                { position: 75, value: 0.2 },    // Darker blue
                { position: 100, value: 0 }      // No green for purple
            ],
            'b': [
                { position: 0, value: 1 },       // Blue (b=1)
                { position: 75, value: 1 },      // Still blue
                { position: 100, value: 1 }      // Full blue component for purple
            ]
        }
    }
};

// Cubic bezier easing function for smooth animations
const ease = {
    smooth: "power2.inOut",
    in: "power2.in",
    out: "power2.out"
};

// Initialize the scene
function init() {
    console.log("Initializing Three.js scene...");
    
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ 
        canvas: document.getElementById('scene'),
        antialias: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Set up lights
    setupLights();
    
    // Handle window resize for main canvas
    window.addEventListener('resize', onWindowResize);
    
    // Start animation loop
    animate();
    
    console.log("Three.js core scene initialized.");
    
    // Return the promise from loadModel to chain dependent initializations
    return loadModel(); 
}

// Set up lights for the scene
function setupLights() {
    // Ambient light - very low for dramatic effect
    lights.ambient = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(lights.ambient);
    
    // Directional light (main light)
    lights.main = new THREE.DirectionalLight(0xffffff, 0.8);
    lights.main.position.set(1, 2, 1);
    lights.main.castShadow = true;
    lights.main.shadow.mapSize.width = 1024;
    lights.main.shadow.mapSize.height = 1024;
    scene.add(lights.main);
    
    // Main dramatic point light (this is the one that will change color)
    lights.accent = new THREE.PointLight(0xffffff, 0.3, 15, 2); // color, intensity, distance, decay
    lights.accent.position.set(-1, 1, 2);
    lights.accent.castShadow = true;
    scene.add(lights.accent);
    
    // Additional rim light for dramatic effect
    lights.rim = new THREE.SpotLight(0x0088ff, 0.8, 15, Math.PI/4, 0.5, 1);
    lights.rim.position.set(0, 4, -3);
    lights.rim.castShadow = true;
    scene.add(lights.rim);
}

// Load 3D model
function loadModel() {
    return new Promise((resolve, reject) => {
        // Use a placeholder geometry initially
        const geometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            metalness: 0.5,
            roughness: 0.5
        });
        model = new THREE.Mesh(geometry, material);
        model.castShadow = true;
        model.receiveShadow = true;
        scene.add(model);
        
        // Add a platform for the model
        const platformGeo = new THREE.PlaneGeometry(10, 10);
        const platformMat = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            metalness: 0.3,
            roughness: 0.8
        });
        const platform = new THREE.Mesh(platformGeo, platformMat);
        platform.rotation.x = -Math.PI / 2;
        platform.position.y = -2;
        platform.receiveShadow = true;
        scene.add(platform);
        
        // Notify the ModesManager if it exists
        if (window.modesManager) {
            window.modesManager.syncEditorScene();
        }
        
        resolve();
        
        // In a real app, you would load a model like this:
        /*
        const loader = new THREE.GLTFLoader();
        loader.load(
            'path/to/model.glb',
            function (gltf) {
                model = gltf.scene;
                scene.add(model);
                resolve();
            },
            undefined,
            function (error) {
                console.error('Error loading model:', error);
                reject(error);
            }
        );
        */
    });
}

// Register Three.js objects to the window scope
function registerSceneObjects() {
    console.log("Registering scene objects...");
    
    // Store all the Three.js objects that can be animated in a global object
    window.sceneObjects = {
        model: model,
        camera: camera,
        pointLight: lights.accent,
        rimLight: lights.rim
    };
    
    console.log("Scene objects registered:", Object.keys(window.sceneObjects));
}

// Initialize the main timeline
function initTimeline(triggerSelector) {
    console.log(`Initializing main timeline with trigger: ${triggerSelector}...`);
    
    // First, clear any existing timeline and ScrollTrigger instances
    if (window.timeline) {
        console.log("Killing existing timeline and ScrollTrigger...");
        if (window.timeline.scrollTrigger) {
            window.timeline.scrollTrigger.kill();
        }
        window.timeline.kill();
    }
    
    // Create the timeline with ScrollTrigger
    mainTimeline = gsap.timeline({
        paused: false, // Let ScrollTrigger control it
        onUpdate: function() {
            // When the timeline updates, update the 3D scene
            // Reduce console noise slightly by checking progress difference
            // if (Math.abs(this.progress() - (window.lastTimelineProgress || 0)) > 0.001) {
            //     console.log("Timeline update, progress:", this.progress());
            //     window.lastTimelineProgress = this.progress();
            // }
            updateSceneFromTimeline(this.progress());
        }
    });
    
    // Add a dummy animation to give the timeline duration
    mainTimeline.to({}, { duration: 1 });
    
    // Create a ScrollTrigger and attach it to the timeline
    const trigger = ScrollTrigger.create({
        animation: mainTimeline,
        trigger: triggerSelector, // <-- Use the parameter
        start: "top top", // Start at the top of the viewport
        end: "bottom bottom", // End at the bottom of the viewport
        scrub: 0.5, // Smooth scrubbing with 0.5 second lag
        markers: false, // Set to false for production
        invalidateOnRefresh: true, // Recalculate values on refresh
        onUpdate: function(self) {
            // This is the ONLY place that should update the playhead during scroll
            if (window.timelineEditor && !window.timelineEditor.isUpdatingFromDrag) {
                // Use requestAnimationFrame for smoother updates
                requestAnimationFrame(() => {
                    const progress = self.progress;
                    if (window.timelineEditor.timelinePlayhead) {
                        window.timelineEditor.timelinePlayhead.style.left = `${progress * 100}%`;
                    }
                    // Also update the passed area to match the playhead position
                    if (window.timelineEditor.timelinePassedArea) {
                        window.timelineEditor.timelinePassedArea.style.width = `${progress * 100}%`;
                    }
                    window.timelineEditor.state.timelineProgress = progress;
                    
                    // Update scene mode scroll progress indicator
                    const sceneScrollProgress = document.querySelector('.scene-scroll-progress');
                    if (sceneScrollProgress) {
                        sceneScrollProgress.style.width = `${progress * 100}%`;
                    }
                });
            }
        }
    });
    
    // Store references globally
    window.timeline = mainTimeline;
    mainTimeline.scrollTrigger = trigger;
    
    console.log("Main timeline initialized with ScrollTrigger");
    
    // Build the initial animation state
    // IMPORTANT: buildGSAPTimeline needs to be called AFTER initTimeline
    // It's currently called correctly in the DOMContentLoaded sequence
    //window.buildGSAPTimeline(window.animationState);
}

// Resize handler for the main canvas/camera
function onWindowResize() {
    if (!camera || !renderer) return;
    
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Refresh ScrollTrigger after main resize
    if (window.ScrollTrigger) {
        ScrollTrigger.refresh();
    }
}

// Mouse move handler
function onMouseMove(event) {
    // Skip mouse movement handling in scene mode
    if (window.modesManager && window.modesManager.currentMode === 'scene') {
        return;
    }
    
    // Calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Set target rotation based on mouse position
    targetRotationY = mouse.x * Math.PI * 0.1; // subtle rotation, about 18 degrees max
    targetRotationX = mouse.y * Math.PI * 0.05; // even more subtle on vertical, about 9 degrees max
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Smoothly interpolate current rotation towards target rotation
    currentRotationX += (targetRotationX - currentRotationX) * rotationDamping;
    currentRotationY += (targetRotationY - currentRotationY) * rotationDamping;
    
    // Check if we're in scene mode
    const isSceneMode = window.modesManager && window.modesManager.currentMode === 'scene';
    
    // Only apply mouse-based rotation when camera exists and not in scene mode
    if (camera && model && !isSceneMode) {
        // First, ensure camera is looking at the model (this is what the timeline does)
        camera.lookAt(model.position);
        
        // Store the original quaternion after lookAt is applied
        const originalQuaternion = camera.quaternion.clone();
        
        // Create rotation quaternions for the mouse movement
        const rotationX = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 1, 0), // Y-axis rotation
            currentRotationY
        );
        const rotationY = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(1, 0, 0), // X-axis rotation
            currentRotationX
        );
        
        // Apply rotations in the correct order
        camera.quaternion.copy(originalQuaternion);
        camera.quaternion.multiply(rotationX);
        camera.quaternion.multiply(rotationY);
    }
    
    // Render the scene
    renderer.render(scene, camera);
}

// Utility functions for color conversion
function rgbToHex(r, g, b) {
    // Ensure RGB values are in 0-1 range
    r = Math.min(Math.max(0, r), 1);
    g = Math.min(Math.max(0, g), 1);
    b = Math.min(Math.max(0, b), 1);
    
    // Convert to 0-255 range and get hex string
    r = Math.floor(r * 255);
    g = Math.floor(g * 255);
    b = Math.floor(b * 255);
    
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function hexToRgb(hex) {
    // Remove # if present
    hex = hex.replace(/^#/, '');
    
    // Parse hex to RGB
    const bigint = parseInt(hex, 16);
    const r = ((bigint >> 16) & 255) / 255;
    const g = ((bigint >> 8) & 255) / 255;
    const b = (bigint & 255) / 255;
    
    return { r, g, b };
}

// Make these functions available globally
window.rgbToHex = rgbToHex;
window.hexToRgb = hexToRgb;

// Function to interpolate values based on keyframes
function interpolateValue(keyframes, progress) {
    if (!keyframes || keyframes.length === 0) return 0;
    if (keyframes.length === 1) return keyframes[0].value;
    
    // Find the keyframes on either side of the current progress
    let startFrame = keyframes[0];
    let endFrame = keyframes[keyframes.length - 1];
    
    for (let i = 0; i < keyframes.length - 1; i++) {
        if (progress >= keyframes[i].position / 100 && progress <= keyframes[i+1].position / 100) {
            startFrame = keyframes[i];
            endFrame = keyframes[i+1];
            break;
        }
    }
    
    // If we're before the first keyframe or after the last, use those values
    if (progress <= startFrame.position / 100) return startFrame.value;
    if (progress >= endFrame.position / 100) return endFrame.value;
    
    // Calculate the percentage between these two keyframes
    const keyframeProgress = (progress * 100 - startFrame.position) / (endFrame.position - startFrame.position);
    
    // Special handling for color interpolation if the values are hex colors
    if (typeof startFrame.value === 'string' && startFrame.value.startsWith('#') &&
        typeof endFrame.value === 'string' && endFrame.value.startsWith('#')) {
        
        // Convert hex colors to RGB
        const startRgb = hexToRgb(startFrame.value);
        const endRgb = hexToRgb(endFrame.value);
        
        // Interpolate each RGB component
        const r = startRgb.r + (endRgb.r - startRgb.r) * keyframeProgress;
        const g = startRgb.g + (endRgb.g - startRgb.g) * keyframeProgress;
        const b = startRgb.b + (endRgb.b - startRgb.b) * keyframeProgress;
        
        // Convert back to hex
        return rgbToHex(r, g, b);
    }
    
    // Linear interpolation between the two values for numeric values
    return startFrame.value + (endFrame.value - startFrame.value) * keyframeProgress;
}

// Make interpolateValue available globally
window.interpolateValue = interpolateValue;

// Function to apply animation values to Three.js objects
function updateSceneFromTimeline(progress) {
    if (!window.sceneObjects || !window.animationState) {
        console.warn("Scene objects or animation state not available");
        return;
    }
    
    console.log("Updating scene with progress:", progress);
    
    const objects = window.sceneObjects;
    const state = window.animationState;
    
    // Update each object based on the animation state
    for (const objectName in state) {
        if (!objects[objectName]) {
            console.warn(`Object ${objectName} not found in scene`);
            continue;
        }
        
        const object = objects[objectName];
        const objectState = state[objectName];
        
        // Update each property of the object
        for (const propertyName in objectState) {
            // Special handling for color property
            if (propertyName === 'color') {
                if (objectState.color.value) {
                    // Handle unified color format (hex or string format)
                    const colorValue = interpolateValue(objectState.color.value, progress);
                    
                    // Apply color to the light
                    if (object instanceof THREE.Light) {
                        // If the color is a hex number
                        if (typeof colorValue === 'number') {
                            object.color.setHex(colorValue);
                            console.log(`${objectName}.color = ${colorValue.toString(16)}`);
                        } 
                        // If the color is a hex string
                        else if (typeof colorValue === 'string' && colorValue.startsWith('#')) {
                            object.color.set(colorValue);
                            console.log(`${objectName}.color = ${colorValue}`);
                        }
                        // Legacy format with r,g,b components - to support backward compatibility
                        else if (objectState.color.r && objectState.color.g && objectState.color.b) {
                            const r = interpolateValue(objectState.color.r, progress);
                            const g = interpolateValue(objectState.color.g, progress);
                            const b = interpolateValue(objectState.color.b, progress);
                            object.color.setRGB(r, g, b);
                            console.log(`${objectName}.color = rgb(${r}, ${g}, ${b})`);
                        }
                    }
                } 
                // Legacy format handling
                else if (objectState.color.r && objectState.color.g && objectState.color.b) {
                    const r = interpolateValue(objectState.color.r, progress);
                    const g = interpolateValue(objectState.color.g, progress);
                    const b = interpolateValue(objectState.color.b, progress);
                    
                    // Apply color to the light
                    if (object instanceof THREE.Light) {
                        object.color.setRGB(r, g, b);
                        console.log(`${objectName}.color = rgb(${r}, ${g}, ${b})`);
                    }
                }
                continue;
            }

            if (!object[propertyName]) {
                console.warn(`Property ${propertyName} not found on ${objectName}`);
                continue;
            }
            
            const property = object[propertyName];
            const propertyState = objectState[propertyName];
            
            // Update each sub-property (x, y, z, value, etc.)
            for (const subProp in propertyState) {
                if (property[subProp] === undefined) {
                    console.warn(`Sub-property ${subProp} not found on ${objectName}.${propertyName}`);
                    continue;
                }
                
                const keyframes = propertyState[subProp];
                const interpolatedValue = interpolateValue(keyframes, progress);
                
                // Apply the interpolated value to the object
                property[subProp] = interpolatedValue;
                
                // Log value changes for debugging
                console.log(`${objectName}.${propertyName}.${subProp} = ${interpolatedValue}`);
            }
        }
    }
    
    // Make camera look at the model for the orbit effect
    // This ensures the camera always points at the model regardless of position
    if (camera && model) {
        // Use the model's position as the target
        camera.lookAt(model.position);
    }
    
    // Force a render is now unnecessary as animate() will handle rendering
    // The render happens every frame with mouse movement applied
    // renderer.render(scene, camera);
}

// Build or rebuild the GSAP timeline based on keyframe data
window.buildGSAPTimeline = function(animationData) {
    console.log("Building/rebuilding timeline with animation data");
    
    // Store the animation data globally
    window.animationState = animationData;
    
    // Make sure we have a timeline and scrollTrigger instance
    if (!window.timeline || !window.timeline.scrollTrigger) {
        console.warn("Timeline or ScrollTrigger not available during buildGSAPTimeline. Re-initializing...");
        // Determine current mode to initialize with correct trigger
        const currentMode = window.modesManager ? window.modesManager.currentMode : 'ui';
        const triggerSelector = (currentMode === 'scene') ? '.scene-mode-scroll-container' : '.scroll-container';
        initTimeline(triggerSelector);
        // Wait a tick for initTimeline to potentially complete async parts if any were added
        setTimeout(() => updateSceneFromTimeline(window.timeline.progress()), 0);
        return window.timeline;
    }
    
    // For existing timeline, we need to update the animation state
    // and then force a render update based on current scroll position
    
    // Get current progress
    const currentProgress = window.timeline.progress();
    console.log("Updating animation at current progress:", currentProgress);
    
    // Apply new animation state to the scene
    updateSceneFromTimeline(currentProgress);
    
    // Force ScrollTrigger to update (refresh might be better here too)
    ScrollTrigger.refresh(); 
    
    console.log("Timeline rebuild complete");
    return window.timeline;
};

// Material System
const materialSystem = {
    materials: {
        fabric: [
            { name: 'Pink Fabric', color: '#ff4a94', metalness: 0.1, roughness: 0.8, texture: null },
            { name: 'Textured Gray', color: '#888888', metalness: 0.2, roughness: 0.7, texture: null },
            { name: 'Light Linen', color: '#e9e9d9', metalness: 0.1, roughness: 0.9, texture: null },
            { name: 'Rose Velvet', color: '#cc8888', metalness: 0.15, roughness: 0.7, texture: null },
            { name: 'Silver Fabric', color: '#aaaaaa', metalness: 0.3, roughness: 0.6, texture: null },
            { name: 'Light Blue', color: '#8888ff', metalness: 0.1, roughness: 0.8, texture: null },
            { name: 'White Dotted', color: '#dddddd', metalness: 0.1, roughness: 0.85, texture: null },
            { name: 'Purple Fabric', color: '#9370db', metalness: 0.15, roughness: 0.7, texture: null },
            { name: 'Marble Print', color: '#d8d0c8', metalness: 0.2, roughness: 0.6, texture: null },
            { name: 'Teal Fabric', color: '#20b2aa', metalness: 0.1, roughness: 0.8, texture: null },
            { name: 'Yellow Fabric', color: '#ffdd33', metalness: 0.1, roughness: 0.9, texture: null },
            { name: 'Hot Pink', color: '#ff69b4', metalness: 0.2, roughness: 0.7, texture: null },
            { name: 'Orange Fabric', color: '#ff7043', metalness: 0.1, roughness: 0.8, texture: null },
            { name: 'Deep Blue', color: '#0000aa', metalness: 0.2, roughness: 0.6, texture: null },
            { name: 'Lime Green', color: '#8bc34a', metalness: 0.1, roughness: 0.8, texture: null }
        ],
        metal: [
            { name: 'Chrome', color: '#ffffff', metalness: 0.9, roughness: 0.1, texture: null },
            { name: 'Gold', color: '#ffd700', metalness: 0.8, roughness: 0.2, texture: null },
            { name: 'Copper', color: '#b87333', metalness: 0.8, roughness: 0.3, texture: null },
            { name: 'Silver', color: '#c0c0c0', metalness: 0.9, roughness: 0.15, texture: null },
            { name: 'Brass', color: '#b5a642', metalness: 0.7, roughness: 0.25, texture: null }
        ],
        currentMaterial: null
    },
    
    // Material preview renderer (shared for all previews)
    previewRenderer: null,
    previewScene: null,
    previewCamera: null,
    previewSphere: null,
    previewMaterial: null,
    
    // Initialize the material system
    init() {
        // Setup event listeners
        document.getElementById('material-preview-button').addEventListener('click', () => {
            this.toggleMaterialPanel();
        });
        
        document.getElementById('close-material-panel').addEventListener('click', () => {
            this.closeMaterialPanel();
        });
        
        document.querySelector('.material-category-header').addEventListener('click', () => {
            const metalGrid = document.getElementById('metal-grid');
            const toggle = document.querySelector('.material-category-toggle');
            
            if (metalGrid.style.display === 'none') {
                metalGrid.style.display = 'grid';
                toggle.style.transform = 'rotate(180deg)';
            } else {
                metalGrid.style.display = 'none';
                toggle.style.transform = 'rotate(0deg)';
            }
        });
        
        // Set up preview renderer (one time setup, will be reused)
        this.setupPreviewRenderer();
        
        // Setup material property controls
        this.setupPropertyControls();
        
        // Generate material previews
        this.generateMaterialPreviews();
        
        // Set default material to the model
        this.setMaterial(this.materials.fabric[0]);
        
        // Update button with current material preview
        this.updateMaterialButton();
    },
    
    // Setup a single shared renderer for material previews
    setupPreviewRenderer() {
        // Create an offscreen renderer
        this.previewRenderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true 
        });
        this.previewRenderer.setSize(200, 200);
        this.previewRenderer.setClearColor(0x000000, 0);
        this.previewRenderer.shadowMap.enabled = true;
        this.previewRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Create a preview scene
        this.previewScene = new THREE.Scene();
        
        // Create a camera with a wider field of view and more distance for better framing
        this.previewCamera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
        this.previewCamera.position.z = 4.5; // Increased distance to zoom out
        
        // Create studio lighting setup
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        this.previewScene.add(ambientLight);
        
        // Main key light (top right)
        const keyLight = new THREE.DirectionalLight(0xffffff, 1);
        keyLight.position.set(2, 2, 2);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 256;
        keyLight.shadow.mapSize.height = 256;
        keyLight.shadow.camera.near = 0.5;
        keyLight.shadow.camera.far = 10;
        this.previewScene.add(keyLight);
        
        // Fill light (left side)
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
        fillLight.position.set(-2, 0, 2);
        this.previewScene.add(fillLight);
        
        // Rim light (behind)
        const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
        rimLight.position.set(0, 0, -2);
        this.previewScene.add(rimLight);
        
        // Add environment map for reflections
        const cubeTextureLoader = new THREE.CubeTextureLoader();
        const envMap = cubeTextureLoader.load([
            'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/textures/cube/Bridge2/posx.jpg',
            'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/textures/cube/Bridge2/negx.jpg',
            'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/textures/cube/Bridge2/posy.jpg',
            'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/textures/cube/Bridge2/negy.jpg',
            'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/textures/cube/Bridge2/posz.jpg',
            'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/textures/cube/Bridge2/negz.jpg'
        ]);
        this.previewScene.environment = envMap;
        
        // Remove the ground plane to prevent cutoff
        
        // Create sphere geometry with higher quality for the preview
        const geometry = new THREE.SphereGeometry(1.0, 64, 64); // Increased from 0.7 to 1.0
        
        // Create material
        this.previewMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.5,
            roughness: 0.5,
            envMap: envMap,
            envMapIntensity: 1
        });
        
        // Create mesh
        this.previewSphere = new THREE.Mesh(geometry, this.previewMaterial);
        this.previewSphere.castShadow = true;
        this.previewSphere.receiveShadow = true;
        this.previewSphere.position.set(0, 0, 0); // Center the sphere
        this.previewScene.add(this.previewSphere);
    },
    
    // Render a preview image with the given material properties
    renderMaterialPreview(color, metalness, roughness) {
        // Apply material properties
        this.previewMaterial.color.set(color);
        this.previewMaterial.metalness = metalness;
        this.previewMaterial.roughness = roughness;
        
        // Adjust environment map intensity based on metalness
        this.previewMaterial.envMapIntensity = 0.5 + metalness * 0.5;
        
        // Rotate the sphere for a good viewing angle - less rotation for better centering
        this.previewSphere.rotation.y = Math.PI * 0.1;
        this.previewSphere.rotation.x = Math.PI * 0.02;
        
        // Make sure camera is looking at the sphere center
        this.previewCamera.lookAt(this.previewSphere.position);
        
        // Render the preview
        this.previewRenderer.render(this.previewScene, this.previewCamera);
        
        // Return the canvas with the rendered image
        return this.previewRenderer.domElement.toDataURL('image/png');
    },
    
    // Update the material button with current material preview
    updateMaterialButton() {
        if (!this.materials.currentMaterial) return;
        
        const material = this.materials.currentMaterial;
        const buttonIcon = document.querySelector('.material-preview-icon');
        
        // Get a data URL for the current material
        const imageUrl = this.renderMaterialPreview(
            material.color, 
            material.metalness, 
            material.roughness
        );
        
        // Set as background image
        buttonIcon.style.backgroundImage = `url(${imageUrl})`;
        buttonIcon.style.backgroundSize = 'cover';
    },
    
    // Setup material property controls
    setupPropertyControls() {
        // Setup color picker
        const colorPicker = document.getElementById('material-color-input');
        const colorSquare = document.getElementById('material-color-picker');
        const colorHex = document.getElementById('material-color-hex');
        
        // Initialize color picker with default color
        colorPicker.value = this.materials.fabric[0].color;
        colorSquare.style.backgroundColor = colorPicker.value;
        colorHex.textContent = colorPicker.value;
        
        // Handle color change
        colorPicker.addEventListener('input', (e) => {
            const newColor = e.target.value;
            colorSquare.style.backgroundColor = newColor;
            colorHex.textContent = newColor.toUpperCase();
            
            if (this.materials.currentMaterial) {
                this.materials.currentMaterial.color = newColor;
                this.setMaterial(this.materials.currentMaterial);
            }
        });
        
        // Setup metalness slider with drag functionality
        const metalnessSlider = document.getElementById('metalness-slider');
        const metalnessTrack = metalnessSlider.querySelector('.slider-track');
        
        // Initialize metalness with default value
        if (this.materials.currentMaterial) {
            metalnessTrack.style.width = `${this.materials.currentMaterial.metalness * 100}%`;
        }
        
        // Handle metalness change with drag
        this.setupSliderDrag(metalnessSlider, (value) => {
            if (this.materials.currentMaterial) {
                this.materials.currentMaterial.metalness = value;
                this.setMaterial(this.materials.currentMaterial);
            }
        });
        
        // Setup roughness slider with drag functionality
        const roughnessSlider = document.getElementById('roughness-slider');
        const roughnessTrack = roughnessSlider.querySelector('.slider-track');
        
        // Initialize roughness with default value
        if (this.materials.currentMaterial) {
            roughnessTrack.style.width = `${this.materials.currentMaterial.roughness * 100}%`;
        }
        
        // Handle roughness change with drag
        this.setupSliderDrag(roughnessSlider, (value) => {
            if (this.materials.currentMaterial) {
                this.materials.currentMaterial.roughness = value;
                this.setMaterial(this.materials.currentMaterial);
            }
        });
    },
    
    // Helper method to set up slider drag functionality
    setupSliderDrag(slider, callback) {
        const track = slider.querySelector('.slider-track');
        let isDragging = false;
        
        // Helper to update slider value based on mouse position
        const updateSliderValue = (e) => {
            const rect = slider.getBoundingClientRect();
            const value = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            track.style.width = `${value * 100}%`;
            callback(value);
        };
        
        // Mouse down event
        slider.addEventListener('mousedown', (e) => {
            isDragging = true;
            updateSliderValue(e);
        });
        
        // Mouse move event
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                updateSliderValue(e);
            }
        });
        
        // Mouse up event
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        // Click event for immediate value change
        slider.addEventListener('click', (e) => {
            updateSliderValue(e);
        });
    },
    
    // Generate material previews in the panel
    generateMaterialPreviews() {
        const fabricGrid = document.getElementById('fabric-grid');
        const metalGrid = document.getElementById('metal-grid');
        
        // Clear existing content
        fabricGrid.innerHTML = '';
        metalGrid.innerHTML = '';
        
        // Generate fabric previews
        this.materials.fabric.forEach((material, index) => {
            const preview = this.createMaterialPreview(material);
            if (index === 0) preview.classList.add('selected');
            preview.addEventListener('click', () => {
                this.selectMaterial(preview, material);
            });
            fabricGrid.appendChild(preview);
        });
        
        // Generate metal previews
        this.materials.metal.forEach((material) => {
            const preview = this.createMaterialPreview(material);
            preview.addEventListener('click', () => {
                this.selectMaterial(preview, material);
            });
            metalGrid.appendChild(preview);
        });
    },
    
    // Create a material preview element as an image
    createMaterialPreview(material) {
        const preview = document.createElement('div');
        preview.className = 'material-preview';
        
        // Render the preview image
        const imageUrl = this.renderMaterialPreview(
            material.color, 
            material.metalness, 
            material.roughness
        );
        
        // Create an image element
        const img = document.createElement('img');
        img.src = imageUrl;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain'; // Use contain instead of cover
        
        preview.appendChild(img);
        preview.material = material;
        
        return preview;
    },
    
    // Handle material selection
    selectMaterial(previewElement, material) {
        // Clear previous selection
        document.querySelectorAll('.material-preview.selected').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Add selection to current preview
        previewElement.classList.add('selected');
        
        // Update material property controls
        const colorInput = document.getElementById('material-color-input');
        const colorPicker = document.getElementById('material-color-picker');
        const colorHex = document.getElementById('material-color-hex');
        
        if (colorInput) colorInput.value = material.color;
        if (colorPicker) colorPicker.style.backgroundColor = material.color;
        if (colorHex) colorHex.textContent = material.color.toUpperCase();
        
        // Update slider text values
        const metalnessValue = document.querySelector('#metalness-slider .slider-value');
        const roughnessValue = document.querySelector('#roughness-slider .slider-value');
        
        if (metalnessValue) metalnessValue.textContent = material.metalness.toFixed(2);
        if (roughnessValue) roughnessValue.textContent = material.roughness.toFixed(2);
        
        // Update slider tracks to match material properties
        const metalnessTrack = document.querySelector('#metalness-slider .slider-track');
        const roughnessTrack = document.querySelector('#roughness-slider .slider-track');
        
        if (metalnessTrack) metalnessTrack.style.width = `${material.metalness * 100}%`;
        if (roughnessTrack) roughnessTrack.style.width = `${material.roughness * 100}%`;
        
        // Apply the material to the model
        this.setMaterial(material);
    },
    
    // Apply a material to the 3D model
    setMaterial(material) {
        if (model) {
            // Update the main model material
            model.material.color.set(material.color);
            model.material.metalness = material.metalness;
            model.material.roughness = material.roughness;
            
            // Keep track of current material
            this.materials.currentMaterial = material;
            
            // Update the button preview
            this.updateMaterialButton();
            
            // Also update the model button preview to reflect the new material
            if (modelSystem && modelSystem.updateModelButton) {
                modelSystem.updateModelButton();
            }
        }
    },
    
    // Toggle the material panel
    toggleMaterialPanel() {
        const panel = document.getElementById('material-panel');
        if (panel.style.display === 'block') {
            this.closeMaterialPanel();
        } else {
            // Close model panel if it's open
            const modelPanel = document.getElementById('model-panel');
            if (modelPanel && modelPanel.style.display === 'block') {
                modelSystem.closeModelPanel();
            }
            panel.style.display = 'block';
        }
    },
    
    // Close the material panel
    closeMaterialPanel() {
        document.getElementById('material-panel').style.display = 'none';
    }
};

// Modes Functionality
class ModesManager {
    constructor() {
        this.currentMode = 'ui'; // Default mode
        this.editorCamera = null;
        this.editorRenderer = null;
        this.cameraPreviewRenderer = null;
        this.editorScene = null;
        this.cameraIndicator = document.querySelector('.camera-indicator');
        this.lastScrollPosition = 0;
        this.transformControls = null; // Transform controls for gizmo
        this.activeTransformMode = 'translate'; // Default transform mode
        
        // Get the canvas elements
        this.editorViewCanvas = document.getElementById('editor-view-canvas');
        this.cameraPreviewCanvas = document.getElementById('camera-preview-canvas');
        
        // Get all mode buttons
        this.modeButtons = document.querySelectorAll('.mode-btn');
        
        this.init();
    }
    
    init() {
        // Setup event listeners for mode buttons
        this.modeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const mode = button.dataset.mode;
                this.setMode(mode);
            });
        });
        
        // Initialize scene mode elements
        this.setupEditorView();
        
        // Setup transform controls UI buttons
        this.setupTransformControlsUI();
        
        // Setup resize handling
        window.addEventListener('resize', () => this.handleResize());
        
        // Setup scroll handling to ensure animation still works in scene mode
        this.setupScrollHandling();
        
        // Handle keyboard shortcuts for transform controls
        document.addEventListener('keydown', (e) => {
            if (this.currentMode !== 'scene') return;
            
            switch(e.key) {
                case 'g': // Translate (grab)
                    this.setTransformMode('translate');
                    break;
                case 'r': // Rotate
                    this.setTransformMode('rotate');
                    break;
                case 's': // Scale
                    this.setTransformMode('scale');
                    break;
                case 'Escape': // Deselect
                    if (this.transformControls) {
                        this.transformControls.detach();
                    }
                    break;
            }
        });
    }
    
    // Set up UI for transform controls
    setupTransformControlsUI() {
        // Create transform control buttons if they don't exist
        if (!document.querySelector('.transform-controls')) {
            const controlsDiv = document.createElement('div');
            controlsDiv.className = 'transform-controls';
            controlsDiv.innerHTML = `
                <div class="transform-controls-content">
                    <button id="translate-btn" class="transform-btn active" title="Translate (G)">
                        <svg viewBox="0 0 24 24">
                            <path d="M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z" />
                        </svg>
                    </button>
                    <button id="rotate-btn" class="transform-btn" title="Rotate (R)">
                        <svg viewBox="0 0 24 24">
                            <path d="M12,5C16.97,5 21,9.03 21,14H19C19,10.13 15.87,7 12,7C8.13,7 5,10.13 5,14H3C3,9.03 7.03,5 12,5M12,2C18.07,2 23,6.93 23,13H21C21,8.04 16.96,4 12,4C7.04,4 3,8.04 3,13H1C1,6.93 5.93,2 12,2M12,19L8,15H16L12,19Z" />
                        </svg>
                    </button>
                    <button id="scale-btn" class="transform-btn" title="Scale (S)">
                        <svg viewBox="0 0 24 24">
                            <path d="M9,3L5,7H8V10H10V7H13L9,3M16,5V8H14V10H16V13L20,9L16,5M7,14L3,18L7,22V19H10V17H7V14M14,17V19H17V22L21,18L17,14V17H14Z" />
                        </svg>
                    </button>
                </div>
            `;
            
            document.body.appendChild(controlsDiv);
            
            // Add event listeners to buttons
            document.getElementById('translate-btn').addEventListener('click', () => this.setTransformMode('translate'));
            document.getElementById('rotate-btn').addEventListener('click', () => this.setTransformMode('rotate'));
            document.getElementById('scale-btn').addEventListener('click', () => this.setTransformMode('scale'));
            
            // Add CSS for transform controls
            const style = document.createElement('style');
            style.textContent = `
                .transform-controls {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    display: none;
                    z-index: 1000;
                    height: 50px;
                    min-height: 50px;
                    overflow: hidden;
                    padding: 6px;
                    border-radius: 6px;
                    background-color: rgba(20, 20, 20, 0.7);
                    border: 1px solid rgba(80, 80, 80, 0.3);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
                    transition: all 0.2s ease;
                }
                
                .transform-controls-content {
                    height: 38px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                body.scene-mode .transform-controls {
                    display: block;
                }
                
                .transform-btn {
                    width: 38px;
                    height: 38px;
                    border-radius: 4px;
                    margin: 0 4px;
                    background: rgba(40, 40, 40, 0.6);
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }
                
                .transform-btn:hover {
                    background: rgba(60, 60, 60, 0.8);
                }
                
                .transform-btn.active {
                    background: #0088ff;
                    box-shadow: 0 0 8px rgba(0, 136, 255, 0.5);
                }
                
                .transform-btn svg {
                    width: 18px;
                    height: 18px;
                    fill: white;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Set the transform mode (translate, rotate, scale)
    setTransformMode(mode) {
        if (!this.transformControls) return;
        
        this.activeTransformMode = mode;
        this.transformControls.setMode(mode);
        
        // Update UI buttons
        document.querySelectorAll('.transform-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const modeToId = {
            'translate': 'translate-btn',
            'rotate': 'rotate-btn',
            'scale': 'scale-btn'
        };
        
        const activeBtn = document.getElementById(modeToId[mode]);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }
    
    setupEditorView() {
        // Create a new scene for the editor view
        this.editorScene = new THREE.Scene();
        this.editorScene.background = new THREE.Color(0x111111);
        
        // Add back the grid helper as requested
        const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
        this.editorScene.add(gridHelper);
        
        // Create an editor camera
        this.editorCamera = new THREE.PerspectiveCamera(
            75, 
            1, // We'll set the correct aspect ratio in handleResize
            0.1, 
            1000
        );
        this.editorCamera.position.set(5, 5, 5);
        this.editorCamera.lookAt(0, 0, 0);
        
        // Create renderers
        this.editorRenderer = new THREE.WebGLRenderer({ 
            canvas: this.editorViewCanvas,
            antialias: true 
        });
        
        this.cameraPreviewRenderer = new THREE.WebGLRenderer({ 
            canvas: this.cameraPreviewCanvas,
            antialias: true 
        });
        
        // Initial size will be set in handleResize
        this.handleResize();
        
        // Add lights to editor scene for visibility
        const editorLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.editorScene.add(editorLight);
        
        const editorPointLight = new THREE.PointLight(0xffffff, 1);
        editorPointLight.position.set(5, 5, 5);
        this.editorScene.add(editorPointLight);
        
        // Add orbit controls to editor view with enhanced configuration
        this.editorControls = new THREE.OrbitControls(this.editorCamera, this.editorViewCanvas);
        this.editorControls.enableDamping = true;
        this.editorControls.dampingFactor = 0.05;
        this.editorControls.screenSpacePanning = true;
        this.editorControls.minDistance = 1;
        this.editorControls.maxDistance = 20;
        this.editorControls.maxPolarAngle = Math.PI * 0.9; // Limit to prevent going below ground
        this.editorControls.enableZoom = true;
        this.editorControls.zoomSpeed = 1.0;
        
        // Add transform controls for the gizmo
        this.transformControls = new THREE.TransformControls(this.editorCamera, this.editorViewCanvas);
        this.transformControls.setSize(0.75); // Make it slightly smaller for better visibility
        this.transformControls.addEventListener('dragging-changed', (event) => {
            // Disable orbit controls when transforming to avoid conflicts
            this.editorControls.enabled = !event.value;
            
            // If we're done dragging, update the main model to match the editor model
            if (!event.value && this.editorModel && model) {
                // Update the main model position, rotation, and scale
                model.position.copy(this.editorModel.position);
                model.rotation.copy(this.editorModel.rotation);
                model.scale.copy(this.editorModel.scale);
            }
        });
        this.editorScene.add(this.transformControls);
        
        // Set initial transform mode
        this.setTransformMode('translate');
        
        // Setup draggable functionality for the camera preview
        this.setupDraggablePreview();
    }
    
    activateSceneMode() {
        // Make sure we have the latest scene objects
        this.syncEditorScene();
        
        // Handle resize to make sure canvases have the right size
        this.handleResize();
        
        // Start rendering the editor view
        this.renderEditorView();
        
        // Make sure ScrollTrigger still works in scene mode
        if (window.ScrollTrigger) {
            ScrollTrigger.refresh();
            ScrollTrigger.update();
        }
    }
    
    syncEditorScene() {
        // Clear existing camera helper and model if any
        this.editorScene.children = this.editorScene.children.filter(child => 
            !(child instanceof THREE.CameraHelper || child instanceof THREE.Group || 
              child instanceof THREE.Mesh && !(child instanceof THREE.GridHelper)) &&
            !(child instanceof THREE.TransformControls)); // Keep the transform controls
        
        // Make sure transform controls are in the scene
        if (this.transformControls && !this.editorScene.children.includes(this.transformControls)) {
            this.editorScene.add(this.transformControls);
        }
        
        // Add a camera helper if camera exists
        if (camera) {
            const cameraHelper = new THREE.CameraHelper(camera);
            this.editorScene.add(cameraHelper);
        }
        
        // Add model to editor scene if it exists
        if (model) {
            try {
                // Clone the model for the editor scene
                const editorModel = model.clone();
                this.editorScene.add(editorModel);
                
                // Store reference to editor model
                this.editorModel = editorModel;
                
                // Attach transform controls to the model
                if (this.transformControls) {
                    this.transformControls.attach(editorModel);
                }
                
                // Also add platform if it exists
                const platform = scene.children.find(child => 
                    child instanceof THREE.Mesh && 
                    child.geometry instanceof THREE.PlaneGeometry &&
                    child !== model);
                
                if (platform) {
                    const editorPlatform = platform.clone();
                    this.editorScene.add(editorPlatform);
                }
            } catch (error) {
                console.error("Error cloning model:", error);
            }
        }
    }
    
    deactivateSceneMode() {
        // Stop rendering the editor view
        cancelAnimationFrame(this.editorAnimationFrame);
        
        // Detach transform controls
        if (this.transformControls) {
            this.transformControls.detach();
        }
    }
    
    renderEditorView() {
        // Animation loop for editor view
        this.editorAnimationFrame = requestAnimationFrame(() => this.renderEditorView());
        
        // Update controls
        if (this.editorControls) {
            this.editorControls.update();
        }
        
        // Only sync from editor model to main model when not dragging
        // This prevents jitter during transformation
        if (!this.transformControls || !this.transformControls.dragging) {
            // Sync main model with editor model if they exist (when not dragging)
            if (model && this.editorModel) {
                model.position.copy(this.editorModel.position);
                model.rotation.copy(this.editorModel.rotation);
                model.scale.copy(this.editorModel.scale);
            }
        }
        
        // Only render if renderers are initialized
        if (this.editorRenderer && this.cameraPreviewRenderer) {
            // Render editor view (right side)
            if (this.editorScene && this.editorCamera) {
                this.editorRenderer.render(this.editorScene, this.editorCamera);
            }
            
            // Render camera preview (left side)
            if (scene && camera) {
                this.cameraPreviewRenderer.render(scene, camera);
            }
            
            // Update camera indicator position
            this.updateCameraIndicator();
        }
    }
    
    updateCameraIndicator() {
        // Only update if all necessary elements exist
        if (!camera || !this.editorCamera || !this.cameraIndicator || !this.editorViewCanvas) {
            return;
        }
        
        try {
            // Get the camera position in world space
            const cameraPos = new THREE.Vector3();
            camera.getWorldPosition(cameraPos);
            
            // Project the world position to screen coordinates
            const vector = cameraPos.clone();
            vector.project(this.editorCamera);
            
            // Convert to 2D screen position
            const x = (vector.x + 1) / 2 * this.editorViewCanvas.width;
            const y = -(vector.y - 1) / 2 * this.editorViewCanvas.height;
            
            // Update the indicator position
            this.cameraIndicator.style.left = `${x}px`;
            this.cameraIndicator.style.top = `${y}px`;
            
            // Calculate the rotation based on camera's looking direction
            const direction = new THREE.Vector3(0, 0, -1);
            direction.applyQuaternion(camera.quaternion);
            
            // Calculate the angle in the XZ plane (horizontal rotation)
            const angle = Math.atan2(direction.x, direction.z);
            
            // Apply rotation to the indicator
            this.cameraIndicator.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;
        } catch (error) {
            console.error("Error updating camera indicator:", error);
        }
    }
    
    handleResize() {
        if (!this.editorCamera || !this.editorRenderer || !this.cameraPreviewRenderer) return;
        
        // Calculate the actual dimensions for editor view (full screen now)
        const editorWidth = window.innerWidth;
        const editorHeight = window.innerHeight;
        
        // Get camera preview container dimensions
        const previewContainer = document.querySelector('.floating-camera-preview');
        // Ensure preview dimensions are at least 1x1 to avoid division by zero or NaN aspect
        const previewWidth = previewContainer ? Math.max(1, previewContainer.clientWidth) : window.innerWidth / 3;
        const previewHeight = previewContainer ? Math.max(1, previewContainer.clientHeight) : window.innerHeight / 3;
        
        // Update camera aspect ratios
        this.editorCamera.aspect = editorWidth / editorHeight;
        this.editorCamera.updateProjectionMatrix();
        
        // Update renderer sizes to maintain aspect ratio
        this.editorRenderer.setSize(editorWidth, editorHeight);
        this.cameraPreviewRenderer.setSize(previewWidth, previewHeight);
        
        // Update the preview camera's aspect ratio if it exists
        if (camera) {
            // Match the preview container aspect ratio
            camera.aspect = previewWidth / previewHeight;
            camera.updateProjectionMatrix();
        }
        
        // Refresh ScrollTrigger after mode-specific resize
        if (window.ScrollTrigger) {
            ScrollTrigger.refresh();
        }
    }
    
    setupDraggablePreview() {
        const previewContainer = document.querySelector('.floating-camera-preview');
        if (!previewContainer) return;
        
        let isDragging = false;
        let isResizing = false;
        let startX, startY, startWidth, startHeight, startLeft, startTop;
        
        // Handle dragging
        const dragHandle = previewContainer.querySelector('.preview-drag-handle');
        if (dragHandle) {
            dragHandle.addEventListener('mousedown', (e) => {
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                startLeft = parseInt(document.defaultView.getComputedStyle(previewContainer).left, 10);
                startTop = parseInt(document.defaultView.getComputedStyle(previewContainer).top, 10);
                
                e.preventDefault();
            });
        }
        
        // Handle resizing
        const resizeHandle = previewContainer.querySelector('.preview-resize-handle');
        if (resizeHandle) {
            resizeHandle.addEventListener('mousedown', (e) => {
                isResizing = true;
                startX = e.clientX;
                startY = e.clientY;
                startWidth = parseInt(document.defaultView.getComputedStyle(previewContainer).width, 10);
                startHeight = parseInt(document.defaultView.getComputedStyle(previewContainer).height, 10);
                
                e.preventDefault();
            });
        }
        
        // Handle mouse move for both actions
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                
                previewContainer.style.left = (startLeft + deltaX) + 'px';
                previewContainer.style.top = (startTop + deltaY) + 'px';
            } else if (isResizing) {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                
                // Calculate new size maintaining aspect ratio
                const screenAspect = window.innerWidth / window.innerHeight;
                const newWidth = startWidth + deltaX;
                
                // Maintain the aspect ratio
                previewContainer.style.width = newWidth + 'px';
                previewContainer.style.height = (newWidth / screenAspect) + 'px';
                
                // Update the renderer size
                this.handleResize();
            }
        });
        
        // Handle mouse up to stop actions
        document.addEventListener('mouseup', () => {
            isDragging = false;
            isResizing = false;
        });
    }
    
    setupScrollHandling() {
        // Store the current scroll position before switching modes
        window.addEventListener('scroll', () => {
            this.lastScrollPosition = window.scrollY;
        });
    }
    
    setMode(mode) {
        // Skip if it's already the current mode
        if (mode === this.currentMode) return;
        
        console.log(`Switching mode from ${this.currentMode} to ${mode}`);
        
        // Store current scroll position before changing modes
        this.lastScrollPosition = window.scrollY;
        
        // Remove previous mode class from body
        document.body.classList.remove(`${this.currentMode}-mode`);
        
        // Update active button
        this.modeButtons.forEach(button => {
            if (button.dataset.mode === mode) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
        
        // Set new mode
        this.currentMode = mode;
        document.body.classList.add(`${mode}-mode`);
        
        // Determine the correct trigger for the new mode
        const triggerSelector = (mode === 'scene') ? '.scene-mode-scroll-container' : '.scroll-container';

        // Handle specific mode setups
        if (mode === 'scene') {
            this.activateSceneMode();
        } else {
            this.deactivateSceneMode();
        }
        
        // Re-initialize the timeline with the correct trigger AFTER mode setup
        console.log(`Re-initializing timeline for mode: ${mode} with trigger: ${triggerSelector}`);
        initTimeline(triggerSelector);
        // Ensure the animation state is applied correctly after timeline re-init
        window.buildGSAPTimeline(window.animationState); 

        // Restore scroll position after mode change and timeline re-init
        // Use setTimeout to ensure DOM has updated and timeline is ready
        setTimeout(() => {
            console.log(`Restoring scroll position to ${this.lastScrollPosition}`);
            window.scrollTo(0, this.lastScrollPosition);
            
            // Force ScrollTrigger to update its position calculations after scroll restore
            if (window.timeline && window.timeline.scrollTrigger) {
                console.log("Forcing ScrollTrigger refresh after mode switch and scroll restore.");
                ScrollTrigger.refresh(); 
            }
        }, 10); // Increased timeout slightly for safety
    }
}

// Model System
const modelSystem = {
    models: {
        basic: [
            { name: 'Cube', geometry: 'BoxGeometry', params: [1, 1, 1, 1, 1, 1] },
            { name: 'Sphere', geometry: 'SphereGeometry', params: [0.7, 32, 32] },
            { name: 'Cylinder', geometry: 'CylinderGeometry', params: [0.5, 0.5, 1, 32] },
            { name: 'Cone', geometry: 'ConeGeometry', params: [0.7, 1.5, 32] },
            { name: 'Torus', geometry: 'TorusGeometry', params: [0.7, 0.3, 16, 100] },
            { name: 'Tetrahedron', geometry: 'TetrahedronGeometry', params: [1, 0] }
        ],
        complex: [
            { name: 'Torus Knot', geometry: 'TorusKnotGeometry', params: [0.7, 0.3, 100, 16] },
            { name: 'Icosahedron', geometry: 'IcosahedronGeometry', params: [1, 0] },
            { name: 'Octahedron', geometry: 'OctahedronGeometry', params: [1, 0] },
            { name: 'Dodecahedron', geometry: 'DodecahedronGeometry', params: [1, 0] }
        ],
        currentModel: null
    },
    
    // Preview renderer for model thumbnails
    previewRenderer: null,
    previewScene: null,
    previewCamera: null,
    previewModel: null,
    
    // Initialize the model system
    init() {
        // Create model preview button if it doesn't exist yet
        this.createModelButton();
        
        // Setup event listeners
        document.getElementById('model-preview-button').addEventListener('click', () => {
            this.toggleModelPanel();
        });
        
        document.getElementById('close-model-panel').addEventListener('click', () => {
            this.closeModelPanel();
        });
        
        document.querySelector('.model-category-header').addEventListener('click', () => {
            const complexGrid = document.getElementById('complex-models-grid');
            const toggle = document.querySelector('.model-category-toggle');
            
            if (complexGrid.style.display === 'none') {
                complexGrid.style.display = 'grid';
                toggle.style.transform = 'rotate(180deg)';
            } else {
                complexGrid.style.display = 'none';
                toggle.style.transform = 'rotate(0deg)';
            }
        });
        
        // Set up preview renderer (one time setup, will be reused)
        this.setupPreviewRenderer();
        
        // Generate model previews
        this.generateModelPreviews();
        
        // Set default model
        this.setModel(this.models.complex[0]); // Torus Knot as default
        
        // Update button with current model preview
        this.updateModelButton();
    },
    
    // Create the model button and panel if they don't exist
    createModelButton() {
        // Check if elements already exist
        if (document.getElementById('model-preview-button')) {
            return; // Elements already exist
        }
        
        // Create model button
        const modelButton = document.createElement('div');
        modelButton.className = 'model-preview-button';
        modelButton.id = 'model-preview-button';
        modelButton.innerHTML = '<div class="model-preview-icon"></div>';
        document.body.appendChild(modelButton);
        
        // Create model panel
        const modelPanel = document.createElement('div');
        modelPanel.className = 'model-panel';
        modelPanel.id = 'model-panel';
        modelPanel.innerHTML = `
            <div class="model-panel-header">
                <div class="model-panel-title">3D Models</div>
                <button class="close-model-panel" id="close-model-panel">&times;</button>
            </div>
            <div class="model-panel-content">
                <div class="model-section-header">Basic Shapes</div>
                <div class="model-grid" id="basic-models-grid">
                    <!-- Model previews will be dynamically added here -->
                </div>
                
                <div class="model-category-header">
                    <div class="model-category-icon">
                        <div class="model-preview-icon-small"></div>
                    </div>
                    <div class="model-category-title">Complex Shapes</div>
                    <div class="model-category-toggle">▼</div>
                </div>
                <div class="model-grid" id="complex-models-grid">
                    <!-- Complex model previews will go here -->
                </div>
            </div>
        `;
        document.body.appendChild(modelPanel);
        
        // Add CSS
        const style = document.createElement('style');
        style.textContent = `
            /* Model Preview Button - Place it to the right of material button */
            .model-preview-button {
                position: fixed;
                bottom: 20px;
                left: 80px; /* 20px (margin) + 50px (material button width) + 10px (spacing) */
                width: 50px;
                height: 50px;
                background-color: rgba(255, 255, 255, 0.03);
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 100;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                transition: all 0.2s ease;
            }

            .model-preview-button:hover {
                transform: scale(1.05);
                box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
                border-color: rgba(255, 255, 255, 0.2);
            }

            .model-preview-icon {
                width: 30px;
                height: 30px;
                border-radius: 4px;
                background-color: transparent;
                position: relative;
                overflow: hidden;
            }

            /* Model Panel */
            .model-panel {
                position: fixed;
                bottom: 80px;
                left: 80px;
                width: 280px;
                background-color: rgba(255, 255, 255, 0.03);
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
                border: 1px solid rgba(255, 255, 255, 0.08);
                color: #fff;
                z-index: 1001;
                display: none;
                overflow: hidden;
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                font-family: 'Inter', sans-serif;
            }

            .model-panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                background-color: rgba(10, 10, 10, 0.3);
            }

            .model-panel-title {
                font-size: 0.95rem;
                font-weight: 500;
                font-family: 'Inter', sans-serif;
            }

            .close-model-panel {
                background: none;
                border: none;
                color: #fff;
                font-size: 1.2rem;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: color 0.2s;
            }

            .close-model-panel:hover {
                color: #ff5a5a;
            }

            .model-panel-content {
                max-height: 500px;
                overflow-y: auto;
                padding: 0;
            }

            .model-section-header {
                font-size: 0.7rem;
                text-transform: uppercase;
                color: rgba(255, 255, 255, 0.5);
                margin: 16px 0 12px;
                font-weight: 500;
                letter-spacing: 0.5px;
                font-family: 'Inter', sans-serif;
                text-align: center;
            }

            .model-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 8px;
                padding: 8px;
            }

            .model-preview {
                position: relative;
                aspect-ratio: 1;
                border-radius: 6px;
                cursor: pointer;
                overflow: hidden;
                background-color: rgba(0, 0, 0, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.1);
                transition: all 0.2s ease;
            }

            .model-preview:hover {
                transform: scale(1.05);
                border-color: rgba(255, 255, 255, 0.3);
            }

            .model-preview.selected {
                border: 2px solid #0088ff;
                box-shadow: 0 0 8px rgba(0, 136, 255, 0.5);
            }

            .model-preview img {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }

            .model-category-header {
                display: flex;
                align-items: center;
                padding: 10px 16px;
                border-top: 1px solid rgba(255, 255, 255, 0.05);
                background-color: rgba(10, 10, 10, 0.2);
                cursor: pointer;
            }

            .model-category-icon {
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 10px;
            }

            .model-preview-icon-small {
                width: 20px;
                height: 20px;
                border-radius: 4px;
                background-color: rgba(100, 100, 100, 0.4);
            }

            .model-category-title {
                flex-grow: 1;
                font-size: 0.85rem;
            }

            .model-category-toggle {
                font-size: 0.7rem;
                transition: transform 0.2s ease;
            }
        `;
        document.head.appendChild(style);
    },
    
    // Setup a single shared renderer for model previews
    setupPreviewRenderer() {
        // Create an offscreen renderer
        this.previewRenderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true 
        });
        this.previewRenderer.setSize(200, 200);
        this.previewRenderer.setClearColor(0x000000, 0);
        this.previewRenderer.shadowMap.enabled = true;
        
        // Create a preview scene
        this.previewScene = new THREE.Scene();
        
        // Create a camera
        this.previewCamera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
        this.previewCamera.position.z = 4.5;
        
        // Create studio lighting setup
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.previewScene.add(ambientLight);
        
        // Main key light
        const keyLight = new THREE.DirectionalLight(0xffffff, 1);
        keyLight.position.set(2, 2, 2);
        keyLight.castShadow = true;
        this.previewScene.add(keyLight);
        
        // Fill light
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
        fillLight.position.set(-2, 0, 2);
        this.previewScene.add(fillLight);
        
        // Create default preview model (a sphere)
        const geometry = new THREE.SphereGeometry(1, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.2,
            roughness: 0.5
        });
        
        this.previewModel = new THREE.Mesh(geometry, material);
        this.previewScene.add(this.previewModel);
    },
    
    // Render a preview of a 3D model
    renderModelPreview(modelConfig) {
        // Remove existing model
        if (this.previewModel) {
            this.previewScene.remove(this.previewModel);
        }
        
        // Create the geometry based on model config
        let geometry;
        if (THREE[modelConfig.geometry]) {
            geometry = new THREE[modelConfig.geometry](...modelConfig.params);
        } else {
            // Fallback to sphere if geometry doesn't exist
            geometry = new THREE.SphereGeometry(1, 32, 32);
        }
        
        // Create material - use the current material settings if available
        let material;
        if (materialSystem && materialSystem.materials.currentMaterial) {
            const currentMat = materialSystem.materials.currentMaterial;
            material = new THREE.MeshStandardMaterial({
                color: currentMat.color,
                metalness: currentMat.metalness,
                roughness: currentMat.roughness
            });
        } else {
            material = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                metalness: 0.2,
                roughness: 0.5
            });
        }
        
        // Create and add the new model
        this.previewModel = new THREE.Mesh(geometry, material);
        this.previewScene.add(this.previewModel);
        
        // Adjust camera position based on model type
        this.previewCamera.position.set(0, 0, 4.5);
        
        // Special adjustments for specific model types to better frame them
        if (modelConfig.geometry === 'TorusKnotGeometry') {
            // Torus knot needs a bit more distance
            this.previewCamera.position.z = 5;
        } else if (modelConfig.geometry === 'ConeGeometry' || modelConfig.geometry === 'CylinderGeometry') {
            // Rotate cone and cylinder to show their shape better
            this.previewModel.rotation.x = Math.PI * 0.25;
        }
        
        this.previewCamera.lookAt(0, 0, 0);
        
        // Rotate the model for better preview
        this.previewModel.rotation.y = Math.PI * 0.25;
        if (modelConfig.geometry !== 'ConeGeometry' && modelConfig.geometry !== 'CylinderGeometry') {
            this.previewModel.rotation.x = Math.PI * 0.15;
        }
        
        // Render the scene
        this.previewRenderer.render(this.previewScene, this.previewCamera);
        
        // Return the canvas as a data URL
        return this.previewRenderer.domElement.toDataURL('image/png');
    },
    
    // Update the model button with current model preview
    updateModelButton() {
        if (!this.models.currentModel) return;
        
        const buttonIcon = document.querySelector('.model-preview-icon');
        
        // Get a data URL for the current model
        const imageUrl = this.renderModelPreview(this.models.currentModel);
        
        // Set as background image
        buttonIcon.style.backgroundImage = `url(${imageUrl})`;
        buttonIcon.style.backgroundSize = 'cover';
    },
    
    // Generate model previews in the panel
    generateModelPreviews() {
        const basicGrid = document.getElementById('basic-models-grid');
        const complexGrid = document.getElementById('complex-models-grid');
        
        // Clear existing content
        basicGrid.innerHTML = '';
        complexGrid.innerHTML = '';
        
        // Generate basic model previews
        this.models.basic.forEach((modelConfig, index) => {
            const preview = this.createModelPreview(modelConfig);
            // Remove selected class from sphere (index 1)
            preview.addEventListener('click', () => {
                this.selectModel(preview, modelConfig);
            });
            basicGrid.appendChild(preview);
        });
        
        // Generate complex model previews
        this.models.complex.forEach((modelConfig, index) => {
            const preview = this.createModelPreview(modelConfig);
            if (index === 0) preview.classList.add('selected'); // Select Torus Knot by default
            preview.addEventListener('click', () => {
                this.selectModel(preview, modelConfig);
            });
            complexGrid.appendChild(preview);
        });
        
        // Make complex models visible by default since Torus Knot is selected
        document.getElementById('complex-models-grid').style.display = 'grid';
        // Rotate the toggle arrow to show it's expanded
        const toggle = document.querySelector('.model-category-toggle');
        if (toggle) toggle.style.transform = 'rotate(180deg)';
        
        // Update all thumbnails with current material
        this.updateAllModelThumbnails();
    },
    
    // Create a model preview element as an image
    createModelPreview(modelConfig) {
        const preview = document.createElement('div');
        preview.className = 'model-preview';
        
        // Render the preview image
        const imageUrl = this.renderModelPreview(modelConfig);
        
        // Create an image element
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = modelConfig.name;
        
        preview.appendChild(img);
        preview.modelConfig = modelConfig;
        
        // Add model name
        const modelName = document.createElement('div');
        modelName.className = 'model-name';
        modelName.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0,0,0,0.6);
            color: white;
            font-size: 10px;
            padding: 2px 4px;
            text-align: center;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        `;
        modelName.textContent = modelConfig.name;
        preview.appendChild(modelName);
        
        return preview;
    },
    
    // Handle model selection
    selectModel(previewElement, modelConfig) {
        // Clear previous selection
        document.querySelectorAll('.model-preview.selected').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Add selection to current preview
        previewElement.classList.add('selected');
        
        // Apply the model to the scene
        this.setModel(modelConfig);
    },
    
    // Apply a model to the 3D scene
    setModel(modelConfig) {
        if (!scene) {
            console.warn("Scene not available");
            return;
        }
        
        // Remove existing model
        if (model) {
            scene.remove(model);
        }
        
        // Create the geometry based on model config
        let geometry;
        if (THREE[modelConfig.geometry]) {
            geometry = new THREE[modelConfig.geometry](...modelConfig.params);
        } else {
            // Fallback to sphere if geometry doesn't exist
            geometry = new THREE.SphereGeometry(1, 32, 32);
        }
        
        // Create material - use the current material if available
        let material;
        if (materialSystem && materialSystem.materials.currentMaterial) {
            const currentMat = materialSystem.materials.currentMaterial;
            material = new THREE.MeshStandardMaterial({
                color: currentMat.color,
                metalness: currentMat.metalness,
                roughness: currentMat.roughness
            });
        } else {
            material = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                metalness: 0.2,
                roughness: 0.5
            });
        }
        
        // Create and add the new model
        model = new THREE.Mesh(geometry, material);
        model.castShadow = true;
        model.receiveShadow = true;
        scene.add(model);
        
        // Keep track of current model
        this.models.currentModel = modelConfig;
        
        // Update the button preview
        this.updateModelButton();
        
        // Update the scene objects for animation
        // This ensures the new model is registered for timeline animations
        if (window.sceneObjects) {
            window.sceneObjects.model = model;
        }
        
        // If we have a modesManager, sync the editor scene
        if (window.modesManager) {
            window.modesManager.syncEditorScene();
        }
    },
    
    // Toggle the model panel
    toggleModelPanel() {
        const panel = document.getElementById('model-panel');
        if (panel.style.display === 'block') {
            this.closeModelPanel();
        } else {
            // Close material panel if it's open
            const materialPanel = document.getElementById('material-panel');
            if (materialPanel && materialPanel.style.display === 'block') {
                materialSystem.closeMaterialPanel();
            }
            panel.style.display = 'block';
        }
    },
    
    // Close the model panel
    closeModelPanel() {
        document.getElementById('model-panel').style.display = 'none';
    },
    
    // Update all model thumbnails with the current material
    updateAllModelThumbnails() {
        if (!document.getElementById('basic-models-grid') || !document.getElementById('complex-models-grid')) {
            return; // Panels don't exist yet
        }
        
        // Update all thumbnails with current material
        const allPreviews = document.querySelectorAll('.model-preview');
        allPreviews.forEach(preview => {
            if (preview.modelConfig) {
                // Re-render the thumbnail with current material
                const imageUrl = this.renderModelPreview(preview.modelConfig);
                const img = preview.querySelector('img');
                if (img) {
                    img.src = imageUrl;
                }
            }
        });
        
        // Also update the main button
        this.updateModelButton();
    }
};

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, initializing app...");

    // Initialize core Three.js setup first
    init().then(() => {
        // This runs after the model is loaded
        console.log("Model loaded successfully.");
        
        // Register scene objects now that model is ready
        registerSceneObjects();
        
        // Initialize the main animation timeline with the default UI trigger
        initTimeline('.scroll-container'); 
        
        // Build the GSAP timeline AFTER initializing it
        window.buildGSAPTimeline(window.animationState);
        
        // Initialize materials system (can happen after model load)
        materialSystem.init();
        
        // Initialize model system after material system
        modelSystem.init();
        console.log("Model system initialized.");
        
        // Initialize the modes manager (depends on Three.js being ready)
        if (typeof THREE !== 'undefined') {
            window.modesManager = new ModesManager();
            console.log("Modes manager initialized.");
        } else {
            console.error('Three.js not loaded. Modes manager cannot be initialized.');
        }
        
        // Setup timeline panel toggle functionality
        const timelineCollapseToggle = document.getElementById('timeline-collapse-toggle');
        const timelinePanel = document.querySelector('.timeline-panel');
        
        if (timelineCollapseToggle && timelinePanel) {
            timelineCollapseToggle.addEventListener('click', () => {
                timelinePanel.classList.toggle('collapsed');
            });
        }

        // Add mouse movement listener AFTER everything is set up
        document.addEventListener('mousemove', onMouseMove);

        console.log("App initialization sequence complete.");

        // Force initial resize calculation after a short delay
        // This ensures browser layout is stable before setting final aspect ratio
        setTimeout(() => {
            console.log("Forcing initial resize calculation...");
            onWindowResize(); 
        }, 50); // 50ms delay should be sufficient

    }).catch(error => {
        console.error("Initialization failed:", error);
    });
});