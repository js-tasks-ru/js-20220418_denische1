class Tooltip {
  static #tooltipShift = 10;
  static #instance;
  #element;

  constructor() {
    if (Tooltip.#instance !== undefined) {
      return Tooltip.#instance;
    }

    this.initTooltip();
    Tooltip.#instance = this;
  }

  get element() {
    return this.#element;
  }

  initialize () {
    document.addEventListener('pointerover', event => this.onPointerOver(event));
    document.addEventListener('pointerout', event => this.onPointerOut(event));
  }

  render(message) {
    this.element.textContent = message;
    document.body.append(this.#element);
  }

  destroy() {
    this.#element.innerText = '';
    this.remove();
  }

  remove() {
    this.#element.remove();
  }

  onPointMove(event) {
    this.move(event.pageX, event.pageY);
  }

  onPointerOver(event) {
    const targetElement = this.getEventTargetElement(event);

    if (targetElement === null) {
      return;
    }

    targetElement.addEventListener('pointermove', event => this.onPointMove(event));
    this.render(targetElement.dataset.tooltip);
  }

  onPointerOut(event) {
    const targetElement = this.getEventTargetElement(event);

    if (targetElement === null) {
      return;
    }

    this.remove();
    targetElement.removeEventListener('pointermove', this.onPointMove.bind(this));
  }

  getEventTargetElement(event) {
    return event.target.closest('[data-tooltip]');
  }

  move(pageX, pageY) {
    this.element.style.left = pageX + Tooltip.#tooltipShift + 'px';
    this.element.style.top = pageY + Tooltip.#tooltipShift + 'px';
  }

  initTooltip() {
    this.#element = document.createElement('div');
    this.#element.className = 'tooltip';
    this.#element.style.position = 'absolute';
    this.#element.style.zIndex = 1000;
  }
}

export default Tooltip;
