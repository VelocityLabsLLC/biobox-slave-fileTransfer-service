import axios from "axios";
import cors from "cors";
import { config } from "dotenv";
import express from "express";
import FormData from "form-data";
import { createReadStream, readdir, rmSync } from "fs";
import getmac from "getmac";
import { connect } from "mqtt";
import node_cron from "node-cron";

config();

let mqttClient;
let masterIp;
let alreadySyncing = false;
const macId = getmac();
const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.json({ message: "slave file transfer service working" });
});

const init = async () => {
  try {
    const resp = await axios.get("http://localhost:3000/masterIp");
    masterIp = resp.data;
    console.log("masterIp >>> ", masterIp);
    if (masterIp) {
      connectToMqtt();
    }
  } catch (ex) {
    console.log(ex.message);
    setTimeout(() => {
      init();
    }, 2000);
  }
};

const connectToMqtt = async () => {
  mqttClient = connect(`mqtt://${masterIp}`);
  mqttClient.on("connect", () => {
    console.log("connectd to MQTT");
    initCron();
  });
};

const initCron = () => {
  node_cron.schedule(`*/2 * * * *`, () => {
    if (!alreadySyncing) {
      checkAndUpload();
    }
  });
};

const checkAndUpload = () => {
  const dirPath = `./${process.env.FILE_DIRECTORY}`;
  readdir(`${dirPath}`, async (err, files) => {
    if (err) {
      console.log(err);
      return;
    }
    console.log("files >>> ", files);
    if (files.length > 0) {
      for (const file of files) {
        if (file.indexOf("_processing") === -1) {
          await uploadFile(file);
        }
      }
    }
  });
};

const uploadFile = (file) => {
  alreadySyncing = true;
  return new Promise((resolve) => {
    try {
      const dirPath = `./${process.env.FILE_DIRECTORY}`;
      const filePath = `${dirPath}/${file}`;
      const trialSubjectId = file.split(".")[0];
      const fileToSend = createReadStream(filePath);
      const form = new FormData();
      form.append("file", fileToSend, file);
      const url = `http://${masterIp}:3000/trialDataFile`;
      const headers = form.getHeaders();

      axios.patch(`http://${masterIp}:3000/trialsubject/${trialSubjectId}`, {
        trialDataStatus: "DATA_FILE_TRANSFER_IN_PROGRESS",
      });

      axios
        .post(url, form, {
          headers,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        })
        .then(() => {
          // console.log(res);
          axios.patch(
            `http://${masterIp}:3000/trialsubject/${trialSubjectId}`,
            {
              trialDataStatus: "DATA_FILE_TRANSFERED",
            }
          );

          if (mqttClient) {
            mqttClient.publish(
              `fileTransfered`,
              JSON.stringify({ macAddress: macId, trialSubjectId })
            );
          }

          console.log("removing file >>> ", filePath);
          rmSync(filePath, { force: true });
          alreadySyncing = false;
          resolve(true);
        })
        .catch((err) => {
          console.log("err >>> ", err);
          alreadySyncing = false;
          resolve(true);
        });
    } catch (error) {
      console.log("error >>> ", error);
      alreadySyncing = false;
      resolve(true);
    }
  });
};

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`App listening on port ${port}`);
  init();
});
