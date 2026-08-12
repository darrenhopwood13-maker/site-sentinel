export type SpeechSession = {
  start: () => void;
  stop: () => Promise<string>;
};

export function createSpeechSession(): SpeechSession {
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) throw new Error("Speech recognition is not supported in this browser");

  const recognition = new SR();
  recognition.lang = "en-GB";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  let final = "";
  let resolve: (text: string) => void;
  let reject: (err: Error) => void;

  const done = new Promise<string>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const alt = event.results[i]?.[0];
      if (event.results[i]?.isFinal && alt) {
        final += alt.transcript;
      }
    }
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    reject(new Error(`Speech recognition error: ${event.error}`));
  };

  recognition.onend = () => {
    resolve(final.trim());
  };

  return {
    start: () => recognition.start(),
    stop: () => {
      recognition.stop();
      return done;
    },
  };
}
