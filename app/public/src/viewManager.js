export default class ViewManager {
  constructor() {
    this.tableBody = document.getElementById("tbody");
    this.newFileButton = document.getElementById("new-file");
    this.fileInput = document.getElementById("file-input");
    this.progressModal = document.getElementById("progress-modal");
    this.progressBar = document.getElementById("progress-bar");
    this.output = document.getElementById("output");

    this.formatter = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    this.modalInstance = {};
  }

  configureModal() {
    this.modalInstance = M.Modal.init(this.progressModal, {
      opacity: 0,
      dismissable: false,
      onOpenEnd() {
        this.$overlay[0].remove();
      },
    });
  }

  openModal() {
    this.modalInstance.open();
  }

  closeModal() {
    this.modalInstance.close();
  }

  updateStatus(size) {
    this.output.innerHTML = `Uploading in <b>${Math.floor(size)}%</b>`;
    this.progressBar.value = size;
  }

  configureOnFileChange(onFileChange) {
    this.fileInput.onchange = (event) => onFileChange(event.target.files);
  }

  configureFileButtonClick() {
    this.newFileButton.onclick = () => this.fileInput.click();
  }

  getIcon(file) {
    return file.match(/\.mp4/i)
      ? "movie"
      : file.match(/\.jp|jf|png|ico|svg/i)
      ? "image"
      : "content_copy";
  }

  makeIcon(file) {
    const icon = this.getIcon(file);
    const colors = {
      movie: "red600",
      image: "yellow600",
      content_copy: "",
    };

    return `<i class="material-icons ${colors[icon]} left">${icon}</i>`;
  }

  updateCurrentFiles(files) {
    const template = (item) => `
      <tr>
        <td>
          ${this.makeIcon(item.file)}
          ${item.file}
        </td>
        <td>${item.owner}</td>
        <td>${this.formatter.format(new Date(item.lastModified))}</td>
        <td>${item.size}</td>
      </tr>
    `;
    // <td>27 de agosto de 2021 14:10</td>

    this.tableBody.innerHTML = files.map(template).join("");
  }
}
