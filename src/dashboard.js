// Import configuration
import config from './config.js';

// Get API endpoints from config
const API = config.api.endpoints;

// Generate session ID (once per page load)
const sessionId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// DOM Elements
const elements = {
  totalGenerated: document.getElementById('totalGenerated'),
  totalProjects: document.getElementById('totalProjects'),
  totalGenerations: document.getElementById('totalGenerations'),
  avgPerGeneration: document.getElementById('avgPerGeneration'),
  recentActivity: document.getElementById('recentActivity')
};

// Initialize dashboard
async function init() {
  await loadStatistics();
  await loadRecentActivity();
}

// Load usage statistics
async function loadStatistics() {
  try {
    const response = await fetch(API.statistics, {
      headers: {
        'X-Session-ID': sessionId
      }
    });
    if (response.ok) {
      const stats = await response.json();
      
      // Update stat cards
      if (elements.totalGenerated) {
        elements.totalGenerated.textContent = stats.total_cases || 0;
      }
      if (elements.totalProjects) {
        elements.totalProjects.textContent = stats.total_projects || 0;
      }
      if (elements.totalGenerations) {
        elements.totalGenerations.textContent = stats.total_generations || 0;
      }
      if (elements.avgPerGeneration) {
        const avg = stats.total_generations > 0 
          ? Math.round(stats.total_cases / stats.total_generations)
          : 0;
        elements.avgPerGeneration.textContent = avg;
      }
    }
  } catch (error) {
    console.error('Failed to load statistics:', error);
  }
}

// Load recent activity
async function loadRecentActivity() {
  try {
    const response = await fetch(API.testcases, {
      headers: {
        'X-Session-ID': sessionId
      }
    });
    if (response.ok) {
      const data = await response.json();
      
      if (data && data.test_cases && data.test_cases.length > 0) {
        displayRecentActivity(data.test_cases.slice(0, 5)); // Show last 5
      }
    }
  } catch (error) {
    console.error('Failed to load recent activity:', error);
  }
}

// Display recent activity
function displayRecentActivity(activities) {
  if (!activities || activities.length === 0) {
    elements.recentActivity.innerHTML = '<p class="no-data">No recent activity</p>';
    return;
  }

  const activityHtml = activities.map(activity => `
    <div class="activity-item">
      <div class="activity-icon">✓</div>
      <div class="activity-content">
        <div class="activity-title">${activity.test_case_name || 'Test Case'}</div>
        <div class="activity-meta">
          <span class="activity-priority priority-${(activity.priority || 'medium').toLowerCase()}">${activity.priority || 'Medium'}</span>
          <span class="activity-type">${activity.test_level || 'General'}</span>
        </div>
      </div>
    </div>
  `).join('');

  elements.recentActivity.innerHTML = activityHtml;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
