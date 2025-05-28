document.addEventListener('DOMContentLoaded', () => {

  // Heart icon toggle logic will be moved into the global delegated click listener below.

  // Phase 2-B: Simple Modal Engine (Enhanced for Accessibility - Phase 6)
  const modalOverlays = document.querySelectorAll('.modal-overlay');
  let lastFocusedElement = null; // To store the element that opened the modal
  let currentOpenModalId = null; // To track the currently open modal

  // Attach keydown listener globally once.
  // handleModalKeyDown will only act if a modal is open (checks currentOpenModalId).
  document.addEventListener('keydown', handleModalKeyDown);

  function getFocusableElements(modalElement) {
    return Array.from(
      modalElement.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
  }

  function handleModalKeyDown(event) {
    if (!currentOpenModalId) return;
    const modal = document.getElementById(currentOpenModalId);
    if (!modal) return;

    if (event.key === 'Escape') {
      closeModal(currentOpenModalId);
      return;
    }

    if (event.key === 'Tab') {
      const focusableElements = getFocusableElements(modal.querySelector('.modal-content'));
      if (focusableElements.length === 0) {
        event.preventDefault(); // No focusable elements, prevent tabbing out
        return;
      }
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // If shift + tab is pressed on the first element, move to the last
        if (document.activeElement === firstElement) {
          lastElement.focus();
          event.preventDefault();
        }
      } else {
        // If tab is pressed on the last element, move to the first
        if (document.activeElement === lastElement) {
          firstElement.focus();
          event.preventDefault();
        }
      }
    }
  }

  function openModal(modalId, openerElement) {
    const modal = document.getElementById(modalId);
    if (modal) {
      lastFocusedElement = openerElement || document.activeElement; // Store the element that opened the modal
      modal.classList.add('visible');
      currentOpenModalId = modalId;

      // Focus the first focusable element in the modal, or the modal content itself
      const focusableElements = getFocusableElements(modal.querySelector('.modal-content'));
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      } else {
        modal.querySelector('.modal-content').setAttribute('tabindex', '-1'); // Make content focusable if nothing else is
        modal.querySelector('.modal-content').focus();
      }
      
      // Global keydown listener is already active.
    } else {
      console.warn(`Modal with ID "${modalId}" not found.`);
    }
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('visible');
      currentOpenModalId = null;
      // Return focus to the element that opened the modal
      if (lastFocusedElement) {
        lastFocusedElement.focus();
        lastFocusedElement = null;
      }
      // Clean up tabindex if we added it
      const modalContent = modal.querySelector('.modal-content');
      if (modalContent.hasAttribute('tabindex')) {
          modalContent.removeAttribute('tabindex');
      }
      
      // Global keydown listener remains active. It won't interfere.
    } else {
      console.warn(`Modal with ID "${modalId}" not found.`);
    }
  }

  // --- Delegated Event Listeners (Clicks and Changes) ---
  // Note: Elements specific to a modal's internal workings (like save/clear buttons)
  // will be queried if/when that modal is active and interacted with, 
  // rather than caching them all upfront.
  document.body.addEventListener('click', function(event) {
    const target = event.target;

    // Modal Open Logic
    const modalTargetId = target.closest('[data-modal-target]')?.dataset.modalTarget;
    if (modalTargetId) {
      const openerElement = target.closest('[data-modal-target]');
      // Specific condition for 'create-group-btn' which might not always open saveFeedModalOverlay
      if (openerElement.id === 'create-group-btn' && !openerElement.textContent.includes('Save as Feed')) {
        // Do nothing or handle alternative action for 'Edit Feed'
        return;
      }
      openModal(modalTargetId, openerElement);
      return; // Stop further processing if modal was opened
    }

    // Modal Close Logic (buttons with data-modal-dismiss or backdrop click)
    if (target.closest('[data-modal-dismiss]') || target.classList.contains('modal-overlay')) {
      if (currentOpenModalId) {
        // If the click is on a dismiss button OR directly on the overlay (not its children)
        if (target.closest('[data-modal-dismiss]') || target.id === currentOpenModalId) {
           closeModal(currentOpenModalId);
        }
      }
      return; // Stop further processing if modal was closed or dismiss attempted
    }
    
    // Placeholder actions for Save Feed modal buttons (if not handled by simple close)
    if (currentOpenModalId === 'saveFeedModalOverlay') {
        const modalNode = document.getElementById('saveFeedModalOverlay'); // Get the modal element
        if (!modalNode) return; // Should not happen if currentOpenModalId is set

        // Query for buttons within this specific modal context
        const sSaveBtn = modalNode.querySelector('#modalSaveBtn'); 
        const sClearBtn = modalNode.querySelector('#modalClearBtn');
        const fNameInput = modalNode.querySelector('#feedNameInput');

        if (target === sSaveBtn) {
            console.log('Save Feed: Save button clicked');
            if(fNameInput) fNameInput.value = ''; 
            closeModal('saveFeedModalOverlay');
        }
        if (target === sClearBtn) {
            console.log('Save Feed: Clear button clicked');
            if(fNameInput) fNameInput.value = '';
            // Note: Clear usually doesn't close the modal, so no closeModal here
        }
    }

    // Delegated Heart Icon Click
    const heartIcon = target.closest('.heart-icon');
    if (heartIcon) {
      heartIcon.classList.toggle('liked');
      // In a real app, you'd also send this to a server or save to localStorage
      return; // Processed heart click
    }
  });

  // Delegated Filter Change Listener
  const filterBar = document.querySelector('.filter-bar');
  if (filterBar) {
    filterBar.addEventListener('change', function(event) {
      const targetSelect = event.target;
      if (targetSelect.tagName === 'SELECT') {
        updateFilterVisuals(targetSelect);
      }
    });
  }


  // --- Share Feed Modal specific elements (Copy buttons, etc. will need their own specific handlers)
  // These are not general open/close behaviors so they are handled separately.
  // Share modal close is handled by data-modal-dismiss on its close button.

  // Expose functions to global scope if needed for inline JS or debugging (optional)
  // window.openModal = openModal;
  // window.closeModal = closeModal;

  // --- Date Utility Functions ---
  const MONTH_NAMES_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function formatDate(date) {
    return `${MONTH_NAMES_SHORT[date.getMonth()]} ${date.getDate()}`;
  }

  function formatDateRange(startDate, endDate) {
    const startMonth = MONTH_NAMES_SHORT[startDate.getMonth()];
    const startDay = startDate.getDate();
    const endMonth = MONTH_NAMES_SHORT[endDate.getMonth()];
    const endDay = endDate.getDate();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
    }
  }

  function getWeekDates(baseDateInput) {
    const baseDate = new Date(baseDateInput.getTime()); // Use a copy

    const todayDate = new Date(baseDate.getTime());
    const tomorrowDate = new Date(baseDate.getTime());
    tomorrowDate.setDate(baseDate.getDate() + 1);

    const dayOfWeek = baseDate.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6

    const thisWeekStart = new Date(baseDate.getTime());
    thisWeekStart.setDate(baseDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const thisWeekEnd = new Date(thisWeekStart.getTime());
    thisWeekEnd.setDate(thisWeekStart.getDate() + 6);
    
    const thisWeekendStart = new Date(thisWeekStart.getTime());
    thisWeekendStart.setDate(thisWeekStart.getDate() + 5);
    const thisWeekendEnd = new Date(thisWeekStart.getTime());
    thisWeekendEnd.setDate(thisWeekStart.getDate() + 6);

    const nextWeekStart = new Date(thisWeekEnd.getTime());
    nextWeekStart.setDate(thisWeekEnd.getDate() + 1);
    const nextWeekEnd = new Date(nextWeekStart.getTime());
    nextWeekEnd.setDate(nextWeekStart.getDate() + 6);

    const nextWeekendStart = new Date(nextWeekStart.getTime());
    nextWeekendStart.setDate(nextWeekStart.getDate() + 5);
    const nextWeekendEnd = new Date(nextWeekStart.getTime());
    nextWeekendEnd.setDate(nextWeekStart.getDate() + 6);

    const nextFewWeeksStart = new Date(baseDate.getTime());
    const nextFewWeeksEnd = new Date(baseDate.getTime());
    nextFewWeeksEnd.setDate(baseDate.getDate() + 13); // Approx 2 weeks span (14 days total)

    const firstSatOfFewWeekends = new Date(thisWeekendStart.getTime());
    const weekendAfterNextStart = new Date(nextWeekendStart.getTime());
    weekendAfterNextStart.setDate(nextWeekendStart.getDate() + 7);
    const lastSunOfFewWeekends = new Date(weekendAfterNextStart.getTime());
    lastSunOfFewWeekends.setDate(weekendAfterNextStart.getDate() + 1);

    return {
      today: formatDate(todayDate),
      tomorrow: formatDate(tomorrowDate),
      this_week: formatDateRange(thisWeekStart, thisWeekEnd),
      this_weekend: formatDateRange(thisWeekendStart, thisWeekendEnd),
      next_week: formatDateRange(nextWeekStart, nextWeekEnd),
      next_weekend: formatDateRange(nextWeekendStart, nextWeekendEnd),
      next_few_weeks: formatDateRange(nextFewWeeksStart, nextFewWeeksEnd),
      next_few_weekends: formatDateRange(firstSatOfFewWeekends, lastSunOfFewWeekends),
    };
  }

  function populateDateOptions() {
    const baseDate = new Date(2025, 4, 19); // May 19, 2025 (Month is 0-indexed)
    const dateTexts = getWeekDates(baseDate);

    // Populate desktop date spans
    const dropdown = document.getElementById('when-dropdown-menu');
    if (dropdown) {
      Object.keys(dateTexts).forEach(marker => {
        const subtextElement = dropdown.querySelector(`.date-subtext[data-date-marker="${marker}"]`);
        if (subtextElement) {
          subtextElement.textContent = dateTexts[marker];
        }
      });
      
      // Set "Today" as default selected for desktop
      const defaultOption = dropdown.querySelector('.date-option[data-value="today"]');
      const searchInputWhen = document.getElementById('search-input-when');
      if (defaultOption && searchInputWhen) {
        defaultOption.classList.add('selected');
        searchInputWhen.value = defaultOption.childNodes[0].nodeValue.trim();
      }
    }
    
    // Populate mobile date spans
    const mobileTimeframePanel = document.getElementById('timeframe-accordion-panel');
    if (mobileTimeframePanel) {
      Object.keys(dateTexts).forEach(marker => {
        const mobileSubtextElements = mobileTimeframePanel.querySelectorAll(`.date-subtext[data-date-marker="${marker}"]`);
        mobileSubtextElements.forEach(element => {
          element.textContent = dateTexts[marker];
        });
      });
    }
  }

  // --- Unified Search Bar Logic ---
  const searchWhenSegment = document.getElementById('search-when');
  const whenDropdownMenu = document.getElementById('when-dropdown-menu');
  const searchInputWhenGlobal = document.getElementById('search-input-when');
  const searchWhereSegment = document.getElementById('search-where'); // Added for Location Dropdown
  const whereDropdownMenu = document.getElementById('where-dropdown-menu'); // Added for Location Dropdown
  const searchInputWhereGlobal = document.getElementById('search-input-where'); // Added for Location Dropdown
  const searchActivitySegment = document.getElementById('search-activity');
  const activityDropdownMenu = document.getElementById('activity-dropdown-menu');
  const searchInputActivityGlobal = document.getElementById('search-input-activity');
  const searchWhoSegment = document.getElementById('search-who');
  const groupSizePopover = document.getElementById('group-size-popover');
  const searchInputWhoGlobal = document.getElementById('search-input-who');
  const groupSizeValueDisplay = document.getElementById('group-size-value');
  const groupSizeMinusBtn = document.getElementById('group-size-minus');
  const groupSizePlusBtn = document.getElementById('group-size-plus');

  const unifiedSearchBar = document.querySelector('.unified-search-bar');
  const saveFeedBtn = document.getElementById('unified-save-feed-btn');
  const searchInputs = [
    searchInputWhereGlobal, 
    searchInputWhenGlobal, // Already defined as document.getElementById('search-input-when')
    searchInputActivityGlobal, 
    searchInputWhoGlobal
  ].filter(input => input !== null); // Filter out nulls if any ID is mistyped or element doesn't exist

  function updateSaveFeedButtonVisibility() {
    if (!unifiedSearchBar || !saveFeedBtn) return;

    let anyInputHasValueOverall = false;
    searchInputs.forEach(input => {
      if (input.value.trim() !== '') {
        input.classList.add('has-value');
        anyInputHasValueOverall = true;
      } else {
        input.classList.remove('has-value');
      }
    });

    if (anyInputHasValueOverall) {
      saveFeedBtn.style.display = 'inline-flex';
    } else {
      saveFeedBtn.style.display = 'none';
    }
  }

  if (searchInputs.length > 0) {
    searchInputs.forEach(input => {
      input.addEventListener('input', updateSaveFeedButtonVisibility);
    });
  }
  // Initial check in case of pre-filled values (e.g. from a previous session)
  updateSaveFeedButtonVisibility(); 

  // Unified Search Bar - "Where" (Location) Dropdown Logic
  //-----------------------------------------------------------------------------
  if (searchWhereSegment && whereDropdownMenu && searchInputWhereGlobal) {
    searchWhereSegment.addEventListener('click', (event) => {
      event.stopPropagation();
      const isHidden = whereDropdownMenu.style.display === 'none' || whereDropdownMenu.style.display === '';
      whereDropdownMenu.style.display = isHidden ? 'block' : 'none'; // Or 'flex' if styled that way
      searchWhereSegment.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
      // Close other dropdowns/popovers
      if (whenDropdownMenu && whenDropdownMenu.style.display !== 'none') {
        whenDropdownMenu.style.display = 'none';
        if(searchWhenSegment) searchWhenSegment.setAttribute('aria-expanded', 'false');
      }
      if (activityDropdownMenu && activityDropdownMenu.style.display !== 'none') {
        activityDropdownMenu.style.display = 'none';
        if(searchActivitySegment) searchActivitySegment.setAttribute('aria-expanded', 'false');
      }
      if (groupSizePopover && groupSizePopover.style.display !== 'none') {
        groupSizePopover.style.display = 'none';
        // searchWhoSegment doesn't have aria-expanded typically, but good practice if it did
      }
    });

    whereDropdownMenu.addEventListener('click', (event) => {
      const target = event.target.closest('.location-option');
      if (target) {
        event.stopPropagation();
        const selectedValue = target.dataset.value;
        searchInputWhereGlobal.value = selectedValue;

        const allOptions = whereDropdownMenu.querySelectorAll('.location-option');
        allOptions.forEach(opt => opt.classList.remove('selected'));
        target.classList.add('selected');
        
        updateSaveFeedButtonVisibility();
        whereDropdownMenu.style.display = 'none';
        searchWhereSegment.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Unified Search Bar - "When" Dropdown Logic
  //-----------------------------------------------------------------------------
  if (searchWhenSegment && whenDropdownMenu && searchInputWhenGlobal) {
    populateDateOptions(); // Populate dates on load

    searchWhenSegment.addEventListener('click', (event) => {
      event.stopPropagation(); 
      const isHidden = whenDropdownMenu.style.display === 'none' || whenDropdownMenu.style.display === '';
      whenDropdownMenu.style.display = isHidden ? 'grid' : 'none'; 
      searchWhenSegment.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
      // Close activity dropdown if open
      if (activityDropdownMenu && activityDropdownMenu.style.display !== 'none') {
        activityDropdownMenu.style.display = 'none';
        searchActivitySegment.setAttribute('aria-expanded', 'false');
      }
    });

    whenDropdownMenu.addEventListener('change', (event) => {
      const targetCheckbox = event.target;
      if (targetCheckbox.matches('input.date-option-checkbox[type="checkbox"]')) {
        const selectedTexts = [];
        const checkedCheckboxes = whenDropdownMenu.querySelectorAll('input.date-option-checkbox:checked');
        
        checkedCheckboxes.forEach(checkbox => {
          const label = checkbox.nextElementSibling; // Get the label associated with the checkbox
          if (label) {
            // Extract text, excluding the date-subtext span for cleaner display in input
            let labelText = '';
            label.childNodes.forEach(node => {
              if (node.nodeType === Node.TEXT_NODE) {
                labelText += node.textContent.trim();
              } else if (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('date-subtext')) {
                 // Include text from other elements if necessary, but exclude subtext spans for the input field display
                labelText += node.textContent.trim();
              }
            });
            if (labelText) selectedTexts.push(labelText.trim());
          }
        });

        if (selectedTexts.length > 0) {
          searchInputWhenGlobal.value = selectedTexts.join(', ');
        } else {
          searchInputWhenGlobal.value = ''; // Clear if no selection
        }
        updateSaveFeedButtonVisibility(); // Update save feed button
        // Do not hide dropdown, allow multiple selections
      }
    });
  }

  // Unified Search Bar - "Activity" Dropdown Logic
  //-----------------------------------------------------------------------------
  if (searchActivitySegment && activityDropdownMenu && searchInputActivityGlobal) {
    searchActivitySegment.addEventListener('click', (event) => {
      event.stopPropagation();
      const isHidden = activityDropdownMenu.style.display === 'none' || activityDropdownMenu.style.display === '';
      activityDropdownMenu.style.display = isHidden ? 'flex' : 'none'; // Use flex for activity dropdown
      searchActivitySegment.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
      // Close when dropdown if open
      if (whenDropdownMenu && whenDropdownMenu.style.display !== 'none') {
        whenDropdownMenu.style.display = 'none';
        searchWhenSegment.setAttribute('aria-expanded', 'false');
      }
    });

    activityDropdownMenu.addEventListener('change', (event) => {
      const target = event.target;
      // Check if the event target is an activity option checkbox
      if (target.matches('input.activity-option-checkbox[type="checkbox"]')) {
        const selectedActivities = [];
        const checkboxes = activityDropdownMenu.querySelectorAll('input.activity-option-checkbox:checked');
        
        checkboxes.forEach(checkbox => {
          selectedActivities.push(checkbox.value);
        });

        if (selectedActivities.length > 0) {
          searchInputActivityGlobal.value = selectedActivities.join(', ');
        } else {
          // If no checkboxes are selected, clear the input to show the placeholder
          searchInputActivityGlobal.value = ''; 
        }
        
        // Do not hide the dropdown here, to allow multiple selections.
        // The dropdown will hide on an outside click or by clicking the main segment again.
        updateSaveFeedButtonVisibility(); // Update save feed button
      }
    });


  }

  // Unified Search Bar - "Group Size" Popover Logic
  //-----------------------------------------------------------------------------
  if (searchWhoSegment && groupSizePopover && searchInputWhoGlobal && groupSizeValueDisplay && groupSizeMinusBtn && groupSizePlusBtn) {
    // Set initial value for the input field from the popover display if needed, or default to 2
    searchInputWhoGlobal.value = groupSizeValueDisplay.textContent;
    groupSizeMinusBtn.disabled = parseInt(groupSizeValueDisplay.textContent) <= 1;

    searchWhoSegment.addEventListener('click', (event) => {
      event.stopPropagation();
      const isHidden = groupSizePopover.style.display === 'none' || groupSizePopover.style.display === '';
      groupSizePopover.style.display = isHidden ? 'flex' : 'none';
      // Close other dropdowns/popovers
      if (whenDropdownMenu && whenDropdownMenu.style.display !== 'none') {
        whenDropdownMenu.style.display = 'none';
        searchWhenSegment.setAttribute('aria-expanded', 'false');
      }
      if (activityDropdownMenu && activityDropdownMenu.style.display !== 'none') {
        activityDropdownMenu.style.display = 'none';
        searchActivitySegment.setAttribute('aria-expanded', 'false');
      }
    });

    groupSizeMinusBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      let currentValue = parseInt(groupSizeValueDisplay.textContent);
      if (currentValue > 1) {
        currentValue--;
        groupSizeValueDisplay.textContent = currentValue;
        searchInputWhoGlobal.value = currentValue;
        updateSaveFeedButtonVisibility();
      }
      groupSizeMinusBtn.disabled = currentValue <= 1;
    });

    groupSizePlusBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      let currentValue = parseInt(groupSizeValueDisplay.textContent);
      currentValue++;
      groupSizeValueDisplay.textContent = currentValue;
      searchInputWhoGlobal.value = currentValue;
      groupSizeMinusBtn.disabled = false;
      updateSaveFeedButtonVisibility();
    });
  }

  // Global click listener to close dropdowns
  document.addEventListener('click', (event) => {
    // Close "When" dropdown
    if (whenDropdownMenu && whenDropdownMenu.style.display === 'grid' && 
        searchWhenSegment && !searchWhenSegment.contains(event.target) && 
        !whenDropdownMenu.contains(event.target)) {
      whenDropdownMenu.style.display = 'none';
      if(searchWhenSegment) searchWhenSegment.setAttribute('aria-expanded', 'false');
    }
    // Close "Activity" dropdown
    if (activityDropdownMenu && activityDropdownMenu.style.display === 'flex' && 
        searchActivitySegment && !searchActivitySegment.contains(event.target) && 
        !activityDropdownMenu.contains(event.target)) {
      activityDropdownMenu.style.display = 'none';
      if(searchActivitySegment) searchActivitySegment.setAttribute('aria-expanded', 'false');
    }
    // Close "Group Size" popover
    if (groupSizePopover && groupSizePopover.style.display === 'flex' && 
        searchWhoSegment && !searchWhoSegment.contains(event.target) && 
        !groupSizePopover.contains(event.target)) {
      groupSizePopover.style.display = 'none';
    }
    // Close "Where" dropdown
    if (whereDropdownMenu && whereDropdownMenu.style.display === 'block' && 
        searchWhereSegment && !searchWhereSegment.contains(event.target) && 
        !whereDropdownMenu.contains(event.target)) {
      whereDropdownMenu.style.display = 'none';
      if(searchWhereSegment) searchWhereSegment.setAttribute('aria-expanded', 'false');
    }
  });

  // --- Mobile Filter Overlay Logic ---
  const mobileSearchBtn = document.getElementById('unified-search-start-btn-mobile');
  const mobileFilterOverlay = document.getElementById('mobile-filter-overlay');
  const closeMobileFilterBtn = document.getElementById('close-mobile-filter-btn');
  // const mobileFilterApplyBtn = document.getElementById('mobile-filter-apply-btn'); // Not used in current logic, but good to have ref if needed

  const mobileFilterLocationRow = document.getElementById('mobile-filter-location');
  const locationAccordionPanel = document.getElementById('location-accordion-panel');
  // mobileLocationSearchInput is now within the accordion panel, ensure its ID is unique if another exists or scope it.
  // For this refactor, we assume 'mobile-location-search-input' is the correct ID within the accordion.
  // const mobileLocationSearchInput = document.getElementById('mobile-location-search-input'); // Replaced by radio buttons
  const mobileLocationValueDisplay = document.getElementById('mobile-location-value'); // Updated ID
  const mobileLocationOptions = document.querySelectorAll('input.location-option-radio.mobile');

  // Mobile timeframe filter elements
  const mobileFilterTimeframeRow = document.getElementById('mobile-filter-timeframe');
  const timeframeAccordionPanel = document.getElementById('timeframe-accordion-panel');
  const mobileTimeframeValueDisplay = document.getElementById('mobile-timeframe-value');
  const mobileTimeframeOptions = document.querySelectorAll('input.date-option-checkbox.mobile');
  
  // Mobile activity filter elements
  const mobileFilterActivityRow = document.getElementById('mobile-filter-activity');
  const activityAccordionPanel = document.getElementById('activity-accordion-panel');
  const mobileActivityValueDisplay = document.getElementById('mobile-activity-value');
  const mobileActivityOptions = document.querySelectorAll('input.activity-option-checkbox.mobile');
  
  const mobileFilterApplyBtn = document.getElementById('mobile-filter-apply-btn');
  const mobileFilterFeedInfoContainerEl = document.getElementById('mobile-filter-feed-info-container');

  // Function to update timeframe display value based on selected checkboxes
  function updateMobileTimeframeDisplay() {
    if (!mobileTimeframeValueDisplay) return;
    
    const selectedOptions = Array.from(mobileTimeframeOptions).filter(checkbox => checkbox.checked);
    
    if (selectedOptions.length === 0) {
      mobileTimeframeValueDisplay.innerHTML = 'Any <svg class="accordion-chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20px" height="20px"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>';
    } else if (selectedOptions.length === 1) {
      // Find the label for this checkbox to get its text (without the date subtext)
      const label = document.querySelector(`label[for="${selectedOptions[0].id}"]`);
      let labelText = '';
      if (label) {
        // Get main text without date subtext
        Array.from(label.childNodes).forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) {
            labelText += node.textContent.trim();
          }
        });
      }
      mobileTimeframeValueDisplay.innerHTML = `${labelText} <svg class="accordion-chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20px" height="20px"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>`;
    } else {
      mobileTimeframeValueDisplay.innerHTML = `${selectedOptions.length} selected <svg class="accordion-chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20px" height="20px"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>`;
    }
  }
  
  // Function to update activity display value based on selected checkboxes
  function updateMobileActivityDisplay() {
    if (!mobileActivityValueDisplay) return;
    
    const selectedOptions = Array.from(mobileActivityOptions).filter(checkbox => checkbox.checked);
    
    if (selectedOptions.length === 0) {
      mobileActivityValueDisplay.innerHTML = 'Any <svg class="accordion-chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20px" height="20px"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>';
    } else if (selectedOptions.length === 1) {
      const label = document.querySelector(`label[for="${selectedOptions[0].id}"]`);
      if (label) {
        const labelText = label.textContent.trim();
        mobileActivityValueDisplay.innerHTML = `${labelText} <svg class="accordion-chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20px" height="20px"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>`;
      }
    } else {
      mobileActivityValueDisplay.innerHTML = `${selectedOptions.length} selected <svg class="accordion-chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20px" height="20px"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>`;
    }
  }

  // Function to sync between mobile and desktop timeframe filters
  function syncTimeframeFilters(fromMobile = true) {
    if (fromMobile) {
      // Update desktop filter from mobile selections
      if (searchInputWhenGlobal) {
        const selectedMobileOptions = Array.from(mobileTimeframeOptions).filter(checkbox => checkbox.checked);
        
        // Clear desktop selections first
        const desktopCheckboxes = whenDropdownMenu?.querySelectorAll('input.date-option-checkbox');
        if (desktopCheckboxes) {
          desktopCheckboxes.forEach(checkbox => { checkbox.checked = false; });
        }
        
        // Set desktop checkboxes to match mobile selections
        selectedMobileOptions.forEach(mobileCheckbox => {
          const value = mobileCheckbox.value;
          const desktopCheckbox = whenDropdownMenu?.querySelector(`input.date-option-checkbox[value="${value}"]`);
          if (desktopCheckbox) {
            desktopCheckbox.checked = true;
          }
        });
        
        // Fire change event on whenDropdownMenu to update its display
        if (whenDropdownMenu) {
          const event = new Event('change', { bubbles: true });
          whenDropdownMenu.dispatchEvent(event);
        }
      }
    } else {
      // Update mobile filter from desktop selections
      const desktopCheckboxes = whenDropdownMenu?.querySelectorAll('input.date-option-checkbox:checked');
      
      // Clear mobile selections first
      mobileTimeframeOptions.forEach(checkbox => { checkbox.checked = false; });
      
      // Set mobile checkboxes to match desktop selections
      if (desktopCheckboxes) {
        desktopCheckboxes.forEach(desktopCheckbox => {
          const value = desktopCheckbox.value;
          const mobileCheckbox = document.querySelector(`input.date-option-checkbox.mobile[value="${value}"]`);
          if (mobileCheckbox) {
            mobileCheckbox.checked = true;
          }
        });
      }
      
      // Update mobile display
      updateMobileTimeframeDisplay();
    }
  }
  
  // Function to update mobile location display value based on selected radio
  function updateMobileLocationDisplay() {
    if (!mobileLocationValueDisplay) return;

    const selectedOption = Array.from(mobileLocationOptions).find(radio => radio.checked);
    if (selectedOption) {
      const label = document.querySelector(`label[for="${selectedOption.id}"]`);
      const displayText = label ? label.textContent.trim() : 'Any';
      mobileLocationValueDisplay.innerHTML = `${displayText} <svg class="accordion-chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20px" height="20px"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>`;
    } else {
      mobileLocationValueDisplay.innerHTML = `Any <svg class="accordion-chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20px" height="20px"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>`;
    }
  }

  // Function to sync between mobile and desktop activity filters
  function syncActivityFilters(fromMobile = true) {
    if (fromMobile) {
      // Update desktop filter from mobile selections
      if (searchInputActivityGlobal) {
        const selectedMobileOptions = Array.from(mobileActivityOptions).filter(checkbox => checkbox.checked);
        
        // Clear desktop selections first
        const desktopCheckboxes = activityDropdownMenu?.querySelectorAll('input.activity-option-checkbox');
        if (desktopCheckboxes) {
          desktopCheckboxes.forEach(checkbox => { checkbox.checked = false; });
        }
        
        // Set desktop checkboxes to match mobile selections
        selectedMobileOptions.forEach(mobileCheckbox => {
          const value = mobileCheckbox.value;
          const desktopCheckbox = activityDropdownMenu?.querySelector(`input.activity-option-checkbox[value="${value}"]`);
          if (desktopCheckbox) {
            desktopCheckbox.checked = true;
          }
        });
        
        // Fire change event on activityDropdownMenu to update its display
        if (activityDropdownMenu) {
          const event = new Event('change', { bubbles: true });
          activityDropdownMenu.dispatchEvent(event);
        }
      }
    } else {
      // Update mobile filter from desktop selections
      const desktopCheckboxes = activityDropdownMenu?.querySelectorAll('input.activity-option-checkbox:checked');
      
      // Clear mobile selections first
      mobileActivityOptions.forEach(checkbox => { checkbox.checked = false; });
      
      // Set mobile checkboxes to match desktop selections
      if (desktopCheckboxes) {
        desktopCheckboxes.forEach(desktopCheckbox => {
          const value = desktopCheckbox.value;
          const mobileCheckbox = document.querySelector(`input.activity-option-checkbox.mobile[value="${value}"]`);
          if (mobileCheckbox) {
            mobileCheckbox.checked = true;
          }
        });
      }
      
      // Update mobile display
      updateMobileActivityDisplay();
    }
  }

  // Function to update the mobile search button with applied filters
  function updateMobileSearchButtonDisplay() {
    const defaultContent = document.getElementById('unified-search-start-btn-mobile-default-content');
    const appliedFiltersContent = document.getElementById('search-btn-applied-filters-display');

    const whereDisplay = document.getElementById('applied-filter-location'); // Changed from applied-filter-where
    const activityDisplay = document.getElementById('applied-filter-activity');
    const whenDisplay = document.getElementById('applied-filter-when');
    const groupSizeDisplay = document.getElementById('applied-filter-group-size');

    const sepLine1 = document.getElementById('separator-location-activity'); // Changed from applied-filter-sep-line1
    const sepLine2Middle = document.getElementById('separator-when-group'); // Changed from applied-filter-sep-line2-middle;

    if (!defaultContent || !appliedFiltersContent || !whereDisplay || !activityDisplay || !whenDisplay || !groupSizeDisplay || !sepLine1 || !sepLine2Middle) {
      console.warn('One or more mobile search button display elements are missing.');
      return;
    }

    // Get Where (Location)
    let whereVal = '';
    const selectedLocationOption = Array.from(mobileLocationOptions).find(radio => radio.checked);
    if (selectedLocationOption && selectedLocationOption.value) {
      // Find the label for this radio to get its text, as value might be more programmatic
      const label = document.querySelector(`label[for="${selectedLocationOption.id}"]`);
      whereVal = label ? label.textContent.trim() : selectedLocationOption.value; 
    }


    // Get When (Timeframe)
    let whenVal = '';
    const selectedTimeframeOptions = Array.from(mobileTimeframeOptions).filter(checkbox => checkbox.checked);
    if (selectedTimeframeOptions.length === 1) {
      const label = document.querySelector(`label[for="${selectedTimeframeOptions[0].id}"]`);
      let labelText = '';
      if (label) {
        Array.from(label.childNodes).forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) {
            labelText += node.textContent.trim();
          }
        });
      }
      whenVal = labelText;
    } else if (selectedTimeframeOptions.length > 1) {
      whenVal = `${selectedTimeframeOptions.length} selected`;
    }

    // Get What (Activity)
    let activityVal = '';
    const selectedActivityOptions = Array.from(mobileActivityOptions).filter(checkbox => checkbox.checked);
    if (selectedActivityOptions.length === 1) {
      const label = document.querySelector(`label[for="${selectedActivityOptions[0].id}"]`);
      activityVal = label ? label.textContent.trim() : '';
    } else if (selectedActivityOptions.length > 1) {
      activityVal = `${selectedActivityOptions.length} selected`;
    }

    // Get Group Size
    const groupSizeInput = document.getElementById('searchInputWhoGlobal'); // Assuming this is kept in sync
    let groupSizeVal = groupSizeInput ? groupSizeInput.value : '';
    // As per requirement, if group size is 1 (default or 'Any'), treat as not selected for display purposes
    const displayGroupSize = (groupSizeVal && groupSizeVal !== '1') ? groupSizeVal : '';

    whereDisplay.textContent = whereVal;
    activityDisplay.textContent = activityVal;
    whenDisplay.textContent = whenVal;
    groupSizeDisplay.textContent = displayGroupSize;

    let filtersApplied = false;
    if (whereVal || activityVal || whenVal || displayGroupSize) {
      filtersApplied = true;
    }

    // Get reference to bookmark button
    const mobileBookmarkButton = document.getElementById('mobile-bookmark-button');

    // Check if user is in the My Feeds section
    const activeMobileNavItem = document.querySelector('.mobile-bottom-nav .mobile-nav-item.active');
    let isMyFeedsActive = false;
    if (activeMobileNavItem && activeMobileNavItem.querySelector('span')) {
        isMyFeedsActive = activeMobileNavItem.querySelector('span').textContent.trim() === 'My Feeds';
    }

    if (filtersApplied) {
      defaultContent.style.display = 'none';
      appliedFiltersContent.style.display = 'block'; // Or 'flex' if styled that way
      
      // Show bookmark button when filters are applied, but ONLY if not in My Feeds section
      if (mobileBookmarkButton) {
        mobileBookmarkButton.style.display = isMyFeedsActive ? 'none' : 'flex';
      }
    } else {
      defaultContent.style.display = 'flex'; // Or 'block'
      appliedFiltersContent.style.display = 'none';
      
      // Hide bookmark button when no filters are applied
      if (mobileBookmarkButton) {
        mobileBookmarkButton.style.display = 'none';
      }
    }

    // Custom Filter Notice Logic
    const customFilterNoticeEl = document.getElementById('mobile-custom-filter-notice');
    const selectedFeedNameMobileEl = document.getElementById('selected-feed-name-mobile'); 
    let currentSelectedFeedText = 'All feeds'; 
    if (selectedFeedNameMobileEl) {
        currentSelectedFeedText = selectedFeedNameMobileEl.textContent.trim();
    }
    const isSpecificFeedSelected = isMyFeedsActive && currentSelectedFeedText !== 'All feeds' && currentSelectedFeedText !== 'Select Feed';

    if (customFilterNoticeEl) {
        if (isSpecificFeedSelected && filtersApplied) {
            customFilterNoticeEl.style.display = 'block';
        } else {
            customFilterNoticeEl.style.display = 'none';
        }
    }

    // Separator logic
    sepLine1.style.display = (whereVal && activityVal) ? 'inline' : 'none';
    sepLine2Middle.style.display = (whenVal && displayGroupSize) ? 'inline' : 'none';
  }

  // Function to update the display of the active feed name in the mobile filter header
  function updateActiveFeedNameInMobileFilter() {
    if (!mobileFilterFeedInfoContainerEl) return;
    const feedNameTextEl = document.getElementById('mobile-filter-active-feed-name-text');
    if (!feedNameTextEl) return;

    const activeMobileNavItem = document.querySelector('.mobile-bottom-nav .mobile-nav-item.active');
    const selectedFeedNameMobileEl = document.getElementById('selected-feed-name-mobile'); 

    let isMyFeedsActive = false;
    if (activeMobileNavItem && activeMobileNavItem.querySelector('span')) {
        isMyFeedsActive = activeMobileNavItem.querySelector('span').textContent.trim() === 'My Feeds';
    }

    let currentSelectedFeedText = 'All feeds'; 
    if (selectedFeedNameMobileEl) {
        currentSelectedFeedText = selectedFeedNameMobileEl.textContent.trim();
    }

    // Only show if "My Feeds" is active AND a specific feed is selected (not "All feeds" or the placeholder "Select Feed")
    if (isMyFeedsActive && currentSelectedFeedText !== 'All feeds' && currentSelectedFeedText !== 'Select Feed') {
        feedNameTextEl.textContent = currentSelectedFeedText;
        mobileFilterFeedInfoContainerEl.style.display = 'flex'; // Use flex to show the container
    } else {
        feedNameTextEl.textContent = '';
        mobileFilterFeedInfoContainerEl.style.display = 'none';
    }
  }

  if (mobileSearchBtn && mobileFilterOverlay && closeMobileFilterBtn) {
    mobileSearchBtn.addEventListener('click', () => {
      // Sync mobile filters with desktop filters when opening the overlay
      syncTimeframeFilters(false);
      syncActivityFilters(false);
      updateMobileLocationDisplay(); // Initialize location display
      updateActiveFeedNameInMobileFilter(); // Update active feed name display
      
      mobileFilterOverlay.style.display = 'flex';
      void mobileFilterOverlay.offsetWidth; // Force reflow
      mobileFilterOverlay.classList.add('active');
      // If accordion was open, it will be naturally reset by filter overlay re-appearing without 'active' on row
    });

    closeMobileFilterBtn.addEventListener('click', () => {
      if (mobileFilterFeedInfoContainerEl) { // Hide active feed name container on close
        mobileFilterFeedInfoContainerEl.style.display = 'none';
        const feedNameTextEl = document.getElementById('mobile-filter-active-feed-name-text');
        if (feedNameTextEl) {
          feedNameTextEl.textContent = '';
        }
      }
      mobileFilterOverlay.classList.remove('active');
      // Also ensure accordion is closed if it was open
      if (mobileFilterLocationRow && mobileFilterLocationRow.getAttribute('aria-expanded') === 'true') {
        mobileFilterLocationRow.setAttribute('aria-expanded', 'false');
        // CSS will handle the panel's max-height based on aria-expanded
      }

      mobileFilterOverlay.addEventListener('transitionend', function handleTransitionEnd() {
        if (!mobileFilterOverlay.classList.contains('active')) { // Ensure it's still meant to be hidden
          mobileFilterOverlay.style.display = 'none';
        }
        mobileFilterOverlay.removeEventListener('transitionend', handleTransitionEnd);
      }, { once: true });
    });

    // Logic for location accordion
    if (mobileFilterLocationRow && locationAccordionPanel && mobileLocationValueDisplay) { // mobileUseCurrentLocationBtn removed from condition
      mobileFilterLocationRow.addEventListener('click', (event) => { // Add event parameter
        // If the click target is inside the accordion panel (e.g., the search input),
        // do not toggle the accordion state.
        if (locationAccordionPanel.contains(event.target)) {
          return; 
        }
        // Otherwise, toggle the accordion
        const isExpanded = mobileFilterLocationRow.getAttribute('aria-expanded') === 'true';
        mobileFilterLocationRow.setAttribute('aria-expanded', !isExpanded);
        
        // If opening this accordion, close other open accordions
        if (!isExpanded) {
          // Close timeframe accordion if open
          if (mobileFilterTimeframeRow && mobileFilterTimeframeRow.getAttribute('aria-expanded') === 'true') {
            mobileFilterTimeframeRow.setAttribute('aria-expanded', 'false');
            timeframeAccordionPanel.style.display = 'none';
          }
          // Close activity accordion if open
          if (mobileFilterActivityRow && mobileFilterActivityRow.getAttribute('aria-expanded') === 'true') {
            mobileFilterActivityRow.setAttribute('aria-expanded', 'false');
            activityAccordionPanel.style.display = 'none';
          }
        }
        // The CSS will take care of showing/hiding locationAccordionPanel via max-height
        // and rotating the chevron based on the aria-expanded attribute.
      });

      // Event listener for mobileUseCurrentLocationBtn has been removed.

      // Add event listeners for location radio buttons
      if (mobileLocationOptions.length > 0) {
        mobileLocationOptions.forEach(radio => {
          radio.addEventListener('change', () => {
            updateMobileLocationDisplay();
            // Potentially sync with desktop: searchInputWhereGlobal.value = radio.value;
            // updateSaveFeedButtonVisibility(); 
          });
        });
      }
    }
    
    // Logic for timeframe accordion
    if (mobileFilterTimeframeRow && timeframeAccordionPanel && mobileTimeframeValueDisplay) {
      // Click event for toggling the accordion
      mobileFilterTimeframeRow.addEventListener('click', (event) => {
        // If the click target is inside the accordion panel, don't toggle
        if (timeframeAccordionPanel.contains(event.target)) {
          return;
        }
        
        // Toggle the accordion
        const isExpanded = mobileFilterTimeframeRow.getAttribute('aria-expanded') === 'true';
        mobileFilterTimeframeRow.setAttribute('aria-expanded', !isExpanded);
        timeframeAccordionPanel.style.display = isExpanded ? 'none' : 'block';
        
        // If opening this accordion, close other open accordions
        if (!isExpanded) {
          // Close location accordion if open
          if (mobileFilterLocationRow && mobileFilterLocationRow.getAttribute('aria-expanded') === 'true') {
            mobileFilterLocationRow.setAttribute('aria-expanded', 'false');
            locationAccordionPanel.style.display = 'none';
          }
          // Close activity accordion if open
          if (mobileFilterActivityRow && mobileFilterActivityRow.getAttribute('aria-expanded') === 'true') {
            mobileFilterActivityRow.setAttribute('aria-expanded', 'false');
            activityAccordionPanel.style.display = 'none';
          }
        }
      });
      
      // Change event for checkboxes within the timeframe accordion
      timeframeAccordionPanel.addEventListener('change', (event) => {
        if (event.target.matches('input.date-option-checkbox.mobile')) {
          updateMobileTimeframeDisplay();
        }
      });
    }
    
    // Logic for activity accordion
    if (mobileFilterActivityRow && activityAccordionPanel && mobileActivityValueDisplay) {
      // Click event for toggling the accordion
      mobileFilterActivityRow.addEventListener('click', (event) => {
        // If the click target is inside the accordion panel, don't toggle
        if (activityAccordionPanel.contains(event.target)) {
          return;
        }
        
        // Toggle the accordion
        const isExpanded = mobileFilterActivityRow.getAttribute('aria-expanded') === 'true';
        mobileFilterActivityRow.setAttribute('aria-expanded', !isExpanded);
        activityAccordionPanel.style.display = isExpanded ? 'none' : 'block';
        
        // If opening this accordion, close other open accordions
        if (!isExpanded) {
          // Close location accordion if open
          if (mobileFilterLocationRow && mobileFilterLocationRow.getAttribute('aria-expanded') === 'true') {
            mobileFilterLocationRow.setAttribute('aria-expanded', 'false');
            locationAccordionPanel.style.display = 'none';
          }
          // Close timeframe accordion if open
          if (mobileFilterTimeframeRow && mobileFilterTimeframeRow.getAttribute('aria-expanded') === 'true') {
            mobileFilterTimeframeRow.setAttribute('aria-expanded', 'false');
            timeframeAccordionPanel.style.display = 'none';
          }
        }
      });
      
      // Change event for checkboxes within the activity accordion
      activityAccordionPanel.addEventListener('change', (event) => {
        if (event.target.matches('input.activity-option-checkbox.mobile')) {
          updateMobileActivityDisplay();
        }
      });
    }
    
    // Apply button handler - sync with desktop filters and close overlay
    if (mobileFilterApplyBtn) {
      mobileFilterApplyBtn.addEventListener('click', () => {
        // Sync mobile selections to desktop filters
        syncTimeframeFilters(true);
        syncActivityFilters(true);

        // Update the search button display
        updateMobileSearchButtonDisplay();
        
        // Close the mobile filter overlay
        mobileFilterOverlay.classList.remove('active');
        mobileFilterOverlay.addEventListener('transitionend', function handleTransitionEnd() {
          if (!mobileFilterOverlay.classList.contains('active')) {
            mobileFilterOverlay.style.display = 'none';
          }
          mobileFilterOverlay.removeEventListener('transitionend', handleTransitionEnd);
        }, { once: true });
      });
    }
  }

  // Slider icon (appears in "My Feeds" on mobile)
  const mobileFilterIconContainer = document.getElementById('mobile-filter-icon-container');

  if (mobileSearchBtn && mobileFilterOverlay && closeMobileFilterBtn) {
    mobileSearchBtn.addEventListener('click', () => {
      // Sync mobile filters with desktop filters when opening the overlay
      syncTimeframeFilters(false);
      syncActivityFilters(false);
      updateMobileLocationDisplay(); // Initialize location display
      
      mobileFilterOverlay.style.display = 'flex';
      void mobileFilterOverlay.offsetWidth; // Force reflow
      mobileFilterOverlay.classList.add('active');
      // If accordion was open, it will be naturally reset by filter overlay re-appearing without 'active' on row
    });

    // Allow the slider icon to open the same mobile filter overlay (used on My Feeds tab)
    if (mobileFilterIconContainer) {
      mobileFilterIconContainer.addEventListener('click', () => {
        // Sync filters before showing overlay
        syncTimeframeFilters(false);
        syncActivityFilters(false);
        updateMobileLocationDisplay();
        updateActiveFeedNameInMobileFilter(); // Update active feed name display

        mobileFilterOverlay.style.display = 'flex';
        void mobileFilterOverlay.offsetWidth; // Force reflow for animation
        mobileFilterOverlay.classList.add('active');
      });
    }
  }

  // --- End of Mobile Filter Overlay Logic ---

  /*
  // --- Phase 4: Filter State Logic (Visual Cues & Clear) ---
  // This section was previously commented out as it's not directly related
  // to the mobile overlay filtering or location search accordion.
  // It's being re-commented to fix lint errors from a previous faulty edit.

  // ... (rest of the code remains the same)

  function updateFilterVisuals(selectElement) {
    if (!selectElement) return;
    const wrapper = selectElement.closest('.custom-select-wrapper');
    if (!wrapper) return;

    const isDefaultSelected = selectElement.selectedIndex === 0 || selectElement.value === ""; 
    
    if (isDefaultSelected) {
      wrapper.classList.remove('filter-selected');
    } else {
      wrapper.classList.add('filter-selected');
    }
  }

  // Assuming filterSelects and clearFiltersBtn would be defined if this block were active
  // const filterSelects = document.querySelectorAll('.filter-bar select');
  // const clearFiltersBtn = document.getElementById('clear-filters-btn');

  // filterSelects.forEach(select => {
  //   updateFilterVisuals(select);
  // });

  // if (clearFiltersBtn) {
  //   clearFiltersBtn.addEventListener('click', () => {
  //     filterSelects.forEach(select => {
  //       select.selectedIndex = 0; 
  //       updateFilterVisuals(select); 
  //     });
  //   });
  // }
  */

  // --- Phase 5: Share Modal Refinements JS ---
  const copyLinkBtn = document.getElementById('copyLinkBtn');
  const shareFeedLinkInput = document.getElementById('shareFeedLink');
  const togglePersonalMessageBtn = document.getElementById('togglePersonalMessage');
  const personalMessageContent = document.getElementById('personalMessageContent');
  const personalMessageChevron = document.getElementById('personalMessageChevron');
  const copyMessageBtn = document.getElementById('copyMessageBtn');
  const personalMessageTextarea = document.getElementById('personalMessageTextarea');
  const sendInvitesBtn = document.getElementById('sendInvitesBtn');

  async function copyToClipboard(text, buttonElement, originalIconSrc) {
    if (!navigator.clipboard) {
      // Fallback for older browsers (less common now)
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed"; // Make it invisible
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        if (buttonElement) showCopyFeedback(buttonElement, originalIconSrc, true);
      } catch (err) {
        console.error('Fallback copy failed:', err);
        if (buttonElement) showCopyFeedback(buttonElement, originalIconSrc, false);
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      if (buttonElement) showCopyFeedback(buttonElement, originalIconSrc, true);
    } catch (err) {
      console.error('Failed to copy: ', err);
      if (buttonElement) showCopyFeedback(buttonElement, originalIconSrc, false);
    }
  }

  function showCopyFeedback(buttonElement, originalIconSrc, success) {
    const originalAriaLabel = buttonElement.getAttribute('aria-label');
    // const icon = buttonElement.querySelector('img.icon-svg'); // Keep if you want to change alt text as well
    // const originalAlt = icon ? icon.alt : '';

    if (success) {
      buttonElement.setAttribute('aria-label', 'Copied!');
      // if (icon) icon.alt = 'Copied!'; // Optionally still change alt text of the icon
      
      // Visual cue for sighted users: A subtle animation or border change
      buttonElement.style.outline = '2px solid var(--color-accent-primary)'; // Example focus ring
    } else {
      buttonElement.setAttribute('aria-label', 'Copy failed');
      // if (icon) icon.alt = 'Copy failed';
      buttonElement.style.outline = '2px solid red'; // Example error indication
    }

    setTimeout(() => {
      buttonElement.setAttribute('aria-label', originalAriaLabel);
      // if (icon && originalAlt) icon.alt = originalAlt;
      buttonElement.style.outline = 'none'; // Clear outline
    }, 2000); // Reset after 2 seconds
  }

  if (copyLinkBtn && shareFeedLinkInput) {
    const originalIconSrc = copyLinkBtn.querySelector('img.icon-svg')?.src;
    copyLinkBtn.addEventListener('click', () => {
      // For now, we'll set a dummy link. This will be dynamic later.
      if(!shareFeedLinkInput.value) {
          shareFeedLinkInput.value = `https://example.com/feed/generated_link_${Date.now()}`;
      }
      copyToClipboard(shareFeedLinkInput.value, copyLinkBtn, originalIconSrc);
    });
  }

  if (togglePersonalMessageBtn && personalMessageContent && personalMessageChevron) {
    togglePersonalMessageBtn.addEventListener('click', () => {
      const isExpanded = personalMessageContent.style.display === 'block';
      personalMessageContent.style.display = isExpanded ? 'none' : 'block';
      togglePersonalMessageBtn.setAttribute('aria-expanded', !isExpanded);
      // Chevron rotation is handled by CSS based on aria-expanded state
    });
  }

  if (copyMessageBtn && personalMessageTextarea) {
    const originalIconSrc = copyMessageBtn.querySelector('img.icon-svg')?.src;
    copyMessageBtn.addEventListener('click', () => {
        // Placeholder for dynamic message content later
        if(!personalMessageTextarea.value) {
            personalMessageTextarea.value = `Hey! Check out this feed on Domino: https://example.com/feed/some_id`;
        }
        copyToClipboard(personalMessageTextarea.value, copyMessageBtn, originalIconSrc);
    });
  }
  
  if (sendInvitesBtn) {
    sendInvitesBtn.addEventListener('click', () => {
      console.log('Send Invites button clicked. Placeholder for actual invite logic.');
      // Potentially close modal or show success message
    });
  }

});
