const fs = require("fs").promises;
import * as path from "path";

const mdLoader = async (filename: string) => {
  const text = await fs.readFile(
    path.join(__dirname, "../doc", filename + ".md"),
    "utf-8"
  );

  return text;
};

export default mdLoader;
