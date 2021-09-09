import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import Routes from "./../../src/routes.js";
import TestUtil from "../_Utils/testUtil";
import UploadHandler from "../../src/uploadHandler.js";
import { logger } from "../../src/logger.js";

describe("#Routes test suite", () => {
  const request = TestUtil.generateReadableStream(["some file bytes"]);
  const response = TestUtil.generateWritableStream(() => {});

  const defaultParams = {
    request: Object.assign(request, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      method: "",
      body: {},
    }),
    response: Object.assign(response, {
      setHeader: jest.fn(),
      writeHead: jest.fn(),
      end: jest.fn(),
    }),
    values: () => Object.values(defaultParams),
  };

  beforeEach(() => {
    jest.spyOn(logger, "info").mockImplementation();
  });

  describe("#setSocketInstance", () => {
    test("setSocket should store io instance", () => {
      const routes = new Routes();
      const ioObject = {
        to: (id) => ioObject,
        emit: (event, message) => {},
      };

      routes.setSocketInstance(ioObject);
      expect(routes.io).toStrictEqual(ioObject);
    });
  });

  describe("#handler", () => {
    test("given an inexistent route it should choose default route", async () => {
      const routes = new Routes();
      const params = {
        ...defaultParams,
      };

      params.request.method = "inexistent";
      await routes.handler(...params.values());
      expect(params.response.end).toHaveBeenCalledWith("Hello, World!");
    });

    test("it should set any request with CORS enabled", async () => {
      const routes = new Routes();
      const params = {
        ...defaultParams,
      };

      params.request.method = "inexistent";
      await routes.handler(...params.values());
      expect(params.response.setHeader).toHaveBeenCalledWith(
        "Access-Control-Allow-Origin",
        "*"
      );
    });

    test("given method OPTIONS it should choose options route", async () => {
      const routes = new Routes();
      const params = {
        ...defaultParams,
      };

      params.request.method = "OPTIONS";
      await routes.handler(...params.values());
      expect(params.response.writeHead).toHaveBeenCalledWith(204);
      expect(params.response.end).toHaveBeenCalled();
    });

    test("given method GET it should choose get route", async () => {
      const routes = new Routes();
      const params = {
        ...defaultParams,
      };

      params.request.method = "GET";
      jest.spyOn(routes, routes.get.name).mockResolvedValue();
      await routes.handler(...params.values());
      expect(routes.get).toHaveBeenCalled();
    });

    test("given method POST it should choose post route", async () => {
      const routes = new Routes();
      const params = {
        ...defaultParams,
      };

      params.request.method = "POST";
      jest.spyOn(routes, routes.post.name).mockResolvedValue();
      await routes.handler(...params.values());
      expect(routes.post).toHaveBeenCalled();
    });
  });

  describe("#get", () => {
    test("given method GET it should list all files downloaded", async () => {
      const routes = new Routes();
      const params = {
        ...defaultParams,
      };
      const mockFileStatus = [
        {
          file: "file.png",
          owner: "Thiago Brito",
          lastModified: "2021-09-07T15:25:08.860Z",
          size: "80.8 kB",
        },
      ];

      jest
        .spyOn(routes.fileHelper, routes.fileHelper.getFileStatus.name)
        .mockResolvedValue(mockFileStatus);

      params.request.method = "GET";
      await routes.handler(...params.values());

      expect(params.response.writeHead).toHaveBeenCalledWith(200);
      expect(params.response.end).toHaveBeenLastCalledWith(
        JSON.stringify(mockFileStatus)
      );
    });
  });

  describe("#post", () => {
    test("it should validate post route workflow", async () => {
      const routes = new Routes();
      const options = {
        ...defaultParams,
      };

      options.request.method = "POST";
      options.request.url = "?socketId=10";

      jest
        .spyOn(
          UploadHandler.prototype,
          UploadHandler.prototype.registerEvents.name
        )
        .mockImplementation((headers, onFinish) => {
          const writableStream = TestUtil.generateWritableStream(() => {});
          writableStream.on("finish", onFinish);

          return writableStream;
        });

      await routes.handler(...options.values());

      expect(UploadHandler.prototype.registerEvents).toHaveBeenCalled();
      expect(options.response.writeHead).toHaveBeenCalledWith(200);

      const expectedResult = JSON.stringify({
        result: "Files uploaded with success!",
      });

      expect(options.response.end).toHaveBeenCalledWith(expectedResult);
    });
  });
});
