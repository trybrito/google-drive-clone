import { describe, test, expect, jest } from "@jest/globals";
import fs from "fs";
import FileHelper from "../../src/fileHelper.js";
import Routes from "./../../src/routes.js";

describe("#FileHelper", () => {
  describe("#getFileStatus", () => {
    test("it should return file status in correct form", async () => {
      const mockStatus = {
        dev: 4265606798,
        mode: 33206,
        nlink: 1,
        uid: 0,
        gid: 0,
        rdev: 0,
        blksize: 4096,
        ino: 186899384535883400,
        size: 80800,
        blocks: 160,
        atimeMs: 1631028309942.982,
        mtimeMs: 1607989209117.336,
        ctimeMs: 1628782513806.0625,
        birthtimeMs: 1631028308859.9492,
        atime: "2021-09-07T15:25:09.943Z",
        mtime: "2020-12-14T23:40:09.117Z",
        ctime: "2021-08-12T15:35:13.806Z",
        birthtime: "2021-09-07T15:25:08.860Z",
      };

      const mockUser = process.env.USERNAME;
      const filename = "file.png";

      jest
        .spyOn(fs.promises, fs.promises.readdir.name)
        .mockResolvedValue([filename]);
      jest
        .spyOn(fs.promises, fs.promises.stat.name)
        .mockResolvedValue(mockStatus);

      const result = await FileHelper.getFileStatus("/tmp");
      const expectedResult = [
        {
          file: filename,
          owner: mockUser,
          lastModified: mockStatus.birthtime,
          size: "80.8 kB",
        },
      ];

      expect(fs.promises.stat).toHaveBeenCalledWith(`/tmp/${filename}`);
      expect(result).toMatchObject(expectedResult);
    });
  });
});
