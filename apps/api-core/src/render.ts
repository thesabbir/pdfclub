import * as htmlPdf from "html-pdf-chrome";
import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";

const storage = path.join(__dirname, "..", "storage");

const options: htmlPdf.CreateOptions = {
  port: 9222, // port Chrome is listening on
};

export const renderHTML: (content: string) => Promise<{
  fileName: string;
  fileSize: number;
}> = async (content: string) => {
  const fileName = `${uuid()}_${new Date().getTime()}.pdf`;
  const pdf = await htmlPdf.create(content, options);
  const buffer = pdf.toBuffer();
  const fileSize = buffer.length;
  fs.writeFileSync(path.join(storage, fileName), buffer);
  return {
    fileName,
    fileSize,
  };
};
