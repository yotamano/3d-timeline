// Timeline Editor Class
class TimelineEditor {
    constructor() {
        // State management
        this.state = {
            selectedElement: null,
            keyframes: {},
            expanded: {},
            timelineProgress: 0, // Current progress (0-1)
            panelCollapsed: false // Track panel collapse state
        };
        
        // DOM Elements
        this.timelineContainer = document.getElementById('timeline-container');
        this.timelinePlayhead = document.getElementById('timeline-playhead');
        this.timelinePassedArea = document.getElementById('timeline-passed-area');
        this.timelinePanel = document.querySelector('.timeline-panel');
        this.collapseToggleBtn = document.getElementById('timeline-collapse-toggle');
        this.addPropertyBtn = document.getElementById('add-property-btn');
        this.addKeyframeBtn = document.getElementById('add-keyframe-btn');
        this.playBtn = document.getElementById('play-btn');
        
        // Flag to prevent feedback loops
        this.isUpdatingFromScroll = false;
        this.isUpdatingFromDrag = false;
        
        // Initialize
        this.init();
    }
    
    init() {
        console.log("Initializing Timeline Editor...");
        
        // Set initial expanded state for all elements
        this.state.expanded = {};
        
        // Explicitly set all main elements to be collapsed by default
        if (window.animationState) {
            for (const element in window.animationState) {
                this.state.expanded[element] = false; // Set all elements to collapsed
            }
        } else {
            // Fallback for common elements if animationState not available
            const commonElements = ['camera', 'model', 'pointLight', 'rimLight'];
            commonElements.forEach(element => {
                this.state.expanded[element] = false;
            });
        }
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load initial animation data
        this.loadAnimationData();
        
        // Setup timeline
        this.setupTimeline();
        
        // Start automatic value updates
        this.startAutoUpdates();
        
        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        } else {
            console.warn("Lucide library not available");
        }
        
        // Setup popover closing when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.add-inline-btn') && !e.target.closest('.popover')) {
                this.closeAllPopovers();
            }
        });
        
        console.log("Timeline Editor initialized");
    }
    
    setupEventListeners() {
        // Collapse toggle button
        if (this.collapseToggleBtn) {
            this.collapseToggleBtn.addEventListener('click', () => {
                this.togglePanelCollapse();
            });
        }
        
        // Add Keyframe button
        if (this.addKeyframeBtn) {
            this.addKeyframeBtn.addEventListener('click', () => {
                this.openKeyframeModal();
            });
        }
        
        // Property Modal
        document.getElementById('submit-property-btn').addEventListener('click', () => {
            const element = document.getElementById('element-selector').value;
            const property = document.getElementById('property-select').value;
            this.addProperty(element, property);
            document.getElementById('property-modal').style.display = 'none';
        });
        
        document.getElementById('close-property-modal').addEventListener('click', () => {
            document.getElementById('property-modal').style.display = 'none';
        });
        
        document.getElementById('cancel-property-btn').addEventListener('click', () => {
            document.getElementById('property-modal').style.display = 'none';
        });
        
        // Keyframe Modal
        document.getElementById('submit-keyframe-btn').addEventListener('click', () => {
            const property = document.getElementById('keyframe-property-select').value;
            const position = document.getElementById('keyframe-position').value;
            const value = document.getElementById('keyframe-value').value;
            
            const [element, prop, subprop] = property.split('.');
            this.addKeyframe(element, prop, subprop, position, value);
            document.getElementById('keyframe-modal').style.display = 'none';
        });
        
        document.getElementById('close-keyframe-modal').addEventListener('click', () => {
            document.getElementById('keyframe-modal').style.display = 'none';
        });
        
        document.getElementById('cancel-keyframe-btn').addEventListener('click', () => {
            document.getElementById('keyframe-modal').style.display = 'none';
        });
        
        // Play button
        if (this.playBtn) {
            this.playBtn.addEventListener('click', () => {
                // Toggle between play/pause 
                const isPlaying = this.playBtn.classList.contains('playing');
                
                if (isPlaying) {
                    // Stop auto-scrolling
                    this.playBtn.classList.remove('playing');
                    this.playBtn.textContent = 'Play';
                    window.autoScrolling = false;
                } else {
                    // Start auto-scrolling from current position
                    this.playBtn.classList.add('playing');
                    this.playBtn.textContent = 'Pause';
                    window.autoScrolling = true;
                    this.startAutoScroll();
                }
            });
        }
    }
    
    startAutoScroll() {
        if (!window.autoScrolling) return;
        
        const currentScroll = window.scrollY;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const scrollStep = 2; // Adjust for speed
        
        const scroll = () => {
            if (!window.autoScrolling) return;
            
            const newScroll = Math.min(window.scrollY + scrollStep, maxScroll);
            window.scrollTo(0, newScroll);
            
            if (newScroll < maxScroll) {
                requestAnimationFrame(scroll);
            } else {
                // Reached the end
                if (this.playBtn) {
                    this.playBtn.classList.remove('playing');
                    this.playBtn.textContent = 'Play';
                }
                window.autoScrolling = false;
            }
        };
        
        requestAnimationFrame(scroll);
    }
    
    setupScrollManager() {
        console.log("Setting up scroll manager...");
        
        // Since ScrollTrigger is now the single source of truth for playhead position,
        // we no longer need a separate scroll handler. ScrollTrigger's onUpdate callback
        // will take care of updating the playhead position during scrolling.
        
        // However, we will keep a minimal fallback in case ScrollTrigger isn't available
        if (!window.ScrollTrigger) {
            console.warn("ScrollTrigger not found - using fallback scroll handling");
            window.addEventListener('scroll', () => {
                if (this.isUpdatingFromDrag || window.autoScrolling) return;
                
                this.isUpdatingFromScroll = true;
                
                const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
                if (scrollHeight > 0) {
                    const progress = Math.max(0, Math.min(1, window.scrollY / scrollHeight));
                    
                    // Update directly through requestAnimationFrame for smoother updates
                    requestAnimationFrame(() => {
                        this.updateProgress(progress);
                        this.isUpdatingFromScroll = false;
                    });
                }
            });
        } else {
            // If ScrollTrigger is available, make sure our timeline elements update with it
            try {
                window.ScrollTrigger.addEventListener("update", (event) => {
                    // This ensures our timeline updates when ScrollTrigger updates
                    const progress = window.timeline?.progress() || 0;
                    this.updateProgress(progress);
                });
            } catch (error) {
                console.warn("Could not add event listener to ScrollTrigger:", error);
            }
        }
        
        console.log("Scroll manager setup complete");
    }
    
    updateProgress(progress) {
        // Store current progress
        this.state.timelineProgress = progress;
        
        // Update playhead position in UI
        if (this.timelinePlayhead) {
            this.timelinePlayhead.style.left = `${progress * 100}%`;
            
            // Update passed area width to match playhead position
            if (this.timelinePassedArea) {
                this.timelinePassedArea.style.width = `${progress * 100}%`;
            }
        }
        
        // Update property values in the timeline UI
        this.updatePropertyValues(progress);
        
        // If we have a ScrollTrigger-controlled timeline, let it handle updating
        // the timeline progress, otherwise update the timeline directly
        if (window.timeline) {
            if (!window.timeline.scrollTrigger) {
                console.log(`Updating timeline to progress: ${progress}`);
                window.timeline.progress(progress);
            } else if (!this.isUpdatingFromScroll) {
                // If we're not updating from scroll, we need to update the scroll position
                // This happens when we're updating from a direct UI interaction
                window.timeline.scrollTrigger.scroll(progress * window.timeline.scrollTrigger.end);
            }
        }
    }
    
    loadAnimationData() {
        console.log("Loading animation data...");
        
        // Reset current keyframes
        this.state.keyframes = {};
        
        // Access animation state from global scope
        if (window.animationState) {
            for (const element in window.animationState) {
                for (const property in window.animationState[element]) {
                    this.addProperty(element, property, false);
                    
                    for (const subprop in window.animationState[element][property]) {
                        const keyframes = window.animationState[element][property][subprop];
                        
                        // Check if keyframes is actually an array we can iterate over
                        if (Array.isArray(keyframes)) {
                            for (const keyframe of keyframes) {
                                this.addKeyframe(
                                    element, 
                                    property, 
                                    subprop, 
                                    keyframe.position, 
                                    keyframe.value, 
                                    false
                                );
                            }
                        } else {
                            console.warn(`Keyframes for ${element}.${property}.${subprop} is not an array`, keyframes);
                        }
                    }
                }
            }
            
            // Render the UI
            this.renderTimeline();
            
            console.log("Animation data loaded successfully");
        } else {
            console.warn("No animation state found in window.animationState");
        }
    }
    
    setupTimeline() {
        // Create the timeline ruler with ticks
        this.createTimelineRuler();
        
        // Initial render of timeline content
        this.renderTimeline();
        
        // Setup playhead and passed area
        this.timelinePlayhead = document.querySelector('.timeline-playhead');
        this.timelinePassedArea = document.getElementById('timeline-passed-area');
        
        // Initialize the passed area width based on the initial progress
        if (this.timelinePassedArea) {
            this.timelinePassedArea.style.width = `${this.state.timelineProgress * 100}%`;
        }
        
        console.log("Setting up playhead controls...");
        
        // Initialize playhead controls for scrubbing
        this.initPlayheadControls();
        
        // Setup scroll manager
        this.setupScrollManager();
        
        console.log("Playhead controls setup complete");
    }
    
    // Create the timeline ruler with ticks
    createTimelineRuler() {
        const rulerContent = document.querySelector('.timeline-ruler-content');
        const ticksContainer = document.querySelector('.timeline-ticks');
        
        // Clear existing ticks
        ticksContainer.innerHTML = '';
        
        // Create exactly 21 ticks for 0-100% (5% increments)
        // This way we get exact 20% intervals for major ticks
        for (let i = 0; i <= 20; i++) {
            const tick = document.createElement('div');
            tick.className = 'timeline-tick';
            
            // Every 4th tick is a major tick (0%, 20%, 40%, 60%, 80%, 100%)
            if (i % 4 === 0) {
                tick.classList.add('major');
                const label = document.createElement('span');
                label.className = 'timeline-tick-label';
                label.textContent = `${(i / 20 * 100).toFixed(0)}%`;
                tick.appendChild(label);
            }
            
            ticksContainer.appendChild(tick);
        }
    }
    
    initPlayheadControls() {
        const ruler = document.querySelector('.timeline-ruler-content');
        const playhead = document.querySelector('.timeline-playhead');
        const playheadTop = document.querySelector('.timeline-playhead-top');
        
        let isDragging = false;
        
        playheadTop.addEventListener('mousedown', (e) => {
            isDragging = true;
            document.body.style.cursor = 'grabbing';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const rulerRect = ruler.getBoundingClientRect();
            let relativeX = e.clientX - rulerRect.left;
            
            // Constrain to ruler width
            relativeX = Math.max(0, Math.min(relativeX, rulerRect.width));
            
            // Position as percentage
            const percent = relativeX / rulerRect.width;
            this.updatePlayhead(percent);
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                document.body.style.cursor = 'default';
            }
        });
        
        // Click on ruler to position playhead
        ruler.addEventListener('click', (e) => {
            if (e.target.classList.contains('timeline-playhead') || 
                e.target.classList.contains('timeline-playhead-top')) return;
                
            const rulerRect = ruler.getBoundingClientRect();
            const relativeX = e.clientX - rulerRect.left;
            const percent = relativeX / rulerRect.width;
            
            this.updatePlayhead(percent);
        });
    }
    
    updatePlayhead(percent) {
        // Ensure percent is between 0 and 1
        percent = Math.max(0, Math.min(1, percent));
        
        // Store current progress
        this.state.timelineProgress = percent;
        
        // Update playhead position in UI
        if (this.timelinePlayhead) {
            this.timelinePlayhead.style.left = `${percent * 100}%`;
            
            // Update passed area width to match playhead position
            if (this.timelinePassedArea) {
                this.timelinePassedArea.style.width = `${percent * 100}%`;
            }
        }
        
        // Update property values in the timeline UI
        this.updatePropertyValues(percent);
        
        // If we have a ScrollTrigger-controlled timeline, let it handle updating
        // the timeline progress, otherwise update the timeline directly
        if (window.timeline) {
            if (!window.timeline.scrollTrigger) {
                console.log(`Updating timeline to progress: ${percent}`);
                window.timeline.progress(percent);
            } else if (!this.isUpdatingFromScroll) {
                // If we're not updating from scroll, we need to update the scroll position
                // This happens when we're updating from a direct UI interaction
                window.timeline.scrollTrigger.scroll(percent * window.timeline.scrollTrigger.end);
            }
        }
    }
    
    addProperty(element, property, updateUI = true) {
        if (!this.state.keyframes[element]) {
            this.state.keyframes[element] = {};
        }
        
        if (!this.state.keyframes[element][property]) {
            this.state.keyframes[element][property] = {};
            
            // Add sub-properties based on property type
            if (['position', 'rotation', 'scale'].includes(property)) {
                this.state.keyframes[element][property].x = [];
                this.state.keyframes[element][property].y = [];
                this.state.keyframes[element][property].z = [];
            } else if (property === 'color') {
                // For color, use a single value property with hex string values
                this.state.keyframes[element][property].value = [];
            } else {
                // For properties without sub-properties like intensity
                this.state.keyframes[element][property].value = [];
            }
        }
        
        if (updateUI) {
            this.renderTimeline();
        }
    }
    
    addKeyframe(element, property, subprop, position, value, updateUI = true) {
        // Ensure the property exists
        if (!this.state.keyframes[element] || !this.state.keyframes[element][property]) {
            this.addProperty(element, property, false);
        }
        
        // Add or update the keyframe
        const keyframes = this.state.keyframes[element][property][subprop] || [];
        
        // Check if keyframe at this position already exists
        const existingIndex = keyframes.findIndex(k => parseInt(k.position) === parseInt(position));
        
        // Preserve string values (like colors) if needed
        let parsedValue = value;
        if (typeof value === 'string' && value.startsWith('#')) {
            // Keep hex color values as strings
            parsedValue = value;
        } else if (typeof value === 'string') {
            // Try to parse number strings to float
            parsedValue = parseFloat(value);
        }
        
        if (existingIndex >= 0) {
            keyframes[existingIndex].value = parsedValue;
        } else {
            keyframes.push({
                position: parseInt(position),
                value: parsedValue
            });
            
            // Sort keyframes by position
            keyframes.sort((a, b) => a.position - b.position);
        }
        
        this.state.keyframes[element][property][subprop] = keyframes;
        
        if (updateUI) {
            this.renderTimeline();
            
            // Update the GSAP timeline
            this.updateGSAPTimeline();
        }
    }
    
    renderTimeline() {
        // Get the timeline container
        const container = this.timelineContainer;
        
        // Clear the container
        if (!container) {
            console.error("Timeline container not found");
            return;
        }
        
        container.innerHTML = '';
        
        // Render timeline for each element
        for (const element in this.state.keyframes) {
            this.renderElement(container, element);
        }
    }
    
    renderElement(container, element) {
        const isExpanded = this.state.expanded[element] !== false;
        
        // Create element row
        const elementRow = document.createElement('div');
        elementRow.className = `timeline-row element-row${isExpanded ? ' expanded' : ''}`;
        elementRow.dataset.id = element;
        
        // Create element header
        const elementHeader = document.createElement('div');
        elementHeader.className = 'timeline-row-header';
        
        // Get icon based on element type
        let iconName = 'box';
        if (element === 'camera' || element === 'eye') {
            iconName = 'eye';
        } else if (element.includes('light')) {
            iconName = 'sun';
        } else if (element === 'model') {
            iconName = 'cube';
        }
        
        // Create unique ID for the popover
        const popoverId = `popover-${element.replace(/\./g, '-')}`;
        
        elementHeader.innerHTML = `
            <div class="timeline-toggle"></div>
            <div class="timeline-icon"><i data-lucide="${iconName}"></i></div>
            <div class="timeline-label">
                <div class="timeline-label-content">${element}</div>
                <div class="add-inline-btn" data-popover="${popoverId}">+</div>
                
                <div id="${popoverId}" class="popover">
                    <div class="popover-title">Add Property</div>
                    <div class="popover-content">
                        <div class="popover-item" data-property="position">
                            Position
                        </div>
                        <div class="popover-item" data-property="rotation">
                            Rotation
                        </div>
                        <div class="popover-item" data-property="scale">
                            Scale
                        </div>
                        <div class="popover-item" data-property="color">
                            Color
                        </div>
                        <div class="popover-item" data-property="intensity">
                            Intensity
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Handle toggle click for expanding/collapsing
        const toggle = elementHeader.querySelector('.timeline-toggle');
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleExpand(element);
        });
        
        // Handle add button click to show popover
        const addBtn = elementHeader.querySelector('.add-inline-btn');
        addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.togglePopover(popoverId);
        });
        
        // Add event listeners for popover items
        setTimeout(() => {
            const popover = document.getElementById(popoverId);
            if (popover) {
                const items = popover.querySelectorAll('.popover-item');
                items.forEach(item => {
                    item.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const property = item.dataset.property;
                        this.addProperty(element, property);
                        this.closeAllPopovers();
                    });
                });
                
                // Create icons in popover
                if (window.lucide) {
                    window.lucide.createIcons({
                        attrs: {
                            class: ['lucide-icon'],
                            width: '12',
                            height: '12'
                        },
                        elements: popover.querySelectorAll('[data-lucide]')
                    });
                }
            }
        }, 0);
        
        // Make header clickable for expand/collapse
        elementHeader.addEventListener('click', () => {
            this.toggleExpand(element);
            this.selectItem(element);
        });
        
        elementRow.appendChild(elementHeader);
        
        // Add content area (empty at element level, used for consistent layout)
        const elementContent = document.createElement('div');
        elementContent.className = 'timeline-row-content';
        elementRow.appendChild(elementContent);
        
        container.appendChild(elementRow);
        
        // Create Lucide icons for this element
        if (window.lucide) {
            window.lucide.createIcons({
                attrs: {
                    class: ['lucide-icon'],
                    width: '14',
                    height: '14'
                },
                elements: elementRow.querySelectorAll('[data-lucide]:not(.popover [data-lucide])')
            });
        }
        
        // Render properties if expanded
        if (isExpanded) {
            for (const property in this.state.keyframes[element]) {
                this.renderProperty(container, element, property);
            }
        }
    }
    
    renderProperty(container, element, property) {
        // Create property row
        const propertyRow = document.createElement('div');
        propertyRow.className = 'timeline-row property-row';
        propertyRow.dataset.id = `${element}.${property}`;
        propertyRow.dataset.element = element;
        propertyRow.dataset.property = property;
        
        // Create property header
        const propertyHeader = document.createElement('div');
        propertyHeader.className = 'timeline-row-header';
        
        // Format the property name with first letter capitalized
        const formattedPropertyName = property.charAt(0).toUpperCase() + property.slice(1);
        
        propertyHeader.innerHTML = `
            <div class="timeline-label-spacer"></div>
            <div class="timeline-label property-label">
                <div class="timeline-label-content">${formattedPropertyName}</div>
            </div>
        `;
        
        // Handle row selection
        propertyHeader.addEventListener('click', () => {
            this.selectItem(`${element}.${property}`);
        });
        
        propertyRow.appendChild(propertyHeader);
        
        // Create content area for property
        const propertyContent = document.createElement('div');
        propertyContent.className = 'timeline-row-content';
        propertyRow.appendChild(propertyContent);
        
        container.appendChild(propertyRow);
        
        // Render subproperties 
        for (const subprop in this.state.keyframes[element][property]) {
            this.renderSubproperty(container, element, property, subprop);
        }
    }
    
    renderSubproperty(container, element, property, subprop) {
        const keyframes = this.state.keyframes[element][property][subprop];
        
        // Skip if no keyframes
        if (!keyframes || keyframes.length === 0) return;
        
        // Get the current value based on the latest keyframe
        let currentValue = keyframes.length > 0 ? keyframes[0].value : 0;
        let isColorValue = false;
        let displayValue = currentValue;
        
        // Check if this is a color value (for special formatting)
        if (property === 'color' && subprop === 'value' && 
            typeof currentValue === 'string' && currentValue.startsWith('#')) {
            isColorValue = true;
            // Remove the # prefix for display
            displayValue = currentValue.substring(1);
        }
        
        // Create subproperty row
        const subpropRow = document.createElement('div');
        subpropRow.className = 'timeline-row subprop-row';
        subpropRow.dataset.id = `${element}.${property}.${subprop}`;
        subpropRow.dataset.element = element;
        subpropRow.dataset.property = property;
        subpropRow.dataset.subprop = subprop;
        
        // Create subproperty header
        const subpropHeader = document.createElement('div');
        subpropHeader.className = 'timeline-row-header';
        
        // Format subproperty name
        let displaySubprop = subprop;
        if (subprop === 'x' || subprop === 'y' || subprop === 'z') {
            displaySubprop = subprop.toUpperCase();
        } else if (subprop === 'value') {
            // Don't show "value" subproperty name if it's a single value property
            if (['rotation', 'intensity'].includes(property)) {
                displaySubprop = "";
            }
        }
        
        // Get color class based on subproperty
        let axisClass = '';
        
        // Set axis class for keyframe indicators
        if (subprop === 'x') {
            axisClass = 'x-axis';
        } else if (subprop === 'y') {
            axisClass = 'y-axis';
        } else if (subprop === 'z') {
            axisClass = 'z-axis';
        }
        
        // Create color preview for color values
        const colorPreviewHTML = isColorValue ? 
            `<span class="color-preview" style="background-color: ${currentValue};"></span>` : '';
            
        // Check if current time has a keyframe
        const hasKeyframeAtCurrentTime = this.hasKeyframeAtTime(element, property, subprop, this.state.timelineProgress * 100);
        
        subpropHeader.innerHTML = `
            <div class="timeline-label-spacer"></div>
            <div class="timeline-label-spacer"></div>
            <div class="timeline-label subproperty-label">
                <div class="label-value-container">
                    <span class="subprop-name">${displaySubprop}</span>
                    ${colorPreviewHTML}
                    <span class="subprop-value" id="value-${element}-${property}-${subprop}">${displayValue}</span>
                </div>
                <div class="keyframe-indicator ${axisClass}${hasKeyframeAtCurrentTime ? ' active' : ''}" 
                    id="keyframe-indicator-${element}-${property}-${subprop}"></div>
            </div>
        `;
        
        // Handle row selection
        subpropHeader.addEventListener('click', (e) => {
            // Don't trigger selection when clicking the keyframe indicator
            if (!e.target.classList.contains('keyframe-indicator')) {
                this.selectItem(`${element}.${property}.${subprop}`);
            }
        });
        
        // Add event listener for the keyframe indicator
        setTimeout(() => {
            const keyframeIndicator = subpropHeader.querySelector('.keyframe-indicator');
            if (keyframeIndicator) {
                keyframeIndicator.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Get current playhead position (0-100)
                    const position = Math.round(this.state.timelineProgress * 100);
                    // Get current value
                    const value = this.getCurrentValue(element, property, subprop);
                    // Add or update keyframe at current position
                    this.addKeyframe(element, property, subprop, position, value);
                });
            }
        }, 0);
        
        subpropRow.appendChild(subpropHeader);
        
        // Create content area for subproperty (will contain keyframes)
        const subpropContent = document.createElement('div');
        subpropContent.className = 'timeline-row-content';
        
        // Add keyframes
        keyframes.forEach(keyframe => {
            this.createKeyframeElement(subpropContent, element, property, subprop, keyframe);
        });
        
        subpropRow.appendChild(subpropContent);
        container.appendChild(subpropRow);
    }
    
    createKeyframeElement(container, element, property, subprop, keyframe) {
        const keyframeEl = document.createElement('div');
        keyframeEl.className = `keyframe keyframe-${subprop}`;
        
        // Position keyframe using the exact percentage from the data
        // This ensures alignment with the ruler ticks
        keyframeEl.style.left = `${keyframe.position}%`;
        keyframeEl.dataset.position = keyframe.position;
        keyframeEl.dataset.value = keyframe.value;
        keyframeEl.dataset.subprop = subprop;
        
        // Make keyframes draggable
        keyframeEl.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.startKeyframeDrag(keyframeEl, container, element, property, subprop);
        });
        
        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'keyframe-tooltip';
        tooltip.textContent = keyframe.value;
        
        keyframeEl.appendChild(tooltip);
        container.appendChild(keyframeEl);
        
        return keyframeEl;
    }
    
    toggleExpand(id) {
        // Toggle expanded state
        this.state.expanded[id] = !this.state.expanded[id];
        
        // Find the row and update its expanded class
        const row = document.querySelector(`.timeline-row[data-id="${id}"]`);
        if (row) {
            row.classList.toggle('expanded', this.state.expanded[id]);
        }
        
        // Re-render timeline to apply changes
        this.renderTimeline();
    }
    
    selectItem(id) {
        // Update selected state
        this.state.selectedElement = id;
        
        // Remove selected class from all rows
        const allRows = document.querySelectorAll('.timeline-row');
        allRows.forEach(row => row.classList.remove('selected'));
        
        // Add selected class to selected row
        const selectedRow = document.querySelector(`.timeline-row[data-id="${id}"]`);
        if (selectedRow) {
            selectedRow.classList.add('selected');
            
            // Scroll to selected row
            selectedRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    startKeyframeDrag(keyframeEl, container, element, property, subprop) {
        const initialPosition = parseInt(keyframeEl.dataset.position);
        const trackRect = container.getBoundingClientRect();
        
        // Function to handle keyframe dragging
        const onMouseMove = (e) => {
            const x = e.clientX - trackRect.left;
            const newPosition = Math.max(0, Math.min(100, Math.round((x / trackRect.width) * 100)));
            
            // Update visual position
            keyframeEl.style.left = `${newPosition}%`;
            keyframeEl.dataset.position = newPosition;
        };
        
        // Function to finalize the drag
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            
            // Get the final position
            const newPosition = parseInt(keyframeEl.dataset.position);
            const value = parseFloat(keyframeEl.dataset.value);
            
            // Only update if position changed
            if (newPosition !== initialPosition) {
                // First remove the old keyframe
                this.removeKeyframe(element, property, subprop, initialPosition);
                
                // Then add at new position
                this.addKeyframe(element, property, subprop, newPosition, value);
            }
        };
        
        // Add event listeners for drag
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }
    
    removeKeyframe(element, property, subprop, position) {
        if (!this.state.keyframes[element] || 
            !this.state.keyframes[element][property] || 
            !this.state.keyframes[element][property][subprop]) {
            return false;
        }
        
        const keyframes = this.state.keyframes[element][property][subprop];
        const index = keyframes.findIndex(k => parseInt(k.position) === parseInt(position));
        
        if (index >= 0) {
            keyframes.splice(index, 1);
            return true;
        }
        
        return false;
    }
    
    updateGSAPTimeline() {
        console.log("Updating GSAP timeline...");
        
        // Convert our keyframe data to format expected by the timeline builder
        const animationData = {};
        
        for (const element in this.state.keyframes) {
            animationData[element] = {};
            
            for (const property in this.state.keyframes[element]) {
                animationData[element][property] = {};
                
                for (const subprop in this.state.keyframes[element][property]) {
                    animationData[element][property][subprop] = this.state.keyframes[element][property][subprop];
                }
            }
        }
        
        // Call global function to rebuild the GSAP timeline
        if (window.buildGSAPTimeline) {
            window.buildGSAPTimeline(animationData);
            console.log("GSAP timeline updated successfully");
        } else {
            console.warn("buildGSAPTimeline function not available globally");
        }
    }
    
    // Update property values displayed in the timeline based on current progress
    updatePropertyValues(progress) {
        if (!window.animationState && !this.state.keyframes) return;
        
        for (const element in this.state.keyframes) {
            for (const property in this.state.keyframes[element]) {
                for (const subprop in this.state.keyframes[element][property]) {
                    const keyframes = this.state.keyframes[element][property][subprop];
                    
                    if (keyframes && keyframes.length > 0) {
                        // Find the interpolated value at current progress
                        const interpolatedValue = window.interpolateValue 
                            ? window.interpolateValue(keyframes, progress)
                            : this.interpolateValue(keyframes, progress * 100);
                        
                        // Get the value display element
                        const valueEl = document.getElementById(`value-${element}-${property}-${subprop}`);
                        if (valueEl) {
                            // Check if this is a color value
                            const isColorValue = property === 'color' && subprop === 'value' && 
                                typeof interpolatedValue === 'string' && interpolatedValue.startsWith('#');
                            
                            if (isColorValue) {
                                // For colors, display the hex value without # and update the color preview
                                valueEl.textContent = interpolatedValue.substring(1);
                                
                                // Also update the color preview if it exists
                                const parentElement = valueEl.parentElement;
                                if (parentElement) {
                                    const colorPreview = parentElement.querySelector('.color-preview');
                                    if (colorPreview) {
                                        colorPreview.style.backgroundColor = interpolatedValue;
                                    } else {
                                        // Create color preview if it doesn't exist
                                        const colorPreview = document.createElement('span');
                                        colorPreview.className = 'color-preview';
                                        colorPreview.style.backgroundColor = interpolatedValue;
                                        parentElement.insertBefore(colorPreview, valueEl);
                                    }
                                }
                            } else {
                                // Format numeric values with 2 decimal places for cleaner display
                                const formattedValue = typeof interpolatedValue === 'number' 
                                    ? parseFloat(interpolatedValue).toFixed(2) 
                                    : interpolatedValue;
                                
                                valueEl.textContent = formattedValue;
                            }
                            
                            // Add visual indication that value is changing
                            valueEl.classList.add('value-changing');
                            setTimeout(() => {
                                valueEl.classList.remove('value-changing');
                            }, 300);
                            
                            // Update keyframe indicator active state
                            const indicator = document.getElementById(`keyframe-indicator-${element}-${property}-${subprop}`);
                            if (indicator) {
                                const hasKeyframe = this.hasKeyframeAtTime(element, property, subprop, progress * 100);
                                indicator.classList.toggle('active', hasKeyframe);
                            }
                        }
                    }
                }
            }
        }
    }
    
    openKeyframeModal() {
        const select = document.getElementById('keyframe-property-select');
        select.innerHTML = '';
        
        // Populate with available properties
        for (const element in this.state.keyframes) {
            for (const property in this.state.keyframes[element]) {
                for (const subprop in this.state.keyframes[element][property]) {
                    const option = document.createElement('option');
                    option.value = `${element}.${property}.${subprop}`;
                    option.textContent = `${element} > ${property} > ${subprop}`;
                    
                    // Mark color value properties for special handling
                    if (property === 'color' && subprop === 'value') {
                        option.dataset.isColor = 'true';
                    }
                    
                    select.appendChild(option);
                }
            }
        }
        
        // Set up event handlers for color picker
        const propertySelect = document.getElementById('keyframe-property-select');
        const valueInputGroup = document.getElementById('value-input-group');
        const colorInputGroup = document.getElementById('color-input-group');
        const colorPicker = document.getElementById('keyframe-color');
        const colorText = document.getElementById('keyframe-color-text');
        
        // Handle property selection change
        propertySelect.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            
            // Show appropriate input based on property type
            if (selectedOption.dataset.isColor === 'true') {
                valueInputGroup.style.display = 'none';
                colorInputGroup.style.display = 'block';
            } else {
                valueInputGroup.style.display = 'block';
                colorInputGroup.style.display = 'none';
            }
        });
        
        // Sync color picker with text input
        colorPicker.addEventListener('input', function() {
            colorText.value = this.value;
        });
        
        colorText.addEventListener('input', function() {
            // Ensure value starts with # and is a valid hex color
            if (!this.value.startsWith('#')) {
                this.value = '#' + this.value;
            }
            if (/^#[0-9A-F]{6}$/i.test(this.value)) {
                colorPicker.value = this.value;
            }
        });
        
        // Update the submit button handler
        document.getElementById('submit-keyframe-btn').addEventListener('click', () => {
            const property = document.getElementById('keyframe-property-select').value;
            const position = document.getElementById('keyframe-position').value;
            
            // Get appropriate value based on property type
            const selectedOption = propertySelect.options[propertySelect.selectedIndex];
            let value;
            
            if (selectedOption.dataset.isColor === 'true') {
                value = colorPicker.value;
            } else {
                value = document.getElementById('keyframe-value').value;
            }
            
            const [element, prop, subprop] = property.split('.');
            this.addKeyframe(element, prop, subprop, position, value);
            document.getElementById('keyframe-modal').style.display = 'none';
        });
        
        // Show default input type based on initial selection
        if (select.options.length > 0) {
            if (select.options[0].dataset.isColor === 'true') {
                valueInputGroup.style.display = 'none';
                colorInputGroup.style.display = 'block';
            } else {
                valueInputGroup.style.display = 'block';
                colorInputGroup.style.display = 'none';
            }
        }
        
        document.getElementById('keyframe-modal').style.display = 'flex';
    }
    
    startAutoUpdates() {
        // Update values every 100ms to ensure they're always current
        this.updateInterval = setInterval(() => {
            if (this.state.timelineProgress !== undefined) {
                this.updatePropertyValues(this.state.timelineProgress);
            }
        }, 100);
    }
    
    // Close all popovers
    closeAllPopovers() {
        const popovers = document.querySelectorAll('.popover');
        popovers.forEach(popover => {
            popover.style.display = 'none';
        });
    }
    
    // Toggle popover visibility
    togglePopover(popoverId) {
        // Close all other popovers first
        this.closeAllPopovers();
        
        const popover = document.getElementById(popoverId);
        if (popover) {
            // Stop propagation for clicks inside the popover
            if (!popover.hasClickListener) {
                popover.addEventListener('click', (e) => {
                    e.stopPropagation();
                });
                popover.hasClickListener = true;
            }
            
            // If already visible, hide it
            if (popover.style.display === 'block') {
                popover.style.display = 'none';
                return;
            }
            
            // Calculate position based on trigger button
            const triggerBtn = document.querySelector(`[data-popover="${popoverId}"]`);
            if (triggerBtn) {
                const rect = triggerBtn.getBoundingClientRect();
                popover.style.top = `${rect.bottom + 5}px`;
                popover.style.left = `${rect.left}px`;
            }
            
            // Display the popover
            popover.style.display = 'block';
        }
    }
    
    // Helper method to check if there's a keyframe at the current time
    hasKeyframeAtTime(element, property, subprop, position) {
        if (!this.state.keyframes[element] || 
            !this.state.keyframes[element][property] || 
            !this.state.keyframes[element][property][subprop]) {
            return false;
        }
        
        const keyframes = this.state.keyframes[element][property][subprop];
        // Allow for a small tolerance (±1%) to make it easier to detect
        const tolerance = 1;
        return keyframes.some(k => Math.abs(k.position - position) <= tolerance);
    }
    
    // Helper method to get the current interpolated value for a property
    getCurrentValue(element, property, subprop) {
        if (!this.state.keyframes[element] || 
            !this.state.keyframes[element][property] || 
            !this.state.keyframes[element][property][subprop]) {
            return 0;
        }
        
        const keyframes = this.state.keyframes[element][property][subprop];
        if (!keyframes || keyframes.length === 0) {
            return 0;
        }
        
        // If we have an interpolate function available, use it
        if (window.interpolateValue) {
            return window.interpolateValue(keyframes, this.state.timelineProgress);
        }
        
        // Simple linear interpolation as fallback
        return this.interpolateValue(keyframes, this.state.timelineProgress * 100);
    }
    
    // Simple linear interpolation between keyframes
    interpolateValue(keyframes, position) {
        if (keyframes.length === 0) return 0;
        if (keyframes.length === 1) return keyframes[0].value;
        
        // Find the two keyframes to interpolate between
        let k1 = keyframes[0];
        let k2 = keyframes[0];
        
        for (let i = 0; i < keyframes.length; i++) {
            if (keyframes[i].position <= position) {
                k1 = keyframes[i];
                k2 = keyframes[i];
            }
            
            if (keyframes[i].position > position) {
                k2 = keyframes[i];
                break;
            }
        }
        
        // If they're the same keyframe, just return the value
        if (k1 === k2) return k1.value;
        
        // Calculate interpolation factor (0-1)
        const t = (position - k1.position) / (k2.position - k1.position);
        
        // Linear interpolation: value = value1 + (value2 - value1) * t
        if (typeof k1.value === 'string' && k1.value.startsWith('#')) {
            // For color values, we should do proper color interpolation
            // But for simplicity, we'll just return the first color
            return k1.value;
        } else {
            return k1.value + (k2.value - k1.value) * t;
        }
    }
    
    togglePanelCollapse() {
        this.state.panelCollapsed = !this.state.panelCollapsed;
        
        if (this.state.panelCollapsed) {
            this.timelinePanel.classList.add('collapsed');
        } else {
            this.timelinePanel.classList.remove('collapsed');
        }
    }
}

// Initialize the timeline editor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("Initializing Timeline Editor...");
    
    // Global settings
    window.autoScrolling = false;
    
    // Initialize timeline editor
    window.timelineEditor = new TimelineEditor();
});