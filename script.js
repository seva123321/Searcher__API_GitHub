const BASE_URL = "https://api.github.com";

export default class SearchField {
  constructor({ url = BASE_URL } = {}) {
    this.url = new URL("/search/repositories", url);
    this.itemsCount = 5;

    this.container = document.querySelector(".container");
    this.searchField = this.container.querySelector(".searchField");
    this.itemsFields = this.container.querySelector(".itemsFields");

    this.element = this.createElement(this.createElementTemplate());

    this.createEventListener();
    this.render();
    this.firstRenderPosts();
  }

  render() {
    this.searchField.append(this.element);
  }

  firstRenderPosts() {
    if (!localStorage.getItem("posts")) return;

    const ItemsAddObj = JSON.parse(localStorage.getItem("posts"));
    let list = "";

    for (const value of Object.values(ItemsAddObj)) {
      const { nameProject, owner, stars } = value;
      list += this.createPost(nameProject, owner, stars);
    }

    this.itemsFields.insertAdjacentHTML("beforeend", list);

    this.itemsFields.addEventListener(
      "pointerdown",
      this.handlePointerDownFields
    );
  }

  createElement(template) {
    const element = document.createElement("div");
    element.innerHTML = template;

    return element.firstElementChild;
  }

  createElementTemplate() {
    return `
            <input type="text" name="input" class="input-search" placeholder="Введите текст..." list="listRepo"/>
           `;
  }

  createDataListTemplate() {
    const option = this.createOption();

    return `
            <div class="datalist" data-element="datalist" id="listRepo" >
               ${option}
            </div>
           `;
  }

  createItemsFieldsTemplate(target) {
    const item = this.data.filter((item) => item.id == target.dataset.id);
    const {
      name: nameProject,
      owner: ownerObj,
      stargazers_count: stars,
    } = item[0];

    const owner = ownerObj.login;

    this.setLocalStorage(nameProject, owner, stars);

    return this.createPost(nameProject, owner, stars);
  }

  createOption() {
    return this.data
      .map((item) => {
        const { name, id } = item;
        return `<option data-element="option" data-id="${id}" class="option" value="${name}">${name}</option>`;
      })
      .join("");
  }

  createPost(nameProject, owner, stars) {
    return `<li class="itemsFields__item">
                <ul class="itemsFields__content">                            
                    <li data-element="nameProject">Name:${nameProject}</li>    
                    <li data-element="owner">Owner:${owner}</li>    
                    <li>Stars:${stars}</li>    
                </ul>                              
                <button>
                    <img data-element="btnDelete" class="btn--delete" src="./del.svg" alt="Удалить" >
                </button>
            </li>`;
  }

  createUrl() {
    this.url.searchParams.set("q", `${this.element.value} in:name`);

    return this.url.href;
  }

  fetchData() {
    fetch(this.createUrl(), {
      headers: {
        "Content-type": "application/vnd.github+json",
      },
    })
      .then((res) => res.json())
      .then((res) => {
        this.data = res.items.slice(0, this.itemsCount);

        if (this.datalist) this.datalist.remove();

        this.searchField.insertAdjacentHTML(
          "beforeend",
          this.createDataListTemplate()
        );

        this.datalist = this.container.querySelector(".datalist");

        this.datalist.addEventListener(
          "pointerdown",
          this.handlePointerDownSelect
        );
      })
      .catch((err) => console.log(err));
  }

  handlePointerDownFields = (e) => {
    const target = e.target;

    if (target.dataset.element === "btnDelete") {
      const item = target.closest(".itemsFields__item");

      const nameProjectElement = item.querySelector(
        '[data-element="nameProject"]'
      );
      const nameProject = nameProjectElement.textContent.split(":")[1];
      const ownerElement = item.querySelector('[data-element="owner"]');
      const owner = ownerElement.textContent.split(":")[1];

      this.deleteItemsLocalStorage(nameProject, owner);

      item.remove();

      if (!this.itemsFields.children.length) {
        this.itemsFields.removeEventListener(
          "pointerdown",
          this.handlePointerDownFields
        );
      }
    }
  };

  handlePointerDownSelect = (e) => {
    const target = e.target;

    if (target.tagName === "OPTION") {
      this.itemsFields.insertAdjacentHTML(
        "beforeend",
        this.createItemsFieldsTemplate(target)
      );

      this.itemsFields.addEventListener(
        "pointerdown",
        this.handlePointerDownFields
      );

      this.clearSearchFields();
    }
  };

  handleInput = () => {
    if (!this.element.value) return;
    this.fetchData();
  };

  createEventListener() {
    this.element.addEventListener(
      "input",
      this.debounce(this.handleInput, 700)
    );
  }
  removeEventListener() {
    this.element.addEventListener(
      "input",
      this.debounce(this.handleInput, 700)
    );
  }

  setLocalStorage(nameProject, owner, stars) {
    let objItem = {
      [`${nameProject}-${owner}`]: {
        nameProject: nameProject,
        owner: owner,
        stars: stars,
      },
    };
    const ItemsAddObj = JSON.parse(localStorage.getItem("posts"));
    if (ItemsAddObj) {
      ItemsAddObj[`${nameProject}-${owner}`] = {
        nameProject: nameProject,
        owner: owner,
        stars: stars,
      };
      objItem = ItemsAddObj;
    }

    localStorage.setItem("posts", JSON.stringify(objItem));
  }

  deleteItemsLocalStorage(nameProject, owner) {
    const ItemsAddObj = JSON.parse(localStorage.getItem("posts"));

    delete ItemsAddObj[`${nameProject}-${owner}`];

    if (!Object.keys(ItemsAddObj).length) {
      localStorage.removeItem("posts");
      return;
    }
    localStorage.setItem("posts", JSON.stringify(ItemsAddObj));
  }

  debounce = (fn, debounceTime) => {
    let isCalled = false;
    let idTimer;

    return function () {
      if (isCalled) {
        clearTimeout(idTimer);
        isCalled = false;
      }

      if (!isCalled) {
        idTimer = setTimeout(() => {
          return fn.apply(this, arguments);
        }, debounceTime);

        isCalled = true;
      }
    };
  };

  clearSearchFields() {
    this.element.value = "";
    this.datalist.innerHTML = "";
    this.datalist.removeEventListener(
      "pointerdown",
      this.handlePointerDownSelect
    );
  }

  remove() {
    this.element.remove();
  }
}
