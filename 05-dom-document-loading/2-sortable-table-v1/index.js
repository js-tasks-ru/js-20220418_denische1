export default class SortableTable {
  static #sortOrderAsc = 'asc';
  static #sortOrderDesc = 'desc';

  #headers;
  #rows
  #element;
  #subElements;

  constructor(headerConfig = [], data = []) {
    this.#headers = headerConfig.map(config => new SortableTableHeader(config));
    this.#rows = data.map(value => new SortableTableRow(value, this.#headers));
    this.render();
  }

  get element() {
    return this.#element;
  }

  get subElements() {
    return this.#subElements;
  }

  destroy() {
    this.remove();
  }

  remove() {
    this.element.remove();
  }

  sort(field, order = SortableTable.#sortOrderAsc) {
    let header = this.getHeader(field);

    if (header === undefined || !header.sortable) {
      return;
    }

    order = order === SortableTable.#sortOrderAsc ? SortableTable.#sortOrderAsc : SortableTable.#sortOrderDesc;
    const sortDirection = order === SortableTable.#sortOrderAsc ? 1 : -1;

    header.element.dataset.order = order;
    header.element.append(this.#subElements.arrow);

    this.#rows.sort((aRow, bRow) => aRow.compare(bRow, header) * sortDirection);

    this.refreshBody();
  }

  getHeader(headerId) {
    return this.#headers.find(header => header.id === headerId);
  }

  render() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.getTemplate();
    this.#element = wrapper.firstElementChild;

    this.#subElements = Object.fromEntries(Array.from(this.#element.querySelectorAll('[data-element]'))
      .map(dataElement => [dataElement.dataset.element, dataElement]));
    this.#subElements.header.append(...this.#headers.map(header => header.element));

    wrapper.innerHTML = this.getSortArrowTemplate();
    this.#subElements.arrow = wrapper.firstElementChild;

    this.refreshBody();
  }

  refreshBody() {
    this.#subElements.body.append(...this.#rows.map(row => row.element));
  }

  getTemplate() {
    return `
<div data-element="productsContainer" class="products-list__container">
  <div class="sortable-table">
    <div data-element="header" class="sortable-table__header sortable-table__row"></div>
    <div data-element="body" class="sortable-table__body"></div>
    <div data-element="loading" class="loading-line sortable-table__loading-line"></div>
    <div data-element="emptyPlaceholder" class="sortable-table__empty-placeholder">
      <div>
        <p>No products satisfies your filter criteria</p>
        <button type="button" class="button-primary-outline">Reset all filters</button>
      </div>
    </div>
  </div>
</div>
    `;
  }

  getSortArrowTemplate() {
    return `
    <span data-element="arrow" class="sortable-table__sort-arrow">
      <span class="sort-arrow"></span>
    </span>
    `;
  }
}

class SortableTableHeader {
  id;
  title;
  sortable;
  sortType;
  template;
  #element

  constructor({
                id,
                title,
                sortable = false,
                sortType = 'string',
                template = data => {
                  return `<div class="sortable-table__cell">${data}</div>`;
                }
              } = {}) {
    this.id = id;
    this.title = title;
    this.sortable = sortable;
    this.sortType = sortType;
    this.template = template;

    this.render();
  }

  get element() {
    return this.#element;
  }

  render() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.getTemplate();
    this.#element = wrapper.firstElementChild;
  }

  getTemplate() {
    return `
    <div class="sortable-table__cell" data-id="${this.id}" data-sortable="${this.sortable}">
        <span>${this.title}</span>
    </div>
    `;
  }
}

class SortableTableRow {
  #data;
  #element

  constructor(data = {}, headers = []) {
    this.#data = this.pickDataFields(data, headers);
    this.render(headers);
  }

  get element() {
    return this.#element;
  }

  getColumnValue(header) {
    return this.#data[header.id];
  }

  render(headers) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.getTemplate(headers);
    this.#element = wrapper.firstElementChild;
  }

  getTemplate(headers) {
    return `
      <a href="#" class="sortable-table__row">
        ${this.getCellsTemplate(headers)}
      </a>
    `;
  }

  getCellsTemplate(headers) {
    return headers.reduce((template, header) => template + header.template(this.#data[header.id]), '');
  }

  pickDataFields(data, headers) {
    let fields = headers.map(header => header.id);
    return Object.fromEntries(Object.entries(data)
      .filter(([key]) => fields.includes(key)));
  }

  compare(row, header) {
    const aValue = this.getColumnValue(header);
    const bValue = row.getColumnValue(header);

    switch (header.sortType) {
      case 'date':
        return Date.parse(aValue) - Date.parse(bValue);
      case 'number':
        return aValue - bValue;
      default:
        return aValue.localeCompare(bValue, ['ru', 'en'], {caseFirst: 'upper'});
    }
  }
}

