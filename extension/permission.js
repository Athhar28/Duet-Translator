const status = document.getElementById("status");
async function ask() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(t => t.stop());
    status.textContent = "Microphone allowed. You can close this tab and use the side panel.";
    document.getElementById("allow").hidden = true;
    setTimeout(() => window.close(), 2500);
  } catch (e) {
    status.textContent = "Microphone was blocked. Click the camera/mic icon in the address bar, choose Allow, then press the button again.";
  }
}
document.getElementById("allow").addEventListener("click", ask);
ask();
