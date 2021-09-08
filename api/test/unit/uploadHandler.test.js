import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import { pipeline } from "stream/promises";
import UploadHandler from "../../src/uploadHandler";
import TestUtil from "../_Utils/testUtil";
import fs from "fs";
import { logger } from "../../src/logger";

describe("#UploadHandler test suite", () => {
  const ioObject = {
    to: (id) => ioObject,
    emit: (event, message) => {},
  };

  beforeEach(() => {
    jest.spyOn(logger, "info").mockImplementation();
  });

  describe("#registerEvents", () => {
    test("it should call onFile and onFinish functions on Busboy instance", () => {
      const uploadHandler = new UploadHandler({
        io: ioObject,
        socketId: "01",
        downloadsFolder: "/tmp",
      });

      jest.spyOn(uploadHandler, uploadHandler.onFile.name).mockResolvedValue();

      const headers = {
        "content-type": "multipart/form-data; boundary=",
      };
      const onFinish = jest.fn();

      const busboyInstance = uploadHandler.registerEvents(headers, onFinish);
      const readableStream = TestUtil.generateReadableStream([
        "chunky",
        "of",
        "data",
      ]);

      busboyInstance.emit("file", "fieldname", readableStream, "filename.txt");
      busboyInstance.listeners("finish")[0].call();

      expect(uploadHandler.onFile).toHaveBeenCalled();
      expect(onFinish).toHaveBeenCalled();
    });
  });

  describe("#onFile", () => {
    test("given a stream file it should save it on disk", async () => {
      const chunks = ["hey", "dude"];
      const uploadHandler = new UploadHandler({
        io: ioObject,
        socketId: "01",
        downloadsFolder: "/tmp",
      });
      const onData = jest.fn();

      jest
        .spyOn(fs, fs.createWriteStream.name)
        .mockImplementation(() => TestUtil.generateWritableStream(onData));

      const onTransform = jest.fn();

      jest
        .spyOn(uploadHandler, uploadHandler.handleFileBytes.name)
        .mockImplementation(() =>
          TestUtil.generateTransformStream(onTransform)
        );

      const params = {
        fieldname: "video",
        file: TestUtil.generateReadableStream(chunks),
        filename: "mockFile.mov",
      };
      await uploadHandler.onFile(...Object.values(params));

      expect(onData.mock.calls.join()).toEqual(chunks.join());
      expect(onTransform.mock.calls.join()).toEqual(chunks.join());

      const expectedFilename = `${uploadHandler.downloadsFolder}/${params.filename}`;

      expect(fs.createWriteStream).toHaveBeenCalledWith(expectedFilename);
    });
  });

  describe("#handleFileBytes", () => {
    test("it should call emit function and it is a transform stream", async () => {
      jest.spyOn(ioObject, ioObject.to.name);
      jest.spyOn(ioObject, ioObject.emit.name);

      const uploadHandler = new UploadHandler({
        io: ioObject,
        socketId: "01",
        downloadsFolder: "/tmp",
      });

      const data = ["hello"];
      const source = TestUtil.generateReadableStream(data);
      const onWrite = jest.fn();
      const target = TestUtil.generateWritableStream(onWrite);

      await pipeline(
        source,
        uploadHandler.handleFileBytes("filename.txt"),
        target
      );

      expect(ioObject.to).toHaveBeenCalledTimes(data.length);
      expect(ioObject.emit).toHaveBeenCalledTimes(data.length);
      expect(onWrite).toBeCalledTimes(data.length);
      expect(onWrite.mock.calls.join()).toEqual(data.join());
    });
  });
});
