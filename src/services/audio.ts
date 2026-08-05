export function speakWord(text: string, rate: number = 0.9): void {
  if (!('speechSynthesis' in window)) {
    console.warn('Web Speech API is not supported in this environment.');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = rate;
  utterance.pitch = 1.0;

  // Try to find a high quality English voice if available
  const voices = window.speechSynthesis.getVoices();
  const enVoice = voices.find(
    v => (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.lang === 'en-US') && v.lang.startsWith('en')
  );

  if (enVoice) {
    utterance.voice = enVoice;
  }

  window.speechSynthesis.speak(utterance);
}
