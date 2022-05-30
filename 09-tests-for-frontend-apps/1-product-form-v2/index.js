import SortableList from '../2-sortable-list/index.js';
import escapeHtml from './utils/escape-html.js';
import fetchJson, {FetchError} from './utils/fetch-json.js';

const IMGUR_CLIENT_ID = '28aaa2e823b03b1';
const BACKEND_URL = 'https://course-js.javascript.ru';
const PRODUCTS_API_URL = '/api/rest/products';

export default class ProductForm {
  #element;
  #subElements;
  #categories;
  #productId;
  #imageList;

  constructor(productId) {
    this.#productId = productId;
  }

  get productId() {
    return this.#productId;
  }

  get element() {
    return this.#element;
  }

  get subElements() {
    return this.#subElements;
  }

  async render() {
    await this.loadCategories();

    this.#element = this.createElement(this.getTemplate());

    this.#subElements = Object.fromEntries(Array.from(this.#element.querySelectorAll('[data-element]'))
      .map(dataElement => [dataElement.dataset.element, dataElement]));

    this.#imageList = new SortableList();
    this.#subElements.imageListContainer.append(this.#imageList.element);

    await this.loadProduct();

    this.#subElements.productForm.addEventListener('submit', this.#onSubmit);
    this.#subElements.uploadImageButton.addEventListener('click', this.#onUploadImageButtonClick);

    return this.#element;
  }

  uploadImage(image) {
    const formData = new FormData();
    formData.set('image', image);

    return fetchJson('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        Authorization: 'Client-ID ' + IMGUR_CLIENT_ID
      },
      body: formData
    });
  }

  async loadProduct() {
    if (!this.#productId) {
      return;
    }

    const url = new URL(PRODUCTS_API_URL, BACKEND_URL);
    url.searchParams.set('id', this.#productId);
    const product = (await fetchJson(url))[0];

    if (!product) {
      return;
    }

    for (let element of this.#subElements.productForm.elements) {
      element.value = product[element.name];
    }

    this.#imageList.set(...product.images.map(image => this.createElement(this.getImageTemplate(image.url, image.source))));
  }

  async loadCategories() {
    const url = new URL('/api/rest/categories?_sort=weight&_refs=subcategory', BACKEND_URL);
    const categories = await fetchJson(url);

    this.#categories = categories
      .reduce((subcategories, category) => {
        subcategories.push(...category.subcategories
          .map(({id, title}) => ({
            id,
            title: `${category.title} > ${title}`
          })));
        return subcategories;
      }, []);
  }

  async save() {
    this.#subElements.submitButton.disabled = true;

    try {
      await fetchJson(new URL(PRODUCTS_API_URL, BACKEND_URL), {
        method: this.#productId ? 'PATCH' : 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.getProduct())
      });

      this.#element.dispatchEvent(new CustomEvent(this.#productId ? 'product-updated' : 'product-saved'));
    } finally {
      this.#subElements.submitButton.disabled = false;
    }
  }

  destroy() {
    this.remove();
    this.#imageList.destroy();
    this.#element = null;
    this.#subElements = null;
    this.#imageList = null;
  }

  remove() {
    this.#element.remove();
  }

  getProduct() {
    const formData = new FormData(this.#subElements.productForm);

    return {
      id: this.#productId,
      title: formData.get('title'),
      description: formData.get('description'),
      subcategory: formData.get('subcategory'),
      price: parseInt(formData.get('price')),
      discount: parseInt(formData.get('discount')),
      quantity: parseInt(formData.get('quantity')),
      status: parseInt(formData.get('status')),
      images: this.getProductImages(formData)
    };
  }

  getProductImages(formData) {
    return Array.from(formData.entries())
      .filter(([key]) => key === 'url' || key === 'source')
      .reduce((images, value, index, array) => {
        if (index % 2 === 0) {
          images.push(Object.fromEntries(array.slice(index, index + 2)));
        }
        return images;
      }, []);
  }

  #onSubmit = event => {
    event.preventDefault();
    this.save();
  };

  #onUploadImageButtonClick = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.hidden = true;

    fileInput.onchange = async () => {
      this.#subElements.submitButton.disabled = true;
      this.#subElements.uploadImageButton.disabled = true;
      this.#subElements.uploadImageButton.classList.add('is-loading');

      try {
        const [image] = fileInput.files;
        fileInput.remove();
        const uploadedImage = await this.uploadImage(image);

        this.#imageList.append(this.createElement(this.getImageTemplate(uploadedImage.link, image.name)));
      } catch (e) {
        if (e instanceof FetchError) {
          console.error(e);
          alert("Ошибка заугрзки файла");
        } else {
          throw e;
        }
      } finally {
        this.#subElements.uploadImageButton.disabled = false;
        this.#subElements.uploadImageButton.classList.remove('is-loading');
        this.#subElements.submitButton.disabled = false;
      }
    };

    document.body.append(fileInput);
    fileInput.click();
  };

  createElement(html) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    return wrapper.firstElementChild;
  }

  getCategoriesTemplate() {
    return this.#categories
      .map(category => `<option value="${category.id}">${escapeHtml(category.title)}</option>`)
      .join('');
  }

  getImageTemplate(link, fileName) {
    return `
<li class="products-edit__imagelist-item">
  <input type="hidden" name="url" value="${link}">
  <input type="hidden" name="source" value="${fileName}">
  <span>
    <img src="icon-grab.svg" data-grab-handle="" alt="grab">
    <img class="sortable-table__cell-img" alt="${fileName}" src="${link}">
    <span>${fileName}</span>
  </span>
  <button type="button" class="delete-btn">
    <img src="icon-trash.svg" data-delete-handle="" alt="delete">
  </button>
</li>
    `;
  }

  getTemplate() {
    return `
<div class="product-form">
  <form data-element="productForm" class="form-grid">
    <div class="form-group form-group__half_left">
      <fieldset>
        <label class="form-label">Название товара</label>
        <input required="" type="text" name="title" class="form-control" placeholder="Название товара">
      </fieldset>
    </div>
    <div class="form-group form-group__wide">
      <label class="form-label">Описание</label>
      <textarea required="" class="form-control" name="description" data-element="productDescription" placeholder="Описание товара"></textarea>
    </div>
    <div class="form-group form-group__wide" data-element="sortable-list-container">
      <label class="form-label">Фото</label>
      <div data-element="imageListContainer">

      </div>
      <button type="button" data-element="uploadImageButton" name="uploadImage" class="button-primary-outline"><span>Загрузить</span></button>
    </div>
    <div class="form-group form-group__half_left">
      <label class="form-label">Категория</label>
      <select class="form-control" name="subcategory">
        ${this.getCategoriesTemplate()}
      </select>
    </div>
    <div class="form-group form-group__half_left form-group__two-col">
      <fieldset>
        <label class="form-label">Цена ($)</label>
        <input required="" type="number" name="price" class="form-control" placeholder="100">
      </fieldset>
      <fieldset>
        <label class="form-label">Скидка ($)</label>
        <input required="" type="number" name="discount" class="form-control" placeholder="0">
      </fieldset>
    </div>
    <div class="form-group form-group__part-half">
      <label class="form-label">Количество</label>
      <input required="" type="number" class="form-control" name="quantity" placeholder="1">
    </div>
    <div class="form-group form-group__part-half">
      <label class="form-label">Статус</label>
      <select class="form-control" name="status">
        <option value="1">Активен</option>
        <option value="0">Неактивен</option>
      </select>
    </div>
    <div class="form-buttons">
      <button data-element="submitButton" type="submit" name="save" class="button-primary-outline">
        Сохранить товар
      </button>
    </div>
  </form>
</div>
    `;
  }
}
