import {
  describe,
  test,
  expect,
  jest,
  beforeEach,
  beforeAll,
  afterAll,
} from "@jest/globals";
import { logger } from "../../src/logger";
import { tmpdir } from "os";
import { join } from "path";
import FormData from "form-data";
import Routes from "./../../src/routes.js";
import TestUtil from "../_Utils/testUtil";
import fs from "fs";

describe("#Routes Integration Test", () => {
  let defaultDownloadsFolder = "";

  beforeAll(async () => {
    defaultDownloadsFolder = await fs.promises.mkdtemp(
      join(tmpdir(), "downloads-")
    );
  });

  afterAll(async () => {
    await fs.promises.rm(defaultDownloadsFolder, { recursive: true });
  });

  beforeEach(() => {
    jest.spyOn(logger, "info").mockImplementation();
  });

  describe("#getFileStatus", () => {
    const ioObject = {
      to: (id) => ioObject,
      emit: (event, message) => {},
    };

    test("it should upload a file to the folder", async () => {
      const filename = "Tech.jpg";
      const fileStream = fs.createReadStream(
        `./test/integration/mocks/${filename}`
      );
      const response = TestUtil.generateWritableStream(() => {});

      const form = new FormData();
      form.append("photo", fileStream);

      const defaultParams = {
        request: Object.assign(form, {
          headers: form.getHeaders(),
          method: "POST",
          url: "?socketId=10",
        }),
        response: Object.assign(response, {
          setHeader: jest.fn(),
          writeHead: jest.fn(),
          end: jest.fn(),
        }),
        values: () => Object.values(defaultParams),
      };

      const routes = new Routes(defaultDownloadsFolder);
      routes.setSocketInstance(ioObject);

      const directoryStateBefore = await fs.promises.readdir(
        defaultDownloadsFolder
      );

      expect(directoryStateBefore).toEqual([]);

      await routes.handler(...defaultParams.values());

      const directoryStateAfter = await fs.promises.readdir(
        defaultDownloadsFolder
      );

      expect(directoryStateAfter).toEqual([filename]);
      expect(defaultParams.response.writeHead).toHaveBeenCalledWith(200);

      const expectedResult = JSON.stringify({
        result: "Files uploaded with success!",
      });

      expect(defaultParams.response.end).toHaveBeenCalledWith(expectedResult);
    });
  });
});
