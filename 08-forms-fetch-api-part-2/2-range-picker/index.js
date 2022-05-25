export default class RangePicker {
  #from;
  #to;

  #element;
  #subElements;
  #showDate;

  constructor(
    {
      from = new Date(),
      to = new Date()
    } = {}) {
    this.#from = from;
    this.#to = to;
    this.#showDate = from;

    this.render();
  }

  get element() {
    return this.#element;
  }

  render() {
    this.#element = this.createElement(this.getTemplate());
    this.#subElements = Object.fromEntries(Array.from(this.#element.querySelectorAll('[data-element]'))
      .map(dataElement => [dataElement.dataset.element, dataElement]));

    this.renderSelector();

    this.onDocumentClick = this.onDocumentClick.bind(this);
    document.addEventListener('click', this.onDocumentClick);
    this.#subElements.input.addEventListener('click', this.toggle.bind(this));
    this.#subElements.selectorControlLeft.addEventListener('click', this.moveSelector.bind(this, -1));
    this.#subElements.selectorControlRight.addEventListener('click', this.moveSelector.bind(this, 1));
    this.#subElements.selectorCalendars.addEventListener('click', this.onCalendarClick.bind(this));
  }

  toggle() {
    this.#element.classList.toggle('rangepicker_open');
  }

  close() {
    this.#element.classList.remove('rangepicker_open');
  }

  moveSelector(shift) {
    this.#showDate.setMonth(this.#showDate.getMonth() + shift);
    this.renderSelector();
  }

  destroy() {
    document.removeEventListener('click', this.onDocumentClick);
    this.remove();
  }

  remove() {
    this.#element.remove();
  }

  renderSelector() {
    const showDateFrom = new Date(this.#showDate);
    const showDateTo = new Date(this.#showDate);
    showDateTo.setMonth(showDateFrom.getMonth() + 1);

    this.#subElements.selectorCalendars.innerHTML = this.getCalendarTemplate(showDateFrom) + this.getCalendarTemplate(showDateTo);
    this.renderSelection();
  }

  renderSelection() {
    const cells = this.#subElements.selectorCalendars.querySelectorAll('.rangepicker__cell');

    const from = this.#from?.getTime();
    const to = this.#to?.getTime();

    cells.forEach(cell => {
      const cellValue = new Date(cell.dataset.value).getTime();

      cell.classList.remove('rangepicker__selected-from');
      cell.classList.remove('rangepicker__selected-between');
      cell.classList.remove('rangepicker__selected-to');

      if (cellValue === from) {
        cell.classList.add('rangepicker__selected-from');
      } else if (cellValue === to) {
        cell.classList.add('rangepicker__selected-to');
      } else if (from && to && cellValue > from && cellValue < to) {
        cell.classList.add('rangepicker__selected-between');
      }
    });
  }

  onCalendarClick(event) {
    const cell = event.target.closest('.rangepicker__cell');

    if (!cell) {
      return;
    }

    const cellValue = new Date(cell.dataset.value);

    if (this.#from != null && this.#to == null) {
      if (cellValue >= this.#from) {
        this.#to = cellValue;
      } else {
        this.#to = this.#from;
        this.#from = cellValue;
      }

      this.#subElements.from.textContent = this.dateToString(this.dateToString(this.#from));
      this.#subElements.to.textContent = this.dateToString(this.dateToString(this.#to));

      this.close();
      this.dispatchEvent();
    } else {
      this.#from = cellValue;
      this.#to = null;
    }

    this.renderSelection();
  }

  onDocumentClick(event) {
    if (!this.#element.contains(event.target)) {
      this.close();
    }
  }

  dispatchEvent() {
    this.#element.dispatchEvent(
      new CustomEvent('date-select', {
        bubbles: true,
        detail: {
          from: this.#from,
          to: this.#to
        },
      })
    );
  }

  getTemplate() {
    return `
  <div class="rangepicker" >
    <div class="rangepicker__input" data-element="input">
      <span data-element="from">${this.dateToString(this.#from)}</span> -
      <span data-element="to">${this.dateToString(this.#to)}</span>
    </div>
    <div class="rangepicker__selector" data-element="selector">
      <div class="rangepicker__selector-arrow"></div>
      <div class="rangepicker__selector-control-left" data-element="selectorControlLeft"></div>
      <div class="rangepicker__selector-control-right" data-element="selectorControlRight"></div>
      <div class="rangepicker__selector-calendars" data-element="selectorCalendars"></div>
    </div>
  </div>
    `;
  }

  getCalendarTemplate(showDate) {
    const month = showDate.toLocaleString('ru', {month: 'long'});

    return `
    <div class="rangepicker__calendar">
        <div class="rangepicker__month-indicator">
          <time datetime="${month}">${month}</time>
        </div>
        <div class="rangepicker__day-of-week">
          <div>Пн</div>
          <div>Вт</div>
          <div>Ср</div>
          <div>Чт</div>
          <div>Пт</div>
          <div>Сб</div>
          <div>Вс</div>
        </div>
        <div class="rangepicker__date-grid">
            ${this.getCalendarDaysTemplate(showDate)}
        </div>
      </div>
    `;
  }

  getCalendarDaysTemplate(showDate) {
    const date = new Date(showDate.getFullYear(), showDate.getMonth() + 1, 0);
    const daysInMonth = date.getDate();

    date.setDate(1);
    const dayOffset = date.getDay() === 0 ? 7 : date.getDay();

    let html = `<button type="button" class="rangepicker__cell" data-value="${date.toISOString()}" style="--start-from: ${dayOffset}">1</button>`;

    for (let i = 2; i <= daysInMonth; i++) {
      date.setDate(i);
      html += `<button type="button" class="rangepicker__cell" data-value="${date.toISOString()}">${i}</button>`;
    }

    return html;
  }

  dateToString(date) {
    return date?.toLocaleString('ru', {dateStyle: 'short'});
  }

  createElement(html) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    return wrapper.firstElementChild;
  }
}
