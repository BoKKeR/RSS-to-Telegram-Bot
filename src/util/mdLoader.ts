const fs = require("fs").promises;
import * as path from "path";

const mdLoader = async (filename: string) => {
  try {
    const md = await fs.readFile(
      path.join(__dirname, "../doc", filename + ".md"),
      "utf-8"
    );

    return md;
  } catch (error) {
    return "placeholder help";
  }
};

export default mdLoader;
