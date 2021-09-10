import fs from "fs";
import prettyBytes from "pretty-bytes";

export default class FileHelper {
  static async getFileStatus(downloadsFolder) {
    const currentFiles = await fs.promises.readdir(downloadsFolder);
    const statuses = await Promise.all(
      currentFiles.map((file) => fs.promises.stat(`${downloadsFolder}/${file}`))
    );

    const filesStatuses = [];

    for (let fileIndex in currentFiles) {
      const { birthtime, size } = statuses[fileIndex];

      filesStatuses.push({
        file: currentFiles[fileIndex],
        owner: process.env.USERNAME,
        lastModified: birthtime,
        size: prettyBytes(size),
      });
    }

    return filesStatuses;
  }
}
