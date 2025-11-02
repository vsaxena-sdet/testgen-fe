// Import configuration
import config from './config.js';

// Get API endpoints from config
const API = config.api.endpoints;

// Utility functions
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// Global state
let lastDocId = null;
let isGenerating = false;

// Global state for LLM models
let llmModels = {};
let selectedModel = null;

// DOM Elements
const elements = {
  // Source switching
  sourceBtns: $$('.source-btn'),
  textSource: $('#textSource'),
  fileSource: $('#fileSource'),
  
  // Form elements
  projectName: $('#projectName'),
  requirementsText: $('#requirementsText'),
  fileInput: $('#file'),
  formFactor: $('#formFactor'),
  testLevelCheckboxes: $$('input[name="testLevel"]'),
  selectAllCheckbox: $('#selectAll'),
  
  // LLM Model selection
  llmModel: $('#llmModel'),
  
  // Advanced options
  advancedToggle: $('#advancedToggle'),
  advancedOptions: $('#advancedOptions'),
  toggleIcon: $('.toggle-icon'),
  count: $('#count'),
  topk: $('#topk'),
  docId: $('#docId'),
  
  // Actions
  form: $('#testGenForm'),
  generateBtn: $('#btnGenerate'),
  exportBtn: $('#btnExport'),
  exportMenu: $('#exportMenu'),
  exportJson: $('#exportJson'),
  exportExcel: $('#exportExcel'),
  latestBtn: $('#btnLatest'),
  
  // Status and results
  uploadStatus: $('#uploadStatus'),
  genStatus: $('#genStatus'),
  resultsSection: $('#resultsSection'),
  latest: $('#latest'),
  
  // Statistics
  statsSection: $('#statsSection'),
  totalCases: $('#totalCases'),
  highPriority: $('#highPriority'),
  mediumPriority: $('#mediumPriority'),
  lowPriority: $('#lowPriority')
};

// Initialize the application
function init() {
  setupSourceSwitching();
  setupCheckboxHandling();
  setupAdvancedOptions();
  setupFileUpload();
  setupFormSubmission();
  setupEventListeners();
  setupFileDropZone();
  setupExportDropdown();
  loadLLMModels();
  setupLLMModelHandling();
}

// Requirements source switching
function setupSourceSwitching() {
  elements.sourceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const source = btn.dataset.source;
      
      // Update button states
      elements.sourceBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Show/hide content areas
      if (source === 'text') {
        elements.textSource.classList.remove('hidden');
        elements.fileSource.classList.add('hidden');
      } else {
        elements.textSource.classList.add('hidden');
        elements.fileSource.classList.remove('hidden');
      }
    });
  });
}

// Checkbox handling for test levels
function setupCheckboxHandling() {
  // Select All functionality
  elements.selectAllCheckbox.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    elements.testLevelCheckboxes.forEach(checkbox => {
      checkbox.checked = isChecked;
    });
  });
  
  // Individual checkbox handling
  elements.testLevelCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const allChecked = Array.from(elements.testLevelCheckboxes).every(cb => cb.checked);
      const noneChecked = Array.from(elements.testLevelCheckboxes).every(cb => !cb.checked);
      
      elements.selectAllCheckbox.checked = allChecked;
      elements.selectAllCheckbox.indeterminate = !allChecked && !noneChecked;
    });
  });
}

// Advanced options toggle
function setupAdvancedOptions() {
  elements.advancedToggle.addEventListener('click', () => {
    const isHidden = elements.advancedOptions.classList.contains('hidden');
    
    if (isHidden) {
      elements.advancedOptions.classList.remove('hidden');
      elements.toggleIcon.classList.add('rotated');
    } else {
      elements.advancedOptions.classList.add('hidden');
      elements.toggleIcon.classList.remove('rotated');
    }
  });
}

// File upload handling
function setupFileUpload() {
  elements.fileInput.addEventListener('change', handleFileUpload);
}

function setupFileDropZone() {
  const fileUploadArea = $('.file-upload-area');
  
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    fileUploadArea.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });
  
  ['dragenter', 'dragover'].forEach(eventName => {
    fileUploadArea.addEventListener(eventName, highlight, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    fileUploadArea.addEventListener(eventName, unhighlight, false);
  });
  
  fileUploadArea.addEventListener('drop', handleDrop, false);
  
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  function highlight(e) {
    fileUploadArea.classList.add('drag-over');
  }
  
  function unhighlight(e) {
    fileUploadArea.classList.remove('drag-over');
  }
  
  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    elements.fileInput.files = files;
    handleFileUpload({ target: { files } });
  }
}

// Handle file upload
async function handleFileUpload(event) {
  const files = event.target.files;
  if (!files || files.length === 0) {
    showUploadStatus('Please select a file.', 'error');
    return;
  }
  
  const file = files[0];
  
  // Validate file type
  const allowedTypes = ['.txt', '.md', '.doc', '.docx', '.pdf'];
  const fileName = file.name.toLowerCase();
  const isValidType = allowedTypes.some(type => fileName.endsWith(type.replace('.', '')));
  
  if (!isValidType) {
    showUploadStatus('Please upload a valid file type (.txt, .md, .doc, .docx, .pdf)', 'error');
    return;
  }
  
  // Validate file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    showUploadStatus('File size must be less than 10MB', 'error');
    return;
  }
  
  try {
    showUploadStatus('Uploading file...', 'loading');
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(API.upload, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (response.ok) {
      lastDocId = result.doc_id;
      elements.docId.value = lastDocId;
      showUploadStatus(`File uploaded successfully! Uploading to Open AI Vector Store in background...`, 'success');
      
      // Update file display
      updateFileDisplay(file.name);
      
    } else {
      showUploadStatus(`Upload failed: ${result.detail || response.statusText}`, 'error');
    }
  } catch (error) {
    showUploadStatus(`Upload failed: ${error.message}`, 'error');
  }
}

// Update file display
function updateFileDisplay(fileName) {
  const placeholder = $('.file-upload-placeholder');
  placeholder.innerHTML = `
    <div class="upload-icon">✅</div>
    <div class="upload-text">
      <span class="upload-primary">${fileName}</span>
      <span class="upload-secondary">File uploaded successfully</span>
    </div>
  `;
}

// Show upload status
function showUploadStatus(message, type) {
  elements.uploadStatus.textContent = message;
  elements.uploadStatus.className = `upload-status ${type}`;
}

// Show generation status
function showGenerationStatus(message, type) {
  elements.genStatus.textContent = message;
  elements.genStatus.className = `generation-status ${type}`;
}

// Form submission handling
function setupFormSubmission() {
  elements.form.addEventListener('submit', handleFormSubmit);
}

// Handle form submission
async function handleFormSubmit(event) {
  event.preventDefault();
  
  if (isGenerating) return;
  
  // Validate form
  if (!validateForm()) return;
  
  isGenerating = true;
  updateGenerateButton(true);
  
  try {
    // Prepare request data
    const requestData = buildRequestData();
    
    showGenerationStatus('🤖 Generating test cases... This may take a moment.', 'loading');
    
    const response = await fetch(API.generate, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      showGenerationStatus(`✅ Successfully generated ${result.count} test cases!`, 'success');
      displayResults(result);
    } else {
      showGenerationStatus(`❌ Generation failed: ${result.detail || response.statusText}`, 'error');
    }
  } catch (error) {
    showGenerationStatus(`❌ Generation failed: ${error.message}`, 'error');
  } finally {
    isGenerating = false;
    updateGenerateButton(false);
  }
}

// Validate form data
function validateForm() {
  // Check if LLM model is selected
  if (!selectedModel || !elements.llmModel.value) {
    showGenerationStatus('❌ Please select an AI model.', 'error');
    elements.llmModel.focus();
    return false;
  }
  
  // Check if we have requirements (either text or file)
  const hasText = elements.requirementsText.value.trim();
  const hasFile = lastDocId || elements.fileInput.files.length > 0;
  const isTextSource = !elements.textSource.classList.contains('hidden');
  
  if (isTextSource && !hasText) {
    showGenerationStatus('❌ Please enter your requirements text.', 'error');
    elements.requirementsText.focus();
    return false;
  }
  
  if (!isTextSource && !hasFile) {
    showGenerationStatus('❌ Please upload a requirements file.', 'error');
    return false;
  }
  
  // Check if at least one test level is selected
  const selectedLevels = Array.from(elements.testLevelCheckboxes).filter(cb => cb.checked);
  if (selectedLevels.length === 0) {
    showGenerationStatus('❌ Please select at least one test level.', 'error');
    return false;
  }
  
  return true;
}

// Build request data
function buildRequestData() {
  const isTextSource = !elements.textSource.classList.contains('hidden');
  const selectedTestLevels = Array.from(elements.testLevelCheckboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);
  
  const requestData = {
    project_name: elements.projectName.value.trim(),
    requirements_text: isTextSource ? elements.requirementsText.value.trim() : null,
    doc_id: !isTextSource ? (elements.docId.value || lastDocId) : null,
    form_factor: elements.formFactor.value,
    test_levels: selectedTestLevels,
    count: parseInt(elements.count.value) || 40,
    top_k: parseInt(elements.topk.value) || 12,
    modes: [elements.formFactor.value],
    
    // LLM Model selection
    llm_model: selectedModel.id,
    llm_provider: selectedModel.provider
  };
  
  return requestData;
}

// Update generate button state
function updateGenerateButton(loading) {
  if (loading) {
    elements.generateBtn.disabled = true;
    elements.generateBtn.innerHTML = `
      <span class="btn-icon loading">⏳</span>
      Generating...
    `;
  } else {
    elements.generateBtn.disabled = false;
    elements.generateBtn.innerHTML = `
      <span class="btn-icon">⚡</span>
      Generate Test Cases
    `;
  }
}

// Display results
function displayResults(result) {
  elements.resultsSection.classList.remove('hidden');
  elements.latest.textContent = JSON.stringify(result, null, 2);
  
  // Update statistics
  updateStatistics();
  
  // Scroll to results
  elements.resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Setup additional event listeners
function setupEventListeners() {
  // Refresh/Latest functionality
  if (elements.latestBtn) {
    elements.latestBtn.addEventListener('click', fetchLatestResults);
  }
}


// Fetch latest results
async function fetchLatestResults() {
  try {
    const response = await fetch(API.testcases);
    const result = await response.json();
    
    if (response.ok) {
      elements.latest.textContent = JSON.stringify(result, null, 2);
      elements.resultsSection.classList.remove('hidden');
      updateStatistics();
    } else {
      alert('Failed to fetch latest results: ' + (result.detail || response.statusText));
    }
  } catch (error) {
    alert('Error fetching results: ' + error.message);
  }
}

// Setup export dropdown
function setupExportDropdown() {
  if (elements.exportBtn && elements.exportMenu) {
    // Toggle dropdown on button click
    elements.exportBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const dropdown = elements.exportBtn.parentElement;
      const isOpen = dropdown.classList.contains('open');
      
      // Close any other open dropdowns
      document.querySelectorAll('.export-dropdown.open').forEach(d => {
        d.classList.remove('open');
        d.querySelector('.export-menu').classList.add('hidden');
      });
      
      // Toggle this dropdown
      if (!isOpen) {
        dropdown.classList.add('open');
        elements.exportMenu.classList.remove('hidden');
      }
    });
    
    // Export as JSON
    if (elements.exportJson) {
      elements.exportJson.addEventListener('click', exportAsJson);
    }
    
    // Export as Excel
    if (elements.exportExcel) {
      elements.exportExcel.addEventListener('click', exportAsExcel);
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const dropdown = elements.exportBtn?.parentElement;
      if (dropdown && !dropdown.contains(e.target)) {
        dropdown.classList.remove('open');
        elements.exportMenu?.classList.add('hidden');
      }
    });
  }
}

// Export as JSON (original functionality)
function exportAsJson() {
  const results = elements.latest.textContent;
  if (!results) {
    alert('No results to export. Please generate test cases first.');
    return;
  }
  
  try {
    const data = JSON.parse(results);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-cases-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Close dropdown
    elements.exportBtn.parentElement.classList.remove('open');
    elements.exportMenu.classList.add('hidden');
  } catch (error) {
    alert('Error exporting results: ' + error.message);
  }
}

// Export as Excel
async function exportAsExcel() {
  try {
    showGenerationStatus('📊 Generating Excel file...', 'loading');
    
    const response = await fetch(API.exportExcel);
    
    if (response.ok) {
      // Get the filename from the response header or generate one
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'test-cases.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      // Download the file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showGenerationStatus('✅ Excel file downloaded successfully!', 'success');
    } else {
      const result = await response.json();
      showGenerationStatus(`❌ Export failed: ${result.detail || response.statusText}`, 'error');
    }
  } catch (error) {
    showGenerationStatus(`❌ Export failed: ${error.message}`, 'error');
  } finally {
    // Close dropdown
    elements.exportBtn.parentElement.classList.remove('open');
    elements.exportMenu.classList.add('hidden');
  }
}

// Update statistics
async function updateStatistics() {
  try {
    const response = await fetch(API.statistics);
    if (response.ok) {
      const stats = await response.json();
      
      // Update the cards
      if (elements.totalCases) elements.totalCases.textContent = stats.total_cases;
      if (elements.highPriority) elements.highPriority.textContent = stats.high_priority;
      if (elements.mediumPriority) elements.mediumPriority.textContent = stats.medium_priority;
      if (elements.lowPriority) elements.lowPriority.textContent = stats.low_priority;
      
      // Show statistics section
      if (elements.statsSection && stats.total_cases > 0) {
        elements.statsSection.classList.remove('hidden');
      }
    }
  } catch (error) {
    console.error('Failed to update statistics:', error);
  }
}

// LLM Model Management
async function loadLLMModels() {
  try {
    const response = await fetch(API.llmModels);
    if (response.ok) {
      llmModels = await response.json();
      populateLLMDropdown();
    } else {
      console.error('Failed to load LLM models');
      populateDefaultLLMDropdown();
    }
  } catch (error) {
    console.error('Error loading LLM models:', error);
    populateDefaultLLMDropdown();
  }
}

function populateLLMDropdown() {
  const dropdown = elements.llmModel;
  dropdown.innerHTML = '<option value="">Select an AI model...</option>';
  
  // Create optgroups for each provider
  Object.entries(llmModels).forEach(([providerKey, provider]) => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = provider.name;
    
    provider.models.forEach(model => {
      const option = document.createElement('option');
      option.value = model.id;
      option.textContent = model.name;
      option.setAttribute('data-provider', providerKey);
      option.setAttribute('data-description', model.description);
      optgroup.appendChild(option);
    });
    
    dropdown.appendChild(optgroup);
  });
}

function populateDefaultLLMDropdown() {
  const dropdown = elements.llmModel;
  dropdown.innerHTML = `
    <option value="">Select an AI model...</option>
    <optgroup label="OpenAI">
      <option value="gpt-4o" data-provider="openai">GPT-4o (Latest)</option>
      <option value="gpt-4" data-provider="openai">GPT-4</option>
      <option value="gpt-3.5-turbo" data-provider="openai">GPT-3.5 Turbo</option>
    </optgroup>
    <optgroup label="LLAMA3">
      <option value="llama3" data-provider="llama3">LLAMA3 8B</option>
    </optgroup>
  `;
}

function setupLLMModelHandling() {
  if (elements.llmModel) {
    elements.llmModel.addEventListener('change', handleLLMModelChange);
  }
}

function handleLLMModelChange() {
  const selectedOption = elements.llmModel.selectedOptions[0];
  if (!selectedOption || !selectedOption.value) {
    return;
  }
  
  const modelId = selectedOption.value;
  const provider = selectedOption.getAttribute('data-provider');
  const description = selectedOption.getAttribute('data-description');
  
  selectedModel = {
    id: modelId,
    provider: provider,
    description: description
  };
  
  // Show model info if available
  showModelInfo(description);
}

function showModelInfo(description) {
  // Remove existing model info
  const existingInfo = $('.model-info');
  if (existingInfo) {
    existingInfo.remove();
  }
  
  if (description) {
    const infoDiv = document.createElement('div');
    infoDiv.className = 'model-info';
    infoDiv.textContent = `ℹ️ ${description}`;
    elements.llmModel.parentNode.appendChild(infoDiv);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
