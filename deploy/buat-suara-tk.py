#!/usr/bin/env python3
"""Merekam suara soal TK dengan Piper (suara AI gratis, model id_ID-news_tts-medium).

Pemakaian:
  node deploy/kumpulkan-kalimat-tk.js            # tulis src/kalimat-tk.json
  PIPER_MODEL=/path/id_ID-news_tts-medium.onnx python3 deploy/buat-suara-tk.py

Hasil: kuistes/suara/tk/<hash>.mp3 dan src/suara-tk.json (kalimat -> nama file),
yang dimasukkan ke aplikasi saat build. Kalimat yang sudah ada rekamannya dilewati.
"""
import hashlib, json, os, re, subprocess, sys, tempfile, wave

AKAR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL = os.environ.get("PIPER_MODEL")
if not MODEL or not os.path.exists(MODEL):
    sys.exit("Set PIPER_MODEL ke file id_ID-news_tts-medium.onnx (unduh dari huggingface.co/rhasspy/piper-voices)")

from piper import PiperVoice, SynthesisConfig

# Huruf tunggal dieja cara Indonesia, supaya tidak dibaca berlogat Inggris
EJA = {"a": "a", "b": "be", "c": "ce", "d": "de", "e": "e", "f": "ef", "g": "ge", "h": "ha", "i": "i", "j": "je", "k": "ka", "l": "el", "m": "em",
       "n": "en", "o": "o", "p": "pe", "q": "ki", "r": "er", "s": "es", "t": "te", "u": "u", "v": "fe", "w": "we", "x": "eks", "y": "ye", "z": "zet"}

def untuk_diucapkan(t):
    t = re.sub(r'"([A-Za-z])"', r"\1", t)
    t = re.sub(r"(?<![A-Za-z])([A-Za-z])(?![A-Za-z])", lambda m: EJA[m.group(1).lower()], t)
    return t.strip()

def nama_file(t):
    return hashlib.sha1(t.encode("utf-8")).hexdigest()[:12]

kalimat = json.load(open(os.path.join(AKAR, "src", "kalimat-tk.json"), encoding="utf-8"))
# label pilihan jawaban ikut direkam
kalimat = sorted(set([k for k in kalimat if k.strip()] + ["A.", "B.", "C.", "D."]))
keluar = os.path.join(AKAR, "kuistes", "suara", "tk")
os.makedirs(keluar, exist_ok=True)
suara = PiperVoice.load(MODEL)
cfg = SynthesisConfig(length_scale=1.12, noise_scale=0.6, noise_w_scale=0.8)
peta, baru = {}, 0
for t in kalimat:
    nf = nama_file(t)
    peta[t] = nf
    tujuan = os.path.join(keluar, nf + ".mp3")
    if os.path.exists(tujuan):
        continue
    with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
        with wave.open(tmp.name, "wb") as w:
            suara.synthesize_wav(untuk_diucapkan(t), w, syn_config=cfg)
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", tmp.name, "-ac", "1", "-ar", "22050", "-b:a", "40k",
                        "-af", "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse", tujuan], check=True)
    baru += 1
# buang rekaman yang kalimatnya sudah tidak dipakai
dipakai = set(v + ".mp3" for v in peta.values())
for f in os.listdir(keluar):
    if f.endswith(".mp3") and f not in dipakai:
        os.remove(os.path.join(keluar, f))
json.dump(peta, open(os.path.join(AKAR, "src", "suara-tk.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(f"{len(peta)} kalimat, {baru} rekaman baru")
