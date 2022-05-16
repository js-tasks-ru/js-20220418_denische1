export default class DoubleSlider {
  static #eventName = 'range-select';

  #element;
  #elements;

  #min;
  #max;
  #formatValue;
  #selected;

  constructor(
    {
      min = 0,
      max = 100,
      formatValue = value => value,
      selected,
    } = {}) {
    this.#min = min;
    this.#max = max;
    this.#formatValue = formatValue;
    this.#selected = selected || {
      from: min,
      to: max
    };

    this.render();

    this.onThumbLostPointerCapture = this.onThumbLostPointerCapture.bind(this);
    this.onThumbPointerMove = this.onThumbPointerMove.bind(this);
  }

  get element() {
    return this.#element;
  }

  get min() {
    return this.#min;
  }

  get max() {
    return this.#max;
  }

  render() {
    this.#element = this.createElement(this.getTemplate());

    this.#elements = Object.fromEntries(Array.from(this.#element.querySelectorAll('[data-element]'))
      .map(dataElement => [dataElement.dataset.element, dataElement]));

    this.#elements.thumbLeft.addEventListener('pointerdown', event => this.onThumbPointerDown(event));
    this.#elements.thumbRight.addEventListener('pointerdown', event => this.onThumbPointerDown(event));
    this.update();
  }

  onThumbPointerDown(event) {
    event.preventDefault();
    event.target.setPointerCapture(event.pointerId);

    let thumbCoords = event.target.getBoundingClientRect();

    if (event.target === this.#elements.thumbLeft) {
      event.target.dataset.shiftX = thumbCoords.right - event.clientX;
    } else {
      event.target.dataset.shiftX = thumbCoords.left - event.clientX;
    }

    this.#element.classList.add("range-slider_dragging");

    event.target.addEventListener("pointermove", this.onThumbPointerMove);
    event.target.addEventListener("lostpointercapture", this.onThumbLostPointerCapture);
  }

  onThumbLostPointerCapture(event) {
    this.#element.classList.remove("range-slider_dragging");

    event.target.removeEventListener("pointermove", this.onThumbPointerMove);
    event.target.removeEventListener("lostpointercapture", this.onThumbLostPointerCapture);

    this.dispatchEvent();
  }

  onThumbPointerMove(event) {
    event.preventDefault();

    if (event.target === this.#elements.thumbLeft) {
      this.handleThumbLeftMove(event);
    } else {
      this.handleThumbRightMove(event);
    }

    this.dispatchEvent();
  }

  handleThumbLeftMove(event) {
    let left = (event.clientX - this.#elements.inner.getBoundingClientRect().left + parseInt(this.#elements.thumbLeft.dataset.shiftX)) / this.#elements.inner.getBoundingClientRect().width * 100;
    const right = parseFloat(this.#elements.thumbRight.style.right);
    left = this.getValidPercentValue(left, right);

    this.#elements.progress.style.left = left + "%";
    this.#elements.thumbLeft.style.left = left + "%";

    const from = Math.round(this.#min + .01 * parseFloat(this.#elements.thumbLeft.style.left) * (this.#max - this.#min));

    this.#selected.from = from;
    this.#elements.from.innerHTML = this.#formatValue(from);
  }

  handleThumbRightMove(event) {
    let right = (this.#elements.inner.getBoundingClientRect().right - event.clientX - parseInt(this.#elements.thumbRight.dataset.shiftX)) / this.#elements.inner.getBoundingClientRect().width * 100;
    const left = parseFloat(this.#elements.thumbLeft.style.left);
    right = this.getValidPercentValue(right, left);

    this.#elements.thumbRight.style.right = right + "%";
    this.#elements.progress.style.right = right + "%";

    const to = Math.round(this.#max - .01 * parseFloat(this.#elements.thumbRight.style.right) * (this.#max - this.#min));

    this.#selected.to = to;
    this.#elements.to.innerHTML = this.#formatValue(to);
  }

  getValidPercentValue(toValidateValue, secondValue) {
    if (toValidateValue < 0) {
      toValidateValue = 0;
    }

    if (toValidateValue + secondValue > 100) {
      toValidateValue = 100 - secondValue;
    }

    return toValidateValue;
  }

  dispatchEvent() {
    this.#element.dispatchEvent(new CustomEvent(DoubleSlider.#eventName, {
      detail: this.#selected,
      bubbles: true
    }));
  }

  update() {
    const range = this.#max - this.#min;
    this.#elements.progress.style.left = Math.floor((this.#selected.from - this.#min) / range * 100) + "%";
    this.#elements.progress.style.right = Math.floor((this.#max - this.#selected.to) / range * 100) + "%";
    this.#elements.thumbLeft.style.left = this.#elements.progress.style.left;
    this.#elements.thumbRight.style.right = this.#elements.progress.style.right;
    this.#elements.from.innerHTML = this.#formatValue(this.#selected.from);
    this.#elements.to.innerHTML = this.#formatValue(this.#selected.to);
  }

  destroy() {
    this.#element.remove();
    this.#elements.thumbLeft.removeEventListener("pointermove", this.onThumbPointerMove);
    this.#elements.thumbLeft.removeEventListener("lostpointercapture", this.onThumbLostPointerCapture);
    this.#elements.thumbRight.removeEventListener("pointermove", this.onThumbPointerMove);
    this.#elements.thumbRight.removeEventListener("lostpointercapture", this.onThumbLostPointerCapture);
  }

  getTemplate() {
    return `
      <div class="range-slider">
        <span data-element="from">${this.#formatValue(this.#min)}</span>
        <div class="range-slider__inner" data-element="inner">
          <span class="range-slider__progress" data-element="progress"></span>
          <span class="range-slider__thumb-left" data-element="thumbLeft"></span>
          <span class="range-slider__thumb-right" data-element="thumbRight"></span>
        </div>
        <span data-element="to">${this.#formatValue(this.#max)}</span>
      </div>
    `;
  }

  createElement(html) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    return wrapper.firstElementChild;
  }
}
