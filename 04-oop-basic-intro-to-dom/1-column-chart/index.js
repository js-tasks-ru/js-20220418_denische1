export default class ColumnChart {
  static #loadingClass = 'column-chart_loading';
  static #dataElementClass = 'column-chart__chart';

  #data;
  #label;
  #link;
  #value;
  #element;
  #dataElement;
  #chartHeight = 50;

  constructor({
    data = [],
    label = '',
    link = '',
    value = 0,
    formatHeading = value => value
  } = {}) {
    this.#data = data;
    this.#label = label;
    this.#link = link;
    this.#value = formatHeading(value);

    this.render();
  }

  get element() {
    return this.#element;
  }

  get chartHeight() {
    return this.#chartHeight;
  }

  update(data) {
    this.element.classList.add(ColumnChart.#loadingClass);

    this.#data = data;
    this.#dataElement.innerHTML = this.getColumnsTemplate();

    if (this.#data.length) {
      this.element.classList.remove(ColumnChart.#loadingClass);
    }
  }

  destroy() {
    this.remove();
  }

  remove() {
    this.element.remove();
  }

  render() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.getTemplate();
    this.#element = wrapper.firstElementChild;

    if (!this.#data.length) {
      this.#element.classList.add(ColumnChart.#loadingClass);
    }

    this.#dataElement = this.#element.querySelector('.' + ColumnChart.#dataElementClass);
  }

  getTemplate() {
    return `
    <div class="column-chart" style="--chart-height: ${this.#chartHeight}">
      <div class="column-chart__title">
        ${this.#label}
        ${this.getLinkTemplate()}
      </div>
      <div class="column-chart__container">
        <div data-element="header" class="column-chart__header">${this.#value}</div>
        <div data-element="body" class="${ColumnChart.#dataElementClass}">
            ${this.getColumnsTemplate(this.#data)}
        </div>
      </div>
    </div>
    `;
  }

  getColumnsTemplate() {
    const maxValue = Math.max(...this.#data);
    const scale = this.#chartHeight / maxValue;

    return this.#data
      .map(value => this.getColumnTemplate(Math.floor(value * scale), Math.round(value / maxValue * 100)))
      .join('');
  }

  getColumnTemplate(value, tooltip) {
    return `<div style="--value: ${value}" data-tooltip="${tooltip}%"></div>`;
  }

  getLinkTemplate() {
    return this.#link ? `<a href="${this.#link}" class="column-chart__link">View all</a>` : '';
  }
}
