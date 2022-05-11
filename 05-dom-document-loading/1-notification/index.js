export default class NotificationMessage {
  static #element;
  static #bodyElement;
  static #headerElement;
  static #removeElementTimerId;
  static #elementClass = 'notification';
  static #bodyElementClass = 'notification-header';
  static #headerElementClass = 'notification-body';
  static successType = 'success';
  static errorType = 'error';

  #message;
  #type;
  #duration;

  constructor(message, {type = NotificationMessage.successType, duration = 1000} = {}) {
    if (NotificationMessage.#element === undefined) {
      NotificationMessage.initElement();
    }

    this.#message = message;
    this.#type = type === NotificationMessage.successType ? type : NotificationMessage.errorType;
    this.#duration = duration;

    this.render();
  }

  get element() {
    return NotificationMessage.#element;
  }

  get duration() {
    return this.#duration;
  }

  show(element = document.body) {
    clearTimeout(NotificationMessage.#removeElementTimerId);
    this.render();
    element.append(this.element);
    NotificationMessage.#removeElementTimerId = setTimeout(() => this.remove(), this.#duration);
  }

  destroy() {
    this.remove();
  }

  remove() {
    this.element.remove();
  }

  render () {
    NotificationMessage.#bodyElement.textContent = this.#message;
    NotificationMessage.#headerElement.textContent = this.#type;
    this.element.className = NotificationMessage.#elementClass + ' ' + this.#type;
    this.element.style.cssText = `--value:${this.#duration}ms`;
  }

  static initElement() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = NotificationMessage.getTemplate();
    this.#element = wrapper.firstElementChild;
    this.#headerElement = this.#element.querySelector('.' + this.#headerElementClass);
    this.#bodyElement = this.#element.querySelector('.' + this.#bodyElementClass);
  }

  static getTemplate() {
    return `
    <div class="${this.#elementClass}" style="--value:20s">
      <div class="timer"></div>
      <div class="inner-wrapper">
        <div class="${this.#headerElementClass}"></div>
        <div class="${this.#bodyElementClass}"></div>
      </div>
    </div>
  `;
  }
}
