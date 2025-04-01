// Animation Sequences
// This file contains different animation sequences that can be loaded into the timeline

// Collection of animation sequences
const animationSequences = {
    // Cinematic reveal sequence
    cinematicReveal: {
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
                    { position: 25, value: 3 },      // Moving back
                    { position: 50, value: 5 },      // Full view
                    { position: 75, value: 4 },      // Slight move forward
                    { position: 100, value: 5 }      // Back to full view
                ],
                'y': [
                    { position: 0, value: 0 },
                    { position: 25, value: 0.5 },
                    { position: 50, value: 1 },
                    { position: 75, value: 0.5 },
                    { position: 100, value: 0 }
                ],
                'x': [
                    { position: 0, value: 0 },
                    { position: 25, value: 1 },
                    { position: 50, value: 0 },
                    { position: 75, value: -1 },
                    { position: 100, value: 0 }
                ]
            },
            'rotation': {
                'x': [
                    { position: 0, value: -0.2 },
                    { position: 50, value: -0.1 },
                    { position: 100, value: -0.3 }
                ]
            }
        },
        // Main light - changes color and intensity
        'pointLight': {
            'intensity': {
                'value': [
                    { position: 0, value: 0.5 },
                    { position: 25, value: 1 },
                    { position: 50, value: 2 },
                    { position: 75, value: 2.5 },
                    { position: 100, value: 3 }
                ]
            },
            'color': {
                'value': [
                    { position: 0, value: '#ffffff' },  // White/neutral
                    { position: 25, value: '#0080ff' },  // Blue
                    { position: 50, value: '#3355aa' },  // Blue-purple
                    { position: 75, value: '#ff2020' },  // Red
                    { position: 100, value: '#ff4040' }  // Bright red
                ]
            }
        },
        // Rim light - appears dramatically at the end
        'rimLight': {
            'intensity': {
                'value': [
                    { position: 0, value: 0 },
                    { position: 60, value: 0 },
                    { position: 75, value: 0.5 },
                    { position: 85, value: 1.5 },
                    { position: 100, value: 2 }
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
                'value': [
                    { position: 0, value: '#0088ff' },  // Blue
                    { position: 75, value: '#0044ff' },  // Darker blue
                    { position: 100, value: '#8000ff' }  // Purple
                ]
            }
        }
    },
    
    // Simple showcase - model rotates while camera makes subtle movements
    "simpleShowcase": {
        'model': {
            'rotation': {
                'y': [
                    { position: 0, value: 0 },
                    { position: 100, value: 6.28 } // 360 degrees in radians
                ]
            }
        },
        'camera': {
            'position': {
                'z': [
                    { position: 0, value: 5 },
                    { position: 50, value: 4.5 },
                    { position: 100, value: 5 }
                ],
                'x': [
                    { position: 0, value: 0 },
                    { position: 50, value: 0.8 },
                    { position: 100, value: 0 }
                ],
                'y': [
                    { position: 0, value: 0.5 },
                    { position: 50, value: 0.8 },
                    { position: 100, value: 0.5 }
                ]
            },
            'rotation': {
                'x': [
                    { position: 0, value: -0.1 },
                    { position: 50, value: -0.15 },
                    { position: 100, value: -0.1 }
                ]
            }
        },
        'pointLight': {
            'intensity': {
                'value': [
                    { position: 0, value: 1 },
                    { position: 50, value: 1.2 },
                    { position: 100, value: 1 }
                ]
            },
            'color': {
                'value': [
                    { position: 0, value: '#ffffff' },
                    { position: 50, value: '#fffaf0' },
                    { position: 100, value: '#ffffff' }
                ]
            }
        },
        'ambientLight': {
            'intensity': {
                'value': [
                    { position: 0, value: 0.5 },
                    { position: 50, value: 0.6 },
                    { position: 100, value: 0.5 }
                ]
            }
        },
        'rimLight': {
            'intensity': {
                'value': [
                    { position: 0, value: 0.8 },
                    { position: 50, value: 1 },
                    { position: 100, value: 0.8 }
                ]
            },
            'color': {
                'value': [
                    { position: 0, value: '#4466ff' },
                    { position: 50, value: '#4477ff' },
                    { position: 100, value: '#4466ff' }
                ]
            }
        }
    },
    
    // Technical inspection sequence - orbits slowly with model static
    technicalInspection: {
        'camera': {
            'position': {
                'z': [
                    { position: 0, value: 5 },
                    { position: 25, value: 3.5 },
                    { position: 50, value: 0 },
                    { position: 75, value: 3.5 },
                    { position: 100, value: 5 }
                ],
                'x': [
                    { position: 0, value: 0 },
                    { position: 25, value: 3.5 },
                    { position: 50, value: 0 },
                    { position: 75, value: -3.5 },
                    { position: 100, value: 0 }
                ],
                'y': [
                    { position: 0, value: 2 },
                    { position: 50, value: 3 },
                    { position: 100, value: 2 }
                ]
            },
            'rotation': {
                // Removed y-rotation keyframes since we're using camera.lookAt(model.position)
                // which will automatically rotate the camera to face the model
                'x': [
                    { position: 0, value: -0.2 },
                    { position: 50, value: -0.4 },
                    { position: 100, value: -0.2 }
                ]
            }
        },
        'pointLight': {
            'intensity': {
                'value': [
                    { position: 0, value: 1.5 },
                    { position: 50, value: 2 },
                    { position: 100, value: 1.5 }
                ]
            },
            'color': {
                'value': [
                    { position: 0, value: '#ffffff' },
                    { position: 100, value: '#ffffff' }
                ]
            }
        }
    }
};

// Load an animation sequence by name
window.loadAnimationSequence = function(sequenceName) {
    console.log(`Loading animation sequence: ${sequenceName}`);
    
    if (!window.animationSequences || !window.animationSequences[sequenceName]) {
        console.error(`Animation sequence '${sequenceName}' not found`);
        return false;
    }
    
    // Get the animation data for the selected sequence
    let animationData = JSON.parse(JSON.stringify(window.animationSequences[sequenceName]));
    
    // Update the global animation state
    window.animationState = animationData;
    
    // Rebuild the GSAP timeline if available
    if (window.buildGSAPTimeline) {
        window.buildGSAPTimeline(animationData);
        
        // Reset timeline progress to beginning
        if (window.timeline) {
            window.timeline.progress(0);
            if (window.timeline.scrollTrigger) {
                window.timeline.scrollTrigger.scroll(0);
            }
        }
        
        // Update the timeline editor UI
        if (window.timelineEditor) {
            window.timelineEditor.loadAnimationData();
        }
        
        console.log(`Animation sequence '${sequenceName}' loaded successfully`);
        return true;
    } else {
        console.warn("buildGSAPTimeline function not available");
        return false;
    }
};

// Make functions available globally
window.animationSequences = animationSequences; 