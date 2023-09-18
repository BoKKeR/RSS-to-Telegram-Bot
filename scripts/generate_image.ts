import fs from "fs";
import { exec } from "child_process";

const MARKDOWN_FOLDER = "src/doc";
const OUTPUT_FOLDER = "img";

const TEMP_FOLDER = "tmp";

const PRESET_NARROW = "narrow";
const PRESET_WIDE = "wide";

fs.readdir(MARKDOWN_FOLDER, (err, files) => {
  files.forEach(async (file) => {
    const INPUT_FILE_PATH = `${MARKDOWN_FOLDER}/${file}`;
    const INPUT_FILE = file.split(".")[0];
    const INPUT_FILE_EXTENSTION = file.split(".")[1];

    const TEMP_FILE_READ = fs
      .readFileSync(INPUT_FILE_PATH)
      .toString()
      .replaceAll("*", "**")
      .replace("vVERSION_PLACEHOLDER", "v2.10")
      .replace("(https://hub.docker.com/r/bokker/rss.to.telegram)", "")
      .replace("(https://www.github.com/BoKKeR/RSS-to-Telegram-Bot)", "")
      .replace("**CHATID_PLACEHOLDER**", "1234");

    const TEMP_FILE = `${TEMP_FOLDER}/${INPUT_FILE}.${INPUT_FILE_EXTENSTION}`;
    fs.writeFileSync(TEMP_FILE, TEMP_FILE_READ);

    renderImage(TEMP_FILE, INPUT_FILE, PRESET_WIDE);
    renderImage(TEMP_FILE, `${INPUT_FILE}_narrow`, PRESET_NARROW);
  });
});

const renderImage = (TEMP_FILE: string, INPUT_FILE: string, PRESET: string) => {
  exec(
    `./node_modules/.bin/carbon-now \
    --headless \
    --config ./carbon-config.json \
    -p ${PRESET} ${TEMP_FILE} \
    -t ${INPUT_FILE} \
    --save-to ${OUTPUT_FOLDER} \
    --skip-display \
    --save-as ${INPUT_FILE}`,
    (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
    }
  );
};
