document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  const filterInput = document.createElement("input");
  filterInput.type = "text";
  filterInput.placeholder = "Search activities...";
  filterInput.id = "activity-search";
  filterInput.style.marginBottom = "10px";

  const sortSelect = document.createElement("select");
  sortSelect.id = "activity-sort";
  sortSelect.innerHTML = `
    <option value="name">Sort by Name</option>
    <option value="time">Sort by Time</option>
  `;
  sortSelect.style.marginLeft = "10px";

  const categorySelect = document.createElement("select");
  categorySelect.id = "activity-category";
  categorySelect.innerHTML = `<option value="">All Categories</option>`;
  categorySelect.style.marginLeft = "10px";

  // Insert filter bar above activities list
  const activitiesContainer = document.getElementById("activities-container");
  const filterBar = document.createElement("div");
  filterBar.style.marginBottom = "10px";
  filterBar.appendChild(filterInput);
  filterBar.appendChild(sortSelect);
  filterBar.appendChild(categorySelect);
  activitiesContainer.insertBefore(filterBar, activitiesContainer.children[1]);

  let allActivities = {};

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();
      allActivities = activities;
      renderActivities();
      populateCategoryOptions();
      populateActivitySelect();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  function populateCategoryOptions() {
    // Collect unique categories
    const categories = new Set();
    Object.values(allActivities).forEach((details) => {
      if (details.category) categories.add(details.category);
    });
    categorySelect.innerHTML = `<option value="">All Categories</option>`;
    categories.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      categorySelect.appendChild(opt);
    });
  }

  function populateActivitySelect() {
    // Clear existing options
    activitySelect.innerHTML = "";

    // Add default "Select an activity" option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select an activity";
    activitySelect.appendChild(defaultOption);

    // Add options for each activity
    Object.entries(allActivities).forEach(([name, details]) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
  }

  function renderActivities() {
    // Get filter values
    const search = filterInput.value.toLowerCase();
    const sortBy = sortSelect.value;
    const category = categorySelect.value;
    let filtered = Object.entries(allActivities);
    if (category) {
      filtered = filtered.filter(([_, d]) => d.category === category);
    }
    if (search) {
      filtered = filtered.filter(
        ([name, d]) =>
          name.toLowerCase().includes(search) ||
          (d.description && d.description.toLowerCase().includes(search))
      );
    }
    if (sortBy === "name") {
      filtered.sort((a, b) => a[0].localeCompare(b[0]));
    } else if (sortBy === "time") {
      filtered.sort((a, b) => {
        if (a[1].time && b[1].time) {
          return new Date(a[1].time) - new Date(b[1].time);
        }
        return 0;
      });
    }
    activitiesList.innerHTML = "";
    filtered.forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft =
        details.max_participants - details.participants.length;

      // Create participants HTML with delete icons instead of bullet points
      const participantsHTML =
        details.participants.length > 0
          ? `<div class="participants-section">
            <h5>Participants:</h5>
            <ul class="participants-list">
              ${details.participants
                .map(
                  (email) =>
                    `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                )
                .join("")}
            </ul>
          </div>`
          : `<p><em>No participants yet</em></p>`;

      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <div class="participants-container">
          ${participantsHTML}
        </div>
      `;

      activitiesList.appendChild(activityCard);
    });

    // Add event listeners to delete buttons
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  filterInput.addEventListener("input", renderActivities);
  sortSelect.addEventListener("change", renderActivities);
  categorySelect.addEventListener("change", renderActivities);

  // Initialize app
  fetchActivities();
});
