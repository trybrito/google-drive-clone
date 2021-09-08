import Busboy from "busboy";
import { pipeline } from "stream/promises";
import { logger } from "../src/logger.js";
import fs from "fs";

export default class UploadHandler {
  constructor({ io, socketId, downloadsFolder }) {
    this.io = io;
    this.socketId = socketId;
    this.downloadsFolder = downloadsFolder;
    this.ON_UPLOAD_EVENT = "file-upload";
  }

  handleFileBytes(filename) {
    async function* handleData(source) {
      let alreadyProcessed = 0;

      for await (const chunk of source) {
        yield chunk;

        alreadyProcessed += chunk.length;
        this.io
          .to(this.socketId)
          .emit(this.ON_UPLOAD_EVENT, { alreadyProcessed, filename });
        logger.info(
          `${alreadyProcessed} bytes were processed in [${filename}] file on socket ${this.socketId}`
        );
      }
    }

    return handleData.bind(this);
  }

  async onFile(fieldname, file, filename) {
    const saveTo = `${this.downloadsFolder}/${filename}`;

    await pipeline(
      file,
      this.handleFileBytes.apply(this, [filename]),
      fs.createWriteStream(saveTo)
    );

    logger.info(`File [${filename}] finished`);
  }

  registerEvents(headers, onFinish) {
    const busboy = new Busboy({ headers });

    busboy.on("file", this.onFile.bind(this));
    busboy.on("finish", onFinish);

    return busboy;
  }
}
