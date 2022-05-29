import RangePicker from './components/range-picker/src/index.js';
import SortableTable from './components/sortable-table/src/index.js';
import ColumnChart from './components/column-chart/src/index.js';
import header from './bestsellers-header.js';

const BACKEND_URL = 'https://course-js.javascript.ru';

export default class Page {
  #element;
  #subElements;
  #components;

  #onDateSelected = event => this.update(event.detail)

  get element() {
    return this.#element;
  }

  get subElements() {
    return this.#subElements;
  }

  async render() {
    this.#element = this.createElement(this.getTemplate());

    this.#subElements = Object.fromEntries(Array.from(this.#element.querySelectorAll('[data-element]'))
      .map(element => [element.dataset.element, element]));

    this.initComponents();

    Object.keys(this.#components)
      .forEach(component => this.#subElements[component].append(this.#components[component].element));

    this.#components.rangePicker.element.addEventListener('date-select', this.#onDateSelected);

    return this.#element;
  }

  update({from, to}) {
    this.#components.ordersChart.loadData(from, to);
    this.#components.salesChart.loadData(from, to);
    this.#components.customersChart.loadData(from, to);

    this.#components.sortableTable.url = this.getSortableTableUrl(from, to);
    this.#components.sortableTable.sortOnServer(
      this.#components.sortableTable.sorted.id,
      this.#components.sortableTable.sorted.order,
      1,
      1 + this.#components.sortableTable.step
    );
  }

  destroy() {
    this.remove();
    this.#components.rangePicker.element.removeEventListener('date-select', this.#onDateSelected);
    Object.values(this.#components).forEach(component => component.destroy());
    this.#components = null;
    this.#subElements = null;
  }

  remove() {
    this.#element.remove();
  }

  initComponents() {
    const to = new Date();
    let from = new Date(to.getFullYear(), to.getMonth() - 1, to.getDate());

    const rangePicker = new RangePicker({from, to});

    const ordersChart = new ColumnChart({
      label: 'Заказы',
      link: '/sales',
      url: new URL('/api/dashboard/orders', BACKEND_URL),
      range: rangePicker.selected
    });

    const salesChart = new ColumnChart({
      label: 'Продажи',
      url: new URL('/api/dashboard/sales', BACKEND_URL),
      range: rangePicker.selected,
      formatHeading: data => `$${data.toLocaleString()}`
    });

    const customersChart = new ColumnChart({
      label: 'Клиенты',
      url: new URL('/api/dashboard/customers', BACKEND_URL),
      range: rangePicker.selected
    });

    const sortableTable = new SortableTable(header, {
      url: this.getSortableTableUrl(from, to),
    });

    this.#components = {
      rangePicker,
      ordersChart,
      salesChart,
      customersChart,
      sortableTable
    };
  }

  getSortableTableUrl(from, to) {
    const url = new URL('/api/dashboard/bestsellers', BACKEND_URL);
    url.searchParams.set('from', from.toISOString());
    url.searchParams.set('to', to.toISOString());
    return url;
  }

  getTemplate() {
    return `
<div class="dashboard full-height flex-column">
  <div class="content__top-panel">
    <h2 class="page-title">Панель управления</h2>
    <div data-element="rangePicker"></div>
  </div>

  <div class="dashboard__charts">
    <div data-element="ordersChart" class="dashboard__chart_orders"></div>
    <div data-element="salesChart" class="dashboard__chart_sales"></div>
    <div data-element="customersChart" class="dashboard__chart_customers"></div>
  </div>

  <h3 class="block-title">Лидеры продаж</h3>
  <div data-element="sortableTable"></div>
</div>
    `;
  }

  createElement(html) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    return wrapper.firstElementChild;
  }
}
