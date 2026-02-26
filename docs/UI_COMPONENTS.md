# UI Components Documentation

Reusable, maintainable frontend components for Debugg Dashboard.

---

## 📦 Available Components

### **1. Button**
```javascript
import { createButton } from './components.js';

// Basic button
const btn = createButton({
  text: 'Click Me',
  onClick: () => console.log('Clicked!')
});

// With variant
const dangerBtn = createButton({
  text: 'Delete',
  variant: 'danger',
  icon: '🗑️',
  onClick: handleDelete
});

// Disabled button
const disabledBtn = createButton({
  text: 'Loading...',
  disabled: true
});
```

**Variants:** `primary`, `secondary`, `danger`, `success`

---

### **2. Badge**
```javascript
import { createBadge } from './components.js';

const badge = createBadge('Critical', 'critical');
const successBadge = createBadge('Success', 'success');
```

**Variants:** `default`, `critical`, `high`, `medium`, `low`, `info`, `success`, `warning`

---

### **3. Card**
```javascript
import { createCard } from './components.js';

const card = createCard({
  title: 'Error Details',
  content: '<p>Error message here</p>',
  footer: createButton({ text: 'Close' })
});
```

---

### **4. Stat Card**
```javascript
import { createStatCard } from './components.js';

const statCard = createStatCard({
  title: 'Total Errors',
  value: 1234,
  trend: 15 // Shows ↑ 15%
});
```

---

### **5. Table**
```javascript
import { createTable } from './components.js';

const table = createTable({
  columns: [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'severity', header: 'Severity' },
    { 
      key: 'status', 
      header: 'Status',
      render: (value) => `<span class="badge badge-${value}">${value}</span>`
    }
  ],
  data: [
    { name: 'Error 1', severity: 'critical', status: 'open' },
    { name: 'Error 2', severity: 'high', status: 'resolved' }
  ],
  onRowClick: (row) => console.log('Clicked:', row),
  onSort: (key) => console.log('Sort by:', key)
});
```

---

### **6. Modal**
```javascript
import { createModal } from './components.js';

const modal = createModal({
  title: 'Error Details',
  content: '<pre>Error stack trace...</pre>',
  footer: [
    { text: 'Resolve', variant: 'success' },
    { text: 'Close', variant: 'secondary' }
  ],
  onClose: () => modal.remove()
});

// Show modal
document.body.appendChild(modal);
setTimeout(() => modal.classList.add('active'), 10);
```

---

### **7. Alert**
```javascript
import { createAlert } from './components.js';

const successAlert = createAlert({
  message: 'Error resolved successfully!',
  type: 'success',
  dismissible: true
});

const errorAlert = createAlert({
  message: 'Failed to save changes',
  type: 'error'
});
```

**Types:** `info`, `success`, `warning`, `error`

---

### **8. Search Input**
```javascript
import { createSearchInput } from './components.js';

const searchInput = createSearchInput({
  placeholder: 'Search errors...',
  debounceMs: 300,
  onSearch: (query) => {
    console.log('Searching for:', query);
  }
});
```

---

### **9. Filter Dropdown**
```javascript
import { createFilterDropdown } from './components.js';

const filter = createFilterDropdown({
  options: [
    { label: 'All Severities', value: '', selected: true },
    { label: 'Critical', value: 'critical' },
    { label: 'High', value: 'high' }
  ],
  onChange: (value) => console.log('Filter:', value)
});
```

---

### **10. Pagination**
```javascript
import { createPagination } from './components.js';

const pagination = createPagination({
  currentPage: 1,
  totalPages: 10,
  onChange: (page) => {
    console.log('Go to page:', page);
  }
});
```

---

## 🎨 CSS Classes

### **Button Styles**
```css
.btn
.btn-primary
.btn-secondary
.btn-danger
.btn-success
.btn-sm
.btn-icon
```

### **Badge Styles**
```css
.badge
.badge-default
.badge-critical
.badge-high
.badge-medium
.badge-low
.badge-info
.badge-success
.badge-warning
```

### **Card Styles**
```css
.card
.card-header
.card-body
.card-footer
.stat-card
.stat-title
.stat-value
.stat-trend
```

### **Table Styles**
```css
.data-table
.data-table th.sortable
.data-table tr.clickable
.data-table .empty-state
```

### **Modal Styles**
```css
.modal-overlay
.modal-overlay.active
.modal
.modal-header
.modal-body
.modal-footer
.close-btn
```

### **Alert Styles**
```css
.alert
.alert-info
.alert-success
.alert-warning
.alert-error
.alert-dismissible
```

---

## 📋 Usage Example

### **Complete Dashboard Page**

```javascript
import {
  createButton,
  createStatCard,
  createTable,
  createModal,
  createAlert,
  createSearchInput,
  createFilterDropdown,
  createPagination
} from './components.js';

// Create stats row
const statsContainer = document.getElementById('stats');
statsContainer.appendChild(createStatCard({
  title: 'Total Errors',
  value: 1234,
  trend: 15
}));
statsContainer.appendChild(createStatCard({
  title: 'Critical',
  value: 45,
  trend: -5
}));

// Create search and filters
const filters = document.getElementById('filters');
filters.appendChild(createSearchInput({
  placeholder: 'Search errors...',
  onSearch: (query) => filterErrors(query)
}));
filters.appendChild(createFilterDropdown({
  options: [
    { label: 'All Severities', value: '', selected: true },
    { label: 'Critical', value: 'critical' },
    { label: 'High', value: 'high' }
  ],
  onChange: (value) => filterBySeverity(value)
}));

// Create errors table
const table = createTable({
  columns: [
    { key: 'severity', header: 'Severity',
      render: (value) => `<span class="badge badge-${value}">${value}</span>` },
    { key: 'message', header: 'Message' },
    { key: 'status', header: 'Status' },
    { key: 'timestamp', header: 'Time' }
  ],
  data: errors,
  onRowClick: (row) => showErrorDetail(row)
});
document.getElementById('table-container').appendChild(table);

// Create pagination
const pagination = createPagination({
  currentPage: 1,
  totalPages: 10,
  onChange: (page) => loadPage(page)
});
document.getElementById('pagination').appendChild(pagination);

// Show alert on success
function showSuccess(message) {
  const alert = createAlert({
    message,
    type: 'success',
    dismissible: true
  });
  document.getElementById('alerts').appendChild(alert);
}

// Show error modal
function showErrorDetail(error) {
  const modal = createModal({
    title: `Error: ${error.id}`,
    content: `<pre>${error.stack}</pre>`,
    footer: [
      { text: 'Resolve', variant: 'success', onClick: () => resolveError(error.id) },
      { text: 'Close', variant: 'secondary', onClick: () => modal.remove() }
    ]
  });
  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('active'), 10);
}
```

---

## 🎯 Best Practices

### **1. Component Reusability**
```javascript
// ✅ Good: Reuse components
const resolveBtn = createButton({ text: 'Resolve', variant: 'success' });
const deleteBtn = createButton({ text: 'Delete', variant: 'danger' });

// ❌ Bad: Creating inline every time
```

### **2. Event Handlers**
```javascript
// ✅ Good: Named functions
function handleClick() { /* ... */ }
const btn = createButton({ text: 'Click', onClick: handleClick });

// ❌ Bad: Anonymous functions in loops
```

### **3. Cleanup**
```javascript
// ✅ Good: Remove modal on close
const modal = createModal({
  onClose: () => modal.remove()
});

// ❌ Bad: Memory leak
const modal = createModal({});
```

### **4. Loading States**
```javascript
// ✅ Good: Show loading, then content
container.appendChild(createSpinner());
fetchData().then(data => {
  container.innerHTML = '';
  container.appendChild(renderData(data));
});

// ❌ Bad: No loading state
```

---

## 🎨 Customization

### **Override Styles**
```css
/* In your custom CSS file */
.btn-primary {
  background: your-color;
}

.card {
  border-radius: your-radius;
}
```

### **Add New Variants**
```css
.btn-custom {
  background: your-gradient;
  color: your-color;
}
```

---

## 📦 File Structure

```
dashboard/public/
├── components.js      # Component functions
├── components.css     # Component styles
├── index.html         # Main dashboard (uses components)
└── styles.css         # Custom overrides
```

---

## 🚀 Benefits

### **Before (Single HTML File):**
- ❌ 1500+ lines of mixed HTML/JS/CSS
- ❌ Hard to maintain
- ❌ No reusability
- ❌ Difficult to test

### **After (Component-Based):**
- ✅ Reusable components
- ✅ Easy to maintain
- ✅ Consistent styling
- ✅ Easy to test
- ✅ Team-friendly

---

## 📞 Need Help?

See examples in:
- `dashboard/public/index.html` - Main dashboard
- `dashboard/public/login.html` - Login page

---

**Happy Component Building! 🎨**
