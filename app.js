document.querySelector("input").addEventListener("change", ChangedSource);
var configs = [];

function ChangedSource() {
  const file = document.querySelector("input").files[0];
  if (file && file.name == "monitors.xml") {
    document.querySelector(".configs").innerHTML = "";
    const fr = new FileReader();
    fr.onload = function () {
      const config = document.createElement("div");
      config.innerHTML = fr.result;
      const monitorConfigs = config.querySelectorAll("configuration");
      if (monitorConfigs.length == 0) return alert("Invalid file, no configs");
      configs = GenerateConfigs(monitorConfigs);
      RenderMonitors();
    };
    fr.readAsText(file);
  }
}

function GenerateConfigs(monitorConfigs) {
  let cfgs = [];
  for (const monitorConfig of monitorConfigs) {
    let monitors = [];
    const dimensions = { x: 0, y: 0 };
    for (const monitor of monitorConfig.querySelectorAll("logicalmonitor")) {
      const scale = +monitor.querySelector("scale").innerText;

      /* Linux does horrific things with rotations */
      const r = monitor.querySelector("transform rotation");
      let rotation;
      switch (r ? r.innerText : "") {
        case "right":
          rotation = 270;
          break;
        case "left":
          rotation = 90;
          break;
        case "upside_down":
          rotation = 180;
          break;
        default:
          rotation = 0;
          break;
      }

      const resolution = {
        width: +monitor.querySelector("width").innerText * scale,
        height: +monitor.querySelector("height").innerText * scale,
      };
      const offset = {
        x: +monitor.querySelector("x").innerText,
        y: +monitor.querySelector("y").innerText,
      };
      monitors.push({
        resolution,
        offset,
        rotation,
      });
      const dimX =
        offset.x +
        (rotation == 90 || rotation == 270
          ? resolution.height
          : resolution.width);
      const dimY =
        offset.y +
        (rotation == 90 || rotation == 270
          ? resolution.width
          : resolution.height);
      if (dimX > dimensions.x) dimensions.x = dimX;
      if (dimY > dimensions.y) dimensions.y = dimY;
    }
    cfgs.push({ monitors, dimensions });
  }
  return cfgs;
}

function RenderMonitors() {
  document.querySelector(".configs").innerHTML = "";
  configs.forEach((config, index) => {
    const el = document.createElement("div");
    for (let i = 0; i < config.monitors.length; i++) {
      const monitorCfg = config.monitors[i];
      const monitor = document.createElement("div");
      const uploadImageInput = document.createElement("input");
      uploadImageInput.type = "file";
      uploadImageInput.accept = "image/png, image/jpeg";
      uploadImageInput.className = `image-file-input config-${index}-${i}`;
      uploadImageInput.addEventListener("change", (e) => {
        e.preventDefault();
        configs[index].monitors[i].file = e.target.files[0];
        RenderMonitors();
      });
      monitor.appendChild(uploadImageInput);
      const uploadImageBtn = document.createElement("button");
      uploadImageBtn.onclick = () => {
        document.querySelector(`.config-${index}-${i}`).click();
      };
      uploadImageBtn.innerText = "Upload Image";
      monitor.appendChild(uploadImageBtn);
      if (monitorCfg.file) {
        const imagePreview = document.createElement("img");
        imagePreview.src = URL.createObjectURL(monitorCfg.file);
        imagePreview.style.width = `${monitorCfg.resolution.width * 0.1 - 2}px`;
        imagePreview.style.height = `${
          monitorCfg.resolution.height * 0.1 - 2
        }px`;
        imagePreview.style.transform = `rotate(${monitorCfg.rotation}deg)`;
        monitor.appendChild(imagePreview);
      }
      monitor.className = "monitor";
      if (monitorCfg.rotation == 90 || monitorCfg.rotation == 270) {
        monitor.style.height = `${monitorCfg.resolution.width * 0.1 - 2}px`;
        monitor.style.width = `${monitorCfg.resolution.height * 0.1 - 2}px`;
      } else {
        monitor.style.width = `${monitorCfg.resolution.width * 0.1 - 2}px`;
        monitor.style.height = `${monitorCfg.resolution.height * 0.1 - 2}px`;
      }
      monitor.style.left = `${monitorCfg.offset.x * 0.1}px`;
      monitor.style.top = `${monitorCfg.offset.y * 0.1}px`;
      el.appendChild(monitor);
    }
    el.style.width = `${config.dimensions.x * 0.1}px`;
    el.style.height = `${config.dimensions.y * 0.1}px`;
    if (
      config.monitors.map((m) => m.file).filter((m) => m).length ==
      config.monitors.length
    ) {
      const genBtn = document.createElement("button");
      genBtn.innerText = "Generate Image";
      genBtn.onclick = () => GenerateImage(config);
      el.appendChild(genBtn);
    }
    document.querySelector(".configs").appendChild(el);
  });
}

function GenerateImage(config) {
  const canvas = document.createElement("canvas");
  canvas.width = `${config.dimensions.x}`;
  canvas.height = `${config.dimensions.y}`;
  const ctx = canvas.getContext("2d");
  for (let i = 0; i < config.monitors.length; i++) {
    const monitor = config.monitors[i];
    const img = new Image();
    img.onload = function () {
      ctx.save();
      const x =
        monitor.offset.x +
        (monitor.resolution.rotation == 90 || monitor.rotation == 270
          ? monitor.resolution.height
          : monitor.resolution.width) *
          0.5;
      const y =
        monitor.offset.y +
        (monitor.resolution.rotation == 90 || monitor.rotation == 270
          ? monitor.resolution.width
          : monitor.resolution.height) *
          0.5;
      ctx.translate(x, y);
      ctx.rotate((monitor.rotation * Math.PI) / 180);
      ctx.drawImage(
        img,
        -monitor.resolution.width * 0.5,
        -monitor.resolution.height * 0.5,
        monitor.resolution.width,
        monitor.resolution.height
      );
      ctx.restore();
    };
    img.src = URL.createObjectURL(monitor.file);
  }
  document.body.appendChild(canvas);
}
