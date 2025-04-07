/**
 * Kanban Goals Board Logic - v4 (Debugging Clicks)
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log("Kanban Board JS Loaded - v4 (Debugging Clicks)");

    // --- State ---
    let goals = []; // { id, title, description, status }
    const KANBAN_STORAGE_KEY = 'kanbanGoals_v1'; // Keep same key unless structure changes drastically

    // --- DOM References ---
    const kanbanBoard = document.getElementById('kanban-board'); // Main container for columns
    // Specific column card containers (used for rendering and drop target identification)
    const todoColumnCards = document.getElementById('todo-cards');
    const inprogressColumnCards = document.getElementById('inprogress-cards');
    const doneColumnCards = document.getElementById('done-cards');
    const columnCardContainers = [todoColumnCards, inprogressColumnCards, doneColumnCards];

    // Modal Elements
    const goalModal = document.getElementById('goal-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalForm = document.getElementById('modal-goal-form');
    const modalGoalIdInput = document.getElementById('modal-goal-id');
    const modalGoalStatusInput = document.getElementById('modal-goal-status'); // For adding new
    const modalGoalTitleInput = document.getElementById('modal-goal-title');
    const modalGoalDescInput = document.getElementById('modal-goal-description');
    const saveGoalButton = document.getElementById('save-goal-button');
    const cancelGoalButton = document.getElementById('cancel-goal-button');
    const modalCloseButton = document.getElementById('modal-close-button');

    // --- Drag & Drop State ---
    let draggedGoalId = null;

    // ==============================
    // == INITIALIZATION & DATA
    // ==============================

    function init() {
        console.log("[Init] Starting initialization...");
        loadGoals();
        setupEventListeners();
        renderKanbanBoard();
        console.log("[Init] Initialization complete.");
    }

    function generateId() {
        return 'goal-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
    }

    function loadGoals() {
        console.log("[Data] Loading goals...");
        const storedGoals = localStorage.getItem(KANBAN_STORAGE_KEY);
        goals = [];
        if (storedGoals) {
            try {
                const parsedGoals = JSON.parse(storedGoals);
                if (Array.isArray(parsedGoals)) {
                    // Basic validation
                    goals = parsedGoals.filter(g => g && typeof g === 'object' && g.id && g.title && g.status);
                } else { console.warn("[Data] Stored goals not an array."); }
            } catch (e) { console.error("[Data] Error parsing stored goals:", e); }
        }
        console.log("[Data] Goals loaded:", goals.length);
    }

    function saveGoals() {
        console.log("[Data] Saving goals...");
        try {
            localStorage.setItem(KANBAN_STORAGE_KEY, JSON.stringify(goals));
            console.log("[Data] Goals saved.");
        } catch (e) { console.error("[Data] Error saving goals:", e); alert("Error saving goals data."); }
    }

    // ==============================
    // == RENDERING
    // ==============================

    function renderKanbanBoard() {
        console.log("[Render] Rendering Kanban Board...");
        // Clear existing cards from column card containers
        columnCardContainers.forEach(container => {
            if (container) { // Check if container exists
                 container.innerHTML = '';
            } else {
                 console.error("[Render] A column card container is missing from the DOM!");
            }
        });

        if (goals.length === 0) {
            if(todoColumnCards) todoColumnCards.innerHTML = '<p class="kanban-empty-message">Click column to add a goal!</p>';
            if(inprogressColumnCards) inprogressColumnCards.innerHTML = '<p class="kanban-empty-message">Drag goals here</p>';
            if(doneColumnCards) doneColumnCards.innerHTML = '<p class="kanban-empty-message">Drag goals here</p>';
        } else {
            goals.forEach(goal => {
                const cardElement = createGoalCardElement(goal);
                const targetContainer = getColumnContainerByStatus(goal.status);
                if (targetContainer) {
                    targetContainer.appendChild(cardElement);
                } else {
                    // Fallback if status is invalid
                    console.warn(`[Render] Goal ${goal.id} has unknown status: ${goal.status}. Placing in 'To Do'.`);
                    goal.status = 'todo';
                    saveGoals(); // Save correction
                    if(todoColumnCards) todoColumnCards.appendChild(cardElement);
                }
            });
        }
        console.log("[Render] Kanban Board Render Complete.");
    }

    /** Creates an HTML element for a single goal card */
    function createGoalCardElement(goal) {
        const card = document.createElement('div');
        card.className = 'kanban-card';
        card.setAttribute('draggable', 'true');
        card.id = goal.id;

        // Use textContent for safety against XSS for title/description
        const titleEl = document.createElement('h4');
        titleEl.textContent = goal.title; // Safer than innerHTML
        card.appendChild(titleEl);

        if (goal.description) {
            const descEl = document.createElement('p');
            descEl.textContent = goal.description; // Safer than innerHTML
            card.appendChild(descEl);
        }

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-goal-btn';
        deleteButton.innerHTML = '×'; // This is safe for the 'x' symbol
        deleteButton.title = 'Delete Goal';
        deleteButton.dataset.action = 'delete-goal';
        card.appendChild(deleteButton);

        // Drag listeners remain on the card
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);

        return card;
    }

    /** Helper to get the correct column card container based on status */
    function getColumnContainerByStatus(status) {
        switch (status) {
            case 'todo': return todoColumnCards;
            case 'inprogress': return inprogressColumnCards;
            case 'done': return doneColumnCards;
            default:
                console.warn(`[Render] Unknown status requested: ${status}`);
                return null;
        }
    }

    // ==============================
    // == MODAL HANDLING
    // ==============================

    function openModal(goalToEdit = null, targetStatus = 'todo') {
        console.log("[Modal] Attempting to open modal...");
        if(!goalModal) {
            console.error("[Modal] Modal element not found!");
            return;
        }
        modalForm.reset();

        if (goalToEdit && goalToEdit.id) {
            modalTitle.textContent = 'Edit Goal';
            modalGoalIdInput.value = goalToEdit.id;
            modalGoalStatusInput.value = ''; // Not needed for edit
            modalGoalTitleInput.value = goalToEdit.title;
            modalGoalDescInput.value = goalToEdit.description || '';
            saveGoalButton.textContent = 'Update Goal';
            console.log(`[Modal] Mode: EDIT, Goal ID: ${goalToEdit.id}`);
        } else {
            modalTitle.textContent = 'Add New Goal';
            modalGoalIdInput.value = '';
            modalGoalStatusInput.value = targetStatus; // Store target status
            saveGoalButton.textContent = 'Add Goal';
            console.log(`[Modal] Mode: ADD, Target Status: ${targetStatus}`);
        }

        goalModal.style.display = 'flex';
        // Force reflow to ensure transition works correctly when changing display
        void goalModal.offsetWidth;
        goalModal.classList.add('visible');
        modalGoalTitleInput.focus();
        console.log("[Modal] Modal opened.");
    }

    function closeModal() {
        console.log("[Modal] Closing modal...");
        if(!goalModal) {
            console.error("[Modal] Modal element not found on close!");
            return;
        }
        goalModal.classList.remove('visible');
        setTimeout(() => {
            goalModal.style.display = 'none';
            modalForm.reset();
            console.log("[Modal] Modal closed and form reset.");
        }, 300); // Match CSS transition duration
    }

    function handleModalSubmit(event) {
        event.preventDefault();
        console.log("[Modal] Form submitted.");
        const id = modalGoalIdInput.value;
        const targetStatus = modalGoalStatusInput.value;
        const title = modalGoalTitleInput.value.trim();
        const description = modalGoalDescInput.value.trim();

        if (!title) { alert("Goal title cannot be empty."); return; }

        if (id) {
            updateGoal(id, title, description);
        } else if (targetStatus) {
            addGoal(title, description, targetStatus);
        } else {
            console.error("[Modal] Submit error: Missing ID or Status.");
            alert("An error occurred saving the goal.");
        }

        saveGoals();
        renderKanbanBoard();
        closeModal();
    }

    function addGoal(title, description, status) {
        const newGoal = { id: generateId(), title, description, status };
        goals.push(newGoal);
        console.log("[Data] Added new goal:", newGoal);
    }

    function updateGoal(id, title, description) {
        const goalIndex = goals.findIndex(g => g.id === id);
        if (goalIndex !== -1) {
            goals[goalIndex].title = title;
            goals[goalIndex].description = description;
            console.log("[Data] Updated goal:", goals[goalIndex]);
        } else { console.warn(`[Data] Goal ID ${id} not found for update.`); }
    }

    // ==============================
    // == EVENT LISTENERS & HANDLERS
    // ==============================

    function setupEventListeners() {
        console.log("[Event] Setting up event listeners...");

        // --- Modal Listeners ---
        if (modalForm) modalForm.addEventListener('submit', handleModalSubmit); else console.error("[Event] Modal form not found!");
        if (cancelGoalButton) cancelGoalButton.addEventListener('click', closeModal); else console.error("[Event] Modal cancel button not found!");
        if (modalCloseButton) modalCloseButton.addEventListener('click', closeModal); else console.error("[Event] Modal close button not found!");
        if (goalModal) goalModal.addEventListener('click', (event) => { if (event.target === goalModal) { closeModal(); } }); else console.error("[Event] Modal overlay not found!");
        console.log("[Event] Modal listeners attached.");

        // --- Consolidated Board Click Listener ---
        if (kanbanBoard) {
            kanbanBoard.addEventListener('click', handleBoardClick);
            console.log("[Event] Board click listener attached.");
        } else {
            console.error("[Event] Kanban board element (#kanban-board) not found!");
        }


        // --- Drag and Drop Listeners ---
        columnCardContainers.forEach((container, index) => {
            if (container) {
                container.addEventListener('dragover', handleDragOver);
                container.addEventListener('dragleave', handleDragLeave);
                container.addEventListener('drop', handleDrop);
                console.log(`[Event] D&D listeners attached to column container ${index}.`);
            } else {
                console.error(`[Event] Column card container ${index} (#${['todo-cards','inprogress-cards','done-cards'][index]}) not found!`);
            }
        });
    }


    /** Handles ALL clicks within the main #kanban-board area */
    function handleBoardClick(event) {
        const target = event.target;
        console.log("[Click] Board clicked. Target:", target);
        // If the target is SVG or PATH inside button, get the button itself
        const actualTarget = target.closest('button') || target;
        console.log("[Click] Effective Target (closest button or original):", actualTarget);


        // --- Case 1: Clicked the Delete Button ---
        // Check if the effective target or its parent is the delete button
        const deleteButton = actualTarget.closest('.delete-goal-btn');
         console.log("[Click] Closest delete button:", deleteButton);
        if (deleteButton) {
            const cardElement = deleteButton.closest('.kanban-card');
            if (cardElement && cardElement.id) {
                console.log("[Click] Action: Delete Goal ID:", cardElement.id);
                handleDeleteGoal(cardElement.id);
            } else {
                 console.warn("[Click] Delete button clicked, but couldn't find parent card ID.");
            }
            return; // Action handled
        }

        // --- Case 2: Clicked on a Goal Card Body (or title/desc within it) ---
        const targetCard = actualTarget.closest('.kanban-card');
        console.log("[Click] Closest card:", targetCard);
        if (targetCard && targetCard.id) {
             // We already excluded delete button clicks above
            console.log("[Click] Action: Edit Goal ID:", targetCard.id);
            const goalData = goals.find(g => g.id === targetCard.id);
            if (goalData) {
                openModal(goalData);
            } else {
                console.warn(`[Click] Goal data for card ID ${targetCard.id} not found.`);
            }
            return; // Action handled
        }

        // --- Case 3: Clicked within a Column (not on card/delete) ---
        const targetColumn = actualTarget.closest('.kanban-column');
         console.log("[Click] Closest column:", targetColumn);
        if (targetColumn) {
            // Check if the click was directly on the cards container or the empty message/header within it
            // Or even just on the column itself if not handled above
             const status = targetColumn.dataset.status;
             if (status) {
                 console.log(`[Click] Action: Add Goal to Column Status: ${status}`);
                 openModal(null, status); // Open modal in 'add' mode
             } else {
                 console.warn("[Click] Clicked in column, but couldn't determine status from dataset.");
             }
             return; // Action handled (or attempted)
        }

         console.log("[Click] Click did not match any specific action handler (delete, edit card, add column).");
    }


    function handleDeleteGoal(goalId) {
        const goalIndex = goals.findIndex(g => g.id === goalId);
        if (goalIndex === -1) { console.warn(`[Delete] Goal ${goalId} not found.`); return; }
        const goalTitle = goals[goalIndex].title;
        // Use setTimeout to allow console log before blocking alert
        setTimeout(() => {
            if (confirm(`Delete goal "${goalTitle}"?`)) {
                goals.splice(goalIndex, 1);
                console.log(`[Delete] Deleted goal: ${goalId}`);
                saveGoals();
                renderKanbanBoard();
            } else {
                console.log(`[Delete] Deletion cancelled for goal: ${goalId}`);
            }
        }, 0);
    }

    // --- Drag and Drop Handlers ---
    function handleDragStart(event) {
        draggedGoalId = event.target.id;
        // Check if target is indeed a card
        if (event.target.classList.contains('kanban-card')) {
             event.dataTransfer.setData('text/plain', draggedGoalId);
             event.dataTransfer.effectAllowed = 'move';
             // Delay adding class slightly
             setTimeout(() => { event.target.classList.add('dragging'); }, 0);
             console.log(`[DnD] Drag Start: ${draggedGoalId}`);
        } else {
            console.log("[DnD] Drag Start ignored, target not a card:", event.target);
             event.preventDefault(); // Prevent dragging non-card elements if possible
        }
    }
    function handleDragEnd(event) {
        console.log("[DnD] Drag End");
        // Ensure cleanup happens even if drop fails or is cancelled
        if (draggedGoalId) {
            const el = document.getElementById(draggedGoalId);
            if (el) el.classList.remove('dragging');
        }
        draggedGoalId = null;
        columnCardContainers.forEach(col => col?.classList.remove('drag-over'));
    }
    function handleDragOver(event) {
        event.preventDefault(); // Allow drop
        event.dataTransfer.dropEffect = 'move';
        const colCards = event.target.closest('.kanban-cards');
        if (colCards && !colCards.classList.contains('drag-over')) { // Add check to prevent redundant adds
             // Remove from others first to prevent multiple highlights
             columnCardContainers.forEach(c => c?.classList.remove('drag-over'));
             colCards.classList.add('drag-over');
             // console.log("[DnD] Drag Over:", colCards.id); // Can be noisy, enable if needed
        }
    }
    function handleDragLeave(event) {
        const colCards = event.target.closest('.kanban-cards');
        // More robust leave check: remove class only if mouse moves truly outside container bounds
        if (colCards && !colCards.contains(event.relatedTarget) && event.clientX > 0 && event.clientY > 0) { // Added clientX/Y check for edge cases
            colCards.classList.remove('drag-over');
            // console.log("[DnD] Drag Leave:", colCards.id); // Noisy
        }
    }
    function handleDrop(event) {
        event.preventDefault();
        console.log("[DnD] Drop event");
        const targetColumnCards = event.target.closest('.kanban-cards');
        const targetColumn = event.target.closest('.kanban-column');
        // Always remove drag-over style from all columns on drop
        columnCardContainers.forEach(col => col?.classList.remove('drag-over'));

        if (!targetColumnCards || !targetColumn || !draggedGoalId) { // Ensure draggedGoalId is set
            console.warn("[DnD] Invalid drop target or missing dragged item ID.");
             if(draggedGoalId) document.getElementById(draggedGoalId)?.classList.remove('dragging'); // Clean up dragged item style
             draggedGoalId = null; // Reset dragged ID
            return;
        }

        const droppedGoalId = draggedGoalId; // Use the ID stored during dragstart
        const newStatus = targetColumn.dataset.status;

        if (!newStatus) { console.error("[DnD] Drop failed: Could not determine target status."); return; }
        console.log(`[DnD] Drop Goal: ${droppedGoalId} -> Status: ${newStatus}`);

        const goalIndex = goals.findIndex(g => g.id === droppedGoalId);
        if (goalIndex !== -1) {
             if (goals[goalIndex].status !== newStatus) {
                goals[goalIndex].status = newStatus;
                console.log(`[DnD] Updated status for ${droppedGoalId} to ${newStatus}`);
                saveGoals();
                renderKanbanBoard(); // Re-render needed to physically move the card element
            } else {
                console.log(`[DnD] Goal dropped on same column.`);
                 // No state change, but ensure visual style is removed
                 const el = document.getElementById(droppedGoalId); if (el) el.classList.remove('dragging');
            }
        } else { console.warn(`[DnD] Dropped goal ${droppedGoalId} not found in state.`); }

        draggedGoalId = null; // Important: Reset after handling drop
    }


    // ==============================
    // == START KANBAN
    // ==============================
    init();

}); // End DOMContentLoaded