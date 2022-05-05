export default class ColumnChart {
  _element;
  _dataElement;
  _chartHeight = 50;

  get element() {
    return this._element;
  }

  get chartHeight() {
    return this._chartHeight;
  }

  static get loadingClass() {
    return 'column-chart_loading';
  }

  static get dataElementClass() {
    return 'column-chart__chart';
  }

  constructor({
    data = [],
    label = '',
    link = '',
    value = 0,
    formatHeading
  } = {}) {
    this._data = data;
    this._label = label;
    this._link = link;
    this._value = typeof formatHeading === "function" ? formatHeading(value) : value;

    this.render();
  }

  render() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.getTemplate();
    this._element = wrapper.firstElementChild;

    if (!this._data.length) {
      this._element.classList.add(ColumnChart.loadingClass);
    }

    this._dataElement = this._element.querySelector('.' + ColumnChart.dataElementClass);
  }

  update(data) {
    this.element.classList.add(ColumnChart.loadingClass);

    this._data = data;
    this._dataElement.innerHTML = this.getColumnsTemplate();

    if (this._data.length) {
      this.element.classList.remove(ColumnChart.loadingClass);
    }
  }

  destroy() {
    this.remove();
  }

  remove() {
    this.element.remove();
  }

  getTemplate() {
    return `
    <div class="column-chart" style="--chart-height: ${this._chartHeight}">
      <div class="column-chart__title">
        ${this._label}
        <a href="${this._link}" class="column-chart__link">View all</a>
      </div>
      <div class="column-chart__container">
        <div data-element="header" class="column-chart__header">${this._value}</div>
        <div data-element="body" class="${ColumnChart.dataElementClass}">
            ${this.getColumnsTemplate(this._data)}
        </div>
      </div>
    </div>
    `;
  }

  getColumnsTemplate() {
    const maxValue = Math.max(...this._data);
    const scale = this._chartHeight / maxValue;

    return this._data
      .map(value => this.getColumnTemplate(Math.floor(value * scale), Math.round(value / maxValue * 100)))
      .join('');
  }

  getColumnTemplate(value, tooltip) {
    return `<div style="--value: ${value}" data-tooltip="${tooltip}%"></div>`;
  }

}
