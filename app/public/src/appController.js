export default class AppController {
  constructor({ connectionManager, viewManager, dragAndDropManager }) {
    this.connectionManager = connectionManager;
    this.viewManager = viewManager;
    this.dragAndDropManager = dragAndDropManager;
    this.uploadingFiles = new Map();
  }

  async initialize() {
    this.viewManager.configureFileButtonClick();
    this.viewManager.configureModal();
    this.viewManager.configureOnFileChange(this.onFileChange.bind(this));
    this.viewManager.updateStatus(0);

    this.dragAndDropManager.initialize({
      onDropHandler: this.onFileChange.bind(this),
    });
    this.connectionManager.configureEvents({
      onProgress: this.onProgress.bind(this),
    });

    await this.updateCurrentFiles();
  }

  async onProgress({ alreadyProcessed, filename }) {
    const file = this.uploadingFiles.get(filename);
    const alreadyProcessedPercentage = Math.ceil(
      (alreadyProcessed / file.size) * 180
    );
    this.updateProgress(file, alreadyProcessedPercentage);

    if (alreadyProcessedPercentage < 98) {
      return;
    }

    return this.updateCurrentFiles();
  }

  updateProgress(file, percentage) {
    const uploadingFiles = this.uploadingFiles;
    file.percentage = percentage;

    const total = [...uploadingFiles.values()]
      .map(({ percentage }) => percentage ?? 0)
      .reduce((total, current) => total + current, 0);

    this.viewManager.updateStatus(total);
  }

  async onFileChange(files) {
    this.uploadingFiles.clear();
    this.viewManager.openModal();
    this.viewManager.updateStatus(0);

    const requests = [];

    for (const file of files) {
      this.uploadingFiles.set(file.name, file);
      requests.push(this.connectionManager.uploadFile(file));
    }

    await Promise.all(requests);

    this.viewManager.updateStatus(100);
    setTimeout(() => {
      this.viewManager.closeModal();
    }, 1000);

    await this.updateCurrentFiles();
  }

  async updateCurrentFiles() {
    const files = await this.connectionManager.currentFiles();
    this.viewManager.updateCurrentFiles(files);
  }
}
