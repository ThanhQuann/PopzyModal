const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);
Pozzy.elements = [];
function Pozzy(options = {}) {
  this.opt = Object.assign(
    {
      destroyOnClose: true,
      footer: false,
      enableScrollLock: true,
      cssClass: [],
      closeMethods: ["button", "overlay", "escape"],
      scrollLockTarget: () => document.body,
    },
    options
  );
  this._footerButtons = [];
  this._handleEscapeKey = this._handleEscapeKey.bind(this);
  this.template = $(`#${this.opt.templateId}`);
  this.content = this.opt.content;
  const { closeMethods } = this.opt;
  this._allowButtonClose = closeMethods.includes("button");
  this._allowBackdropClose = closeMethods.includes("overlay");
  this._allowEscapeClose = closeMethods.includes("escape");
}
Pozzy.prototype.getScrollbarWidth = function () {
  if (this.scrollbarWidth) return this.scrollbarWidth;
  const div = document.createElement("div");
  Object.assign(div.style, {
    overflow: "scroll",
    position: "absolute",
    top: "-9999px",
  });

  document.body.appendChild(div);
  this.scrollbarWidth = div.offsetWidth - div.clientWidth;
  document.body.removeChild(div);

  return this.scrollbarWidth;
};
Pozzy.prototype.setContent = function (content) {
  this.content = content;
};
Pozzy.prototype._build = function () {
  if (!this.content && !this.template) {
    alert("Please pass content creation data or templateID");
    return;
  }
  const contentNode = this.content
    ? document.createElement("div")
    : this.template.content.cloneNode(true);
  if (this.content) {
    contentNode.innerHTML = this.content;
  }
  this._backdrop = document.createElement("div");
  this._backdrop.className = "pozzy-backdrop";
  const container = document.createElement("div");
  container.className = "pozzy-container";
  this.opt.cssClass.forEach((className) => {
    if (typeof className === "string") {
      container.classList.add(className);
    }
  });
  if (this._allowButtonClose) {
    const closeBtn = this.addFooterButton("&times;", "pozzy-close", () =>
      this.close()
    );
    container.append(closeBtn);
  }
  const modalContent = document.createElement("div");
  modalContent.className = "pozzy-content";

  modalContent.append(contentNode);
  container.append(modalContent);

  if (this.opt.footer) {
    this._modalFooter = document.createElement("div");
    this._modalFooter.className = "pozzy-footer";

    if (this._footerContent) {
      this._modalFooter.innerHTML = this._footerContent;
    }
    this._footerButtons.forEach((button) => {
      this._modalFooter.append(button);
    });
    container.append(this._modalFooter);
  }

  this._backdrop.append(container);
  document.body.append(this._backdrop);
};

Pozzy.prototype.addFooterButton = function (title, cssClass, callback) {
  const button = this.createFooterButton(title, cssClass, callback);
  this._footerButtons.push(button);
  if (this._modalFooter) {
    this._footerButtons.forEach((button) => {
      this._modalFooter.append(button);
    });
  }
  return button;
};
Pozzy.prototype._hasScrollbar = function (target) {
  if([document.body,document.documentElement].includes(target)){
    return document.body.scrollHeight > document.body.clientHeight || document.documentElement.scrollHeight > document.documentElement.clientHeight
  }
  return target.scrollHeight > target.clientHeight;
};
Pozzy.prototype.createFooterButton = function (title, cssClass, callback) {
  const button = document.createElement("button");
  button.className = cssClass;
  button.innerHTML = title;
  button.onclick = callback;
  return button;
};
Pozzy.prototype.setFooterContent = function (html) {
  this._footerContent = html;
  if (this._modalFooter) {
    this._modalFooter.innerHTML = html;
  }
};

Pozzy.prototype.open = function () {
  if (!this._backdrop) {
    this._build();
  }
  Pozzy.elements.push(this);
  setTimeout(() => {
    this._backdrop.classList.add("show");
  }, 0);

  if (this.opt.enableScrollLock) {
    const target = this.opt.scrollLockTarget();
    const targetPaddingRight =
      parseInt(getComputedStyle(target).paddingRight) +
      this.getScrollbarWidth();
    if (this._hasScrollbar(target)) {
      target.classList.add("no-scroll");
      target.style.paddingRight = targetPaddingRight + "px";
    }
  }

  if (this._allowBackdropClose) {
    this._backdrop.onclick = (e) => {
      if (e.target === this._backdrop) {
        this.close();
      }
    };
  }
  if (this._allowEscapeClose) {
    document.addEventListener("keydown", this._handleEscapeKey);
  }

  this._onTransitionEnd(() => {
    this.opt.onOpen();
  });

  return this._backdrop;
};

Pozzy.prototype._handleEscapeKey = function (e) {
  const lastModal = Pozzy.elements[Pozzy.elements.length - 1];
  if (e.key === "Escape" && this === lastModal) {
    this.close();
  }
};
Pozzy.prototype._onTransitionEnd = function (callback) {
  this._backdrop.ontransitionend = (e) => {
    if (e.propertyName !== "transform") return;
    if (typeof callback === "function") callback();
  };
};
Pozzy.prototype.close = function (destroy = this.opt.destroyOnClose) {
  Pozzy.elements.pop();
  this._backdrop.classList.remove("show");
  if (this._allowEscapeClose) {
    document.removeEventListener("keydown", this._handleEscapeKey);
  }

  this._onTransitionEnd(() => {
    if (this._backdrop && destroy) {
      this._backdrop.remove();
      this._backdrop = null;
      this._modalFooter = null;
    }

    // Enable scrolling
    if (this.opt.enableScrollLock && !Pozzy.elements.length) {
      const target = this.opt.scrollLockTarget();
      if (this._hasScrollbar(target)) {
        target.classList.remove("no-scroll");
        target.style.paddingRight = "";
      }
    }

    if (typeof this.opt.onClose === "function") this.opt.onClose();
  });
};

Pozzy.prototype.destroy = function () {
  this.close(true);
};