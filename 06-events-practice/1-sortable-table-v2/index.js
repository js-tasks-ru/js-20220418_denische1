export default class SortableTable {
  static #sortOrderAsc = 'asc';
  static #sortOrderDesc = 'desc';

  #headersConfig;
  #data;
  #element;
  #subElements;
  #isSortLocally;

  constructor(headersConfig, {
    data = [],
    sorted = {},
    isSortLocally = true
  } = {}) {
    this.#headersConfig = headersConfig;
    this.#data = data;
    this.#isSortLocally = isSortLocally;

    this.render();
    this.sort(sorted.id, sorted.order);
  }

  get data() {
    return this.#data;
  }

  get element() {
    return this.#element;
  }

  get subElements() {
    return this.#subElements;
  }

  sort(field, order = SortableTable.#sortOrderAsc) {
    const sortHeader = this.#subElements.header.querySelector(`.sortable-table__cell[data-sortable="true"][data-id="${field}"]`);

    if (sortHeader === null) {
      return;
    }

    const headers = this.#subElements.header.querySelectorAll('.sortable-table__cell[data-sortable="true"][data-id]');

    headers.forEach(header => {
      header.dataset.order = '';
    });

    order = order === SortableTable.#sortOrderAsc ? SortableTable.#sortOrderAsc : SortableTable.#sortOrderDesc;
    sortHeader.dataset.order = order;
    sortHeader.append(this.#subElements.arrow);

    if (this.#isSortLocally) {
      this.sortOnClient(field, order);
    } else {
      this.sortOnServer(field, order);
    }

    this.#subElements.body.innerHTML = this.getTableRows();
  }

  sortOnClient(field, order) {
    const headerConfig = this.#headersConfig.find(headerConfig => headerConfig.id === field);
    const sortDirection = order === SortableTable.#sortOrderAsc ? 1 : -1;

    this.#data.sort((a, b) => {
      let result;

      switch (headerConfig.sortType) {
        case 'date':
          result = Date.parse(a[field]) - Date.parse(b[field]);
          break;
        case 'number':
          result = a[field] - b[field];
          break;
        default:
          result = a[field].localeCompare(b[field], ['ru', 'en'], {caseFirst: 'upper'});
          break;
      }

      return sortDirection * result;
    });
  }

  sortOnServer(field, order) {
    throw new Error("Unsupported operation");
  }

  destroy() {
    this.remove();
  }

  remove() {
    this.element.remove();
  }

  render() {
    this.#element = this.createElement(this.getTableTemplate());

    this.#subElements = Object.fromEntries(Array.from(this.#element.querySelectorAll('[data-element]'))
      .map(dataElement => [dataElement.dataset.element, dataElement]));

    this.#subElements.arrow = this.createElement(this.getSortArrowTemplate());

    this.#subElements.header.addEventListener('pointerdown', event => {
      const sortHeader = event.target.closest('.sortable-table__cell[data-sortable="true"][data-id]');

      if (!sortHeader) {
        return;
      }

      const order = (sortHeader.dataset.order === SortableTable.#sortOrderAsc) ? SortableTable.#sortOrderDesc : SortableTable.#sortOrderAsc;

      this.sort(sortHeader.dataset.id, order);
    });
  }

  getTableTemplate() {
    return `
    <div class="sortable-table">
    <div data-element="header" class="sortable-table__header sortable-table__row">
        ${this.getHeaderCells()}
    </div>
    <div data-element="body" class="sortable-table__body"></div>
    <div data-element="loading" class="loading-line sortable-table__loading-line"></div>
    <div data-element="emptyPlaceholder" class="sortable-table__empty-placeholder">
      <div>
        <p>No products satisfies your filter criteria</p>
        <button type="button" class="button-primary-outline">Reset all filters</button>
      </div>
    </div>
  </div>
    `;
  }

  getHeaderCells() {
    return this.#headersConfig.map(headerConfig => this.getHeaderCell(headerConfig)).join('');
  }

  getHeaderCell(headerConfig) {
    return `
      <div class="sortable-table__cell" data-id="${headerConfig.id}" data-sortable="${headerConfig.sortable}">
        <span>${headerConfig.title}</span>
      </div>
    `;
  }

  getTableRows() {
    return this.#data.map(item => this.getTableRow(item)).join('');
  }

  getTableRow(item) {
    return `
      <a href="/products/${item.id}" class="sortable-table__row">
        ${this.getTableRowCells(item)}
      </a>
    `;
  }

  getTableRowCells(item) {
    return this.#headersConfig
      .map(header => {
        const cellTemplate = header.template || this.getDefaultCellTemplate;
        return cellTemplate(item[header.id]);
      })
      .join('');
  }

  getDefaultCellTemplate(value) {
    return `<div class="sortable-table__cell">${value}</div>`;
  }

  getSortArrowTemplate() {
    return `
    <span data-element="arrow" class="sortable-table__sort-arrow">
      <span class="sort-arrow"></span>
    </span>
    `;
  }

  createElement(html) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    return wrapper.firstElementChild;
  }
}
