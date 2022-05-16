export default class DoubleSlider {
  static #eventName = 'range-select';

  #element;
  #elements;

  #draggingThumb;
  #shiftX;

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

    this.onThumbPointerUp = this.onThumbPointerUp.bind(this);
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
    this.#draggingThumb = event.target;

    let thumbCoords = this.#draggingThumb.getBoundingClientRect();

    if (this.#draggingThumb === this.#elements.thumbLeft) {
      this.#shiftX = thumbCoords.right - event.clientX;
    } else {
      this.#shiftX = thumbCoords.left - event.clientX;
    }

    this.#element.classList.add("range-slider_dragging");

    document.addEventListener("pointermove", this.onThumbPointerMove);
    document.addEventListener("pointerup", this.onThumbPointerUp);
  }


  onThumbPointerUp() {
    this.#element.classList.remove("range-slider_dragging");

    document.removeEventListener("pointermove", this.onThumbPointerMove);
    document.removeEventListener("pointerup", this.onThumbPointerUp);

    this.#element.dispatchEvent(new CustomEvent(DoubleSlider.#eventName, {
      detail: this.getValue(),
      bubbles: true
    }));
  }

  onThumbPointerMove(event) {
    event.preventDefault();
    if (this.#draggingThumb === this.#elements.thumbLeft) {
      let left = (event.clientX - this.#elements.inner.getBoundingClientRect().left + this.#shiftX) / this.#elements.inner.getBoundingClientRect().width * 100;
      const right = parseFloat(this.#elements.thumbRight.style.right);
      left = this.getValidPercentValue(left, right);

      this.#elements.progress.style.left = left + "%";
      this.#draggingThumb.style.left = left + "%";
      this.#elements.from.innerHTML = this.#formatValue(this.getValue().from);
    } else {
      let right = (this.#elements.inner.getBoundingClientRect().right - event.clientX - this.#shiftX) / this.#elements.inner.getBoundingClientRect().width * 100;
      const left = parseFloat(this.#elements.thumbLeft.style.left);
      right = this.getValidPercentValue(right, left);

      this.#draggingThumb.style.right = right + "%";
      this.#elements.progress.style.right = right + "%";
      this.#elements.to.innerHTML = this.#formatValue(this.getValue().to);
    }

    this.#element.dispatchEvent(new CustomEvent(DoubleSlider.#eventName, {
      detail: this.getValue(),
      bubbles: true
    }));
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

  getValue() {
    return {
      from: Math.round(this.#min + .01 * parseFloat(this.#elements.thumbLeft.style.left) * (this.#max - this.#min)),
      to: Math.round(this.#max - .01 * parseFloat(this.#elements.thumbRight.style.right) * (this.#max - this.#min))
    };
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
    document.removeEventListener("pointermove", this.onThumbPointerMove);
    document.removeEventListener("pointerup", this.onThumbPointerUp);
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
