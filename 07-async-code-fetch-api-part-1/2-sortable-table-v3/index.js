import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru';

export default class SortableTable {
  static #sortOrderAsc = 'asc';
  static #sortOrderDesc = 'desc';
  static #onScrollLoadingShift = 100;

  #headersConfig;
  #url;
  #isSortLocally;
  #sorted;

  #data = [];
  #loading = false;
  #pageSize = 20;
  #element;
  #subElements;

  constructor(headersConfig, {
    sorted = {},
    isSortLocally = false,
    url
  } = {}) {
    this.#headersConfig = headersConfig;
    this.#isSortLocally = isSortLocally;
    this.#url = new URL(url, BACKEND_URL);
    this.#sorted = sorted;

    this.onWindowScroll = this.onWindowScroll.bind(this);
    this.onHeaderPointerDown = this.onHeaderPointerDown.bind(this);

    this.render();
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

  async sort(id, order = SortableTable.#sortOrderAsc) {
    const sortHeader = this.#subElements.header.querySelector(`.sortable-table__cell[data-sortable="true"][data-id="${id}"]`);

    if (sortHeader === null) {
      return;
    }

    const headers = this.#subElements.header.querySelectorAll('.sortable-table__cell[data-sortable="true"][data-id]');

    headers.forEach(header => {
      header.dataset.order = '';
    });

    order = order === SortableTable.#sortOrderAsc ? SortableTable.#sortOrderAsc : SortableTable.#sortOrderDesc;
    this.#sorted.id = id;
    this.#sorted.order = order;
    sortHeader.dataset.order = order;
    sortHeader.append(this.#subElements.arrow);

    this.removeRows();

    if (this.#isSortLocally) {
      this.sortOnClient(id, order);
    } else {
      await this.sortOnServer(id, order);
    }
  }

  sortOnClient(id, order) {
    const headerConfig = this.#headersConfig.find(headerConfig => headerConfig.id === id);
    const sortDirection = order === SortableTable.#sortOrderAsc ? 1 : -1;

    this.#data.sort((a, b) => {
      let result;

      switch (headerConfig.sortType) {
        case 'date':
          result = Date.parse(a[id]) - Date.parse(b[id]);
          break;
        case 'number':
          result = a[id] - b[id];
          break;
        default:
          result = a[id].localeCompare(b[id], ['ru', 'en'], {caseFirst: 'upper'});
          break;
      }

      return sortDirection * result;
    });

    this.appendRows(this.#data);
  }

  async sortOnServer(id, order) {
    this.#data = [];
    await this.loadRows(id, order);
  }

  async loadRows(id, order) {
    this.#loading = true;
    this.element.classList.add('sortable-table_loading');

    this.#url.search = new URLSearchParams({
      _sort: id || '',
      _order: order || '',
      _start: this.#data.length,
      _end: this.#data.length + this.#pageSize
    });

    const data = await fetchJson(this.#url);

    this.#data.push(...data);
    this.appendRows(data);
    this.#loading = false;

    if (this.#data.length === 0) {
      this.#element.classList.add('sortable-table_empty');
    }
    else {
      this.#element.classList.remove('sortable-table_empty');
    }

    this.element.classList.remove('sortable-table_loading');
  }

  appendRows(data) {
    this.#subElements.body.insertAdjacentHTML('beforeend', this.getTableRows(data));
  }

  removeRows() {
    this.#subElements.body.innerHTML = '';
  }

  destroy() {
    this.remove();
  }

  remove() {
    this.element.remove();
  }

  async render() {
    this.#element = this.createElement(this.getTableTemplate());

    this.#subElements = Object.fromEntries(Array.from(this.#element.querySelectorAll('[data-element]'))
      .map(dataElement => [dataElement.dataset.element, dataElement]));

    this.#subElements.arrow = this.createElement(this.getSortArrowTemplate());

    await this.loadRows();

    this.#subElements.header.addEventListener('pointerdown', this.onHeaderPointerDown);
    window.addEventListener("scroll", this.onWindowScroll);
  }

  onHeaderPointerDown(event) {
    const sortHeader = event.target.closest('.sortable-table__cell[data-sortable="true"][data-id]');

    if (!sortHeader) {
      return;
    }

    const order = sortHeader.dataset.order === SortableTable.#sortOrderAsc ? SortableTable.#sortOrderDesc : SortableTable.#sortOrderAsc;
    this.sort(sortHeader.dataset.id, order);
  }

  onWindowScroll() {
    if (!this.#loading && this.#subElements.body.getBoundingClientRect().bottom < document.documentElement.clientHeight + SortableTable.#onScrollLoadingShift) {
      this.loadRows(this.#sorted.id, this.#sorted.order);
    }
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

  getTableRows(data) {
    return data.map(item => this.getTableRow(item)).join('');
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

