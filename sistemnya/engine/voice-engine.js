// ============================================================
// Voice engine (Fase 4 slice frontend, kontrak v0.8.1).
// Push-to-Talk: MediaRecorder → /api/ai/transcribe (Groq Whisper) →
// teks. speak() → /api/ai/tts (ElevenLabs; graceful bila 501).
// VAD auto-detect + echo-prevention + auto-speak = sub-slice berikut.
// ============================================================

function _voiceMime() {
  var types = [
    'audio/webm;codecs=opus', 'audio/webm', 'audio/mp4',
    'audio/ogg;codecs=opus', 'audio/ogg',
  ];
  if (typeof MediaRecorder === 'undefined') return '';
  for (var i = 0; i < types.length; i++) {
    if (MediaRecorder.isTypeSupported(types[i])) return types[i];
  }
  return '';
}

function voiceSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia &&
            typeof MediaRecorder !== 'undefined');
}

// Perekam Push-to-Talk: start() lalu stop() → Promise<Blob>.
function AudioCapture() {
  this._mr = null; this._chunks = []; this._stream = null; this.recording = false;
}
AudioCapture.prototype.start = async function () {
  if (this.recording) return;
  this._stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });
  this._chunks = [];
  var mime = _voiceMime();
  this._mr = new MediaRecorder(this._stream, mime ? { mimeType: mime } : undefined);
  var self = this;
  this._mr.ondataavailable = function (e) { if (e.data && e.data.size > 0) self._chunks.push(e.data); };
  this._mr.start(100);
  this.recording = true;
};
AudioCapture.prototype.stop = function () {
  var self = this;
  return new Promise(function (resolve) {
    if (!self.recording || !self._mr) { resolve(null); return; }
    self._mr.onstop = function () {
      var blob = new Blob(self._chunks, { type: self._mr.mimeType || 'audio/webm' });
      if (self._stream) self._stream.getTracks().forEach(function (t) { t.stop(); });
      self.recording = false;
      resolve(blob);
    };
    self._mr.stop();
  });
};

async function _authHeader() {
  var a = window.ApiDataStore && await window.ApiDataStore.loadAuth();
  return a && a.token ? 'Bearer ' + a.token : null;
}

// Audio Blob → transkrip (Bahasa Indonesia, via backend Groq Whisper).
async function transcribeBlob(blob) {
  if (!window.OPHTHA_API_BASE) throw new Error('Backend tak dikonfigurasi');
  var auth = await _authHeader();
  if (!auth) throw new Error('Belum login (token tak ada)');
  var fd = new FormData();
  var ext = (blob.type.indexOf('mp4') !== -1) ? 'mp4' : (blob.type.indexOf('ogg') !== -1 ? 'ogg' : 'webm');
  fd.append('audio', blob, 'speech.' + ext);
  var res = await fetch(window.OPHTHA_API_BASE + '/api/ai/transcribe', {
    method: 'POST', headers: { Authorization: auth }, body: fd,
  });
  var j = null;
  try { j = await res.json(); } catch (e) { j = null; }
  if (!res.ok || (j && j.success === false)) {
    throw new Error((j && j.error) || ('HTTP ' + res.status));
  }
  return (j && j.data && j.data.transcript) || '';
}

// Teks → suara pasien. ElevenLabs; bila 501 (belum dikonfigurasi) →
// resolve diam (tidak mengganggu alur).
async function speak(text) {
  try {
    if (!window.OPHTHA_API_BASE || !text) return false;
    var auth = await _authHeader();
    if (!auth) return false;
    var res = await fetch(window.OPHTHA_API_BASE + '/api/ai/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify({ text: text }),
    });
    if (!res.ok) return false; // 501 (TTS belum dikonfigurasi) → lewati
    var buf = await res.blob();
    var url = URL.createObjectURL(buf);
    var audio = new Audio(url);
    await audio.play();
    audio.onended = function () { URL.revokeObjectURL(url); };
    return true;
  } catch (e) {
    return false;
  }
}

window.OphthaVoice = {
  supported: voiceSupported,
  AudioCapture: AudioCapture,
  transcribeBlob: transcribeBlob,
  speak: speak,
};
