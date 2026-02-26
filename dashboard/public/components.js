/**
 * Debugg UI Components
 * Reusable, maintainable frontend components
 */

// ==================== Base Components ====================

/**
 * Create a styled button
 */
export function createButton(options: ButtonOptions): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = `btn btn-${options.variant || 'primary'}`;
  button.textContent = options.text;
  button.disabled = options.disabled || false;
  
  if (options.onClick) {
    button.addEventListener('click', options.onClick);
  }
  
  if (options.icon) {
    const icon = document.createElement('span');
    icon.className = 'btn-icon';
    icon.textContent = options.icon;
    button.insertBefore(icon, button.firstChild);
  }
  
  return button;
}

export interface ButtonOptions {
  text: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  icon?: string;
  disabled?: boolean;
  onClick?: (event: MouseEvent) => void;
}

/**
 * Create a badge
 */
export function createBadge(text: string, variant: BadgeVariant): HTMLElement {
  const badge = document.createElement('span');
  badge.className = `badge badge-${variant}`;
  badge.textContent = text;
  return badge;
}

export type BadgeVariant = 'default' | 'critical' | 'high' | 'medium' | 'low' | 'info' | 'success' | 'warning';

/**
 * Create a card container
 */
export function createCard(options: CardOptions): HTMLElement {
  const card = document.createElement('div');
  card.className = 'card';
  
  if (options.title) {
    const header = document.createElement('div');
    header.className = 'card-header';
    header.innerHTML = `<h3>${options.title}</h3>`;
    card.appendChild(header);
  }
  
  const body = document.createElement('div');
  body.className = 'card-body';
  
  if (typeof options.content === 'string') {
    body.innerHTML = options.content;
  } else if (options.content) {
    body.appendChild(options.content);
  }
  
  card.appendChild(body);
  
  if (options.footer) {
    const footer = document.createElement('div');
    footer.className = 'card-footer';
    footer.appendChild(options.footer);
    card.appendChild(footer);
  }
  
  return card;
}

export interface CardOptions {
  title?: string;
  content?: string | HTMLElement;
  footer?: HTMLElement;
}

/**
 * Create a stat card
 */
export function createStatCard(options: StatCardOptions): HTMLElement {
  const card = document.createElement('div');
  card.className = 'stat-card';
  
  const title = document.createElement('h3');
  title.className = 'stat-title';
  title.textContent = options.title;
  
  const value = document.createElement('div');
  value.className = 'stat-value';
  value.textContent = options.value.toString();
  
  if (options.trend) {
    const trend = document.createElement('span');
    trend.className = `stat-trend ${options.trend > 0 ? 'trend-up' : 'trend-down'}`;
    trend.textContent = options.trend > 0 ? `↑ ${options.trend}%` : `↓ ${Math.abs(options.trend)}%`;
    value.appendChild(trend);
  }
  
  card.appendChild(title);
  card.appendChild(value);
  
  return card;
}

export interface StatCardOptions {
  title: string;
  value: number | string;
  trend?: number;
}

/**
 * Create a table
 */
export function createTable(options: TableOptions): HTMLTableElement {
  const table = document.createElement('table');
  table.className = 'data-table';
  
  // Header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  
  options.columns.forEach(column => {
    const th = document.createElement('th');
    th.textContent = column.header;
    if (column.sortable) {
      th.className = 'sortable';
      th.addEventListener('click', () => {
        if (options.onSort) {
          options.onSort(column.key);
        }
      });
    }
    headerRow.appendChild(th);
  });
  
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Body
  const tbody = document.createElement('tbody');
  
  if (options.data.length === 0) {
    const emptyRow = document.createElement('tr');
    const emptyCell = document.createElement('td');
    emptyCell.colSpan = options.columns.length;
    emptyCell.className = 'empty-state';
    emptyCell.textContent = options.emptyMessage || 'No data';
    emptyRow.appendChild(emptyCell);
    tbody.appendChild(emptyRow);
  } else {
    options.data.forEach((row, rowIndex) => {
      const tr = document.createElement('tr');
      
      if (options.onRowClick) {
        tr.className = 'clickable';
        tr.addEventListener('click', () => options.onRowClick!(row, rowIndex));
      }
      
      options.columns.forEach(column => {
        const td = document.createElement('td');
        const value = row[column.key];
        
        if (column.render) {
          td.innerHTML = column.render(value, row);
        } else {
          td.textContent = String(value);
        }
        
        tr.appendChild(td);
      });
      
      tbody.appendChild(tr);
    });
  }
  
  table.appendChild(tbody);
  
  return table;
}

export interface TableColumn {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (value: any, row: any) => string;
}

export interface TableOptions {
  columns: TableColumn[];
  data: any[];
  emptyMessage?: string;
  onSort?: (key: string) => void;
  onRowClick?: (row: any, index: number) => void;
}

/**
 * Create a modal
 */
export function createModal(options: ModalOptions): HTMLElement {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  
  // Header
  const header = document.createElement('div');
  header.className = 'modal-header';
  
  const title = document.createElement('h2');
  title.textContent = options.title;
  header.appendChild(title);
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-btn';
  closeBtn.innerHTML = '&times;';
  closeBtn.addEventListener('click', () => {
    if (options.onClose) {
      options.onClose();
    }
  });
  header.appendChild(closeBtn);
  
  modal.appendChild(header);
  
  // Body
  const body = document.createElement('div');
  body.className = 'modal-body';
  
  if (typeof options.content === 'string') {
    body.innerHTML = options.content;
  } else if (options.content) {
    body.appendChild(options.content);
  }
  
  modal.appendChild(body);
  
  // Footer (optional)
  if (options.footer) {
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    options.footer.forEach(button => {
      footer.appendChild(createButton(button));
    });
    modal.appendChild(footer);
  }
  
  overlay.appendChild(modal);
  
  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay && options.onClose) {
      options.onClose();
    }
  });
  
  return overlay;
}

export interface ModalOptions {
  title: string;
  content: string | HTMLElement;
  footer?: ButtonOptions[];
  onClose?: () => void;
}

/**
 * Create a loading spinner
 */
export function createSpinner(size: 'small' | 'medium' | 'large' = 'medium'): HTMLElement {
  const spinner = document.createElement('div');
  spinner.className = `spinner spinner-${size}`;
  return spinner;
}

/**
 * Create an alert/notification
 */
export function createAlert(options: AlertOptions): HTMLElement {
  const alert = document.createElement('div');
  alert.className = `alert alert-${options.type}`;
  
  const message = document.createElement('span');
  message.textContent = options.message;
  alert.appendChild(message);
  
  if (options.dismissible) {
    const closeBtn = document.createElement('button');
    closeBtn.className = 'alert-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => {
      alert.remove();
    });
    alert.appendChild(closeBtn);
  }
  
  return alert;
}

export type AlertType = 'info' | 'success' | 'warning' | 'error';

export interface AlertOptions {
  message: string;
  type: AlertType;
  dismissible?: boolean;
}

/**
 * Create a search input
 */
export function createSearchInput(options: SearchInputOptions): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'search-input';
  input.placeholder = options.placeholder || 'Search...';
  
  if (options.onSearch) {
    let debounceTimer: number;
    
    input.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      
      clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => {
        options.onSearch!(value);
      }, options.debounceMs || 300);
    });
  }
  
  return input;
}

export interface SearchInputOptions {
  placeholder?: string;
  onSearch?: (query: string) => void;
  debounceMs?: number;
}

/**
 * Create a filter dropdown
 */
export function createFilterDropdown(options: FilterDropdownOptions): HTMLSelectElement {
  const select = document.createElement('select');
  select.className = 'filter-dropdown';
  
  options.options.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option.value;
    opt.textContent = option.label;
    if (option.selected) {
      opt.selected = true;
    }
    select.appendChild(opt);
  });
  
  if (options.onChange) {
    select.addEventListener('change', (e) => {
      options.onChange!((e.target as HTMLSelectElement).value);
    });
  }
  
  return select;
}

export interface FilterDropdownOption {
  label: string;
  value: string;
  selected?: boolean;
}

export interface FilterDropdownOptions {
  options: FilterDropdownOption[];
  onChange?: (value: string) => void;
}

/**
 * Create a pagination component
 */
export function createPagination(options: PaginationOptions): HTMLElement {
  const pagination = document.createElement('div');
  pagination.className = 'pagination';
  
  // Previous button
  const prevBtn = createButton({
    text: 'Previous',
    variant: 'secondary',
    disabled: options.currentPage <= 1,
    onClick: () => {
      if (options.currentPage > 1 && options.onChange) {
        options.onChange(options.currentPage - 1);
      }
    },
  });
  pagination.appendChild(prevBtn);
  
  // Page info
  const info = document.createElement('span');
  info.className = 'pagination-info';
  info.textContent = `Page ${options.currentPage} of ${options.totalPages}`;
  pagination.appendChild(info);
  
  // Next button
  const nextBtn = createButton({
    text: 'Next',
    variant: 'secondary',
    disabled: options.currentPage >= options.totalPages,
    onClick: () => {
      if (options.currentPage < options.totalPages && options.onChange) {
        options.onChange(options.currentPage + 1);
      }
    },
  });
  pagination.appendChild(nextBtn);
  
  return pagination;
}

export interface PaginationOptions {
  currentPage: number;
  totalPages: number;
  onChange?: (page: number) => void;
}

// ==================== Export Components ====================

export const Components = {
  createButton,
  createBadge,
  createCard,
  createStatCard,
  createTable,
  createModal,
  createSpinner,
  createAlert,
  createSearchInput,
  createFilterDropdown,
  createPagination,
};
