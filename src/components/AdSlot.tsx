import { useEffect, useRef } from 'react';
import { adsConfig } from '../config/ads';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdSlotProps {
  slot: keyof typeof adsConfig.slots;
}

const AdSlot = ({ slot }: AdSlotProps) => {
  const { publisherId } = adsConfig;
  const slotId = adsConfig.slots[slot];
  const enabled = Boolean(publisherId && slotId);
  const requested = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    // Load the AdSense script once for the whole page
    if (!document.querySelector('script[data-adsense]')) {
      const script = document.createElement('script');
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
      script.dataset.adsense = 'true';
      document.head.appendChild(script);
    }

    if (!requested.current) {
      requested.current = true;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (error) {
        console.error('AdSense failed to load:', error);
      }
    }
  }, [enabled, publisherId]);

  if (!enabled) return null;

  return (
    <div className="my-6 flex justify-center overflow-hidden">
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client={publisherId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdSlot;
