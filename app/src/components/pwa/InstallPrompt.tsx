import { useEffect, useState } from 'react';

type PromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<PromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as PromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!promptEvent || hidden) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 rounded-xl bg-white border shadow-lg p-4 z-50">
      <p className="text-sm mb-3">Установите приложение для быстрого доступа и офлайн-режима.</p>
      <div className="flex gap-2">
        <button
          className="px-3 py-2 rounded bg-rose-500 text-white text-sm"
          onClick={async () => {
            await promptEvent.prompt();
            await promptEvent.userChoice;
            setHidden(true);
          }}
        >
          Install
        </button>
        <button className="px-3 py-2 rounded border text-sm" onClick={() => setHidden(true)}>
          Позже
        </button>
      </div>
    </div>
  );
}
