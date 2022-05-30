export default class SortableList {
  #element
  #placeHolder;

  constructor({items = []} = {}) {
    this.render(items);
  }

  get element() {
    return this.#element;
  }

  render(items) {
    this.#element = document.createElement('ul');
    this.element.className = 'sortable-list';
    this.append(...items);
    this.#placeHolder = document.createElement('div');
    this.#placeHolder.className = 'sortable-list__placeholder';

    this.#element.addEventListener('pointerdown', this.#onDeleteClick);
    this.#element.addEventListener('pointerdown', this.#onGrabPointerDown);
  }

  append(...items) {
    items.forEach(item => item.classList.add('sortable-list__item'));
    this.#element.append(...items);
  }

  set(...items) {
    this.clear();
    this.append(...items);
  }

  clear() {
    this.#element.innerHTML = '';
  }

  destroy() {
    this.remove();
    this.#element = null;
    this.#placeHolder = null;
  }

  remove() {
    this.#element.remove();
  }

  #onDeleteClick = event => {
    const deleteButton = event.target.closest('[data-delete-handle]');

    if (!deleteButton) {
      return;
    }

    const item = deleteButton.closest('li.sortable-list__item');
    item?.remove();
  }

  #onGrabPointerDown = event => {
    const grab = event.target.closest('[data-grab-handle]');

    if (!grab) {
      return;
    }

    const item = grab.closest('li.sortable-list__item');

    if (!item) {
      return;
    }

    event.preventDefault();

    item.dataset.shiftX = event.clientX - item.getBoundingClientRect().x;
    item.dataset.shiftY = event.clientY - item.getBoundingClientRect().y;

    item.style.width = item.offsetWidth + 'px';
    item.style.height = item.offsetHeight + 'px';
    item.classList.add('sortable-list__item_dragging');
    this.#placeHolder.style.width = item.style.width;
    this.#placeHolder.style.height = item.style.height;

    item.after(this.#placeHolder);
    this.#element.append(item);
    item.style.top = event.pageY - item.dataset.shiftY + 'px';
    item.style.left = event.pageX - item.dataset.shiftX + 'px';

    item.setPointerCapture(event.pointerId);
    item.addEventListener('pointermove', this.#onItemPointerMove);
    item.addEventListener('lostpointercapture', this.#onItemLostPinterCapture);
  }

  #onItemPointerMove = event => {
    event.preventDefault();
    event.target.style.top = event.pageY - event.target.dataset.shiftY + 'px';
    event.target.style.left = event.pageX - event.target.dataset.shiftX + 'px';

    if (event.clientY < this.#element.getBoundingClientRect().top) {
      if (this.#element.firstElementChild !== this.#placeHolder) {
        this.#element.prepend(this.#placeHolder);
      }
    } else if (event.clientY > this.#element.getBoundingClientRect().bottom) {
      if (this.#element.lastElementChild !== this.#placeHolder) {
        this.#element.append(this.#placeHolder);
      }
    } else {
      for (const item of this.#element.children) {
        if (event.target !== item && event.clientY > item.getBoundingClientRect().top && event.clientY < item.getBoundingClientRect().bottom) {
          if (event.clientY < item.getBoundingClientRect().top + item.offsetHeight / 2) {
            item.before(this.#placeHolder);
          } else {
            item.after(this.#placeHolder);
          }
          break;
        }
      }
    }

  }

  #onItemLostPinterCapture = event => {
    this.#placeHolder.after(event.target);
    this.#placeHolder.remove();
    event.target.classList.remove('sortable-list__item_dragging');
    event.target.style.top = '';
    event.target.style.left = '';
    event.target.style.width = '';
    event.target.style.height = '';
    event.target.dataset.shiftX = '';
    event.target.dataset.shiftY = '';

    event.target.removeEventListener('pointermove', this.#onItemPointerMove);
    event.target.removeEventListener('lostpointercapture', this.#onItemLostPinterCapture);
  }
}
