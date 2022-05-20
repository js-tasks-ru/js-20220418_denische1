import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru';

export default class ColumnChart {
  static #loadingClass = 'column-chart_loading';

  #label;
  #link;
  #value;
  #formatHeading;
  #url;

  #element;
  #subElements;
  #chartHeight = 50;

  constructor(
    {
      label = '',
      link = '',
      value = '',
      formatHeading = value => value,
      url,
      range = {},
    } = {}) {
    this.#label = label;
    this.#link = link;
    this.#formatHeading = formatHeading;
    this.#value = value;
    this.#url = new URL(url, BACKEND_URL);

    this.render();
    this.update(range.from, range.to);
  }

  get element() {
    return this.#element;
  }

  get subElements() {
    return this.#subElements;
  }

  get chartHeight() {
    return this.#chartHeight;
  }

  async update(from, to) {
    this.element.classList.add(ColumnChart.#loadingClass);

    this.#url.search = new URLSearchParams({
      from: from?.toISOString() || '',
      to: to?.toISOString() || ''
    });

    const response = await fetchJson(this.#url);

    const data = Object.values(response);
    this.#subElements.body.innerHTML = this.getColumnsTemplate(data);
    if (data.length) {
      this.element.classList.remove(ColumnChart.#loadingClass);
    }

    return response;
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

    this.#subElements = Object.fromEntries(Array.from(this.#element.querySelectorAll('[data-element]'))
      .map(element => [element.dataset.element, element]));
  }

  getTemplate() {
    return `
    <div class="column-chart" style="--chart-height: ${this.#chartHeight}">
      <div class="column-chart__title">
        ${this.#label}
        ${this.getLinkTemplate()}
      </div>
      <div class="column-chart__container">
        <div data-element="header" class="column-chart__header">${this.#formatHeading(this.#value)}</div>
        <div data-element="body" class="column-chart__chart"></div>
      </div>
    </div>
    `;
  }

  getColumnsTemplate(data) {
    const maxValue = Math.max(...data);
    const scale = this.#chartHeight / maxValue;

    return data
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
