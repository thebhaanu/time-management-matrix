document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const themeToggle = document.getElementById('theme-toggle');
    const createTaskBtn = document.getElementById('create-task');
    const taskTitleInput = document.getElementById('task-title');
    const taskDescriptionInput = document.getElementById('task-description');
    const tasksContainer = document.getElementById('tasks-container');
    const quadrants = document.querySelectorAll('.matrix-quadrant');
    const mobileHelpElement = document.querySelector('.mobile-help');
    
    // Local Storage Keys
    const TASKS_STORAGE_KEY = 'eisenhower-tasks';
    const THEME_STORAGE_KEY = 'eisenhower-theme';
    
    // Track selected task for mobile
    let selectedTask = null;
    
    // Detect if device is mobile
    const isMobile = window.matchMedia('(max-width: 767px)').matches || 
                     /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Show/hide mobile help text
    if (!isMobile) {
        mobileHelpElement.style.display = 'none';
    }
    
    // Initialize theme
    initTheme();
    
    // Initialize tasks from localStorage
    loadTasks();
    
    // Event Listeners
    themeToggle.addEventListener('click', toggleTheme);
    createTaskBtn.addEventListener('click', createTask);
    
    // Setup interactions based on device
    if (isMobile) {
        setupMobileInteractions();
    } else {
        setupDragAndDrop();
    }
    
    // Functions
    function initTheme() {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }
    
    function toggleTheme() {
        if (document.body.classList.contains('dark-mode')) {
            document.body.classList.remove('dark-mode');
            localStorage.setItem(THEME_STORAGE_KEY, 'light');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        } else {
            document.body.classList.add('dark-mode');
            localStorage.setItem(THEME_STORAGE_KEY, 'dark');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    }
    
    function createTask() {
        const title = taskTitleInput.value.trim();
        const description = taskDescriptionInput.value.trim();
        
        if (!title) {
            shake(taskTitleInput);
            return;
        }
        
        const taskId = 'task-' + Date.now();
        const task = {
            id: taskId,
            title,
            description,
            quadrant: null,
            createdAt: new Date().toISOString()
        };
        
        // Add to DOM
        const taskElement = createTaskElement(task);
        tasksContainer.appendChild(taskElement);
        
        // Save to storage
        saveTask(task);
        
        // Clear inputs
        taskTitleInput.value = '';
        taskDescriptionInput.value = '';
    }
    
    function createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-card';
        taskElement.id = task.id;
        taskElement.draggable = !isMobile; // Only make draggable on desktop
        taskElement.dataset.taskId = task.id;
        
        const titleElement = document.createElement('h4');
        titleElement.textContent = task.title;
        
        const descriptionElement = document.createElement('p');
        descriptionElement.textContent = task.description;
        
        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
        deleteButton.title = 'Delete task';
        deleteButton.className = 'delete-task';
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTask(task.id);
        });
        
        // For mobile, add action buttons to move tasks directly
        if (isMobile) {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'task-actions';
            
            const q1Btn = createQuadrantButton('1', 'Do it right away', 'fa-bolt', '#e53e3e');
            const q2Btn = createQuadrantButton('2', 'Plan to do it later', 'fa-calendar', '#38a169');
            const q3Btn = createQuadrantButton('3', 'Ask someone else', 'fa-user', '#dd6b20');
            const q4Btn = createQuadrantButton('4', 'Skip or remove it', 'fa-ban', '#718096');
            
            actionsDiv.appendChild(q1Btn);
            actionsDiv.appendChild(q2Btn);
            actionsDiv.appendChild(q3Btn);
            actionsDiv.appendChild(q4Btn);
            
            taskElement.appendChild(titleElement);
            if (task.description) {
                taskElement.appendChild(descriptionElement);
            }
            taskElement.appendChild(actionsDiv);
            taskElement.appendChild(deleteButton);
        } else {
            // Desktop layout
            taskElement.appendChild(titleElement);
            if (task.description) {
                taskElement.appendChild(descriptionElement);
            }
            taskElement.appendChild(deleteButton);
            
            // Add desktop event listeners
            taskElement.addEventListener('dragstart', handleDragStart);
        }
        
        return taskElement;
    }
    
    function createQuadrantButton(quadrantNum, title, icon, color) {
        const button = document.createElement('button');
        button.className = 'quadrant-btn';
        button.title = title;
        button.innerHTML = `<i class="fas ${icon}"></i>`;
        button.style.color = color;
        
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const taskElement = e.target.closest('.task-card');
            if (!taskElement) return;
            
            const taskId = taskElement.id;
            const quadrant = document.getElementById(`q${quadrantNum}`);
            if (!quadrant) return;
            
            const quadrantTasks = quadrant.querySelector('.quadrant-tasks');
            moveTaskToQuadrant(taskElement, quadrantTasks, quadrantNum);
            
            // Show success message
            showFeedback(`Moved to "${title}"`);
        });
        
        return button;
    }
    
    function moveTaskToQuadrant(taskElement, container, quadrantNumber) {
        if (!taskElement || !container) return;
        
        // Get old quadrant if exists
        const oldQuadrant = taskElement.closest('.matrix-quadrant');
        
        // Move the task to the new container
        container.appendChild(taskElement);
        
        // Update task's quadrant in storage
        updateTaskQuadrant(taskElement.id, quadrantNumber);
        
        // Update quadrant states
        if (oldQuadrant) {
            updateQuadrantState(oldQuadrant);
        }
        
        const newQuadrant = document.getElementById(`q${quadrantNumber}`);
        if (newQuadrant) {
            updateQuadrantState(newQuadrant);
        }
    }
    
    function showFeedback(message) {
        const feedbackEl = document.createElement('div');
        feedbackEl.className = 'action-feedback';
        feedbackEl.textContent = message;
        document.body.appendChild(feedbackEl);
        
        setTimeout(() => {
            feedbackEl.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            feedbackEl.classList.remove('show');
            setTimeout(() => {
                feedbackEl.remove();
            }, 300);
        }, 1500);
    }
    
    function saveTask(task) {
        try {
            const tasks = getAllTasks();
            tasks.push(task);
            localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
        } catch (error) {
            console.error('Error saving task to localStorage:', error);
            // Show a temporary error message
            const errorMsg = document.createElement('div');
            errorMsg.className = 'error-msg';
            errorMsg.innerHTML = '<i class="fas fa-exclamation-circle"></i> Failed to save task. Storage may be full.';
            document.querySelector('.task-form').appendChild(errorMsg);
            
            setTimeout(() => {
                errorMsg.remove();
            }, 3000);
        }
    }
    
    function getAllTasks() {
        try {
            const tasksJSON = localStorage.getItem(TASKS_STORAGE_KEY);
            return tasksJSON ? JSON.parse(tasksJSON) : [];
        } catch (error) {
            console.error('Error retrieving tasks from localStorage:', error);
            return [];
        }
    }
    
    function loadTasks() {
        const tasks = getAllTasks();
        
        // Clear containers
        tasksContainer.innerHTML = '';
        quadrants.forEach(quadrant => {
            const tasksContainer = quadrant.querySelector('.quadrant-tasks');
            tasksContainer.innerHTML = '';
        });
        
        // Add tasks to appropriate containers
        tasks.forEach(task => {
            const taskElement = createTaskElement(task);
            
            if (task.quadrant) {
                const quadrant = document.getElementById(`q${task.quadrant}`);
                if (quadrant) {
                    quadrant.querySelector('.quadrant-tasks').appendChild(taskElement);
                    // Show that quadrant has tasks
                    updateQuadrantState(quadrant);
                } else {
                    tasksContainer.appendChild(taskElement);
                }
            } else {
                tasksContainer.appendChild(taskElement);
            }
        });
        
        // Update all quadrant states
        quadrants.forEach(updateQuadrantState);
    }
    
    function deleteTask(taskId) {
        // Get parent quadrant before removing
        const taskElement = document.getElementById(taskId);
        const quadrant = taskElement ? taskElement.closest('.matrix-quadrant') : null;
        
        // Remove from DOM
        if (taskElement) {
            taskElement.remove();
        }
        
        // Update quadrant state if task was in a quadrant
        if (quadrant) {
            updateQuadrantState(quadrant);
        }
        
        // Remove from storage
        const tasks = getAllTasks();
        const updatedTasks = tasks.filter(task => task.id !== taskId);
        localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(updatedTasks));
    }
    
    function updateTaskQuadrant(taskId, quadrantNumber) {
        const tasks = getAllTasks();
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex !== -1) {
            tasks[taskIndex].quadrant = quadrantNumber;
            localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
        }
    }
    
    function updateQuadrantState(quadrant) {
        const tasks = quadrant.querySelector('.quadrant-tasks').children;
        
        if (tasks.length > 0) {
            quadrant.classList.add('has-tasks');
        } else {
            quadrant.classList.remove('has-tasks');
        }
    }
    
    // Mobile-specific interactions
    function setupMobileInteractions() {
        // Add "Move Back" button to quadrant tasks
        quadrants.forEach(quadrant => {
            const dropZone = quadrant.querySelector('.drop-zone');
            
            // Create a "move back" button for this quadrant
            const moveBackBtn = document.createElement('button');
            moveBackBtn.className = 'move-back-btn';
            moveBackBtn.innerHTML = '<i class="fas fa-arrow-left"></i> Move tasks back to list';
            moveBackBtn.addEventListener('click', () => {
                const tasks = quadrant.querySelectorAll('.task-card');
                if (tasks.length === 0) {
                    showFeedback('No tasks to move');
                    return;
                }
                
                tasks.forEach(task => {
                    tasksContainer.appendChild(task);
                    updateTaskQuadrant(task.id, null);
                });
                
                updateQuadrantState(quadrant);
                showFeedback('Tasks moved back to list');
            });
            
            dropZone.appendChild(moveBackBtn);
        });
    }
    
    // Desktop drag and drop
    function setupDragAndDrop() {
        // Add dragover event to quadrants
        quadrants.forEach(quadrant => {
            quadrant.addEventListener('dragover', (e) => {
                e.preventDefault();
                quadrant.classList.add('drag-over');
            });
            
            quadrant.addEventListener('dragleave', () => {
                quadrant.classList.remove('drag-over');
            });
            
            quadrant.addEventListener('drop', handleDrop);
        });
        
        // Add dragover event to tasks container (to move back)
        tasksContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            tasksContainer.classList.add('drag-over');
        });
        
        tasksContainer.addEventListener('dragleave', () => {
            tasksContainer.classList.remove('drag-over');
        });
        
        tasksContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            tasksContainer.classList.remove('drag-over');
            
            const taskId = e.dataTransfer.getData('text/plain');
            const taskElement = document.getElementById(taskId);
            
            if (taskElement) {
                // Get old quadrant if exists
                const oldQuadrant = taskElement.closest('.matrix-quadrant');
                
                tasksContainer.appendChild(taskElement);
                updateTaskQuadrant(taskId, null);
                
                // Update old quadrant state if task was in a quadrant
                if (oldQuadrant) {
                    updateQuadrantState(oldQuadrant);
                }
            }
        });
    }
    
    function handleDragStart(e) {
        const taskElement = e.target.closest('.task-card');
        e.dataTransfer.setData('text/plain', taskElement.id);
        
        // Create a ghost image for dragging
        const ghostElement = taskElement.cloneNode(true);
        ghostElement.style.opacity = '0.5';
        ghostElement.style.position = 'absolute';
        ghostElement.style.top = '-1000px';
        document.body.appendChild(ghostElement);
        e.dataTransfer.setDragImage(ghostElement, 0, 0);
        
        // Add dragging class
        taskElement.classList.add('dragging');
        
        // Set timeout to remove ghost element and class
        setTimeout(() => {
            document.body.removeChild(ghostElement);
        }, 0);
    }
    
    function handleDrop(e) {
        e.preventDefault();
        const quadrant = e.currentTarget;
        quadrant.classList.remove('drag-over');
        
        const taskId = e.dataTransfer.getData('text/plain');
        const taskElement = document.getElementById(taskId);
        
        if (taskElement) {
            // Get old quadrant if exists
            const oldQuadrant = taskElement.closest('.matrix-quadrant');
            
            const quadrantTasks = quadrant.querySelector('.quadrant-tasks');
            quadrantTasks.appendChild(taskElement);
            
            // Update task's quadrant in storage
            const quadrantNumber = quadrant.dataset.quadrant;
            updateTaskQuadrant(taskId, quadrantNumber);
            
            // Update quadrant states
            updateQuadrantState(quadrant);
            
            // Update old quadrant state if different from current
            if (oldQuadrant && oldQuadrant !== quadrant) {
                updateQuadrantState(oldQuadrant);
            }
        }
    }
    
    function shake(element) {
        element.classList.add('shake');
        setTimeout(() => {
            element.classList.remove('shake');
        }, 500);
    }
}); 