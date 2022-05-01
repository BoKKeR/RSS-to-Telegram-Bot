const fs = require("fs").promises;
import * as path from "path";

const mdLoader = async (filename: string) => {
  const md = await fs.readFile(
    path.join(__dirname, "../doc", filename + ".md"),
    "utf-8"
  );

  return md;
};

export default mdLoader;
